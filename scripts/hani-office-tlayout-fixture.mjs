import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-tlayout-data-delta.json',import.meta.url));
assert.equal(hash(bytes),'cbded732273022a47dd8542825dc50e3644a4a139e539a40135b2bea72753406','exact approved G data/source delta');
export const tlayoutDelta=JSON.parse(bytes);
export function applyTlayoutCanon(expected){
 const file=tlayoutDelta.files.find(c=>c.file.endsWith('spatial-contract.json'));
 for(const c of file.changes){let o=expected;for(const k of c.path.slice(0,-1))o=o[k];const k=c.path.at(-1);if(c.beforeMissing)assert.ok(!Object.hasOwn(o,k));else assert.deepEqual(o[k],c.before,'exact prior field '+c.path.join('.'));if(c.afterMissing)delete o[k];else o[k]=structuredClone(c.after);}
 return expected;
}
export function restoreTlayoutSource(source){
 assert.equal(hash(source),tlayoutDelta.source.afterSha256,'only the approved G source is accepted');
 source=restoreTlayoutPairs(source);
 assert.equal(hash(source),tlayoutDelta.source.beforeSha256,'every source byte before G restored');return source;
}
// Used only after the caller verifies the complete G source and restores the
// independently hash-pinned outer Christmas layer; keep every G pair required.
export function restoreTlayoutPairs(source){
 for(const r of tlayoutDelta.source.replacements){assert.equal(source.split(r.after).length-1,1,'unique approved G line');source=source.replace(r.after,r.before)}
 return source;
}
export function reapplyTlayoutSource(source){
 for(const r of tlayoutDelta.source.replacements){assert.equal(source.split(r.before).length-1,1,'unique pre-G line');source=source.replace(r.before,r.after)}
 return source;
}
export function readTlayoutPlans(){
 const b=gunzipSync(fs.readFileSync(new URL('fixtures/office-tlayout-plans-v7.json.gz',import.meta.url)));
 assert.equal(hash(b),'231da1b00417b034e684f279c2d1349951c359743982ef6d50696ccb6e77d634','separately frozen complete G output');return JSON.parse(b);
}
