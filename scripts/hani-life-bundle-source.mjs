// Test-only exact inverses of the four frozen merges. Preserve mixed EOL bytes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const lifeHash=value=>createHash('sha256').update(value).digest('hex');
const frozen=fs.readFileSync(new URL('./fixtures/life-bundle-layers.json',import.meta.url));
assert.equal(lifeHash(frozen),'cb49342779c5979c47ba0d4f7dfee2b491fd06607597fc38754451f74ce4f6d8','frozen life-bundle merge deltas');
export const lifeLayers=JSON.parse(frozen);
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
