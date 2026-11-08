// Test-only exact inverses of the four frozen merges. Preserve mixed EOL bytes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const lifeHash=value=>createHash('sha256').update(value).digest('hex');
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
  for(const layer of lifeLayers.layers){
    if(layer.name===target)break;
    source=restoreLifeLayer(source,file,layer.name);
  }
  return source;
}
export function readLifeSource(file,target){
  return projectLifeSource(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),file,target);
}
