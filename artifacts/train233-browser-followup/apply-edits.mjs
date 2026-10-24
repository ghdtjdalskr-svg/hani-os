import fs from 'node:fs';
import assert from 'node:assert/strict';
const edits=[];
function edit(file,changes){
  let text=fs.readFileSync(file,'utf8');
  for(const [before,after] of changes){
    assert.equal(text.split(before).length-1,1,`${file}: unique edit anchor ${before.slice(0,90)}`);
    text=text.replace(before,()=>after);
  }
  fs.writeFileSync(file,text);edits.push(file);
}
edit('hani-context-remote.css',[
 ['#app header.top{position:relative;top:auto;flex-wrap:wrap}', '#app .main>header.top.ui26-top:has(.hani-context-remote){position:relative!important;top:auto!important;height:auto!important;flex-wrap:wrap!important;transform:none!important;opacity:1;visibility:visible;pointer-events:auto}'],
 ['#app header.top .top-actions{flex-wrap:wrap}', '#app header.top.ui26-top .top-actions{flex-wrap:wrap!important;max-width:100%}'],
 ['width:100%;max-height:70dvh;min-height:0;border-radius:14px', 'width:100%;max-height:none;min-height:0;overflow:visible;border-radius:14px']
]);
edit('hani-design-system.css',[
 ['#app .date-flex-control{min-width:min(100%,185px);grid-template-columns:minmax(140px,1fr) 38px}', '#app .date-flex-control{min-width:min(100%,186px);grid-template-columns:minmax(140px,1fr) 40px}'],
 ['#app .task-input{grid-template-columns:minmax(0,1fr) minmax(185px,auto) auto}', '#app .task-input{grid-template-columns:minmax(0,1fr) minmax(186px,auto) auto}'],
 ['grid-template-columns:repeat(auto-fit,minmax(min(100%,185px),1fr))', 'grid-template-columns:repeat(auto-fit,minmax(min(100%,186px),1fr))']
]);
// The existing mobile summary cards clip their nowrap values in two narrow columns.
// Keep each complete amount/status label visible; no number or data-path change.
edit('hani-portfolio-preview.css',[
 [' .portfolio-summary{grid-template-columns:1fr 1fr;gap:10px}', ' .portfolio-summary{grid-template-columns:minmax(0,1fr);gap:10px}']
]);
edit('scripts/hani-banners-203-ui.test.mjs',[
 ["naturalRatio:img.naturalWidth/img.naturalHeight", "naturalRatio:img.naturalWidth/img.naturalHeight,imageRight:i.right,sceneRight:r.right"],
 ["assert.ok(Math.abs(art.imageWidth-art.width)<=1&&Math.abs(art.imageHeight-art.height)<=1,scope+' scene fills persistent slot');", "const expectedWidth=width<=700?art.width:Math.min(art.width,art.height*art.naturalRatio);\n      assert.ok(Math.abs(art.imageWidth-expectedWidth)<=1&&Math.abs(art.imageHeight-art.height)<=1,scope+' mobile cover / approved desktop uncropped scene');\n      assert.ok(Math.abs(art.imageRight-art.sceneRight)<=1,scope+' scene stays right aligned');"]
]);
edit('scripts/hani-brand-heroes-218.browser.mjs',[
 ["else assert.equal(row.visible,1,`${width}/${view.id}: ${JSON.stringify(row.heroes)}`);", "else {\n          assert.equal(row.visible,view.id==='organization'?2:1,`${width}/${view.id}: ${JSON.stringify(row.heroes)}`);\n          if(view.id==='organization'){\n            assert.equal(await page.locator('#organization > .ds-main-character-banner:visible').count(),1);\n            assert.equal(await page.locator('.ogh-overview > .ogh-hero:visible').count(),1,'approved HANI-77 overview hero');\n            assert.equal(await page.locator('.ogh-overview > .ogh-hero img').getAttribute('src'),'./assets/team/hani-org-demo-day-v1.webp');\n          }\n        }"],
 ["assert.equal(count,1,`${width}/${id} tab ${n}`);", "const overview=id==='organization'&&await buttons.nth(n).getAttribute('data-organization-tab')==='overview';assert.equal(count,overview?2:1,`${width}/${id} tab ${n}`);if(id==='organization')assert.equal(await page.locator('.ogh-overview > .ogh-hero:visible').count(),overview?1:0,'Demo Day is overview-only');"]
]);
edit('scripts/hani-hero-illustrations-218.browser.mjs',[
 ['assert.equal(views.length,35);', "assert.equal(views.length,36,'Milestones v1 adds one sidebar view');\n  assert.equal(views.filter(view=>view.id==='milestones').length,1);\n  assert.equal(new Set(views.map(view=>view.id)).size,36,'no duplicate nav view');"],
 ["assert.equal(row.heroes.length,1,view.id+' one canonical hero');", "assert.equal(row.heroes.length,view.id==='organization'?2:1,view.id+' canonical banner and approved overview hero');\n      if(view.id==='organization'){\n        assert.equal(await page.locator('#organization > .ds-main-character-banner:visible').count(),1);\n        assert.equal(await page.locator('.ogh-overview > .ogh-hero:visible').count(),1);\n        assert.ok(row.heroes[1].images.some(i=>i.src==='./assets/team/hani-org-demo-day-v1.webp'&&i.decoded),'restored Demo Day image decodes');\n      }"]
]);
edit('scripts/hani-navlogin-ui.test.mjs',[
 ["assert.equal(await page.locator('.ogh-cta').count(),0,'duplicate overview hero removed');", "assert.equal(await page.locator('.ogh-overview > .ogh-hero .ogh-cta:visible').count(),1,'approved HANI-77 overview CTA restored');"]
]);
edit('scripts/hani-market-browser-smoke.cjs',[
 ["await page.waitForFunction(()=>document.querySelector('#assetMarket .market-toolbar .hani-remote-mobile-trigger'));", "await page.waitForFunction(()=>document.querySelector('header.top .top-actions .hani-remote-mobile-trigger'));\n    assert.equal(await page.locator('.hani-remote-mobile-trigger').count(),1,'one persistent Remote trigger in the approved mobile header slot');"]
]);
edit('scripts/hani-settings-225.test.mjs',[
 ["if(before&&settingsDelta.files[relative])body=Buffer.from(withoutSettings225(relative,body.toString('utf8')));", "if(before&&settingsDelta.files[relative])body=Buffer.from(withoutSettings225(relative,withoutHeroRestore(relative,readReviewedCurrentSource(relative))));"]
]);
fs.writeFileSync(new URL('edited-files.json',import.meta.url),JSON.stringify(edits,null,2));
console.log('Edited '+edits.length+' files without EOL conversion');
