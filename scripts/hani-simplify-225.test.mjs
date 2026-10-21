import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {delta,withoutSimplify225} from './hani-simplify-225-preservation.mjs';
import {withoutSettings225} from './hani-settings-225-preservation.mjs';
const read=f=>withoutSettings225(f,fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const collect=(s,re)=>[...s.matchAll(re)].map(m=>m[0]).sort();
test('approved presentation hunks preserve all other bytes and untouched mixed EOL in nine source owners',()=>{
 for(const [file,entry] of Object.entries(delta.files)){
  const now=read(file),before=withoutSimplify225(file,now);
  assert.equal(hash(now),entry.afterHash,file+' reviewed source');
  assert.equal(hash(before),entry.beforeHash,file+' every unrelated byte preserved');
  if(file.endsWith('.js'))new vm.Script(now,{filename:file});
  for(const re of [/<(?:button|input|select|textarea|a|iframe)\b[^>]*>/g,/\bdata-(?:view|go|ic|budget-edit|settings-tab|study-tab|remote-action|history-filter)="[^"]+"/g,/\bfor="[^"]+"/g,/\baria-(?:label|labelledby|live|controls)="[^"]+"/g]){
   // New info summaries add accessible labels; existing ones are never removed.
   const a=collect(now,re),b=collect(before,re);
   for(const item of b){const at=a.indexOf(item);assert.ok(at>=0,file+' existing control/route/a11y '+item);a.splice(at,1);}
   if(!String(re).includes('aria-'))assert.deepEqual(a,[],file+' no added functional control');
  }
  for(const re of [/\b(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\([^\n]*/g,/\bhani_os_life_v23\b/g,/2\.9\.15-safe-baseline-bootstrap/g,/(?:v=|v)2\.9\.\d+/g])assert.deepEqual(collect(now,re),collect(before,re),file+' write/key/version surface');
  const oldLines=before.match(/[^\n]*(?:\n|$)/g).filter(Boolean),newLines=now.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
  assert.equal(newLines.length,oldLines.length,file+' source line count');
  for(let i=0;i<oldLines.length;i++)if(oldLines[i].replace(/\r?\n$/,'')===newLines[i].replace(/\r?\n$/,''))assert.equal(newLines[i],oldLines[i],file+' untouched line '+(i+1)+' terminator');
 }
});
test('delta cannot hide a changed control, write, protection notice, approval or EOL',()=>{
 const file='index.html',source=read(file),before=withoutSimplify225(file,source);
 for(const [a,b] of [['id="quickBackup"','id="brokenBackup"'],['id="resetBtn"','id="brokenReset"'],['Local / Cloud 원본 보호 안내','보호 안내 삭제'],['id="deployHinaQaBtn"','id="brokenHina"']]){
  assert.ok(source.includes(a));const mutated=source.replace(a,b);let rejected=false;
  try{rejected=hash(withoutSimplify225(file,mutated))!==delta.files[file].beforeHash;}catch{rejected=true;}
  assert.ok(rejected,a+' mutation remains detectable');
 }
 assert.equal(hash(before),delta.files[file].beforeHash);
 const changed=read('hani-main.js').replace('localStorage.setItem','localStorage.removeItem');
 let rejected=false;try{rejected=hash(withoutSimplify225('hani-main.js',changed))!==delta.files['hani-main.js'].beforeHash;}catch{rejected=true;}
 assert.ok(rejected,'write mutation is never masked');
});
test('all 34 live views resolve through the existing hero owner without explainer nodes; metadata, status, image, quote remain',()=>{
 const ui=read('hani-ui-v02992.js'),html=read('index.html');
 const ids=[...html.matchAll(/<button class="nav-btn[^>]*data-view="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,35);
 const start=ui.indexOf('  const mainCharacterBannerVariants='),end=ui.indexOf('  const mainCharacterInternalViewExists=');
 const ctx=vm.createContext({});vm.runInContext(ui.slice(start,end)+';this.resolve=mainCharacterBannerConfig;',ctx);
 const template=ui.slice(ui.indexOf('  function mainCharacterBanner(id,'),ui.indexOf('  function syncMainCharacterBannerAgent('));
 assert.doesNotMatch(template,/main-character-banner__(?:eyebrow|description)/);
 assert.match(template,/aria-labelledby/);assert.match(template,/image\.alt=config\.sceneAlt/);
 assert.match(template,/data-main-character-banner-agent-slot/);
 assert.equal(ids.filter(id=>id!=='work').length,34);
 for(const id of ids.filter(id=>!['work','aura'].includes(id))){const config=ctx.resolve(id);assert.ok(config,id);assert.ok(config.title&&config.sceneAlt&&config.quote,id+' real artwork/quote metadata');}
 assert.equal(ctx.resolve('aura'),null,'theme studio keeps its own canonical campaign poster');
 assert.match(html,/<section id="aura"/);assert.match(html,/색상은 OS 공통 프레임에/,'theme scope notice retained');
 assert.match(ui,/status\.hidden=!data;status\.textContent=data\?\.text/,'actual statuses retained');
 assert.doesNotMatch(html,/<p id="desc"/);
});
test('rarely used detail is native keyboard-accessible details, with exact historical data and safety wording',()=>{
 const history=read('hani-development-history-v1.js'),before=withoutSimplify225('hani-development-history-v1.js',history);
 const records=s=>s.slice(s.indexOf('const HISTORY='),s.indexOf('  const esc='));assert.equal(records(history),records(before));
 assert.match(history,/<details class="activity-trend-info"><summary>ⓘ 변경 내용<\/summary><p>\$\{esc\(entry.summary\)\}/);
 assert.match(history,/data-history-filter="preview">미리보기/);
 assert.match(read('hani-design-system.css'),/summary:focus-visible\{outline:2px solid var\(--activity-accent,currentColor\)/,'shared info remains keyboard-visible outside activity cards');
 const html=read('index.html');assert.match(html,/<summary aria-label="aiBudget 연결 방법">ⓘ 연결 방법<\/summary>/);
 assert.match(html,/기기 간 자동 공유는 아직 연결하지 않았습니다/);
 assert.match(html,/자동으로 어느 쪽도 덮어쓰지 않습니다/);
 assert.match(html,/초기화 직전 자동 백업/);
 assert.match(html,/Constitution · Hard Stop은 대표 승인 없이 승격하지 않습니다/);
 assert.match(read('hani-main.js'),/mediaBStatus\("완료 · "\+result.count\+"장 보관 확인/);
});
