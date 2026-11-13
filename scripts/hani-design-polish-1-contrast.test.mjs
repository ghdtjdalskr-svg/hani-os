import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleBackgroundPixels,resolveScreenshotContrast} from './hani-design-polish-1-contrast.mjs';

const input=(colors,color=[0,0,0,1],extra={})=>({pixels:colors.flatMap(c=>[...c,255]),width:colors.length,height:1,clip:{x:0,y:0,width:colors.length,height:1},textRects:[],color,...extra});

test('gradient/image background takes the least contrast pixel, for either text polarity',async()=>{
 const light=await sampleBackgroundPixels(input([[255,255,255],[90,90,90],[200,200,200]]));
 assert.equal(light.samples,3);assert.deepEqual(light.worst.background,[90,90,90,1]);assert.ok(light.ratio<4.5);
 const dark=await sampleBackgroundPixels(input([[0,0,0],[180,180,180],[30,30,30]],[255,255,255,1]));
 assert.deepEqual(dark.worst.background,[180,180,180,1]);assert.ok(dark.ratio<4.5);
 // A 4.5 boundary failure cannot become PASS by rounding, averaging or selecting
 // the most common/best background color.
 const fail=await sampleBackgroundPixels(input([[118,118,118],[119,119,119]],[255,255,255,1]));
 const pass=await sampleBackgroundPixels(input([[118,118,118]],[255,255,255,1]));
 assert.ok(fail.ratio>4.4&&fail.ratio<4.5);assert.ok(pass.ratio>=4.5);
});

test('text and its antialias margin are excluded with CSS/device scaling and clip offset',async()=>{
 const colors=Array.from({length:20},(_,i)=>i<10?[0,0,0]:[255,255,255]);
 const result=await sampleBackgroundPixels(input(colors,[0,0,0,1],{clip:{x:20,y:30,width:10,height:1},textRects:[{left:20,right:23,top:30,bottom:31}]}));
 assert.equal(result.samples,10);assert.equal(result.ratio,21);assert.ok(result.worst.x>=25);
});

test('foreground alpha is composited per sampled pixel and unresolved samples fail closed',async()=>{
 const alpha=await sampleBackgroundPixels(input([[255,255,255]],[0,0,0,.5]));
 assert.deepEqual(alpha.worst.foreground,[127.5,127.5,127.5]);assert.ok(alpha.ratio<4.5);
 const noMargin=await sampleBackgroundPixels(input([[255,255,255]],[0,0,0,1],{textRects:[{left:0,right:1,top:0,bottom:1}]}));
 assert.equal(noMargin.unresolved,'no text-free background pixels');assert.equal(noMargin.ratio,undefined);
 const transparent=await sampleBackgroundPixels(input([[255,255,255]],[0,0,0,1],{pixels:[255,255,255,0]}));
 assert.equal(transparent.unresolved,'non-opaque screenshot pixel');
 assert.ok((await sampleBackgroundPixels(input([],undefined))).unresolved);
});

test('clip capture preserves unresolved failures and attaches pixel evidence, without changing solid checks',async()=>{
 const geometry={clip:{x:10,y:20,width:40,height:30},textRects:[],unsupportedEffects:[]},calls=[];
 const page={locator:selector=>({scrollIntoViewIfNeeded:async()=>calls.push({selector}),evaluate:async()=>geometry}),
  screenshot:async options=>{calls.push(options);return Buffer.from('clipped png')},
  evaluate:async(fn,args)=>{assert.equal(fn,sampleBackgroundPixels);assert.equal(args.png,Buffer.from('clipped png').toString('base64'));assert.deepEqual(args.clip,geometry.clip);return {ratio:4.4,samples:40,worst:{background:[100,100,100,1]},unresolved:null}}};
 const solid={selector:'.solid',ratio:7,unresolved:null},gradient={selector:'.intro',rgba:[255,255,255,1],unresolved:'gradient/image background'};
 await resolveScreenshotContrast(page,{id:'procrastination',contrast:[solid,gradient]},{out:'evidence',prefix:'dark-winter'});
 assert.equal(gradient.ratio,4.4);assert.equal(gradient.screenshot,'dark-winter-contrast-1.png');assert.equal(solid.ratio,7);
 assert.deepEqual(calls[1],{path:'evidence/dark-winter-contrast-1.png',clip:geometry.clip,type:'png',animations:'disabled',scale:'css'});
 geometry.unsupportedEffects=['DIV'];gradient.unresolved='gradient/image background';
 await resolveScreenshotContrast(page,{id:'procrastination',contrast:[gradient]},{out:'evidence',prefix:'unsupported'});
 assert.match(gradient.unresolved,/compositing QA/);assert.equal(calls.filter(x=>x.type==='png').length,1);
});
