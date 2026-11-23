// Current authored runtime only: no historical preload or source projection.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const office=read('hani-office-live.js'),core=read('hani-attendance-core.js'),board=read('hani-attendance-board.js');
const affinityKey='hani_office_affinity_v1',bonusKey='hani_attendance_bonus_v1',attendanceKey='hani_attendance_v1';
const user={type:'click',isTrusted:true};
function storage(initial={}){
 const rows=new Map([['hani_os_life_v23','PROTECTED'],['other','KEEP'],...Object.entries(initial)]),reads=[],writes=[];
 return {rows,reads,writes,getItem(k){reads.push(k);return rows.get(k)??null},setItem(k,v){assert.ok([affinityKey,bonusKey,attendanceKey].includes(k),'scoped write');writes.push([k,String(v)]);rows.set(k,String(v))},removeItem(){assert.fail('remove')},clear(){assert.fail('clear')}};
}
function affinity(s=storage()){
 let clock=+new Date('2026-11-23T12:00:00+09:00');
 class Clock extends Date{constructor(...a){super(...(a.length?a:[clock]))}static now(){return clock}}
 const ctx=vm.createContext({localStorage:s,Date:Clock,console:{warn(){}}});
 const start=office.indexOf('  function createOfficeAffinity(){'),end=office.indexOf('  function createTapLines(',start);
 assert.ok(start>0&&end>start,'canonical affinity owner');
 vm.runInContext(office.slice(start,end)+';globalThis.a=createOfficeAffinity()',ctx);
 return {a:ctx.a,s,advance:ms=>clock+=ms};
}
function makeDom(){
 function element(tag){
  const classes=new Set(),attrs=new Map(),events=new Map();
  const e={tagName:tag.toUpperCase(),children:[],parentNode:null,style:{},hidden:false,disabled:false,textContent:'',
   get id(){return attrs.get('id')||''},set id(v){attrs.set('id',String(v))},
   get className(){return [...classes].join(' ')},set className(v){classes.clear();for(const c of v.split(/\s+/))if(c)classes.add(c)},
   classList:{add(...cs){cs.forEach(c=>classes.add(c))},toggle(c,on){on=on??!classes.has(c);on?classes.add(c):classes.delete(c);return on},contains:c=>classes.has(c)},
   setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k)??null,removeAttribute:k=>attrs.delete(k),
   append(...nodes){nodes.forEach(n=>e.insertBefore(n,null))},insertBefore(n,ref){if(n.parentNode)n.remove();n.parentNode=e;const i=ref?e.children.indexOf(ref):-1;i<0?e.children.push(n):e.children.splice(i,0,n);return n},
   remove(){if(e.parentNode){const list=e.parentNode.children;list.splice(list.indexOf(e),1);e.parentNode=null}},
   get nextElementSibling(){return e.parentNode?.children[e.parentNode.children.indexOf(e)+1]||null},
   contains:n=>n===e||e.children.some(c=>c.contains(n)),
   addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn)},
   click(){for(const fn of events.get('click')||[])fn({target:e,...user})}
  };return e;
 }
 const home=element('section'),actions=element('div');home.id='home';actions.id='homeActions';home.append(actions);
 const find=(n,id)=>n.id===id?n:n.children.map(c=>find(c,id)).find(Boolean)||null;
 return {home,document:{createElement:element,getElementById:id=>find(home,id)}};
}
function bootBoard(s){
 let clock=+new Date('2026-11-23T12:00:00+09:00');
 class Clock extends Date{constructor(...a){super(...(a.length?a:[clock]))}static now(){return clock}}
 const dom=makeDom(),ctx=vm.createContext({Date:Clock,document:dom.document,localStorage:s});ctx.window=ctx;ctx.globalThis=ctx;
 vm.runInContext(core,ctx);const A=ctx.HaniAttendance;let state=A.normalize(null);
 for(let d=17;d<=22;d++)state=A.stamp(state,'2026-11-'+d).state;
 s.rows.set(attendanceKey,JSON.stringify(state));
 vm.runInContext(board,ctx);
 return {ctx,dom,refs:dom.document.getElementById('attendanceBoard')._attRefs};
}

test('no bonus ledger preserves counts and does not write on get',()=>{
 const s=storage({[affinityKey]:JSON.stringify({v:1,counts:{hani:12,ieum:3}})}),{a}=affinity(s);
 assert.equal(a.get('hani').count,12);assert.equal(a.get('ieum').count,3);assert.equal(a.get('unknown').count,0);
 assert.deepEqual(s.writes,[]);assert.equal(s.rows.has(bonusKey),false);
});
test('two grants add four, unknown staff/date entries are ignored, live reads refresh',()=>{
 const s=storage({[affinityKey]:JSON.stringify({v:1,counts:{hani:12}}),[bonusKey]:JSON.stringify({v:1,grants:{'2026-11-01':'hani','2026-11-08':'hani','2026-11-15':'unknown',bad:'hani'}})}),{a}=affinity(s);
 assert.equal(a.get('hani').count,16);assert.equal(a.get('unknown').count,0);assert.equal(a.get('__proto__').count,0);
 s.rows.set(bonusKey,JSON.stringify({v:1,grants:{'2026-11-01':'hani'}}));assert.equal(a.get('hani').count,14);
 assert.deepEqual(s.writes,[]);
});
test('malformed ledger contributes zero and preserves every original key',()=>{
 for(const raw of ['{broken','null','[]',JSON.stringify({v:2,grants:{'2026-11-01':'hani'}}),JSON.stringify({v:1,grants:[]})]){
  const s=storage({[affinityKey]:JSON.stringify({v:1,counts:{hani:12}}),[bonusKey]:raw}),before=new Map(s.rows),{a}=affinity(s);
  assert.equal(a.get('hani').count,12);assert.deepEqual(s.rows,before);assert.deepEqual(s.writes,[]);
 }
});
test('trusted tap persists only base counts, bonus remains separate after reload',()=>{
 const raw=JSON.stringify({v:1,grants:{'2026-11-01':'hani','2026-11-08':'hani'}});
 const s=storage({[affinityKey]:JSON.stringify({v:1,counts:{hani:12}}),[bonusKey]:raw}),x=affinity(s);
 assert.equal(x.a.get('hani').count,16);assert.equal(x.a.tap('hani',user).count,17);
 x.advance(2000);x.a.flush();
 assert.deepEqual(JSON.parse(s.rows.get(affinityKey)),{v:2,counts:{hani:13},day:'2026-11-23',today:{hani:1}});
 assert.equal(s.rows.get(bonusKey),raw);assert.deepEqual(s.writes.map(([k])=>k),[affinityKey]);
 assert.equal(affinity(s).a.get('hani').count,17);assert.equal(s.rows.get('hani_os_life_v23'),'PROTECTED');assert.equal(s.rows.get('other'),'KEEP');
});
test('seventh attendance click grants once, repeat and remount preserve the ledger',()=>{
 const s=storage(),x=bootBoard(s),slot=x.dom.document.getElementById('attendanceBoard');
 assert.equal(s.rows.has(bonusKey),false);x.refs.btn.click();
 const grant=JSON.parse(s.rows.get(bonusKey)),id=grant.grants['2026-11-23'];
 assert.equal(grant.v,1);assert.equal(Object.keys(grant.grants).length,1);assert.ok(x.ctx.HaniAttendanceBoard.CREW.some(c=>c.id===id));
 assert.match(x.refs.rewardText.textContent,/호감도 \+2 ♡/);assert.equal(x.refs.btn.disabled,true);
 x.refs.btn.click();x.ctx.HaniAttendanceBoard.render();
 assert.strictEqual(x.dom.document.getElementById('attendanceBoard'),slot);assert.deepEqual(JSON.parse(s.rows.get(bonusKey)),grant);
 assert.equal(s.writes.filter(([k])=>k===bonusKey).length,1);assert.equal(affinity(s).a.get(id).count,2);
 // Execute a fresh board context against the saved seventh-day state.
 const dom=makeDom(),ctx=vm.createContext({document:dom.document,localStorage:s});ctx.window=ctx;ctx.globalThis=ctx;
 vm.runInContext(core,ctx);ctx.HaniAttendance={...ctx.HaniAttendance,todayKey:()=> '2026-11-23'};vm.runInContext(board,ctx);
 dom.document.getElementById('attendanceBoard')._attRefs.btn.click();assert.deepEqual(JSON.parse(s.rows.get(bonusKey)),grant);
 assert.equal(s.writes.filter(([k])=>k===bonusKey).length,1);assert.equal(s.rows.get('hani_os_life_v23'),'PROTECTED');
});
test('seventh attendance click never overwrites malformed bonus ledger',()=>{
 for(const raw of ['{broken','null',JSON.stringify({v:2,grants:{}}),JSON.stringify({v:1,grants:[]})]){
  const s=storage({[bonusKey]:raw}),x=bootBoard(s);x.refs.btn.click();x.refs.btn.click();
  assert.equal(s.rows.get(bonusKey),raw);assert.equal(s.writes.filter(([k])=>k===bonusKey).length,0);
  assert.doesNotMatch(x.refs.rewardText.textContent,/호감도 \+2/);assert.equal(x.refs.btn.disabled,true);
  assert.equal(s.rows.get('hani_os_life_v23'),'PROTECTED');assert.equal(s.rows.get('other'),'KEEP');
 }
});
