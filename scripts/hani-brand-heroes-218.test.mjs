import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const main=read('hani-main.js'),ui=read('hani-ui-v02992.js'),html=read('index.html');
// Runtime/cache versions were advanced by the approved 218 release, after fix-218.
const released=f=>execFileSync(process.env.HANI_GIT||'git',['show','974fa64:'+f],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const baseline=f=>process.env.HANI_FIX218_BASELINE?fs.readFileSync(path.join(process.env.HANI_FIX218_BASELINE,path.basename(f)),'utf8'):execFileSync(process.env.HANI_GIT||'git',['show','42aa394:'+f],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
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
  let expectedVoice=voice(original);
  for(const [view,owner] of Object.entries({exercise:'naeun',tasks:'yuna',calendar:'yuna',aiWork:'dohyun',work:'sua'}))expectedVoice=expectedVoice.replace(new RegExp('(\\n  '+view+': entry\\(")\\w+'),(_,prefix)=>prefix+owner);
  expectedVoice=expectedVoice.replace('건강·체중·식사 흐름. 의료 판단은 근거와 전문 자문을 우선한다.','건강·운동·체중·식사 흐름. 의료 판단은 근거와 전문 자문을 우선한다.')
    .replace('수연 · Activity Coach','수연 · Travel & Sports')
    .replace('운동·스포츠·여행의 페이스와 실제 실행 가능성.','스포츠·여행의 페이스와 실제 실행 가능성. 건강·운동 루틴은 나은에게 연결한다.')
    .replace('  seoyun:Object.freeze({','  dohyun:Object.freeze({identity:"도연 · Codex 구현/테스트",image:"./assets/profiles/hani-profile-dohyun.webp"}),\r\n  seoyun:Object.freeze({');
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
test('raw preservation of frequency table, storage writes, versions, route/data IDs and unchanged-line EOL',()=>{
  assert.equal(read('assets/data/office-actions-216.json'),baseline('assets/data/office-actions-216.json'),'all approved caps, cooldowns, windows, disabled actions unchanged');
  assert.equal(read('data/hani-building/art-map-v1.json'),baseline('data/hani-building/art-map-v1.json').replaceAll('하니 본사','HANI 본사'),'plate tooltip brand only; spatial metadata unchanged');
  const files=['index.html','hani-main.js','hani-ui-v02992.js','hani-ui-cleanup-v02971.js','hani-office-live.js','hani-investment-committee.js','hani-ilbo.js','hani-organization-hub.js','hani-design-system.css','hani-style-07.css','hani-ai-budget.css'];
  // Report Markdown may mention protected APIs/versions as prose. Compare the
  // actual runtime owners separately from the authorized regenerated catalog.
  const collect=(s,re)=>[...s.replace(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\([^\r\n]+\);/,'<report catalog>').matchAll(re)].map(m=>m[0]);
  for(const f of files){
    const old=baseline(f),now=read(f);new vm.Script(f.endsWith('.js')?now:'');
    assert.deepEqual(collect(now,/(?:v=|v)2\.9\.\d+/g),collect(released(f),/(?:v=|v)2\.9\.\d+/g),f+' approved release versions');
    for(const re of [/\b(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g,/\bhani_os_life_v23\b/g,/2\.9\.15-safe-baseline-bootstrap/g])assert.deepEqual(collect(now,re),collect(old,re),f+' protected tokens');
    if(f==='index.html'){
      for(const re of [/\bdata-(?:view|go)="[^"]+"/g,/\bid="[^"]+"/g]){
        // Three seasonal caption ids were folded into the existing canonical home scene.
        // fix-218 simplify removes only the inert Gemini staff explainer ID.
        const omit=x=>!/^id="(?:seasonalLife(?:Artwork|Caption|Label|Cast)|geminiStaffProfile)"$/.test(x);
        assert.deepEqual(collect(now,re).filter(omit).sort(),collect(old,re).filter(omit).sort(),f+' route / control ids');
      }
    }
    const lines=new Map(),ambiguous=new Set();for(const line of old.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(lines.has(key)&&lines.get(key)!==line)ambiguous.add(key);lines.set(key,line);}
    for(const line of now.match(/[^\n]*(?:\n|$)/g).filter(Boolean)){const key=line.replace(/\r?\n$/,'');if(lines.has(key)&&!ambiguous.has(key))assert.equal(line,lines.get(key),f+' retained EOL '+key.slice(0,60));}
  }
  // The approved report bundle refresh synchronizes Markdown; preserve historical
  // identities and verify canonical bodies instead of requiring a stale catalog.
  const catalog=s=>JSON.parse(s.match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[1]);
  const currentCatalog=catalog(main);
  for(const old of catalog(baseline('hani-main.js')).reports){
    const current=currentCatalog.reports.find(r=>r.id===old.id);assert.ok(current);
    for(const field of ['id','file','date','review_status'])assert.equal(current[field],old[field]);
    assert.equal(current.body,read('docs/gemini-reports/'+current.file).replace(/\r\n/g,'\n'));
  }
  const protectedFunction=(source,name)=>{
    const start=source.search(new RegExp('^(?:async )?function '+name+'\\(','m'));assert.ok(start>=0,name);
    // Parse only the function body; following constants are separate owners.
    let body='';
    for(const line of source.slice(start).match(/[^\n]*(?:\n|$)/g).filter(Boolean)){
      body+=line;try{new vm.Script('('+body+')');return body}catch(e){if(!(e instanceof SyntaxError))throw e}
    }
    assert.fail(name+' function boundary');
  };
  const oldMain=baseline('hani-main.js');
  for(const name of ['save','cloudSyncPolicy','cloudChangeSyncPolicy','deployLoadSession','deploySaveSession','deployConfirmApprovedCandidate','deployCenterInit'])assert.equal(protectedFunction(main,name),protectedFunction(oldMain,name),name+' original safety / approval path');
});
