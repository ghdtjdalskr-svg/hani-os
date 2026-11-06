import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeReleaseVersion,projectTrainVersion,trainBaseVersion} from './hani-reviewed-release-baseline.mjs';

test('release projection changes only cache tags, the constant and three exact display labels',()=>{
 const fields=v=>`a.js?v=${v}&x=1\r\nconst HANI_DISPLAY_VERSION="${v}";\r\nHANI OS Life Edition v${v}\r\nHANI OS · Life Edition v${v}\r\nHANI OS · v${v}\n`;
 const fixed=fields('2.9.268');
 for(const version of ['2.9.269','2.9.270','2.9.271','2.9.272','2.9.999'])assert.equal(normalizeReleaseVersion(fields(version),'2.9.268'),fixed);
 assert.equal(normalizeReleaseVersion('a.js?v=2.9.161 b.css?v=2.9.270','2.9.268'),'a.js?v=2.9.268 b.css?v=2.9.268');
 assert.equal(projectTrainVersion(fields(trainBaseVersion),'2.9.272'),fields('2.9.272'),'existing forward projection retains its behavior');
 assert.throws(()=>projectTrainVersion(fixed,'2.9.232'));
 for(const literal of ['2.9.271','2.9.15-safe-baseline-bootstrap','const INTERNAL_VERSION="2.9.271";','history v2.9.271','a.js?other=2.9.271','const HANI_DISPLAY_VERSION = "2.9.271";'])assert.equal(normalizeReleaseVersion(literal,'2.9.268'),literal);
 for(const changed of [fixed+'\n',fixed.replace('a.js','b.js'),fixed.replace('&x=1','&x=2'),fixed.replace('\r\n','\n'),fixed.slice(1),fixed+fixed])assert.notEqual(normalizeReleaseVersion(changed,'2.9.268'),fixed);
});

test('actual index and main pins still reject non-projection byte mutations',()=>{
 for(const file of ['index.html','hani-main.js']){
  const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),expected=normalizeReleaseVersion(source,'2.9.268');
  const mutations=[source+'\n',source.replace(/\r?\n/,m=>m==='\n'?'\r\n':'\n'),source.slice(1),source+source];
  if(file==='index.html')mutations.push(source.replace('hani-ui-v02992.js','changed-ui.js'));
  else mutations.push(source.replace('2.9.15-safe-baseline-bootstrap','2.9.16-safe-baseline-bootstrap'));
  for(const mutation of mutations){assert.notEqual(mutation,source);assert.notEqual(normalizeReleaseVersion(mutation,'2.9.268'),expected)}
 }
});
