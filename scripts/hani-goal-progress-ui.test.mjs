import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const {chromium}=await import(pathToFileURL(process.argv[2]).href),root=path.resolve(import.meta.dirname,'..');
const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>fs.readFileSync(path.join(root,f))});
assert.deepEqual(closure.missing,[]);assert.ok(closure.files.includes('hani-goal-progress.js'),'generated period engine included in release closure');
const contract=JSON.parse(fs.readFileSync(path.join(root,'dev-center/one-pass-gate-contract.json'),'utf8'));assert.ok(contract.allowed_paths.some(pattern=>new RegExp(pattern).test('hani-goal-progress.js')),'existing release allowlist unchanged');
const server=http.createServer((req,res)=>{const uri=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(uri==='/'?'/index.html':decodeURIComponent(uri)));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')||file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');res.end(fs.readFileSync(file));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.argv[3],headless:true}),evidence=path.join(root,'artifacts/goal-progress');fs.mkdirSync(evidence,{recursive:true});
let count=0;
try{
 for(const width of [1440,390])for(const finish of ['porcelain-cream','midnight-black']){
  const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.waitForFunction(()=>!!window.HANI_GOAL_PROGRESS);
  await page.evaluate(finish=>{unlockLoginGate();showView('settings');document.documentElement.dataset.finish=finish;document.body.dataset.finishActive='true';},finish);
  const panel=page.locator('#goalProgressPanel');assert.match(await panel.innerText(),/원본 검증 대기/);assert.equal(await panel.locator('article').count(),0);
  assert.equal(await page.evaluate(()=>window.HANI_GOAL_PROGRESS.read({type:'quarter',year:2026,quarter:1})),null);
  // Simulated verified context only in this disposable test browser. No login/Cloud claims.
  await page.evaluate(()=>{window.goalStateBefore=JSON.stringify(state);window.goalLocalBefore=JSON.stringify({...localStorage});window.goalWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)window.goalWrites.push(k);return original.call(this,k,v)};
   window.originalGoalContext=goalPeriodReadContext;window.goalTestAllowed=true;
   goalPeriodReadContext=()=>window.goalTestAllowed?{source:{books:[{status:'read',completedDate:'2026-01-12'},{status:'read',completedDate:'2026-03-14'}],body:[{date:'2026-03-14',weight:85,bmi:27,fat:25}],exercise:[],learningQuizzes:[],ledgerMonths:[],investmentBrokerSnapshots:[],goalRegistry:[{goal_id:'bmi',revision:1,metric_id:'body_bmi',goal_type:'quarter',year:2026,quarter:1,value:25,unit:'kg/m²',semantics:'point_target',effective_from:'2026-01-01',effective_to:'2026-03-31',created_at:'2026-01-01T00:00:00+09:00',status:'active'}]},canonical:{brokerTotal:()=>0,ledgerSpending:()=>0},asOf:'2026-03-31',evaluationAt:'2026-03-31T12:00:00+09:00'}:null;
   window.HANI_GOAL_PROGRESS.render();
  });
  await page.locator('#goalProgressYear').fill('2026');await page.locator('#goalProgressYear').dispatchEvent('change');await page.locator('#goalProgressQuarter').selectOption('1');
  const bmi=panel.locator('article').filter({has:page.locator('h4',{hasText:/^BMI$/})});assert.match(await bmi.innerText(),/실적 27/);assert.match(await bmi.innerText(),/목표 25/);assert.match(await bmi.innerText(),/목표 대비 \+2/);
  assert.deepEqual(await page.evaluate(()=>{const x=window.HANI_GOAL_PROGRESS.read({type:'quarter',year:2026,quarter:1}).find(x=>x.definition.metric_id==='body_bmi');return [x.actual.value,x.progress.target,x.progress.gap]}),[27,25,2]);
  assert.equal(await panel.locator('article').count(),9);if(width===390)assert.ok((await bmi.boundingBox()).width>250,'mobile cards readable');assert.match(await panel.innerText(),/일부 기록/);
  await panel.scrollIntoViewIfNeeded();assert.ok(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await panel.screenshot({path:path.join(evidence,`${width}-${finish}.png`),style:'.ui26-top,#haniContextRemote,.hani-remote-mobile-trigger{visibility:hidden!important}'});
  await page.locator('#goalProgressType').selectOption('annual');assert.match(await bmi.innerText(),/목표 —/);assert.equal(await page.locator('#goalProgressQuarter').isVisible(),false);
  await page.evaluate(()=>{window.goalTestAllowed=false;window.HANI_GOAL_PROGRESS.render()});assert.match(await panel.innerText(),/원본 검증 대기/);assert.equal(await panel.locator('article').count(),0);
  assert.deepEqual(await page.evaluate(()=>({same:JSON.stringify(state)===window.goalStateBefore,local:JSON.stringify({...localStorage})===window.goalLocalBefore,writes:window.goalWrites})),{same:true,local:true,writes:[]});
  await page.evaluate(()=>{goalPeriodReadContext=window.originalGoalContext;window.HANI_GOAL_PROGRESS.render()});assert.match(await panel.innerText(),/원본 검증 대기/);
  assert.deepEqual(errors,[]);count++;await context.close();
 }
 console.log(`PASS ${count} actual-app synthetic UI combinations, blocked→simulated verified→blocked, quarter/annual controls, mobile overflow, no state/localStorage writes; runtime module closure complete. Real login/Cloud unverified.`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
