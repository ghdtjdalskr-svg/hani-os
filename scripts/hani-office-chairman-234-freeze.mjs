// Explicit fixture authoring only. Tests never run this file or regenerate an oracle.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {loadScene,readAt,at} from './hani-office-lively-fixture.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'),baseSha='beffc3850ea890ec84ce623579b26b4b5a3cd35c';
const before=readAt('hani-office-live.js',baseSha),after=fs.readFileSync('hani-office-live.js','utf8');
assert.equal(hash(before),'6cd4b68f14aa435d3de6d00e4b535ca74ebf6baed225b0c818506e911e3d2b21');
const fixture={baseSha,reason:'obr13: memory-only presence, chairman workday variants and canonical outings, colleague >=32px, one long-stay phrase switch',changes:[{file:'hani-office-live.js',beforeSha256:hash(before),afterSha256:hash(after),replacements:[{before,after}]}]};
fs.writeFileSync('scripts/fixtures/office-chairman-234.json',JSON.stringify(fixture,null,2)+'\n');
const {scene}=loadScene(),s=scene.scheduler,records=[];
for(const [day,options]of [['2026-10-22',{}],['2026-10-22',{chairmanPresent:true}],['2026-10-23',{chairmanPresent:true}],['2026-10-24',{chairmanPresent:true}],['2026-11-01',{presentIds:['seoyun','dohyun','yuna','minji']}],['2026-11-02',{presentIds:['hani','yuri','serin','arin','hina','daon','yoonseul']}]] ){
 const formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options),seconds=[0,3599.999,3600,25199.999,25200,32400,41400,45000,46800,54000,64799.999,64800,70200,86399.999];
 records.push({day,options,formal,outings,snapshots:seconds.map(sec=>({seconds:sec,snapshot:s.snapshot(at(day,sec),options)}))});
}
const bytes=Buffer.from(JSON.stringify({baseSha,sourceSha256:hash(after),placesSha256:hash(fs.readFileSync('data/hani-building/office-places.json')),records}));
fs.writeFileSync('scripts/fixtures/office-chairman-234-plans.json.gz',gzipSync(bytes));console.log(JSON.stringify({runtime:hash(after),golden:hash(bytes),records:records.length}));
