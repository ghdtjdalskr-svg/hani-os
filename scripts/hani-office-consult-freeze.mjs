// Explicit authoring for this approved change; tests never regenerate oracles.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const target='scripts/fixtures/office-consult-v7-plans.json.gz';assert.ok(!fs.existsSync(target),'never overwrite a frozen oracle');
const hash=x=>createHash('sha256').update(x).digest('hex'),prior=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/office-cafe-finish-plans.json.gz')));
const priorConsult=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/office-consult-v6-plans.json.gz')));
const cases=prior.records.map(r=>({label:r.label,day:r.day,options:r.options,seconds:r.snapshots?.map(x=>x.seconds)||[32400,36000,41400,45000,50400,57600,64799]}));
for(const day of ['2026-11-02','2026-11-04','2026-11-07','2026-11-08'])for(const chairmanPresent of [false,true])cases.push({label:'consult '+day+' '+chairmanPresent,day,options:{chairmanPresent},seconds:[32400,36000,41400,45000,50400,57600,64799]});
const records=cases.map(({label,day,options,seconds})=>{
 const s=loadScene().scene.scheduler,formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options),old=prior.records.find(r=>r.label===label);
 if(old)assert.equal(JSON.stringify(formal),JSON.stringify(old.formal),'formal catalog unchanged '+label);
 const previous=priorConsult.records.find(r=>r.label===label);assert.ok(previous,'prior consultation case '+label);
 assert.equal(hash(JSON.stringify(formal)),previous.formalSha256,'formal bytes unchanged '+label);
 assert.equal(hash(JSON.stringify(outings)),previous.outingsSha256,'outing bytes unchanged '+label);
 return {label,day,options,formalSha256:hash(JSON.stringify(formal)),outingsSha256:hash(JSON.stringify(outings)),snapshots:seconds.map(seconds=>({seconds,sha256:hash(JSON.stringify(s.snapshot(at(day,seconds),options)))}))};
});
const bytes=Buffer.from(JSON.stringify({schema:'office-consult-full-output-sha256-v2',base:'b653a173079323217bcd5e338e82c50d40d578e1',reason:'Complete JSON.stringify output SHA-256 with no field exclusions: owner-approved deterministic caught-out Instagram reaction on about one desk visit in twelve; existing first-half priorities and second-half replies preserved; formal and outing bytes match v6; historical cafe, v6 and obr21 oracles preserved',sourceSha256:hash(fs.readFileSync('hani-office-live.js')),placesSha256:hash(fs.readFileSync('data/hani-building/office-places.json')),records}));
fs.writeFileSync(target,gzipSync(bytes));console.log(JSON.stringify({target,sha256:hash(bytes),sourceSha256:hash(fs.readFileSync('hani-office-live.js')),placesSha256:hash(fs.readFileSync('data/hani-building/office-places.json')),records:records.length}));
