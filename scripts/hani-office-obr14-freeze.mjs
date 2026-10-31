// Explicit authoring only, never called by tests. Immutable 234 parent is retained.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {loadScene,readAt,at} from './hani-office-lively-fixture.mjs';
const baseSha='33d39892c2a5c0a1779650e440a2dd5068b44495',hash=b=>createHash('sha256').update(b).digest('hex');
const expected={'hani-office-live.js':'cd2940908b8d5739107b58594cd316e1c56daa80bd61062d86948b71b9830679','hani-office-live.css':'9c0757525585f5cbf58f4ee330084b3aa38f5f5f4e4dc916088ab8be0503a476'};
const changes=Object.keys(expected).map(file=>{const before=readAt(file,baseSha),after=fs.readFileSync(file,'utf8');assert.equal(hash(before),expected[file]);return {file,beforeSha256:hash(before),afterSha256:hash(after),replacements:[{before,after}]}});
fs.writeFileSync('scripts/fixtures/office-lively-labels-235.json',JSON.stringify({baseSha,reason:'obr14 explicit requested delta: two public guests, local errands, personal work/compact lines, batched label placement, sprite-only idle motion; no data or version changes',changes},null,2)+'\n');
const {scene}=loadScene(),s=scene.scheduler,records=[];
for(const [day,options]of [['2026-10-22',{}],['2026-10-22',{chairmanPresent:true}],['2026-10-23',{chairmanPresent:true}],['2026-10-24',{chairmanPresent:true}],['2026-11-01',{presentIds:['seoyun','dohyun','yuna','minji']}],['2026-11-02',{presentIds:['hani','yuri','serin','arin','hina','daon','yoonseul']}]] ){
 const formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options);records.push({day,options,formal,outings,snapshots:[0,3599.999,3600,25199.999,25200,32400,41400,45000,46800,54000,64799.999,64800,70200,86399.999].map(seconds=>({seconds,snapshot:s.snapshot(at(day,seconds),options)}))});
}
const bytes=Buffer.from(JSON.stringify({baseSha,sourceSha256:hash(fs.readFileSync('hani-office-live.js')),cssSha256:hash(fs.readFileSync('hani-office-live.css')),records}));fs.writeFileSync('scripts/fixtures/office-lively-labels-235-plans.json.gz',gzipSync(bytes));console.log({goldenSha256:hash(bytes),records:records.length});
