import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {remote217Oracle} from './hani-remote-217-oracle.mjs';
const root=path.resolve(import.meta.dirname,'..');
const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
export function sourcePixels(actual,original,{rect:r,boxes}){
 let samples=0,maxDelta=0,minLuminanceRatio=Infinity,totalDelta=0,worst=null;
 const bands={top:0,left:0,right:0};
 // Keep the fixed upper-55% contract (one percent inside its edge). Never
 // shrink this band to follow a regressed scrim or mask differing pixels.
 const band={left:12,top:12,right:Math.floor(r.width)-12,bottom:Math.floor(r.height*.54)};
 for(let y=band.top;y<band.bottom;y+=2)for(let x=band.left;x<band.right;x+=2){
  const sx=Math.floor(r.left+x),sy=Math.floor(r.top+y);if(boxes.some(b=>sx>=b.left&&sx<=b.right&&sy>=b.top&&sy<=b.bottom))continue;
  assert.ok(sx>=0&&sy>=0&&sx<actual.info.width&&sy<actual.info.height,'sample inside viewport');
  const i=(sy*actual.info.width+sx)*actual.info.channels,j=(sy*original.info.width+sx)*original.info.channels;
  const a=[...actual.data.subarray(i,i+3)],b=[...original.data.subarray(j,j+3)];
  const delta=Math.max(...a.map((v,k)=>Math.abs(v-b[k])));if(delta>maxDelta){maxDelta=delta;worst={x,y,a,b}}totalDelta+=delta;samples++;
  minLuminanceRatio=Math.min(minLuminanceRatio,(lum(a)+.05)/(lum(b)+.05));
  if(y<r.height*.2)bands.top++;if(x<r.width*.2)bands.left++;if(x>r.width*.8)bands.right++;
 }
 return {samples,bands,maxDelta,meanDelta:totalDelta/samples,minLuminanceRatio,worst,band,excludedRects:boxes};
}

export async function verifyRemoteCardNode(){
 await import('./hani-context-remote.test.mjs');
 const source=fs.readFileSync(path.join(root,'hani-context-remote-v1.js'),'utf8');new vm.Script(source);
 const begin=source.indexOf('  const sharedBanners='),end=source.indexOf('  const updateToday=',begin);assert.ok(begin>=0&&end>begin);
 const nodes=new Map(),writes=[];let view='reading';
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{style:{},getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v}});return nodes.get(selector)};
 const ctx=vm.createContext({rail:{},$:node,viewId:()=>view,season:()=> 'autumn',crypto:{getRandomValues(a){a[0]=4;return a}},greetings:{autumn:['staff','fallback quote']},window:{HANI_MAIN_CHARACTER_BANNER:{get:id=>({sceneImage:'./assets/heroes/'+id+'.webp',speaker:'하루',quote:'test quote'})}},localStorage:{setItem(...v){writes.push(v)},removeItem(...v){writes.push(v)},clear(){writes.push('clear')}}});
 vm.runInContext(source.slice(begin,end)+';globalThis.render=updateBanner;',ctx);
 for(const [id,focal] of [['reading','50% 30%'],['investment','50% 30%'],['exercise','50% 30%'],['geminiReports','50% 30%'],['home','50% 30%']]){
  view=id;ctx.render({primary:'기존 작업',recent:'최근 기록'},id);
  assert.equal(node('.hani-remote-media-image').style.objectPosition,focal);
  assert.equal(node('.hani-remote-media-image').src,remote217Oracle().select(id,'autumn'));
  assert.equal(node('[data-remote-media-title]').textContent,id);
  assert.equal(node('[data-remote-media-staff]').textContent,'담당 직원 · 하루');
  assert.equal(node('[data-remote-media-line]').textContent,'test quote');
  assert.equal(node('.hani-remote-media [data-remote-action="primary"]')['aria-label'],'기존 작업');
 }
 const slots=[...nodes.values()];for(let i=0;i<25;i++)ctx.render({},'repeat');assert.deepEqual([...nodes.values()],slots);assert.deepEqual(writes,[]);
 // A title may paint above its positioned parent; excluding only the parent
 // misclassifies its opaque backing as darkened artwork. Use the actual sampler.
 const info={width:240,height:460,channels:3},original={info,data:Buffer.alloc(info.width*info.height*3,180)},actual={info,data:Buffer.from(original.data)};
 const rect={left:10,top:10,width:211,height:408},parent={left:22,top:240,right:208,bottom:400},title={left:110,top:190,right:160,bottom:215};
 for(let y=title.top;y<=title.bottom;y++)for(let x=title.left;x<=title.right;x++)actual.data.fill(109,(y*info.width+x)*3,(y*info.width+x)*3+3);
 assert.equal(sourcePixels(actual,original,{rect,boxes:[parent]}).maxDelta,71,'parent-only mask reproduces an overlay false failure');
 const clean=sourcePixels(actual,original,{rect,boxes:[parent,title]});assert.equal(clean.maxDelta,0);assert.equal(clean.minLuminanceRatio,1);assert.ok(Object.values(clean.bands).every(n=>n>0));
 const shade=(x,y)=>actual.data.fill(109,((rect.top+y)*info.width+rect.left+x)*3,((rect.top+y)*info.width+rect.left+x)*3+3);
 for(const [x,y] of [[12,12],[12,190],[198,190],[120,218]]){shade(x,y);assert.equal(sourcePixels(actual,original,{rect,boxes:[parent,title]}).maxDelta,71,'unmasked upper/edge/near-scrim darkening still fails');actual.data.set([180,180,180],((rect.top+y)*info.width+rect.left+x)*3)}
 // The new browser comparison hides text in both paints and samples the entire
 // fixed upper band, including positions formerly occupied by overlay boxes.
 actual.data.set(original.data);
 const unmasked={rect,boxes:[]};assert.equal(sourcePixels(actual,original,unmasked).maxDelta,0);
 for(const [x,y]of [[12,12],[120,190],[198,190],[120,218]]){shade(x,y);assert.equal(sourcePixels(actual,original,unmasked).maxDelta,71,'full upper band rejects darkening without overlay exclusions');actual.data.set([180,180,180],((rect.top+y)*info.width+rect.left+x)*3)}
 console.log('PASS Remote 217 portrait selection across views, source/labels, persistent slots x25, write0; sampler overlay overflow + strict upper/edge/near-scrim darkening regression; NOT RUN: browser AA/cover/overflow/controls');
}
