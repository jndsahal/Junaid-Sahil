'use strict';
const $=id=>document.getElementById(id);
let session; try { session=JSON.parse(sessionStorage.getItem('kinora')||'null'); } catch { session=null; }
let selected='', busy=false, pending=null, camera=null, pc=null, stream=null, cursor=0, candidateQueue=[], rtcBusy=false, generation=0, cameraGeneration=0;
const native=window.Kinora;
function status(message){$('status').textContent=message;}
function save(){sessionStorage.setItem('kinora',JSON.stringify(session));}
async function api(path,method='GET',body){
 const response=await fetch(path,{method,headers:{'Content-Type':'application/json',...(session?.token?{Authorization:'Bearer '+session.token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const result=await response.json();
 if(!response.ok){if(response.status===401&&session){await stopCamera(false);session=null;save();render();}throw new Error(result.error||'Request failed');}return result;
}
function action(id,fn){$(id).addEventListener('click',async()=>{const button=$(id);button.disabled=true;try{await fn();}catch(e){status(e.message);}finally{button.disabled=false;}});}
function render(){generation++;$('welcome').hidden=!!session;$('dashboard').hidden=!session;$('parent').hidden=session?.role!=='parent';$('child').hidden=session?.role!=='device';$('logout').hidden=session?.role==='device';$('heading').textContent=session?.role==='parent'?'Your family dashboard':'Your connected space';}
function rows(id,items){$(id).replaceChildren(...items.map(value=>{const item=document.createElement('div');item.className='row';item.textContent=value;return item;}));}
function options(id,items,value){$(id).replaceChildren(...items.map(([key,label])=>{const option=document.createElement('option');option.value=key;option.textContent=label;return option;}));if(items.some(x=>x[0]===value))$(id).value=value;}
$('auth').addEventListener('submit',async event=>{event.preventDefault();try{const result=await api('/auth/'+event.submitter.name,'POST',{email:$('email').value,password:$('password').value});session={role:'parent',token:result.token};$('password').value='';save();render();await refresh();status('Welcome to your family space.');}catch(e){status(e.message);}});
$('pair').addEventListener('submit',async event=>{event.preventDefault();try{const result=await api('/pairing/claim','POST',{code:$('code').value,name:$('deviceName').value,approved_on_device:$('consent').checked});session={role:'device',token:result.device_token,did:result.device_id};save();render();if(native){const enrolled=JSON.parse(native.enroll(session.token,session.did));if(enrolled.error)throw new Error(enrolled.error);}status('Device connected. Camera requests still need your approval.');await refresh();}catch(e){status(e.message);}});
action('newCode',async()=>{const result=await api('/pairing','POST');$('pairCode').textContent=result.code+' · valid for 5 minutes';});
$('devices').addEventListener('change',async()=>{await stopCamera();selected=$('devices').value;await refresh().catch(e=>status(e.message));});
for(const actionName of ['block','unblock'])action(actionName,async()=>{if(!selected||!$('apps').value)throw new Error('Choose a device and installed app first.');await api('/devices/'+selected+'/commands','POST',{package:$('apps').value,action:actionName});status('Command sent. Waiting for the device to confirm.');await refresh();});
action('logout',async()=>{await stopCamera();await api('/auth/logout','POST');session=null;save();render();status('Signed out.');});
action('deleteAccount',async()=>{if(!confirm('Delete this account and all paired devices?'))return;await stopCamera();await api('/account','DELETE');session=null;save();render();});
async function unpair(did){if(!did||!confirm('Disconnect this device and stop sharing?'))return;await stopCamera();await api('/devices/'+did,'DELETE');if(session?.role==='device'){if(native)native.disconnect();session=null;save();render();}else{selected='';await refresh();}status('Device disconnected.');}
action('unpairParent',()=>unpair(selected));action('unpairChild',()=>unpair(session.did));
action('sync',async()=>{if(native){const result=JSON.parse(native.sync());if(result.error)throw new Error(result.error);}await refresh();status('Device synchronized.');});
action('shareLocation',async()=>{const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:15000,maximumAge:0}));const report=(await api('/devices/'+session.did+'/telemetry')).report||{apps:[]};report.location={latitude:position.coords.latitude,longitude:position.coords.longitude};await api('/devices/'+session.did+'/telemetry','POST',report);status('Your location was shared once. It expires after 24 hours.');});
async function refresh(){
 if(!session||busy||document.hidden)return;busy=true;const gen=generation;
 try{
  if(session.role==='parent'){
   const result=await api('/devices');if(gen!==generation)return;
   options('devices',result.devices.map(d=>[d.id,d.name]),selected);selected=$('devices').value;
   const device=result.devices.find(d=>d.id===selected);$('deviceStatus').textContent=device?'Last contact: '+(device.seen?new Date(device.seen*1000).toLocaleString():'not yet'):'No connected devices. Add one to begin.';
   if(!selected){options('apps',[]);rows('commands',[]);rows('usage',[]);$('location').textContent='';return;}
   const [report,commands]=await Promise.all([api('/devices/'+selected+'/telemetry'),api('/devices/'+selected+'/commands')]);if(gen!==generation)return;
   options('apps',(report.report?.apps||[]).map(a=>[a.package,a.name]),$('apps').value);
   rows('commands',commands.commands.slice(-8).map(c=>c.package+' · '+c.action+' · '+c.state+(c.detail?' — '+c.detail:'')));
   $('reportTime').textContent=report.updated?'Reported '+new Date(report.updated*1000).toLocaleString()+' · '+(report.report.managed?'Device Owner enabled':'App enforcement unavailable'):'Waiting for device report.';
   rows('usage',report.report?.usageEnabled?(report.report.apps||[]).filter(a=>a.minutes>0).map(a=>a.name+' · '+a.minutes+' min (Android estimate)'):['Usage permission is not enabled on the child device.']);
   const location=report.report?.location;$('location').textContent=location?'Last shared location: '+location.latitude.toFixed(5)+', '+location.longitude.toFixed(5):'No location shared.';
  }else{
   if(native){const result=JSON.parse(native.sync());if(result.error)throw new Error(result.error);$('management').textContent=result.managed?'Device Owner active. App controls are available.':'Device Owner enrollment is needed for app blocking. Usage permission is managed from the Android home screen.';}
   else{$('management').textContent='Browser mode: camera check-ins work; Android app blocking requires the Kinora APK.';const commands=await api('/devices/'+session.did+'/commands');for(const c of commands.commands.filter(c=>c.state==='pending'))await api('/devices/'+session.did+'/commands/'+c.id+'/ack','POST',{state:'unsupported',detail:'Use the enrolled Android app for app enforcement'});}
   const result=await api('/devices/'+session.did+'/camera');if(gen!==generation)return;
   pending=result.sessions.find(c=>c.state==='pending')||null;$('approval').hidden=!pending;
   if(pending)$('approvalText').textContent='Your parent requests the '+pending.lens+' camera. Allow up to five minutes with a visible preview?';
  }
  if(camera)await syncCamera();
 }catch(e){if(camera)await stopCamera(false);status(e.message);}finally{busy=false;}
}
action('requestCamera',async()=>{if(!selected)throw new Error('Choose a connected device.');await stopCamera();camera=await api('/devices/'+selected+'/camera','POST',{lens:$('lens').value});$('cameraPanel').hidden=false;$('cameraStatus').textContent='Waiting for device approval…';status('Camera request sent.');});
action('deny',async()=>{if(!pending)return;await api('/camera/'+pending.id+'/decision','POST',{approved:false});pending=null;$('approval').hidden=true;});
action('approve',async()=>{
 if(!pending||document.hidden)return;const request=pending;const gen=++cameraGeneration;pending=null;$('approval').hidden=true;
 try{
  const captured=await navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:request.lens==='front'?'user':'environment'}},audio:false});
  if(gen!==cameraGeneration||document.hidden){captured.getTracks().forEach(t=>t.stop());return;}
  stream=captured;const result=await api('/camera/'+request.id+'/decision','POST',{approved:true});
  if(gen!==cameraGeneration||document.hidden){captured.getTracks().forEach(t=>t.stop());await api('/camera/'+request.id+'/stop','POST');return;}
  camera={...request,...result};$('cameraPanel').hidden=false;$('video').srcObject=stream;$('video').muted=true;await peer();
  for(const track of stream.getTracks())pc.addTrack(track,stream);
  const offer=await pc.createOffer();await pc.setLocalDescription(offer);await api('/camera/'+camera.id+'/signals','POST',{kind:'offer',payload:JSON.stringify(offer)});status('Camera sharing is active. You can stop now.');
 }catch(e){await stopCamera();await api('/camera/'+request.id+'/stop','POST').catch(()=>{});throw e;}
});
async function peer(){
 const config=await api('/rtc/config');if(!camera)return;
 if(!config.relayConfigured)status('TURN relay is not configured; video may only connect on the same network.');
 pc=new RTCPeerConnection({iceServers:config.iceServers});cursor=0;candidateQueue=[];
 const current=pc,id=camera.id;
 pc.onicecandidate=event=>{if(event.candidate&&camera?.id===id)api('/camera/'+id+'/signals','POST',{kind:'ice',payload:JSON.stringify(event.candidate)}).catch(()=>stopCamera(false));};
 pc.ontrack=event=>{if(current!==pc)return;$('video').srcObject=event.streams[0]||new MediaStream([event.track]);$('video').play().catch(()=>{});};
 pc.onconnectionstatechange=()=>{if(current===pc&&['failed','disconnected','closed'].includes(current.connectionState))stopCamera();};
}
async function syncCamera(){
 if(!camera||rtcBusy)return;rtcBusy=true;const id=camera.id;
 try{const state=await api('/camera/'+id);if(camera?.id!==id)return;camera=state;
  if(!['pending','active'].includes(state.state)||state.expires*1000<=Date.now()){await stopCamera(false);status('Camera session '+state.state+'.');return;}
  $('cameraStatus').textContent=state.state==='pending'?'Waiting for approval…':'Camera session · '+Math.max(0,Math.ceil((state.expires*1000-Date.now())/1000))+' seconds left';
  if(state.state!=='active')return;if(!pc)await peer();if(!pc||camera?.id!==id)return;
  const result=await api('/camera/'+id+'/signals?after='+cursor);
  for(const signal of result.signals){if(!pc||camera?.id!==id)return;const value=JSON.parse(signal.payload);
   if(signal.kind==='offer'){await pc.setRemoteDescription(value);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await api('/camera/'+id+'/signals','POST',{kind:'answer',payload:JSON.stringify(answer)});}
   else if(signal.kind==='answer'){await pc.setRemoteDescription(value);}else{candidateQueue.push(value);}
   cursor=signal.id;
   if(pc?.remoteDescription)while(candidateQueue.length)await pc.addIceCandidate(candidateQueue.shift());
  }
 }finally{rtcBusy=false;}
}
async function stopCamera(notify=true){
 cameraGeneration++;const old=camera;camera=null;if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}if(pc){pc.onconnectionstatechange=null;pc.close();pc=null;}
 $('video').srcObject=null;$('cameraPanel').hidden=true;candidateQueue=[];cursor=0;
 if(notify&&old&&session)await api('/camera/'+old.id+'/stop','POST').catch(()=>{});
}
window.kinoraStop=()=>stopCamera();action('stopCamera',()=>stopCamera());
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else refresh();});
window.addEventListener('pagehide',()=>stopCamera());
setInterval(()=>{if(camera&&camera.expires&&camera.expires*1000<=Date.now())stopCamera();},500);
setInterval(refresh,2000);
if(native&&!session){try{const restored=JSON.parse(native.credentials());if(restored.token)session={role:'device',...restored};}catch{}}
render();refresh();
