// Execute the real presentation functions with synthetic DOM/cache records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const main=read('hani-main.js'),ui=read('hani-ui-v02992.js'),market=read('hani-asset-market-view.js');
function section(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
function lineFunction(name){const line=main.split(/\r?\n/).find(x=>x.startsWith('function '+name+'('));assert.ok(line,name);return line;}

const sports=vm.createContext({});
vm.runInContext(section(main,'const MLB_OPPONENT_CODES=','function sportsCacheRowValid')+';this.codes=MLB_OPPONENT_CODES;',sports);
assert.equal(Object.keys(sports.codes).length,30);
assert.equal(sports.sportsOpponentCode({id:'139',name:'Tampa Bay Rays'}),'TB');
for(const [id,abbr] of Object.entries(sports.codes))assert.equal(sports.sportsOpponentCode({id,name:'Team Name'}),abbr);
for(const opponent of [{id:'99999',name:'New Club'},{id:'123',name:'123'},{id:'12-34',name:'서울 구단'},{name:'42 Team'}])assert.ok(!/^\d+$/.test(sports.sportsOpponentCode(opponent)));
assert.equal(sports.sportsOpponentCode({id:'KIA',name:'기아 타이거즈'}),'KIA');
assert.notEqual(sports.sportsOpponentCode({id:'139',name:'Football Club'},'LALIGA_UEFA'),'TB','MLB ids cannot override another league');
assert.equal(sports.sportsCompetitionLabel({competition:'R'}),'정규시즌');
assert.equal(sports.sportsCompetitionLabel({competition:'UEFA Champions League'}),'UEFA Champions League');

const textNode=()=>({textContent:'',classList:{remove(){},add(){}},setAttribute(){}});
const recent=textNode(),homeLabels=[textNode(),textNode()],homeScores=[textNode(),textNode()],dateLabel=textNode(),summary=textNode();
const head={querySelector:selector=>selector==='span'?dateLabel:textNode()};
const result={querySelector:selector=>selector.includes('first-child')?head:selector===':scope > p'?summary:null};
const home={querySelector:selector=>selector==='.sports-home-recent small'?recent:null,querySelectorAll:selector=>selector.includes('span')?homeLabels:homeScores};
const detail={querySelector:selector=>selector==='.sports-result'?result:null};
sports.document={querySelector:selector=>selector.includes('sports-home-panel')?home:detail};
vm.runInContext(section(main,'const SPORTS_CACHE_UI=','let sportsCacheRuntime=')+'\n'+lineFunction('sportsCacheDate')+'\n'+section(main,'function sportsCacheRowValid','async function sportsCacheLoad'),sports);
assert.equal(sports.sportsApplyCacheRow({team_id:'yankees',last_game:{date:'2026-10-11',opponent:{id:'139',name:'Tampa Bay Rays'},score:{team:3,opponent:1},result:'WIN',competition:'ALDS',venue:'Yankee Stadium'}}),true);
assert.equal(homeLabels[0].textContent,'TB');assert.match(recent.textContent,/ALDS/);assert.match(dateLabel.textContent,/ALDS/);

const nodes=new Map(['investmentNewsFeed','investmentNewsTargets','investmentNewsCount','investmentNewsPolicy'].map(id=>[id,{innerHTML:'',textContent:'',querySelectorAll:()=>[]}]));
const lg={id:'lg',name:'LG전자우',ticker:'066575'},off={id:'off',name:'꺼진 종목',ticker:'OFF',newsTracking:false},outside={id:'outside',name:'제외 종목',ticker:'OUT'};
let cache={data:{entities:[{name:'LG Electronics',ticker:'066570',news:[{title:'LG 전자 새 소식',published_at:new Date().toISOString(),summary:'확인된 기사',source_grade:'NEWS',sentiment:'NEUTRAL',source_url:'https://example.com/news',importance:3}]}]}};
const news=vm.createContext({
  state:{investmentWatchlist:[lg,off,outside],ui:{investmentNewsMode:'interest',investmentNewsEntity:'066575'}},INVESTMENT_NEWS_MAX_TARGETS:5,
  window:{},document:{querySelectorAll:()=>[]},$:id=>nodes.get(id)||null,
  investmentNewsTargets:()=>[lg],investmentNewsReadCache:()=>cache,investmentNewsAttachStableSocial:x=>x,investmentNewsCacheFresh:()=>true,
  investmentNewsArchiveInterestRows:()=>[],investmentNewsArchiveRuntime:{loaded:false,posts:[]},investmentNewsRuntime:{busy:false},
  investmentNewsRenderWeeklyArchive(){},investmentNewsArchivePosts:()=>[],agentObj:x=>x||{},agentArray:x=>Array.isArray(x)?x:[],
  investmentNewsIssuerMeta:x=>({security_type:x.ticker==='066575'?'PREFERRED':'COMMON'}),watchIsHeld:()=>false,
  esc:x=>String(x??''),n:x=>Number(x)||0,uiPageSlice:(key,rows)=>({rows}),uiPageSize:()=>8,uiMountPagination(){},
  investmentNewsSafeUrl:x=>x,investmentNewsComments:()=>[],investmentNewsIsRead:()=>true,investmentNewsScopeLabel:()=>'',
  investmentNewsTone:()=>'',investmentNewsDisplayName:e=>e.name,investmentSecurityLogoHtml:()=>'',investmentNewsFmtTime:()=>'',
  investmentNewsImpactLabel:x=>x,investmentNewsGradeLabel:x=>x,investmentNewsHaniView:()=>'',investmentNewsFiveDayBrief:()=>({summary:'요약'}),
  save(){throw Error('render must not create storage writes')}
});
vm.runInContext(section(main,'const INVESTMENT_NEWS_ALIASES=','function investmentNewsSignature')+'\n'+lineFunction('investmentNewsWithinHours')+'\n'+lineFunction('investmentNewsFlatten')+'\n'+section(main,'function renderInvestmentNews(){','function investmentNewsToJournal('),news);
for(const name of ['LG전자','LG 전자','LG Electronics'])assert.equal(news.investmentNewsMatches(lg,{name}),true);
assert.equal(news.investmentNewsMatches({name:'LG전자우'},{name:'LG Electronics'}),true);
assert.equal(news.investmentNewsMatches(lg,{name:'다른 기업'},{title:'LG 전자 신제품'}),true);
assert.equal(news.investmentNewsMatches(lg,{name:'삼성전자',ticker:'005930'}),false);
assert.equal(news.investmentNewsMissingReason(off,[lg],[]),'추적 꺼짐');
assert.equal(news.investmentNewsMissingReason(outside,[lg],[]),'추적 상위 5개 밖');
assert.equal(news.investmentNewsMissingReason(lg,[lg],[],{loaded:true}),'72시간 내 기사 없음');
assert.equal(news.investmentNewsMissingReason(lg,[lg],[]),'뉴스 조회 대기');
const row={entity:cache.data.entities[0],item:cache.data.entities[0].news[0]};
assert.equal(news.investmentNewsMissingReason(lg,[lg],[row],{loaded:true,filteredRows:[]}), '현재 필터에 기사 없음');
assert.equal(news.investmentNewsMissingReason(lg,[lg],[{...row,item:{...row.item,published_at:'2020-01-01'}}],{loaded:true}),'72시간 내 기사 없음');
news.renderInvestmentNews();
assert.equal(nodes.get('investmentNewsCount').textContent,'1건');
assert.match(nodes.get('investmentNewsFeed').innerHTML,/LG 전자 새 소식/);
assert.match(nodes.get('investmentNewsTargets').innerHTML,/추적 꺼짐/);
assert.match(nodes.get('investmentNewsTargets').innerHTML,/추적 상위 5개 밖/);
news.state.ui.investmentNewsGrade='OFFICIAL';news.renderInvestmentNews();
assert.equal(nodes.get('investmentNewsCount').textContent,'0건');
assert.match(nodes.get('investmentNewsTargets').innerHTML,/현재 필터에 기사 없음/);
cache=null;news.state.ui.investmentNewsGrade='all';news.investmentNewsArchiveRuntime.loaded=true;news.renderInvestmentNews();
assert.match(nodes.get('investmentNewsTargets').innerHTML,/72시간 내 기사 없음/);

const voices=vm.createContext({});
vm.runInContext(section(ui,'// BEGIN CANONICAL TAB VOICE BUNDLE','// END CANONICAL TAB VOICE BUNDLE')+';this.select=createTabQuoteSelector(()=>0);this.pageProfiles=PAGE_CHARACTER_PROFILES;this.characterProfile=characterProfile;this.characterVoicePrompt=characterVoicePrompt;',voices);
for(const tab of ['dev','work','aiWork','aiBudget','deployment','geminiReports']){const quote=voices.select(tab),owner=tab==='geminiReports'?'serin':'seoyun',name=owner==='serin'?'\uC138\uB9B0':'\uC11C\uC724';assert.equal(quote.agent,owner);assert.equal(quote.speaker,name);assert.equal(voices.characterProfile(owner),voices.pageProfiles[owner]);assert.equal(voices.characterProfile(owner).identity.split(' \u00b7 ')[0],name);assert.ok(fs.existsSync(new URL('../'+voices.characterProfile(owner).image,import.meta.url)));assert.equal(voices.characterVoicePrompt(owner),'','page-only metadata has no canonical voice prompt');}
assert.equal(voices.select('geminiReports').speaker,'세린');
assert.match(voices.select('geminiReports').role,/Gemini.*연구원/);
for(const profile of Object.values(voices.pageProfiles))assert.ok(fs.existsSync(new URL('../'+profile.image,import.meta.url)));

const chartNodes=new Map(['marketChart','marketChartMeta'].map(id=>[id,{innerHTML:'',textContent:''}]));
const chart=vm.createContext({$:id=>chartNodes.get(id),rows:[],selected:'one',chartGeneration:0,lastPlot:null,client:null,analyticsAvailable:false,analyticsOwner:'owner',user:null,
  analyticsIdentity(){return this.user},escape:x=>String(x).replaceAll('<','&lt;'),isActive:()=>true,period:'1M',
  M:{candles:x=>x},plot:()=>'<svg>synthetic chart</svg>'});
vm.runInContext(section(market,'  function chartUnavailableReason','  async function miniCharts'),chart);
// Bound callback matches the production closure rather than relying on this.
chart.analyticsIdentity=()=>chart.user;
await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/로그인/);
chart.user='owner';await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/보유종목이 없습니다/);
chart.rows=[{key:'one',resolution:{status:'unmatched',reason:'코드 미확인'}}];await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/매칭된 보유종목 없음.*코드 미확인/);
chart.rows=[{key:'one',quantity:1,cost:10,resolution:{status:'matched',symbol:'ABC',currency:'USD'}}];await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/가격 캐시 없음/);
chart.client={chart:async()=>({result:[]})};chart.analyticsAvailable=true;await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/가격 캐시 없음.*선택한 종목/);
chart.client.chart=async()=>{throw Error('수집 파일 없음')};await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/가격 캐시 없음.*수집 파일 없음/);
chart.client.chart=async()=>({result:[{currency:'USD',timestamp:'2026-10-10',closePrice:10},{currency:'USD',timestamp:'2026-10-11',closePrice:11}]});await chart.drawMain();assert.match(chartNodes.get('marketChart').innerHTML,/<svg>/);

let route='',scrolled=false;
const click=section(market,"  document.querySelector('[data-asset-market-link]')", "  document.addEventListener('visibilitychange',sync);");
vm.runInNewContext(click,{document:{querySelector:()=>({addEventListener:(event,fn)=>fn()})},showView:view=>{route=view},requestAnimationFrame:fn=>fn(),root:{scrollIntoView:options=>{scrolled=options.block==='start'}}});
assert.equal(route,'asset');assert.equal(scrolled,true);
assert.match(read('index.html'),/data-asset-market-link>투자 › 종목별 보기/);

// Run the actual persistent-slot placement twice: both bubbles remain after headers.
function card(){const header={after(node){const old=this.parent.children.indexOf(node);if(old>=0)this.parent.children.splice(old,1);this.parent.children.splice(1,0,node);node.parent=this.parent}};const parent={children:[header,{className:'field'}]};header.parent=parent;return parent;}
const ledger=card(),accountCard=card(),account={closest:()=>accountCard};
const slotQuery=(selector,parent)=>{
  if(selector==='#investmentIntake .ledger-import')return ledger;
  if(selector==='#assetAccountManager')return account;
  if(selector===':scope > .sh')return parent.children[0];
  if(selector==='.ds-agent-comment')return parent.children.find(n=>n.className?.includes('ds-agent-comment'));
  if(selector==='.ds-account-comment')return accountCard.children.find(n=>n.className?.includes('ds-account-comment'));
  return null;
};
const placement=ui.split(/\r?\n/).filter(line=>line.includes("const ledger=q('#investmentIntake .ledger-import')")||line.includes("const account=q('#assetAccountManager')")).join('\n');
const slotContext={q:slotQuery,document:{createElement:()=>({})},speakerMarkup:(agent,name,role,line)=>agent+':'+line};
vm.runInNewContext('{'+placement+'}',slotContext);vm.runInNewContext('{'+placement+'}',slotContext);
assert.equal(ledger.children.length,3);assert.equal(accountCard.children.length,3);
assert.ok(ledger.children[1].className.includes('ds-agent-comment'));
assert.ok(accountCard.children[1].className.includes('ds-agent-comment'));
assert.ok(!read('hani-design-system.css').includes('.ledger-import>.ds-agent-comment{margin-top:auto}'));

const remote=read('hani-context-remote-v1.js');let themeRoute='',mobileClosed=false;
const remoteClick=remote.split(/\r?\n/).find(line=>line.includes('rail.addEventListener("click"'));
vm.runInNewContext(remoteClick,{rail:{addEventListener:(event,fn)=>fn({target:{closest:selector=>selector==='.hani-remote-link'||selector==='[data-remote-quiz]'?null:{dataset:{remoteAction:'theme'}}}})},window:{},config:()=>({}),goView:view=>{themeRoute=view},setMobile:value=>{mobileClosed=value===false}});
assert.equal(themeRoute,'aura');assert.equal(mobileClosed,true);
assert.match(remote,/data-remote-action="theme"[^]*?테마 스튜디오/);
console.log('PASS: MLB 30-team abbreviations/numeric fallback and rendered competition, LG aliases and real newsroom render/filter/reasons, page owner voices/assets, chart failure/success/navigation, persistent header bubbles, theme remote');
