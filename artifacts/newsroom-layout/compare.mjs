// Compose only real browser captures. Missing after evidence is an error.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
const sharp=createRequire(import.meta.url)('C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const before=new URL('before/news-pc.png',import.meta.url),after=new URL('after/comparison-1280-issue001.png',import.meta.url);
if(!fs.existsSync(after))throw Error('Actual Edge after screenshot required; comparison was not generated.');
const inputs=await Promise.all([before,after].map(async file=>{const image=sharp(fs.readFileSync(file)),meta=await image.metadata();return {image,meta};}));
const width=inputs[0].meta.width,gap=16;
const resized=await Promise.all(inputs.map(async({image})=>{const bytes=await image.resize({width}).png().toBuffer();return {bytes,meta:await sharp(bytes).metadata()};}));
await sharp({create:{width:width*2+gap,height:Math.max(...resized.map(x=>x.meta.height)),channels:3,background:'#e4e7ec'}}).composite(resized.map((x,i)=>({input:x.bytes,left:i*(width+gap),top:0}))).png().toFile(fileURLToPath(new URL('after/before-after-pc.png',import.meta.url)));
console.log('Actual before (left) / after (right) comparison generated.');
