import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import inverse from './hani-m9-polish-source.cjs';
const {delta,hash,restore}=inverse,read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('exact polish inverse round-trips all bytes and rejects unrelated, partial and duplicate changes',()=>{
  for(const row of delta.files){
    const source=read(row.file),before=restore(source,row.file);assert.equal(hash(before),row.beforeSha256);
    let forward=before;for(const r of row.replacements){assert.equal(forward.split(r.before).length-1,1);forward=forward.replace(r.before,()=>r.after);assert.throws(()=>restore(source.replace(r.after,()=>r.before),row.file));assert.throws(()=>restore(source+r.after,row.file));}
    assert.equal(forward,source);for(const bad of [source+'\n',source.slice(1),before])assert.throws(()=>restore(bad,row.file));
  }
});
test('actual card and detail owners change only the special badge and Seoyun note',()=>{
  const require=createRequire(import.meta.url),current=require('../hani-character-archive.js');
  const module={exports:{}};vm.runInNewContext(restore(read('hani-character-archive.js'),'hani-character-archive.js'),{module,require:createRequire(new URL('../hani-character-archive.js',import.meta.url))});
  assert.equal(current.page().replace('<span class="ca-planned-badge">M9 특별 합류</span>','<span class="ca-planned-badge">M9 특별 합류 · Platform Architect</span>'),module.exports.page());
  const source=read('hani-organization-hub.js'),before=restore(source,'hani-organization-hub.js');
  const data=require('../hani-character-archive-data.js');
  function render(code){
    // Use the actual roster initialization and renderer, with inert DOM dependencies.
    const rosterContext={window:{HANI_CHARACTER_ARCHIVE_DATA:data},document:{getElementById:()=>null}};
    vm.runInNewContext(code.slice(code.indexOf("  'use strict';"),code.indexOf('  if (!root'))+'window.testPeople=people;',rosterContext);
    const roster=rosterContext.window.testPeople,ctx=vm.createContext({esc:x=>x});
    const start=code.indexOf('  function showDetail('),end=code.indexOf('  function selectTeam(',start);
    Object.assign(ctx,{people:roster,teams:[],root:{querySelector:()=>({focus(){}})},dialog:{style:{setProperty(){}},showModal(){}},detail:{innerHTML:''},teamOf:()=>({id:'platform',en:'PLATFORM'}),DETAIL_TITLE_OPEN:'<h2>',portrait:p=>p.id,plannedBadge:()=>'',specialListingBadge:()=>'',tags:()=>''});
    vm.runInContext(code.slice(start,end),ctx);return Object.fromEntries(roster.map(p=>{ctx.showDetail('person',p.id);return [p.id,ctx.detail.innerHTML];}));
  }
  const actual=render(source),original=render(before);assert.equal(Object.keys(actual).length,19);
  assert.match(actual.seoyun,/M9 특별 합류 · Platform Architect \(하니 전무 승인\)/);assert.doesNotMatch(actual.seoyun,/신규 이름·역할은 제안안/);
  for(const id of Object.keys(actual))if(id!=='seoyun')assert.equal(actual[id],original[id],id);
  assert.match(actual.mir,/신규 이름·역할은 제안안/);
});
