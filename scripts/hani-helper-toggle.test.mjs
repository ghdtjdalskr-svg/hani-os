import test from 'node:test';
import assert from 'node:assert/strict';
import inverse from './hani-helper-toggle-source.cjs';
import repository from './hani-test-repository-evidence.cjs';
import {createFixture,source,read} from './hani-helper-toggle-fixture.mjs';
const key='hani_helper_hidden_v1';
const writes=f=>JSON.parse(JSON.stringify(f.storageCalls.filter(c=>c[0]!=='getItem')));
const nodes=f=>({bot:f.document.getElementById('haniHelperBot'),switch:f.document.getElementById('haniHelperSettings').querySelector('[data-helper-visibility]')});
const ready=async opts=>{const f=createFixture(opts);await f.ready();return f};

test('exact inverse restores independent main296 bytes; drift and double inverse rejected',()=>{
 for(const file of Object.keys(inverse.delta.files)){
  const raw=read(file),base=repository.read(inverse.delta.base,file);
  assert.equal(inverse.restore(raw,file),base);
  assert.deepEqual(inverse.restore(Buffer.from(raw),file),Buffer.from(base));
  const forward=inverse.delta.files[file].edits.reduce((s,e)=>{assert.equal(s.split(e.before).length-1,1);return s.replace(e.before,()=>e.after)},base);
  assert.equal(forward,raw);
  for(const bad of [raw+'\n',raw.slice(1),base,raw+raw,raw.replace(/\r?\n/,s=>s==='\n'?'\r\n':'\n')]){
   assert.throws(()=>inverse.restore(bad,file),/exact helper toggle input/);assert.equal(inverse.project(bad,file),bad);
  }
  assert.equal(read(file),raw,'disk remains raw toggle');
 }
 assert.equal(inverse.project('unknown','other'),'unknown');
 assert.throws(()=>inverse.restore('unknown','other'),/known helper toggle owner/);
});

test('missing preference defaults on, one persistent settings card, no startup writes',async()=>{
 const f=await ready(),n=nodes(f);
 assert.equal(n.bot.hidden,false);assert.equal(n.switch.getAttribute('role'),'switch');
 assert.equal(n.switch.getAttribute('aria-checked'),'true');assert.equal(n.switch.textContent,'켜짐');
 assert.equal(n.bot.querySelector('[data-helper-hide]').getAttribute('aria-label'),'도우미 숨기기');
 for(const id of ['settings','home','settings'])f.navigate(id);
 f.api.update();f.flush();f.rerun();await f.ready();
 assert.equal(nodes(f).switch,n.switch);assert.equal(f.document.querySelectorAll('#haniHelperSettings').length,1);
 assert.deepEqual(writes(f),[]);
});

test('hide click writes only 1, closes speech, one toast, survives navigation and reload',async()=>{
 const f=await ready(),{bot,switch:toggle}=nodes(f);
 f.fire('click',bot.querySelector('.hani-helper-face'));
 assert.equal(bot.querySelector('#haniHelperSpeech').hidden,false);
 f.fire('click',bot.querySelector('[data-helper-hide]'));
 assert.equal(bot.hidden,true);assert.equal(bot.dataset.helperReason,'user-hidden');
 assert.equal(bot.querySelector('#haniHelperSpeech').hidden,true);assert.equal(toggle.getAttribute('aria-checked'),'false');
 for(const id of ['tasks','settings','home'])f.navigate(id);
 f.api.update();f.flush();assert.equal(bot.hidden,true);
 assert.deepEqual(f.notices,['설정에서 다시 켤 수 있어요']);assert.deepEqual(writes(f),[['setItem',key,'1']]);
 const reloaded=await ready({hidden:f.hiddenStorage.value});assert.equal(nodes(reloaded).bot.hidden,true);assert.deepEqual(writes(reloaded),[]);
});

test('settings turns on immediately at saved position, persists 0 through reload, can turn off again',async()=>{
 const stored='{"x":0.2,"y":0.3,"v":1}',f=await ready({hidden:'1',stored}),{bot,switch:toggle}=nodes(f);
 f.navigate('settings');f.fire('click',toggle);
 assert.equal(f.hiddenStorage.value,'0');assert.equal(bot.hidden,false);assert.equal(toggle.getAttribute('aria-checked'),'true');
 assert.equal(bot.style.left,'78px');assert.equal(bot.style.top,'253.2px');assert.equal(f.saved(),stored);
 assert.deepEqual(writes(f),[['setItem',key,'0']]);
 const reloaded=await ready({hidden:'0',stored});assert.equal(nodes(reloaded).bot.hidden,false);
 f.fire('click',toggle);assert.equal(bot.hidden,true);assert.equal(f.hiddenStorage.value,'1');
 assert.deepEqual(writes(f),[['setItem',key,'0'],['setItem',key,'1']]);
});

test('corrupt preference and read failure default on; denied writes keep session toggle usable',async()=>{
 for(const hidden of [null,'0','','broken','true','null','[]','{}','"1"',' 1','1 ','2','01']){
  const f=await ready({hidden});assert.equal(nodes(f).bot.hidden,false,String(hidden));assert.deepEqual(writes(f),[]);
 }
 const f=await ready({hidden:'1',storageFails:true}),{bot,switch:toggle}=nodes(f);
 assert.equal(bot.hidden,false);f.fire('click',toggle);assert.equal(bot.hidden,true);
 f.fire('click',toggle);assert.equal(bot.hidden,false);
 assert.deepEqual(writes(f),[['setItem',key,'1'],['setItem',key,'0']]);
});

test('login/modal gates still own visibility; show preference never bypasses them',async()=>{
 const f=await ready({hidden:'1'}),{bot,switch:toggle}=nodes(f);
 f.navigate('login');f.fire('click',toggle);assert.equal(toggle.getAttribute('aria-checked'),'true');assert.equal(bot.hidden,true);assert.equal(bot.dataset.helperReason,'login');
 f.navigate('home');assert.equal(bot.hidden,false);
 const modal=new f.Element('dialog');modal.setAttribute('open','');modal.box={left:0,top:0,width:100,height:100};f.document.body.append(modal);f.mutate(modal);assert.equal(bot.hidden,true);assert.equal(bot.dataset.helperReason,'modal');
 f.fire('click',toggle);f.fire('click',toggle);assert.equal(bot.hidden,true);
 modal.hidden=true;f.mutate(modal);assert.equal(bot.hidden,false);
});

test('390/1440 use existing click route with no extra listeners/timers, other-key writes or Cloud calls',async()=>{
 const base=repository.read(inverse.delta.base,'hani-ui-v02992.js').slice(repository.read(inverse.delta.base,'hani-ui-v02992.js').indexOf('// BEGIN HANI HELPER BOT'));
 for(const token of ['addEventListener(', 'setInterval(', 'setTimeout(', 'MutationObserver(', 'writePosition('])assert.equal(source.split(token).length,base.split(token).length,token);
 for(const width of [390,1440]){
  const f=await ready(),{bot,switch:toggle}=nodes(f);f.resize(width,900);
  const before=new Map([...f.callbacks].map(([k,v])=>[k,v.length]));
  f.fire('click',bot.querySelector('[data-helper-hide]'));f.navigate('settings');f.fire('click',toggle);f.navigate('home');
  assert.deepEqual(new Map([...f.callbacks].map(([k,v])=>[k,v.length])),before);assert.equal(f.callbacks.get('document:click').length,1);
  assert.deepEqual(writes(f),[['setItem',key,'1'],['setItem',key,'0']]);
  assert.equal(f.storageCalls.filter(c=>c[0]!=='getItem'&&c[1]!==key).length,0);
  assert.deepEqual(Array.from(f.requests,r=>r.url).sort(),['./assets/data/hani-history-releases-v1.json','./assets/data/office-tap-lines-v1.json']);
  assert.ok(f.requests.every(r=>!r.opts.method||r.opts.method==='GET'));
 }
});

test('hide button is last in helper home after existing fun mount, keeps the same helper nodes and duty',async()=>{
 const funPreview={refresh(){},hide(){},action(){return false},mount(root,panel){
  const entries=new root.constructor('div');entries.setAttribute('class','hani-fun-entries');panel.querySelector('.hani-helper-home').append(entries);
 }};
 const f=await ready({funPreview}),{bot,switch:toggle}=nodes(f),home=bot.querySelector('.hani-helper-home');
 const button=home.children.at(-1);assert.equal(button.getAttribute('aria-label'),'도우미 숨기기');
 assert.equal(home.children.at(-2).getAttribute('class'),'hani-fun-entries');
 const staff=bot.dataset.staff,face=bot.querySelector('.hani-helper-face');
 f.fire('click',button);f.navigate('settings');f.fire('click',toggle);
 assert.equal(nodes(f).bot,bot);assert.equal(bot.dataset.staff,staff);assert.equal(bot.querySelector('.hani-helper-face'),face);
 assert.deepEqual(writes(f),[['setItem',key,'1'],['setItem',key,'0']]);
});
