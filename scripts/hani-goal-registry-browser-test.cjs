'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync(path.join(__dirname,'../hani-main.js'),'utf8');
const code=source.slice(source.indexOf('const GOAL_METRICS='),source.indexOf('function toast('));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.setContent('<div id="goalRegistryContent"></div>');
await page.addScriptTag({content:`let state={books:[{id:'preserved'}]},writes=0;const $=id=>document.getElementById(id),today=()=> '2026-10-05',uid=()=> 'goal-test',esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),save=()=>{writes++;return {ok:true}},dataHubInvalidate=()=>{},dataHubRefresh=()=>{};${code};renderGoalRegistry();window.goalProbe=()=>({writes,state:JSON.parse(JSON.stringify(state))});`});
await page.locator('[name="value"]').fill('100');await page.getByRole('button',{name:'변경 Preview'}).click();
assert.equal((await page.evaluate(()=>goalProbe())).writes,0);assert.equal((await page.evaluate(()=>goalProbe())).state.goalRegistry,undefined);
await page.getByRole('button',{name:'취소',exact:true}).click();assert.equal((await page.evaluate(()=>goalProbe())).writes,0);
await page.getByRole('button',{name:'변경 Preview'}).click();await page.getByRole('button',{name:'승인하고 저장'}).click();
const saved=await page.evaluate(()=>goalProbe());assert.equal(saved.writes,1);assert.equal(saved.state.goalRegistry.length,1);assert.deepEqual(saved.state.books,[{id:'preserved'}]);
await page.evaluate(()=>{document.getElementById('goalRegistryApprove')?.click();});assert.equal((await page.evaluate(()=>goalProbe())).writes,1);
await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
console.log('PASS: Preview/cancel writes 0, approval saves once, duplicate click no extra write, original data preserved, 390px no overflow, console 0');
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
