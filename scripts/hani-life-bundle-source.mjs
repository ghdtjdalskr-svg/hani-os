// Test-only exact inverses of the four frozen merges. Preserve mixed EOL bytes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import release283 from './hani-release-283-source.cjs';
// Capture the actual reader before any opt-in legacy preload is installed.
export const readRawLifeFile=fs.readFileSync.bind(fs);
export const projectPreRelease283Source=release283.projectPreRelease283Source;
export const lifeHash=value=>createHash('sha256').update(value).digest('hex');
let baseline;
export function readLifeBaseline(file){
  if(!baseline){
    const bytes=readRawLifeFile(new URL('./fixtures/life-bundle-baseline-282.json.gz',import.meta.url));
    assert.equal(lifeHash(bytes),'77485a27c153cf2e7e30d29ecfddb3705ec0ac5c5b31d56b6c508817c889076b','independent frozen release-282 bytes');
    baseline=JSON.parse(gunzipSync(bytes));
    assert.equal(baseline.base,'2feb724c94c92f206c5f79dd992632cbb3b58874');
  }
  const row=baseline.files[file];assert.ok(row,'known frozen life baseline '+file);
  assert.equal(lifeHash(row.source),row.sha256,'complete frozen baseline '+file);
  return row.source;
}
const frozen=fs.readFileSync(new URL('./fixtures/life-bundle-layers.json',import.meta.url));
assert.equal(lifeHash(frozen),'a89a80745f9f00b596b763a1c4c0e562e488260a81d45eeda097d8a6abbe0f98','frozen life-bundle merge deltas');
export const lifeLayers=JSON.parse(frozen);
const refreshBytes=fs.readFileSync(new URL('./fixtures/life-bundle-report-refresh.json',import.meta.url));
assert.equal(lifeHash(refreshBytes),'e8a1432ef23cbffb23eb40db9aac4df6254ab6667a6fba95c1a473075e19c8ad','frozen report refresh bytes');
export const lifeRefresh=JSON.parse(refreshBytes);
export function restoreLifeReportRefresh(source){
  assert.equal(lifeHash(source),lifeRefresh.afterSha256,'exact refreshed report input');
  assert.equal(source.split(lifeRefresh.after).length-1,1,'unique complete refreshed catalog');
  const before=source.replace(lifeRefresh.after,()=>lifeRefresh.before);
  assert.equal(lifeHash(before),lifeRefresh.beforeSha256,'exact pre-refresh runtime');
  return before;
}
const lines=source=>source.match(/[^\n]*\n|[^\n]+$/g)||[];
export function restoreLifeLayer(source,file,name){
  const layer=lifeLayers.layers.find(row=>row.name===name);
  assert.ok(layer,'known life-bundle layer '+name);
  const delta=layer.files[file];
  if(!delta)return source;
  assert.equal(lifeHash(source),delta.afterSha256,`${name}: exact input ${file}`);
  const result=lines(source);
  for(const edit of delta.edits.toReversed())result.splice(edit.at,edit.remove,...lines(edit.before));
  const restored=result.join('');
  assert.equal(lifeHash(restored),delta.beforeSha256,`${name}: exact lower layer ${file}`);
  return restored;
}
export function projectLifeSource(source,file,target){
  const names=[...lifeLayers.layers.map(row=>row.name),'main'];
  assert.ok(names.includes(target),'known life-bundle target '+target);
  source=projectPreRelease283Source(source,file);
  for(const layer of lifeLayers.layers){
    if(layer.name===target)break;
    source=restoreLifeLayer(source,file,layer.name);
  }
  return source;
}
export function readLifeSource(file,target){
  return projectLifeSource(readRawLifeFile(new URL('../'+file,import.meta.url),'utf8'),file,target);
}
