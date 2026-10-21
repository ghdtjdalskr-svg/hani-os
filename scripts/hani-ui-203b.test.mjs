import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHistoryHarness} from './hani-history-226.test.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const main=read('hani-main.js'),hub=read('hani-organization-hub.js');
// Shared runners pass Playwright/browser paths; preservation fixtures are separate.
const firstArg=process.argv[2]?.startsWith('--')?null:process.argv[2],browserHarness=firstArg&&path.basename(firstArg)==='index.mjs';
const baseDir=path.resolve((!browserHarness&&firstArg)||process.env.HANI_UI203B_TEST_BASELINE||path.join(import.meta.dirname,'../.ai-budget-private/ui-203b/base'));
const baselineFile=file=>fs.existsSync(path.join(baseDir,file))?fs.readFileSync(path.join(baseDir,file),'utf8'):execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:64*1024*1024});
const nav=main.slice(main.indexOf('const NAV_NEW_DATES='),main.indexOf('function renderNavNewBadges'));
const ctx=vm.createContext({});vm.runInContext(nav,ctx);
for(const id of ['investmentCommittee','board','organization','aura','aiBudget']){
  assert.equal(ctx.navMenuIsNew(id,Date.parse('2026-10-10T14:59:59Z')),false);
  assert.equal(ctx.navMenuIsNew(id,Date.parse('2026-10-10T15:00:00Z')),true);
  assert.equal(ctx.navMenuIsNew(id,Date.parse('2026-10-17T14:59:59Z')),true);
  assert.equal(ctx.navMenuIsNew(id,Date.parse('2026-10-17T15:00:00Z')),false);
}
assert.equal(ctx.navMenuIsNew('home'),false);
// Execute the actual badge renderer against persistent slots, including expired parent badges.
const label=()=>({nextElementSibling:null,after(pill){this.nextElementSibling=pill}});
const groups=[['board','organization'],['aiBudget']].map(ids=>({head:label(),buttons:ids.map(view=>({dataset:{view},label:label(),querySelector(){return this.label}})),querySelectorAll(){return this.buttons},querySelector(){return this.head}}));
const aura={dataset:{view:'aura'},label:label(),querySelector(){return this.label}},navButtons=[...groups.flatMap(g=>g.buttons),aura];
let created=0;
ctx.window={};
ctx.document={querySelectorAll:s=>s==='#sidebar .group-head .nav-new-pill'?[]:navButtons,createElement:()=>{created++;return {className:'',textContent:'',hidden:false,classList:{contains:name=>name==='nav-new-pill'}}}};
let timerId=0;const timers=new Map();ctx.setTimeout=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId};ctx.clearTimeout=id=>timers.delete(id);
vm.runInContext(main.slice(main.indexOf('function renderNavNewBadges'),main.indexOf('renderNavNewBadges();',main.indexOf('function renderNavNewBadges'))),ctx);
for(let i=0;i<3;i++)ctx.renderNavNewBadges(Date.parse('2026-10-11T00:00:00Z'));
assert.equal(created,4,'four sub-menu badges, no parent badges');
assert.equal(aura.label.nextElementSibling.hidden,false);
for(const g of groups){assert.equal(g.head.nextElementSibling,null);for(const b of g.buttons)assert.equal(b.label.nextElementSibling.hidden,false)}
ctx.renderNavNewBadges(Date.parse('2026-10-17T15:00:00Z'));
for(const g of groups){assert.equal(g.head.nextElementSibling,null);for(const b of g.buttons)assert.equal(b.label.nextElementSibling.hidden,true)}
assert.equal(aura.label.nextElementSibling.hidden,true);
ctx.renderNavNewBadges(Date.parse('2026-10-11T00:00:00Z'));assert.equal(created,4);
assert.equal(timers.size,1,'refresh replaces the previous midnight timer');
let clock=Date.parse('2026-10-17T14:59:59.975Z');ctx.Date=class extends Date{static now(){return clock}};
ctx.renderNavNewBadges();const midnight=[...timers.values()][0];assert.equal(midnight.delay,55,'KST midnight expiry, with 30ms guard');
clock=Date.parse('2026-10-17T15:00:00.030Z');midnight.fn();assert.equal(aura.label.nextElementSibling.hidden,true);assert.equal(timers.size,1);ctx.Date=Date;
const fn=hub.slice(hub.indexOf('  function organizationOverviewData'),hub.indexOf('  function renderOverview'));
vm.runInContext(fn,ctx);
const roster={people:[{id:'hani',name:'하니'},{id:'sua',name:'수아'}]},now=Date.parse('2026-10-11T12:00:00Z');
const post=(id,authorId,createdAt,extra={})=>({id,authorId,createdAt,...extra});
const data={books:[{},{}],diaries:[{}],boardPosts:[post('p1','hani','2026-09-30T15:00:00Z'),post('p2','seongmin','2026-10-02T00:00:00Z'),post('p3','sua','2026-10-04T00:00:00Z'),post('draft','sua','2026-10-04T00:00:00Z',{draft:true}),post('meta','sua','2026-10-04T00:00:00Z',{boardMeta:true})],
  boardComments:[{postId:'p2',authorId:'hani',createdAt:'2026-10-05T00:00:00Z'},{postId:'p1',authorId:'sua',createdAt:'2026-10-05T00:00:00Z'},{postId:'p1',authorId:'sua',createdAt:'2026-10-06T00:00:00Z',pending:true},{postId:'draft',authorId:'sua',createdAt:'2026-10-06T00:00:00Z'},{postId:'missing',authorId:'sua',createdAt:'2026-10-06T00:00:00Z'},{postId:'p1',authorId:'sua',createdAt:'2026-11-01T00:00:00Z'},{postId:'p1',authorId:'sua',createdAt:'bad-date'}]};
const history=[{id:'v2.9.2',date:'2026-10-01',status:'released'},{id:'v2.9.10',date:'2026-10-01',status:'pages'},{id:'v2.9.10',date:'2026-10-01',status:'pages'},{id:'preview',date:'2026-10-01',status:'preview'},{id:'v2.9.11',date:'2026-11-01',status:'released'},{id:'P0',date:'2026-10-01',status:'process'}];
const before=JSON.stringify({data,history,roster}),model=ctx.organizationOverviewData(data,history,roster,now);
assert.deepEqual(JSON.parse(JSON.stringify(model.stats.map(s=>s.value))),[3,5,2,2]);
assert.equal(model.employee.id,'hani');assert.equal(model.employee.count,2,'KST month start, public comments and deterministic tie');
assert.equal(model.milestones[0].id,'v2.9.10');assert.equal(model.milestones.length,2);
assert.equal(JSON.stringify({data,history,roster}),before,'source data remains unchanged');
assert.equal(ctx.organizationOverviewData(null,undefined,undefined,now).stats.length,0);
assert.equal(ctx.organizationOverviewData(null,undefined,undefined,now).employee,null);
assert.equal(ctx.organizationOverviewData({boardPosts:[],boardComments:[]},[],roster,now).employee,null);
assert.equal(ctx.organizationOverviewData({boardPosts:null,boardComments:null},null,roster,now).employee,null);
const runtimeHistory={window:{},document:{querySelector:()=>null},setTimeout(){}};vm.runInNewContext(read('hani-development-history-v1.js'),runtimeHistory);
assert.equal(ctx.organizationOverviewData(null,runtimeHistory.window.HANI_DEVELOPMENT_HISTORY_V1.entries,roster,now).milestones.length,8);
// Execute the real overview renderer and refresh with changing in-memory state.
// The overview now has persistent child slots; execute its actual renderer with those slots.
const overview=createHistoryHarness({history:[{id:'v2.9.1',date:'2026-01-01',status:'released',title:'<script>배포</script>'}],now});
overview.render();assert.match(overview.nodes['.ogh-overview-details'].markup,/이번 달 게시판 활동이 쌓이면/);assert.match(overview.slot.markup,/HANI GROUP 연혁/);assert.match(overview.nodes['.ogh-overview-details'].markup,/숫자로 보는 HANI/);
overview.context.state={boardPosts:[post('live','hani',new Date(now).toISOString())],boardComments:[]};overview.render();
assert.match(overview.nodes['.ogh-overview-details'].markup,/게시글·댓글 1건/);assert.match(overview.nodes['.ogh-history-months'].markup,/&lt;script&gt;배포&lt;\/script&gt;/);assert.doesNotMatch(overview.nodes['.ogh-history-months'].markup,/<script>배포/);
const css=read('hani-design-system.css');
for(const design of ['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue']){
  const palette={};for(const rule of css.matchAll(/([^{}]+)\{([^{}]+)\}/g)){if(rule[1].includes('.login-design-choice[data-design="'+design+'"]'))for(const token of rule[2].matchAll(/(--[\w-]+):([^;]+)/g))palette[token[1]]=token[2]}
  for(const token of ['--surface-canvas','--surface-panel','--structure-accent','--text-primary'])assert.ok(palette[token],design+' owns '+token+' independently of the selected Finish');
}
const lum=hex=>hex.slice(1).match(/../g).map(v=>{const c=parseInt(v,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
let colorPairs=0;
for(const match of css.matchAll(/--report-tab-accent:(#[0-9a-f]{6});--report-tab-soft:(#[0-9a-f]{6})/g)){
  const a=lum(match[1]),b=lum(match[2]);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,match[1]+' / '+match[2]+' AA');colorPairs++;
}
assert.equal(colorPairs,6,'three report accents in light and dark palettes');
// Verify every retained mixed-EOL line byte-for-byte against the base, including changed line endings.
for(const file of ['hani-main.js','index.html']){
  const base=baselineFile(file),current=read(file),lines=s=>s.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
  const oldLines=lines(base),newLines=lines(current),oldByText=new Map(),ambiguous=new Set();
  for(const line of oldLines){const text=line.replace(/\r?\n$/,'');if(oldByText.has(text)&&oldByText.get(text)!==line)ambiguous.add(text);oldByText.set(text,line)}
  for(const text of ambiguous)oldByText.delete(text);
  for(const line of newLines){const text=line.replace(/\r?\n$/,'');if(oldByText.has(text))assert.equal(line,oldByText.get(text),file+' retained line ending: '+text.slice(0,50))}
}
const diff=fs.existsSync(path.join(baseDir,'diff.txt'))?fs.readFileSync(path.join(baseDir,'diff.txt'),'utf8'):execFileSync('git',['diff','--unified=0','--','hani-main.js','hani-organization-hub.js','index.html'],{encoding:'utf8',maxBuffer:64*1024*1024});
assert.doesNotMatch(diff.split('\n').filter(line=>line.startsWith('+')&&!line.startsWith('+++')).join('\n'),/localStorage\.(?:setItem|removeItem)|\.clear\(|writeProtectedState\(|\bcommit\(/);
console.log('PASS 203b: KST seven-day boundaries; read-only overview, monthly public activity, missing data, release filtering, source immutability, preserved EOL, no added writes');
