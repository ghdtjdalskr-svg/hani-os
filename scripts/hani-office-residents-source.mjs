import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-residents-source-delta.json',import.meta.url));
assert.equal(hash(bytes),'46451563bb80e35ba0a0eb73e200ae967e04a0fb0ddc32e76364e5da24ad20e7','exact authored residents delta');
const delta=JSON.parse(bytes);
assert.equal(delta.beforeSha256,'992a9a89ea355458a395ebca2417f307e5f213cba5c29087ab3b82ca9bfdd0be','pre-resident source identity');
export function restoreResidentsSource(source){
 assert.equal(hash(source),delta.afterSha256,'current source includes only frozen resident edits');
 const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const c of delta.changes.toReversed()){
  assert.deepEqual(lines.slice(c.afterLine,c.afterLine+c.after.length),c.after,'exact resident lines at '+c.afterLine);
  lines.splice(c.afterLine,c.after.length,...c.before);
 }
 const restored=lines.join('');assert.equal(hash(restored),delta.beforeSha256,'every other source byte including staff/visitor scheduler frozen');return restored;
}
