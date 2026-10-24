import fs from 'node:fs';
import assert from 'node:assert/strict';
const base=new URL('./base/scripts/hani-qa-1st-ui.test.mjs',import.meta.url),target=new URL('../../scripts/hani-qa-1st-ui.test.mjs',import.meta.url);
let source=fs.readFileSync(base,'utf8');
function replace(before,after){assert.equal(source.split(before).length-1,1,before.slice(0,80));source=source.replace(before,()=>after)}
replace('let browser;',`// Keep native smooth scrolling; a fixed 80ms delay can sample a previous view's scroll.
async function settleScroll(page){
  return page.evaluate(()=>new Promise((resolve,reject)=>{
    let previous=scrollY,stable=0,frames=0;
    const tick=()=>{const y=scrollY;stable=Math.abs(y-previous)<.25?stable+1:0;previous=y;
      if(stable>=8)return resolve({scrollY:y,frames});
      if(++frames>=180)return reject(Error('document scroll did not settle'));
      requestAnimationFrame(tick);
    };requestAnimationFrame(tick);
  }));
}
async function controlGeometry(page,selector){
  return page.evaluate(selector=>{
    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
    const intersects=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
    const field=document.querySelector(selector),bar=document.querySelector('header.top'),trigger=document.querySelector('.hani-remote-mobile-trigger');
    const control=rect(field),header=rect(bar),launcher=rect(trigger),painted=bar.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
    return {scrollY,focus:document.activeElement?.id,control,header,launcher,painted,hidden:bar.classList.contains('is-mobile-hidden'),headerPosition:getComputedStyle(bar).position,triggerPosition:getComputedStyle(trigger).position,overlap:painted&&intersects(control,launcher),headerOverlap:painted&&intersects(control,header),scrollPadding:getComputedStyle(document.documentElement).scrollPaddingTop,scrollMargin:getComputedStyle(field).scrollMarginTop};
  },selector);
}
let browser,lastDiagnostic;`);
replace('      const result=await page.evaluate(({view,width})=>{',`      const early=await page.evaluate(()=>({scrollY,focus:document.activeElement?.id}));
      const settled=await settleScroll(page);
      const result=await page.evaluate(({view,width})=>{`);
replace('return {view,overlap,dateWidths,money,contrast,homeOverlap,clip,viewWidth:', 'return {view,overlap,dateWidths,money,contrast,homeOverlap,clip,scrollY,focus:document.activeElement?.id,triggerRect:r,headerRect:rect(document.querySelector(\'header.top\')),viewWidth:');
replace('      assert.deepEqual(result.overlap,[],',`      lastDiagnostic={width,finish,phase:'initial',early,settled,...result};
      if(width<=768&&['investmentIntake','intake'].includes(view))console.log('DIAGNOSTICS Remote controls',JSON.stringify(lastDiagnostic));
      assert.deepEqual(result.overlap,[],`);
replace("      if(width<=768){\n        await page.locator('.hani-remote-mobile-trigger').click();",`      if(width<=768){
        if(['investmentIntake','intake'].includes(view)){
          const field=view==='investmentIntake'?page.locator('#assetCaptureAccount'):page.locator('#intake select:visible,#intake textarea:visible').first();
          const selector='#'+await field.getAttribute('id');
          for(const phase of ['anchor','scroll-up']){
            if(phase==='anchor')await field.evaluate(node=>node.scrollIntoView({behavior:'smooth',block:'start'}));
            else await page.evaluate(()=>window.scrollBy({top:-24,behavior:'smooth'}));
            await settleScroll(page);
            const geometry=await controlGeometry(page,selector);
            lastDiagnostic={width,finish,view,phase,...geometry};console.log('DIAGNOSTICS Remote controls',JSON.stringify(lastDiagnostic));
            assert.equal(geometry.overlap,false,JSON.stringify(lastDiagnostic));
            assert.equal(geometry.headerOverlap,false,JSON.stringify(lastDiagnostic));
            assert.equal(geometry.headerPosition,'sticky');assert.equal(geometry.triggerPosition,'static');
            assert.equal(geometry.header.h,48);assert.ok(geometry.launcher.h>=44,'Remote touch target');
            assert.ok(geometry.control.y>=0&&geometry.control.bottom<=844,'anchor control reachable: '+JSON.stringify(lastDiagnostic));
            if(phase==='scroll-up'){assert.equal(geometry.hidden,false,'scroll up reveals header');assert.equal(geometry.painted,true,'revealed header is painted');}
            metrics.push(lastDiagnostic);await page.screenshot({path:path.join(output,width+'-'+finish+'-'+view+'-'+phase+'.png')});
          }
        }
        await page.locator('.hani-remote-mobile-trigger').click();`);
replace("if(await last.count()){await last.scrollIntoViewIfNeeded();const box=await last.boundingBox();", "if(await last.count()){await last.scrollIntoViewIfNeeded();await settleScroll(page);const box=await last.boundingBox();");
replace('metrics.push({width,finish,...result});','metrics.push({width,finish,early,settled,...result});');
replace("JSON.stringify({status:'NOT_PASS',error:error.message.split('\\n')[0],completed:metrics}","JSON.stringify({status:'NOT_PASS',error:error.message.split('\\n')[0],lastDiagnostic,completed:metrics}");
fs.writeFileSync(target,source);
