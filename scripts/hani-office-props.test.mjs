import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
const expected=[
 ['coffee-desk','coffee-steam','1f',238,570,32,48,'bottom-center'],
 ['coffee-counter','coffee-steam','1f',1530,720,32,48,'bottom-center'],
 ['plant','plant-sway','2f',1197,314,48,64,'bottom-center'],
 ['monitor','monitor-glow','3f',466,480,64,40,'center'],
 ['lantern','lantern-flicker','5f',1380,738,40,56,'bottom-center'],
 ['stamp','stamp-sparkle','3f',213,676,32,32,'center'],
 ['paper','paper-flutter','1f',1605,520,40,48,'center']
];
async function mount({reduced=false,load=()=>true,time='20:00',width=1280}={}){
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture(time,reduced,load,null,{
  HaniOfficeV2Assets:assets,
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout:()=>0,clearTimeout(){},localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny
 });
 await flush();return {f,writes,layer:f.map.querySelector('.hani-office-live-props')};
}

test('props: one persistent map layer and seven persistent, map-relative slots across floors and clocks',async()=>{
 for(const width of [390,1280]){
  const {f,layer,writes}=await mount({width}),props=[...layer.children],nodes=f.root.querySelectorAll('*');
  assert.equal(layer.parentElement,f.map);assert.equal(layer.getAttribute('aria-hidden'),'true');assert.equal(props.length,7);
  assert.equal(f.map.querySelectorAll('.hani-office-live-props').length,1);
  props.forEach((p,i)=>{const [id,sprite,,x,y,w,h,anchor]=expected[i];assert.equal(p.dataset.prop,id);assert.equal(p.dataset.sprite,sprite);assert.equal(p.dataset.anchor,anchor);
   for(const [key,n,d] of [['left',x,1672],['top',y,941],['width',w,1672],['height',h,941]])assert.equal(p.style[key],n/d*100+'%');
  });
  let created=0;const create=f.document.createElement;f.document.createElement=(...a)=>{created++;return create(...a)};
  for(const time of ['10:00','20:00','06:00'])for(const floor of ['1f','2f','3f','4f','5f','1f']){
   f.setTime(time);f.click(floor);await flush();assert.equal(layer.hidden,false);
   props.forEach((p,i)=>assert.equal(p.hidden,expected[i][2]!==floor||(p.dataset.prop==='lantern'&&time!=='20:00'),p.dataset.prop+' '+floor+' '+time));
   for(const timer of f.timers)timer.fn();await flush();
  }
  assert.equal(created,0);assert.deepEqual(layer.children,props);assert.deepEqual(f.root.querySelectorAll('*'),nodes);assert.deepEqual(writes,[]);
 }
});

test('props: lantern follows committed night art, exact 18:30/06:00 boundary, fallback and loading',async()=>{
 const {f,layer}=await mount({time:'18:29'}),lantern=layer.children.find(p=>p.dataset.prop==='lantern');
 for(const [time,hidden] of [['18:29',true],['18:30',false],['05:59',false],['06:00',true]]){
  const previousFloor=f.map.dataset.floor,previousArt=f.map.querySelector('.hani-office-background').src;
  f.setTime(time);const nextArt=f.context.HaniBuildingScene.atmosphere.background(f.context.HaniBuildingScene.floors.find(x=>x.id==='5f'));f.click('5f');assert.equal(layer.hidden,previousFloor!=='5f'||previousArt!==nextArt);await flush();assert.equal(lantern.hidden,hidden);
  const floor=f.context.HaniBuildingScene.floors.find(x=>x.id==='5f');assert.equal(f.map.querySelector('.hani-office-background').src,hidden?floor.background:floor.nightBackground);
 }
 for(const load of [src=>!src.includes('night'),()=>false]){
  const x=await mount({load});x.f.click('5f');await flush();assert.equal(x.layer.children.find(p=>p.dataset.prop==='lantern').hidden,true);
  if(x.f.map.dataset.art==='fallback')assert.equal(x.layer.hidden,true);assert.deepEqual(x.writes,[]);
 }
 f.click('1f');assert.equal(layer.hidden,true);await flush();assert.equal(lantern.hidden,true);
});

test('props: CSS owns four-frame timing, long-idle sparkle, tap-through, stacking and reduced frame 2',()=>{
 const css=read('hani-office-live.css'),source=read('hani-office-live.js');
 const rule=s=>{const start=css.indexOf(s+'{');assert.ok(start>=0,s);return css.slice(start,css.indexOf('}',start)+1)};
 assert.match(rule('.hani-office-live-props'),/z-index:2;pointer-events:none/);
 assert.match(rule('.hani-office-live-prop'),/pointer-events:none/);assert.match(rule('.hani-office-live-prop'),/background-size:400% 100%/);
 assert.match(rule('.hani-office-live-prop'),/4\.8s steps\(4\) infinite/);
 assert.match(rule('.hani-office-live-prop[data-sprite="coffee-steam"]'),/2\.4s/);
 assert.match(rule('.hani-office-live-prop[data-sprite="lantern-flicker"]'),/3\.2s/);
 assert.match(rule('.hani-office-live-prop[data-sprite="monitor-glow"]'),/opacity:\.32/);
 assert.match(rule('.hani-office-live-prop[data-sprite="stamp-sparkle"]'),/animation-duration:12s/);
 assert.match(css,/@keyframes hani-office-prop-sparkle\{0%\{opacity:1[\s\S]*6\.666667%\{opacity:1[\s\S]*6\.666668%,100%\{opacity:0/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\s*\.hani-office-live-props \.hani-office-live-prop\{animation:none;background-position:33\.333333% 0\}/);
 assert.match(css,/\.hani-office-live-prop\[hidden\][\s\S]*animation-play-state:paused/);
 assert.match(rule('.hani-office-sprite'),/z-index:4/);assert.match(rule('.hani-office-character-bubble'),/z-index:10/);
 for(const art of new Set(expected.map(x=>x[1])))assert.ok(css.includes('"./assets/office-props/'+art+'.webp"'));
 const added=source.slice(source.indexOf('  // Approved four-frame art:'),source.indexOf('  let activeFloor="4f",'));
 assert.doesNotMatch(added,/setTimeout|setInterval|requestAnimationFrame|addEventListener|\.on\w+\s*=|localStorage|sessionStorage|supabase|\.setItem|\.removeItem|\.clear\(/);
});

test('props: reduced-motion owner remains persistent, floor-scoped and write-free',async()=>{
 const {f,layer,writes}=await mount({reduced:true,width:390}),props=[...layer.children];
 for(const floor of ['1f','2f','3f','5f']){f.click(floor);await flush();assert.equal(layer.hidden,false);assert.deepEqual(layer.children,props);props.forEach((p,i)=>assert.equal(p.hidden,expected[i][2]!==floor))}
 assert.deepEqual(writes,[]);
});

test('props: scheduler/plan/blockPlan/snapshot/labels/home-clear source bytes and all six assets are unchanged',()=>{
 const hash=x=>createHash('sha256').update(x).digest('hex'),source=read('hani-office-live.js'),base=JSON.parse(read('artifacts/office-props-live/baseline.json'));
 for(const row of base.sections){const i=source.indexOf(row.start),j=source.indexOf(row.end,i);assert.ok(i>=0&&j>i,row.name);assert.equal(hash(source.slice(i,j)),row.sha256,row.name)}
 for(const row of base.assets)assert.equal(hash(fs.readFileSync(new URL('../'+row.file,import.meta.url))),row.sha256,row.file);
 const {scene}=loadScene(),s=scene.scheduler,original=JSON.parse(read('artifacts/office-snack/baseline.json'));
 for(const row of original.models){const formal=s.plan(row.day,row.options);assert.equal(hash(JSON.stringify(formal)),row.plan);assert.equal(hash(JSON.stringify(s.blockPlan(row.day,0,formal,row.options))),row.blockPlan);
  for(const snap of row.snapshots){assert.equal(hash(JSON.stringify(s.snapshot(at(row.day,snap.seconds),row.options))),snap.scheduler);assert.equal(hash(JSON.stringify(scene.snapshot(at(row.day,snap.seconds),row.options))),snap.view)}
 }
});
