// Test-only outer inverses. No runtime or gate changes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import releaseLayers from './hani-release-version-layers.cjs';
export const pbHash=value=>createHash('sha256').update(value).digest('hex');
const bytes=fs.readFileSync(new URL('./fixtures/pb-chibitoon-delta.json',import.meta.url));
assert.equal(pbHash(bytes),'eca88dd9f4c68acb0a6c1dd67452b7a5cb9d3e8a5c83744da41dc58b54325423','frozen outer inverse bytes');
export const pbDelta=JSON.parse(bytes);
export function restoreChibitoonSource(source,file){
  source=releaseLayers.projectFeatureSource(source,file,'2.9.284');
  const row=pbDelta.files[file];
  if(!row)return source;
  assert.equal(pbHash(source),row.afterSha256,'exact chibitoon input '+file);
  const buffer=Buffer.isBuffer(source);
  const lines=(buffer?source.toString('utf8'):source).match(/[^\n]*\n|[^\n]+$/g)||[];
  for(const edit of row.edits.toReversed()){
    assert.equal(lines.slice(edit.at,edit.at+edit.remove).join(''),edit.after,'complete changed lines '+file);
    lines.splice(edit.at,edit.remove,...(edit.before.match(/[^\n]*\n|[^\n]+$/g)||[]));
  }
  const result=buffer?Buffer.from(lines.join('')):lines.join('');
  assert.equal(pbHash(result),row.beforeSha256,'exact chibitoon baseline '+file);
  return result;
}
export function restoreRelease283Source(source,file){
  source=releaseLayers.projectReleaseSource(source,file,'2.9.283');
  const row=pbDelta.release283[file];
  if(!row)return source;
  assert.equal(pbHash(source),row.afterSha256,'exact release283 input '+file);
  const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;
  assert.equal(text.split('2.9.283').length-1,row.count,'exact version occurrence count');
  const result=buffer?Buffer.from(text.replaceAll('2.9.283','2.9.282')):text.replaceAll('2.9.283','2.9.282');
  assert.equal(pbHash(result),row.beforeSha256,'exact release282 baseline '+file);
  return result;
}
