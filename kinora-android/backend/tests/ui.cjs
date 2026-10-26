// UI + real HTTP API integration; mocked media/RTC, not a video transport test.
const {JSDOM}=require('jsdom');
const fs=require('node:fs');const assert=require('node:assert/strict');
const url=process.env.KINORA_TEST_URL||'http://127.0.0.1:8765';
const html=fs.readFileSync('web/index.html','utf8'),source=fs.readFileSync('web/app.js','utf8');
const windows=[];
function page(){
 const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;windows.push(w);
 w.AbortSignal=AbortSignal;w.fetch=(p,o)=>fetch(new URL(p,url),o);w.confirm=()=>true;
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
 w.RTCPeerConnection=class{constructor(){this.remoteDescription=null;}addTrack(){}async createOffer(){return{type:'offer',sdp:'mock offer'};}async createAnswer(){return{type:'answer',sdp:'mock answer'};}async setLocalDescription(){}async setRemoteDescription(v){this.remoteDescription=v;}async addIceCandidate(){}close(){}};
 w.stopped=0;w.captures=0;Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async(c)=>{w.captures++;w.lens=c.video.facingMode.exact;return{getTracks:()=>[{stop:()=>w.stopped++}],getAudioTracks:()=>[]};}}});
 require('node:vm').runInContext(source,dom.getInternalVMContext());return w;
}
const wait=async predicate=>{for(let i=0;i<100;i++){if(await predicate())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out');};
const click=(w,id)=>w.document.getElementById(id).click();
(async()=>{
 const p=page(),c=page();
 await p.eval(`(async()=>{const r=await api('/auth/register','POST',{email:'dom${Date.now()}@example.com',password:'strong integration password'});session={role:'parent',token:r.token};save();render();})()`);
 assert.equal(p.document.getElementById('welcome').hidden,true);
 click(p,'newCode');await wait(()=>p.document.getElementById('pairCode').textContent.length>10);
 const code=p.document.getElementById('pairCode').textContent.split(' ')[0];
 c.document.getElementById('code').value=code;c.document.getElementById('consent').checked=true;
 c.document.getElementById('pair').dispatchEvent(new c.Event('submit',{cancelable:true}));
 await wait(()=>!c.document.getElementById('child').hidden);await p.eval('refresh()');
 await c.eval(`api('/devices/'+session.did+'/telemetry','POST',{apps:[{package:'com.example.game',name:'Game',minutes:5}],usageEnabled:true})`);
 await p.eval('refresh()');assert.equal(p.document.getElementById('apps').value,'com.example.game');
 click(p,'block');await wait(()=>!p.document.getElementById('block').disabled);await c.eval('refresh()');await p.eval('refresh()');
 assert.match(p.document.getElementById('commands').textContent,/unsupported/);
 for(const [lens,expected] of [['front','user'],['back','environment']]){
  p.document.getElementById('lens').value=lens;click(p,'requestCamera');await wait(()=>!p.document.getElementById('requestCamera').disabled);
  await c.eval('refresh()');assert.equal(c.document.getElementById('approval').hidden,false);
  const before=c.captures;click(c,'approve');await wait(()=>!c.document.getElementById('approve').disabled);
  assert.equal(c.captures,before+1);assert.equal(c.lens,expected);
  await p.eval('refresh()');await c.eval('refresh()');assert.equal(c.eval('!!pc.remoteDescription'),true);
  if(lens==='front'){click(p,'stopCamera');await wait(()=>!p.document.getElementById('stopCamera').disabled);await c.eval('refresh()');}
  else{click(c,'stopCamera');await wait(()=>!c.document.getElementById('stopCamera').disabled);await p.eval('refresh()');}
  assert.equal(c.eval('stream'),null);assert.equal(p.document.getElementById('cameraPanel').hidden,true);
 }
 assert.equal(c.stopped,2);
 click(p,'requestCamera');await wait(()=>!p.document.getElementById('requestCamera').disabled);await c.eval('refresh()');click(c,'deny');await wait(()=>!c.document.getElementById('deny').disabled);await p.eval('refresh()');assert.equal(c.captures,2);
 console.log('PASS: UI/API pairing, inventory, honest blocking status, both lens requests, consent/deny, offer-answer exchange and both stop directions (mocked media).');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>windows.forEach(w=>w.close()));
