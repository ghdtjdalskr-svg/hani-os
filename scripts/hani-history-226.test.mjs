// node scripts/hani-history-226.test.mjs [--unit-only] [--before] [--cdp=http://127.0.0.1:9226]
// Browser fixtures use the real history catalog, roster, newspaper module and manifest.
// The additional third-month/approval cases below are explicitly synthetic boundary tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {textContrastAudit} from './hani-contrast-audit.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/history-226');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const hub=read('hani-organization-hub.js'),clock=Date.parse('2026-10-21T03:00:00Z');
const fixture=vm.createContext({window:{},document:{querySelector:()=>null,getElementById:()=>null,readyState:'loading',addEventListener(){}},setTimeout:()=>0});
vm.runInContext(read('hani-development-history-v1.js'),fixture);
vm.runInContext(hub,fixture); // No host: publishes the actual roster, then returns.
vm.runInContext(read('hani-ilbo.js'),fixture);
const catalog=JSON.parse(read('assets/data/hani-history-releases-v1.json'));
export const historyFixture=catalog.entries;
const roster=fixture.window.HaniOrganizationRoster;
const manifest=JSON.parse(read('data/hani-ilbo/issues.json'));
const expected=historyFixture.filter(r=>/^v\d/.test(r.id)&&['released','pages'].includes(r.status)&&r.date<='2026-10-21').sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id,undefined,{numeric:true}));
const milestoneIds=['v2.9.222','v2.9.215','v2.9.213','v2.9.135','v2.9.132','v2.9.120'];

export function createHistoryHarness({history=historyFixture,now=clock,failManifest=false,failReleases=false,preload=true,people=roster.people}={}){
  const nodes={},writes=[],requests=[],listeners=new Map(),mutations={mount:0,months:0,counts:0,details:0};let click;
  const slot={querySelector:s=>nodes[s]||null,querySelectorAll:()=>nodes['.ogh-history-months']?.months||[],set innerHTML(value){
    mutations.mount++;this.markup=value;
    for(const name of ['.ogh-history','.ogh-history-counts','.ogh-history-months','.ogh-overview-details','[data-history-more]']){
      nodes[name]={markup:'',months:[],attributes:{},setAttribute(k,v){this.attributes[k]=v},set innerHTML(html){
        this.markup=html;mutations[name==='.ogh-history-months'?'months':name==='.ogh-history-counts'?'counts':'details']++;
        if(name==='.ogh-history-counts')nodes['[data-history-ilbo] strong']={get textContent(){return nodes[name].markup.match(/하니일보 <strong>([^<]+)/)[1]},set textContent(value){nodes[name].markup=nodes[name].markup.replace(/(하니일보 <strong>)[^<]+/,'$1'+value)}};
        if(name==='.ogh-history-months')this.months=[...html.matchAll(/<section class="ogh-history-month"[^>]*data-history-month="([^"]+)"([^>]*)>([\s\S]*?)<\/section>/g)].map(m=>{
          const entries=[...m[3].matchAll(/<li class="ogh-history-entry([^"]*)" data-history-release="([^"]+)"([^>]*)>/g)].map(r=>({id:r[2],milestone:r[1].includes('is-milestone'),overflow:r[3].includes('data-history-overflow'),hidden:/ hidden/.test(r[3])}));
          const match=m[3].match(/<button type="button"[^>]*data-history-month-more="([^"]+)" data-history-hidden-count="(\d+)"[^>]*>([^<]+)<\/button>/);
          const toggle=match?{dataset:{historyMonthMore:match[1],historyHiddenCount:match[2]},attributes:{},textContent:match[3],hasAttribute:k=>k==='data-history-month-more',setAttribute(k,v){this.attributes[k]=v}}:null;
          return {dataset:{historyMonth:m[1]},hidden:/ hidden/.test(m[2]),entries,toggle,querySelector:()=>toggle,querySelectorAll:()=>entries.filter(r=>r.overflow)};
        });
      }};
    }
  }};
  const context=vm.createContext({window:{HANI_DEVELOPMENT_HISTORY_V1:{entries:history},HaniOrganizationRoster:{people},addEventListener(type,fn){listeners.set(type,fn)},dispatchEvent(event){listeners.get(event.type)?.()}},state:{boardPosts:[],boardComments:[]},Event,
    document:{getElementById:()=>null,querySelector:()=>null,readyState:'loading',addEventListener(){}},
    Date:class extends Date{static now(){return now}},root:{querySelector:()=>slot,contains:()=>true,addEventListener(type,fn){if(type==='click')click=fn}},
    localStorage:{setItem:(...args)=>writes.push(args),removeItem:(...args)=>writes.push(args),clear:()=>writes.push('clear')},
    fetch:async url=>{requests.push(url);return {ok:url.includes('hani-history-releases')?!failReleases:!failManifest,json:async()=>url.includes('hani-history-releases')?{schema:1,entries:history}:manifest}},teamOf:()=>({name:'전략기획실'})});
  vm.runInContext(read('hani-ilbo.js'),context);
  vm.runInContext(hub.match(/  const esc =[^\n]+/)[0]+'\n'+hub.slice(hub.indexOf('  const portraitFiles='),hub.indexOf('  const avatar ='))+'\n'+hub.slice(hub.indexOf('  function organizationOverviewData'),hub.indexOf('  function renderTeamPanels')),context);
  if(preload)vm.runInContext('historyReleases='+JSON.stringify(history)+';historyReleasesRequested=true;',context);
  vm.runInContext(hub.slice(hub.indexOf("  root.addEventListener('click',"),hub.indexOf("  dialog.addEventListener('click',")),context);
  // Let the real newspaper owner load its catalog after the initial unknown chip.
  Promise.resolve().then(()=>context.window.HaniIlbo?.enter());
  return {context,nodes,slot,writes,requests,mutations,render:()=>context.renderOverview(),toggle(month){const button=month?nodes['.ogh-history-months'].months.find(n=>n.dataset.historyMonth===month).toggle:{hasAttribute:n=>n==='data-history-more'};assert.ok(button,'toggle exists');click({target:{closest:()=>button}})}};
}

async function unit(){
  const h=createHistoryHarness(),source=JSON.stringify(historyFixture);h.render();
  assert.equal(expected.length,95);assert.equal(expected[0].id,'v2.9.223');
  for(const r of historyFixture){assert.match(r.title,/[가-힣]/);assert.ok([...r.title].length<=24,r.title);assert.match(r.source.commit,/^[a-f0-9]{40}$/);assert.ok(r.category);for(const id of r.credits)assert.ok(roster.people.some(p=>p.id===id));}
  for(let n=185;n<=223;n++)assert.ok(expected.some(r=>r.id==='v2.9.'+n),'missing documented release '+n);
  for(const n of [177,178,180,181,183,184])assert.ok(expected.some(r=>r.id==='v2.9.'+n));
  assert.deepEqual(catalog.excluded[0].versions,['v2.9.176','v2.9.179','v2.9.182'],'no candidate-only releases invented');
  assert.match(h.nodes['.ogh-history-counts'].markup,/하니일보 <strong>—/,'unknown until the newspaper owner is ready');
  const rowIdentity=h.nodes['.ogh-history-months'].months[0];
  const chipIdentity=h.nodes['[data-history-ilbo] strong'];
  await new Promise(setImmediate);
  const html=h.nodes['.ogh-history-months'].markup;
  assert.deepEqual([...html.matchAll(/data-history-release="([^"]+)"/g)].map(m=>m[1]),expected.map(r=>r.id));
  assert.deepEqual(h.nodes['.ogh-history-months'].months.map(n=>n.dataset.historyMonth),['2026-10','2026-09']);
  assert.deepEqual([...html.matchAll(/class="ogh-history-entry is-milestone" data-history-release="([^"]+)"/g)].map(m=>m[1]),milestoneIds);
  for(const section of html.split('<section class="ogh-history-month"').slice(1))assert.ok((section.match(/is-milestone/g)||[]).length<=3);
  assert.deepEqual([...html.matchAll(/<h4>([^<]+)<\/h4>/g)].map(m=>m[1]),expected.map(r=>r.title));
  assert.doesNotMatch(html,/Mobile Controls|Canonical Holding Contract|Library · Watch/);
  assert.match(h.nodes['.ogh-history-counts'].markup,new RegExp('릴리스 <strong>'+expected.length));
  assert.match(h.nodes['.ogh-history-counts'].markup,/직원 <strong>17<\/strong>명/);
  assert.match(h.nodes['.ogh-history-counts'].markup,/하니일보 <strong>1<\/strong>호/,'future issue excluded');
  assert.equal(h.mutations.months,1,'manifest count resolution retains timeline DOM');
  assert.equal(h.nodes['.ogh-history-months'].months[0],rowIdentity);
  assert.equal(h.nodes['[data-history-ilbo] strong'],chipIdentity,'ready updates the persistent chip text only');assert.equal(h.mutations.counts,1);
  assert.deepEqual(h.requests,['data/hani-ilbo/issues.json'],'the newspaper alone fetches its existing catalog');
  const requests=h.requests.length;h.context.window.HaniIlbo.publishedCount();assert.equal(h.requests.length,requests,'read-only getter does not fetch');
  for(let i=0;i<5;i++)h.render();
  assert.equal(h.mutations.mount,1);assert.equal(h.mutations.months,1);assert.equal(h.mutations.details,1);
  assert.equal(h.nodes['[data-history-more]'].hidden,true,'real catalog has only two months');
  const monthCounts=[];
  for(const month of h.nodes['.ogh-history-months'].months){
    const regular=month.entries.filter(r=>!r.milestone),visible=month.entries.filter(r=>!r.hidden),hiddenCount=Math.max(0,regular.length-5);
    assert.deepEqual(visible.filter(r=>!r.milestone).map(r=>r.id),regular.slice(0,5).map(r=>r.id),'latest five regular releases, independent of milestones');
    assert.equal(visible.length,month.entries.filter(r=>r.milestone).length+Math.min(5,regular.length));
    assert.ok(month.entries.filter(r=>r.milestone).every(r=>!r.hidden),'all milestones remain visible');
    assert.equal(month.toggle.textContent,'이 달 '+hiddenCount+'건 더 보기');assert.equal(month.toggle.attributes['aria-expanded'],'false');
    monthCounts.push({month:month.dataset.historyMonth,total:month.entries.length,visible:visible.length,collapsed:hiddenCount});
  }
  assert.deepEqual(monthCounts,[{month:'2026-10',total:74,visible:8,collapsed:66},{month:'2026-09',total:21,visible:8,collapsed:13}]);
  const [october,september]=h.nodes['.ogh-history-months'].months,firstEntry=october.entries[0],octoberButton=october.toggle;
  for(let i=0;i<2;i++){
    h.toggle('2026-10');assert.equal(october.entries.filter(r=>!r.hidden).length,74);assert.equal(octoberButton.attributes['aria-expanded'],'true');assert.equal(octoberButton.textContent,'이 달 접기');
    assert.equal(september.entries.filter(r=>!r.hidden).length,8,'months expand independently');h.render();
    h.toggle('2026-10');assert.equal(october.entries.filter(r=>!r.hidden).length,8);assert.equal(octoberButton.attributes['aria-expanded'],'false');assert.equal(octoberButton.textContent,'이 달 66건 더 보기');
  }
  assert.equal(october.entries[0],firstEntry);assert.equal(october.toggle,octoberButton);assert.equal(h.mutations.months,1,'toggle retains month, entry and button slots');
  assert.doesNotMatch(html,/ogh-history-approved/,'real catalog has no completed chairman launch approval');
  assert.match(html,/thumb\/hani-profile-dohyun-128.webp/,'explicit implementation credit');
  assert.match(html,/thumb\/hani-profile-serin-128.webp/,'explicit review credit');
  assert.doesNotMatch(html,/thumb\/hani-profile-(?:yuna|daon|yoonseul)/,'feature and portrait mentions are not credits');
  assert.equal((html.match(/ogh-history-credit"/g)||[]).length,2);
  assert.doesNotMatch(html,/thumb\/hani-profile-hani/,'brand HANI must not imply personal credit');
  for(const src of html.matchAll(/src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,src[1])));
  assert.equal(JSON.stringify(historyFixture),source);assert.deepEqual(h.writes,[]);
  const missing=createHistoryHarness({failManifest:true});missing.render();await new Promise(setImmediate);
  assert.match(missing.nodes['.ogh-history-counts'].markup,/하니일보 <strong>—/);
  const early=createHistoryHarness(),ilbo=early.context.window.HaniIlbo;delete early.context.window.HaniIlbo;early.render();await new Promise(setImmediate);
  assert.match(early.nodes['.ogh-history-counts'].markup,/하니일보 <strong>—/,'later newspaper script stays unknown without a second fetch');
  assert.deepEqual(early.requests,[]);
  const earlyRows=early.nodes['.ogh-history-months'].months[0],earlyChip=early.nodes['[data-history-ilbo] strong'];early.context.window.HaniIlbo=ilbo;await ilbo.enter();
  assert.match(early.nodes['.ogh-history-counts'].markup,/하니일보 <strong>1<\/strong>호/,'owner ready event updates the existing slot');
  assert.equal(early.nodes['.ogh-history-months'].months[0],earlyRows);assert.equal(early.mutations.mount,1);
  assert.equal(early.nodes['[data-history-ilbo] strong'],earlyChip);assert.equal(early.mutations.counts,1);
  const empty=createHistoryHarness({history:[]});empty.render();assert.match(empty.nodes['.ogh-history-months'].markup,/아직 없습니다/);
  const asyncCatalog=createHistoryHarness({preload:false});asyncCatalog.render();assert.match(asyncCatalog.nodes['.ogh-history-counts'].markup,/릴리스 <strong>—/);await new Promise(setImmediate);
  assert.match(asyncCatalog.nodes['.ogh-history-counts'].markup,/릴리스 <strong>95/);assert.match(asyncCatalog.nodes['.ogh-history-months'].markup,/v2.9.223/);
  const unavailable=createHistoryHarness({preload:false,failReleases:true});unavailable.render();await new Promise(setImmediate);
  assert.match(unavailable.nodes['.ogh-history-counts'].markup,/릴리스 <strong>—/);assert.match(unavailable.nodes['.ogh-history-months'].markup,/불러오지 못했습니다/);
  const invalid=createHistoryHarness({preload:false,history:[{...expected[0],date:'2026-02-30'}]});invalid.render();await new Promise(setImmediate);assert.match(invalid.nodes['.ogh-history-months'].markup,/불러오지 못했습니다/);
  const english=createHistoryHarness({preload:false,history:[{...expected[0],title:'Engineering Release'}]});english.render();await new Promise(setImmediate);assert.match(english.nodes['.ogh-history-months'].markup,/불러오지 못했습니다/);
  const mentioned=createHistoryHarness({history:[{...expected[0],title:'도연·세린·유나 화면',credits:[]}]});mentioned.render();assert.doesNotMatch(mentioned.nodes['.ogh-history-months'].markup,/ogh-history-credit/);
  const beforeIssue=createHistoryHarness({now:Date.parse('2026-10-18T14:59:59Z')});beforeIssue.render();await new Promise(setImmediate);assert.match(beforeIssue.nodes['.ogh-history-counts'].markup,/하니일보 <strong>0/);
  const published=createHistoryHarness({now:Date.parse('2026-10-18T15:00:00Z')});published.render();await new Promise(setImmediate);assert.match(published.nodes['.ogh-history-counts'].markup,/하니일보 <strong>1/);
  const nextIssue=createHistoryHarness({now:Date.parse('2026-10-25T15:00:00Z')});nextIssue.render();await new Promise(setImmediate);assert.match(nextIssue.nodes['.ogh-history-counts'].markup,/하니일보 <strong>2/);
  // Synthetic boundaries, never shipped as release data or used in screenshots.
  const boundary=historyFixture.map((r,i)=>i===historyFixture.length-1?{...r,date:'2026-08-15'}:r);
  const older=createHistoryHarness({history:[...boundary,boundary[0],{id:'v9',status:'released',date:'2027-01-01',title:'future'}]});older.render();
  assert.deepEqual(older.nodes['.ogh-history-months'].months.map(n=>n.hidden),[false,false,true]);
  const oldMonth=older.nodes['.ogh-history-months'].months[2];older.toggle();assert.equal(oldMonth.hidden,false);assert.equal(older.nodes['[data-history-more]'].attributes['aria-expanded'],'true');
  older.toggle('2026-09');const septemberButton=older.nodes['.ogh-history-months'].months[1].toggle;
  older.toggle();assert.equal(oldMonth.hidden,true);assert.equal(older.mutations.months,1);assert.deepEqual(older.writes,[]);
  assert.equal(septemberButton.attributes['aria-expanded'],'true','older-month visibility does not reset monthly expansion');
  for(const count of [1,5,6]){
    const f=createHistoryHarness({history:expected.slice(0,count).map((r,i)=>({...r,id:'v8.0.'+i}))});f.render();
    const month=f.nodes['.ogh-history-months'].months[0];assert.equal(month.entries.filter(r=>!r.hidden).length,Math.min(count,5));assert.equal(Boolean(month.toggle),count>5);
    if(count>5){assert.equal(month.toggle.textContent,'이 달 1건 더 보기');f.toggle('2026-10');assert.equal(month.entries.filter(r=>!r.hidden).length,6);f.toggle('2026-10');assert.equal(month.entries.filter(r=>!r.hidden).length,5);}
    assert.deepEqual(f.writes,[]);
  }
  const launch=(summary)=>createHistoryHarness({history:[{id:'v0.0.1',date:'2026-10-01',status:'released',title:'HANI 본사 오픈',summary}]});
  for(const [summary,approved] of [['회장님 승인 완료',true],['회장님 승인 대기',false],['회장님 승인 완료 아님',false],['대표 승인 후 Preview',false]]){
    const f=launch(summary);f.render();assert.equal(f.nodes['.ogh-history-months'].markup.includes('ogh-history-approved'),approved,summary);
  }
  const xss=createHistoryHarness({history:[{...expected[0],title:'<img src=x onerror=alert(1)>'}]});xss.render();assert.doesNotMatch(xss.nodes['.ogh-history-months'].markup,/<img src=x/);assert.match(xss.nodes['.ogh-history-months'].markup,/&lt;img/);
  assert.equal((hub.match(/root.addEventListener\('click'/g)||[]).length,1);
  assert.doesNotMatch(hub,/localStorage\.(?:setItem|removeItem|clear)|sessionStorage|\.upsert\(|\.insert\(/);
  // Static token check complements (and does not certify) the browser's computed AA audit.
  const css=read('hani-design-system.css'),palettes=[];
  const luminance=hex=>hex.slice(1).match(/../g).map(v=>{v=parseInt(v,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
  for(const finish of ['pure-white','porcelain-cream','sakura-pink','alpine-blue','midnight-black','titanium-graphite']){
    const tokens={};for(const rule of css.matchAll(/([^{}]+)\{([^{}]+)\}/g))if(rule[1].includes('.login-design-choice[data-design="'+finish+'"]'))for(const t of rule[2].matchAll(/(--[\w-]+):(#[\da-f]{6})/g))tokens[t[1]]=t[2];
    const dark=['midnight-black','titanium-graphite'].includes(finish),ink=dark?tokens['--text-primary']:'#111c32',muted=dark?tokens['--text-secondary']:'#526079';
    for(const paper of dark?[tokens['--surface-raised'],tokens['--surface-panel']]:['#ffffff','#f3f6fb'])for(const fg of [ink,muted]){const ratio=contrast(fg,paper);assert.ok(ratio>=4.5,finish+' token contrast '+ratio);palettes.push({finish,fg,paper,ratio});}
  }
  console.log('PASS history226 unit: real releases/months/milestones/counts, source unchanged, persistent slots, canonical click, boundary toggles/approval, escaping, unavailable catalog, no writes');
  return {releases:expected.length,newest:expected[0].id,employees:17,issues:1,milestones:milestoneIds,monthCounts,storageWrites:0,tokenContrast:palettes};
}

async function browserTest(before){
  let browser,server,syntheticCatalog=null;const report={phase:before?'before':'after',status:'RUNNING',cases:[],screenshots:[]};
  try{
    const args=process.argv.slice(2).filter(s=>!s.startsWith('--'));
    const runtime=args[0]||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
    const {chromium}=await import(pathToFileURL(runtime).href),cdp=process.argv.find(s=>s.startsWith('--cdp='))?.slice(6);
    browser=cdp?await chromium.connectOverCDP(cdp,{timeout:10000}):await chromium.launch({headless:true,executablePath:args[1]||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
    const pageHtml='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/hani-design-system.css"><link rel="stylesheet" href="/hani-organization-hub.css"><style>body{margin:0;background:var(--surface-canvas);padding:24px;font-family:system-ui}main{max-width:1280px;margin:auto}@media(max-width:760px){body{padding:8px}}</style></head><body><main><div id="haniOrganizationHub"></div><section id="ilbo" hidden><div data-ilbo-content></div><div data-ilbo-archive></div></section></main><script src="/hani-development-history-v1.js"></script><script src="/hani-ilbo.js"></script><script src="/hani-organization-hub.js"></script></body></html>';
    server=http.createServer((req,res)=>{
      const uri=new URL(req.url,'http://local').pathname;
      if(uri==='/fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(pageHtml);return;}
      if(uri==='/assets/data/hani-history-releases-v1.json'&&syntheticCatalog){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(syntheticCatalog));return;}
      let file=path.resolve(root,'.'+decodeURIComponent(uri));
      if(before&&['/hani-organization-hub.js','/hani-organization-hub.css'].includes(uri))file=path.join(out,'baseline',path.basename(uri));
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
      res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
    });
    await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
    for(const width of [390,1440])for(const theme of ['light','dark']){
      syntheticCatalog=null;
      const context=await browser.newContext({viewport:{width,height:1050},reducedMotion:'reduce',timezoneId:'Asia/Seoul'});
      await context.addInitScript(({clock,theme})=>{
        const D=Date;window.Date=class extends D{constructor(...a){super(...(a.length?a:[clock]))}static now(){return clock}};
        document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.finish=theme==='dark'?'midnight-black':'pure-white'});
        window.__writes=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(...args){window.__writes.push({method,args});throw Error('unexpected storage write')};
      },{clock,theme});
      await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
      const page=await context.newPage(),errors=[],assets=[];page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)assets.push(r.url())});
      await page.goto(origin+'/fixture');await page.locator('.ogh-overview').waitFor();
      if(!before)await page.waitForFunction(count=>{const text=document.querySelector('.ogh-history-counts')?.textContent;return text?.includes('하니일보 1호')&&text.includes('릴리스 '+count+'회')},expected.length);
      await page.evaluate(()=>{HaniOrganizationHub.selectTab('overview');document.querySelectorAll('#haniOrganizationHub > :not(.ogh-overview)').forEach(e=>{e.hidden=true})});
      const history=page.locator(before?'.ogh-overview > .ogh-section:first-child':'.ogh-history');
      if(!before){
        assert.deepEqual(await page.locator('[data-history-month]').evaluateAll(ns=>ns.map(n=>n.dataset.historyMonth)),['2026-10','2026-09']);
        assert.deepEqual(await page.locator('[data-history-release]').evaluateAll(ns=>ns.map(n=>n.dataset.historyRelease)),expected.map(r=>r.id));
        assert.deepEqual(await page.locator('.is-milestone').evaluateAll(ns=>ns.map(n=>n.dataset.historyRelease)),milestoneIds);
        assert.deepEqual(await page.locator('.ogh-history-counts strong').allTextContents(),[String(expected.length),'17','1']);
        assert.deepEqual(await page.locator('.ogh-history-entry h4').allTextContents(),expected.map(r=>r.title));
        for(const month of ['2026-10','2026-09']){
          const section=page.locator('[data-history-month="'+month+'"]'),regular=expected.filter(r=>r.date.startsWith(month)&&!milestoneIds.includes(r.id));
          assert.equal(await section.locator('.is-milestone:visible').count(),3);
          assert.deepEqual(await section.locator('.ogh-history-entry:not(.is-milestone):visible').evaluateAll(ns=>ns.map(n=>n.dataset.historyRelease)),regular.slice(0,5).map(r=>r.id));
          assert.equal(await section.locator('.ogh-history-entry:visible').count(),8);
          const toggle=section.locator('[data-history-month-more]');assert.equal(await toggle.textContent(),'이 달 '+(regular.length-5)+'건 더 보기');assert.equal(await toggle.getAttribute('aria-expanded'),'false');
          assert.equal(await toggle.getAttribute('aria-controls'),'ogh-timeline-'+month);
        }
        const defaultHeight=await history.evaluate(n=>n.getBoundingClientRect().height);
        if(width===1440)assert.ok(defaultHeight<=1800,'default history section '+defaultHeight+'px exceeds 1800px');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'page has no horizontal overflow');
        const october=page.locator('[data-history-month="2026-10"]'),monthly=october.locator('[data-history-month-more]');
        await page.evaluate(()=>{window.__entries=[...document.querySelectorAll('[data-history-release]')];window.__monthly=document.querySelector('[data-history-month-more]')});
        await monthly.focus();await page.keyboard.press('Enter');assert.equal(await monthly.getAttribute('aria-expanded'),'true');assert.equal(await monthly.textContent(),'이 달 접기');
        assert.equal(await october.locator('.ogh-history-entry:visible').count(),74);assert.equal(await page.locator('[data-history-month="2026-09"] .ogh-history-entry:visible').count(),8);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'expanded month has no horizontal overflow');
        await page.keyboard.press('Space');assert.equal(await monthly.getAttribute('aria-expanded'),'false');assert.equal(await monthly.textContent(),'이 달 66건 더 보기');assert.equal(await october.locator('.ogh-history-entry:visible').count(),8);
        assert.equal(await monthly.evaluate(n=>n===document.activeElement),true,'monthly keyboard focus survives collapse');
        assert.equal(await page.evaluate(()=>__entries.every((n,i)=>n===document.querySelectorAll('[data-history-release]')[i])&&__monthly===document.querySelector('[data-history-month-more]')),true,'monthly toggles preserve entries and button');
        assert.equal(await page.locator('[data-history-release="v2.9.217"] .ogh-history-credit').count(),0,'named portrait subjects are not credited contributors');
        assert.deepEqual(await page.locator('[data-history-release="v2.9.193"] .ogh-history-credit').allTextContents(),['도연','세린']);
        assert.equal(await page.locator('.ogh-history-approved').count(),0);
        const overflow=await history.evaluate(h=>[...h.querySelectorAll('*')].filter(e=>{if(!e.checkVisibility())return false;const r=e.getBoundingClientRect();return r.width&& (r.left<0||r.right>innerWidth+1)}).map(e=>e.className));assert.deepEqual(overflow,[]);
        await page.evaluate(()=>{window.__first=document.querySelector('[data-history-release]');for(let i=0;i<5;i++)HaniOrganizationHub.selectTab('overview')});
        assert.equal(await page.evaluate(()=>window.__first===document.querySelector('[data-history-release]')),true);
        const aa=await page.evaluate(textContrastAudit);assert.deepEqual(aa.failures,[]);assert.deepEqual(aa.uncertain.filter(u=>!(u.ratio>=4.5)),[],'gradient/image-backed text must still reach AA against its sampled base');assert.ok(aa.textNodes>30);
        assert.equal(await page.locator('.ogh-history-month').first().evaluate(n=>getComputedStyle(n).animationName),'none');
        report.cases.push({width,theme,defaultHeight,visibleRows:16,monthlyKeyboardToggle:true,contrast:aa,overflow:false,storageWrites:await page.evaluate(()=>__writes.length)});
      }
      await history.locator('img').evaluateAll(async imgs=>{for(const i of imgs){i.loading='eager';await i.decode()}});
      const name=report.phase+'-'+width+'-'+theme+'.png';await history.screenshot({path:path.join(out,name),animations:'disabled'});report.screenshots.push(name);
      assert.deepEqual(errors,[]);assert.deepEqual(assets,[]);assert.deepEqual(await page.evaluate(()=>__writes),[]);
      if(!before){
        // A third month is absent in production data; serve a separately labelled synthetic
        // response after taking the real-data screenshot, through the actual async loader.
        syntheticCatalog={...catalog,entries:historyFixture.map((r,i,a)=>i===a.length-1?{...r,date:'2026-08-15'}:r)};
        await page.reload();await page.locator('[data-history-month="2026-08"]').waitFor({state:'attached'});
        await page.evaluate(()=>{HaniOrganizationHub.selectTab('overview');window.__older=document.querySelector('[data-history-month="2026-08"]')});
        assert.equal(await page.locator('[data-history-month]:visible').count(),2);
        const more=page.locator('[data-history-more]');await more.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-history-month]:visible').count(),3);assert.equal(await more.getAttribute('aria-expanded'),'true');
        await page.keyboard.press('Enter');assert.equal(await page.locator('[data-history-month]:visible').count(),2);assert.equal(await page.evaluate(()=>__older===document.querySelector('[data-history-month="2026-08"]')),true);
        assert.equal(await more.evaluate(n=>n===document.activeElement),true);assert.deepEqual(await page.evaluate(()=>__writes),[]);
      }
      await context.close();
    }
    report.status='PASS';
  }catch(e){report.status=/EPERM|requires approval|blocked by policy|ECONNREFUSED|connectOverCDP.*Timeout/.test(e.message)?'BLOCKED':'FAIL';report.error=e.message.slice(0,2200);process.exitCode=1;}
  finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,report.phase+'-browser.json'),JSON.stringify(report,null,2));}
  console.log(JSON.stringify(report));
}
if(process.argv[1]&&path.resolve(process.argv[1])===import.meta.filename){
  fs.mkdirSync(out,{recursive:true});
  try{const result=await unit();fs.writeFileSync(path.join(out,'unit.json'),JSON.stringify({status:'PASS',...result,sourceHashes:Object.fromEntries(['hani-organization-hub.js','hani-organization-hub.css','assets/data/hani-history-releases-v1.json','data/hani-ilbo/issues.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]))},null,2));if(!process.argv.includes('--unit-only'))await browserTest(process.argv.includes('--before'));}
  catch(e){console.error(e);process.exitCode=1;fs.writeFileSync(path.join(out,'unit.json'),JSON.stringify({status:'FAIL',error:e.stack},null,2));}
}
