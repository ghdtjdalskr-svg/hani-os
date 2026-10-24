import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readReviewedReleaseBaseline as baseline,readReviewedCurrentSource} from './hani-reviewed-release-baseline.mjs';
import {verifySettingsQaGuard} from './hani-settings-225-qa-guard.mjs';
import {withoutSettings225,settingsDelta} from './hani-settings-225-preservation.mjs';
import {withoutHeroRestore} from './hani-hero-restore-preservation.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const main=read('hani-main.js'),html=read('index.html'),plan=read('scripts/fixtures/settings-225-plan.md');

test('settings QA guard retains original handlers and executes memory-only approval and failure paths',()=>{
 assert.match(verifySettingsQaGuard(main,baseline('hani-main.js'),html,plan),/^36 settings property assignments:/);
});
test('extra wrappers, changed original body, wrong button and removed guard remain rejected',()=>{
 for(const [from,to]of [
  ['$("goalRegistryApprove"),()=>{','$("resetBtn"),()=>{'],
  ["const draft=goalRegistryDraft;if(!draft)return;","const draft=goalRegistryDraft;if(!draft)return;save();"],
  ['$("exportBtn").onclick=()=>exportData()','$("exportBtn").onclick=saveEntry($("exportBtn"),()=>exportData())'],
  ['saveEntry($("goalRegistryApprove"),()=>{','unreviewedGuard($("goalRegistryApprove"),()=>{']
 ]){
  assert.equal(main.split(from).length-1,1,'unique mutation anchor');
  assert.throws(()=>verifySettingsQaGuard(main.replace(from,to),baseline('hani-main.js'),html,plan),{code:'ERR_ASSERTION'});
 }
});
test('browser before fixture reverts settings presentation only and retains all integrated handlers',()=>{
 for(const file of Object.keys(settingsDelta.files)){
  const current=file==='hani-main.js'?read(file):readReviewedCurrentSource(file),before=withoutSettings225(file,withoutHeroRestore(file,current));
  assert.notEqual(before,current,file+' reviewed presentation is reverted');
  if(file==='hani-main.js')assert.match(verifySettingsQaGuard(before,baseline(file),html,plan),/^36 settings property assignments:/);
 }
 const browserTest=read('scripts/hani-settings-225.test.mjs');
 assert.match(browserTest,/relative==='hani-main\.js'\?body\.toString\('utf8'\):readReviewedCurrentSource\(relative\)/);
 assert.match(browserTest,/withoutSettings225\(relative,withoutHeroRestore\(relative,source\)\)/);
});
