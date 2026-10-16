import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import contract from '../dev-center/one-pass-gate-contract.json' with {type:'json'};
import {evaluatePackage,canonicalPackageHash} from './hani-one-pass-rules.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {resolveRuntimeClosure as bridgeClosure} from '../supabase/functions/hani-deploy-bridge/runtime-closure.ts';

const root=new URL('../',import.meta.url);
const bridge=fs.readFileSync(new URL('supabase/functions/hani-deploy-bridge/index.ts',root),'utf8');
const begin=bridge.indexOf('function normalizeReleasePath('),end=bridge.indexOf('function releaseFilePolicy(',begin);
assert.ok(begin>=0&&end>begin);
const server=vm.runInNewContext(stripTypeScriptTypes(`const TARGET_PATH="index.html";${bridge.slice(begin,end)};isAllowedReleasePath`));
const main=fs.readFileSync(new URL('hani-main.js',root),'utf8');
const snippets=['deployNormalizeReleasePath','deployPackagePathAllowed'].map(name=>{
  const line=main.split(/\r?\n/).find(line=>line.startsWith(`function ${name}(`));
  assert.ok(line,`missing ${name}`);return line;
});
const client=vm.runInNewContext(`${snippets.join('\n')};deployPackagePathAllowed`);
const evaluate=files=>evaluatePackage({pkg:{files,package_sha256:canonicalPackageHash(files).package_sha256},baseFiles:'',productionVersion:'',contract});
const allowed=file=>evaluate([{path:file,content:''}]).checks.find(check=>check.id==='release_paths').status==='PASS';
for(const file of ['manifest.webmanifest','assets/pwa/icon-192.png','assets/pwa/icon-512.png','assets/pwa/icon-512-maskable.png','assets/pwa/apple-touch-icon.png']){
  for(const accepts of [allowed,client,server])assert.equal(accepts(file),true,file);
}
for(const file of ['other.webmanifest','assets/pwa/other.webmanifest','manifest.webmanifest.js','manifest.webmanifest/extra','../manifest.webmanifest','assets/pwa/../../secret.txt','/manifest.webmanifest','manifest.webmanifest?x=1','assets/pwa/icon.exe']){
  for(const accepts of [allowed,client,server])assert.equal(accepts(file),false,file);
}
const icons=['assets/pwa/icon-192.png','assets/pwa/icon-512.png','assets/pwa/icon-512-maskable.png'];
const files=[{path:'index.html',content:'<link rel="manifest" href="./manifest.webmanifest">'},
  {path:'manifest.webmanifest',content:JSON.stringify({name:'HANI OS',start_url:'./?source=pwa',icons:icons.map(src=>({src:`./${src}`,sizes:'512x512',type:'image/png',purpose:'any'}))})},
  ...icons.map(path=>({path,encoding:'base64',content:'AA=='}))];
for(const resolve of [resolveRuntimeClosure,bridgeClosure]){
  const map=new Map(files.map(file=>[file.path,file.encoding?Buffer.from(file.content,'base64'):Buffer.from(file.content)]));
  const closure=await resolve({exists:file=>map.has(file),read:file=>map.get(file)});
  assert.deepEqual(closure.files,[...map.keys()].sort());assert.deepEqual(closure.missing,[]);
  map.delete(icons[0]);
  assert.deepEqual((await resolve({exists:file=>map.has(file),read:file=>map.get(file)})).missing,[{path:icons[0],referenced_by:'manifest.webmanifest'}]);
}
const result=evaluate(files);
for(const id of ['release_paths','runtime_closure'])assert.equal(result.checks.find(check=>check.id===id).status,'PASS',id);
assert.equal(evaluate(files.filter(file=>file.path!==icons[0])).checks.find(check=>check.id==='runtime_closure').status,'BLOCKED');
console.log('PASS PWA Node/client/bridge path parity, disallowed paths, recursive closure parity and missing-icon block; contract unchanged');
