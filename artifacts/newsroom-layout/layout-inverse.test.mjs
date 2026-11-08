import test from 'node:test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {rows,restoreLayout,projectPreLayout}=createRequire(import.meta.url)('./layout-source.cjs');
const {files:versionFiles,restore284}=createRequire(import.meta.url)('./release284-source.cjs');
const release283=createRequire(import.meta.url)('../../scripts/hani-release-283-source.cjs');
test('exact 284 outer version layer restores the existing 283 fixed pins, rejects every other byte change',()=>{
 for(const [file,row]of Object.entries(versionFiles)){
  assert.equal(row.before,release283.files[file].after,'independent existing 283 pin');
  const current=fs.readFileSync(file,'utf8'),before=restore284(current,file);
  assert.equal(before.replaceAll('2.9.283','2.9.284'),current);
  for(const bad of [current+'\n',current.slice(1),current+current,current.replace('2.9.284','2.9.283'),current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')])assert.throws(()=>restore284(bad,file));
 }
});
test('outer layout inverse preserves every lower-layer byte and rejects partial, duplicate, unrelated and EOL edits',()=>{
 for(const [file,row]of Object.entries(rows)){
  const current=fs.readFileSync(file,'utf8'),before=fs.readFileSync(new URL('baseline/'+file,import.meta.url),'utf8');
  assert.equal(restoreLayout(current,file),before);
  let forward=before;
  for(const {before:a,after:b}of row.replacements){assert.equal(forward.split(a).length-1,1);forward=forward.replace(a,()=>b);}
  assert.equal(forward,current);
  for(const bad of [current+'\n',current.slice(1),before,current+current,current.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n')])assert.throws(()=>restoreLayout(bad,file));
  for(const {before:a,after:b}of row.replacements){assert.throws(()=>restoreLayout(current.replace(b,()=>a),file));assert.throws(()=>restoreLayout(current+b,file));}
  assert.equal(projectPreLayout(before,file),before);
 }
});
