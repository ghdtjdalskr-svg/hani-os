import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {loadScene,at} from '../../scripts/hani-office-lively-fixture.mjs';
import inverse from '../../scripts/hani-office-kids-weekday-source.cjs';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),read=f=>fs.readFileSync(f),source=read('hani-office-live.js').toString(),base=inverse.restoreKidsWeekdaySource(source),counts={};
for(const [name,re]of Object.entries({interval:/\bsetInterval\s*\(/g,timeout:/\bsetTimeout\s*\(/g,listener:/\baddEventListener\s*\(/g,storage:/\b(?:localStorage|sessionStorage)\b/g,cloud:/\bsupabase\b/g,random:/\bMath\.random\b/g})){
 const count=s=>[...s.matchAll(re)].length;counts[name]={before:count(base),after:count(source)};assert.equal(counts[name].before,counts[name].after);
}
const scheduler=s=>s.slice(s.indexOf('  function createScheduler('),s.indexOf('  function snapshot(now=new Date(),options={})'));assert.equal(scheduler(source),scheduler(base));
const closure=await resolveRuntimeClosure({exists:fs.existsSync,read});assert.equal(closure.files.length,161);assert.deepEqual(closure.missing,[]);
const {scene}=loadScene(),r=scene.residents,chair={floors:[{id:'4f',people:[{id:'seongmin',floor:'4f',position:[51,70],pose:'sitting',facing:'right'}]}]},year={year:2026,weekdays:0,visits:0,children:{},greetings:{}};
for(let i=0;i<365;i++){
 const day=new Date(Date.UTC(2026,0,i+1)).toISOString().slice(0,10);if([0,6].includes(new Date(day).getUTCDay()))continue;year.weekdays++;
 const child=r.companionSnapshot(at(day,57600),chair,true,true).find(p=>p.kid);if(!child)continue;year.visits++;year.children[child.id]=(year.children[child.id]||0)+1;
 (year.greetings[child.id]??=[]);if(!year.greetings[child.id].includes(child.weekdayArrival.line))year.greetings[child.id].push(child.weekdayArrival.line);
}year.ratio=year.visits/year.weekdays;assert.ok(year.ratio>=.2&&year.ratio<=.3);
const preserved=['hani-office-live.css','hani-main.js','index.html','assets/office-companions/kids-v1.webp','assets/office-companions/kids-v2.webp','scripts/fixtures/office-kids-pose-b-delta.json'].map(file=>({file,sha256:hash(read(file))}));
const result={baseCommit:inverse.delta.baseCommit,runtimeSha256:hash(read('hani-office-live.js')),contractSha256:hash(read('scripts/fixtures/office-kids-weekday-delta.json')),displayVersion:'2.9.280',counts,schedulerByteIdentical:true,runtimeClosure:{count:closure.files.length,missing:closure.missing},year,preserved};
fs.writeFileSync('artifacts/kids-weekday/validation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
