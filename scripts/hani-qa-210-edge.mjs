import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {localBrowser,mountFixtures,textContrastAudit} from './hani-contrast-audit.mjs';

const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/qa-210');fs.mkdirSync(out,{recursive:true});
const evidence={environment:'isolated Edge; external requests blocked; in-memory synthetic records',status:'RUNNING',runs:[],errors:[]};
let env;
try{
  env=await localBrowser(process.argv[2],process.argv[3]);env.page.on('pageerror',e=>evidence.errors.push(e.message));
  await mountFixtures(env.page,env.origin);
  const before=await env.page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
  const findings=async prefix=>{const r=await env.page.evaluate(textContrastAudit);return r.failures.filter(x=>x.selector.startsWith(prefix))};
  for(const finish of ['porcelain-cream','midnight-black','titanium-graphite','sakura-pink','alpine-blue'])for(const season of ['spring','summer','autumn','winter']){
    const row={finish,season};
    await env.page.evaluate(({finish,season})=>{document.documentElement.dataset.finish=finish;document.documentElement.dataset.season=season;document.body.dataset.finishActive='true';showView('reading')},{finish,season});
    assert.equal(await env.page.locator('#readBooks .archive-card').count(),1);assert.deepEqual(await findings('#readBooks'),[]);row.reading='PASS';
    await env.page.evaluate(()=>{showView('settings/policy');renderAgentPolicyRegistry()});
    assert.deepEqual(await findings('#agentPolicyRegistry'),[]);row.policy='PASS';
    await env.page.evaluate(()=>showView('investment'));
    await env.page.locator('.investment-tabs-main [data-panel="investOverview"]').click();
    await env.page.locator('.investment-overview-tabs [data-panel="investOverviewStocks"]').click();
    assert.ok(await env.page.locator('#portfolioLivePreview .portfolio-summary').isVisible());assert.deepEqual(await findings('#portfolioLivePreview'),[]);row.investment='PASS';
    await env.page.evaluate(()=>{showView('board');HaniBoard.openPost('qa-post')});
    const body=env.page.locator('[data-board="article"] > .board-body');await body.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
    const box=await body.boundingBox();assert.ok(await body.evaluate((n,[x,y])=>n.contains(document.elementFromPoint(x,y)),[box.x+box.width/2,box.y+box.height/2]),'press lands on the article body, not a sticky control');await env.page.mouse.move(box.x+box.width/2,box.y+box.height/2);await env.page.mouse.down();
    const scale=await body.evaluate(n=>{const rows=[];for(let el=n;el;el=el.parentElement)rows.push(getComputedStyle(el).scale);return rows});
    assert.ok(scale.every(v=>v==='none'||v==='1'),'content and ancestor cards stay still on press');await env.page.mouse.up();
    const button=env.page.locator('.board-title[data-board-open="qa-post"]');await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();await env.page.mouse.move(b.x+b.width/2,b.y+b.height/2);await env.page.mouse.down();
    assert.equal(await button.evaluate(n=>getComputedStyle(n).scale),'0.98','real button retains press feedback');await env.page.mouse.up();
    assert.deepEqual((await env.page.evaluate(textContrastAudit)).failures.filter(x=>x.selector.includes('[data-board]')||x.selector.includes('.board-body')),[]);row.press='PASS';
    const counts=await env.page.evaluate(()=>{const p=state.boardPosts.find(p=>p.id==='qa-post');return {expected:HaniBoard.displayViews(p),raw:p.views,list:document.querySelector('.board-cell-views')?.textContent,detail:document.querySelector('.board-detail-meta')?.textContent}});
    assert.ok(counts.list.includes(String(counts.expected)));assert.ok(counts.detail.includes('조회 '+counts.expected));assert.equal(counts.raw,3);row.views='PASS';
    await env.page.evaluate(()=>{showView('home');renderHaniCareHome();HANI_CONTEXT_REMOTE_V1.update()});
    assert.equal(await env.page.locator('[data-care-quiz]').count(),0);assert.ok(await env.page.locator('.hani-remote-today.is-today').isVisible());assert.equal(await env.page.locator('[data-remote-today-count]').textContent(),'1');
    await env.page.locator('[data-remote-quiz="qa-quiz"]').click();assert.equal(await env.page.evaluate(()=>document.body.dataset.view),'study');assert.ok(await env.page.locator('#studyQuizDetail').isVisible());row.quiz='PASS';
    await env.page.evaluate(()=>renderNavNewBadges(Date.parse('2026-10-12T00:00:00Z')));
    assert.equal(await env.page.locator('#sidebar .group-head .nav-new-pill').count(),0);assert.ok(await env.page.locator('#sidebar .nav-btn .nav-new-pill:not([hidden])').count());
    assert.deepEqual((await env.page.evaluate(textContrastAudit)).failures.filter(x=>x.selector.includes('.nav-new-pill')),[]);row.badges='PASS';
    row.drive=await env.page.evaluate(()=>({api:Object.keys(window.HANI_DRIVE_VAULT),fileInputs:document.querySelectorAll('#board input[type=file]').length}));assert.deepEqual(row.drive,{api:['schedule'],fileInputs:0});row.drive.status='NOT FEASIBLE: backup-only vault, attachment UI/model absent';
    row.note=await env.page.evaluate(()=>HaniBoard.stripLeadingVocative('@회장님 회장님, 확인했어요.',HaniOrganizationRoster.chairman.id,true,true));assert.equal(row.note,'확인했어요.');
    evidence.runs.push(row);console.log(`PASS targeted ${finish}/${season}`);
  }
  for(const width of [1440,390]){
    await env.page.setViewportSize({width,height:900});await env.page.evaluate(()=>{showView('board');HaniBoard.openPost('qa-post')});
    assert.equal(await env.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
    await env.page.screenshot({path:path.join(out,`board-${width}.png`),fullPage:true});
    if(width===390)await env.page.locator('.hani-remote-mobile-trigger').click();
    assert.ok(await env.page.locator('.hani-remote-today').isVisible());await env.page.locator('[data-remote-quiz="qa-quiz"]').click();assert.equal(await env.page.evaluate(()=>document.body.dataset.view),'study');
    await env.page.screenshot({path:path.join(out,`quiz-${width}.png`),fullPage:true});
  }
  assert.equal(await env.page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),before);assert.deepEqual(evidence.errors,[]);evidence.status='PASS';
}catch(error){evidence.status=error.message.includes('EPERM')?'BLOCKED':'FAIL';evidence.reason=error.message.split('\n')[0];evidence.errors.push(evidence.reason);process.exitCode=1;console.error(evidence.status+': '+evidence.reason);}
finally{if(env)await env.close();fs.writeFileSync(path.join(out,'targeted-edge.json'),JSON.stringify(evidence,null,2));}
