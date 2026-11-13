// Raw patch tests: deliberately no legacy fs preload in this process.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import inverse from './hani-design-polish-1-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
const {delta,hash,restore,project}=inverse,root=new URL('../',import.meta.url);
const raw=file=>inverse.readRawFileSync(new URL(file,root),'utf8');
const css=raw('hani-design-system.css'),main=raw('hani-main.js'),block=delta.files['hani-design-system.css'].edits[0].after;

test('two runtime edits invert exactly to independently identified cb11935 bytes; drift is rejected',()=>{
 assert.deepEqual(Object.keys(delta.files).sort(),['hani-design-system.css','hani-main.js']);
 for(const [file,row]of Object.entries(delta.files)){
  const source=raw(file),before=repository.read(delta.base,file);
  assert.equal(hash(source),row.afterSha256);assert.equal(hash(before),row.beforeSha256);
  assert.equal(restore(source,file),before);assert.deepEqual(restore(Buffer.from(source),file),Buffer.from(before));
  assert.equal(project(source,file),before);assert.equal(project(before,file),before);
  for(const bad of [source+'\n',source.slice(1),source+source,before,source.replace(/\r?\n/,m=>m==='\r\n'?'\n':'\r\n')]){
   assert.throws(()=>restore(bad,file),/exact design-polish-1 input/);assert.equal(project(bad,file),bad);
  }
  assert.equal(raw(file),source);
 }
 assert.throws(()=>restore('', 'unknown'),/known design-polish-1 owner/);
 assert.ok(css.endsWith(block));assert.equal(css.slice(0,-block.length),repository.read(delta.base,'hani-design-system.css'));
});

test('month title uses real presentation expression: two phrases, stored title unchanged, escaping preserved',()=>{
 const edit=delta.files['hani-main.js'].edits[0],expression=edit.after.slice('pending.innerHTML='.length)+'`';
 const render=(stored,period,heading)=>vm.runInNewContext(expression,{stored,monthlyReportMonth:period,heading,description:'description',esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')});
 const empty=render(null,'2026-10','2026-10 월간보고가 없습니다.');
 assert.equal(empty,'<h4 class="monthly-report-empty-title"><span>2026-10</span> <span>월간보고가 없습니다.</span></h4><p>description</p>');
 assert.equal(render({month:'2026-10'},'2026-10','2026-10 보고서 · 생성 완료'),'<h4>2026-10 보고서 · 생성 완료</h4><p>description</p>');
 assert.ok(!render(null,'<img>','<img> 월간보고가 없습니다.').includes('<img>'));
 assert.equal(main.split(edit.after).length,2);
 const old=repository.read(delta.base,'hani-main.js');
 for(const term of ['localStorage.setItem','localStorage.removeItem','localStorage.clear','addEventListener','setTimeout','setInterval','HANI_DISPLAY_VERSION'])assert.equal(main.split(term).length,old.split(term).length,term);
});

test('new paired colors exceed 4.5:1; existing contrast/THAW bytes, choices and handlers stay intact',()=>{
 const rgb=s=>s.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const lum=s=>rgb(s).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 for(const [fg,bg]of [['#4d4660','#ffffff'],['#49385f','#f4f1fa'],['#51455f','#f4f1fa']])assert.ok(ratio(fg,bg)>=4.5,fg+' on '+bg);
 assert.ok(!/\.theme-collection-|#signatureFinishChoices|\.galaxy-choice\{|\.season-choice\{/.test(block));
 assert.ok(!/url\(|display:none|visibility:hidden|pointer-events|position:|\bz-index:/.test(block),'no new assets, hidden controls or helper position override');
 assert.match(block,/#tasks>\.grid>\.card:has\(#taskText\)\{order:-1\}/);
 const safe=block.match(/--helper-safe-bottom:([^;}]+)/)[1];
 assert.equal(parseFloat(safe),190,'actual canonical viewportBox parseFloat contract');
 for(const [height,inset]of [[112,0],[112,34],[112,48],[40,34]])assert.ok(parseFloat(safe)>height+18+1+inset);
 assert.match(block,/\.pb-header \.pb-intro\{color:color-mix\(in srgb,var\(--text-secondary\) 96%,var\(--text-primary\)\)!important\}/);
});

test('actual helper viewport/clamp functions consume the CSS token and clear an expanded composer with keyboard viewport',()=>{
 const ui=raw('hani-ui-v02992.js'),start=ui.indexOf('  function viewportBox() {'),end=ui.indexOf('  function movePointer(event)',start);
 assert.ok(start>=0&&end>start);const functions=ui.slice(start,end),safe=block.match(/--helper-safe-bottom:([^;}]+)/)[1];
 for(const viewport of [{offsetLeft:0,offsetTop:0,width:390,height:844},{offsetLeft:0,offsetTop:0,width:390,height:410},{offsetLeft:0,offsetTop:30,width:390,height:360}]){
  const c=vm.createContext({root:{},face:{getBoundingClientRect:()=>({width:78})},getComputedStyle:()=>({getPropertyValue:()=>safe}),window:{innerWidth:390,innerHeight:844,visualViewport:viewport}});
  const result=vm.runInContext(functions+';const v=viewportBox();JSON.stringify({v,box:clampBox(v.left+.95*v.width,v.top+.95*v.height,v,faceSize())})',c);
  const {v,box}=JSON.parse(result);assert.equal(v.height,viewport.height-190);
  for(const inset of [0,34,48])assert.ok(box.bottom<viewport.offsetTop+viewport.height-(112+19+inset),'actual clamped helper clears expanded composer');
 }
});

test('preload sync/callback/promise/ESM readers see the identical base without touching disk',async()=>{
 await import('./hani-design-polish-1-preload.cjs');
 for(const [file,row]of Object.entries(delta.files)){
  const name=new URL(file,root),pin=row.beforeSha256;
  assert.equal(hash(fs.readFileSync(name)),pin);
  assert.equal(hash(await fs.promises.readFile(name)),pin);
  assert.equal(hash(await new Promise((resolve,reject)=>fs.readFile(name,(error,bytes)=>error?reject(error):resolve(bytes)))),pin);
  const esm=await import('node:fs');assert.equal(hash(esm.readFileSync(name)),pin);
 }
 assert.equal(hash(raw('hani-main.js')),delta.files['hani-main.js'].afterSha256);
});

test('outer dispatch preserves 294/THAW/293/legacy full pins and original closure counts',async()=>{
 const {default:layers}=await import('./hani-release-version-layers.cjs'),{default:thaw}=await import('./hani-theme-thaw-source.cjs');
 for(const [file,current]of [['hani-main.js',main],['hani-design-system.css',css]]){
  assert.equal(hash(layers.projectReleaseSource(current,file,'2.9.294')),delta.files[file].beforeSha256);
  assert.equal(hash(layers.projectReleaseSource(current,file,'2.9.293')),thaw.delta.files[file].beforeSha256);
 }
 assert.equal(hash(thaw.project(css,'hani-design-system.css')),thaw.delta.files['hani-design-system.css'].beforeSha256);
 const {resolveRuntimeClosure}=await import('./hani-runtime-closure.mjs');
 for(const [version,count]of [[null,171],['2.9.293',168],['2.9.289',164]]){
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(new URL(f,root)),read:f=>{const b=inverse.readRawFileSync(new URL(f,root));return version?layers.projectReleaseSource(b,f,version):b}});
  assert.equal(closure.files.length,count);assert.deepEqual(closure.missing,[]);
 }
});
