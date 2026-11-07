import assert from 'node:assert/strict';
import {affinity274Delta} from './hani-office-affinity-274-source.mjs';

// Use only the storage owner pair from the immutable 274 delta, never its UI/event pairs.
const files=affinity274Delta.files.filter(row=>row.file==='hani-office-live.js');
assert.equal(files.length,1);
const pairs=files[0].replacements.filter(row=>row.name==='count owner');
assert.equal(pairs.length,1);
const {before,after}=pairs[0];
assert.ok(after.endsWith(before),'the approved owner is an insertion before the unchanged anchor');
const approved=after.slice(0,-before.length);

function assertApprovedStorage(block){
 assert.equal(block,approved,'exact approved affinity owner bytes only');
 assert.deepEqual(block.match(/hani_[a-z0-9_]+/g),['hani_office_affinity_v1'],'only the approved key');
 assert.equal(block.split("const key='hani_office_affinity_v1',").length-1,1,'one immutable key binding');
 assert.deepEqual(Array.from(block.matchAll(/globalThis\.localStorage\.(\w+)\(([^,)]*)/g),m=>[m[1],m[2]]),[['getItem','key'],['setItem','key']],'only getItem/setItem on the approved binding');
 const rest=block.replace('globalThis.localStorage.getItem(key)','').replace('globalThis.localStorage.setItem(key,JSON.stringify({v:1,counts}))','');
 assert.doesNotMatch(rest,/localStorage|sessionStorage|\b(?:getItem|setItem|removeItem|clear)\b|hani_os_life_v23|supabase/,'no other storage operation, key or Cloud access may be stripped');
}

export function stripApprovedAffinityStorage(source){
 assert.equal(source.split(before).length-1,1,'unique unchanged affinity owner anchor');
 assert.equal(source.split(after).length-1,1,'exact unique approved affinity owner pair');
 const start=source.indexOf(after);
 assertApprovedStorage(source.slice(start,start+approved.length));
 return source.replace(after,before);
}
