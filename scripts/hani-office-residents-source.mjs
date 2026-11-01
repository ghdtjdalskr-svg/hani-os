import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-residents-source-delta.json',import.meta.url));
assert.equal(hash(bytes),'c700c4da7d3a34d00265ab16141f33bf512e909c6392b7c533d11408b20fd594','exact authored residents delta');
const delta=JSON.parse(bytes);
assert.equal(delta.beforeSha256,'4f03c015fe3996d546afe1710a41c19a44d3a4d63c621ef132fb8ac255e06c6f','pre-resident source identity');
export function restoreResidentsSource(source){
 assert.equal(hash(source),delta.afterSha256,'current source includes only frozen resident edits');
 const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const c of delta.changes.toReversed()){
  assert.deepEqual(lines.slice(c.afterLine,c.afterLine+c.after.length),c.after,'exact resident lines at '+c.afterLine);
  lines.splice(c.afterLine,c.after.length,...c.before);
 }
 const restored=lines.join('');assert.equal(hash(restored),delta.beforeSha256,'every other source byte including staff/visitor scheduler frozen');return restored;
}
