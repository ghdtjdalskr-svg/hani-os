import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {readReviewedReleaseBaseline as readBranchBaseline,readReviewedCurrentSource} from './hani-reviewed-release-baseline.mjs';
// v228 / 902b5ab and v233 / beffc38 ship the current heroes; inspect their real owners.
const root=path.resolve(import.meta.dirname,'..'),read=readReviewedCurrentSource;
const main=read('hani-main.js'),ui=read('hani-ui-v02992.js'),html=read('index.html');
// The integrated branch base already owns approved settings, photo and launch UI.
const baseline=readBranchBaseline;

test('canonical company names and legacy search aliases resolve to unchanged routes',()=>{
  const ctx=vm.createContext({}),approved=vm.createContext({}),approvedMain=baseline('hani-main.js');
  vm.runInContext(main.slice(main.indexOf('const QUICK_JUMP_ITEMS='),main.indexOf('function renderQuickJump('))+';this.matches=quickJumpMatches;',ctx);
  vm.runInContext(approvedMain.slice(approvedMain.indexOf('const QUICK_JUMP_ITEMS='),approvedMain.indexOf('function renderQuickJump('))+';this.matches=quickJumpMatches;',approved);
  for(const [id,name,old] of [['agentReview','HANI GROUP','하니 본사'],['board','HANI 라운지','하니 라운지'],['ilbo','HANI 일보','하니일보'],['investmentCommittee','HANI 투자 리포트','하니 투자 리포트']]){
    for(const query of [name,old]){
      // v283 / a28918d adds searchable routes: aliases must resolve once, not suppress other matches.
      const result=ctx.matches(query),target=result.filter(row=>row[0]===id);
      assert.deepEqual(JSON.parse(JSON.stringify(result)),JSON.parse(JSON.stringify(approved.matches(query))),query+' exact approved search results');
      assert.equal(target.length,1,query);assert.equal(target[0][1],name);
      assert.equal(new Set(result.map(row=>row[0])).size,result.length,'no duplicate search routes');
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
  // v233 / beffc38 adds milestones; v283 / a28918d adds procrastination to the approved sidebar.
  const expected=['home','milestones','intake','agentReview','monthlyReport','organization','ilbo','board','investment','investmentCommittee','investmentIntake','asset','ledger','newsroom','diet','exercise','reading','study','university','certificate','wishlist','travel','movie','game','diary','tasks','procrastination','calendar','work','drive','aiWork','dev','geminiReports','deployment','aiBudget','aura','settings'];
  assert.deepEqual(ids,expected);assert.equal(new Set(ids).size,ids.length);
  for(const id of ids){
    if(['work','aura'].includes(id))continue; // retired work; theme showroom owns its single campaign poster.
    if(id==='procrastination'){
      // v283 / a28918d ships a dedicated board/header instead of a shared character hero.
      assert.equal(ctx.config(id),null);
      const section=html.match(/<section id="procrastination"[^]*?<\/section>/)?.[0];assert.ok(section);
      assert.equal((section.match(/class="pb-header"/g)||[]).length,1);
      assert.match(section,/aria-labelledby="procrastinationTitle"/);assert.match(section,/id="procrastinationTitle"/);
      assert.doesNotMatch(section,/ds-main-character-banner/);continue;
    }
    const config=ctx.config(id);assert.ok(config,id);assert.ok(fs.existsSync(path.join(root,config.sceneImage)),id+' existing scene');
  }
  assert.doesNotMatch(html,/<figure class="seasonal-life-banner"|class="monthly-report-hero"|class="deploy-hero |class="card budget-hero"/);
  // v233 / beffc38 restores the organization overview hero; retain its single owner and asset.
  const organization=read('hani-organization-hub.js');
  assert.equal((organization.match(/<section class="ogh-hero"/g)||[]).length,1);
  assert.match(organization,/class="ogh-hero-art"[^]*src="\.\/assets\/team\/hani-team-office.webp"/);
  assert.ok(fs.existsSync(path.join(root,'assets/team/hani-team-office.webp')));
  assert.match(ui,/if\(!root\?\.classList\.contains\('view'\)\)return/,'nested policy does not own another page hero');
  assert.match(read('hani-ilbo.js'),/<h2>HANI 일보<\/h2>/);assert.match(read('hani-ilbo.js'),/HANI 일보 · 지난 호 보관함/);
});
test('every non-hero byte, including controls, login, storage, versions and EOL, matches the integrated branch base',()=>{
  // art-map-v1.json left this list with the approved office seed (#339); the office suites check it.
  const files=['index.html','hani-main.js','hani-ui-v02992.js','hani-context-remote-v1.js','hani-context-remote.css','hani-ui-cleanup-v02971.js','hani-office-live.js','hani-investment-committee.js','hani-ilbo.js','hani-organization-hub.js','hani-design-system.css','hani-style-07.css','hani-ai-budget.css','assets/data/office-actions-216.json'];
  for(const file of files){
    const current=read(file);if(file.endsWith('.js'))new vm.Script(current,{filename:file});
    assert.equal(current,baseline(file),file+' only exact reviewed hero/remote delta allowed; all other bytes preserved');
  }
});
