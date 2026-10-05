'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync(path.join(__dirname,'../hani-main.js'),'utf8');
const code=source.slice(source.indexOf('let dataHubLibraryTab='),source.indexOf('function renderStoragePanel()'));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.setContent('<div id="dataHubLibraryContent"></div>');
await page.addScriptTag({content:`const state={goalRegistry:[]},$=id=>document.getElementById(id),today=()=> '2026-10-05',esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),won=x=>String(x)+'원',officialBrokerSorted=()=>[{period:'2026-09',snapshotDate:'2026-09-30',accounts:[]}],brokerCalc=()=>({total:540463}),brokerAggregatedHoldings=()=>[{key:'KR:123',name:'ETF',quantity:4,hasEvaluation:true,evaluation:540463}],dataHubRuntime={peek:()=>({status:'OWNER_BINDING_BLOCKED'})};${code};renderDataHubLibrary();`});
await page.getByRole('button',{name:'Monthly',exact:true}).click();assert.match(await page.locator('#dataHubLibraryContent').innerText(),/540463원/);
await page.getByRole('button',{name:'Metrics',exact:true}).click();assert.match(await page.locator('#dataHubLibraryContent').innerText(),/원본 검증 대기/);
await page.getByRole('button',{name:'Goals',exact:true}).click();await page.getByRole('button',{name:'Export',exact:true}).click();
const download=page.waitForEvent('download');await page.getByRole('button',{name:'JSON 다운로드'}).click();assert.match((await download).suggestedFilename(),/hani-data-hub.*json/);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
console.log('PASS: Data Hub navigation, confirmed monthly row, owner verification warning, JSON download, 390px overflow 0, page errors 0');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
