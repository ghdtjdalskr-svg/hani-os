import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {remote217Oracle} from './hani-remote-217-oracle.mjs';
import {heroRestoreDelta,withoutHeroRestore} from './hani-hero-restore-preservation.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const sharp=createRequire(process.env.HANI_PLAYWRIGHT||'C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')('sharp');
const ui=read('hani-ui-v02992.js'),remote=read('hani-context-remote-v1.js'),css=read('hani-design-system.css');
const ctx=vm.createContext({});
vm.runInContext(ui.slice(ui.indexOf('  const mainCharacterBannerVariants='),ui.indexOf('  const mainCharacterInternalViewExists='))+';this.resolve=mainCharacterBannerConfig;this.menus=mainCharacterSidebarMenuConfig;',ctx);

test('all canonical page scenes decode as wide; all season heroes remain wide; 218 owners and casts retained',async()=>{
 for(const [id,c] of Object.entries(ctx.menus)){
  const m=await sharp(fileURLToPath(new URL('../'+c.sceneImage,import.meta.url))).metadata();
  assert.ok(m.width/m.height>2.8&&m.width/m.height<3.2,id+' ~3:1');
  assert.equal(c.sceneFit,'cover',id);assert.equal(c.sceneFitMobile,'cover',id);assert.match(c.scenePositionMobile,/% center$/);
  assert.ok(c.eyebrow&&c.title&&c.description&&c.quote,id+' complete text');assert.ok(c.description.length<=26,id+' one short subtitle');
 }
 for(const s of ['spring','summer','autumn','winter']){const m=await sharp(fileURLToPath(new URL('../assets/seasonal-collection/'+s+'-v2.webp',import.meta.url))).metadata();assert.ok(m.width/m.height>2.8);}
 assert.equal(ctx.resolve('university').owner,'hina');assert.match(ctx.resolve('university').sceneAlt,/히나/);
 assert.equal(ctx.resolve('reading').owner,'haru');assert.match(ctx.resolve('reading').sceneAlt,/윤슬.*하루/);
 assert.equal(ctx.resolve('movie').owner,'minji');assert.equal(ctx.resolve('movie').sceneImage,'./assets/design-system-v1/hina-cinema-canonical.webp','explicit 217 art exception');
 for(const file of JSON.parse(read('scripts/fixtures/hero-restore-new-art.json'))){const bytes=fs.readFileSync(new URL('../'+file.file,import.meta.url));assert.ok(bytes.length<=150000);assert.equal(bytes.length,file.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256,file.file+' released asset');assert.ok(file.file.endsWith('-226w.webp'));}
});

test('existing hero renderer updates a persistent slot, paints eyebrow/subtitle and keeps a wide fallback',()=>{
 const nodes=new Map(),root={children:[],prepend(n){this.children.unshift(n)}},style={setProperty(){},removeProperty(){}};
 const el={dataset:{},style,setAttribute(){},removeAttribute(){},set innerHTML(s){this.template=s;for(const c of [...s.matchAll(/class="([^"]+)"/g)])for(const name of c[1].split(' '))nodes.set('.'+name,{textContent:'',style});nodes.set('.ds-main-character-banner__scene img',{getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v}})}};
 const env=vm.createContext({q:(selector,scope)=>selector==='#reading'?root:selector===':scope > .ds-main-character-banner'?root.children[0]:nodes.get(selector),document:{createElement:()=>el},mainCharacterBannerVariants:new Set(['duo-or-trio','single-character','group']),titled:()=>'',config:ctx.resolve('reading')});
 vm.runInContext(ui.slice(ui.indexOf('  function mainCharacterBanner(id,'),ui.indexOf('  function syncMainCharacterBannerAgent('))+';this.render=mainCharacterBanner;',env);
 const first=env.render('reading',env.config),image=nodes.get('.ds-main-character-banner__scene img');
 assert.equal(root.children.length,1);assert.equal(nodes.get('.ds-main-character-banner__eyebrow').textContent,env.config.eyebrow);assert.equal(nodes.get('.ds-main-character-banner__description').textContent,env.config.description);
 for(let i=0;i<25;i++)assert.equal(env.render('reading',{...env.config,title:'갱신 '+i}),first);
 assert.equal(root.children.length,1);assert.equal(nodes.get('.ds-main-character-banner__scene img'),image);
 assert.match(el.template,/data-main-character-banner-agent-slot/);image.onerror();assert.equal(image.src,'./assets/team/hani-team-office-active-v2.jpg');
 assert.match(css,/mask-image:var\(--mcb-scene-mask\)/);assert.doesNotMatch(css,/data-scene-variant="illustration(?:-wide)?-218"/);
 assert.doesNotMatch(css,/#app #game>\.ds-main-character-banner\{--mcb-scene-mask:none\}/);
});

test('Remote matches the real 217 selection for every screen/season and RNG branch; all 12 assets are tall',async()=>{
 const reference=remote217Oracle();assert.equal(reference.files.length,12);
 for(const file of reference.files){const m=await sharp(fileURLToPath(new URL('../assets/context-remote/'+file,import.meta.url))).metadata();assert.ok(m.height/m.width>=1.6,file+' tall portrait');if(file.endsWith('-v1.jpg')){assert.equal(m.width,600,file);assert.equal(m.height,1000,file);}}
 for(const fallback of [false,true])for(const value of [0,1,2,3,4,5,0x80000000,0xffffffff]){
  const nodes=new Map();let view='movie',season='autumn',writes=0,calls=0,previous=null;
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{style:{},getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v}});return nodes.get(selector)};
  const env=vm.createContext({rail:{},$:node,viewId:()=>view,season:()=>season,crypto:fallback?undefined:{getRandomValues(a){calls++;a[0]=value;return a}},Math:Object.assign(Object.create(Math),{random(){calls++;return value/0x100000000}}),greetings:{spring:['','봄'],summer:['','여름'],autumn:['','가을'],winter:['','겨울']},window:{HANI_MAIN_CHARACTER_BANNER:{get:id=>({speaker:id,quote:id,get sceneImage(){throw Error('remote must never read a page hero image')}})}},localStorage:{setItem(){writes++},removeItem(){writes++},clear(){writes++}}});
  vm.runInContext(remote.slice(remote.indexOf('  const sharedBanners='),remote.indexOf('  const updateToday='))+';this.render=updateBanner;',env);
  const oracle=remote217Oracle(()=>value,{fallback});
  for(const s of ['autumn','spring','summer','winter','autumn'])for(const id of [...Object.keys(ctx.menus),'aura','unknown']){
   view=id;season=s;const changed=previous!==null&&previous!==s,expected=oracle.select(id,s,{changed});previous=s;
   env.render({primary:'입력',recent:'기록'},id);const image=node('.hani-remote-media-image');
   assert.equal(image.src,expected,id+'/'+s+'/'+value+'/'+fallback);assert.match(image.src,/^\.\/assets\/context-remote\//);assert.equal(image.style.objectPosition,'50% 30%');
   assert.equal(node('[data-remote-media-title]').textContent,id);assert.equal(node('[data-remote-media-staff]').textContent,'담당 직원 · '+id);assert.equal(node('.hani-remote-media [data-remote-action="primary"]')['aria-label'],'입력');
   const count=calls;for(let i=0;i<3;i++)env.render({},'hero text changed');assert.equal(image.src,expected,'text/hero updates do not reroll');assert.equal(calls,count);
  }
  const slots=[...nodes.values()];for(let i=0;i<25;i++)env.render({},'반복');assert.deepEqual([...nodes.values()],slots);assert.equal(writes,0);
 }
 assert.equal((remote.match(/rail\.addEventListener\("click"/g)||[]).length,1);assert.doesNotMatch(remote,/MutationObserver/);
 assert.match(read('hani-context-remote.css'),/transparent 55%,#0a0a14de 64%/,'bottom-only scrim retained');
});

test('exact UI delta is reversible; no storage, Cloud, version or unrelated control path is hidden',()=>{
 for(const [file,hunks] of Object.entries(heroRestoreDelta.files)){
  const source=read(file),old=withoutHeroRestore(file,source);new vm.Script(file.endsWith('.js')?source:'');
  const collect=(s,re)=>[...s.matchAll(re)].map(m=>m[0]);
  for(const re of [/\b(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g,/\.\s*(?:insert|update|delete|upsert)\s*\([^\n]*/g,/hani_os_life_v23/g,/2\.9\.15-safe-baseline-bootstrap/g,/(?:v=|v)2\.9\.\d+/g,/data-(?:view|go|remote-action)="[^"]+"/g])assert.deepEqual(collect(source,re),collect(old,re),file+' protected path');
  for(const h of hunks){assert.doesNotMatch(h.new_str,/localStorage\.(?:setItem|clear|removeItem)|supabase/i);}
  assert.throws(()=>withoutHeroRestore(file,source.replace(hunks.filter(h=>h.new_str).at(-1).new_str,'drift')));
 }
});
