import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const main=read('hani-main.js'),html=read('index.html'),css=read('hani-style-01.css');
const source=main.replace(/\r\n/g,'\n');
const extract=(text,name)=>{const hit=text.match(new RegExp('(?:async )?function '+name+'\\([^]*?\\n\\}'));assert.ok(hit,name);return hit[0]};
const seasons=['spring','summer','autumn','winter'];
const slots=seasons.map(key=>({dataset:{loginSeasonArtwork:key},attrs:{},active:false,writes:0,getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v;this.writes++},classList:{toggle(_name,active){slots.find(s=>s.dataset.loginSeasonArtwork===key).active=active}}}));
const nodes=new Map();
const node=id=>nodes.get(id)||nodes.set(id,{attrs:{},textContent:'',getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v}}).get(id);
let storageCalls=0;
const ctx=vm.createContext({document:{documentElement:{dataset:{season:'autumn',finish:'porcelain-cream'}},querySelectorAll:s=>s==='[data-login-season-artwork]'?slots:[]},$:node,
  localStorage:{setItem(){storageCalls++}},SEASON_THEME_KEY:'hani_os_season_theme_v1',updateFinishScope(){},setTimeout(){},clearTimeout(){},activeAccountId:null});
vm.runInContext(source.slice(source.indexOf('const SEASON_THEMES='),source.indexOf('function syncSeasonCollection'))+extract(source,'syncSeasonCollection')+'\n'+extract(source,'applySeasonTheme')+'\n'+extract(source,'defaultSeasonTheme'),ctx);
ctx.syncSeasonCollection();assert.equal(slots.find(s=>s.active).dataset.loginSeasonArtwork,'autumn');
for(const key of [...seasons,'spring','winter','summer']){
  ctx.applySeasonTheme(key,false);
  assert.deepEqual(slots.filter(s=>s.active).map(s=>s.dataset.loginSeasonArtwork),[key],'exactly one instant active slot');
  assert.equal(slots.find(s=>s.active).attrs.src,'./assets/seasonal-collection/'+key+'-v2.webp');
  for(const slot of slots)assert.equal(slot.writes,1,'persistent preloaded sources are not recreated/reloaded');
}
ctx.applySeasonTheme('invalid',false);assert.equal(slots.find(s=>s.active).dataset.loginSeasonArtwork,'spring');
assert.equal(storageCalls,0,'all read-only previews preserve existing persistence semantics');
ctx.applySeasonTheme('winter',true);assert.equal(storageCalls,1,'only canonical saveChoice writes');
for(const [month,season] of [[0,'winter'],[3,'spring'],[6,'summer'],[9,'autumn']]){
  ctx.Date=class extends Date{getMonth(){return month}};
  ctx.applySeasonTheme(ctx.defaultSeasonTheme(),false);assert.equal(slots.find(s=>s.active).dataset.loginSeasonArtwork,season);
}
for(const key of seasons){assert.ok(fs.statSync(path.join(root,'assets/seasonal-collection/'+key+'-v2.webp')).size>0);assert.equal(html.split('data-login-season-artwork="'+key+'"').length,2)}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique static DOM IDs');
for(const id of ['loginCharacterPhoto','loginCharacterName','loginCharacterRole','loginCharacterQuote'])assert.equal(ids.filter(x=>x===id).length,1);
assert.match(css,/object-fit:cover/);assert.match(css,/\.login-season-artwork img\{[^}]*transition:opacity \.2s ease/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.login-season-artwork img\{transition:none\}\}/);
assert.match(css,/\.login-gate #loginGateFinish\{[^}]*repeat\(5,minmax\(0,1fr\)\)/);
assert.match(css,/@media\(max-width:820px\)\{\.login-gate #loginGateFinish\{grid-template-columns:repeat\(3/);
const lum=hex=>hex.slice(1).match(/../g).map(v=>{const c=parseInt(v,16)/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const badges=[...css.matchAll(/#sidebar \.nav-new-pill\{[^}]*color:(#[0-9a-f]{6});background:(#[0-9a-f]{6})/g)];
assert.equal(badges.length,2);for(const [,fg,bg] of badges)assert.ok(contrast(fg,bg)>=4.5,fg+' / '+bg+' AA');
// Worst-case partner surface: .96 warm white over black, rounded down.
for(const fg of ['#292a2d','#514b44','#69513a'])assert.ok(contrast(fg,'#f4f0e9')>=4.5,'partner text AA '+fg);
// White brand over the lightest artwork at the weakest scrim under text (.58).
assert.ok(contrast('#ffffff','#6c6f73')>=4.5,'brand scrim AA');
assert.doesNotMatch(source.slice(source.indexOf('// Persistent login artwork slots'),source.indexOf('  if(image&&artwork)')),/localStorage|commit\(|save\(|addEventListener|\.clear\(/);
const baseDir=process.argv[2]?path.resolve(process.argv[2]):null;
let baseline;
try{
  baseline=Object.fromEntries(['hani-main.js','index.html'].map(file=>[file,baseDir?fs.readFileSync(path.join(baseDir,file),'utf8'):execFileSync('git',['show','origin/main:'+file],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024})]));
}catch(error){
  if(baseDir||!['ENOENT','EPERM','EACCES'].includes(error.code))throw error;
  console.warn('SKIP login preservation checks: git unavailable for execution ('+error.code+'); runtime/DOM/contrast checks passed.');
}
if(baseline){
const baseMain=baseline['hani-main.js'];
const added=main.match(/  \/\/ Persistent login artwork slots[^]*?  \}\);\r?\n/)[0];
if(baseDir)assert.equal(main.replace(added,''),baseMain,'only canonical artwork sync changes; auth/write/version paths byte-identical');
else assert.equal(extract(main.replace(added,'').replace(/\r\n/g,'\n'),'syncSeasonCollection'),extract(baseMain.replace(/\r\n/g,'\n'),'syncSeasonCollection'),'canonical artwork sync preserves baseline behavior alongside integrated features');
for(const file of ['hani-main.js','index.html']){
  const baseSource=baseline[file],lines=s=>s.match(/[^\n]*(?:\n|$)/g).filter(Boolean),old=new Map(),ambiguous=new Set();
  for(const line of lines(baseSource)){const text=line.replace(/\r?\n$/,'');if(old.has(text)&&old.get(text)!==line)ambiguous.add(text);old.set(text,line)}
  for(const text of ambiguous)old.delete(text);
  for(const line of lines(read(file))){const text=line.replace(/\r?\n$/,'');if(old.has(text))assert.equal(line,old.get(text),file+' retained EOL '+text.slice(0,50))}
}
const baseHtml=baseline['index.html'];
for(const id of ['loginCharacterPhoto','loginCharacterName','loginCharacterRole','loginCharacterQuote']){
  const ending=text=>text.match(new RegExp('[^\\n]*id="'+id+'"[^\\n]*(\\n|$)'))[0].match(/\r?\n$/)?.[0];
  assert.equal(ending(html),ending(baseHtml),'moved partner line keeps its EOL '+id);
}
for(const name of ['initLoginGate','loginGateEnterApp','loginGateSubmit','loginGateForgotPassword','loginGateSaveRecoveryPassword','randomizeLoginCharacter','syncLoginThemeButtons','applySeasonTheme','applySignatureFinish','save','commit','writeProtectedState','removeProtectedState'])assert.equal(extract(source,name),extract(baseMain.replace(/\r\n/g,'\n'),name),name+' unchanged');
for(const name of ['VERSION','STORAGE_KEY','HANI_DISPLAY_VERSION']){
  const declaration=text=>text.match(new RegExp('const '+name+'=[^;\\n]+;'))?.[0];
  assert.ok(declaration(main),name+' present');assert.equal(declaration(main),declaration(baseMain),name+' unchanged');
}
}
console.log((baseline?'PASS':'PARTIAL PASS')+' login-a-204: live Season/default slots, source reuse, no preview writes, AA badge/overlay/scrim, unique IDs'+(baseline?', unchanged auth/storage/version and retained mixed EOL':' (preservation checks SKIPPED)'));
