// Node: node scripts/hani-photo-backup-222.test.mjs
// Browser: append <playwright/index.mjs> <Edge exe|CDP URL>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import http from 'node:http';
const root=new URL('../',import.meta.url),source=fs.readFileSync(new URL('hani-drive-vault.js',root),'utf8');
const main=fs.readFileSync(new URL('hani-main.js',root),'utf8');
const bridge=main.slice(main.indexOf('function buildBackupPayload('),main.indexOf('async function exportDataWithMedia('));
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=';
const gif='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// Shared fake implements only File System Access operations; never touches a real folder.
function directory(){
  const files=new Map(),dirs=new Map(),calls={writes:0},handle={name:'fixture-vault',permission:'granted',
    async queryPermission(){return this.permission},async requestPermission(){return this.permission},async isSameEntry(h){return h===handle},
    async getDirectoryHandle(name,{create=false}={}){
      if(!dirs.has(name)){if(!create)throw Object.assign(Error('missing'),{name:'NotFoundError'});dirs.set(name,directory())}
      return dirs.get(name).handle;
    },
    async getFileHandle(name,{create=false}={}){
      if(!files.has(name)){if(!create)throw Object.assign(Error('missing'),{name:'NotFoundError'});files.set(name,new Uint8Array())}
      return {async getFile(){return new Blob([files.get(name)])},async createWritable(){let pending;
        return {async write(data){calls.writes++;pending=new Uint8Array(data)},async close(){if(handle.corrupt)pending[0]^=1;files.set(name,pending)},async abort(){}}}};
    }};
  return {handle,files,dirs,calls};
}
const window={crypto:webcrypto,atob};
vm.runInNewContext(source,{window,TextEncoder,TextDecoder,Uint8Array,Date});
const core=window.HANI_DRIVE_VAULT_CORE,ref='media:sha256:'+Buffer.from(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(gif))).toString('hex');
const state={books:[{id:'b',title:'책:/테스트',cover:png},{id:'dup',title:'중복',cover:png}],movies:[{id:'m',title:'영화',posterRef:ref}]};
const original=JSON.stringify(state),dir=directory(),options={handle:dir.handle,state,getRef:async id=>id===ref?gif:null};
let result=await core.writePhotos(options);
assert.deepEqual([result.backedUp,result.new,result.missing],[2,2,0]);
const photos=dir.dirs.get('HANI_OS_photos'),manifest=()=>JSON.parse(new TextDecoder().decode(photos.files.get('manifest.json')));
assert.equal(manifest().images.length,2);assert.equal(manifest().images[0].records.length,2);
assert.ok(manifest().images.some(r=>r.mime==='image/png'&&r.path.endsWith('.png')));
assert.ok(manifest().images.some(r=>r.mime==='image/gif'&&r.path.endsWith('.gif')));
const writes=photos.dirs.get('books').calls.writes+photos.dirs.get('movies').calls.writes;
result=await core.writePhotos(options);assert.deepEqual([result.backedUp,result.new,result.missing],[2,0,0]);
assert.equal(photos.dirs.get('books').calls.writes+photos.dirs.get('movies').calls.writes,writes,'incremental skips image writes');
const missingState={books:[{id:'missing',coverRef:'media:sha256:'+'a'.repeat(64)}],movies:[]};
result=await core.writePhotos({...options,state:missingState});assert.equal(result.missing,1);
assert.equal(manifest().images.length,2,'historical entries retained');
assert.equal(JSON.stringify(state),original);
result=await core.writePhotos({...options,state:{books:[{cover:png,coverRef:ref}]}});assert.equal(result.missing,1,'digest mismatch reported');
result=await core.writePhotos({...options,state:{books:[{cover:'data:image/jpeg;base64,QQ=='}]}});assert.equal(result.missing,1,'MIME/signature mismatch rejected');
result=await core.writePhotos({...options,state:{books:[{cover:'data:image/png;base64,'+'A'.repeat(15*1024*1024)}]}});assert.equal(result.missing,1,'size guard');
const entry=manifest().images[0],[sub,name]=entry.path.split('/'),bookDir=photos.dirs.get(sub),saved=bookDir.files.get(name);
bookDir.files.set(name,new Uint8Array([1,2,3]));result=await core.writePhotos(options);
assert.equal(result.new,1);assert.equal(bookDir.files.get(name).length,3,'corrupt/user file preserved');
assert.ok([...bookDir.files.values()].some(x=>x.length===saved.length));
const bad=directory();await bad.handle.getDirectoryHandle('HANI_OS_photos',{create:true});
bad.dirs.get('HANI_OS_photos').files.set('manifest.json',new TextEncoder().encode('user file'));
await assert.rejects(core.writePhotos({...options,handle:bad.handle}),/PHOTO_MANIFEST/);
assert.equal(new TextDecoder().decode(bad.dirs.get('HANI_OS_photos').files.get('manifest.json')),'user file');
const corrupt=directory();await corrupt.handle.getDirectoryHandle('HANI_OS_photos',{create:true});
await corrupt.dirs.get('HANI_OS_photos').handle.getDirectoryHandle('books',{create:true});corrupt.dirs.get('HANI_OS_photos').dirs.get('books').handle.corrupt=true;
await assert.rejects(core.writePhotos({...options,handle:corrupt.handle}),/HASH/);
assert.ok(!corrupt.dirs.get('HANI_OS_photos').files.has('manifest.json'),'failed read-back never receives manifest');
let guards=0;await assert.rejects(core.writePhotos({...options,guard(){if(++guards>2)throw Error('OWNER')}}),/OWNER/);
console.log('PASS Node: inline/ref, unique records, incremental, missing/conflict, MIME/size, collision preservation, read-back hash, guard');

// Exercise the real unsupported initialization even when no browser is available.
const nodes=Object.fromEntries(['driveVaultChip','driveVaultConnect','driveVaultBackup','driveVaultPhotos','driveVaultPhotoStatus','driveVaultStatus','driveVaultReminder','driveVaultLast'].map(id=>[id,{textContent:''}]));
const unsupported={document:{getElementById:id=>nodes[id]},crypto:webcrypto,HANI_DRIVE_BACKUP:{context:()=>({owner:'fixture-owner',ready:true,photoReady:true})}};
vm.runInNewContext(source,{window:unsupported,TextEncoder,TextDecoder,Uint8Array,Date,queueMicrotask});
assert.equal(nodes.driveVaultStatus.textContent,'PC에서 백업할 수 있어요');assert.equal(nodes.driveVaultPhotoStatus.textContent,'');
assert.equal(Object.values(nodes).filter(n=>n.textContent==='PC에서 백업할 수 있어요').length,1);
for(const id of ['driveVaultConnect','driveVaultBackup','driveVaultPhotos'])assert.equal(nodes[id].disabled,true,id+' unsupported');
console.log('PASS Node: unsupported Vault initializes with one general notice, empty photo status, disabled actions');

if(process.argv[2]){
  const {chromium}=await import(pathToFileURL(process.argv[2]).href);
  const html=fs.readFileSync(new URL('index.html',root),'utf8');
  const cardStart=html.lastIndexOf('<div class="card full">',html.indexOf('id="driveVaultChip"'));
  const card=html.slice(cardStart,html.indexOf('</div>',html.indexOf('id="driveVaultLast"'))+6)+'<dl><dd id="settingsPhotoStatus">확인 전</dd><dd id="settingsBackupStatus">확인 전</dd></dl>';
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html lang="ko"><body>'+card+'</body></html>')});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  fs.mkdirSync(new URL('artifacts/photo-backup-222/',root),{recursive:true});
  try{
    browser=process.argv[3].startsWith('http')?await chromium.connectOverCDP(process.argv[3]):await chromium.launch({executablePath:process.argv[3],headless:true});
    for(const width of [1440,390]){
      const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),requests=[],errors=[];
      page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:'))requests.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
      await context.route('https://**/*',r=>r.abort());
      await page.goto('http://127.0.0.1:'+server.address().port);
      await page.addStyleTag({content:fs.readFileSync(new URL('hani-style-01.css',root),'utf8').replace(/@import[^;]+;/g,'')});
      await page.evaluate(({directory,png,gif,bridge})=>{
        window.fixtureDir=(0,eval)('('+directory+')')();window.showDirectoryPicker=async()=>fixtureDir.handle;
        if(innerWidth<500)Object.defineProperty(window,'showDirectoryPicker',{value:undefined,configurable:true});
        window.state={books:[{id:'b',title:'책',cover:png}],movies:[]};window.VERSION='2.9.15-safe-baseline-bootstrap';
        window.STORAGE_KEY='hani_os_life_v23';window.validateBackup=data=>({kind:'current',data});window.validateStoredRecords=()=>{};
        window.mediaHasRefs=data=>[['books','cover'],['movies','poster']].some(([kind,field])=>(data[kind]||[]).some(r=>r[field+'Ref']&&!r[field]));
        window.mediaBackupState=()=>{cloudCalls++;throw Error('Cloud reembed forbidden')};
        window.cloudUser={id:'fixture-owner'};window.cloudOwnerVerificationEpoch=1;window.cloudAutoSyncReady=false;
        window.loadRecovery={active:false};window.cloudRecoveryMode=false;window.importSyncHold=false;window.cloudSyncBusy=false;window.cloudApplyingRemote=false;
        window.renderSettlementCheck=()=>{};
        localStorage.setItem('hani_os_life_v23',JSON.stringify(state));window.lifeBefore=localStorage.getItem('hani_os_life_v23');window.lifeWrites=0;window.cloudCalls=0;
        const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='hani_os_life_v23')lifeWrites++;return set.call(this,k,v)};
        window.fetch=()=>{cloudCalls++;throw Error('Cloud forbidden')};window.cloudClient={from(){cloudCalls++;throw Error('Cloud forbidden')}};
        window.fixtureGif=gif;(0,eval)(bridge);
        // Native media IndexedDB stays real; only directory-handle persistence is faked,
        // because function-based handles cannot be structured-cloned like native handles.
        window.vaultRecords=new Map();const nativeOpen=indexedDB.open.bind(indexedDB);
        indexedDB.open=function(name,...args){
          if(name!=='hani_vault_v1')return nativeOpen(name,...args);
          const request={};queueMicrotask(()=>{request.result={close(){},transaction(){
            const tx={objectStore(){return {get(key){const r={};setTimeout(()=>{r.result=vaultRecords.get(key);r.onsuccess?.();setTimeout(()=>tx.oncomplete?.(),0)},0);return r},
              put(value,key){vaultRecords.set(key,value);const r={};setTimeout(()=>tx.oncomplete?.(),0);return r}}}};return tx;
          }};request.onsuccess?.()});return request;
        };
      },{directory:directory.toString(),png,gif,bridge});
      await page.addScriptTag({content:fs.readFileSync(new URL('hani-media-core.js',root),'utf8')});
      await page.evaluate(async()=>{
        HANI_MEDIA.setAccountProvider(()=>cloudUser.id);HANI_MEDIA.setCloudProvider(()=>({userId:cloudUser.id,client:cloudClient}));
        const ref=await HANI_MEDIA.digest(fixtureGif);await HANI_MEDIA.put(ref,fixtureGif);
        // Fresh cache, same real IndexedDB record. getLocal must not dispatch hydration events.
        HANI_MEDIA.setAccountProvider(()=>cloudUser.id);window.mediaEvents=0;addEventListener('hani-media-ready',()=>mediaEvents++);
        state.movies=[{id:'m',title:'영화',posterRef:ref},{id:'lost',title:'누락',posterRef:'media:sha256:'+'a'.repeat(64)}];
      });
      await page.waitForTimeout(20);await page.evaluate(()=>{mediaEvents=0});
      await page.addScriptTag({content:source});
      assert.equal(await page.locator('#settingsPhotoStatus').textContent(),'확인 전','missing manifest never projects zero');
      if(width===1440){
        await page.click('#driveVaultConnect');await page.waitForFunction(()=>!document.getElementById('driveVaultPhotos').disabled);
        await page.click('#driveVaultPhotos');await page.waitForFunction(()=>document.getElementById('driveVaultPhotoStatus').textContent.includes('누락 1건'));
        let snapshot=await page.evaluate(()=>({text:document.getElementById('driveVaultPhotoStatus').textContent,raw:localStorage.getItem('hani_os_life_v23'),lifeBefore,lifeWrites,cloudCalls,mediaEvents,
          manifest:JSON.parse(new TextDecoder().decode(fixtureDir.dirs.get('HANI_OS_photos').files.get('manifest.json')))}));
        assert.match(snapshot.text,/백업 2장 \/ 신규 2장 \/ 누락 1건/);assert.equal(snapshot.manifest.images.length,2);
        assert.equal(await page.locator('#settingsPhotoStatus').textContent(),'1건','summary reads the existing manifest result');
        assert.equal(snapshot.raw,snapshot.lifeBefore);assert.equal(snapshot.lifeWrites,0);assert.equal(snapshot.cloudCalls,0);assert.equal(snapshot.mediaEvents,0);
        await page.click('#driveVaultPhotos');await page.waitForFunction(()=>document.getElementById('driveVaultPhotoStatus').textContent.includes('신규 0장'));
        // Exercise the real weekly lifecycle using the stored handle and an expired timestamp.
        await page.evaluate(()=>{
          state.movies=state.movies.filter(r=>r.id!=='lost');
          const row=vaultRecords.get(cloudUser.id);row.photos=null;
        });
        await page.addScriptTag({content:source});
        await page.waitForFunction(()=>document.getElementById('driveVaultPhotoStatus').textContent.includes('누락 0건'));
        assert.equal(await page.locator('#settingsPhotoStatus').textContent(),'0건','zero only after the existing manifest verifies it');
        // Both existing weekly JSON and photos run from the same scheduled backup.
        await page.evaluate(()=>{cloudAutoSyncReady=true;const row=vaultRecords.get(cloudUser.id);row.photos=null;row.last=null});
        await page.addScriptTag({content:source});
        await page.waitForFunction(()=>document.getElementById('driveVaultLast').textContent.includes('SHA-256'));
        assert.notEqual(await page.locator('#settingsBackupStatus').textContent(),'확인 전','existing verified Vault record feeds summary');
        const full=await page.evaluate(()=>JSON.parse(new TextDecoder().decode([...fixtureDir.files.values()][0])));
        assert.equal(full.movies[0].poster,gif,'weekly full JSON recombines refs locally');
        snapshot=await page.evaluate(()=>({raw:localStorage.getItem('hani_os_life_v23'),lifeBefore,lifeWrites,cloudCalls,mediaEvents}));
        assert.equal(snapshot.raw,snapshot.lifeBefore);assert.equal(snapshot.lifeWrites,0);assert.equal(snapshot.cloudCalls,0);assert.equal(snapshot.mediaEvents,0);
      }else{
        assert.equal(await page.locator('#driveVaultPhotoStatus').textContent(),'');
        assert.equal(await page.locator('#driveVaultStatus').innerText(),'PC에서 백업할 수 있어요');
        assert.equal((await page.locator('body').innerText()).split('PC에서 백업할 수 있어요').length-1,1,'one fallback notice');
        const snapshot=await page.evaluate(()=>({raw:localStorage.getItem('hani_os_life_v23'),lifeBefore,lifeWrites,cloudCalls}));
        assert.equal(snapshot.raw,snapshot.lifeBefore);assert.equal(snapshot.lifeWrites,0);assert.equal(snapshot.cloudCalls,0);
        assert.equal(await page.locator('#driveVaultPhotos').isDisabled(),true);
      }
      assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
      await page.screenshot({path:fileURLToPath(new URL(`artifacts/photo-backup-222/${width}.png`,root))});
      await context.close();console.log('PASS browser '+width+': UI, byte-identical life key, local IDB refs, zero Cloud, fallback');
    }
  }finally{await browser?.close();await new Promise(r=>server.close(r))}
}else console.log('Browser not run: provide Playwright and browser arguments.');
