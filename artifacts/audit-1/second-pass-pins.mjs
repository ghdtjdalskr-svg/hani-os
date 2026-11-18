// Supplement blocked Git-executable checks with verified, fixed repository objects.
// This is separate evidence; it does not mark blocked original tests as PASS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import inverse from '../../scripts/hani-audit-1-source.cjs';
import repository from '../../scripts/hani-test-repository-evidence.cjs';
import {affinity274Delta,restoreAffinity274Source} from '../../scripts/hani-office-affinity-274-source.mjs';
import {companions276Delta,restoreCompanions276Source} from '../../scripts/hani-office-companions-276-source.mjs';
import * as patrol from '../../scripts/hani-office-chairman-patrol-278-source.mjs';
import {pets268Delta,restorePets268Source} from '../../scripts/hani-office-pets-268-source.mjs';
const base='2220b6129c63721906a3788ee9a7681f197c4523';
const sha=s=>createHash('sha256').update(s).digest('hex');
const raw=file=>inverse.readRawFileSync(new URL('../../'+file,import.meta.url),'utf8');
const main=file=>inverse.project(raw(file),file),rows=[];
for(const [file,pin] of Object.entries(inverse.delta.files)){
 assert.equal(sha(raw(file)),pin.afterSha256);
 assert.equal(main(file),repository.read(base,file));
 rows.push({layer:'audit-1',file,sha256:pin.beforeSha256});
}
for(const [name,delta,restore] of [['affinity274',affinity274Delta,restoreAffinity274Source],['companions276',companions276Delta,restoreCompanions276Source],['patrol278',patrol.patrol278Delta,patrol.restorePatrol278Source]]){
 for(const row of delta.files){
  const before=restore(main(row.file),row.file),expected=repository.read(delta.baseCommit,row.file);
  assert.equal(before,expected);assert.equal(sha(before),row.beforeSha256);
  rows.push({layer:name,file:row.file,base:delta.baseCommit,sha256:sha(before)});
 }
}
for(const [name,restore] of [['kidsExtension',patrol.restoreKids278Source],['visitExtension',patrol.restoreVisits278Source],['staffChatExtension',patrol.restoreStaffChats278Source],['bubblePlaceExtension',patrol.restoreBubblePlace278Source],['fix278Extension',patrol.restoreFix278Source]]){
 const row=patrol.patrol278Delta[name],before=restore(main(row.file),row.file);
 assert.equal(before,repository.read(row.baseCommit,row.file));assert.equal(sha(before),row.beforeSha256);
 rows.push({layer:name,file:row.file,base:row.baseCommit,sha256:sha(before)});
}
const before=restorePets268Source(main('hani-office-live.js'));
assert.equal(before,repository.read('461dfdff4d26275a4d6d61c177280fd2d6ed35fe','hani-office-live.js'));
assert.equal(sha(before),pets268Delta.beforeSha256);
assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(before)+'\0').update(before).digest('hex'),pets268Delta.baseBlob);
rows.push({layer:'pets268',file:'hani-office-live.js',base:'461dfdff4d26275a4d6d61c177280fd2d6ed35fe',sha256:sha(before),blob:pets268Delta.baseBlob});
const out=new URL('./local/second-pass/independent-pins.json',import.meta.url);
fs.writeFileSync(out,JSON.stringify({base,checks:rows.length,rows},null,2)+'\n');
console.log('PASS '+rows.length+' independent exact object comparisons; no Git process');
