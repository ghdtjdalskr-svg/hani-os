// Node safety/inverse checks; real layout and pixels are a separate Edge handoff.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import inverse from './hani-design-polish-2-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {sampleBackgroundPixels} from './hani-design-polish-1-contrast.mjs';
const {delta,hash,restore,project,readRawFileSync:read}=inverse,root=new URL('../',import.meta.url);
const raw=f=>read(new URL(f,root),'utf8'),file='hani-design-system.css',css=raw(file),block=delta.files[file].edits[0].after;

test('only a complete appended CSS block inverts exactly to independent main296; corrupt/foreign input stays rejected',()=>{
 assert.equal(delta.base,'7a91982de08a54452f6b9057f906d651f63a65ca');
 assert.deepEqual(Object.keys(delta.files),[file]);const before=repository.read(delta.base,file);
 assert.equal(hash(before),delta.files[file].beforeSha256);assert.equal(hash(css),delta.files[file].afterSha256);
 assert.equal(css,before+block);assert.equal(restore(css,file),before);assert.deepEqual(restore(Buffer.from(css),file),Buffer.from(before));
 assert.equal(project(css,file),before);assert.equal(project(before,file),before);
 for(const bad of [css+'\n',css.slice(1),css+block,before,css.replace(/\r\n/,'\n')]){
  assert.throws(()=>restore(bad,file),/exact design-polish-2 input/);assert.equal(project(bad,file),bad);
 }
 assert.throws(()=>restore(css,'hani-main.js'),/known design-polish-2 owner/);assert.equal(raw(file),css);
});

test('runtime owners, data/events/version/cache and every pre-existing fixture remain byte-identical to supplied main',()=>{
 for(const f of ['index.html','hani-main.js','hani-ui-v02992.js','hani-street-journal.css','hani-board.css','hani-ilbo.js','hani-study-v02984.js','hani-development-history-v1.js','assets/data/hani-history-releases-v1.json'])assert.equal(raw(f),repository.read(delta.base,f),f);
 const start=JSON.parse(raw('artifacts/design-polish-2/start-hashes.json'));
 for(const [f,pin]of Object.entries(start))if(f.startsWith('scripts/fixtures/'))assert.equal(hash(read(new URL(f,root))),pin,f);
 const scripts=repository.tree(repository.commit(delta.base).tree).find(r=>r.name==='scripts');
 const fixtures=repository.tree(scripts.sha).find(r=>r.name==='fixtures');let fixtureCount=0;
 function checkFixtures(tree,prefix){for(const row of repository.tree(tree)){const f=prefix+row.name;if(row.mode==='40000')checkFixtures(row.sha,f+'/');else{fixtureCount++;assert.equal(hash(read(new URL(f,root))),hash(repository.object(row.sha).data),f)}}}
 checkFixtures(fixtures.sha,'scripts/fixtures/');assert.equal(fixtureCount,114,'all original nested fixture files');
 for(const f of ['scripts/hani-release-296-source.cjs','scripts/hani-design-polish-1-source.cjs','scripts/hani-design-polish-1-main295-source.cjs']){
  const source=raw(f),old=repository.read(delta.base,f),line=source.split(/\r?\n/).find(l=>l.startsWith("require('./hani-design-polish-2-preload.cjs')"));
  assert.ok(line);const projected=source.replace("source=require('./hani-design-polish-2-source.cjs').project(source,file);",'');
  assert.equal(projected.replace(line+(old.includes('\r\n')?'\r\n':'\n'),''),old,'input adaptation only '+f);
 }
 const layerFile='scripts/hani-release-version-layers.cjs',layerSource=raw(layerFile),oldLayer=repository.read(delta.base,layerFile);
 assert.equal(layerSource.replace(" source=require('./hani-design-polish-2-source.cjs').project(source,file);"+(oldLayer.includes('\r\n')?'\r\n':'\n'),''),oldLayer,'dispatcher input adaptation only');
 assert.doesNotMatch(block,/url\(|@import|display\s*:\s*none|visibility\s*:\s*hidden|pointer-events|[;{]\s*(?:position|z-index|content)\s*:/);
});

test('actual canonical helper viewport and clamp preserve stored ratios, require plain numeric tokens, and stay inside phone/keyboard viewport',()=>{
 const ui=raw('hani-ui-v02992.js'),start=ui.indexOf('  function viewportBox() {'),end=ui.indexOf('  function movePointer(event)',start);assert.ok(start>=0&&end>start);
 const cssTokens=[...block.matchAll(/--helper-safe-bottom:(\d+)px/g)].map(m=>Number(m[1]));assert.deepEqual(cssTokens,[580,620]);
 // Retain the original phone/keyboard clamp regression for its four tokens.
 // The larger first-screen tokens also cover a zero-height reserved viewport,
 // verified separately below against the unchanged canonical owner.
 const tokens=[190,150,160,130];
 for(const token of tokens)for(const height of [844,410,360])for(const position of [{x:.95,y:.95},{x:.25,y:.5}]){
  const original=JSON.stringify(position),vv={offsetLeft:0,offsetTop:12,width:390,height};
  const ctx=vm.createContext({root:{},face:{getBoundingClientRect:()=>({width:78})},getComputedStyle:()=>({getPropertyValue:()=>token+'px'}),window:{visualViewport:vv,innerWidth:390,innerHeight:844},position});
  const {v,b}=JSON.parse(vm.runInContext(ui.slice(start,end)+';const v=viewportBox();JSON.stringify({v,b:clampBox(v.left+position.x*v.width,v.top+position.y*v.height,v,faceSize())})',ctx));
  assert.equal(v.height,height-token);assert.ok(b.top>=12&&b.bottom<=12+height-token&&b.left>=0&&b.right<=390);assert.equal(JSON.stringify(position),original);
 }
 // This proves viewport clearance only. It deliberately does not claim zero
 // collision with arbitrary scrolling cards or arbitrary saved drag positions.
});

test('first-screen helper tokens use canonical clamp, fit the measured banner at 390x844 and stay inside the physical keyboard viewport',()=>{
 const ui=raw('hani-ui-v02992.js'),start=ui.indexOf('  function viewportBox() {'),end=ui.indexOf('  function movePointer(event)',start);
 for(const token of [580,620])for(const height of [844,410,360]){
  const vv={offsetLeft:0,offsetTop:12,width:390,height};
  const ctx=vm.createContext({root:{},face:{getBoundingClientRect:()=>({width:78})},getComputedStyle:()=>({getPropertyValue:()=>token+'px'}),window:{visualViewport:vv,innerWidth:390,innerHeight:844}});
  const {v,b}=JSON.parse(vm.runInContext(ui.slice(start,end)+';const v=viewportBox();JSON.stringify({v,b:clampBox(390,844,v,faceSize())})',ctx));
  assert.equal(v.height,Math.max(0,height-token));assert.ok(b.top>=12&&b.bottom<=12+height&&b.left>=0&&b.right<=390);
  if(height===844){assert.ok(b.bottom<=12+height-token);const banner=token===620?{top:69,bottom:237}:{top:99,bottom:267};assert.ok(b.top-12>=banner.top&&b.bottom-12<=banner.bottom);}
 }
});

test('browser helper gate rejects first-screen control overlap and restored scroll while retaining card/scrolled overlap as observations',()=>{
 const source=raw('scripts/hani-design-polish-2.browser.mjs');
 const topStart=source.indexOf('       check(row.scrollY===0'),topEnd=source.indexOf('\n      }',topStart),scrolledStart=source.indexOf("if(phase==='after'){check(scrolled.helperVisible"),scrolledEnd=source.indexOf('\n',scrolledStart);
 assert.ok(topStart>0&&topEnd>topStart&&scrolledStart>0&&scrolledEnd>scrolledStart);
 const run=(top,changes={})=>{const failures=[],report={observations:[]},row={scrollY:0,helperVisible:true,helperInViewport:true,helperHasStoredPosition:false,overlaps:[],cardOverlaps:[{id:'inert-card'}],overflow:0,...changes};vm.runInNewContext(top?source.slice(topStart,topEnd):source.slice(scrolledStart,scrolledEnd),{row,scrolled:row,phase:'after',report,check:(ok,message)=>{if(!ok)failures.push(message)}});return {failures,report};};
 assert.deepEqual(run(true).failures,[]);assert.equal(run(true).report.observations[0].policy,'report-only');
 assert.ok(run(true,{overlaps:[{id:'input'}]}).failures.includes('helper overlaps first-screen controls'));
 assert.ok(run(true,{scrollY:1}).failures.includes('helper first screen at scroll zero'));
 assert.ok(run(true,{helperHasStoredPosition:true}).failures.includes('helper first screen without stored position'));
 assert.deepEqual(run(false,{overlaps:[{id:'input'}]}).failures,[]);assert.equal(run(false).report.observations[0].policy,'report-only');
 assert.ok(run(false,{helperVisible:false}).failures.includes('scrolled helper visible'));
 assert.ok(run(false,{overflow:2}).failures.includes('scrolled horizontal overflow'));
});

test('explicit ink/surface pairs exceed 4.5 without rounding or treating large text as an exception',async()=>{
 for(const [fg,bg]of [['#4d4660','#ffffff'],['#49385f','#f6f4fa'],['#275b96','#ffffff'],['#28664c','#ffffff'],['#2459b5','#ffffff'],['#9ae0d9','#202633'],['#dce6f5','#202633'],['#a8ceff','#202633'],['#9ae0c2','#202633'],['#28374c','#ffffff']]){
  const rgb=s=>s.slice(1).match(/../g).map(v=>parseInt(v,16));
  const result=await sampleBackgroundPixels({pixels:[...rgb(bg),255],width:1,height:1,clip:{x:0,y:0,width:1,height:1},textRects:[],color:[...rgb(fg),1]});
  assert.equal(result.unresolved,null);assert.ok(result.ratio>=4.5,fg+' on '+bg+' '+result.ratio);
 }
});

test('all async/sync legacy input paths receive exact main296 while the new outer reader preserves real design2 bytes',async()=>{
 await import('./hani-design-polish-2-preload.cjs');const url=new URL(file,root),pin=delta.files[file].beforeSha256;
 assert.equal(hash(fs.readFileSync(url)),pin);assert.equal(hash(await fs.promises.readFile(url)),pin);
 assert.equal(hash(await new Promise((resolve,reject)=>fs.readFile(url,(e,b)=>e?reject(e):resolve(b)))),pin);
 const esm=await import('node:fs');assert.equal(hash(esm.readFileSync(url)),pin);assert.equal(hash(raw(file)),delta.files[file].afterSha256);
});

test('outer design2 composes the unchanged 296/design1/295/chibi2/294/THAW releases and closure counts',async()=>{
 const {default:layers}=await import('./hani-release-version-layers.cjs');
 const main296=restore(css,file);assert.equal(layers.projectReleaseSource(main296,file,'2.9.296'),repository.read(delta.base,file));
 assert.equal(layers.projectReleaseSource(css,file,'2.9.296'),main296,'explicit raw design2 caller reaches exact main296');
 for(const [version,base]of [['2.9.295','396511a'],['2.9.294','cb11935']]){
  const projected=layers.projectReleaseSource(main296,file,version);
  // 294 projection peels design1 and THAW only at the lower feature boundary.
  if(version==='2.9.295')assert.equal(projected,repository.read(base,file));
  else assert.equal(hash(projected),requirePin('scripts/fixtures/design-polish-1-delta.json').files[file].beforeSha256);
 }
 const {resolveRuntimeClosure}=await import('./hani-runtime-closure.mjs');
 for(const [version,count]of [[null,172],['2.9.296',172],['2.9.295',172],['2.9.294',171],['2.9.293',168],['2.9.289',164]]){
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>{const b=project(read(new URL(f,root)),f);return version?layers.projectReleaseSource(b,f,version):b}});
  assert.equal(closure.files.length,count);assert.deepEqual(closure.missing,[]);
 }
 function requirePin(f){return JSON.parse(raw(f))}
});
