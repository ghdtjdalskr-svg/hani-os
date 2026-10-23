import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newsroomScript,newsroomEntry,newsroomCss} from './hani-newsroom-4cut-preservation.mjs';
import {readReleaseSource,readReviewedReleaseBaseline,assertReviewedReleaseSource,guardedRelease,approvedReleases,projectTrainVersion,pendingApprovedConnections,normalizeReviewedCurrentSource,trainBaseVersion} from './hani-reviewed-release-baseline.mjs';

test('release225 plus only named later release changes reproduces current source bytes',()=>{
 for(const file of new Set(['hani-development-history-v1.js',...approvedReleases.flatMap(r=>r.files),...pendingApprovedConnections.map(c=>c.file)])){
  assertReviewedReleaseSource(file,fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
 }
 assert.ok(approvedReleases.every(r=>/^[0-9a-f]{40}$/.test(r.sha)));
 assert.match(guardedRelease,/^[0-9a-f]{40}$/);
});

test('release projection advances cache/display only; internal and historical literals stay strict',()=>{
 const source='x.js?v=2.9.232 const HANI_DISPLAY_VERSION="2.9.232"; internal="2.9.15-safe-baseline-bootstrap"; old="2.9.225";';
 assert.equal(trainBaseVersion,'2.9.232');
 assert.equal(projectTrainVersion(source,'2.9.233'),'x.js?v=2.9.233 const HANI_DISPLAY_VERSION="2.9.233"; internal="2.9.15-safe-baseline-bootstrap"; old="2.9.225";');
 assert.throws(()=>projectTrainVersion(source,'2.9.230'));
 assert.throws(()=>projectTrainVersion(source,'2.9.233-invalid'));
 const html=readReviewedReleaseBaseline('index.html'),future=projectTrainVersion(html,'2.9.233');
 assert.doesNotMatch(future,/2\.9\.232/,'next train updates all existing visible labels and cache tags');
 assert.match(future,/<title>갓생살기 프로젝트 · HANI OS Life Edition v2\.9\.233<\/title>/);
 assert.equal(projectTrainVersion('unrelated v2.9.232','2.9.233'),'unrelated v2.9.232');
});

test('unlisted controls, storage, source and EOL edits remain detectable against Git oracle',()=>{
 for(const [file,from,to] of [
  ['index.html','id="resetBtn"','id="missingReset"'],
  ['index.html','Local / Cloud 원본 보호 안내','missing notice'],
  ['hani-main.js','localStorage.setItem','localStorage.removeItem'],
  ['hani-investment-committee.js',"[UI.monthly,'월간 리포트'","[UI.monthly,'lost control'"],
  ['index.html','\r\n','\n']
 ]){
  const oracle=readReviewedReleaseBaseline(file),current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assertReviewedReleaseSource(file,current);assert.ok(oracle.includes(from),file+' mutation anchor');
  assert.throws(()=>assertReviewedReleaseSource(file,current.replace(from,to)),{code:'ERR_ASSERTION'},file+' unexpected edit rejected');
 }
 assert.notEqual(readReleaseSource(guardedRelease,'hani-investment-committee.js'),readReviewedReleaseBaseline('hani-investment-committee.js'),'later third tab requires explicit release allow-list');
});

test('pending approved connections strip CURRENT source only; an unlisted index line is rejected',()=>{
 const file='index.html',source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const oracle=readReviewedReleaseBaseline(file);
 assert.equal(normalizeReviewedCurrentSource(file,source),oracle);
 for(const {file:owner,lines} of pendingApprovedConnections)for(const line of lines)assert.ok(!readReviewedReleaseBaseline(owner).includes(line),'Git oracle has no pending connections');
 assertReviewedReleaseSource(file,source);
 assert.throws(()=>assertReviewedReleaseSource(file,source.replace('</head>','<script src="./unlisted-third.js"></script>\n</head>')),
  {code:'ERR_ASSERTION',message:/index\.html release225/},'third line reaches and fails the Git byte comparison');
});

test('pending connections reject missing, duplicate or altered additions in every current owner',()=>{
 for(const {file,lines} of pendingApprovedConnections){
  const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assertReviewedReleaseSource(file,source);
  for(const line of lines)for(const replacement of ['',line+'\n'+line,line.slice(0,-1)+'!']){
   assert.throws(()=>normalizeReviewedCurrentSource(file,source.replace(line,replacement)),{code:'ERR_ASSERTION'},file+' exact approved addition must occur once');
  }
  assert.throws(()=>normalizeReviewedCurrentSource(file,readReviewedReleaseBaseline(file)),{code:'ERR_ASSERTION'},'never normalize Git oracle bytes');
 }
 const other='unrelated\r\n'+pendingApprovedConnections[0].lines.join('\n');
 assert.equal(normalizeReviewedCurrentSource('other.html',other),other);
});

test('released newsroom bytes reject unlisted edits, including EOL and report data',()=>{
 for(const [file,from,to] of [
  ['index.html','주간 시황 4컷','unlisted card'],
  ['index.html','./hani-newsroom-4cut.js','./unlisted-newsroom.js'],
  ['hani-main.js','HaniNewsroom4cut?.enter()','HaniNewsroom4cut?.enter(true)'],
  ['hani-main.js','"catalog_version":7','"catalog_version":8'],
  ['hani-design-system.css','/* Newsroom weekly comic:','/* altered comic:'],
  ['hani-design-system.css','min-width:0;margin:0 0 20px','min-width:1px;margin:0 0 20px'],
  ['hani-design-system.css','#loginGateCloudTools #group-cloud>summary{display:none}','#loginGateCloudTools #group-cloud>summary{display:block}'],
  ['hani-main.js','localStorage.setItem','localStorage.removeItem'],
  ['index.html','id="resetBtn"','id="lostReset"'],
  ['index.html','\r\n','\n']
 ]){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.ok(current.includes(from),file+' mutation anchor');
  assert.throws(()=>assertReviewedReleaseSource(file,current.replace(from,to)),{code:'ERR_ASSERTION'},file+' unlisted mutation rejected');
 }
});

test('approved additions cannot move to another script, event or cascade position',()=>{
 for(const [file,addition] of [['index.html',newsroomScript],['hani-main.js',newsroomEntry],['hani-design-system.css',newsroomCss]]){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const moved=addition+current.replace(addition,'');
  assert.throws(()=>assertReviewedReleaseSource(file,moved),{code:'ERR_ASSERTION'},file+' canonical insertion order');
 }
});

test('pending office stays scoped to three runtime owners; released staff and moved fragments stay strict',()=>{
 assert.deepEqual(pendingApprovedConnections.map(c=>c.file).sort(),['assets/data/office-actions-216.json','assets/data/office-actions-221.json','hani-office-live.js']);
 for(const {file,lines} of pendingApprovedConnections){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assertReviewedReleaseSource(file,current);
  assert.throws(()=>assertReviewedReleaseSource(file,'// unlisted staff edit\n'+current),{code:'ERR_ASSERTION'},file+' outside fragment');
  for(const fragment of lines){
   // Full JSON is one frozen line; a leading JS hunk must move to the end.
   const rest=current.replace(fragment,''),moved=rest?(current.startsWith(fragment)?rest+fragment:fragment+rest):fragment+'\n';
   assert.throws(()=>assertReviewedReleaseSource(file,moved),{code:'ERR_ASSERTION'},file+' moved approved fragment');
  }
 }
 for(const [file,from,to] of [
  ['hani-main.js','사원 · 2F','부장 · 2F'],
  ['hani-organization-hub.js',"['sua','수아','과장'","['sua','수아','사원'"],
  ['hani-character-archive-data.js','2026-10-23 입사','2026-10-24 입사'],
  ['hani-character-archive.js','다온 · 윤슬이 2026-10-23','다온 · 윤슬이 2026-10-24'],
  ['hani-ui-v02992.js','identity:"다온 · 리스크 애널리스트",rank:"사원"','identity:"다온 · 리스크 애널리스트",rank:"부장"']
 ]){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.ok(current.includes(from),file+' mutation anchor');
  assert.throws(()=>assertReviewedReleaseSource(file,current.replace(from,to)),{code:'ERR_ASSERTION'},file+' unlisted rank/date/other staff');
 }
});
