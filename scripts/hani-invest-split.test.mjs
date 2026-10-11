// Read-only IA contract with actual routing/tab/activity functions and synthetic DOM.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const main=read('hani-main.js'),ic=read('hani-investment-committee.js'),market=read('hani-asset-market-view.js'),html=read('index.html');
for(const [name,source] of [['main',main],['committee',ic],['market',market]])new vm.Script(source,{filename:name});
const nodes=[],classes=new WeakMap();
class Node {
  constructor(){this.children=[];this.listeners={};this.attrs={};this.dataset={};this.hidden=false;nodes.push(this);classes.set(this,new Set());this.classList={add:c=>classes.get(this).add(c),remove:c=>classes.get(this).delete(c),toggle:(c,on)=>on?classes.get(this).add(c):classes.get(this).delete(c),contains:c=>classes.get(this).has(c)};}
  set className(value){classes.set(this,new Set(value.split(/\s+/)));}
  append(...children){for(const child of children){if(child.parentElement)child.parentElement.children.splice(child.parentElement.children.indexOf(child),1);child.parentElement=this;this.children.push(child);}}
  appendChild(child){this.append(child);}
  prepend(child){this.append(child);this.children.unshift(this.children.pop());}
  setAttribute(key,value){this.attrs[key]=value;}
  querySelector(){return this.children.find(child=>child.classList.contains('ds-main-character-banner'))||null;}
  after(child){const parent=this.parentElement;parent.append(child);parent.children.splice(parent.children.indexOf(child),1);parent.children.splice(parent.children.indexOf(this)+1,0,child);}
  querySelectorAll(){return this.children.filter(child=>child.dataset.icSection);}
  addEventListener(key,handler){this.listeners[key]=handler;}
  closest(){return this;}
  focus(){this.focused=true;}
}
const get=id=>nodes.find(n=>n.id===id),add=id=>{const n=new Node();n.id=id;return n;};
const portfolio=add('investment'),committee=add('investmentCommittee');portfolio.className='view';committee.className='view';
const overview=add('investOverview'),stocks=add('investOverviewStocks'),legacyTabs=new Node();portfolio.append(legacyTabs,overview);overview.append(stocks);
const mountedBanner=new Node();mountedBanner.className='ds-main-character-banner';committee.append(mountedBanner);
const body={dataset:{view:'investmentCommittee'}},routes=[],entries=[];
const ctx=vm.createContext({root:{},document:{body,createElement:()=>new Node(),getElementById:get},location:{hash:'#investmentCommittee',href:'http://test/'},history:{replaceState(_a,_b,hash){routes.push(hash);}},render:()=>entries.push('research'),refreshPrices(){},renderMonthly:()=>entries.push('monthly')});
// Run the module's persistent layout owner directly, with data renderer calls observed.
vm.runInContext(ic.slice(ic.indexOf('  const UI = '),ic.indexOf('  let framework =')).replaceAll('if (!viewSection) return;','').replaceAll('if (!host) return;',''),ctx);
const ids=ctx.root.HaniInvestmentCommitteeIds,nav=get(ids.tabs);
assert.deepEqual(portfolio.children,[legacyTabs,overview],'Committee does not reparent Portfolio');
assert.equal(committee.children[0],mountedBanner,'pre-mounted banner remains first when IC module mounts later');assert.equal(committee.children[1],nav,'persistent tabs follow banner');
assert.equal(nav.children.length,2);assert.equal(get('icPortfolio'),undefined);
ctx.selectSection('research');assert.equal(get(ids.research).hidden,false);assert.equal(get(ids.monthly).hidden,true);
nav.listeners.keydown({target:nav.children[0],key:'ArrowRight',preventDefault(){}});
assert.equal(get(ids.monthly).hidden,false);assert.equal(nav.children[1].attrs['aria-selected'],'true');assert.equal(routes.at(-1),'#investmentCommittee/monthly');
nav.listeners.keydown({target:nav.children[1],key:'Home',preventDefault(){}});assert.equal(get(ids.research).hidden,false);
nav.listeners.click({target:nav.children[1]});assert.equal(get(ids.monthly).hidden,false);
assert.deepEqual(portfolio.children,[legacyTabs,overview]);
for(const id of ['title','desc','app','home'])add(id);
Object.assign(ctx,{$:get,clearTimeout(){},setTimeout(){},navigationTimer:0,navigationBooted:false,loginGateUnlocked:false,NAVIGATION_VIEWS:new Set(),organizationRoute:()=>null,settingsRoute:()=>null,pageMeta:{},setBanner(){},updateFinishScope(){},drawPortfolio(){},cloudUser:null,cloudRecoveryMode:false,window:{scrollTo(){},HaniInvestmentCommittee:{select:ctx.selectSection}}});
ctx.document.querySelectorAll=selector=>selector==='.view'?[portfolio,committee]:[];ctx.document.querySelector=()=>null;
vm.runInContext(main.slice(main.indexOf('const INVESTMENT_COMMITTEE_VIEW='),main.indexOf('const QUICK_JUMP_ITEMS=')),ctx);
for(const route of ['investmentCommittee','investmentCommittee/monthly','investmentCommittee/research']){
  ctx.showView(route);assert.equal(body.dataset.view,'investmentCommittee');assert.equal(committee.classList.contains('active'),true);assert.equal(get(ids.monthly).hidden,!route.endsWith('/monthly'));assert.equal(overview.parentElement,portfolio);
}
const fn=name=>{const start=main.indexOf('function '+name+'(');return main.slice(start,main.indexOf('\nfunction ',start+1));};
let selected=[];
legacyTabs.querySelector=selector=>({click(){selected.push(selector);overview.classList.add('active');}});
ctx.document.querySelector=selector=>selector==='.investment-tabs-main'?legacyTabs:selector.includes('investOverviewStocks')?{click(){stocks.classList.add('active');}}:null;
vm.runInContext(fn('activateInvestmentTab')+'\n'+fn('activateInvestmentStocks'),ctx);
for(const panel of ['investOverview','investMonthly','investManage','investJournal']){ctx.showView('investment');ctx.activateInvestmentTab(panel);assert.equal(body.dataset.view,'investment');assert.equal(overview.parentElement,portfolio);}
assert.equal(selected.length,4);
ctx.activateInvestmentStocks();assert.equal(body.dataset.view,'investment');assert.equal(stocks.classList.contains('active'),true);
// Execute the relocation against existing nodes: a second call reuses the same instances.
const chart=add('assetMarket'),map=add('portfolioLivePreview');const old=add('asset');old.append(chart,map);
ctx.stocks=stocks;
const mounting=main.match(/\[\$\('assetMarket'\),\$\('portfolioLivePreview'\)\][^\n]+/)[0];
vm.runInContext(mounting,ctx);vm.runInContext(mounting,ctx);
assert.deepEqual(stocks.children,[chart,map]);assert.equal(old.children.length,0);
const active=vm.createContext({document:{body,hidden:false},$:get});
vm.runInContext(market.match(/  function isActive\(\)[^\n]+/)[0],active);
assert.equal(active.isActive(),true);
stocks.classList.remove('active');assert.equal(active.isActive(),false);
stocks.classList.add('active');overview.classList.remove('active');assert.equal(active.isActive(),false);
body.dataset.view='asset';assert.equal(active.isActive(),true);active.document.hidden=true;assert.equal(active.isActive(),false);
body.dataset.view='investmentCommittee';active.document.hidden=false;assert.equal(active.isActive(),false);
// The actual polling owner starts/stops as the stock pane becomes visible.
add('marketAccount').value='';let refreshes=0,stops=0;
Object.assign(active,{state:{accounts:[]},signature:'[[],[]]',positions:()=>[],timer:null,generation:0,chartGeneration:0,render(){},refresh(){refreshes++;},setInterval(){return 42;},clearInterval(value){if(value===42)stops++;}});
vm.runInContext(market.slice(market.indexOf('  function sync(){'),market.indexOf("  $('marketAccount').addEventListener")),active);
body.dataset.view='investment';overview.classList.add('active');stocks.classList.add('active');active.sync();assert.equal(refreshes,1);assert.equal(active.timer,42);
active.sync();assert.equal(refreshes,1,'one polling timer');stocks.classList.remove('active');active.sync();assert.equal(active.timer,null);assert.equal(stops,1);
stocks.classList.add('active');active.sync();assert.equal(refreshes,2);active.document.hidden=true;active.sync();assert.equal(active.timer,null);assert.equal(stops,2);active.document.hidden=false;
// The existing asset button owns the same canonical route, without a second navigation handler.
let link;const tabQuery=ctx.document.querySelector;ctx.document.querySelector=selector=>selector==='[data-asset-market-link]'?{addEventListener(_type,callback){link=callback;}}:tabQuery(selector);ctx.root=chart;ctx.requestAnimationFrame=fn=>fn();chart.scrollIntoView=()=>{};
vm.runInContext(market.match(/  document.querySelector\('\[data-asset-market-link\]'\)[\s\S]*?\n  \}\);/)[0],ctx);
link();assert.equal(body.dataset.view,'investment');assert.equal(stocks.classList.contains('active'),true);
assert.match(html,/종목 가격 그래프·보유 맵은 투자 › 종목별에서 볼 수 있어요/);assert.doesNotMatch(html,/종목 가격 그래프 보기|assetPortfolioPanel|assetViewTabs/);
assert.match(market,/class="portfolio-treemap"/);assert.match(main,/investment-overview-tabs"\)\)window\.HaniAssetMarket\?\.sync\(/);
const idsInHtml=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(idsInHtml.length,new Set(idsInHtml).size);
for(const id of ['investmentCommittee','assetMarket','marketChart','portfolioLivePreview'])assert.equal(idsInHtml.filter(x=>x===id).length,1);
assert.match(main,/route\.split\("\/"\)\[0\]===INVESTMENT_COMMITTEE_VIEW/);
console.log('PASS invest split: two persistent IC tabs/keyboard; deep links; four legacy paths; canonical stock route; same chart/map instances; visible stock activity; asset link; unique ids. No storage API supplied to these execution contexts.');
