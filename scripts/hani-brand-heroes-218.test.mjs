import {withoutHeroRestore} from './hani-hero-restore-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {readReviewedReleaseBaseline as readBranchBaseline,readReviewedCurrentSource} from './hani-reviewed-release-baseline.mjs';
const root=path.resolve(import.meta.dirname,'..'),read=f=>withoutHeroRestore(f,readReviewedCurrentSource(f));
const main=read('hani-main.js'),ui=read('hani-ui-v02992.js'),html=read('index.html');
// The integrated branch base already owns approved settings, photo and launch UI.
const baseline=file=>withoutHeroRestore(file,readBranchBaseline(file));

test('canonical company names and legacy search aliases resolve to unchanged routes',()=>{
  const ctx=vm.createContext({});
  vm.runInContext(main.slice(main.indexOf('const QUICK_JUMP_ITEMS='),main.indexOf('function renderQuickJump('))+';this.matches=quickJumpMatches;',ctx);
  for(const [id,name,old] of [['agentReview','HANI 본사','하니 본사'],['board','HANI 라운지','하니 라운지'],['ilbo','HANI 일보','하니일보'],['investmentCommittee','HANI 투자 리포트','하니 투자 리포트']]){
    for(const query of [name,old]){
      const result=ctx.matches(query);assert.equal(result.length,1,query);assert.equal(result[0][0],id);assert.equal(result[0][1],name);
    }
    assert.match(html,new RegExp('data-view="'+id+'"[^>]*>[\\s\\S]*?<span class="txt">'+name+'<'));
  }
  assert.equal(ctx.matches('하니 일보')[0][0],'ilbo');
  const original=baseline('hani-ui-v02992.js');
  const voice=s=>s.slice(s.indexOf('// BEGIN CANONICAL TAB VOICE BUNDLE'),s.indexOf('// Session-memory only:'));
  const expectedVoice=voice(original);
  assert.equal(voice(ui),expectedVoice,'only approved role/owner data corrections; dialogue and remaining voice policy unchanged');
});
test('every live source nav view uses one owner; reused image paths exist',()=>{
  const a=ui.indexOf('  const mainCharacterBannerVariants='),b=ui.indexOf('  const mainCharacterInternalViewExists=',a),ctx=vm.createContext({});
  vm.runInContext(ui.slice(a,b)+';this.config=mainCharacterBannerConfig;',ctx);
  const ids=[...html.matchAll(/<button class="nav-btn[^>]*data-view="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,35);
  for(const id of ids){
    if(['work','aura'].includes(id))continue; // retired work; theme showroom owns its single campaign poster.
    const config=ctx.config(id);assert.ok(config,id);assert.ok(fs.existsSync(path.join(root,config.sceneImage)),id+' existing scene');
  }
  assert.doesNotMatch(html,/<figure class="seasonal-life-banner"|class="monthly-report-hero"|class="deploy-hero |class="card budget-hero"/);
  assert.doesNotMatch(read('hani-organization-hub.js'),/<section class="ogh-hero"/);
  assert.match(ui,/if\(!root\?\.classList\.contains\('view'\)\)return/,'nested policy does not own another page hero');
  assert.match(read('hani-ilbo.js'),/<h2>HANI 일보<\/h2>/);assert.match(read('hani-ilbo.js'),/HANI 일보 · 지난 호 보관함/);
});
test('every non-hero byte, including controls, login, storage, versions and EOL, matches the integrated branch base',()=>{
  const files=['index.html','hani-main.js','hani-ui-v02992.js','hani-context-remote-v1.js','hani-context-remote.css','hani-ui-cleanup-v02971.js','hani-office-live.js','hani-investment-committee.js','hani-ilbo.js','hani-organization-hub.js','hani-design-system.css','hani-style-07.css','hani-ai-budget.css','assets/data/office-actions-216.json','data/hani-building/art-map-v1.json'];
  for(const file of files){
    const current=read(file);if(file.endsWith('.js'))new vm.Script(current,{filename:file});
    assert.equal(current,baseline(file),file+' only exact reviewed hero/remote delta allowed; all other bytes preserved');
  }
});
