import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ui=fs.readFileSync(new URL('../hani-ui-v02992.js',import.meta.url),'utf8');
new vm.Script(ui);
const start=ui.indexOf('  const mainCharacterBannerVariants='),end=ui.indexOf('  const mainCharacterInternalViewExists=',start);
assert.ok(start>=0&&end>start,'canonical banner config anchors');
const ctx=vm.createContext({});
vm.runInContext(ui.slice(start,end)+';this.resolve=mainCharacterBannerConfig;this.menus=mainCharacterSidebarMenuConfig;',ctx);
const mapping={investmentCommittee:'investment-market-room-v1.webp',board:'company-board-community-v1.webp',aiWork:'ai-work-status-v1.webp',geminiReports:'dev-reports-research-v1.webp',aiBudget:'ai-budget-control-v1.webp',monthlyReport:'conference-room-reports-v1.webp'};
for(const [view,file] of Object.entries(mapping)){
  const config=ctx.resolve(view);
  assert.ok(config,view+' uses the canonical page hero');
  assert.equal(config.sidebarMenuKey,view);
  assert.equal(config.sceneImage,'./assets/banner-preview-v1/'+file);
  assert.equal(ctx.resolve(view,'unknown-tab').sceneImage,config.sceneImage,'internal tabs preserve menu image');
  assert.equal(config.scenePosition,'center center');
  assert.equal(config.scenePositionMobile,'72% center');
  assert.equal(config.sceneFit,'cover');
  assert.equal(config.sceneFitMobile,'cover');
  const asset=new URL('../assets/banner-preview-v1/'+file,import.meta.url);
  assert.ok(fs.statSync(asset).isFile(),file+' exists');
  const bytes=fs.readFileSync(asset);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
}
assert.equal(ctx.resolve('agentReview').sceneImage,'./assets/banner-preview-v1/ai-approval-boardroom-v1.webp');
assert.equal(ctx.resolve('investmentCommittee').owner,'hani');
assert.equal(ctx.resolve('investmentCommittee').role,'Chief Investment Strategist');
const renderer=ui.slice(ui.indexOf('  function mainCharacterBanner('),ui.indexOf('  function syncMainCharacterBannerAgent('));
assert.match(renderer,/<img width="2172" height="724" loading="lazy" decoding="async">/);
assert.match(renderer,/:scope > \.ds-main-character-banner/);
assert.match(renderer,/root\.prepend\(el\)/);
assert.doesNotMatch(renderer,/id=["']|\.clear\(/);
for(const view of Object.keys(mapping))assert.equal((ui.slice(start,end).match(new RegExp('"'+view+'":Object\\.freeze','g'))||[]).length,1,'single config for '+view);
console.log('PASS banners-203: six canonical mappings, WebP files, responsive config, shared renderer/image attrs, preserved boardroom');
