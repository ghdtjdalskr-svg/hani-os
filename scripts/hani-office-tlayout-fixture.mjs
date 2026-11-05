import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-tlayout-data-delta.json',import.meta.url));
assert.equal(hash(bytes),'aba2444bf1db7fb7c2802c1101b29c83b3455a166ad14cb124d51de107bf8513','exact approved G data/source delta');
export const tlayoutDelta=JSON.parse(bytes);
export function applyTlayoutCanon(expected){
 const file=tlayoutDelta.files.find(c=>c.file.endsWith('spatial-contract.json'));
 for(const c of file.changes){let o=expected;for(const k of c.path.slice(0,-1))o=o[k];const k=c.path.at(-1);if(c.beforeMissing)assert.ok(!Object.hasOwn(o,k));else assert.deepEqual(o[k],c.before,'exact prior field '+c.path.join('.'));if(c.afterMissing)delete o[k];else o[k]=structuredClone(c.after);}
 return expected;
}
export function restoreTlayoutSource(source){
 assert.equal(hash(source),tlayoutDelta.source.afterSha256,'only the approved G source is accepted');
 for(const r of tlayoutDelta.source.replacements){assert.equal(source.split(r.after).length-1,1,'unique approved G line');source=source.replace(r.after,r.before)}
 assert.equal(hash(source),tlayoutDelta.source.beforeSha256,'every source byte before G restored');return source;
}
export function reapplyTlayoutSource(source){
 for(const r of tlayoutDelta.source.replacements){assert.equal(source.split(r.before).length-1,1,'unique pre-G line');source=source.replace(r.before,r.after)}
 return source;
}
export function readTlayoutPlans(){
 const b=gunzipSync(fs.readFileSync(new URL('fixtures/office-tlayout-plans-v7.json.gz',import.meta.url)));
 assert.equal(hash(b),'b53a06cd6ce9b683592a364a3a5ff0f9b4d76d344bb196a772137d6bd15ea93d','separately frozen complete G output');return JSON.parse(b);
}
