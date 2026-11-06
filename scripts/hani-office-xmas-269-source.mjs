import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-xmas-269-delta.json',import.meta.url));
assert.equal(hash(bytes),'74dee681c669b67fe3ec09b20765213547ea1e1103ab814e2e5c37c83296d172','exact approved v2.9.269 Christmas delta');
export const xmas269Delta=JSON.parse(bytes);
assert.equal(xmas269Delta.baseCommit,'f753c66af9d2b6a7535924e8d237e8b1980ae67a','fixed v2.9.268 release commit');
assert.equal(xmas269Delta.files[0].beforeSha256,'447edb86def004395e66af6aa79950280c23f3698f53af28db8d1f6fe6f6b148','pinned v2.9.268 JS bytes');
assert.equal(xmas269Delta.files[1].beforeSha256,'b00bf744040c4cc24529eda7c9a5ad1ce2da40fd9e16a5a626668869b15ae368','pinned v2.9.268 CSS bytes');

// The outer layer always restores Christmas BEFORE pet/G/resident normalization.
// Literal required pairs and both full hashes reject any unlisted byte change.
export function restoreXmas269Source(source,file='hani-office-live.js'){
 const delta=xmas269Delta.files.find(row=>row.file===file);assert.ok(delta,'approved Christmas file: '+file);
 assert.equal(hash(source),delta.afterSha256,'only the approved v2.9.269 source is accepted: '+file);
 for(const r of delta.replacements){
  assert.equal(source.split(r.after).length-1,1,'unique approved Christmas bytes: '+r.name);
  source=source.replace(r.after,r.before);
 }
 assert.equal(hash(source),delta.beforeSha256,'every v2.9.268 byte restored: '+file);
 return source;
}
