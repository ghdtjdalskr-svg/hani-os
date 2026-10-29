import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {assertResources,validPlaceSpeech} from './hani-office-place-assertions.mjs';
const {scene,table,context}=loadScene(),s=scene.scheduler,day='2026-10-22';
let writes=0;const deny=()=>{writes++;throw Error('write/network forbidden')};context.localStorage=context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};context.fetch=deny;
test('235 authored immutable six complete ledgers and 84 snapshots, exact source/CSS and query-order determinism',()=>{
 const bytes=gunzipSync(fs.readFileSync('scripts/fixtures/office-lively-labels-235-plans.json.gz')),hash=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(hash(bytes),'5089e172f608ac9475e0ce9ca30e31f19a57d2c84beaab735b4d4d27f083ab9f');const frozen=JSON.parse(bytes);
 assert.equal(hash(fs.readFileSync('hani-office-live.js')),frozen.sourceSha256);assert.equal(hash(fs.readFileSync('hani-office-live.css')),frozen.cssSha256);
 for(const r of frozen.records){const api=loadScene().scene.scheduler,f=api.plan(r.day,r.options),o=api.blockPlan(r.day,0,f,r.options);for(const [actual,expected]of [[f,r.formal],[o,r.outings],...r.snapshots.toReversed().map(row=>[api.snapshot(at(r.day,row.seconds),r.options),row.snapshot])]){assert.equal(JSON.stringify(actual),JSON.stringify(expected));assert.deepEqual(JSON.parse(JSON.stringify(actual)),expected)}}
});
test('235 weekdays 09–19 each second: 1F active >=70%, visible mean >=3, two public guests with separate targets and reservations',()=>{
 for(const day of ['2026-10-21','2026-10-22','2026-10-23']){
  let active=0,people=0,maxGuests=0;const kinds=new Set();
  const f=s.plan(day),out=s.blockPlan(day,0,f),guests=out.filter(e=>e.visitor);
  for(const e of guests){assert.ok(['lobby','cafe','consult'].includes(scene.anchors.get(e.people[0].seat.anchor).room));assert.equal(e.people[0].home.anchorId,'arrival_gate');assert.equal(e.people[0].back.at(-1).to,'arrival_gate');for(const q of [...f,...out])if(q!==e&&q.start<e.end&&e.start<q.end)assertResources(s,e,q)}
  for(let sec=32400;sec<68400;sec++){
   const snap=s.snapshot(at(day,sec)),staff=snap.entries.filter(p=>p.floor==='1f');
   active+=Boolean(staff.some(p=>p.walking)||snap.visitors.length);people+=staff.length+snap.visitors.length;maxGuests=Math.max(maxGuests,snap.visitors.length);
   assert.ok(snap.visitors.length<=2);assert.equal(new Set(snap.visitors.map(p=>p.targetAnchor)).size,snap.visitors.length);
   for(const p of snap.visitors){kinds.add(p.kind);assert.equal(p.floor,'1f');if(p.state==='AT_PLACE')assert.equal(p.line,p.at)}
  }
  console.log('235 daytime',{day,activeRatio:active/36000,peopleMean:people/36000,maxGuests,kinds:[...kinds]});assert.ok(active/36000>=.7);assert.ok(people/36000>=3);assert.equal(maxGuests,2);assert.equal(kinds.size,5);
 }
 assert.equal(writes,0);
});
test('235 all present staff have full and meaningful <=10-character short lines; idle duplicates avoided; walking/place speech kept',()=>{
 const seen=new Set(),plainLines=new Map();let shortExamples=[];
 for(let sec=0;sec<86400;sec+=3){
  const snap=s.snapshot(at(day,sec),{chairmanPresent:true});
  for(const p of snap.entries){seen.add(p.id);assert.ok(p.line&&p.shortLine);assert.ok([...p.shortLine].length<=10);assert.doesNotMatch(p.shortLine,/…|\.\.\./);
   if(p.walking)assert.match(p.line,/가는 중|돌아가는 중/);
   if(p.state==='AT_PLACE')assert.ok(validPlaceSpeech(p,scene.places.find(c=>c.id===p.placeId),table));
   if(p.plain){if(!['lobby-nw','lobby-ne'].includes(p.seat.anchor))assert.doesNotMatch(p.line,/창가|창밖|소파|팬트리|화이트보드|카페|택배함/);plainLines.set(p.id,p.line)}
   if(shortExamples.length<8&&p.line!==p.shortLine)shortExamples.push([p.line,p.shortLine]);
  }
  for(const p of snap.entries.filter(p=>!p.eventId&&!p.outingId))assert.equal(snap.entries.filter(q=>q.floor===p.floor&&q.line===p.line).length,1,p.id+' idle duplicate '+p.line);
 }
 assert.equal(seen.size,table.people.length);assert.equal(plainLines.size,table.people.length);console.log('235 short examples',shortExamples);assert.equal(writes,0);
});
test('235 motion only changes inner sprite transform, deterministic rhythm, walking/reduced-motion/pause exclusions',()=>{
 const js=fs.readFileSync('hani-office-live.js','utf8'),css=fs.readFileSync('hani-office-live.css','utf8');
 assert.match(css,/data-pose="sitting"\]:not\(\[data-walking="true"\]\)/);assert.match(css,/data-pose="standing"\]:not\(\[data-walking="true"\]\)/);
 for(const name of ['breathe','sway']){const key=css.slice(css.indexOf('@keyframes hani-office-'+name)).split('\n')[0];assert.doesNotMatch(key,/\b(top|left|height|width|margin|padding):/);assert.match(key,/transform:/)}
 assert.match(css,/@media\(prefers-reduced-motion:reduce\).*animation:none!important;transform:none!important/);assert.match(css,/data-paused="true".*animation-play-state:paused!important/);
 assert.match(js,/seed\('idle-motion\|'\+key\)/);assert.equal(writes,0);
});
test('235 last fractional second before a guest leaves remains in the continuous proximity check',()=>{
 const f=s.plan(day),out=s.blockPlan(day,0,f),times=[53076,...out.filter(e=>e.visitor).flatMap(e=>[e.end-.001,e.end-.1,e.end-.5,e.end-1])];
 for(const sec of times){const snap=s.snapshot(at(day,sec)),all=[...snap.entries,...snap.visitors];for(let i=0;i<all.length;i++)for(const q of all.slice(i+1)){const p=all[i];if(p.floor!==q.floor)continue;const a=p.position||[p.seat.x,p.seat.y],b=q.position||[q.seat.x,q.seat.y],gap=Math.hypot((a[0]-b[0])*16.72,(a[1]-b[1])*9.41);assert.ok(gap>=(p.walking||q.walking?24:20)-.001,sec+' '+p.id+'/'+q.id+' '+gap)}}
});
