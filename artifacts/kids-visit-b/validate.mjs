import fs from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
import inverse from '../../scripts/hani-office-kids-pose-b-source.cjs';
const hash=x=>createHash('sha256').update(x).digest('hex'),read=f=>fs.readFileSync(f),source=read('hani-office-live.js').toString(),base=inverse.restoreKidsPoseBSource(source),count=(s,re)=>[...s.matchAll(re)].length;
const patterns={interval:/\bsetInterval\s*\(/g,timeout:/\bsetTimeout\s*\(/g,listener:/\baddEventListener\s*\(/g,storage:/\b(?:localStorage|sessionStorage)\b/g,cloud:/\bsupabase\b/g},counts={};
for(const [name,re]of Object.entries(patterns)){counts[name]={before:count(base,re),after:count(source,re)};assert.equal(counts[name].after,counts[name].before)}
const scheduler=s=>s.slice(s.indexOf('  function createScheduler('),s.indexOf('  function snapshot(now=new Date(),options={})'));assert.equal(scheduler(source),scheduler(base));
const assets=JSON.parse(read('scripts/fixtures/office-companions-276-delta.json')).assets.map(row=>{const actual=hash(read(row.file));assert.equal(actual,row.sha256);return {file:row.file,sha256:actual,preserved:true}});
const closure=await resolveRuntimeClosure({exists:fs.existsSync,read});assert.deepEqual(closure.missing,[]);assert.equal(closure.files.length,161);
const result={baseCommit:inverse.delta.baseCommit,runtimeSha256:hash(read('hani-office-live.js')),cssSha256:hash(read('hani-office-live.css')),atlasSha256:hash(read('assets/office-companions/kids-v2.webp')),contractSha256:hash(read('scripts/fixtures/office-kids-pose-b-delta.json')),displayVersion:read('hani-main.js').toString().match(/const HANI_DISPLAY_VERSION="([^"]+)"/)[1],counts,schedulerByteIdentical:true,preservedAssets:assets,runtimeClosure:{count:closure.files.length,missing:closure.missing},browser:'blocked: Edge spawn EPERM',commit:'blocked: shared Git index.lock Permission denied',notion:'write rejected: approval policy is never'};
fs.writeFileSync(new URL('validation.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
