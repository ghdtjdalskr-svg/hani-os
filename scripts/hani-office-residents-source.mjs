import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restoreTlayoutSource} from './hani-office-tlayout-fixture.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-residents-source-delta.json',import.meta.url));
assert.equal(hash(bytes),'d85074accb33a2a5bb2981794feb28f577ed560a23b5080f0bfbed3e1937d1db','exact authored residents delta');
const delta=JSON.parse(bytes);
assert.equal(delta.beforeSha256,'672b4fa6b15ef08859822870c7a3ff12d8029a65a972010799391ea5eb33d00f','pre-resident source identity');
export function restoreResidentsSource(source){
 // Undo the outer tlayout patch before the exact historical residents delta.
 source=restoreTlayoutSource(source);
 assert.equal(hash(source),delta.afterSha256,'current source includes only frozen resident edits');
 const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const c of delta.changes.toReversed()){
  assert.deepEqual(lines.slice(c.afterLine,c.afterLine+c.after.length),c.after,'exact resident lines at '+c.afterLine);
  lines.splice(c.afterLine,c.after.length,...c.before);
 }
 const restored=lines.join('');assert.equal(hash(restored),delta.beforeSha256,'every other source byte including staff/visitor scheduler frozen');return restored;
}
