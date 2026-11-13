// node --test scripts/hani-theme-thaw.test.mjs
// Actual owners, injected clock, disposable DOM/storage only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {readBranchBaseline} from './hani-regression-baseline.mjs';
const source=fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8');
const definitions=JSON.parse(fs.readFileSync(new URL('../assets/theme-collections/collections.json',import.meta.url),'utf8'));
const block=source.slice(source.indexOf('const THEME_COLLECTIONS='),source.indexOf('function syncSeasonCollection(){'));
const fn=name=>source.match(new RegExp('function '+name+'\\([^]*?\\n\\}'))[0];
const times=['2027-01-08T08:59:59+09:00','2027-01-08T09:00+09:00','2027-02-08T09:00+09:00','2027-02-15T09:00+09:00'];
class Node{
  constructor(tag='div'){this.tagName=tag;this.dataset={};this.children=[];this.hidden=false;this.disabled=false;this.open=false;this.attrs={};this.nodes=new Map()}
  set innerHTML(value){this.html=value;this.nodes.clear();for(const match of value.matchAll(/<([\w-]+)([^>]*)>/g)){const node=new Node(match[1]);for(const [,key,val]of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)){node.attrs[key]=val??'';if(key==='id')node.id=val}if(!this.nodes.has(match[1]))this.nodes.set(match[1],node);for(const key of Object.keys(node.attrs))if(key.startsWith('data-'))this.nodes.set('['+key+']',node);if(node.attrs.class)for(const cls of node.attrs.class.split(' '))this.nodes.set('.'+cls,node)}}
  get innerHTML(){return this.html}
  querySelector(selector){return this.nodes.get(selector)||null}
  setAttribute(key,value){this.attrs[key]=value}
  appendChild(node){this.children.push(node);return node}
  after(node){this.sibling=node}
  showModal(){this.open=true}
  close(){this.open=false}
  getBoundingClientRect(){return {left:0,right:100,top:0,bottom:100}}
}
function harness(now){
  const roots=new Map(['auraSeasons','homeActions','theme','seasonTransition'].map(id=>[id,new Node()])),body=new Node(),writes=[],storage=new Map([['hani_os_life_v23','protected sentinel'],['hani_os_signature_finish_v1','midnight-black'],['hani_os_season_theme_v1','winter']]);
  let clock=Date.parse(now),route='',tab=0;
  const find=id=>roots.get(id)||[...roots.values()].flatMap(n=>n.children).find(n=>n.id===id)||null;
  class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
  const context=vm.createContext({Date:Clock,Intl,Map,Set,console,Number,URL,document:{baseURI:'https://hani.example/HANI_OS/',body,documentElement:{dataset:{finish:'midnight-black',season:'winter'}},createElement:tag=>new Node(tag),querySelector:()=>({click(){tab++}}),querySelectorAll:()=>[]},$:find,esc:s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;'),localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>{writes.push([key,value]);storage.set(key,value)}},showView:id=>{route=id},updateFinishScope(){},syncSeasonCollection(){},clearTimeout(){},setTimeout(){},activeAccountId:null});
  vm.runInContext(source.slice(source.indexOf('const SEASON_THEMES='),source.indexOf('let seasonTransitionTimer;'))+'\nlet seasonTransitionTimer;const SEASON_THEME_KEY="hani_os_season_theme_v1";\n'+fn('applySignatureFinish')+'\n'+fn('applySeasonTheme')+'\n'+block+'\nTHEME_COLLECTIONS.push(...'+JSON.stringify(definitions)+');globalThis.collections=THEME_COLLECTIONS;globalThis.memory=themeCollectionMemory;',context);
  return {context,roots,body,writes,storage,clock(value){clock=Date.parse(value)},route:()=>route,tab:()=>tab,run:(code)=>vm.runInContext(code,context)};
}
for(const [index,phase]of ['before','teaser','launch','after'].entries())test(phase+': real rendering, launch lock, preference preservation, zero passive writes',()=>{
  const h=harness(times[index]),c=h.context;
  c.syncThemeCollections();
  assert.equal(c.themeCollectionPhase(c.collections[0]).phase,phase);
  const row=c.memory.rows.get('thaw-2027q1'),apply=row.querySelector('[data-collection-apply]');
  assert.equal(apply.disabled,index<2);
  assert.equal(row.querySelector('[data-collection-replay]').hidden,index<2);
  const home=c.memory.home;
  assert.equal(!!home&&!home.hidden,index===1||index===2);
  if(index===1)assert.equal(home.querySelector('[data-collection-countdown]').textContent,'D-31');
  assert.equal(c.openThemeCollection('thaw-2027q1'),index>=2);
  if(index>=2){assert.equal(c.memory.dialog.open,true);c.memory.dialog.close()}
  const originalHome=c.memory.home;c.syncThemeCollections();assert.equal(c.memory.home,originalHome);
  assert.equal(c.memory.rows.size,1);assert.equal(h.roots.get('auraSeasons').children.length,1);
  assert.deepEqual(h.writes,[]);
  assert.equal(c.document.documentElement.dataset.finish,'midnight-black');assert.equal(c.document.documentElement.dataset.season,'winter');
  assert.equal(h.storage.get('hani_os_life_v23'),'protected sentinel');
  if(index<2){assert.equal(c.applyThemeCollection('thaw-2027q1'),false);assert.deepEqual(h.writes,[])}
});
test('KST exact boundaries, calendar D-day, launch +7 days, no invalid-date unlock',()=>{
  const h=harness(times[0]),c=h.context,collection=c.collections[0];
  for(const [date,phase,days]of [['2027-01-08T08:59:59+09:00','before',31],['2027-01-08T00:00:00Z','teaser',31],['2027-02-01T00:00:00Z','teaser',7],['2027-02-07T23:59:59+09:00','teaser',1],['2027-02-08T08:59:59+09:00','teaser',0],['2027-02-08T00:00:00Z','launch',0],['2027-02-15T08:59:59+09:00','launch',0],['2027-02-15T00:00:00Z','after',0]]){const state=c.themeCollectionPhase(collection,date);assert.equal(state.phase,phase,date);assert.equal(state.days,days,date)}
  assert.equal(Date.parse(collection.promoEnd)-Date.parse(collection.launch),7*86400000);
  assert.equal(c.themeCollectionPhase(collection,'invalid').locked,true);
});
for(const now of ['2026-11-13T12:00:00+09:00','2026-12-20T12:00:00+09:00'])test(now+': before teaser hides home, while SEASON exhibits the locked collection without saving',()=>{
  const h=harness(now),c=h.context;c.syncThemeCollections();
  assert.equal(c.themeCollectionPhase(c.collections[0]).phase,'before');
  assert.equal(c.memory.home,null);
  const row=c.memory.rows.get('thaw-2027q1');assert.ok(row);assert.equal(row.hidden,false);
  assert.match(row.innerHTML,/THAW/);assert.equal(row.querySelector('[data-collection-apply]').disabled,true);
  assert.equal(row.querySelector('[data-collection-replay]').hidden,true);
  assert.equal(c.openThemeCollection('thaw-2027q1'),false);assert.deepEqual(h.writes,[]);
});
test('catalog loader uses injected read, keeps themes on failure, and reuses rows',async()=>{
  const h=harness(times[2]),c=h.context;c.syncThemeCollections();const row=c.memory.rows.get('thaw-2027q1');
  assert.equal(await c.loadThemeCollections(async()=>({ok:true,json:async()=>definitions})),true);
  assert.equal(c.memory.rows.get('thaw-2027q1'),row);assert.equal(c.collections.length,1);
  assert.equal(await c.loadThemeCollections(async()=>{throw Error('offline')}),false);
  assert.equal(await c.loadThemeCollections(async()=>({ok:false})),false);
  assert.equal(await c.loadThemeCollections(async()=>({ok:true,json:async()=>({bad:true})})),false);
  assert.equal(c.collections.length,1);assert.deepEqual(h.writes,[]);assert.equal(c.document.documentElement.dataset.season,'winter');
});

test('literal fetch resolves both artwork paths from the JSON URL under a Pages prefix',async()=>{
  const h=harness(times[2]),c=h.context,requests=[];
  const jsonUrl='https://hani.example/HANI_OS/assets/theme-collections/collections.json';
  c.fetch=async url=>{requests.push(url);return {ok:true,url:jsonUrl,json:async()=>structuredClone(definitions)}};
  assert.equal(await c.loadThemeCollections(),true);
  assert.deepEqual(requests,['./assets/theme-collections/collections.json']);
  assert.equal(c.collections[0].art,'https://hani.example/HANI_OS/assets/theme-collections/thaw-2027q1/teaser-wide.webp');
  assert.equal(c.collections[0].mobileArt,'https://hani.example/HANI_OS/assets/theme-collections/thaw-2027q1/teaser-mobile.webp');
  const row=c.memory.rows.get('thaw-2027q1');
  assert.equal(row.querySelector('img').attrs.src,c.collections[0].art);
  assert.equal(row.querySelector('source').attrs.srcset,c.collections[0].mobileArt);
  assert.deepEqual(h.writes,[]);assert.equal(h.storage.get('hani_os_life_v23'),'protected sentinel');
  const redirected='https://hani.example/preview/assets/theme-collections/collections.json';
  assert.equal(await c.loadThemeCollections(async()=>({ok:true,url:redirected,json:async()=>definitions})),true);
  assert.equal(c.collections[0].art,new URL(definitions[0].art,redirected).href);
  assert.equal(c.collections[0].mobileArt,new URL(definitions[0].mobileArt,redirected).href);
  assert.equal(await c.loadThemeCollections(async()=>({ok:true,json:async()=>definitions})),true);
  assert.equal(c.collections[0].art,new URL(definitions[0].art,jsonUrl).href,'injected response fallback uses the requested JSON location');
  assert.equal(c.collections[0].mobileArt,new URL(definitions[0].mobileArt,jsonUrl).href);
  assert.equal(definitions[0].art,'thaw-2027q1/teaser-wide.webp');
  assert.equal(definitions[0].mobileArt,'thaw-2027q1/teaser-mobile.webp');
  const before=c.collections[0];
  assert.equal(await c.loadThemeCollections(async()=>({ok:true,url:'invalid',json:async()=>definitions})),false);
  assert.equal(c.collections[0],before);assert.deepEqual(h.writes,[]);
});
test('same persistent nodes through four phases; dismissal is session memory only',()=>{
  const h=harness(times[0]),c=h.context;c.syncThemeCollections();const row=c.memory.rows.get('thaw-2027q1');
  h.clock(times[1]);c.syncThemeCollections();const card=c.memory.home;card.querySelector('[data-collection-dismiss]').onclick();assert.equal(card.hidden,true);
  h.clock(times[2]);c.syncThemeCollections();assert.equal(card.hidden,true);assert.equal(c.memory.rows.get('thaw-2027q1'),row);
  h.clock(times[3]);c.syncThemeCollections();assert.equal(card.hidden,true);assert.equal(row.querySelector('[data-collection-apply]').disabled,false);assert.deepEqual(h.writes,[]);
  const fresh=harness(times[2]);fresh.context.syncThemeCollections();assert.equal(fresh.context.memory.home.hidden,false);
});
test('explicit apply writes only canonical IDs; reload restores choices without new ID',()=>{
  const h=harness(times[2]),c=h.context;c.syncThemeCollections();
  c.memory.home.querySelector('[data-collection-open]').onclick();assert.equal(c.memory.dialog.open,true);assert.deepEqual(h.writes,[]);
  c.memory.dialog.querySelector('[data-collection-studio]').onclick();assert.equal(h.route(),'aura');assert.equal(h.tab(),1);assert.deepEqual(h.writes,[]);
  c.memory.rows.get('thaw-2027q1').querySelector('[data-collection-apply]').onclick();
  assert.deepEqual(h.writes,[['hani_os_signature_finish_v1','alpine-blue'],['hani_os_season_theme_v1','spring']]);
  const saved=[...h.storage];h.writes.length=0;c.applySignatureFinish(h.storage.get('hani_os_signature_finish_v1'));c.applySeasonTheme(h.storage.get('hani_os_season_theme_v1'));assert.deepEqual([...h.storage],saved);assert.deepEqual(h.writes,[]);assert.equal(h.storage.get('hani_os_life_v23'),'protected sentinel');
});
test('all existing 6 × 4 combinations survive passive campaign rendering and replay',()=>{
  const h=harness(times[2]),c=h.context;
  for(const finish of ['porcelain-cream','pure-white','titanium-graphite','midnight-black','sakura-pink','alpine-blue'])for(const season of ['spring','summer','autumn','winter']){c.applySignatureFinish(finish);c.applySeasonTheme(season);c.syncThemeCollections();c.openThemeCollection('thaw-2027q1');c.memory.dialog.close();assert.equal(c.document.documentElement.dataset.finish,finish);assert.equal(c.document.documentElement.dataset.season,season)}
  assert.deepEqual(h.writes,[]);assert.equal(h.storage.get('hani_os_life_v23'),'protected sentinel');
});
test('canonical theme/storage owners and all pre-existing write expressions are byte-preserved',()=>{
  const base=readBranchBaseline('hani-main.js');
  for(const name of ['applySignatureFinish','applySeasonTheme','syncSeasonCollection','commit','save','writeProtectedState'])assert.equal(fn(name),base.match(new RegExp('function '+name+'\\([^]*?\\n\\}'))[0],name);
  const writes=s=>s.match(/\b(?:commit|save|writeProtectedState|localStorage\.(?:setItem|removeItem|clear))\([^)]*\)/g);
  assert.deepEqual(writes(source),writes(base));
  assert.equal(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),readBranchBaseline('index.html'));
});
