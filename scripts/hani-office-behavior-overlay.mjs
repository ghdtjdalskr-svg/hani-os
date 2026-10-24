// Node only. SVG references the reviewed background; no browser/canvas dependency.
// Optional PNG: node <this script> --png <playwright/index.mjs> <browser.exe>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'docs/drafts/office-behavior-redesign');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const canon=read('data/hani-building/spatial-contract.json'),art=read('data/hani-building/art-map-v1.json');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const pos=id=>{const p=art.anchors[id];return [p.x*art.width/100,p.y*art.height/100]};
// The existing sprite test dependency provides native PNG output without Edge.
let sharp=null;
try{sharp=createRequire(import.meta.url)(process.env.HANI_SHARP_MODULE||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'))}catch(_){/* SVG remains reviewable without this optional dependency. */}
for(const f of canon.floors){
 const nodes=canon.anchors.filter(n=>n.floor===f.id),ids=new Set(nodes.map(n=>n.id));
 const svg=[`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${art.width}" height="${art.height}" viewBox="0 0 ${art.width} ${art.height}">`,
 `<image href="../../../${escape(art.floors[f.id].background.replace(/^\.\//,''))}" width="${art.width}" height="${art.height}"/>`,
 '<g stroke="#666" stroke-width="1.5" opacity=".6">'];
 for(const e of canon.edges)if(ids.has(e.from)&&ids.has(e.to)){const [x1,y1]=pos(e.from),[x2,y2]=pos(e.to);svg.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)}
 svg.push('</g>');
 for(const n of nodes){const [x,y]=pos(n.id),window=n.id.startsWith('window_'),hall=n.id.startsWith('hall_'),person=canon.people.find(p=>p.homeAnchor===n.id);
  const color=window?'#ff8200':person?'#00a63e':hall?'#006bff':'#555',radius=window?10:person?7:hall?6:2;
  svg.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" stroke="white"/>`);
  if(window||hall||person)svg.push(`<text x="${x+10}" y="${y-10}" fill="${color}" stroke="white" stroke-width="3" paint-order="stroke" font-family="Malgun Gothic,sans-serif" font-size="16">${escape(person?person.name||person.id:n.id)}</text>`);
 }
 svg.push('</svg>');fs.writeFileSync(path.join(out,'overlay-'+f.id+'.svg'),svg.join('\n'));
 if(sharp){const overlay=Buffer.from(svg.filter(line=>!line.startsWith('<image ')).join('\n'));
  await sharp(path.join(root,art.floors[f.id].background)).composite([{input:overlay}]).png().toFile(path.join(out,'overlay-'+f.id+'.png'));
 }
}
if(process.argv.includes('--png')){
 const i=process.argv.indexOf('--png'),{chromium}=await import(pathToFileURL(process.argv[i+1]).href);
 const browser=await chromium.launch({headless:true,executablePath:process.argv[i+2]});
 try{const page=await browser.newPage({viewport:{width:art.width,height:art.height}});
  for(const f of canon.floors){await page.goto(pathToFileURL(path.join(out,'overlay-'+f.id+'.svg')).href);await page.screenshot({path:path.join(out,'overlay-'+f.id+'.png')})}
 }finally{await browser.close()}
}
console.log('overlay SVG: '+canon.floors.map(f=>f.id).join(', '));
