import {readReviewedReleaseBaseline as readBranchBaseline,readReviewedCurrentSource} from './hani-reviewed-release-baseline.mjs';
// Real index + existing renderers/handlers, isolated synthetic origin. No account or external IO.
// node scripts/hani-settings-225.test.mjs [playwright/index.mjs] [Edge executable]
import {withoutHeroRestore} from './hani-hero-restore-preservation.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {settingsDelta as originalDelta,withoutSettings225} from './hani-settings-225-preservation.mjs';
import {verifySettingsStatusProjection} from './hani-settings-225-state.mjs';
import {verifySettingsMarkup} from './hani-settings-225-markup.mjs';
const require=createRequire(import.meta.url);
// Preserve all integrated bytes except the exact separately reviewed hero delta.
const settingsDelta={...originalDelta,files:Object.fromEntries(Object.entries(originalDelta.files).map(([file,entry])=>{
 const source=withoutHeroRestore(file,readBranchBaseline(file)),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 return [file,{...entry,afterHash:hash(source),beforeHash:hash(withoutSettings225(file,source))}];
}))};
const args=process.argv.slice(2).filter(arg=>!arg.startsWith('--'));
const pw=args[0]||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const executablePath=args[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/settings-225'),origin='http://hani-settings-225.local';
const read=readReviewedCurrentSource,hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const result={status:'RUNNING',base:settingsDelta.base,checks:[],handlers:[],mapping:[],screenshots:[],errors:[]};
const check=(label)=>result.checks.push(label);
fs.mkdirSync(out,{recursive:true});
const plan=read('scripts/fixtures/settings-225-plan.md');
const mappings=[...plan.matchAll(/^\| `#([\w-]+)` \|.*?\| ([①②③④⑤⑥][^|]+|공통\/조건부|사내 규칙) \|$/gm)].map(m=>({id:m[1],group:m[2].trim()}));
const groups=['backup','cloud','storage','advanced','display','records'];
for(const [file,entry]of Object.entries(settingsDelta.files)){
 const source=withoutHeroRestore(file,read(file)),before=withoutSettings225(file,source);
 assert.equal(hash(source),entry.afterHash,file+' reviewed UI source');
 assert.equal(hash(before),entry.beforeHash,file+' every unrelated byte retained');
 if(file.endsWith('.js'))new vm.Script(source,{filename:file});
 for(const regex of [/\b(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g,/\.(?:insert|update|delete|upsert)\([^\n]*/g,/2\.9\.15-safe-baseline-bootstrap/g,/(?:\?v=|HANI_DISPLAY_VERSION\s*=\s*["'])[^"'\s<]+/g])assert.deepEqual([...source.matchAll(regex)].map(m=>m[0]).sort(),[...before.matchAll(regex)].map(m=>m[0]).sort(),file+' writes/version unchanged');
}
check('exact UI delta + syntax + storage/Cloud write and version surfaces unchanged');
// An edit to a protected control or original notice cannot be hidden by normalization.
for(const [a,b]of [['id="resetBtn"','id="lostReset"'],['Local / Cloud 원본 보호 안내','lost notice']]){
 let rejected=false;try{rejected=hash(withoutSettings225('index.html',read('index.html').replace(a,b)))!==settingsDelta.files['index.html'].beforeHash}catch{rejected=true}assert.ok(rejected,a);
}
check(await verifySettingsStatusProjection(read('hani-main.js'),read('hani-drive-vault.js')));
check(verifySettingsMarkup(read('index.html'),withoutSettings225('index.html',read('index.html')),plan));
if(process.argv.includes('--static')){
 console.log('PASS (Node only): '+result.checks.join('\nPASS: ')+'\nBrowser checks not run');
 process.exit(0);
}
let browser;
async function create(before=false,width=1440){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',timezoneId:'Asia/Seoul'});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.origin!==origin)return route.fulfill({status:200,body:''});
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:''});
  let body=fs.readFileSync(file);const relative=path.relative(root,file).replaceAll('\\','/');
  if(before&&settingsDelta.files[relative])body=Buffer.from(withoutSettings225(relative,body.toString('utf8')));
  return route.fulfill({body,contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});
 });
 await context.addInitScript(()=>{
  window.__writes=[];window.__clicks=[];window.__listenerShapes=[];
  const add=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type,fn,options){
   if(type==='click'&&typeof fn==='function'&&this instanceof Element){const el=this,original=fn;window.__listenerShapes.push({id:el.id,shape:String(fn)});fn=function(event){window.__clicks.push(el.id||el.getAttribute('data-view')||el.tagName);return original.call(this,event)}}
   return add.call(this,type,fn,options);
  };
  for(const key of ['setItem','removeItem','clear']){const original=Storage.prototype[key];Storage.prototype[key]=function(...args){window.__writes.push({key:args[0],method:key});return original.apply(this,args)}}
 });
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 await page.goto(origin);await page.waitForFunction(()=>typeof renderStoragePanel==='function');
 await page.evaluate(()=>{unlockLoginGate();showView('settings')});
 return {context,page};
}
async function fixture(page){
 await page.evaluate(()=>{
  // Only in-memory synthetic state, and original markup builders for conditional IDs.
  state.ledgerMonths=[{month:today().slice(0,7),targetT:100000}];renderGoalRegistry();
  $('goalRegistryForm').elements.metric_id.value='spending_jispi_krw';renderGoalBudgetSuggestion();
  $('goalRegistryPreview').innerHTML=goalRegistryActions('승인하고 저장');bindGoalRegistryPreview();
  dataHubLibraryTab='export';renderDataHubLibrary();
 });
}
async function shapes(page){return page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#settings button,#settings input,#settings textarea,#settings select,#settings form')].filter(e=>e.id).map(e=>[e.id,{attrs:[...e.attributes].map(a=>[a.name,a.value]).filter(a=>!['disabled','style','value'].includes(a[0])),click:e.onclick?String(e.onclick):null,change:e.onchange?String(e.onchange):null,input:e.oninput?String(e.oninput):null,submit:e.onsubmit?String(e.onsubmit):null}])))}
try{
 const {chromium}=require(path.join(path.dirname(pw),'index.js'));
 browser=await chromium.launch({executablePath,headless:true});
 const baseline=await create(true),candidate=await create();const page=candidate.page;
 await fixture(baseline.page);await fixture(page);
 const old=await shapes(baseline.page),now=await shapes(page);
 assert.deepEqual(now,old,'all original control attrs, property handlers and conditional handlers preserved');
 const oldListeners=await baseline.page.evaluate(()=>__listenerShapes.filter(r=>r.id&&document.querySelector('#settings')?.contains(document.getElementById(r.id))));
 const newListeners=await page.evaluate(()=>__listenerShapes.filter(r=>r.id&&document.querySelector('#settings')?.contains(document.getElementById(r.id))));assert.deepEqual(newListeners,oldListeners,'same original event registration owners');
 check('all existing control attributes / onclick / change / input / submit / registered handlers equal baseline');
 for(const {id,group}of mappings){
  const target=page.locator('[id="'+id+'"]');assert.equal(await target.count(),1,id+' exactly once in its renderer state');
  const at=await target.evaluate(e=>e.closest('.settings-group')?.id||(e.id!=='policy'&&e.closest('#policy')?'policy':'common'));
  const expected=/^[①②③④⑤⑥]/.test(group)?'group-'+groups['①②③④⑤⑥'.indexOf(group[0])]:group==='사내 규칙'?'policy':'common';
  // Existing storage detail belongs to the top status projection, not a control group.
  assert.equal(at,expected,id+' planned group');result.mapping.push({id,group:at});
 }
 check('every mapped static + conditional ID exactly once and in its planned group');
 // Close/open native groups and keyboard toggles must preserve node/listener identity and storage.
 const toggles=await page.evaluate(async()=>{
  const controls=[...document.querySelectorAll('#settings button,#settings input')],handlers=controls.map(e=>e.onclick);
  localStorage.setItem('hani_os_life_v23',JSON.stringify({...freshState(),books:[{id:'synthetic-preserved',title:'fixture'}]}));
  const raw=localStorage.getItem('hani_os_life_v23');__writes=[];
  for(const d of document.querySelectorAll('.settings-group')){d.open=true;d.open=false;d.open=true}
  await new Promise(r=>setTimeout(r,80));
  return {rawSame:raw===localStorage.getItem('hani_os_life_v23'),writes:__writes,identity:controls.every((e,i)=>e.isConnected&&e.onclick===handlers[i])};
 });assert.deepEqual(toggles,{rawSame:true,writes:[],identity:true});
 await page.locator('#group-display>summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#group-display').evaluate(e=>e.open),false);
 await page.evaluate(()=>{document.querySelector('#group-backup').open=false;selectSettingsTab('policy');selectSettingsTab('data')});assert.equal(await page.locator('#group-backup').evaluate(e=>e.open),false,'session DOM state survives settings tab switch');
 check('native keyboard + session disclosures retain nodes/listeners, zero storage writes and byte-identical protected key');
 // Missing and known status projections use the same original owners, no new probes.
 const statuses=await page.evaluate(()=>{
  state.meta.lastBackupAt='';lastSaveResult=null;cloudRuntime={...cloudRuntime,status:'',tone:'warn'};renderStoragePanel();
  const missing=['settingsSaveStatus','settingsCloudStatus','settingsBackupStatus','settingsPhotoStatus'].map(id=>$(id).textContent);
  lastSaveResult={ok:true};renderStoragePanel();const good=$('settingsSaveStatus').textContent;
  lastSaveResult={ok:false};renderStoragePanel();const failed=$('settingsSaveStatus').textContent;
  loadRecovery.active=true;renderStoragePanel();const protectedText=$('settingsSaveStatus').textContent;loadRecovery.active=false;
  state.meta.lastBackupAt='2026-10-20T10:00:00Z';renderCloudPanel();const backup=$('settingsBackupStatus').textContent;
  const media=window.HANI_MEDIA;window.HANI_MEDIA={...media,dryRunReport:()=>({count:0,inlineBytes:0,estimatedAfterBytes:100})};renderMediaPreview();const complete=$('settingsMediaStatus').textContent;
  window.HANI_MEDIA={...media,dryRunReport:()=>null};renderMediaPreview();const unknown=$('settingsMediaStatus').textContent;window.HANI_MEDIA=media;
  return {missing,good,failed,protectedText,backup,complete,unknown};
 });assert.deepEqual(statuses.missing,['확인 전','확인 전','확인 전','확인 전']);assert.equal(statuses.good,'저장 정상');assert.equal(statuses.failed,'저장 실패');assert.equal(statuses.protectedText,'원본 보호 중');assert.notEqual(statuses.backup,'확인 전');assert.equal(statuses.complete,'완료됨');assert.equal(statuses.unknown,'확인 전');
 check('unknown / saved / failed / protected / backup / zero-inline-image projections');
 const history=await page.evaluate(async()=>{
  const original=safetyArchiveList,vault=window.HANI_DRIVE_VAULT;
  try{
   state.meta.lastBackupAt='';window.HANI_DRIVE_VAULT={...vault,readStatus:()=>({lastAt:null})};
   safetyArchiveList=async()=>[{id:1,verified:true,payload:{savedAt:'2026-10-19T10:00:00Z',state:freshState()}},{id:2,verified:false,payload:{savedAt:'2026-10-21T10:00:00Z',state:freshState()}}];
   await renderSafetyArchive();return {at:$('settingsBackupStatus').dataset.backupAt,downloads:$('safetyArchiveList').querySelectorAll('button').length};
  }finally{safetyArchiveList=original;window.HANI_DRIVE_VAULT=vault}
 });assert.deepEqual(history,{at:String(Date.parse('2026-10-19T10:00:00Z')),downloads:1});
 check('existing backup history projection accepts verified records only, no additional history query');
 // Spy each original actionable property handler and call through. IO dependencies are
 // synthetic boundaries; handlers themselves are the original baseline-equal functions.
 await fixture(page);
 const invoked=await page.evaluate(async()=>{
  const rows=[];window.confirm=()=>false;window.alert=()=>{};
  exportData=()=>{rows.push({dependency:'exportData'});return true};
  save=()=>({ok:false,message:'synthetic no-write'});
  downloadJson=()=>{};downloadRecoveryOriginal=()=>{};
  const ids=[...document.querySelectorAll('#settings button[id]')].filter(e=>e.onclick&&!['resetBtn','mediaCApprove','goalRegistryApprove','cloudFirstCopy','cloudRestore','cloudChoiceLocal','cloudChoiceCloud','cloudEmergencyRestoreInvestment','cloudEmergencyUndo','cloudEmergencyPromote'].includes(e.id)).map(e=>e.id);
  for(const id of ids){
   renderGoalRegistry();$('goalRegistryForm').elements.metric_id.value='spending_jispi_krw';renderGoalBudgetSuggestion();
   $('goalRegistryPreview').innerHTML=goalRegistryActions('승인하고 저장');bindGoalRegistryPreview();dataHubLibraryTab='export';renderDataHubLibrary();
   const e=$(id);if(!e)throw Error('Missing action fixture '+id);const original=e.onclick,disabled=e.disabled;e.disabled=false;let calls=0;e.onclick=function(event){calls++;return original.call(this,event)};
   // Existing disabled/security guards and empty input validations remain active.
   e.click();await new Promise(r=>setTimeout(r,0));e.onclick=original;e.disabled=disabled;rows.push({id,calls});
  }
  return rows;
 });
 for(const row of invoked.filter(r=>r.id))assert.equal(row.calls,1,row.id+' original handler called');result.handlers=invoked;
 assert.ok(invoked.some(r=>r.dependency==='exportData'),'export button still invokes existing export owner');
 const changes=await page.evaluate(async()=>{
  const rows=[];for(const e of document.querySelectorAll('#settings input[id],#settings select[id],#settings textarea[id]'))for(const type of ['input','change']){
   const original=e['on'+type];if(!original)continue;let calls=0;e['on'+type]=function(event){calls++;return original.call(this,event)};e.dispatchEvent(new Event(type,{bubbles:true}));await new Promise(r=>setTimeout(r,0));e['on'+type]=original;rows.push({id:e.id,type,calls});
  }return rows;
 });for(const row of changes)assert.equal(row.calls,1,row.id+' original '+row.type);result.handlers.push(...changes);
 // Native fields without listeners keep their baseline focus/edit behaviour.
 assert.equal(now.cloudEmail.click,null);assert.equal(now.cloudPassword.click,null);
 // The original recovery-cancel handler intentionally locks the login gate.
 // Restore the synthetic session before exercising the next independent control.
 await page.evaluate(()=>{unlockLoginGate();showView('settings');$('group-display').open=true});
 await page.locator('#group-display [data-view="aura"]').click();assert.equal(await page.locator('#aura').evaluate(e=>e.classList.contains('active')),true,'original theme route');
 await page.evaluate(()=>{showView('settings');selectSettingsTab('data')});await page.locator('#settings-tab-policy').click();assert.equal(await page.locator('#policy').isVisible(),true);await page.locator('#settings-tab-data').click();
 // Controls intentionally unbound/hidden in the baseline remain unbound/hidden.
 for(const id of ['cloudEmergencyRefresh','cloudEmergencyDownload','cloudEmergencyRestoreInvestment','cloudEmergencyUndo','cloudEmergencyPromote'])assert.equal(now[id].click,null,id+' no new legacy handler');
 check('non-destructive button handlers call through with spies; unbound legacy controls remain unbound');
 // Actual existing confirmation owners: cancel the reset, Cloud full-source selection,
 // B/C/rollback dialogs; no approval, backup, write or Cloud mutation is performed.
 const confirmations=await page.evaluate(async()=>{
  const messages=[];window.confirm=text=>{messages.push(text);return false};
  await $('resetBtn').onclick();
  const b=mediaBConfirm();const bd=$('mediaBDialog').open;$('mediaBDialog').close('cancel');const br=await b;
  const c=mediaCConfirm(false);const cd=$('mediaCDialog').open,required=$('mediaCDevices').required,disabled=$('mediaCApprove').disabled;$('mediaCDialog').close('cancel');const cr=await c;
  const r=mediaCConfirm(true);const rd=$('mediaCDialog').open;$('mediaCDialog').close('cancel');const rr=await r;
  return {messages,bd,br,cd,required,disabled,cr,rd,rr};
 });assert.match(confirmations.messages[0],/自動|자동 백업/);assert.equal(confirmations.bd,true);assert.equal(confirmations.br,false);assert.equal(confirmations.cd,true);assert.equal(confirmations.required,true);assert.equal(confirmations.disabled,true);assert.equal(confirmations.cr,false);assert.equal(confirmations.rd,true);assert.equal(confirmations.rr,false);
 for(const id of ['resetBtn','cloudFirstCopy','cloudRestore','cloudEmergencyRestoreInvestment','cloudEmergencyUndo','cloudEmergencyPromote'])assert.equal(await page.locator('#'+id).evaluate(e=>e.closest('.settings-group').id),'group-advanced');
 assert.equal(await page.locator('#cloudAdvanced').evaluate(e=>e.closest('#cloudBridgeCard')!==null),true);
 check('danger tools in group ④; reset and B/C/rollback existing confirmations cancel; Cloud descendant owner retained');
 const hoist=await page.evaluate(()=>{
  $('group-cloud').open=false;
  loginGateShowCloudTools(true);
  const shown={parent:$('cloudBridgeCard').parentNode.id,cloudOpen:$('group-cloud').open,images:getComputedStyle($('group-storage')).display,reset:getComputedStyle($('resetBtn').closest('.settings-reset-card')).display};
  loginGateShowCloudTools(true);loginGateShowCloudTools(false);
  return {shown,restored:$('cloudBridgeCard').closest('#settingsData')!==null,closed:!$('group-cloud').open};
 });assert.deepEqual(hoist,{shown:{parent:'loginGateCloudTools',cloudOpen:true,images:'none',reset:'none'},restored:true,closed:true});
 check('existing login gate hoists only Cloud tools visibly and restores session disclosure state');
 await baseline.context.close();await candidate.context.close();
 // Fresh, unmodified UI for layout, default state and visual evidence.
 for(const width of [390,1440])for(const theme of ['light','dark']){
  const t=await create(false,width),p=t.page;
  await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.finish=theme==='dark'?'midnight-black':'porcelain-cream';document.body.dataset.finishActive='true';cloudRuntime={...cloudRuntime,status:'',tone:'warn'};lastSaveResult=null;renderStoragePanel();$('group-cloud').open=false},theme);
  assert.deepEqual(await p.locator('.settings-group').evaluateAll(es=>es.map(e=>e.open)),[true,false,false,false,false,false]);
  await p.locator('#settingsData .settings-mini-nav a[href="#group-storage"]').click();assert.equal(await p.locator('#group-storage>summary').isVisible(),true);
  await p.evaluate(()=>scrollTo(0,0));
  for(const d of await p.locator('.settings-group').all()){await d.evaluate(e=>e.open=true);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,width+' '+theme+' group overflow')}
  const contrast=await p.locator('#settingsData').evaluate(root=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
   const rgba=s=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=s;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]},lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
   const failures=[];for(const el of root.querySelectorAll('*')){if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||!el.getClientRects().length||el.closest('[hidden],dialog:not([open])')||el.disabled)continue;
    const style=getComputedStyle(el);if(style.visibility==='hidden')continue;let bg=[255,255,255],ancestor=el,chain=[];while(ancestor){chain.push(ancestor);ancestor=ancestor.parentElement}for(const node of chain.reverse()){const c=rgba(getComputedStyle(node).backgroundColor),alpha=c[3]/255;bg=bg.map((v,i)=>c[i]*alpha+v*(1-alpha))}
    const fg=rgba(style.color);const alpha=fg[3]/255;const ink=fg.slice(0,3).map((v,i)=>v*alpha+bg[i]*(1-alpha));const a=lum(ink),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&parseFloat(style.fontWeight)>=700);
    if(ratio<(large?3:4.5))failures.push({id:el.id,tag:el.tagName,text:el.textContent.slice(0,55),ratio,fg:style.color,bg});
   }return failures;
  });assert.deepEqual(contrast,[],width+' '+theme+' visible text AA');
  // Logged-in/recovery classes retain their original descendant CSS scope.
  const css=await p.evaluate(()=>{const bridge=$('cloudBridgeCard');bridge.classList.add('cloud-logged-in');const login=getComputedStyle(document.querySelector('.cloud-login-form')).display;bridge.classList.remove('cloud-logged-in');bridge.classList.add('cloud-recovery-mode');const recovery=getComputedStyle($('cloudRecoveryPanel')).display;bridge.classList.remove('cloud-recovery-mode');return {login,recovery}});assert.equal(css.login,'none');assert.notEqual(css.recovery,'none');
  await p.evaluate(()=>{for(const d of document.querySelectorAll('.settings-group'))d.open=d.id==='group-backup';scrollTo(0,0)});
  // Omit the closed mobile Remote translated below the viewport from full-page captures.
  const file=`after-${width}${theme==='dark'?'-dark':''}.png`;await p.screenshot({path:path.join(out,file),fullPage:true,...(width===390?{style:'#haniContextRemote,.hani-remote-mobile-trigger{visibility:hidden!important}'}:{})});result.screenshots.push(file);
  const lines=await p.locator('.settings-drive-intro').evaluate(e=>e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight));assert.ok(lines<=2.05,width+' Drive intro at most two lines');
  check(width+' '+theme+': all groups no overflow / AA / Cloud CSS owner / default open state / Drive ≤2 lines');await t.context.close();
 }
 assert.deepEqual(result.errors,[],'no uncaught application errors');
 result.status='PASS';
}catch(error){result.status=/spawn EPERM/.test(error.message)?'BLOCKED':'FAIL';result.failure=error.stack;throw error}
finally{await browser?.close();fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log(result.status+': settings225 '+result.checks.length+' checks, '+result.mapping.length+' mapped IDs, '+result.handlers.filter(r=>r.id).length+' original handlers');}
