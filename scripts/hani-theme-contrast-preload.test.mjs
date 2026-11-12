// Exercise the existing shared preload without a CLI theme-contrast preload.
import './hani-m9-polish-preload.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import theme from './hani-theme-contrast-source.cjs';
import layers from './hani-release-version-layers.cjs';

const file=path.resolve(import.meta.dirname,'..',theme.delta.file),url=pathToFileURL(file);
const raw=layers.readRawFileSync(file),before=theme.restore(raw,theme.delta.file);

test('shared legacy reader peels only the exact CSS delta for paths, URLs, Buffer and UTF-8',()=>{
  assert.equal(theme.hash(raw),theme.delta.afterSha256);
  for(const owner of [file,url]){
    assert.deepEqual(fs.readFileSync(owner),before);
    assert.equal(fs.readFileSync(owner,'utf8'),before.toString('utf8'));
  }
  assert.deepEqual(layers.readRawFileSync(file),raw,'independent raw reader still sees current CSS');
});

test('callback and promise readers apply the same exact CSS projection',async()=>{
  for(const owner of [file,url]){
    assert.deepEqual(await new Promise((resolve,reject)=>fs.readFile(owner,(error,bytes)=>error?reject(error):resolve(bytes))),before);
    assert.equal(await fs.promises.readFile(owner,'utf8'),before.toString('utf8'));
  }
});

test('temporary files with the same basename and fixture bytes remain untouched',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hani-theme-reader-'));
  const copy=path.join(dir,theme.delta.file);
  try{
    fs.writeFileSync(copy,raw);
    assert.deepEqual(fs.readFileSync(copy),raw);
    assert.deepEqual(await fs.promises.readFile(copy),raw);
    assert.deepEqual(fs.readFileSync(new URL('./fixtures/theme-contrast-delta.json',import.meta.url)),layers.readRawFileSync(new URL('./fixtures/theme-contrast-delta.json',import.meta.url)));
  }finally{fs.unlinkSync(copy);fs.rmdirSync(dir);}
});

test('existing raw opt-out preserves current CSS for every shared read API',async()=>{
  const previous=process.env.HANI_IEUM_RAW;
  process.env.HANI_IEUM_RAW='1';
  try{
    assert.deepEqual(fs.readFileSync(file),raw);
    assert.deepEqual(await fs.promises.readFile(url),raw);
    assert.deepEqual(await new Promise((resolve,reject)=>fs.readFile(file,(error,bytes)=>error?reject(error):resolve(bytes))),raw);
  }finally{
    if(previous===undefined)delete process.env.HANI_IEUM_RAW;
    else process.env.HANI_IEUM_RAW=previous;
  }
});
