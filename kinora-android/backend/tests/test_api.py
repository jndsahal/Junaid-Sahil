import concurrent.futures
import json
import os
import tempfile
import threading
import time
import unittest
import urllib.request
import urllib.error
from server import API, Error, digest, make_server


class APITest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.path=os.path.join(self.tmp.name,'test.db')
        self.api=API(self.path)
        self.parent=self.call('POST','/auth/register',{'email':'parent@example.com','password':'correct horse battery'})['token']
        self.other=self.call('POST','/auth/register',{'email':'other@example.com','password':'another strong password'})['token']
        pair=self.call('POST','/pairing',token=self.parent)
        self.code=pair['code']
        child=self.call('POST','/pairing/claim',{'code':self.code,'name':'Test phone','approved_on_device':True})
        self.did,self.child=child['device_id'],child['device_token']

    def tearDown(self): self.tmp.cleanup()
    def call(self,method,path,body=None,token='',ip='local'):
        return self.api.handle(method,path,body,token,ip)[1]
    def fails(self,status,method,path,body=None,token=''):
        with self.assertRaises(Error) as result:
            self.call(method,path,body,token)
        self.assertEqual(result.exception.status,status)
    def camera(self):
        return self.call('POST',f'/devices/{self.did}/camera',{'lens':'front'},self.parent)['id']

    def test_auth_and_logout(self):
        self.fails(401,'POST','/auth/login',{'email':'parent@example.com','password':'wrong password long'})
        login=self.call('POST','/auth/login',{'email':'PARENT@example.com','password':'correct horse battery'})
        self.assertEqual(len(self.call('GET','/devices',token=login['token'])['devices']),1)
        self.call('POST','/auth/logout',token=login['token'])
        self.fails(401,'GET','/devices',token=login['token'])
        self.fails(403,'GET','/devices',token=self.child)

    def test_pair_single_use_and_consent(self):
        self.fails(400,'POST','/pairing/claim',{'code':self.code,'name':'Replay','approved_on_device':True})
        pair=self.call('POST','/pairing',token=self.parent)
        self.fails(400,'POST','/pairing/claim',{'code':pair['code'],'name':'No approval'})
        with self.api.connection() as db:
            db.execute('UPDATE pairs SET expires=0')
        self.fails(400,'POST','/pairing/claim',{'code':pair['code'],'name':'Expired','approved_on_device':True})

    def test_pair_atomic_under_race(self):
        code=self.call('POST','/pairing',token=self.parent)['code']
        def claim(i):
            try:
                self.call('POST','/pairing/claim',{'code':code,'name':'Race','approved_on_device':True},ip=str(i))
                return True
            except Error:
                return False
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            self.assertEqual(sum(pool.map(claim,range(4))),1)

    def test_family_and_device_isolation(self):
        self.fails(404,'GET',f'/devices/{self.did}/commands',token=self.other)
        self.fails(404,'DELETE',f'/devices/{self.did}',token=self.other)
        pair=self.call('POST','/pairing',token=self.parent)
        sibling=self.call('POST','/pairing/claim',{'code':pair['code'],'name':'Sibling','approved_on_device':True})
        self.fails(404,'GET',f'/devices/{self.did}/policy',token=sibling['device_token'])
        cid=self.camera()
        self.fails(404,'GET',f'/camera/{cid}',token=self.other)

    def test_command_lifecycle(self):
        route=f'/devices/{self.did}/commands'
        cmd=self.call('POST',route,{'package':'com.example.game','action':'block'},self.parent)
        self.assertFalse(cmd['enforced'])
        self.assertEqual(self.call('GET',route,token=self.child)['commands'][0]['state'],'pending')
        ack=route+'/'+cmd['id']+'/ack'
        self.fails(403,'POST',ack,{'state':'applied'},self.parent)
        self.call('POST',ack,{'state':'unsupported','detail':'Device owner enrollment required'},self.child)
        self.assertEqual(self.call('GET',route,token=self.parent)['commands'][0]['state'],'unsupported')
        self.call('POST',ack,{'state':'unsupported'},self.child)
        self.fails(409,'POST',ack,{'state':'applied'},self.child)
        self.fails(400,'POST',route,{'package':'com.android.phone','action':'block'},self.parent)
        self.fails(403,'POST',route,{'package':'com.example.game','action':'block'},self.child)

    def test_new_policy_supersedes_old_command(self):
        route=f'/devices/{self.did}/commands'
        old=self.call('POST',route,{'package':'com.example.game','action':'block'},self.parent)
        self.call('POST',route,{'package':'com.example.game','action':'unblock'},self.parent)
        self.fails(409,'POST',route+'/'+old['id']+'/ack',{'state':'applied'},self.child)
        self.assertEqual(self.call('GET',f'/devices/{self.did}/policy',token=self.child)['apps'][0]['blocked'],0)

    def test_camera_approval_signaling_stop(self):
        cid=self.camera()
        route=f'/camera/{cid}'
        self.fails(409,'POST',route+'/signals',{'kind':'offer','payload':'sdp'},self.child)
        self.fails(403,'POST',route+'/decision',{'approved':True},self.parent)
        self.call('POST',route+'/decision',{'approved':True},self.child)
        self.fails(400,'POST',route+'/signals',{'kind':'offer','payload':'sdp'},self.parent)
        signal=self.call('POST',route+'/signals',{'kind':'offer','payload':'sdp'},self.child)
        self.assertEqual(len(self.call('GET',route+'/signals',token=self.parent)['signals']),1)
        self.assertEqual(self.call('GET',route+'/signals',token=self.child)['signals'],[])
        self.assertEqual(self.call('GET',route+'/signals?after='+str(signal['id']),token=self.parent)['signals'],[])
        self.call('POST',route+'/signals',{'kind':'answer','payload':'sdp'},self.parent)
        self.call('POST',route+'/stop',token=self.child)
        self.fails(409,'GET',route+'/signals',token=self.parent)
        with self.api.connection() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM signals').fetchone()[0],0)

    def test_camera_denial_expiry_and_lens(self):
        cid=self.camera()
        self.call('POST',f'/camera/{cid}/decision',{'approved':False},self.child)
        self.fails(409,'POST',f'/camera/{cid}/decision',{'approved':True},self.child)
        cid=self.call('POST',f'/devices/{self.did}/camera',{'lens':'back'},self.parent)['id']
        with self.api.connection() as db:
            db.execute('UPDATE cameras SET expires=? WHERE id=?',(int(time.time())-1,cid))
        self.fails(409,'POST',f'/camera/{cid}/decision',{'approved':True},self.child)
        self.assertEqual(self.call('GET',f'/camera/{cid}',token=self.parent)['state'],'expired')

    def test_revoke_and_delete(self):
        self.call('DELETE',f'/devices/{self.did}',token=self.child)
        self.fails(401,'GET',f'/devices/{self.did}/policy',token=self.child)
        self.call('DELETE','/account',token=self.parent)
        self.fails(401,'GET','/devices',token=self.parent)

    def test_credentials_hashed_at_rest(self):
        with self.api.connection() as db:
            self.assertNotEqual(db.execute('SELECT token FROM devices').fetchone()[0],self.child)
            self.assertEqual(db.execute('SELECT token FROM devices').fetchone()[0],digest(self.child))
            self.assertNotEqual(db.execute('SELECT password FROM users LIMIT 1').fetchone()[0],'correct horse battery')

    def test_rate_limit_failed_pairing(self):
        for _ in range(10):
            try:
                self.call('POST','/pairing/claim',{'code':'bad','name':'bad','approved_on_device':True},ip='attacker')
            except Error as exc:
                self.assertEqual(exc.status,400)
        with self.assertRaises(Error) as result:
            self.call('POST','/pairing/claim',{'code':'bad','name':'bad','approved_on_device':True},ip='attacker')
        self.assertEqual(result.exception.status,429)

    def test_persistence(self):
        restarted=API(self.path)
        self.assertEqual(restarted.handle('GET','/devices',token=self.parent)[1]['devices'][0]['id'],self.did)

    def test_http_transport(self):
        server=make_server(self.path,port=0)
        thread=threading.Thread(target=server.serve_forever,daemon=True)
        thread.start()
        base='http://127.0.0.1:'+str(server.server_port)
        try:
            with urllib.request.urlopen(base+'/health') as response:
                self.assertEqual(json.load(response)['status'],'ok')
                self.assertEqual(response.headers['Cache-Control'],'no-store')
            request=urllib.request.Request(base+'/devices',headers={'Authorization':'Bearer '+self.parent})
            with urllib.request.urlopen(request) as response:
                self.assertEqual(len(json.load(response)['devices']),1)
            request=urllib.request.Request(base+'/auth/login',data=b'{',headers={'Content-Type':'application/json'})
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(request)
            self.assertEqual(error.exception.code,400)
        finally:
            server.shutdown(); server.server_close(); thread.join()


if __name__=='__main__': unittest.main()
