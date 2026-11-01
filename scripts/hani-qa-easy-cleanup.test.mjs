// Node-only: execute the existing presentation owners against synthetic, immutable data.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const main=read('hani-main.js'),hub=read('hani-organization-hub.js'),board=read('hani-board.js'),html=read('index.html'),css=read('hani-design-system.css');
const slice=(s,a,b)=>{const start=s.indexOf(a),end=s.indexOf(b,start);assert.ok(start>=0&&end>start,`owner anchors: ${a}`);return s.slice(start,end)};
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x};
const denied=()=>{throw Error('presentation attempted a write')};
const noWrites={save:denied,commit:denied,localStorage:{setItem:denied,removeItem:denied,clear:denied},cloudClient:new Proxy({},{get:denied})};

test('QA-1: actual roster owner updates every corporate lockup; fallback has no stale number',()=>{
  const labels=[{},{}],c={window:{},document:{getElementById:()=>null,querySelectorAll:s=>{assert.equal(s,'.sidebar-corporate-lockup small');return labels}},...noWrites};
  vm.runInNewContext(hub,c);
  assert.equal(c.window.HaniOrganizationRoster.people.length,19);
  for(const label of labels)assert.equal(label.textContent,`PERSONAL AI COMPANY · ${c.window.HaniOrganizationRoster.people.length} AGENTS`);
  assert.match(html,/sidebar-corporate-copy"><b>AI TEAM<\/b><small>PERSONAL AI COMPANY<\/small>/);
  assert.doesNotMatch(html,/PERSONAL AI COMPANY · \d+ AGENTS/);
});

test('QA-2: real care renderer shows owner task in both branches and keeps the button',()=>{
  for(const researchDone of [false,true]){
    const slot={dataset:{},querySelectorAll:()=>[]},parent={querySelector:()=>slot};
    const c={...noWrites,window:{HaniInvestmentResearchCore:{committeeProgress:()=>({reminder:true,researchDone})}},state:freeze({}),careKoreaPeriod:()=>({day:'2026-11-01'}),careCampusGroups:()=>[],campusAssignments:()=>[],certificateCareSorted:()=>[],showView:denied};
    vm.runInNewContext(slice(main,'function renderHaniCareCards(', 'function renderHaniCareHome(')+';this.render=renderHaniCareCards;',c);
    c.render(parent);
    assert.match(slot.innerHTML,/<h3>11월 종목 리포트 정리<\/h3><span class="pill">회장님 할 일<\/span>/);
    assert.ok(slot.innerHTML.includes(researchDone?'회장님이 종목 리포트를 읽고 이번 달 투자 판단을 정리해 주세요.':'회장님이 이번 달 종목 리포트를 받아 읽고 투자 판단을 정리해 주세요.'));
    assert.match(slot.innerHTML,/<button[^>]+data-hani-care-view="investmentCommittee">HANI 투자 리포트에서 확인<\/button>/);
  }
});

test('QA-3: actual quick jump retains legacy keywords and unchanged route id',()=>{
  const c={};vm.runInNewContext(slice(main,'const QUICK_JUMP_ITEMS=','function renderQuickJump')+';this.find=quickJumpMatches;',c);
  for(const term of ['본사','하니 본사','HANI 본사','대표실','HANI GROUP']){
    const row=c.find(term).find(x=>x[0]==='agentReview');assert.ok(row,term);assert.equal(row[1],'HANI GROUP');
  }
  assert.match(main,/agentReview:\["HANI GROUP"/);
  assert.match(html,/data-view="agentReview"[\s\S]*?<span class="txt">HANI GROUP<\/span>/);
  for(const f of ['index.html','hani-ui-cleanup-v02971.js','hani-ui-v02992.js'])assert.doesNotMatch(read(f),/HANI 본사/);
});

function bannerFixture(){
  const fields=new Map(),node=()=>({attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v}});
  for(const key of ['link','image','kicker','title','copy','pause'])fields.set(`[data-board-banner-${key}]`,node());
  const slot={querySelector:s=>fields.get(s),contains:n=>n===fields.get('[data-board-banner-link]')};
  const timers=new Map(),events={},media={matches:false,addEventListener:(key,fn)=>events.media=fn};let seq=0,active=true;
  const roster={people:[{id:'hani',name:'하니'}]},now=Date.now();
  const state=freeze({boardPosts:[{id:'p',authorId:'hani',createdAt:new Date(now).toISOString()}],boardComments:[]});
  const c=vm.createContext({...noWrites,state,roster:()=>roster,root:{classList:{contains:()=>active}},get:k=>k==='unread'?slot:null,document:{visibilityState:'visible',activeElement:null,addEventListener:(key,fn)=>events[key]=fn},window:{matchMedia:()=>media,addEventListener:(key,fn)=>events[key]=fn,HaniOrganizationHub:{}},setTimeout:(fn,ms)=>{assert.equal(ms,6000);timers.set(++seq,fn);return seq},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(slice(hub,'  function organizationOverviewData(', '  // Curated moments'),c);
  c.window.HaniOrganizationHub={overviewData:c.organizationOverviewData,portraitSource:()=> './assets/profiles/hani-profile-hani.webp'};
  vm.runInContext(slice(board,'  // Read-only lounge promotion.', '  function paintLiving('),c);
  // Execute the actual lifecycle registration, without initializing unrelated write controls.
  vm.runInContext(slice(board,'  function init(){','    if(!get("syncNotice")){')+'\n};init();',c);
  const click=slice(board,"      const bannerLink=event.target.closest('[data-board-banner-link]');",'      const profile=');
  c.showView=route=>c.route=route;
  vm.runInContext('this.click=event=>{'+click+'};',c);
  const press=selector=>c.click({preventDefault(){},target:{closest:s=>s===selector?{getAttribute:()=>fields.get('[data-board-banner-link]').attrs.href}:null}});
  const run=code=>vm.runInContext(code,c);
  const tick=()=>{assert.equal(timers.size,1);const [id,fn]=[...timers][0];timers.delete(id);fn()};
  return {c,fields,timers,events,media,slot,run,tick,press,setActive:v=>active=v};
}

test('QA-7: shared employee result, persistent banner nodes, actual rotation/pause/links; zero writes',()=>{
  const f=bannerFixture(),get=k=>f.fields.get(`[data-board-banner-${k}]`),before=JSON.stringify(f.c.state);
  f.run('paintLoungeBanner();syncBanner();');assert.equal(get('kicker').textContent,'이달의 직원');assert.equal(get('title').textContent,'하니');assert.match(get('copy').textContent,/1건/);
  const link=get('link');f.press('[data-board-banner-link]');assert.equal(f.c.route,'organization/people/hani');
  f.tick();assert.equal(get('kicker').textContent,'HANI 일보');assert.equal(get('link'),link);assert.equal(link.attrs.href,'#ilbo');assert.ok(fs.existsSync(new URL('../'+get('image').attrs.src,import.meta.url)));
  f.press('[data-board-banner-link]');assert.equal(f.c.route,'ilbo');
  f.c.document.activeElement=link;f.tick();assert.equal(get('kicker').textContent,'HANI 일보','focused banner does not rotate');f.c.document.activeElement=null;
  f.press('[data-board-banner-pause]');assert.equal(f.timers.size,0);assert.equal(get('pause').attrs['aria-pressed'],'true');
  f.press('[data-board-banner-next]');assert.equal(get('kicker').textContent,'이달의 직원');assert.equal(f.timers.size,0);
  f.press('[data-board-banner-pause]');assert.equal(f.timers.size,1);f.run('syncBanner();syncBanner()');assert.equal(f.timers.size,1);
  assert.equal(JSON.stringify(f.c.state),before);
  assert.doesNotMatch(slice(board,'  // Read-only lounge promotion.', '  function paintLiving('),/\b(save|commit|persist|setItem|removeItem|insert|upsert)\s*\(/);
});

test('QA-7: navigation, hidden page, pagehide and reduced motion stop the one timer',()=>{
  const f=bannerFixture();f.run('paintLoungeBanner();syncBanner();');
  f.setActive(false);f.run('syncBanner()');assert.equal(f.timers.size,0);
  assert.match(slice(main,'function showView(', 'function quickJump'),/window.HaniBoard\?\.syncBanner\?\.\(\)/);
  f.setActive(true);f.events.pageshow();assert.equal(f.timers.size,1);
  f.c.document.visibilityState='hidden';f.events.visibilitychange();assert.equal(f.timers.size,0);
  f.c.document.visibilityState='visible';f.events.visibilitychange();assert.equal(f.timers.size,1);
  f.events.pagehide();assert.equal(f.timers.size,0);f.events.pageshow();assert.equal(f.timers.size,1);
  f.media.matches=true;f.events.media();assert.equal(f.timers.size,0);assert.equal(f.fields.get('[data-board-banner-pause]').hidden,true);
  f.press('[data-board-banner-next]');assert.equal(f.timers.size,0);
  f.media.matches=false;f.events.media();assert.equal(f.timers.size,1);
  f.c.state=freeze({boardPosts:[],boardComments:[]});f.run('paintLoungeBanner()');assert.equal(f.fields.get('[data-board-banner-kicker]').textContent,'HANI 일보','no fabricated employee without a real result');
});

test('QA-7: real unread badge/read tracking stays while paintLiving emits no unread post buttons',()=>{
  const output={},posts=Array.from({length:30},(_,i)=>({id:'p'+i})),comments=posts.map(p=>({postId:p.id,generated:true,createdAt:'2026-11-01T00:00:00Z'}));
  const c={...noWrites,posts:()=>posts,visibleComments:()=>comments,comments:()=>comments,published:()=>true,postDrafts:()=>[],replyDrafts:()=>[],replyMode:()=> 'auto',get:()=>null,html:(k,v)=>output[k]=v,paintLoungeBanner:()=>{},syncBanner:()=>{},weeklyActivity:()=>[],weeklyBest:()=>[],escape:esc};
  // Arrow declarations stay lexical in the VM, so call through runInNewContext.
  const context=vm.createContext(c);vm.runInContext(slice(board,'  const unreadCount=', '  const newBadge=')+board.split('\n').find(x=>x.includes('const newBadge='))+';this.badge=newBadge;',context);
  assert.match(context.badge(posts[0]),/새 댓글 1/);assert.equal(context.badge({...posts[0],seenStaffAt:'2026-11-02T00:00:00Z'}),'');
  vm.runInContext(slice(board,'  function paintLiving(', '  const draftButtons='),context);context.paintLiving(false);
  assert.equal(Object.hasOwn(output,'unread'),false);assert.doesNotMatch(slice(board,'  function paintLiving(', '  const draftButtons='),/data-board-open[^\n]*새 댓글/);
});

test('QA-8: real asset output retains every amount and percentage; one residual name, signed KPI classes',()=>{
  for(const hasRecord of [true,false])for(const pnl of [-20,0,20]){
    const nodes={assetStats:{},assetComposition:{}},record=freeze({total:1000,evaluation:700,cashLike:300,pnl,accounts:[]}),calc=freeze({total:1000,totalMarket:700,totalCash:300,pnl});
    const c={...noWrites,$:id=>nodes[id],calculate:()=>calc,officialBrokerLatest:()=>hasRecord?{period:'2026-10'}:null,brokerCalc:()=>record,investmentAmountKnown:()=>true,investmentMoveClass:v=>v>0?'invest-up':v<0?'invest-down':'invest-flat',won:v=>v+'원',signedWon:v=>(v>0?'+':'')+v+'원',n:Number,esc,window:{}};
    vm.runInNewContext(slice(main,'function renderAssets()', 'function bodyMetric(')+';renderAssets();',c);
    const values=[...nodes.assetStats.innerHTML.matchAll(/class="value [^"]*">([^<]+)</g)].map(m=>m[1]);
    assert.deepEqual(values,['1000원','700원','300원',hasRecord?(pnl>0?'+':'')+pnl+'원':pnl+'원']);
    assert.match(nodes.assetStats.innerHTML,new RegExp('value '+(pnl>0?'invest-up':pnl<0?'invest-down':'invest-flat')));
    for(const p of ['30.0%','70.0%'])assert.ok(nodes.assetComposition.innerHTML.includes(p));
    if(hasRecord){assert.match(nodes.assetStats.innerHTML,/현금·기타/);assert.match(nodes.assetComposition.innerHTML,/증권사 총자산에서 평가액을 뺀 금액으로, 예수금과 누락분이 섞일 수 있어요/)}
    else assert.match(nodes.assetStats.innerHTML,/>현금</);
    assert.doesNotMatch(nodes.assetStats.innerHTML+nodes.assetComposition.innerHTML,/미분류 차액|총자산−평가액 차이|확인된 현금/);
  }
});

test('QA-8: portfolio summary uses the display model cash label, preserving actual confirmed cash meaning',()=>{
  const source=read('hani-asset-market-view.js');
  const c={e:esc};vm.runInNewContext(slice(source,'  function summaryHtml(', '  function render('),c);
  for(const cashLabel of ['현금·기타','확인된 현금']){
    const result=c.summaryHtml({cashLabel,cash:'₩26,000',live:'₩700',recorded:'₩600',unpriced:'0개',reconciliation:'동일',estimated:'₩26,700'});
    assert.ok(result.includes('<small>'+cashLabel+'</small><strong>₩26,000</strong>'));
  }
  assert.match(source,/cashLabel:b\?\.confirmed_cash!=null\?'확인된 현금':'현금·기타'/);
  assert.match(source,/증권사 총자산에서 평가액을 뺀 금액으로, 예수금과 누락분이 섞일 수 있어요/);
});

test('QA-9: actual ledger row output badges only special rows, retaining all numeric cells',()=>{
  for(const category of ['special','fixed','variable','finance']){
    const out={},x=freeze({category,date:'2026-10-30',content:'시험 내역',amount:12345,reimbursement:567,note:'메모'});
    const c={...noWrites,$:()=>out,visibleItems:[x],editing:false,esc,won:n=>n+'원',LEDGER_CATEGORY_LABELS:{[category]:category}};
    vm.runInNewContext(slice(main,'  $("ledgerItemRows").innerHTML=', '  const months=[...ledgerSorted()]'),c);
    assert.equal((out.innerHTML.match(/>특수<\/span>/g)||[]).length,category==='special'?1:0);
    assert.match(out.innerHTML,/<td>12345원<\/td><td>567원<\/td>/);
  }
  const out={},c={...noWrites,$:()=>out,state:freeze({ledgerMonths:[]}),ledgerFixedChanges:()=>({ready:false,changes:[]}),ledgerReimbursements:()=>[],esc};
  vm.runInNewContext(slice(main,'function renderLedgerPractical()', 'function settlementCheckModel(')+';renderLedgerPractical()',c);
  assert.match(out.innerHTML,/지난달과 달라진 고정비<\/summary><p class="sub">지난달과 금액이 달라진 고정비/);
  assert.match(out.innerHTML,/받을 돈 모아보기 \(더치페이·환급\)<\/summary><p class="sub">더치페이·환급 등 받을 예정인 돈/);
});

const luminance=hex=>{const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722};
const ratio=(a,b)=>{const x=[luminance(a),luminance(b)].sort((a,b)=>b-a);return (x[0]+.05)/(x[1]+.05)};
test('QA-8: all six Finish KPI colours meet AA 4.5:1 on their actual token surface',()=>{
  const finishes=['porcelain-cream','pure-white','sakura-pink','alpine-blue','midnight-black','titanium-graphite'];
  const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for(const finish of finishes){
    const tokens={};for(const [,selector,body] of rules)if(selector.includes(`:root[data-finish="${finish}"]`)||selector.trim()===':root,.login-design-choice[data-design="porcelain-cream"]')for(const [,k,v] of body.matchAll(/(--[\w-]+):([^;]+)/g))tokens[k]=v;
    const dark=/black|graphite/.test(finish),colours=['--text-primary','--text-secondary','--structure-accent'].map(k=>tokens[k]);
    const scoped=css.match(/#app #asset #assetStats\{--invest-up:([^;]+);--invest-down:([^}]+)\}/g)[dark?1:0];
    colours.push(scoped.match(/--invest-up:([^;]+)/)[1],scoped.match(/--invest-down:([^}]+)/)[1]);
    for(const colour of colours)assert.ok(ratio(colour,tokens['--surface-raised'])>=4.5,`${finish}: ${colour} / ${tokens['--surface-raised']} = ${ratio(colour,tokens['--surface-raised'])}`);
  }
});

test('QA-13/16: existing portrait CSS and active-tab owner implement responsive visual changes only',()=>{
  const cleanup=read('hani-ui-cleanup-v02971.js');
  assert.match(cleanup,/#aiWork \[data-development-portrait\][^}]*object-position:center top/);
  assert.match(cleanup,/#aiWork \.ai-team-profile-avatar\{max-width:360px\}/);
  assert.match(cleanup,/#aiWork[^\n]+-webkit-line-clamp:unset/);
  assert.match(cleanup,/@media\(max-width:980px\)\{#aiWork \.ai-team-profile-shell\{grid-template-columns:minmax\(0,1fr\)/);
  const listeners=[],panel={classList:{add(){}}},tab={dataset:{panel:'auraSeasons'},classList:{add(){},remove(){},contains(){return false}}};
  const tabs={querySelectorAll:()=>[tab],closest:()=>null,parentElement:{querySelectorAll:()=>[]},classList:{contains:()=>false}};tab.addEventListener=(type,fn)=>listeners.push(fn);
  const c={...noWrites,document:{querySelectorAll:()=>[tabs]},$:()=>panel,setTimeout:()=>{},window:{}};
  vm.runInNewContext(main.split('\n').find(x=>x.startsWith('document.querySelectorAll("[data-tabs]")')),c);listeners[0]();
  assert.match(css,/\.aura-preview--season>img\{grid-column:1/);
  assert.match(css,/\.aura-preview--season figcaption,\.aura-preview--season \.aura-poster-signature\{grid-column:2/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.aura-preview\{animation:none\}\}/);
});

test('runtime closure retains the 128-file ceiling with no missing files',async()=>{
  const result=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read});
  assert.equal(result.files.length,128);
  assert.deepEqual(result.missing,[]);
  assert.ok(result.files.includes('assets/heroes/newsroom-218.webp'),'house ad reuses an already packaged illustration');
});
