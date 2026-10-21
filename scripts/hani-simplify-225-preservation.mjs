import assert from 'node:assert/strict';
import fs from 'node:fs';
import {withoutSettings225} from './hani-settings-225-preservation.mjs';
const delta=JSON.parse(fs.readFileSync(new URL('./fixtures/simplify-225-ui-delta.json',import.meta.url),'utf8'));
// Exact, reviewed presentation hunks, never a regex that masks a whole owner.
// Historical tests still compare every other byte against their original base.
export function withoutSimplify225(file,source){
 source=withoutSettings225(file,source);
 const entry=delta.files[file];if(!entry)return source;
 for(const hunk of entry.hunks){
  const count=source.split(hunk.after).length-1;
  if(count===0){assert.ok(source.includes(hunk.before),file+': expected 225 presentation hunk');continue;}
  assert.equal(count,1,file+': unique 225 presentation hunk');
  source=source.replace(hunk.after,()=>hunk.before);
 }
 return source;
}
export {delta};
