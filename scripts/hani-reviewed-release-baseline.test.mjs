import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readReleaseSource,readReviewedReleaseBaseline,assertReviewedReleaseSource,guardedRelease,approvedReleases,projectTrainVersion} from './hani-reviewed-release-baseline.mjs';

test('release225 plus only named later release changes reproduces current source bytes',()=>{
 for(const file of new Set(['hani-development-history-v1.js',...approvedReleases.flatMap(r=>r.files)])){
  assert.equal(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),readReviewedReleaseBaseline(file),file);
 }
 assert.ok(approvedReleases.every(r=>/^[0-9a-f]{40}$/.test(r.sha)));
 assert.match(guardedRelease,/^[0-9a-f]{40}$/);
});

test('release projection advances cache/display only; internal and historical literals stay strict',()=>{
 const source='x.js?v=2.9.230 const HANI_DISPLAY_VERSION="2.9.230"; internal="2.9.15-safe-baseline-bootstrap"; old="2.9.225";';
 assert.equal(projectTrainVersion(source,'2.9.231'),'x.js?v=2.9.231 const HANI_DISPLAY_VERSION="2.9.231"; internal="2.9.15-safe-baseline-bootstrap"; old="2.9.225";');
 assert.throws(()=>projectTrainVersion(source,'2.9.229'));
 assert.throws(()=>projectTrainVersion(source,'2.9.231-invalid'));
 const html=readReviewedReleaseBaseline('index.html'),future=projectTrainVersion(html,'2.9.231');
 assert.doesNotMatch(future,/2\.9\.230/,'next train updates all existing visible labels and cache tags');
 assert.match(future,/<title>갓생살기 프로젝트 · HANI OS Life Edition v2\.9\.231<\/title>/);
 assert.equal(projectTrainVersion('unrelated v2.9.230','2.9.231'),'unrelated v2.9.230');
});

test('unlisted controls, storage, source and EOL edits remain detectable against Git oracle',()=>{
 for(const [file,from,to] of [
  ['index.html','id="resetBtn"','id="missingReset"'],
  ['index.html','Local / Cloud 원본 보호 안내','missing notice'],
  ['hani-main.js','localStorage.setItem','localStorage.removeItem'],
  ['hani-investment-committee.js',"[UI.monthly,'월간 리포트'","[UI.monthly,'lost control'"],
  ['index.html','\r\n','\n']
 ]){
  const oracle=readReviewedReleaseBaseline(file);assert.ok(oracle.includes(from),file+' mutation anchor');
  assert.throws(()=>assertReviewedReleaseSource(file,oracle.replace(from,to)),{code:'ERR_ASSERTION'},file+' unexpected edit rejected');
 }
 assert.notEqual(readReleaseSource(guardedRelease,'hani-investment-committee.js'),readReviewedReleaseBaseline('hani-investment-committee.js'),'later third tab requires explicit release allow-list');
});
