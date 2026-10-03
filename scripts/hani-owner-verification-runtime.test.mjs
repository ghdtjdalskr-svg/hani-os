import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const root=path.resolve(import.meta.dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.argv[3],headless:true});
try{
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:1000}});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(origin);await page.waitForLoadState('load');
    // Synthetic-only context; no operating profile, auth tokens or real user source.
    await page.evaluate(()=>{
      document.querySelector('#loginGate').hidden=true;
      document.querySelector('#loginGate').style.display='none';
      document.querySelector('#app').classList.remove('login-locked');
      document.querySelector('#app').setAttribute('aria-hidden','false');
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      document.querySelector('#settings').classList.add('active');
      document.querySelector('#cloudAdvanced').open=true;
      cloudUser={id:'synthetic-owner',email:'synthetic@example.invalid'};
      cloudClient={auth:{getUser:async()=>({data:{user:{id:'synthetic-owner'}},error:null})},from:()=>({select:()=>({eq:()=>({limit:async()=>({data:[{user_id:'synthetic-owner',state:structuredClone(state),revision:1}],error:null})})})})};
      renderCloudPanel();
    });
    const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
    const errorsBefore=errors.length;
    await page.locator('#cloudVerifySourceOwner').click();
    await page.waitForFunction(()=>document.querySelector('#cloudOwnerVerificationResult').textContent.startsWith('VERIFIED'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),before);
    assert.equal(await page.evaluate(()=>cloudOwnerVerification),null);
    assert.equal((await page.evaluate(()=>indexedDB.databases())).some(db=>db.name==='hani_data_hub_v1'),false);
    assert.equal(errors.length,errorsBefore);
    for(const finish of ['porcelain-cream','midnight-black']){
      await page.evaluate(f=>applySignatureFinish(f,false),finish);
      assert.ok(await page.locator('#cloudVerifySourceOwner').isVisible());
      const bounding=await page.locator('#cloudVerifySourceOwner').boundingBox();
      assert.ok(bounding.width>0&&bounding.x+bounding.width<=width+1);
      const dir=path.join(root,'qa-evidence');fs.mkdirSync(dir,{recursive:true});
      await page.locator('#cloudBridgeCard').screenshot({path:path.join(dir,`owner-runtime-${width}-${finish}.png`)});
    }
    console.log(`PASS actual runtime ${width}: synthetic same-owner verification, protected key unchanged, no cache/retained binding, both finishes; initial offline external errors=${errorsBefore}, new errors=0.`);
    await context.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
