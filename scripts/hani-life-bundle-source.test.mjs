import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {lifeLayers,lifeHash,restoreLifeLayer,projectLifeSource,readLifeSource,lifeRefresh,restoreLifeReportRefresh,readRawLifeFile,projectPreRelease283Source} from './hani-life-bundle-source.mjs';
import release283 from './hani-release-283-source.cjs';
import releaseLayers from './hani-release-version-layers.cjs';
import {readLifeBaseline as readBranchBaseline} from './hani-life-bundle-source.mjs';
import study from './hani-study-retry-source.cjs';
const owners=['hani-main.js','index.html','hani-study-v02984.js'];
const current=Object.fromEntries(owners.map(file=>[file,projectPreRelease283Source(readRawLifeFile(new URL('../'+file,import.meta.url),'utf8'),file)]));

test('283 outer inverse preserves complete bytes and rejects drift, partial, duplicate and repeated inverse',()=>{
  for(const file of Object.keys(release283.files)){
    const raw=releaseLayers.projectReleaseSource(readRawLifeFile(new URL('../'+file,import.meta.url),'utf8'),file,'2.9.283');
    const before=release283.restoreRelease283(raw,file);
    assert.equal(before,current[file]);
    assert.equal(before.replaceAll('2.9.282','2.9.283'),raw);
    for(const bad of [raw+'\n',raw.slice(1),raw+raw,before,raw.replace('2.9.283','2.9.282')])assert.throws(()=>release283.restoreRelease283(bad,file),/exact release-283 input/);
  }
});

test('single report refresh has an exact inverse; rejects drift, missing, duplicate and repeated inverse',()=>{
  const after=current['hani-main.js'],before=restoreLifeReportRefresh(after);
  assert.equal(lifeHash(before),lifeRefresh.beforeSha256);
  assert.equal(before.replace(lifeRefresh.before,()=>lifeRefresh.after),after);
  for(const bad of [after+'\n',after.slice(1),after+after,before])assert.throws(()=>restoreLifeReportRefresh(bad),/exact refreshed report input/);
});

test('four ordered inverses restore each immediate lower hash and the entire frozen main, including mixed EOL',()=>{
  assert.deepEqual(lifeLayers.layers.map(row=>row.name),['dev-report','wishlist','procrastination','study-retry']);
  for(const file of owners){
    let source=current[file];
    for(const layer of lifeLayers.layers){
      const delta=layer.files[file];
      if(delta)assert.equal(lifeHash(source),delta.afterSha256);
      source=restoreLifeLayer(source,file,layer.name);
      if(delta)assert.equal(lifeHash(source),delta.beforeSha256);
    }
    assert.equal(source,readBranchBaseline(file),file+' independently frozen release baseline bytes');
    assert.equal(projectLifeSource(current[file],file,'main'),source);
  }
  assert.equal(projectLifeSource(current['hani-study-v02984.js'],'hani-study-v02984.js','main'),study.projectPreStudyRetrySource(current['hani-study-v02984.js']),'existing frozen study proof agrees');
});

test('every changed owner rejects drift, missing/duplicate bytes, wrong order and a second inverse',()=>{
  for(const layer of lifeLayers.layers)for(const file of Object.keys(layer.files)){
    const source=projectLifeSource(current[file],file,layer.name);
    const restored=restoreLifeLayer(source,file,layer.name);
    for(const bad of [source+'\n',source.slice(1),source+source,restored])assert.throws(()=>restoreLifeLayer(bad,file,layer.name),/exact input/);
    const previous=lifeLayers.layers.slice(0,lifeLayers.layers.indexOf(layer)).find(row=>row.files[file]);
    if(previous)assert.throws(()=>restoreLifeLayer(current[file],file,layer.name),/exact input/);
  }
  assert.throws(()=>projectLifeSource('',owners[0],'unknown'),/known life-bundle target/);
  assert.throws(()=>restoreLifeLayer('',owners[0],'unknown'),/known life-bundle layer/);
});

test('legacy preload changes only canonical root reads, retaining buffers and all temporary/baseline bytes',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hani-life-preload-'));
  try{
    const temp=path.join(dir,'hani-main.js');
    fs.writeFileSync(temp,current['hani-main.js']);
    const expected=projectLifeSource(current['hani-main.js'],'hani-main.js','study-retry');
    await import('./hani-life-bundle-preload.mjs');
    assert.equal(fs.readFileSync(new URL('../hani-main.js',import.meta.url),'utf8'),expected);
    assert.deepEqual(fs.readFileSync(new URL('../hani-main.js',import.meta.url)),Buffer.from(expected));
    assert.equal(fs.readFileSync(temp,'utf8'),current['hani-main.js']);
    assert.equal(readBranchBaseline('hani-main.js'),expected);
    const studyFile=new URL('../hani-study-v02984.js',import.meta.url);
    assert.equal(fs.readFileSync(studyFile,'utf8'),current['hani-study-v02984.js'],'QA212 retains its own exact study projection');
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
