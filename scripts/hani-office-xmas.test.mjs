import {stripApprovedAffinityStorage} from './hani-office-affinity-storage.mjs';
import test from 'node:test';
import {restoreBarista273Source} from './hani-office-barista-night-273-source.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from './hani-building-206-engine.test.mjs';
import {assets} from './hani-office-v2-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {restorePets268Source} from './hani-office-pets-268-source.mjs';
import {xmas269Delta} from './hani-office-xmas-269-source.mjs';
import {restoreBori272Source} from './hani-office-pet-bori-272-source.mjs';
import {normalizeReleaseVersion,readReleaseSource} from './hani-reviewed-release-baseline.mjs';
import {approvedOfficeRuntimeAdditions} from './hani-office-runtime-additions.mjs';

const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const source=read('hani-office-live.js'),css=read('hani-office-live.css');
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
const expected=[
 ['xmas-tree','1f',493,435,112,136,'bottom-center'],
 ['xmas-snow','1f',1580,230,160,204,'center'],
 ['xmas-wreath','1f',832,196,76,76,'center'],
 ['xmas-gifts','1f',520,443,48,36,'bottom-center'],
 ['xmas-lights','5f',1344,565,384,64,'bottom-center']
];
const layouts=['event-tall','event-window','event-wall','event-floor','event-wide'];
const rule=selector=>{const i=css.indexOf(selector+'{');assert.ok(i>=0,selector);return css.slice(i,css.indexOf('}',i)+1)};
async function mount({date='2026-12-24T20:00:00+09:00',floor='1f',width=1280,reduced=false,load=()=>true}={}){
 const writes=[],deny=(...args)=>{writes.push(args);throw Error('unexpected persistence')};
 const f=fixture('20:00',reduced,load,null,{
  HaniOfficeV2Assets:assets,
  matchMedia:q=>({matches:q.includes('prefers-reduced-motion')?reduced:width<=Number(q.match(/max-width:\s*(\d+)/)?.[1]||0),addEventListener(){}}),
  setTimeout:()=>0,clearTimeout(){},localStorage:{setItem:deny,removeItem:deny,clear:deny},sessionStorage:{setItem:deny,removeItem:deny,clear:deny},save:deny
 });
 f.setDateTime(date);f.click(floor);await flush();
 const layer=f.map.querySelector('.hani-office-live-props'),decorations=layer.children.filter(p=>p.dataset.event==='christmas');
 return {f,layer,decorations,writes};
}

test('xmas: annual KST start/end boundaries include the entire final minute',async()=>{
 const {f,decorations,writes}=await mount();
 for(const year of [2026,2027])for(const [stamp,active] of [
  ['11-30T23:59:00',false],['11-30T23:59:59.999',false],['12-01T00:00:00',true],
  ['12-26T23:59:00',true],['12-26T23:59:59.999',true],['12-27T00:00:00',false],['01-01T12:00:00',false]
 ]){
  f.setDateTime(`${year}-${stamp}+09:00`);f.click('1f');await flush();
  assert.equal(decorations.filter(p=>!p.hidden).length,active?4:0,year+' '+stamp);
 }
 // UTC date differs: the same KST boundary must still activate the decorations.
 f.setDateTime('2026-11-30T15:00:00Z');f.click('1f');await flush();
 assert.equal(decorations.filter(p=>!p.hidden).length,4);assert.deepEqual(writes,[]);
});

test('xmas: same-floor clock ticks toggle the event without a click, new timer or listener',async()=>{
 const {f,decorations}=await mount({date:'2026-11-30T23:59:59+09:00'});
 const tick=f.timers.find(t=>t.ms===100);assert.ok(tick);
 assert.ok(decorations.every(p=>p.hidden));
 f.setDateTime('2026-12-01T00:00:00+09:00');tick.fn();await flush();
 assert.equal(decorations.filter(p=>!p.hidden).length,4);
 f.setDateTime('2026-12-27T00:00:00+09:00');tick.fn();await flush();
 assert.ok(decorations.every(p=>p.hidden));
 const before=read('artifacts/office-xmas-live/before.js');
 for(const token of ['setInterval(','setTimeout(','requestAnimationFrame(','addEventListener(','document.createElement('])
  assert.equal(restoreBarista273Source(source).split(token).length,before.split(token).length,token);
});

test('xmas: all five map-relative slots are created once, floor-scoped and tap-through at both widths',async()=>{
 for(const width of [390,1280])for(const reduced of [false,true]){
  const {f,layer,decorations,writes}=await mount({width,reduced}),nodes=f.root.querySelectorAll('*'),all=[...layer.children];
  assert.equal(layer.parentElement,f.map);assert.equal(layer.getAttribute('aria-hidden'),'true');
  assert.equal(f.map.querySelectorAll('.hani-office-live-props').length,1);assert.equal(all.length,12);assert.equal(decorations.length,5);
  decorations.forEach((p,i)=>{const [id,,x,y,w,h,anchor]=expected[i];assert.equal(p.dataset.prop,id);assert.equal(p.dataset.sprite,layouts[i]);assert.equal(p.dataset.anchor,anchor);assert.equal(p.style.backgroundImage,'url("./assets/office-season/xmas.webp")');
   for(const [key,n,d]of [['left',x,1672],['top',y,941],['width',w,1672],['height',h,941]])assert.equal(p.style[key],n/d*100+'%');
  });
  let created=0;const create=f.document.createElement;f.document.createElement=(...args)=>{created++;return create(...args)};
  for(const floor of ['1f','2f','3f','4f','5f','1f']){
   f.click(floor);await flush();decorations.forEach((p,i)=>assert.equal(p.hidden,expected[i][1]!==floor,p.dataset.prop+' '+floor));
   f.timers.find(t=>t.ms===100).fn();await flush();
  }
  assert.equal(created,0);assert.deepEqual(layer.children,all);assert.deepEqual(f.root.querySelectorAll('*'),nodes);assert.deepEqual(writes,[]);
 }
 assert.match(rule('.hani-office-live-props'),/z-index:2;pointer-events:none/);
 assert.match(rule('.hani-office-live-prop'),/pointer-events:none/);
 assert.match(rule('.hani-office-sprite'),/z-index:4/);assert.match(rule('.hani-office-character-bubble'),/z-index:10/);
});

test('xmas: rooftop lights follow the same committed night background as the lantern, including fallback/loading',async()=>{
 const {f,layer,decorations,writes}=await mount({floor:'5f'}),lights=decorations.find(p=>p.dataset.prop==='xmas-lights'),lantern=layer.children.find(p=>p.dataset.prop==='lantern');
 for(const [time,hidden]of [['18:29',true],['18:30',false],['05:59',false],['06:00',true]]){
  f.setDateTime(`2026-12-24T${time}:00+09:00`);f.click('5f');await flush();
  assert.equal(lights.hidden,hidden,time);assert.equal(lights.hidden,lantern.hidden);
 }
 for(const load of [src=>!src.includes('night'),()=>false]){
  const x=await mount({floor:'5f',load});assert.ok(x.decorations.every(p=>p.hidden));assert.deepEqual(x.writes,[]);
 }
 f.click('1f');assert.equal(layer.hidden,true);await flush();assert.equal(lights.hidden,true);assert.deepEqual(writes,[]);
});

test('xmas: CSS rectangles sample the original frames, animations use steps(4), reduced motion fixes frame 2',()=>{
 assert.match(rule('.hani-office-live-prop[data-event="christmas"]'),/url\("\.\/assets\/office-season\/xmas\.webp"\)/);
 assert.match(rule('.hani-office-live-prop[data-event]'),/3\.2s steps\(4\) infinite/);
 assert.match(css,/@keyframes hani-office-event-frames\{from\{background-position:var\(--event-x\) var\(--event-y\)\}to\{background-position:var\(--event-end\) var\(--event-y\)\}\}/);
 const rects=[[0,0,112,136,4],[0,140,88,112,4],[0,256,76,76,1],[80,256,80,60,1],[0,336,384,64,4]];
 expected.forEach(([id],i)=>{
  const r=rule(`.hani-office-live-prop[data-sprite="${layouts[i]}"]`),[x,y,w,h,count]=rects[i];
  const size=r.match(/background-size:([\d.]+)% ([\d.]+)%/);assert.ok(size,id);
  assert.ok(Math.abs(Number(size[1])*w/100-1536)<.00001,id+' atlas width');assert.ok(Math.abs(Number(size[2])*h/100-400)<.00001,id+' atlas height');
  const value=(key,fallback=0)=>Number(r.match(new RegExp(`--event-${key}:([\\d.]+)%`))?.[1]??fallback);
  assert.ok(Math.abs(value('x')*(1536-w)/100-x)<.00001,id+' x');assert.ok(Math.abs(value('y')*(400-h)/100-y)<.00001,id+' y');
  assert.ok(Math.abs(value('static')*(1536-w)/100-(x+(count===4?w:0)))<.00001,id+' reduced frame');
  if(count===4){assert.ok(Math.abs(value('end')*(1536-w)/100-x-4*w)<.00001,id+' steps endpoint');assert.doesNotMatch(r,/animation:none/)}
  else assert.match(r,/animation:none/);
 });
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\s*\.hani-office-live-props \.hani-office-live-prop\[data-event\]\{animation:none;background-position:var\(--event-static\) var\(--event-y\)\}/);
 assert.match(css,/\.hani-office-live-prop\[hidden\][\s\S]*animation-play-state:paused/);
});

test('xmas: source patch has no storage/Cloud/AI path; protected function and runtime baseline bytes are unchanged',()=>{
 const before=read('artifacts/office-xmas-live/before.js'),base=JSON.parse(read('artifacts/office-xmas-live/baseline.json'));
 // 269 -> exact 268 -> exact pre-pet source. The original section hashes
 // still apply; the outer full-file pin proves there are no unlisted edits.
 const comparableSource=restorePets268Source(source);
 const hash=x=>createHash('sha256').update(x).digest('hex');
 for(const row of base.sections){const a=comparableSource.indexOf(row.start),b=comparableSource.indexOf(row.end,a);assert.ok(a>=0&&b>a,row.name);assert.equal(hash(comparableSource.slice(a,b)),row.sha256,row.name)}
 for(const row of base.assets)assert.equal(hash(fs.readFileSync(new URL('../'+row.file,import.meta.url))),row.sha256,row.file);
 for(const row of base.files){
  // Only cache tags and canonical display fields may change across releases.
  const text=readReleaseSource(xmas269Delta.baseCommit,row.file),pin=xmas269Delta.unchangedRuntime.find(p=>p.file===row.file);assert.ok(pin,row.file);
  assert.equal(hash(text),pin.sha256,'unchanged fixed v268 runtime: '+row.file);
  assert.equal(normalizeReleaseVersion(read(row.file),'2.9.268'),normalizeReleaseVersion(text,'2.9.268'),'only release version projection differs from fixed v268 runtime: '+row.file);
  assert.equal(text.split('2.9.268').length-1,pin.versionCount,'exact v268 version occurrences');
  assert.equal(hash(text.replaceAll('2.9.268','2.9.267')),row.sha256,row.file+' retains the original pre-v268 pin after exact version reversal');
 }
 const storageStripped=stripApprovedAffinityStorage(source);
 const start=storageStripped.indexOf('  // Annual KST windows'),end=storageStripped.indexOf('  let activeFloor=',start),added=storageStripped.slice(start,end);
 assert.doesNotMatch(added,/localStorage|sessionStorage|supabase|\.setItem|\.removeItem|\.clear\(|\bfetch\(|setInterval|setTimeout|addEventListener|requestAnimationFrame/);
 for(const token of ['localStorage','sessionStorage','supabase','.setItem(','.removeItem(','.clear(','fetch('])assert.equal(storageStripped.split(token).length,before.split(token).length,token);
 const marker='    updateLiveProps(floor,map.querySelector(\'.hani-office-background\').getAttribute(\'src\'),map.dataset.art===\'floor\'&&map.dataset.floor===activeFloor,now);';
 assert.equal(comparableSource.slice(0,comparableSource.indexOf('  // Approved four-frame art:')),before.slice(0,before.indexOf('  // Approved four-frame art:')));
 assert.equal(comparableSource.slice(comparableSource.indexOf('  let activeFloor=')).replace(marker+'\n','').replace(marker+'\r\n',''),before.slice(before.indexOf('  let activeFloor=')));
});

test('xmas: literal atlas enters the release closure as the only new runtime file',async()=>{
 const beforeJs=read('artifacts/office-xmas-live/before.js'),beforeCss=read('artifacts/office-xmas-live/before.css');
 // Restore the exact 272 office layer before testing the historical 269 closure.
 // Exclude only the individually approved helper/Bori files from both closures.
 const options={exists:f=>fs.existsSync(new URL('../'+f,import.meta.url)),read:f=>['hani-office-live.js','hani-office-live.css'].includes(f)?restoreBori272Source(read(f),f):fs.readFileSync(new URL('../'+f,import.meta.url))};
 const current=await resolveRuntimeClosure(options),before=await resolveRuntimeClosure({...options,read:f=>f==='hani-office-live.js'?beforeJs:f==='hani-office-live.css'?beforeCss:options.read(f)});
 assert.deepEqual(before.missing,[]);assert.deepEqual(current.missing,[]);assert.equal(before.files.filter(f=>!approvedOfficeRuntimeAdditions.includes(f)).length,152);assert.equal(current.files.filter(f=>!approvedOfficeRuntimeAdditions.includes(f)).length,153);assert.ok(current.files.length<=160);
 assert.deepEqual(current.files.filter(f=>!before.files.includes(f)),['assets/office-season/xmas.webp']);
});
