// Seoyun runs this in a browser-enabled environment. Real elapsed time, no fast-forward.
// node scripts/hani-office-lively-record.browser.mjs --floor 3f --minutes 6 --label after
// node scripts/hani-office-lively-record.browser.mjs --ref ad3c2f3 --floor 3f --label before
// Optional: --playwright <index.mjs> --chrome <msedge.exe> --start 2026-10-22T14:00:00+09:00 --speed 15
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
if(process.argv.includes('--help')){console.log('Options: --floor 3f --minutes 6 --label after --ref <SHA> --start <ISO+09:00> --speed 15 --playwright <index.mjs> --chrome <browser.exe>');process.exit(0)}
const args=new Map();for(let i=2;i<process.argv.length;i+=2){if(!process.argv[i].startsWith('--')||!process.argv[i+1])throw Error('Expected --option value');args.set(process.argv[i].slice(2),process.argv[i+1])}
const floor=args.get('floor')||'3f',minutes=Number(args.get('minutes')||6),speed=Number(args.get('speed')||15),ref=args.get('ref')||null,label=args.get('label')||(ref?'before-'+ref:'after'),start=args.get('start')||'2026-10-22T14:00:00+09:00';
if(!/^[1-5]f$/.test(floor)||!Number.isFinite(minutes)||minutes<=0||!Number.isFinite(speed)||speed<10||speed>20||!Number.isFinite(Date.parse(start))||!/^[a-zA-Z0-9_-]+$/.test(label)||ref&&!/^[a-fA-F0-9]{7,40}$/.test(ref))throw Error('Invalid floor/minutes/speed/start/label/ref');
const cache=new Map();
const read=file=>{if(!cache.has(file))cache.set(file,ref?execFileSync('git',['show',ref+':'+file],{cwd:root,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']}):fs.readFileSync(path.join(root,file)));return cache.get(file)};
const html=read('index.html').toString('utf8'),from=html.indexOf('<section class="hani-office-live"'),to=html.indexOf('</section>',from)+10;
if(from<0||to<from)throw Error('Office section missing in selected revision');
const document=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><link rel="stylesheet" href="/hani-office-live.css"><style>body{margin:0;padding:12px;font-family:'Malgun Gothic',sans-serif}.view{max-width:1350px;margin:auto}[hidden]{display:none!important}</style><div class="view active">${html.slice(from,to)}</div><script src="/hani-organization-hub.js"></script><script src="/hani-office-live.js"></script></html>`;
const out=path.join(root,'artifacts/office-behavior'),folder=path.join(out,`record-${label}-${floor}`);fs.mkdirSync(folder,{recursive:true});
// Refuse an accidental rerun into existing evidence.
if(fs.readdirSync(folder).some(f=>/^frame-\d+\.png$/.test(f)))throw Error('Recording already exists; use another --label');
let browser,server;const status={label,floor,ref:ref||'worktree',start,minutes,speed,clock:'virtual start + native performance.now real elapsed milliseconds',frames:[],errors:[],result:'running'};
try{
 const runtime=args.get('playwright')||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
 const {chromium}=await import(pathToFileURL(runtime).href);
 // Newer sharp builds ship dist/index.cjs instead of lib/index.js next to playwright.
 let sharp;try{sharp=(await import('sharp')).default}catch{for(const entry of ['../sharp/dist/index.cjs','../sharp/lib/index.js']){try{sharp=(await import(pathToFileURL(path.join(path.dirname(runtime),entry)).href)).default;break}catch{}}if(!sharp)throw Error('sharp not found next to playwright')}
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://fixture').pathname);
  if(pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(document);return}
  const relative=pathname.slice(1),file=path.resolve(root,relative);
  if(!file.startsWith(path.resolve(root)+path.sep)||relative.split('/').some(p=>p.startsWith('.'))){res.writeHead(404).end();return}
  try{const content=read(relative);res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(content)}catch{res.writeHead(404).end()}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:args.get('chrome')||process.env.HANI_CHROME_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
 const context=await browser.newContext({viewport:{width:1080,height:1100},reducedMotion:'no-preference'});
 await context.addInitScript(start=>{
  const RealDate=Date,initial=RealDate.parse(start),epoch=performance.now(),now=()=>initial+performance.now()-epoch;
  window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now()]))}static now(){return now()}};
  window.officeRecordWrites=[];for(const method of ['setItem','removeItem','clear'])Storage.prototype[method]=function(){officeRecordWrites.push(method);throw Error('office storage write forbidden')};
 },start);
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',e=>status.errors.push(e.message));await page.goto(origin);
 await page.waitForFunction(()=>!!window.HaniBuildingScene?.scheduler&&document.querySelectorAll('[data-building-floor]').length===5);
 await page.locator(`[data-building-floor="${floor}"]`).click();await page.waitForFunction(f=>document.querySelector('#haniOfficeMap').dataset.floor===f,floor);
 const nativeStart=performance.now(),duration=minutes*60000,frames=[];let width,height;
 for(let index=0;index<=Math.floor(duration/5000);index++){
  const remaining=nativeStart+index*5000-performance.now();if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
  const file=`frame-${String(index).padStart(3,'0')}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(folder,file)});
  const frame=await sharp(path.join(folder,file)).resize({width:720,withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  width??=frame.info.width;height??=frame.info.height;if(frame.info.width!==width||frame.info.height!==height)throw Error('Recording size changed');frames.push(frame.data);
  status.frames.push({file,realElapsedMs:performance.now()-nativeStart,sceneTime:await page.evaluate(()=>new Date().toISOString())});
  if(index%12===0)console.log(`${label}/${floor}: ${index*5}s / ${minutes*60}s`);
 }
 const gif=path.join(out,`record-${label}-${floor}.gif`),delay=Math.round(5000/speed);
 await sharp(Buffer.concat(frames),{raw:{width,height:height*frames.length,channels:4,pageHeight:height},limitInputPixels:false}).gif({loop:0,delay:Array(frames.length).fill(delay)}).toFile(gif);
 const info=await sharp(gif,{animated:true}).metadata();// The GIF encoder may merge identical consecutive frames, so pages can be fewer than frames.
 if(info.width>720||!(info.pages>=1&&info.pages<=frames.length))throw Error('GIF frame/width validation failed');
 const writes=await page.evaluate(()=>officeRecordWrites);if(writes.length||status.errors.length)throw Error('Runtime error or forbidden storage write');
 status.result='pass';status.gif={file:path.basename(gif),width:info.width,pages:info.pages,delayMs:delay,playbackSpeed:5000/delay};
}catch(error){status.result='fail';status.errors.push(error.stack);process.exitCode=1}
finally{fs.writeFileSync(path.join(folder,'record.json'),JSON.stringify(status,null,2)+'\n');await browser?.close();await new Promise(resolve=>server?server.close(resolve):resolve())}
console.log(JSON.stringify({result:status.result,label,floor,frames:status.frames.length,gif:status.gif,errors:status.errors}));
