import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const runtime=process.argv[2]||process.env.HANI_PLAYWRIGHT_MODULE||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium}=await import(pathToFileURL(runtime).href);
const browser=await chromium.launch({executablePath:process.argv[3]||process.env.HANI_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const base=process.env.HANI_PREVIEW_URL||'http://127.0.0.1:8791';
const out=path.resolve(process.env.HANI_QA_OUTPUT||'qa-evidence/organization-hub');fs.mkdirSync(out,{recursive:true});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 await page.goto(base+'/docs/organization-hub-preview.html');
 await page.locator('.ogh-person').last().waitFor();
 assert.equal(await page.locator('.ogh-node').count(),5);
 assert.equal(await page.locator('.ogh-node .ogh-leader-badge').count(),5);
 for(const [team,count] of [['strategy',4],['platform',5],['finance',3],['life',5],['business',2],['all',19]]){
   await page.locator('[data-filter-team="'+team+'"]').click();
   assert.equal(await page.locator('.ogh-person:visible').count(),count);
   assert.equal(await page.locator('#ogh-team-filter').inputValue(),team);
 }
 for(const style of ['editorial','classic','tech']){
   await page.locator('[data-typography="'+style+'"]').click();
   assert.equal(await page.locator('#haniOrganizationHub').getAttribute('data-typography'),style);
   assert.equal(await page.locator('.ogh-type-controls [aria-pressed=true]').count(),1);
 }
 assert.equal(await page.locator('[role="tab"]').count(),5);
 for(const id of ['strategy','platform','finance','life','business']){
   await page.locator('[data-team-tab="'+id+'"]').click();
   assert.equal(await page.locator('.ogh-team-panel:visible').count(),1);
   assert.equal(await page.locator('#ogh-panel-'+id).isVisible(),true);
 }
 assert.match(await page.locator('#ogh-panel-business').innerText(),/Claude/);
 await page.locator('[data-team-tab="strategy"]').click();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#ogh-panel-platform').isVisible(),true);
 await page.keyboard.press('Home');assert.equal(await page.locator('#ogh-panel-strategy').isVisible(),true);
 assert.equal(await page.locator('#ogh-teams img[src*="banner-preview"]').count(),0);
 assert.equal(await page.locator('.ogh-person:visible').count(),19);
 assert.equal(await page.locator('.ogh-person-image>img').count(),19);
 assert.match(await page.locator('[data-card-person="seoyun"] img').getAttribute('src'),/hani-profile-seoyun\.webp$/);
 assert.equal(await page.locator('.ogh-person-image>.ogh-placeholder').count(),0);
 for(const id of ['mir','seoyun','dohyun','serin','yuri','arin','gaeun','taeo']){
   const badge=page.locator('.ogh-node-people [data-person="'+id+'"] .ogh-nameplate');
   assert.ok((await badge.locator('strong').innerText()).length>0);
   assert.ok((await badge.locator('small').innerText()).length>0);
 }
 const nodes=await page.locator('.ogh-node').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().top)));
 assert.equal(new Set(nodes).size,1,'Five teams share equal row');
 await page.locator('[data-group="M9"]').click();assert.equal(await page.locator('.ogh-person:visible').count(),9);
 await page.locator('[data-group="AI STAFF"]').click();assert.equal(await page.locator('.ogh-person:visible').count(),10);
 await page.evaluate(async()=>{for(const img of document.querySelectorAll('.ogh-person img')){img.loading='eager';await img.decode();}});
 await page.locator('#ogh-people').screenshot({path:path.join(out,'staff-nameplates.webp')});
 await page.locator('#ogh-team-filter').selectOption('strategy');assert.equal(await page.locator('.ogh-person:visible').count(),2);
 assert.equal(await page.locator('[data-filter-team="strategy"]').getAttribute('aria-pressed'),'true');
 await page.locator('#ogh-search').fill('<img src=x onerror=alert(1)>');assert.equal(await page.locator('.ogh-person:visible').count(),0);
 await page.locator('[data-reset]').click();assert.equal(await page.locator('.ogh-person:visible').count(),19);
 await page.locator('#ogh-search').fill('Codex');assert.equal(await page.locator('.ogh-person:visible').count(),1);
 await page.locator('#ogh-search').fill('');
 const opener=page.locator('[data-card-person="hani"]');await opener.click();
 await page.locator('dialog[open]').waitFor();assert.match(await page.locator('#ogh-detail-title').innerText(),/하니/);
 await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 for(const [id,count] of [['strategy',4],['platform',5],['finance',3],['life',5],['business',2]]){
   await page.locator('.ogh-node-title[data-team="'+id+'"]').click();assert.equal(await page.locator('.ogh-detail-members .ogh-avatar').count(),count);
   await page.locator('.ogh-close').click();
 }
 await page.locator('[data-card-person="mir"]').click();assert.match(await page.locator('.ogh-detail').innerText(),/제안안/);await page.keyboard.press('Escape');
 await page.evaluate(async()=>{for(const img of document.querySelectorAll('.ogh img')){img.loading='eager';await img.decode();}});
 assert.deepEqual(errors,[]);
 assert.equal(await page.locator('#ogh-teams .ogh-team-banner').count(),5);
 assert.match(await page.locator('#ogh-panel-strategy').innerText(),/뮤즈 · 가은/);
 assert.match(await page.locator('#ogh-panel-strategy').innerText(),/회장 비서/);
 assert.equal(await page.locator('.ogh-chair img').count(),1);
 await page.locator('#ogh-teams').screenshot({path:path.join(out,'team-banner-desktop.webp')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('.ogh-mast').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'desktop.webp'),fullPage:true});
 await page.screenshot({path:path.join(out,'desktop-first-screen.webp')});
 results.push('Desktop 1440: five equal teams, 19 portraits including 2 joined staff, name/job plates, all filters, empty/reset, 5 team dialogs, person dialog, Escape/focus return, no errors/overflow PASS');
 await page.setViewportSize({width:390,height:844});
 await page.locator('#ogh-teams').screenshot({path:path.join(out,'team-banner-mobile.webp')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('[data-card-person="hina"]').click();assert.equal(await page.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
 await page.screenshot({path:path.join(out,'mobile-dialog.webp')});await page.keyboard.press('Escape');
 await page.locator('.ogh-mast').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,'mobile.webp'),fullPage:true});
 await page.screenshot({path:path.join(out,'mobile-first-screen.webp')});
 await page.setViewportSize({width:320,height:740});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 results.push('Mobile 390 / narrow 320: no horizontal overflow; Hina dialog layout PASS');
 // Full app route is inspected without signing in or bypassing its authentication gate.
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(base+'/index.html#organization');await page.locator('#haniOrganizationHub .ogh-person').last().waitFor({state:'attached'});
 assert.equal(await page.locator('#organization.active').count(),1);
 assert.equal(await page.locator('.group[data-color="office"] [data-view="organization"]').count(),1);
 assert.equal(await page.locator('.group[data-color="team"]').count(),0);
 assert.deepEqual(await page.locator('.organization-tabs [role="tab"]').allTextContents(),['개요','조직도','M9 + MIR','AI 팀']);
 assert.equal((await page.locator('.side [data-view="organization"] .txt').textContent()).trim(),'회사 소개');
 const protectedBefore=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
 // Invoke canonical navigation via existing buttons in isolated browser; no auth/session mutation.
 await page.evaluate(()=>showView('aiTeam'));
 assert.equal(await page.locator('#organization.active').count(),1);
 assert.equal(await page.locator('[data-organization-tab="aiTeam"]').getAttribute('aria-selected'),'true');
 assert.equal(await page.locator('.ogh-person:not([hidden])').count(),10);
 await page.locator('.side [data-view="organization"]').evaluate(e=>e.click());
 assert.equal(await page.locator('#organization.active').count(),1);
 assert.equal(await page.locator('#haniOrganizationHub .ogh-person').count(),19);
 for(const [route,tab] of [['characterArchive','archive'],['organization/people','people'],['organization','overview']]){
   await page.evaluate(route=>showView(route),route);
   assert.equal(await page.locator('[data-organization-tab="'+tab+'"]').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#characterArchive').evaluate(e=>e.hidden),tab!=='archive');
   if(tab!=='archive')assert.equal(await page.locator('#ogh-chart').evaluate(e=>e.hidden),tab!=='people','조직도 tab owns chart');
 }
 await page.evaluate(()=>showView('policy'));
 assert.equal(await page.locator('#settings.active').count(),1);
 assert.equal(await page.locator('#policy').evaluate(e=>e.parentElement.id),'settings');
 assert.equal(await page.locator('#policy').evaluate(e=>e.hidden),false);
 assert.equal(await page.locator('#settingsData').evaluate(e=>e.hidden),true);
 assert.equal(await page.locator('.side [data-view="policy"]').count(),0);
 await page.evaluate(()=>showView('organization/people/hani'));
 assert.equal(await page.locator('.ogh-dialog').evaluate(e=>e.open),false,'deep links do not put a dialog over login');
 assert.equal(await page.locator('#app').evaluate(e=>e.inert),true,'navigation never unlocks auth gate');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),protectedBefore);
 results.push('Integrated organization aliases/tabs/person card PASS; auth gate remains inert and protected key unchanged. Signed-in visual QA NOT tested.');
 const module=fs.readFileSync('hani-organization-hub.js','utf8');assert.doesNotMatch(module,/localStorage|sessionStorage|supabase|XMLHttpRequest/);
 // The current overview already reads the public history catalog; permit only that existing GET.
 assert.equal((module.match(/\bfetch\s*\(/g)||[]).length,1);
 assert.match(module,/fetch\('\.\/assets\/data\/hani-history-releases-v1\.json',\{cache:'no-store'\}\)/);
 results.push('Hub has no storage/auth dependencies; only the existing read-only history catalog fetch PASS');
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({base:'c43ba2f1ce24c05e2cb16338e920fcf73731de0a',results},null,2));
 console.log(results.join('\n'));
} finally {await browser.close();}
