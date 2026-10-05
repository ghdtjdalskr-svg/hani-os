'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync(require('node:path').join(__dirname,'../hani-main.js'),'utf8');
const code=source.slice(source.indexOf('const GOAL_METRICS='),source.indexOf('function toast('));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<div id="goalRegistryContent"></div>');
  await page.addScriptTag({content:`let state={weights:[{value:98}],books:[{id:'keep'}],goalRegistry:[{goal_id:'demo',revision:1,metric_id:'body_weight_kg',goal_type:'quarter',year:2027,quarter:1,value:94,unit:'kg',effective_from:'2027-01-01',effective_to:'2027-03-31',status:'active'},{goal_id:'other',revision:1,metric_id:'books_completed_count',goal_type:'annual',year:2027,value:12,unit:'book',status:'active'}]},writes=0,fail=false;
  const $=id=>document.getElementById(id),today=()=> '2026-10-05',uid=()=> 'test',esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),save=()=>{writes++;return {ok:!fail}},dataHubInvalidate=()=>{},dataHubRefresh=()=>{};
  ${code};renderGoalRegistry();window.probe=()=>({writes,state:structuredClone(state)});window.setFail=x=>fail=x;`});
  const before=await page.evaluate(()=>probe());
  await page.locator('details summary').click();
  await page.locator('details p').filter({hasText:'94 kg'}).getByRole('button').click();
  assert.deepEqual(await page.evaluate(()=>probe()),before);
  if(process.env.GOAL_QA_SCREENSHOTS){
   await page.screenshot({path:'goal-delete-preview-390.png',fullPage:true});
   await page.setViewportSize({width:1200,height:900});
   await page.screenshot({path:'goal-delete-preview-desktop.png',fullPage:true});
   await page.setViewportSize({width:390,height:844});
  }
  await page.getByRole('button',{name:'취소',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>probe()),before);
  await page.locator('details p').filter({hasText:'94 kg'}).getByRole('button').click();
  await page.evaluate(()=>setFail(true));
  await page.getByRole('button',{name:'승인하고 삭제'}).click();
  assert.deepEqual((await page.evaluate(()=>probe())).state,before.state);
  await page.evaluate(()=>setFail(false));
  await page.locator('details p').filter({hasText:'94 kg'}).getByRole('button').click();
  const retained=await page.getByRole('button',{name:'승인하고 삭제'}).elementHandle();
  await page.getByRole('button',{name:'승인하고 삭제'}).click();
  const after=await page.evaluate(()=>probe());
  assert.equal(after.writes,2);assert.equal(after.state.goalRegistry.length,1);
  assert.equal(after.state.goalRegistry[0].goal_id,'other');
  assert.deepEqual(after.state.weights,before.state.weights);assert.deepEqual(after.state.books,before.state.books);
  await retained.evaluate(el=>el.click());assert.equal((await page.evaluate(()=>probe())).writes,2);
  await page.locator('[name="value"]').fill('100');
  await page.getByRole('button',{name:'변경 Preview',exact:true}).click();
  assert.equal((await page.evaluate(()=>probe())).writes,2);
  await page.getByRole('button',{name:'승인하고 저장',exact:true}).click();
  assert.equal((await page.evaluate(()=>probe())).writes,3);
  assert.equal((await page.evaluate(()=>probe())).state.goalRegistry.length,2);
  assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  console.log('PASS: delete Preview/cancel write 0; failed save rollback; approved delete save once; duplicate click no write; unrelated data preserved; 390px/console 0');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
