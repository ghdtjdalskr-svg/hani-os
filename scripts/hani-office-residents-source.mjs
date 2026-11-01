import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-residents-source-delta.json',import.meta.url));
assert.equal(hash(bytes),'ea25ed4ab16780bfcb5095fcbd7f8135da592120aa0a8208aba3c1b000b68f14','exact authored residents delta');
const delta=JSON.parse(bytes);
assert.equal(delta.beforeSha256,'d2f5be9b6e35e58da597985f43e94a8541542eafa191be35aa0d90838af7d8a8','pre-resident source identity');
export function restoreResidentsSource(source){
 assert.equal(hash(source),delta.afterSha256,'current source includes only frozen resident edits');
 const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const c of delta.changes.toReversed()){
  assert.deepEqual(lines.slice(c.afterLine,c.afterLine+c.after.length),c.after,'exact resident lines at '+c.afterLine);
  lines.splice(c.afterLine,c.after.length,...c.before);
 }
 const restored=lines.join('');assert.equal(hash(restored),delta.beforeSha256,'every other source byte including staff/visitor scheduler frozen');return restored;
}
