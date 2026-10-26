const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--no-sandbox']});
 const parentContext=await browser.newContext({viewport:{width:1200,height:950}});
 const childContext=await browser.newContext({permissions:['camera'],viewport:{width:390,height:844}});
 const parent=await parentContext.newPage(),child=await childContext.newPage();
 const errors=[];for(const page of [parent,child])page.on('pageerror',e=>errors.push(e.message));
 // Fake browser cameras have no facing-mode metadata. Record requested lens,
 // then use the generated fake video source for an actual WebRTC transport test.
 await child.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=constraints=>{window.requestedLens=constraints.video.facingMode.exact;return original({video:true,audio:false});};});
 try{
  const url=process.env.KINORA_TEST_URL||'http://127.0.0.1:8765';
  await parent.goto(url);await parent.locator('#email').fill('web'+Date.now()+'@example.com');await parent.locator('#password').fill('strong browser test password');await parent.getByRole('button',{name:'Create account',exact:true}).click();
  await parent.locator('#parent').waitFor({state:'visible'});await parent.locator('#newCode').click();await parent.waitForFunction(()=>document.querySelector('#pairCode').textContent.length>5);
  const code=(await parent.locator('#pairCode').textContent()).split(' ')[0];
  await child.goto(url);await child.locator('#code').fill(code);await child.locator('#consent').check();await child.locator('#pair button').click();await child.locator('#child').waitFor({state:'visible'});
  await parent.waitForFunction(()=>document.querySelector('#devices').value.length>0);
  await child.evaluate(async()=>{await api('/devices/'+session.did+'/telemetry','POST',{apps:[{package:'com.example.game',name:'Example game',minutes:15}],usageEnabled:true,managed:false});});
  await parent.waitForFunction(()=>document.querySelector('#apps').options.length>0);
  await parent.locator('#block').click();await parent.waitForFunction(()=>document.querySelector('#commands').textContent.includes('unsupported'));
  await parent.locator('#requestCamera').click();await child.locator('#approval').waitFor({state:'visible'});
  assert.equal(await child.evaluate(()=>!!stream),false,'no capture before approval');
  await child.locator('#approve').click();
  await parent.waitForFunction(()=>document.querySelector('#video').videoWidth>0,{},{timeout:30000});
  assert.equal(await child.evaluate(()=>window.requestedLens),'user');
  assert.equal(await child.evaluate(()=>stream.getAudioTracks().length),0);
  await child.locator('#stopCamera').click();await parent.locator('#cameraPanel').waitFor({state:'hidden'});
  assert.equal(await child.evaluate(()=>stream),null);
  await parent.locator('#lens').selectOption('back');await parent.locator('#requestCamera').click();await child.locator('#approval').waitFor({state:'visible'});
  await child.locator('#approve').click();await parent.waitForFunction(()=>document.querySelector('#video').videoWidth>0,{},{timeout:30000});
  assert.equal(await child.evaluate(()=>window.requestedLens),'environment');
  await parent.locator('#stopCamera').click();await child.locator('#cameraPanel').waitFor({state:'hidden'});
  await parent.screenshot({path:'/tmp/kinora-parent.png',fullPage:true});await child.screenshot({path:'/tmp/kinora-child.png',fullPage:true});
  assert.equal(await child.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile overflow');
  assert.deepEqual(errors,[]);
  console.log('PASS: registration, pairing, inventory, unsupported blocking, consent, front/back requests, real synthetic WebRTC video, both stop directions, responsive layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
