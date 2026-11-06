import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restoreTlayoutSource} from './hani-office-tlayout-fixture.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-residents-source-delta.json',import.meta.url));
assert.equal(hash(bytes),'0f31c46af0b4438fe2393d7979e96e32fc77855874b6fa7e1937ab35e2e4ba93','exact authored residents delta');
const delta=JSON.parse(bytes);
assert.equal(delta.beforeSha256,'672b4fa6b15ef08859822870c7a3ff12d8029a65a972010799391ea5eb33d00f','pre-resident source identity');
export function restoreResidentsSource(source){
 // Restore order: tlayout -> residents -> labels; callers own the final labels delta.
 source=restoreTlayoutSource(source);
 assert.equal(hash(source),delta.afterSha256,'current source includes only frozen resident edits');
 const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const c of delta.changes.toReversed()){
  assert.deepEqual(lines.slice(c.afterLine,c.afterLine+c.after.length),c.after,'exact resident lines at '+c.afterLine);
  lines.splice(c.afterLine,c.after.length,...c.before);
 }
 const restored=lines.join('');assert.equal(hash(restored),delta.beforeSha256,'every other source byte including staff/visitor scheduler frozen');return restored;
}
