// Run without a preload, after exporting `git ls-tree -r HEAD` to head-tree.txt.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
const tree=fs.readFileSync(new URL('./head-tree.txt',import.meta.url),'utf8').replace(/^\uFEFF/,'');
const objects=new Map([...tree.matchAll(/^\d+ blob ([a-f0-9]{40})\t(.+)\r?$/gm)].map(m=>[m[2].replace(/\r$/,''),m[1]]));
const read=file=>fs.readFileSync(new URL('../../'+file,import.meta.url));
const closure=await resolveRuntimeClosure({read,exists:file=>fs.existsSync(new URL('../../'+file,import.meta.url))});
assert.deepEqual(closure.missing,[]);
const files=closure.files.slice().sort().map(file=>{
  const bytes=read(file);
  const blob=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.ok(objects.has(file),'tracked in frozen HEAD: '+file);
  assert.equal(blob,objects.get(file),'raw HEAD bytes, no EOL normalization: '+file);
  return {file,bytes:bytes.length,gitBlob:blob,sha256:createHash('sha256').update(bytes).digest('hex')};
});
const result={head:'addcd20c29839f0078e2409ed25ba3564d768376',count:files.length,missing:closure.missing,result:'PASS',files};
fs.writeFileSync(new URL('./runtime-head-bytes.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(`PASS ${files.length} runtime closure files exactly match raw frozen HEAD blobs`);
