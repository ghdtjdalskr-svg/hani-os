// node scripts/hani-newface-217.test.mjs
// Execute existing renderers with disposable VM inputs; decode final WebP pixels.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {assets} from './hani-office-v2-fixture.mjs';
const require=createRequire(import.meta.url),root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sharp=require(process.env.HANI_SHARP_PATH||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),report={groups:[],files:[],browser:'BLOCKED: Edge spawn EPERM; no browser PASS claimed'};
const variants={daon:'v2',yoonseul:'v2',sua:'id'},full=id=>`./assets/profiles/hani-profile-${id}${variants[id]?'-'+variants[id]:''}.webp`,thumb=(id,n)=>full(id).replace('/profiles/','/profiles/thumb/').replace('.webp',`-${n}.webp`);
const preserved=JSON.parse(read('scripts/fixtures/hani-newface-217-preserved-assets.json'));
for(const [f,sha]of Object.entries(preserved))assert.equal(hash(fs.readFileSync(path.join(root,f))),sha,f+' existing asset untouched');
report.groups.push('15 original portraits/thumbs/sprites/live manifest byte-identical');
for(const id of Object.keys(variants))for(const n of [720,128,256]){
 const file=n===720?full(id):thumb(id,n),b=fs.readFileSync(path.join(root,file)),meta=await sharp(b).metadata();
 assert.equal(meta.format,'webp');assert.deepEqual([meta.width,meta.height],[n,n]);assert.ok(b.length<=(n===720?73844:n===128?6000:18000));
 const decoded=await sharp(b).raw().toBuffer();assert.ok(new Set(decoded).size>100,'real image pixel diversity');
 report.files.push({file,bytes:b.length,sha256:hash(b),width:n,height:n});
}
report.groups.push('9 final portraits/thumbs decoded with exact 720/128/256 dimensions and byte budgets');
const org=read('hani-organization-hub.js'),orgCtx=vm.createContext({window:{},document:{getElementById:()=>null}});vm.runInContext(org,orgCtx);
const roster=orgCtx.window.HaniOrganizationRoster,orgPortrait=vm.runInNewContext(org.slice(org.indexOf('  const portraitFiles='),org.indexOf('  const avatar ='))+';portrait;');
const main=read('hani-main.js'),registry=main.slice(main.indexOf('const canonicalProfileImages='),main.indexOf('const pageAgentImage='));
const images=vm.runInNewContext(registry+';({canonicalProfileImages,agentImages,sidebarAgentImages});');
const board=read('hani-board.js'),boardAvatar=vm.runInNewContext(board.slice(board.indexOf('  function avatar('),board.indexOf('  function authorCard('))+';avatar;',{
 person:id=>id==='seongmin'?roster.chairman:roster.people.find(p=>p.id===id),actor:()=>roster.chairman.id,escape:String
});
const ilbo=read('hani-ilbo.js'),ilboAvatar=vm.runInNewContext(ilbo.slice(ilbo.indexOf('  function avatar('),ilbo.indexOf('  const identity ='))+';avatar;',{
 person:id=>id==='seongmin'?roster.chairman:roster.people.find(p=>p.id===id),window:{HaniOrganizationRoster:roster},esc:String
});
const officeCtx=vm.createContext({HaniOfficeV2Assets:assets,window:{},document:{getElementById:()=>null}});await vm.runInContext(read('hani-office-live.js'),officeCtx);
const building=officeCtx.HaniBuildingScene,data=require('../hani-character-archive-data.js'),album=require('../hani-character-archive.js');
const refs=html=>[...html.matchAll(/\bsrc="([^"]+)"/g)].map(m=>m[1]);
for(const p of roster.people){
 assert.deepEqual(refs(orgPortrait(p)),[full(p.id)]);assert.deepEqual(refs(boardAvatar(p.id)),[thumb(p.id,128)]);assert.deepEqual(refs(ilboAvatar(p.id)),[thumb(p.id,128)]);assert.equal(building.profile(p.id),thumb(p.id,256));
 for(const src of [full(p.id),thumb(p.id,128),thumb(p.id,256)])assert.ok(fs.existsSync(path.join(root,src)),src);
}
for(const id of Object.keys(variants)){
 assert.equal(images.canonicalProfileImages[id],full(id));assert.equal(images.sidebarAgentImages[id],thumb(id,256));
 const c=data.characters.find(c=>c.id===id);assert.equal(c.image,full(id));assert.ok(refs(album.detail(c)).includes(full(id)));assert.ok(refs(album.page()).includes(full(id)));
}
for(const id of ['daon','yoonseul']){assert.equal(roster.people.find(p=>p.id===id).status,'planned');assert.equal(building.homeSeat(id),undefined);assert.ok(!building.floors.flatMap(f=>f.residents).includes(id));}
assert.deepEqual(refs(boardAvatar('unknown-staff')),[]);assert.deepEqual(refs(ilboAvatar('unknown-staff')),[]);
report.groups.push('executed registry/sidebar, 19 roster portraits, board/ilbo avatars, office badges and album detail/grid; planned hires stay inactive; unknown author fallback preserved');
// Run the real image loading and pose paths with the unchanged live manifest.
const office=read('hani-office-live.js'),spriteFns=office.slice(office.indexOf('  function spriteId('),office.indexOf('  function addActor('));
// Only select the contiguous spriteId/pose/loadSprite definitions, stopping before unrelated actor creation.
const fnEnd=spriteFns.indexOf('\n  function ',spriteFns.indexOf('  function loadSprite(')+3);
const spriteCode=fnEnd<0?spriteFns:spriteFns.slice(0,fnEnd);
const hd=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
for(const id of ['daon','yoonseul']){
 const entry=assets.sprites.entries.find(e=>e.id===id),hdEntry=hd.entries.find(e=>e.id===id),file=`./assets/sprites-v2/${id}-v2.webp`,hdFile=`./assets/sprites-v3/${id}.webp`;
 for(const mode of ['hd','missing-hd','missing-manifest','both-fail']){
  const sprite={style:{backgroundImage:'legacy-art'}},actor={dataset:{person:id,pose:'standing',avatar:'chibi'},style:{setProperty(k,v){this[k]=v}},querySelector:()=>sprite},requested=[];
  const context=vm.createContext({HaniBuildingScene:building,visualIdentity:{},spriteEntries:new Map([[id,entry]]),hdEntries:new Map(mode==='missing-manifest'?[]:[[id,hdEntry]]),spriteCache:new Map(),Image:class{set src(url){requested.push(url);if(mode==='both-fail'||(mode==='missing-hd'&&url===hdFile))this.onerror();else this.onload();}}});
  vm.runInContext(spriteCode+';globalThis.load=loadSprite;globalThis.setPose=pose;',context);context.load(actor);await flush();
  assert.deepEqual(requested,mode==='hd'?[hdFile]:mode==='missing-manifest'?[file]:[hdFile,file],id+' '+mode+' request order');
  if(mode==='both-fail'){assert.equal(actor.dataset.avatar,'chibi');assert.equal(sprite.style.backgroundImage,'legacy-art','failed HD/v2 preserve existing fallback');continue;}
  const scale=mode==='hd'?3:1,loadedFile=scale===3?hdFile:file;
  assert.equal(sprite.style.backgroundImage,`url("${loadedFile}")`);assert.equal(actor.dataset.avatar,'v2');assert.equal(actor.dataset.spriteScale,String(scale));assert.equal(actor.style['--sprite-ratio'],'0.75');assert.equal(sprite.style.backgroundSize,'800% 800%');
  for(const frame of entry.frames){context.setPose(actor,frame.name);assert.equal(actor.dataset.pose,frame.name);assert.equal(actor.style.transform,'translate(-50%,-95.3125%)');assert.ok(!sprite.style.backgroundPosition.includes('NaN'));}
 }
 const b=fs.readFileSync(path.join(root,file)),meta=await sharp(b).metadata();assert.deepEqual([meta.width,meta.height],[384,512]);assert.ok(meta.hasAlpha);assert.ok(b.length<65000);
 const raw=await sharp(b).ensureAlpha().raw().toBuffer(),frameHashes=[];
 for(let y=0;y<512;y++)for(let x=0;x<384;x++)if(y>=64||x>=192)assert.equal(raw[(y*384+x)*4+3],0,'reserved atlas cells stay transparent');
 for(const f of entry.frames){const {data:px,info}=await sharp(b).extract({left:f.rect[0],top:f.rect[1],width:48,height:64}).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0,clear=0,partial=0;for(let y=0;y<64;y++)for(let x=0;x<48;x++){const a=px[(y*48+x)*4+3];if(a>0)visible++;else clear++;if(a>0&&a<240)partial++;if(x===0||x===47||y===0||y===63)assert.equal(a,0,'transparent frame gutter');}assert.ok(visible>500&&clear>500&&partial>20);frameHashes.push(hash(px));}
 assert.equal(new Set(frameHashes).size,4,'four distinct poses');report.files.push({file,bytes:b.length,width:384,height:512,sha256:hash(b),frameHashes});
}
assert.equal(building.spriteSource('jieun',assets.sprites.entries.find(e=>e.id==='jieun')),'./assets/sprites-v2/jieun.webp');
report.groups.push('actual HD/v2/missing-manifest/both-fail loader outcomes and all four pose transforms retain normalized rect/pivot and 3:4 ratio; 8 v2 frames decoded, alpha/gutters/unused cells/budgets valid');
const ui=read('hani-ui-v02992.js'),profiles=vm.runInNewContext(ui.slice(ui.indexOf('const PAGE_CHARACTER_PROFILES='),ui.indexOf('// Session-memory only:'))+';PAGE_CHARACTER_PROFILES;');
for(const id of ['daon','yoonseul'])assert.equal(profiles[id].image,full(id));
const runtime=['hani-main.js','hani-character-archive-data.js','hani-organization-hub.js','hani-office-live.js','hani-board.js','hani-ilbo.js','hani-ui-v02992.js'];
const literals=new Set(runtime.flatMap(f=>[...read(f).matchAll(/["'](\.\/assets\/[^"'\s]+\.webp)["']/g)].map(m=>m[1])));
for(const f of report.files)assert.ok(literals.has(f.file),f.file+' discoverable literal seed dependency');
report.groups.push('remote character registry and all 11 new assets have enumerable literal references; dynamic images still require an asset seed PR before runtime release');
report.result='PASS';fs.mkdirSync(path.join(root,'artifacts/newface-217'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/newface-217/validation.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS newface-217: '+report.groups.length+' groups / '+report.files.length+' decoded assets; browser verification remains blocked.');
