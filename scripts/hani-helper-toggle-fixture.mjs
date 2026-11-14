// Reuse only the established helper DOM/event fixture, never its test bodies.
// The app source is read with the captured raw reader, outside legacy projection.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import inverse from './hani-helper-toggle-source.cjs';
const read=file=>inverse.readRawFileSync(new URL('../'+file,import.meta.url),'utf8');
const ui=read('hani-ui-v02992.js'),source=ui.slice(ui.indexOf('// BEGIN HANI HELPER BOT'));
const roster={window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}};
vm.runInNewContext(read('hani-organization-hub.js'),roster);
const old=read('scripts/hani-helper-bot.test.mjs');
let fixture=old.slice(old.indexOf('function fixture('),old.indexOf('// END HANI HELPER TEST FIXTURE'));
assert.ok(fixture.startsWith('function fixture('));
const start=fixture.indexOf('  let saved=stored;'),end=fixture.indexOf('  class Clock',start);
assert.ok(start>0&&end>start,'established fixture storage seam');
fixture=fixture.slice(0,start)+`  let saved=stored;
  const storage={getItem(key){storageCalls.push(['getItem',key]);if(storageFails)throw Error('unavailable');return key==='hani_helper_pos_v1'?saved:hiddenStorage.value;},
    setItem(key,value){storageCalls.push(['setItem',key,value]);if(storageFails)throw Error('full');if(key==='hani_helper_pos_v1')saved=value;else if(key==='hani_helper_hidden_v1')hiddenStorage.value=value;else throw Error('unexpected storage write '+key);},
    removeItem(){throw Error('unexpected removal');},clear(){throw Error('unexpected clear');}};
  const settings=new Element('section');settings.id='settings';body.append(settings);
  const display=new Element('details');display.id='group-display';settings.append(display);
  const host=new Element('div');host.setAttribute('class','settings-group-body');display.append(host);
`+fixture.slice(end);
fixture=fixture.replace('fetch:async(url,opts)=>','toast:message=>notices.push(message),\n    fetch:async(url,opts)=>');
assert.ok(fixture.includes('toast:message=>notices.push(message)'));
fixture=fixture.replace('const window={innerWidth:', 'const window={HaniFunPreview:helperFunPreview,innerWidth:');
assert.ok(fixture.includes('HaniFunPreview:helperFunPreview'));
export function createFixture({hidden=null,funPreview,...options}={}){
 const hiddenStorage={value:hidden},notices=[];
 const make=vm.runInNewContext('('+fixture+')',{
  assert,vm,source,staff:roster.window.HaniOrganizationRoster.people,
  tapBank:JSON.parse(read('assets/data/office-tap-lines-v1.json')),
  releases:JSON.parse(read('assets/data/hani-history-releases-v1.json')),hiddenStorage,notices,helperFunPreview:funPreview
 });
 return {...make(options),hiddenStorage,notices};
}
export {source,read};
