// Node only: recompute all text-free pixels in Seoyun's preserved PNG clips.
// No browser, Git process, runtime mutation, new measurement or threshold change.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sampleBackgroundPixels} from '../../../scripts/hani-design-polish-1-contrast.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),out=import.meta.dirname;
const read=f=>fs.readFileSync(path.join(root,f)),hash=b=>createHash('sha256').update(b).digest('hex');
const evidence='artifacts/design-polish-1/last-contrast/input/browser-results.json';
const report=JSON.parse(read(evidence)),css=read('hani-design-system.css').toString('utf8');
const starts=JSON.parse(fs.readFileSync(path.join(out,'start-hashes.json')));
assert.equal(report.sourceHashes['hani-design-system.css'].after,starts['hani-design-system.css']);
assert.equal(report.sourceHashes['hani-main.js'].after,hash(read('hani-main.js')));
const rule=css.match(/#app #procrastination \.pb-header \.pb-intro\{color:color-mix\(in srgb,var\(--text-secondary\) (\d+)%,var\(--text-primary\)\)!important\}/);
assert.ok(rule);const secondaryWeight=Number(rule[1])/100;assert.equal(secondaryWeight,.96);
function token(finish,name){
 const start=finish==='porcelain-cream'?css.indexOf(':root,.login-design-choice'):css.indexOf(`:root[data-finish="${finish}"],`);
 assert.ok(start>=0);const body=css.slice(start,css.indexOf('}',start));
 const hex=body.match(new RegExp('--'+name+':#([a-f0-9]{6})[;}]'))?.[1];assert.ok(hex);
 return hex.match(/../g).map(v=>parseInt(v,16));
}
// Playwright screenshot PNGs: lossless 8-bit RGB/RGBA, non-interlaced.
function decode(bytes){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 let width,height,channels;const chunks=[];
 for(let at=8;at<bytes.length;){
  const size=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),data=bytes.subarray(at+8,at+8+size);
  if(type==='IHDR'){
   width=data.readUInt32BE(0);height=data.readUInt32BE(4);
   assert.equal(data[8],8);assert.ok([2,6].includes(data[9]));channels=data[9]===2?3:4;
   assert.deepEqual([...data.subarray(10)],[0,0,0]);
  }
  if(type==='IDAT')chunks.push(data);at+=size+12;if(type==='IEND')break;
 }
 const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*channels;
 assert.equal(raw.length,(stride+1)*height);const decoded=Buffer.alloc(stride*height);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];assert.ok(filter<=4);
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=channels?decoded[i-channels]:0,b=y?decoded[i-stride]:0,c=y&&x>=channels?decoded[i-stride-channels]:0;
   const predict=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
   decoded[i]=(raw[y*(stride+1)+1+x]+predict)&255;
  }
 }
 const pixels=new Uint8Array(width*height*4);
 for(let i=0;i<width*height;i++){pixels.set(decoded.subarray(i*channels,i*channels+3),i*4);pixels[i*4+3]=channels===4?decoded[i*channels+3]:255;}
 return {pixels,width,height};
}
const rows=[...report.combinations.filter(r=>r.id==='procrastination'),...report.cases.filter(r=>r.id==='procrastination'&&r.phase==='after')];
assert.equal(rows.filter(r=>r.season).length,48);
const results=[];
for(const row of rows){
 const text=row.contrast.find(t=>t.selector==='.pb-header .pb-intro');assert.equal(text.unresolved,null);
 const secondary=token(row.finish,'text-secondary'),primary=token(row.finish,'text-primary');
 assert.deepEqual(text.rgba,[...secondary,1]);
 const mixed=secondary.map((v,i)=>v*secondaryWeight+primary[i]*(1-secondaryWeight));
 // Also use the less favorable adjacent whole RGB value per channel. This
 // bounds 8-bit quantization without rounding a failing contrast up to 4.5.
 const conservative=mixed.map((v,i)=>primary[i]<secondary[i]?Math.ceil(v):Math.floor(v));
 const pngFile='artifacts/design-polish-1/last-contrast/input/'+text.screenshot,png=read(pngFile),geometry=decode(png);
 const args={...geometry,clip:text.clip,textRects:text.textRects};
 const before=await sampleBackgroundPixels({...args,color:text.rgba});
 assert.ok(Math.abs(before.ratio-text.ratio)<1e-12,'decoder exactly reproduces original pixel result');
 const after=await sampleBackgroundPixels({...args,color:[...mixed,1]});
 const rounded=await sampleBackgroundPixels({...args,color:[...conservative,1]});
 for(const result of [after,rounded]){assert.equal(result.unresolved,null);assert.ok(result.ratio>=4.5);assert.ok(result.ratio>=before.ratio);}
 results.push({finish:row.finish,season:row.season??'autumn (screen case)',width:row.width,png:pngFile,pngSha256:hash(png),samples:after.samples,secondary,primary,mixed,conservative,before:before.ratio,after:after.ratio,conservativeRatio:rounded.ratio,worst:after.worst});
}
const combos=results.filter(r=>!r.season.includes('screen'));
const summary={result:'PASS',method:'Calculation using preserved pre-change PNG text-free pixels; actual new browser rendering remains unverified',threshold:4.5,secondaryWeight,combinations:new Set(combos.map(r=>r.finish+'/'+r.season)).size,viewports:[390,1440],combinationMeasurements:combos.length,screenCases:results.length-combos.length,evidenceSha256:hash(read(evidence)),cssSha256:hash(read('hani-design-system.css')),minimumBefore:Math.min(...results.map(r=>r.before)),minimumAfter:Math.min(...results.map(r=>r.after)),minimumConservative:Math.min(...results.map(r=>r.conservativeRatio)),regressions:results.filter(r=>r.after<r.before||r.conservativeRatio<r.before).length,results};
assert.equal(summary.combinations,24);
fs.writeFileSync(path.join(out,'contrast-calculation.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,results:undefined},null,2));
