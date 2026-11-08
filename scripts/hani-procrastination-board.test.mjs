import './hani-pb-chibitoon-legacy-preload.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {runBoardCases,makeBoardFixture,runRenderCases} from './hani-procrastination-cases.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {readLifeBaseline as readBranchBaseline} from './hani-life-bundle-source.mjs';
import {readLifeSource,restoreLifeLayer,readRawLifeFile} from './hani-life-bundle-source.mjs';
const read=file=>readLifeSource(file,'procrastination');
const source=read('hani-procrastination-board.js'),main=read('hani-main.js'),html=read('index.html');
const writes=[];
const forbidden=new Proxy({}, {get:(_target,name)=>{writes.push(String(name));throw new Error('Forbidden side effect '+String(name))}});
const window={},context=vm.createContext({window,localStorage:forbidden,sessionStorage:forbidden,fetch:forbidden,setTimeout:forbidden,setInterval:forbidden});
vm.runInContext(source,context);
test('KST, all item ages, stage boundaries, unknown/corrupt data, completion and immutable source',()=>{
  assert.ok(runBoardCases(window.HaniProcrastination,assert)>=120);
  assert.deepEqual(writes,[]);
});
test('syntax, zero new write/listener/timer path and existing owner integration',()=>{
  new vm.Script(main);new vm.Script(source);
  assert.doesNotMatch(source,/localStorage|sessionStorage|\.setItem\(|\.removeItem\(|\.clear\(|\bfetch\(|\bcommit\(|\bsave\(|\.from\(|\.upsert\(|\.insert\(|\.delete\(|addEventListener|setTimeout|setInterval|MutationObserver/);
  assert.match(main,/if\(id==="procrastination"\)window.HaniProcrastination\?\.render\(state\)/);
  assert.match(main,/PROCRASTINATION REFRESH/);
  assert.doesNotMatch(main.match(/const NAVIGATION_VIEWS=.*?;/)[0],/procrastination/,'do not add navigation persistence');
});
test('persistent cards, actual click result, immediate reset and no side effects',()=>{
  runRenderCases(source,assert,(code,env)=>vm.runInNewContext(code,env));
});
test('only one new menu; all destinations are canonical pre-existing nav routes',()=>{
  const views=[...html.matchAll(/data-view="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(views.filter(v=>v==='procrastination').length,1);
  for(const row of window.HaniProcrastination.project(makeBoardFixture(),'2026-11-08'))assert.ok(views.includes(row.route),row.route);
  assert.match(source,/onclick = \(\) => showView\(item.route\)/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
});
test('exact inverse restores all pre-existing menu, view, event and render bytes',()=>{
  const code=read('scripts/hani-procrastination-inverse.mjs');
  const fn=code.slice(code.indexOf('export function withoutProcrastination')).replace('export ','');
  const inverse=vm.runInNewContext('('+fn+')');
  for(const file of ['index.html','hani-main.js'])assert.equal(inverse(read(file),file),readBranchBaseline(file).replace(/\r\n/g,'\n'),file);
  for(const file of ['index.html','hani-main.js'])assert.equal(restoreLifeLayer(read(file),file,'procrastination'),readBranchBaseline(file),file+' exact mixed-EOL inverse');
  assert.equal(read('hani-ui-v02992.js'),readBranchBaseline('hani-ui-v02992.js'),'existing UI owner untouched');
});
test('existing artwork is reachable in the runtime closure, within 200 files',async()=>{
  const closure=await resolveRuntimeClosure({exists:file=>fs.existsSync(new URL('../'+file,import.meta.url)),read:file=>readRawLifeFile(new URL('../'+file,import.meta.url))});
  assert.deepEqual(closure.missing,[]);assert.ok(closure.files.length<=200);
  for(const file of ['hani-procrastination-board.js','hani-procrastination-board.css',...Object.values(window.HaniProcrastination.project({})).map(r=>r.staff.image.replace(/^\.\//,''))])assert.ok(closure.files.includes(file),file);
});
