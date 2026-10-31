// Explicit authoring only. Preserve all historical oracles and freeze this
// authorized behavior delta for BOTH chairman presence states separately.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const target='scripts/fixtures/office-obr21-plans.json.gz';
assert.ok(!fs.existsSync(target),'never overwrite frozen plans');
const hash=b=>createHash('sha256').update(b).digest('hex');
const prior=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/office-lively-labels-235-plans.json.gz')));
const cases=prior.records.map(({day,options,snapshots,label})=>({day,options,seconds:snapshots.map(s=>s.seconds),label}));
for(const [day,options]of [['2026-10-22',{}],['2026-10-23',{chairmanPresent:false}],['2026-10-24',{}],['2026-11-01',{presentIds:['seoyun','dohyun','yuna','minji']}],['2026-11-02',{presentIds:['hani','yuri','serin','arin','hina','daon','yoonseul']}]])cases.push({day,options,seconds:[1,32400,33300,43800,50400,56400,68399,86399],label:'obr15 absent '+day});
for(const day of ['2026-10-21','2026-10-22','2026-10-23','2026-10-24'])for(const chairmanPresent of [false,true])cases.push({day,options:{chairmanPresent},seconds:[1,32400,33300,43800,50400,56400,68399,86399],label:day+' '+chairmanPresent});
const records=cases.map(({day,options,seconds,label})=>{const s=loadScene().scene.scheduler,formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options);return {label,day,options,formal,outings,snapshots:seconds.map(seconds=>({seconds,snapshot:s.snapshot(at(day,seconds),options)}))}});
for(const r of records){const old=loadScene({ref:'2cd24abb6360f6509d005b975eb0513ad6b1a03e'}).scene.scheduler;assert.equal(JSON.stringify(r.formal),JSON.stringify(old.plan(r.day,r.options)),r.label+' formal must equal pre-obr20 reviewed catalog');}
const bytes=Buffer.from(JSON.stringify({base:'2cd24abb6360f6509d005b975eb0513ad6b1a03e',reason:'obr21 authorized: existing CEO entrance replaces overlapping near-desk junctions; 342px/40px stationary screen reservations on NEW excursions only; 216/221 formal catalog excluded, formal plans unchanged from base; fixed homes exempt; absent AND present optional plans intentionally change; historical formal/behavior oracles retained',sourceSha256:hash(fs.readFileSync('hani-office-live.js')),records}));
fs.writeFileSync(target,gzipSync(bytes));console.log('obr21 frozen',hash(bytes));
