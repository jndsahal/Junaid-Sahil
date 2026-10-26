"""Kinora single-instance API. Python 3.11+, no external dependencies."""
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs


class Error(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def password_hash(password, salt):
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


def string(body, key, maximum=200, minimum=1):
    value = body.get(key)
    if not isinstance(value, str) or not minimum <= len(value) <= maximum:
        raise Error(400, 'Invalid ' + key)
    return value


SCHEMA = '''
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, token TEXT UNIQUE NOT NULL, created INTEGER NOT NULL, seen INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS pairs(code TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS commands(id TEXT PRIMARY KEY, device_id TEXT REFERENCES devices(id) ON DELETE CASCADE, package TEXT NOT NULL, action TEXT NOT NULL, state TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS policies(device_id TEXT REFERENCES devices(id) ON DELETE CASCADE, package TEXT NOT NULL, blocked INTEGER NOT NULL, PRIMARY KEY(device_id,package));
CREATE TABLE IF NOT EXISTS cameras(id TEXT PRIMARY KEY, device_id TEXT REFERENCES devices(id) ON DELETE CASCADE, lens TEXT NOT NULL, state TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS signals(id INTEGER PRIMARY KEY AUTOINCREMENT, camera_id TEXT REFERENCES cameras(id) ON DELETE CASCADE, sender TEXT NOT NULL, kind TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
'''


class API:
    def __init__(self, path):
        self.path = path
        with self.connection() as db:
            db.executescript(SCHEMA)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=15)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def rate(self, key, maximum, period):
        # Separate transaction: failed authentication and pairing attempts count too.
        now = int(time.time())
        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('DELETE FROM limits WHERE expires <= ?', (now,))
            row = db.execute('SELECT count FROM limits WHERE key=?', (key,)).fetchone()
            if row and row['count'] >= maximum:
                raise Error(429, 'Too many requests; retry later')
            db.execute('INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1', (key, now+period))

    def handle(self, method, path, body=None, token='', ip='local'):
        body = {} if body is None else body
        if not isinstance(body, dict):
            raise Error(400, 'JSON object required')
        parsed = urlsplit(path)
        parts = parsed.path.strip('/').split('/')
        now = int(time.time())
        if method == 'GET' and parts == ['health']:
            return 200, {'status': 'ok', 'service': 'kinora'}
        self.rate('ip:'+ip, 600, 60)
        if method == 'POST' and parts in [['auth', 'register'], ['auth', 'login']]:
            self.rate('auth:'+ip, 15, 300)
            email = string(body, 'email', 254).strip().lower()
            if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
                raise Error(400, 'Invalid email')
            password = string(body, 'password', 128, 12)
            self.rate('account:'+digest(email), 20, 300)
            with self.connection() as db:
                if parts[1] == 'register':
                    salt, uid = secrets.token_hex(16), secrets.token_hex(16)
                    hashed = password_hash(password, salt)
                    try:
                        db.execute('INSERT INTO users VALUES(?,?,?,?)', (uid,email,salt,hashed))
                    except sqlite3.IntegrityError:
                        raise Error(409, 'Account cannot be registered')
                else:
                    row = db.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
                    salt = row['salt'] if row else '00'*16
                    hashed = password_hash(password, salt)
                    if not row or not hmac.compare_digest(hashed, row['password']):
                        raise Error(401, 'Invalid credentials')
                    uid = row['id']
                access = secrets.token_urlsafe(32)
                db.execute('INSERT INTO sessions VALUES(?,?,?)', (digest(access),uid,now+86400))
                return 201 if parts[1] == 'register' else 200, {'token':access,'expires_at':now+86400}

        if method == 'POST' and parts == ['pairing', 'claim']:
            self.rate('pair:'+ip, 10, 300)
            code = string(body, 'code', 32).replace('-', '').upper()
            name = string(body, 'name', 60).strip()
            if not name or body.get('approved_on_device') is not True:
                raise Error(400, 'Device confirmation and name required')
            with self.connection() as db:
                db.execute('BEGIN IMMEDIATE')
                pair = db.execute('SELECT * FROM pairs WHERE code=? AND expires>?', (digest(code),now)).fetchone()
                if not pair:
                    raise Error(400, 'Invalid or expired pairing code')
                did, access = secrets.token_hex(16), secrets.token_urlsafe(32)
                db.execute('INSERT INTO devices(id,user_id,name,token,created) VALUES(?,?,?,?,?)', (did,pair['user_id'],name,digest(access),now))
                db.execute('DELETE FROM pairs WHERE code=?', (digest(code),))
                return 201, {'device_id':did,'device_token':access}

        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            # Expire camera sessions and immediately discard their signaling data.
            db.execute("UPDATE cameras SET state='expired' WHERE expires<=? AND state IN ('pending','active')", (now,))
            db.execute("DELETE FROM signals WHERE camera_id IN (SELECT id FROM cameras WHERE state NOT IN ('pending','active'))")
            db.execute('DELETE FROM cameras WHERE expires<?', (now-86400,))
            db.execute('DELETE FROM commands WHERE expires<?', (now-86400,))
            db.execute('DELETE FROM pairs WHERE expires<=?', (now,))
            db.execute('DELETE FROM sessions WHERE expires<=?', (now,))
            user = db.execute('SELECT user_id FROM sessions WHERE token=? AND expires>?', (digest(token),now)).fetchone() if token else None
            device = db.execute('SELECT * FROM devices WHERE token=?', (digest(token),)).fetchone() if token else None
            if not user and not device:
                raise Error(401, 'Authentication required')
            role = 'parent' if user else 'device'
            uid = user['user_id'] if user else device['user_id']
            if device:
                db.execute('UPDATE devices SET seen=? WHERE id=?', (now,device['id']))

            def parent():
                if role != 'parent':
                    raise Error(403, 'Parent account required')

            def owned(did):
                row = db.execute('SELECT * FROM devices WHERE id=? AND user_id=?', (did,uid)).fetchone()
                if not row or (device and device['id'] != did):
                    raise Error(404, 'Device not found')
                return row

            if method == 'POST' and parts == ['auth','logout']:
                parent()
                db.execute('DELETE FROM sessions WHERE token=?', (digest(token),))
                return 200, {'logged_out':True}
            if method == 'DELETE' and parts == ['account']:
                parent()
                db.execute('DELETE FROM users WHERE id=?', (uid,))
                return 200, {'deleted':True}
            if method == 'POST' and parts == ['pairing']:
                parent()
                code = secrets.token_hex(6).upper()
                db.execute('DELETE FROM pairs WHERE user_id=?', (uid,))
                db.execute('INSERT INTO pairs VALUES(?,?,?)', (digest(code),uid,now+300))
                return 201, {'code':code,'expires_at':now+300}
            if method == 'GET' and parts == ['devices']:
                parent()
                rows = db.execute('SELECT id,name,created,seen FROM devices WHERE user_id=?', (uid,)).fetchall()
                return 200, {'devices':[dict(r) for r in rows]}
            if len(parts) >= 2 and parts[0] == 'devices':
                did = parts[1]
                owned(did)
                if len(parts) == 2 and method == 'DELETE':
                    # Both parent and child can revoke this device.
                    db.execute('DELETE FROM devices WHERE id=?', (did,))
                    return 200, {'unpaired':True}
                if parts[2:] == ['policy'] and method == 'GET':
                    rows = db.execute('SELECT package,blocked FROM policies WHERE device_id=?', (did,)).fetchall()
                    return 200, {'apps':[dict(r) for r in rows]}
                if parts[2:] == ['commands'] and method == 'POST':
                    parent()
                    package = string(body, 'package', 200)
                    action = string(body, 'action', 10)
                    if not re.fullmatch(r'[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+', package) or action not in ('block','unblock'):
                        raise Error(400, 'Invalid package or action')
                    if package in {'app.kinora.family','com.android.settings','com.android.systemui','com.android.phone','com.android.dialer'}:
                        raise Error(400, 'Protected app')
                    cid = secrets.token_hex(16)
                    db.execute("UPDATE commands SET state='superseded' WHERE device_id=? AND package=? AND state='pending'", (did,package))
                    db.execute('INSERT INTO policies VALUES(?,?,?) ON CONFLICT(device_id,package) DO UPDATE SET blocked=excluded.blocked', (did,package,int(action=='block')))
                    db.execute("INSERT INTO commands(id,device_id,package,action,state,created,expires) VALUES(?,?,?,?,'pending',?,?)", (cid,did,package,action,now,now+86400))
                    return 201, {'id':cid,'state':'pending','enforced':False}
                if parts[2:] == ['commands'] and method == 'GET':
                    db.execute("UPDATE commands SET state='expired' WHERE expires<=? AND state='pending'", (now,))
                    rows = db.execute('SELECT id,package,action,state,detail,created,expires FROM commands WHERE device_id=? ORDER BY created,id', (did,)).fetchall()
                    return 200, {'commands':[dict(r) for r in rows]}
                if len(parts) == 5 and parts[2] == 'commands' and parts[4] == 'ack' and method == 'POST':
                    if role != 'device':
                        raise Error(403, 'Device acknowledgment required')
                    state = string(body, 'state', 20)
                    detail = body.get('detail','')
                    if state not in ('applied','failed','unsupported') or not isinstance(detail,str) or len(detail)>300:
                        raise Error(400, 'Invalid acknowledgment')
                    row = db.execute('SELECT * FROM commands WHERE id=? AND device_id=?', (parts[3],did)).fetchone()
                    if not row:
                        raise Error(404, 'Command not found')
                    if row['state'] == state:
                        return 200, {'state':state}
                    if row['state'] != 'pending' or row['expires']<=now:
                        raise Error(409, 'Command is no longer pending')
                    db.execute('UPDATE commands SET state=?,detail=? WHERE id=?', (state,detail,parts[3]))
                    return 200, {'state':state}
                if parts[2:] == ['camera'] and method == 'POST':
                    parent()
                    lens = string(body,'lens',5)
                    if lens not in ('front','back'):
                        raise Error(400, 'Lens must be front or back')
                    existing = db.execute("SELECT id FROM cameras WHERE device_id=? AND state IN ('pending','active')", (did,)).fetchone()
                    if existing:
                        raise Error(409, 'A camera request is already open')
                    cid = secrets.token_hex(16)
                    db.execute("INSERT INTO cameras VALUES(?,?,?,'pending',?,?)", (cid,did,lens,now,now+60))
                    return 201, {'id':cid,'state':'pending','expires_at':now+60}
                if parts[2:] == ['camera'] and method == 'GET':
                    rows = db.execute('SELECT * FROM cameras WHERE device_id=? ORDER BY created DESC LIMIT 20', (did,)).fetchall()
                    return 200, {'sessions':[dict(r) for r in rows]}

            if len(parts)>=2 and parts[0]=='camera':
                cid=parts[1]
                camera=db.execute('SELECT * FROM cameras WHERE id=?',(cid,)).fetchone()
                if not camera:
                    raise Error(404,'Camera session not found')
                owned(camera['device_id'])
                if len(parts)==2 and method=='GET':
                    return 200, dict(camera)
                if parts[2:]==['decision'] and method=='POST':
                    if role!='device':
                        raise Error(403,'Child-device approval required')
                    if camera['state']!='pending':
                        raise Error(409,'Request is not pending')
                    approved=body.get('approved')
                    if type(approved) is not bool:
                        raise Error(400,'Boolean approved required')
                    state='active' if approved else 'denied'
                    expiry=now+300 if approved else now
                    db.execute('UPDATE cameras SET state=?,expires=? WHERE id=?',(state,expiry,cid))
                    return 200, {'state':state,'expires_at':expiry}
                if parts[2:]==['stop'] and method=='POST':
                    db.execute("UPDATE cameras SET state='stopped',expires=? WHERE id=?",(now,cid))
                    db.execute('DELETE FROM signals WHERE camera_id=?',(cid,))
                    return 200, {'state':'stopped'}
                if parts[2:]==['signals']:
                    if camera['state']!='active':
                        raise Error(409,'Camera session is not active')
                    if method=='POST':
                        kind=string(body,'kind',12)
                        payload=string(body,'payload',32000)
                        if kind not in ('offer','answer','ice') or (kind=='offer' and role!='device') or (kind=='answer' and role!='parent'):
                            raise Error(400,'Invalid signaling direction or kind')
                        count=db.execute('SELECT count(*) FROM signals WHERE camera_id=?',(cid,)).fetchone()[0]
                        if count>=200:
                            raise Error(429,'Session signal limit exceeded')
                        if kind!='ice' and db.execute('SELECT 1 FROM signals WHERE camera_id=? AND kind=?',(cid,kind)).fetchone():
                            raise Error(409,'SDP already submitted; start a new session to renegotiate')
                        cur=db.execute('INSERT INTO signals(camera_id,sender,kind,payload) VALUES(?,?,?,?)',(cid,role,kind,payload))
                        return 201, {'id':cur.lastrowid}
                    if method=='GET':
                        try:
                            after=int(parse_qs(parsed.query).get('after',['0'])[0])
                            if after<0: raise ValueError()
                        except ValueError:
                            raise Error(400,'Invalid cursor')
                        rows=db.execute('SELECT id,kind,payload FROM signals WHERE camera_id=? AND sender!=? AND id>? ORDER BY id LIMIT 100',(cid,role,after)).fetchall()
                        return 200, {'signals':[dict(r) for r in rows]}
            raise Error(404,'Endpoint not found')


class Handler(BaseHTTPRequestHandler):
    server_version = 'Kinora'
    def log_message(self, format, *args):
        # Never log bearer tokens, payloads, SDP, passwords or pairing codes.
        pass

    def dispatch(self):
        try:
            if self.headers.get('Transfer-Encoding'):
                raise Error(400,'Transfer encoding not supported')
            try:
                length=int(self.headers.get('Content-Length','0'))
            except ValueError:
                raise Error(400,'Invalid content length')
            if not 0<=length<=40000:
                raise Error(413,'Request too large')
            if length and self.headers.get_content_type()!='application/json':
                raise Error(415,'Use application/json')
            try:
                body=json.loads(self.rfile.read(length)) if length else {}
            except (ValueError,UnicodeError):
                raise Error(400,'Invalid JSON')
            auth=self.headers.get('Authorization','')
            token=auth[7:] if auth.startswith('Bearer ') else ''
            status,result=self.server.api.handle(self.command,self.path,body,token,self.client_address[0])
        except Error as exc:
            status,result=exc.status,{'error':exc.message}
        except Exception:
            status,result=500,{'error':'Internal error'}
        data=json.dumps(result).encode()
        self.send_response(status)
        self.send_header('Content-Type','application/json')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    do_GET=dispatch
    do_POST=dispatch
    do_DELETE=dispatch

    def setup(self):
        super().setup()
        self.connection.settimeout(15)


def make_server(path, host='127.0.0.1', port=8080):
    server=ThreadingHTTPServer((host,port),Handler)
    server.api=API(path)
    return server


if __name__=='__main__':
    os.umask(0o077)
    path=os.environ.get('KINORA_DB','kinora.sqlite3')
    server=make_server(path,os.environ.get('KINORA_HOST','127.0.0.1'),int(os.environ.get('KINORA_PORT','8080')))
    print('Kinora API listening on',server.server_address,flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
