import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const sharp=require('sharp');
const out=new URL('./',import.meta.url),card=new URL('../remote-219/',out);
const light=await sharp(fs.readFileSync(new URL('card-390-reading-porcelain-cream.png',card))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const dark=await sharp(fs.readFileSync(new URL('card-390-reading-midnight-black.png',card))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(JSON.stringify(light.info)!==JSON.stringify(dark.info))throw Error('different dimensions');
let max=0,count=0,bounds={left:Infinity,top:Infinity,right:0,bottom:0};
for(let y=24;y<light.info.height-24;y++)for(let x=24;x<light.info.width-24;x++){
 let delta=0;const pos=(y*light.info.width+x)*4;for(let i=0;i<3;i++)delta=Math.max(delta,Math.abs(light.data[pos+i]-dark.data[pos+i]));
 max=Math.max(max,delta);if(delta>1){count++;bounds={left:Math.min(bounds.left,x),top:Math.min(bounds.top,y),right:Math.max(bounds.right,x),bottom:Math.max(bounds.bottom,y)}}
}
const result={method:'Existing f27be17 PNGs only; same 24px interior and <=1 tolerance as original test. No new browser or modified PNG.',dimensions:light.info,interiorMax:max,changedPixelsAboveTolerance:count,bounds,
 diagnosis:'B: legacy .top h2:after (42x4px, background var(--primary), margin-top9px) now matches Remote h2 inside header. CSS owner suppresses this unrelated decoration; pixel assertion is unchanged.',
 originalFailure:'390/reading/midnight-black: theme pixel delta 124',postPatchBrowser:'NOT RUN'};
fs.writeFileSync(new URL('pixel-diagnosis.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
