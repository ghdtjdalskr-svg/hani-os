import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {affinity274Delta} from './hani-office-affinity-274-source.mjs';
import {stripApprovedAffinityStorage} from './hani-office-affinity-storage.mjs';

const pair=affinity274Delta.files.find(row=>row.file==='hani-office-live.js').replacements.find(row=>row.name==='count owner');
const source=fs.readFileSync(new URL('../hani-office-live.js',import.meta.url),'utf8');
const guards=[/localStorage|sessionStorage|\.setItem\(|\.removeItem\(|\.clear\(\)\s*;?\s*\/\/.*storage/,/localStorage|sessionStorage|\bsave\s*\(|supabase/,/localStorage|sessionStorage|supabase/];

test('storage exception removes only the exact approved owner and preserves every surrounding byte',()=>{
 assert.equal(stripApprovedAffinityStorage('prefix\n'+pair.after+'\nsuffix'),'prefix\n'+pair.before+'\nsuffix');
 const stripped=stripApprovedAffinityStorage(source);
 assert.equal(stripped,source.replace(pair.after,pair.before));
 for(const guard of guards)assert.doesNotMatch(stripped,guard);
 assert.throws(()=>stripApprovedAffinityStorage(stripped));
});

test('storage exception rejects missing, duplicate, changed-key, changed-payload and extra-operation blocks',()=>{
 assert.throws(()=>stripApprovedAffinityStorage(pair.before));
 assert.throws(()=>stripApprovedAffinityStorage(source+pair.after));
 assert.throws(()=>stripApprovedAffinityStorage(source+pair.before));
 for(const mutation of [
  pair.after.replace('hani_office_affinity_v1','other_key'),
  pair.after.replace('getItem(key)',"getItem('hani_os_life_v23')"),
  pair.after.replace('setItem(key,','setItem(otherKey,'),
  pair.after.replace('JSON.stringify({v:1,counts})','JSON.stringify({v:1,counts,secrets})'),
  ...['localStorage.removeItem(key)','localStorage.clear()','sessionStorage.setItem(key,"x")','supabase.from("counts")'].map(code=>pair.after.replace('    function load(){','    '+code+';\n    function load(){'))
 ])assert.throws(()=>stripApprovedAffinityStorage(source.replace(pair.after,mutation)));
});

test('storage exception leaves every outside storage/Cloud/save path visible to the original guards',()=>{
 for(const code of ['localStorage.getItem("other_key")','sessionStorage.setItem("x","y")','localStorage.removeItem("hani_os_life_v23")','localStorage.clear()','supabase.from("counts")','save()']){
  const stripped=stripApprovedAffinityStorage(source+'\n'+code);
  assert.ok(stripped.endsWith(code));
  for(const guard of guards)if(guard.test(code))assert.match(stripped,guard);
 }
});
