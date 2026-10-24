import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {newsroomScript,newsroomEntry,newsroomCss} from './hani-newsroom-4cut-preservation.mjs';
import {readReleaseSource,readReviewedReleaseBaseline,assertReviewedReleaseSource,guardedRelease,approvedReleases,projectTrainVersion,pendingApprovedConnections,normalizeReviewedCurrentSource,normalizeReviewedConnection,trainBaseVersion} from './hani-reviewed-release-baseline.mjs';

test('release225 plus only named later release changes reproduces current source bytes',()=>{
 for(const file of new Set(['hani-development-history-v1.js',...approvedReleases.flatMap(r=>r.files),...pendingApprovedConnections.map(c=>c.file)])){
  assertReviewedReleaseSource(file,fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
 }
 assert.ok(approvedReleases.every(r=>/^[0-9a-f]{40}$/.test(r.sha)));
 assert.match(guardedRelease,/^[0-9a-f]{40}$/);
});

test('pending integrations are exact deltas between the fixed reviewed merge identities',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8'));
 assert.equal(fixture.baseSha,'b5a64e5');
 assert.equal(fixture.candidateSha,'7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c');
 assert.deepEqual(fixture.integrationMerges,['1cdf07f','91758b7','bbc1ff9','b1f7a48','7d0fa05']);
 assert.deepEqual(fixture.approvedIntegrationFixes.map(({sha,file})=>({sha,file})),[
  {sha:'f2df938314a19e02e334a0be1726a9a4a9d61245',file:'hani-asset-update-v1.js'},
  {sha:'7471e5aabc0ba441ed826a108e04ecb2f3e196b6',file:'hani-main.js'}
 ]);
 assert.deepEqual(fixture.changes.map(c=>c.file),['hani-asset-market-view.js','hani-asset-update-v1.js','hani-context-remote-v1.js','hani-context-remote.css','hani-design-system.css','hani-investment-committee.js','hani-main.js','hani-organization-hub.css','hani-organization-hub.js','hani-study-v02984.js','hani-style-07.css','hani-yuna-helpdesk.js','index.html']);
 for(const {file,replacements}of fixture.changes){
  const before=readReleaseSource('b5a64e5',file),after=readReleaseSource('7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c',file);
  let forward=before,reverse=after;
  for(const hunk of replacements){
   assert.equal(forward.split(hunk.before).length-1,1,file+' fixed before unique');
   assert.equal(reverse.split(hunk.after).length-1,1,file+' fixed after unique');
   forward=forward.replace(hunk.before,()=>hunk.after);reverse=reverse.replace(hunk.after,()=>hunk.before);
  }
  assert.equal(forward,after,file+' fixed forward bytes');assert.equal(reverse,before,file+' fixed reverse bytes');
 }
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
 const stages=new Map();
 for(const connection of pendingApprovedConnections){
  const {file,lines}=connection,source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assertReviewedReleaseSource(file,source);
  const stage=stages.get(file)??source;
  for(const line of lines)for(const replacement of ['',line+'\n'+line,line.slice(0,-1)+'!']){
   assert.equal(stage.split(line).length-1,1,file+' exact layer is present before mutation');
   assert.throws(()=>normalizeReviewedConnection(connection,stage.replace(line,()=>replacement)),{code:'ERR_ASSERTION'},file+' exact approved addition must occur once at its normalization stage');
  }
  stages.set(file,normalizeReviewedConnection(connection,stage));
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

test('pending 233 train stays scoped to office, milestones, hero-crop, asset-intake, QA and HANI-77 owners; released staff and moved fragments stay strict',()=>{
 assert.deepEqual(pendingApprovedConnections.map(c=>c.file).sort(),["hani-design-system.css","hani-design-system.css","hani-context-remote.css","hani-context-remote.css","hani-design-system.css","hani-portfolio-preview.css",...["assets/data/office-actions-216.json","assets/data/office-actions-221.json","hani-asset-market-view.js","hani-asset-update-v1.js","hani-context-remote-v1.js","hani-context-remote.css","hani-design-system.css","hani-design-system.css","hani-design-system.css","hani-investment-committee.js","hani-main.js","hani-main.js","hani-office-live.js","hani-organization-hub.css","hani-organization-hub.js","hani-study-v02984.js","hani-style-07.css","hani-ui-v02992.js","hani-yuna-helpdesk.js","index.html","index.html"]].sort());
 const stages=new Map();
 for(const connection of pendingApprovedConnections){
  const {file,lines}=connection,current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const stage=stages.get(file)??current;
  assertReviewedReleaseSource(file,current);
  assert.throws(()=>assertReviewedReleaseSource(file,'// unlisted staff edit\n'+current),{code:'ERR_ASSERTION'},file+' outside fragment');
  for(const fragment of lines){
   // Full JSON is one frozen line; a leading JS hunk must move to the end.
   assert.equal(stage.split(fragment).length-1,1,file+' fragment exists at this exact stage');
   const rest=stage.replace(fragment,''),moved=rest?(stage.startsWith(fragment)?rest+fragment:fragment+rest):fragment+'\n';
   assert.notEqual(normalizeReviewedConnection(connection,moved),normalizeReviewedConnection(connection,stage),file+' moved fragment changes normalized bytes');
   if(current.includes(fragment)){
    const rest=current.replace(fragment,''),moved=rest?(current.startsWith(fragment)?rest+fragment:fragment+rest):fragment+'\n';
    assert.throws(()=>assertReviewedReleaseSource(file,moved),{code:'ERR_ASSERTION'},file+' moved current fragment rejected');
   }
  }
  stages.set(file,normalizeReviewedConnection(connection,stage));
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

test('approved numeric integration fixes retain exact origin and reject removal, edits, duplication, moves and EOL changes',()=>{
 const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8'));
 for(const {sha,file} of fixture.approvedIntegrationFixes){
  const before=readReleaseSource(sha+'^',file),after=readReleaseSource(sha,file);
  const lines=text=>text.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[];
  const oldLines=lines(before),newLines=lines(after);assert.equal(oldLines.length,newLines.length);
  const changes=oldLines.flatMap((line,i)=>line===newLines[i]?[]:[{before:line,after:newLines[i]}]);
  assert.equal(changes.length,1,file+' approved commit changes one line only');
  const change=changes[0],current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.equal(current.split(change.after).length-1,1,file+' exact approved current line');
  assertReviewedReleaseSource(file,current);
  const badEol=change.after.endsWith('\r\n')?change.after.replace(/\r\n$/,'\n'):change.after.replace(/\n$/,'\r\n');
  for(const replacement of [change.before,'',change.after+change.after,change.after.replace('return null','return 0'),badEol]){
   assert.notEqual(replacement,change.after);
   assert.throws(()=>assertReviewedReleaseSource(file,current.replace(change.after,()=>replacement)),{code:'ERR_ASSERTION'},file+' invalid approved line');
  }
  assert.throws(()=>assertReviewedReleaseSource(file,change.after+current.replace(change.after,'')),{code:'ERR_ASSERTION'},file+' approved line cannot move');
 }
});


test('fixed f27be17 CSS follow-up and named owner corrections retain exact bytes and reject drift',()=>{
 const {browserFollowup:f}=JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8'));
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 assert.equal(f.baseSha,'5a665a3');assert.equal(f.candidateSha,'f27be17c1b3ea989fec3b4886f36b3b32c4caa27');
 assert.deepEqual(f.changes.map(c=>c.file),['hani-context-remote.css','hani-design-system.css','hani-portfolio-preview.css']);
 assert.deepEqual(f.corrections.map(c=>[c.file,c.afterHash]),[
  ['hani-design-system.css','bce2b2ac0991b69fb66831b2825a74050303d66e99b3ac1316812ebdee240948'],
  ['hani-context-remote.css','6ec52443784833f7c09b5c16318342b038534b8f5819694fe8360989d8039e4c']
 ]);
 for(const change of f.changes){
  const before=readReleaseSource(f.baseSha,change.file),after=readReleaseSource(f.candidateSha,change.file);
  assert.equal(hash(before),change.beforeHash);assert.equal(hash(after),change.afterHash);
  let forward=before,reverse=after;
  for(const h of change.replacements){assert.equal(forward.split(h.before).length-1,1);assert.equal(reverse.split(h.after).length-1,1);forward=forward.replace(h.before,()=>h.after);reverse=reverse.replace(h.after,()=>h.before)}
  assert.equal(forward,after);assert.equal(reverse,before);
 }
 for(const change of f.corrections){
  let expected=readReleaseSource(f.candidateSha,change.file);assert.equal(hash(expected),change.beforeHash);
  for(const h of change.replacements){assert.equal(expected.split(h.before).length-1,1);expected=expected.replace(h.before,()=>h.after)}
  let current=fs.readFileSync(new URL('../'+change.file,import.meta.url),'utf8');
  const {browserResidual}=JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8'));
  for(const delta of browserResidual.changes.filter(c=>c.file===change.file))for(const h of delta.replacements){assert.equal(current.split(h.after).length-1,1);current=current.replace(h.after,()=>h.before)}
  assert.equal(hash(expected),change.afterHash);assert.equal(current,expected);
 }
 for(const file of f.changes.map(c=>c.file)){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  for(const changed of [current+'/* unlisted CSS */',current.replace(/\r\n/,'\n')]){assert.notEqual(changed,current);assert.throws(()=>assertReviewedReleaseSource(file,changed),{code:'ERR_ASSERTION'},file+' outside edits and EOL remain strict')}
 }
});

test('date border correction is an exact delta from fixed 18916a0; old integration identities remain intact',()=>{
 const {browserResidual:f}=JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8'));
 assert.equal(f.baseSha,'18916a02c82e1ff06e7598b8b2b94166b2010080');
 assert.deepEqual(f.changes.map(c=>[c.file,c.beforeHash,c.afterHash]),[['hani-design-system.css','bce2b2ac0991b69fb66831b2825a74050303d66e99b3ac1316812ebdee240948','8f3fc89d4a4138dce379f5ffd194505048aea85b8e395a0ada5c24246decb10b']]);
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
 for(const change of f.changes){
  const before=readReleaseSource(f.baseSha,change.file),after=fs.readFileSync(new URL('../'+change.file,import.meta.url),'utf8');
  assert.equal(hash(before),change.beforeHash);assert.equal(hash(after),change.afterHash);
  let forward=before,reverse=after;
  for(const h of change.replacements){assert.equal(forward.split(h.before).length-1,1);assert.equal(reverse.split(h.after).length-1,1);forward=forward.replace(h.before,()=>h.after);reverse=reverse.replace(h.after,()=>h.before)}
  assert.equal(forward,after);assert.equal(reverse,before);assertReviewedReleaseSource(change.file,after);
  for(const h of change.replacements)for(const mutation of [after.replace(h.after,''),after.replace(h.after,h.after+h.after),after.replace(h.after,h.after+'/* unlisted */')])assert.throws(()=>assertReviewedReleaseSource(change.file,mutation),{code:'ERR_ASSERTION'});
 }
});
