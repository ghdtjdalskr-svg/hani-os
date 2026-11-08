import fs from 'node:fs';
import {createHash} from 'node:crypto';
import release from '../../../scripts/hani-release-283-source.cjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
for(const file of ['index.html','hani-main.js']){
 let source=fs.readFileSync(file,'utf8').replaceAll('2.9.284','2.9.283');
 if(file==='index.html')source=source.replace(/^<template id="launchGreetingAssets"[^\n]*\r?\n/m,'').replace(/^<script src="\.\/hani-launch-greeting.js"><\/script>\r?\n/m,'');
 console.log({file,actual:hash(source),expected:release.files[file].after,equal:hash(source)===release.files[file].after});
 if(file==='index.html'){
  const gz=await import('node:zlib'),base=JSON.parse(gz.gunzipSync(fs.readFileSync('scripts/fixtures/life-bundle-baseline-282.json.gz'))).files[file].source;
  const counts=s=>({crlf:(s.match(/\r\n/g)||[]).length,lf:(s.match(/(?<!\r)\n/g)||[]).length,length:s.length});
  console.log({current:counts(source),base:counts(base)});
  for(const style of ['LF','CRLF']){const s=source.replace(/\r\n/g,'\n').replace(/\n/g,style==='LF'?'\n':'\r\n');console.log(style,hash(s));}
  const layers=JSON.parse(fs.readFileSync('scripts/fixtures/life-bundle-layers.json'));
  let lower=source;for(const l of layers.layers){const row=l.files[file];if(!row)continue;const lines=lower.match(/[^\n]*\n|[^\n]+$/g)||[];for(const e of row.edits.toReversed())lines.splice(e.at,e.remove,...(e.before.match(/[^\n]*\n|[^\n]+$/g)||[]));lower=lines.join('');}
  console.log({inverse:counts(lower),baseEqual:lower.replaceAll('2.9.283','2.9.282')===base});
  const a=lower.replaceAll('2.9.283','2.9.282').split('\n'),b=base.split('\n');for(let i=0,n=0;i<Math.max(a.length,b.length)&&n<12;i++)if(a[i]!==b[i]){console.log({line:i+1,actual:a[i]?.slice(0,320),expected:b[i]?.slice(0,320)});n++;}
 }
}
