import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectReferences,isTextArtifact,resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {canonicalPackageHash,evaluatePackage} from './hani-one-pass-rules.mjs';
import contract from '../dev-center/one-pass-gate-contract.json' with {type:'json'};
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url));
test('history reuses the newspaper API without extending the unchanged release closure',async()=>{
 const references=collectReferences('hani-organization-hub.js',read('hani-organization-hub.js'));
 assert.ok(references.includes('assets/data/hani-history-releases-v1.json'));
 assert.equal(references.some(f=>f.startsWith('data/hani-ilbo/')),false,'no second catalog owner');
 const closure=await resolveRuntimeClosure({read,exists:f=>fs.existsSync(new URL('../'+f,import.meta.url))});
 assert.deepEqual(closure.missing,[]);
 assert.ok(closure.files.includes('hani-ilbo.js'));
 const missing=await resolveRuntimeClosure({read,exists:f=>f!=='assets/data/hani-history-releases-v1.json'&&fs.existsSync(new URL('../'+f,import.meta.url))});
 assert.ok(missing.missing.some(r=>r.path==='assets/data/hani-history-releases-v1.json'&&r.referenced_by==='hani-organization-hub.js'),'missing history catalog still blocks');
});
test('other JSON references retain relative resolution',()=>{
 assert.deepEqual(collectReferences('data/other.json',JSON.stringify({file:'./child.json'})),['data/child.json']);
});

test('unchanged Node/server resolver parity and One-Pass runtime_closure on the working tree',async()=>{
 const canonical=read('scripts/hani-runtime-closure.mjs').toString().replace(/\r\n/g,'\n');
 assert.equal(read('supabase/functions/hani-deploy-bridge/runtime-closure.ts').toString().replace(/\r\n/g,'\n').split('\n').slice(2).join('\n'),canonical);
 const closure=await resolveRuntimeClosure({read,exists:f=>fs.existsSync(new URL('../'+f,import.meta.url))});
 assert.deepEqual(closure.missing,[]);
 const files=closure.files.map(path=>{const bytes=closure.contents.get(path);return isTextArtifact(path)?{path,content:bytes.toString('utf8')}:{path,encoding:'base64',content:bytes.toString('base64')}});
 // Only the closure check is asserted. This uncommitted snapshot is not a frozen
 // release candidate, and same-version feature work must not pass release gates.
 const check=files=>evaluatePackage({pkg:{files,package_sha256:canonicalPackageHash(files).package_sha256},baseFiles:'',productionVersion:'2.9.223',contract}).checks.find(c=>c.id==='runtime_closure');
 assert.equal(check(files).status,'PASS');
 const missing=check(files.filter(f=>f.path!=='assets/data/hani-history-releases-v1.json'));
 assert.equal(missing.status,'BLOCKED');assert.match(missing.detail,/hani-history-releases-v1\.json <- hani-organization-hub\.js/);
});
