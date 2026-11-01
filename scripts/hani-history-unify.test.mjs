import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import {assertHistoryCoverage} from './hani-history-coverage.test.mjs';
import {versionSnapshot} from './hani-one-pass-rules.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';

const root=path.resolve(import.meta.dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=JSON.parse(read('assets/data/hani-history-releases-v1.json'));
const feed=JSON.parse(read('assets/data/ai-team-status.json'));
const history=read('hani-development-history-v1.js'),hub=read('hani-organization-hub.js'),main=read('hani-main.js');
const loader=hub.slice(hub.indexOf('  let historyReleases='),hub.indexOf('  function renderOverview(){'));
const memberCode=main.slice(main.indexOf('const developmentTeam='),main.indexOf('// ===== v2.9.0 Campus MVP'));
const plain=value=>JSON.parse(JSON.stringify(value));

// A small DOM adapter, exercising the real mount/update/filter code, not a copy.
function fixture({mode='ok',includeTeam=false,lateHistory=false}={}){
  const listeners=new Map(),requests=[],writes=[],nodes=new Map();let mounts=0,overviewRenders=0;
  function element(){
    const parts=new Map(),value={markup:'',textContent:'',children:[],classList:{contains:()=>false},dataset:{},hidden:false,
      addEventListener(type,fn){this.listeners??={};this.listeners[type]=fn},
      append(child){nodes.set('#'+child.id,child);this.children.push(child);mounts++},
      querySelector(selector){if(!parts.has(selector))parts.set(selector,element());return parts.get(selector)},
      querySelectorAll(selector){return selector==='[data-history-filter]'?this.buttons||[]:selector==='.hani-history-row'?parts.get('.hani-history-list')?.rows||this.rows||[]:[]},
      set innerHTML(html){this.markup=html;
        if(html.includes('data-history-filter'))this.buttons=['all','released','preview','process'].map(filter=>{const button=element();button.dataset.historyFilter=filter;button.classList={toggle:(_,value)=>button.active=value};return button});
        this.rows=[...html.matchAll(/data-history-status="([^"]+)"/g)].map(match=>({dataset:{historyStatus:match[1]},hidden:false}));
        if(html.includes('class="hani-history-list"'))this.querySelector('.hani-history-list').innerHTML=html.split('class="hani-history-list">')[1];
      },get innerHTML(){return this.markup}};
    return value;
  }
  const dev=element(),home=element(),lower=element();lower.after=child=>{nodes.set('#'+child.id,child);mounts++};home.querySelector=()=>lower;
  nodes.set('#dev',dev);nodes.set('#home',home);
  const statusNode=id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)};
  const sandbox={console,Event,AbortController,setTimeout:()=>0,clearTimeout(){},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)},
    dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event)},
    document:{querySelector:selector=>nodes.get(selector)||null,querySelectorAll:()=>[],createElement:element},
    $:statusNode,team:[],agentImages:{},sidebarAgentImages:{},esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'),
    localStorage:{setItem:(...args)=>writes.push(args),removeItem:(...args)=>writes.push(args),clear:()=>writes.push('clear')},
    fetch:async(url,options)=>{
      requests.push(url);assert.equal(options.cache,'no-store');
      if(url==='./assets/data/ai-team-status.json')return {ok:true,json:async()=>structuredClone(feed)};
      assert.equal(url,'./assets/data/hani-history-releases-v1.json');
      if(mode==='network')throw Error('offline');
      return {ok:mode!=='http',json:async()=>{
        if(mode==='json')throw SyntaxError('invalid JSON');
        if(mode==='shape')return {schema:1,entries:[{...catalog.entries[0],date:'2026-02-30'}]};
        return structuredClone(catalog);
      }};
    },renderOverview(){overviewRenders++}};
  const context=vm.createContext(sandbox);context.window=context;
  if(includeTeam)vm.runInContext(memberCode+';renderTeam=()=>{};',context);
  if(!lateHistory)vm.runInContext(history,context);
  vm.runInContext(loader,context);
  if(lateHistory)vm.runInContext(history,context);
  return {context,requests,writes,nodes,statusNode,get mounts(){return mounts},get overviewRenders(){return overviewRenders},dev:()=>nodes.get('#haniDevelopmentHistory'),home:()=>nodes.get('#haniDevelopmentSnapshot')};
}
const settle=()=>new Promise(setImmediate);

test('22 added releases use only the supplied SHA/date/subject, with no invented fields or credits',()=>{
  const source=read('scripts/fixtures/history-unify-releases.txt').trim().split(/\r?\n/).map(line=>{const [commit,date,...rest]=line.split('|');return {commit,date,subject:rest.join('|')}});
  const added=catalog.entries.filter(entry=>{const n=Number(entry.id.split('.').at(-1));return n>=224&&n<=245});
  assert.equal(added.length,22);assert.ok(catalog.entries.length>=117);
  for(const entry of added){
    const record=source.find(row=>row.subject.match(/v2\.9\.\d+/)?.[0]===entry.id);assert.ok(record,entry.id);
    assert.deepEqual(Object.keys(entry).sort(),['id','date','status','title','category','credits','source'].sort());
    assert.deepEqual(entry.source,{commit:record.commit,subject:record.subject});assert.equal(entry.date,record.date);
    assert.equal(entry.status,'released');assert.deepEqual(entry.credits,[]);assert.match(entry.title,/[가-힣]/);assert.ok([...entry.title].length<=24);
  }
  assert.equal(catalog.base,source[0].commit);assert.equal(catalog.asOf,source[0].date);
  assert.deepEqual(catalog.excluded.flatMap(item=>item.versions),['v2.9.176','v2.9.179','v2.9.182','v2.9.124','v2.9.130','v2.9.140','v2.9.141','v2.9.142','v2.9.143']);
  for(let n=120;n<=245;n++){
    const id='v2.9.'+n;
    const included=catalog.entries.some(entry=>entry.id===id),excluded=catalog.excluded.some(item=>item.versions.includes(id));
    assert.notEqual(included,excluded,id+' must be included or explicitly excluded');
    if(n>=224)assert.equal(included,source.some(row=>row.subject.match(/v2\.9\.\d+/)?.[0]===id));
  }
});

test('real merge preserves old/process/preview rows, overrides by id, sorts dates and numeric versions, and never mutates input',()=>{
  const f=fixture(),merge=f.context.HANI_DEVELOPMENT_HISTORY_V1.mergeEntries;
  const legacy=[{id:'v2.9.6',date:'2026-09-01',status:'pages'},{id:'P0',date:'2026-10-04',status:'process'},{id:'preview',date:'2026-10-05',status:'preview'},{id:'v2.9.9',date:'2026-11-01',title:'old'}];
  const releases=[{id:'v2.9.10',date:'2026-11-01',source:{subject:'제목 원문',commit:'a'}},{id:'v2.9.9',date:'2026-11-01',title:'카탈로그',source:{subject:'원문',commit:'b'}}];
  const before=JSON.stringify([legacy,releases]),merged=plain(merge(legacy,releases));
  assert.deepEqual(merged.map(entry=>entry.id),['v2.9.10','v2.9.9','preview','P0','v2.9.6']);
  for(const entry of legacy.slice(0,3))assert.deepEqual(merged.find(row=>row.id===entry.id),entry);
  assert.equal(merged[1].title,'카탈로그');assert.equal(merged[0].summary,'제목 원문');assert.equal(merged[0].ref,'a');
  assert.equal(JSON.stringify([legacy,releases]),before);
});

test('development screen and home use the shared catalog and keep their existing shells and filter events',async()=>{
  const f=fixture(),shell=f.dev(),home=f.home(),button=shell.buttons.find(button=>button.dataset.historyFilter==='preview');
  button.listeners.click();await settle();
  const entries=plain(f.context.HANI_DEVELOPMENT_HISTORY_V1.entries);
  assert.equal(entries[0].id,catalog.entries[0].id);assert.equal(new Set(entries.map(row=>row.id)).size,entries.length);
  for(const id of ['P0','Meeting Preview','Design System P1','Workflow','Travel Places'])assert.ok(entries.some(row=>row.id===id),id);
  assert.equal(entries.find(row=>row.id==='Meeting Preview').status,'preview');
  assert.match(shell.querySelector('.hani-history-list').innerHTML,/v2\.9\.245/);assert.match(home.querySelector('.hani-history-compact').innerHTML,/v2\.9\.245/);
  assert.equal(f.dev(),shell);assert.equal(f.home(),home);assert.equal(f.mounts,2);assert.equal(button.active,true);
  assert.ok(shell.querySelector('.hani-history-list').rows.filter(row=>row.dataset.historyStatus!=='preview').every(row=>row.hidden));
  assert.deepEqual(f.requests,['./assets/data/hani-history-releases-v1.json']);assert.deepEqual(f.writes,[]);
});

for(const mode of ['network','http','json','shape'])test(`shared loader ${mode} failure keeps legacy data, shows a short notice, and caches the failed request`,async()=>{
  const f=fixture({mode}),before=plain(f.context.HANI_DEVELOPMENT_HISTORY_V1.entries);await settle();
  assert.deepEqual(plain(f.context.HANI_DEVELOPMENT_HISTORY_V1.entries),before);
  assert.match(f.dev().querySelector('[data-history-notice]').textContent,/기존 기록/);
  assert.match(f.home().querySelector('[data-history-notice]').textContent,/불러오지 못해/);
  assert.equal(await f.context.HaniReleaseCatalog.load(),null);assert.equal(await f.context.HaniReleaseCatalog.load(),null);
  assert.equal(f.requests.length,1);assert.equal(f.overviewRenders,1);assert.deepEqual(f.writes,[]);
});

test('late development script reuses the loader without depending on a past ready event',async()=>{
  const f=fixture({lateHistory:true});await settle();assert.equal(f.context.HANI_DEVELOPMENT_HISTORY_V1.entries[0].id,catalog.entries[0].id);assert.equal(f.requests.length,1);
});

test('AI summary and profile use catalog release/date while every member work line stays dated and unchanged',async()=>{
  const f=fixture({includeTeam:true});await f.context.loadAiTeamStatus();await settle();
  const summary=f.statusNode('aiTeamStatusSummary').textContent;
  assert.ok(summary.includes(catalog.entries[0].date+' 기준 · 운영 '+catalog.entries[0].id));assert.match(summary,/업무 내용은 2026-10-16 기준/);assert.doesNotMatch(summary,/운영 v2\.9\.214/);
  const members=vm.runInContext('developmentTeam',f.context);
  for(const member of members){
    const original=feed.members.find(row=>row.id===member.imageKey),view=f.context.developmentMemberView(member),meta=f.context.teamMeta(member.key);
    assert.equal(view.desc,original.now[0]+' · 업무 내용은 '+feed.updatedAt+' 기준');
    for(const [a,b] of [['focus','now'],['traits','recent'],['style','next']])assert.deepEqual(plain(meta[a]),original[b]);
    f.context.renderTeamProfile(member.key);const html=f.statusNode('developmentTeamProfilePanel').innerHTML;
    assert.ok(html.includes('업무 내용은 '+feed.updatedAt+' 기준'));assert.ok(html.includes('운영 '+catalog.entries[0].id));assert.doesNotMatch(JSON.stringify(meta.signature),/운영 v2\.9\.214/);
  }
  assert.deepEqual(plain(vm.runInContext('aiTeamStatus',f.context)),feed);
  assert.deepEqual([...f.requests].sort(),['./assets/data/ai-team-status.json','./assets/data/hani-history-releases-v1.json']);assert.deepEqual(f.writes,[]);
});

test('AI catalog failure never presents the member feed version as current production',async()=>{
  const f=fixture({mode:'network',includeTeam:true});await f.context.loadAiTeamStatus();
  assert.match(f.statusNode('aiTeamStatusSummary').textContent,/릴리스 기록을 불러오지 못했어요.*업무 내용은 2026-10-16 기준/);
  assert.doesNotMatch(f.statusNode('aiTeamStatusSummary').textContent,/운영 v/);assert.deepEqual(f.writes,[]);
});

test('late catalog availability updates an already-loaded AI screen without refetching member work',async()=>{
  const f=fixture({includeTeam:true});await f.context.loadAiTeamStatus();
  const load=f.context.HaniReleaseCatalog;delete f.context.HaniReleaseCatalog;
  vm.runInContext('aiTeamRelease=null;renderAiTeamStatusSummary()',f.context);
  assert.match(f.statusNode('aiTeamStatusSummary').textContent,/릴리스 기록을 불러오지 못했어요/);
  f.context.HaniReleaseCatalog=load;f.context.dispatchEvent(new Event('hani-release-catalog-ready'));await settle();
  assert.ok(f.statusNode('aiTeamStatusSummary').textContent.includes(catalog.entries[0].date+' 기준 · 운영 '+catalog.entries[0].id));
  assert.equal(f.requests.filter(url=>url.includes('ai-team-status')).length,1);
  assert.equal(f.requests.filter(url=>url.includes('hani-history-releases')).length,1);
});

test('coverage function passes the displayed version and rejects a fake newer version and an excluded preview',()=>{
  const html=read('index.html'),current=catalog.entries[0].id.slice(1),fake='2.9.'+(Number(current.split('.').at(-1))+1),all=value=>html.split(current).join(value);assert.equal(assertHistoryCoverage(html,catalog),current);
  assert.throws(()=>assertHistoryCoverage(all(fake),catalog),new RegExp('v'+fake.replaceAll('.','\\.')+'.*assets/data/hani-history-releases-v1\\.json'));
  assert.throws(()=>assertHistoryCoverage(all('2.9.179'),catalog),/v2\.9\.179/);
});

test('real coverage CLI body exits 0 now and 1 with a fake newer index (Korean update instruction)',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hani-history-coverage-'));
  try{
    const script=path.join(root,'scripts/hani-history-coverage.test.mjs'),index=path.join(dir,'index.html');
    // Execute the unchanged CLI body in-process; this sandbox blocks subprocesses.
    const code=read('scripts/hani-history-coverage.test.mjs').replace(/^import .*;$/gm,'').replace('export function','function').replaceAll('import.meta.url','scriptURL');
    function run(args=[]){const output={stdout:'',stderr:''},process={argv:['node',script,...args],exitCode:0};vm.runInNewContext(code,{fs,path,pathToFileURL,URL,versionSnapshot,scriptURL:pathToFileURL(script).href,process,console:{log:value=>output.stdout+=value,error:value=>output.stderr+=value}});return {...output,status:process.exitCode}}
    const current=catalog.entries[0].id.slice(1),fake='2.9.'+(Number(current.split('.').at(-1))+1);
    const good=run();assert.equal(good.status,0,good.stderr);assert.ok(good.stdout.includes('v'+current));
    fs.writeFileSync(index,read('index.html').split(current).join(fake));
    const bad=run(['--index',index]);assert.equal(bad.status,1,bad.stderr);assert.match(bad.stderr,new RegExp('v'+fake.replaceAll('.','\\.')+'.*assets/data/hani-history-releases-v1\\.json.*작성'));
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('one literal release fetch and unchanged 128-file runtime closure with no missing files',async()=>{
  assert.equal([history,hub,main].join('\n').match(/fetch\(['"]\.\/assets\/data\/hani-history-releases-v1\.json/g)?.length,1);
  const closure=await resolveRuntimeClosure({read:file=>fs.readFileSync(path.join(root,file)),exists:file=>fs.existsSync(path.join(root,file))});
  assert.deepEqual(closure.missing,[]);assert.equal(closure.files.length,128);
});
