import assert from 'node:assert/strict';
import fs from 'node:fs';
export const settingsDelta=JSON.parse(fs.readFileSync(new URL('./fixtures/settings-225-ui-delta.json',import.meta.url),'utf8'));
// Exact reviewed strings only. A changed control, notice, write or unrelated byte
// is never swallowed by an owner-wide regular expression.
export function withoutSettings225(file,source){
 const entry=settingsDelta.files[file];if(!entry)return source;
 for(const h of [...entry.hunks].reverse()){
  if(!source.includes(h.after)){assert.ok(source.includes(h.before),file+': settings hunk present');continue;}
  assert.equal(source.split(h.after).length-1,1,file+': unique settings presentation hunk');
  source=source.replace(h.after,()=>h.before);
 }
 return source;
}
