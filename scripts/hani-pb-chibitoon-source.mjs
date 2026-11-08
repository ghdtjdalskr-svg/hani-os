// Test-only outer inverses. No runtime or gate changes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const pbHash=value=>createHash('sha256').update(value).digest('hex');
const bytes=fs.readFileSync(new URL('./fixtures/pb-chibitoon-delta.json',import.meta.url));
assert.equal(pbHash(bytes),'eca88dd9f4c68acb0a6c1dd67452b7a5cb9d3e8a5c83744da41dc58b54325423','frozen outer inverse bytes');
export const pbDelta=JSON.parse(bytes);
export function restoreChibitoonSource(source,file){
  const row=pbDelta.files[file];
  if(!row)return source;
  assert.equal(pbHash(source),row.afterSha256,'exact chibitoon input '+file);
  const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
  for(const edit of row.edits.toReversed()){
    assert.equal(lines.slice(edit.at,edit.at+edit.remove).join(''),edit.after,'complete changed lines '+file);
    lines.splice(edit.at,edit.remove,...(edit.before.match(/[^\n]*\n|[^\n]+$/g)||[]));
  }
  const result=lines.join('');
  assert.equal(pbHash(result),row.beforeSha256,'exact chibitoon baseline '+file);
  return result;
}
export function restoreRelease283Source(source,file){
  const row=pbDelta.release283[file];
  if(!row)return source;
  assert.equal(pbHash(source),row.afterSha256,'exact release283 input '+file);
  assert.equal(source.split('2.9.283').length-1,row.count,'exact version occurrence count');
  const result=source.replaceAll('2.9.283','2.9.282');
  assert.equal(pbHash(result),row.beforeSha256,'exact release282 baseline '+file);
  return result;
}
