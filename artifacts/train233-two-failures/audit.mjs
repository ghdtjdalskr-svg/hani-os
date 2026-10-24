import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import support from '../../scripts/qa-1st-test-support.cjs';
import {verifySettingsQaGuard} from '../../scripts/hani-settings-225-qa-guard.mjs';
import {readReviewedReleaseBaseline} from '../../scripts/hani-reviewed-release-baseline.mjs';
const root=new URL('../../',import.meta.url),out=new URL('./',import.meta.url),read=file=>fs.readFileSync(new URL(file,root),'utf8'),base=file=>fs.readFileSync(new URL('base/'+file,out),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const main=read('hani-main.js'),plan=read('scripts/fixtures/settings-225-plan.md'),html=read('index.html');
const guardResult=verifySettingsQaGuard(main,readReviewedReleaseBaseline('hani-main.js'),html,plan);
const settingsIds=new Set([...plan.matchAll(/^\| `#([\w-]+)`/gm)].map(m=>m[1]));
const guarded=support.assignments(main).filter(r=>r.code.startsWith('saveEntry(')).map(r=>r.id);
assert.deepEqual(guarded.filter(id=>settingsIds.has(id)),['goalRegistryApprove']);
const origins={};for(const label of ['qa-origin','qa-parent']){
 const raw=fs.readFileSync(new URL(label+'/hani-main.js',out)),tree=fs.readFileSync(new URL(label+'.tree',out),'utf8').replace(/^\uFEFF/,'').trim();
 assert.equal(crypto.createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex'),tree.split(/\s+/)[2]);
 origins[label]={sha256:hash(raw),goalRegistryApprove:support.assignments(raw.toString('utf8')).find(r=>r.id==='goalRegistryApprove').code};
}
assert.equal(support.assignments(main).find(r=>r.id==='goalRegistryApprove').code,origins['qa-origin'].goalRegistryApprove);
const originals=['hani-main.js','hani-asset-update-v1.js','hani-context-remote-v1.js','hani-context-remote.css','hani-study-v02984.js','hani-yuna-helpdesk.js','hani-investment-committee.js','hani-asset-market-view.js','index.html'];
for(const file of originals)assert.equal(read(file),base(file),file+' full byte/EOL unchanged');
const diff=fs.readFileSync(new URL('all-eol-map.diff',out),'utf8'),hunks=new Map();let file;
for(const line of diff.split('\n')){
 const header=line.match(/^\+\+\+ b\/(.*)$/);if(header){file=header[1];hunks.set(file,[])}
 const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(h&&file)hunks.get(file).push({old:+h[1],oldCount:h[2]===undefined?1:+h[2],now:+h[3],newCount:h[4]===undefined?1:+h[4]});
}
let preserved=0;for(const [file,changes]of hunks){
 const split=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],before=split(base(file)),after=split(read(file));let old=0,now=0;
 for(const h of [...changes,{old:before.length,now:after.length,oldCount:0,newCount:0}]){
  const oldStart=h.oldCount?h.old-1:h.old,newStart=h.newCount?h.now-1:h.now;
  while(old<oldStart&&now<newStart){assert.equal(after[now],before[old],file+' unchanged line/EOL '+(old+1));old++;now++;preserved++}
  assert.equal(old,oldStart);assert.equal(now,newStart);old+=h.oldCount;now+=h.newCount;
 }
}
const fixture=JSON.parse(read('scripts/fixtures/train233-integrations.json')),oldFixture=JSON.parse(base('scripts/fixtures/train233-integrations.json'));
const {browserResidual,...older}=fixture;assert.deepEqual(older,oldFixture,'all prior integration identities/fragments remain unchanged');
const result={status:'PASS',base:'18916a02c82e1ff06e7598b8b2b94166b2010080',guardResult,allGuardedControlIds:guarded,settingsGuardedControlIds:guarded.filter(id=>settingsIds.has(id)),guardedApprovalMatches688c6a4:true,originHashes:Object.fromEntries(Object.entries(origins).map(([k,v])=>[k,v.sha256])),fullOriginalFiles:originals,unchangedLinesWithExactEol:preserved,priorFixtureUnchanged:true,cssHash:hash(read('hani-design-system.css')),browser:'NOT RUN',newRuntimeJS:0};
fs.writeFileSync(new URL('audit.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
