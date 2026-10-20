// Actual canonical module executed with deterministic DOM/storage/timer doubles.
// These checks complement the browser suite; they cannot establish pixels or real accessibility.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../hani-launch-greeting.js',import.meta.url),'utf8');
const key='hani_theme_settings_v1', life='hani_os_life_v23';
function fixture({instant='2026-10-20T09:00:00+09:00', local=new Map([[life,'protected sentinel']]), session=new Map(), failRead=false, failWrite=false, failSession=false, load='success', reduced=false, initialUnlocked=false, fading=false, webdriver, force}={}) {
  let now=Date.parse(instant), elapsed=0, next=1, observer;
  const timers=new Map(), images=[], writes=[], listeners=new Map();
  class Node {
    constructor(id='') { this.id=id;this.attrs={};this.children=[];this.classes=new Set();this.hidden=false;this.inert=false;this.isConnected=true;this.listeners=new Map();this.style={};this.textContent='';
      this.classList={contains:c=>this.classes.has(c),add:(...cs)=>cs.forEach(c=>this.classes.add(c)),remove:(...cs)=>cs.forEach(c=>this.classes.delete(c))}; }
    setAttribute(k,v){this.attrs[k]=v}
    getAttribute(k){return this.attrs[k]??null}
    hasAttribute(k){return Object.hasOwn(this.attrs,k)}
    append(child){this.children.push(child)}
    contains(child){return this.children.includes(child)}
    getClientRects(){return this.hidden?[]:[{width:390,height:844}]}
    closest(){return this.inert||this.id==='loginGate'?this:null}
    focus(){document.activeElement=this}
    addEventListener(type,fn){this.listeners.set(type,fn)}
    removeEventListener(type,fn){if(this.listeners.get(type)===fn)this.listeners.delete(type)}
    querySelector(s){return this.parts[s]}
    set innerHTML(_value){this.parts={'.launch-art':new Node(),'h2':new Node(),'button':new Node()};this.children.push(...Object.values(this.parts))}
  }
  const gate=new Node('loginGate'),app=new Node('app'),toggle=new Node('launchGreetingEnabled'),title=new Node('title'),body=new Node('body');
  const assets={content:{querySelector:s=>({getAttribute:()=>`./assets/launch/chibi-launch-v1-${s.includes('night')?'night':'day'}.webp`})}};
  const nodes={loginGate:gate,app,launchGreetingEnabled:toggle,title,launchGreetingAssets:assets};
  app.inert=!initialUnlocked;if(initialUnlocked)gate.classList.add('is-hidden');
  const blockers=[];
  const document={body,hidden:false,activeElement:title,
    getElementById:id=>nodes[id],createElement:()=>new Node(),querySelectorAll:()=>blockers,
    addEventListener:(t,fn)=>listeners.set(t,fn),removeEventListener:(t,fn)=>{if(listeners.get(t)===fn)listeners.delete(t)}};
  const storage=(map,isSession)=>({getItem(k){if(isSession?failSession:failRead)throw Error('denied');return map.get(k)??null},setItem(k,v){if(isSession?failSession:failWrite)throw Error('denied');writes.push([isSession?'session':'local',k]);map.set(k,v)}});
  let release;
  class Image extends Node {constructor(){super();images.push(this)} decode(){if(load==='error')return Promise.reject(Error('decode'));if(load==='pending')return new Promise(r=>release=r);return Promise.resolve()}}
  class Clock extends Date {static now(){return now} }
  const ctx=vm.createContext({document,navigator:{webdriver},window:{__HANI_LAUNCH_GREETING_FORCE__:force,addEventListener:(t,fn)=>listeners.set(t,fn)},localStorage:storage(local,false),sessionStorage:storage(session,true),Image,Date:Clock,
    MutationObserver:class {constructor(fn){observer=this;this.fn=fn;this.active=false}observe(){this.active=true}disconnect(){this.active=false}},
    getComputedStyle:node=>({display:'block',visibility:node===gate&&gate.classes.has('is-hidden')&&!fading?'hidden':'visible',opacity:node===gate&&gate.classes.has('is-hidden')&&!fading?'0':'1'}),matchMedia:()=>({matches:reduced}),
    setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,at:elapsed+ms});return id},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(source,ctx);
  const flush=async()=>{for(let i=0;i<4;i++)await Promise.resolve();if(observer.active)observer.fn();for(let i=0;i<4;i++)await Promise.resolve()};
  const panel=()=>body.children.find(n=>n.id==='haniLaunchGreeting');
  const unlock=async(focus=title)=>{gate.classList.add('is-hidden');app.inert=false;focus.focus();await flush()};
  const completeGate=async()=>{fading=false;gate.listeners.get('transitionend')?.({target:gate,propertyName:'opacity'});await flush()};
  const advance=async ms=>{elapsed+=ms;now+=ms;for(const [id,t]of [...timers])if(t.at<=elapsed){timers.delete(id);t.fn()}await flush()};
  const event=type=>{let stopped=false;listeners.get(type)?.({preventDefault(){stopped=true},stopImmediatePropagation(){stopped=true}});return stopped};
  const safe=()=>{assert.equal(local.get(life),'protected sentinel');assert.ok(writes.every(([,k])=>k===key));};
  return {local,session,images,writes,toggle,app,gate,title,document,blockers,panel,unlock,completeGate,advance,flush,event,release:()=>release?.(),safe,active:()=>observer.active,listeners};
}

for(const force of [undefined,false,'true'])test(`webdriver skips automatic greeting without explicit boolean force (${force})`,async()=>{
  const f=fixture({webdriver:true,force});await f.unlock();await f.advance(3000);
  assert.equal(f.images.length,0);assert.equal(f.panel(),undefined);assert.deepEqual(f.writes,[]);
  assert.equal(f.active(),false);assert.equal(f.gate.listeners.has('transitionend'),false);
  assert.equal(f.listeners.has('click'),false);assert.equal(f.document.activeElement,f.title);f.safe();
});
for(const webdriver of [false,undefined])test(`normal browser keeps daily greeting (webdriver ${webdriver})`,async()=>{
  const f=fixture({webdriver});await f.unlock();assert.equal(f.images.length,1);assert.ok(f.panel());
  f.event('click');f.safe();
});
test('explicit automation force retains unlock, preference and once-daily rules',async()=>{
  const f=fixture({webdriver:true,force:true});assert.equal(f.images.length,0);
  await f.unlock();assert.ok(f.panel());f.event('click');f.safe();
  const seen=fixture({webdriver:true,force:true,local:f.local});await seen.unlock();assert.equal(seen.images.length,0);seen.safe();
  const off=fixture({webdriver:true,force:true,local:new Map([[life,'protected sentinel'],[key,JSON.stringify({launchEnabled:false})]])});
  await off.unlock();assert.equal(off.images.length,0);assert.deepEqual(off.writes,[]);off.safe();
});

test('wait for gate fade completion; ignore bubbled/unfinished transitions; no timer polling',async()=>{
  const f=fixture({fading:true});await f.unlock();await f.advance(500);
  assert.equal(f.images.length,0);assert.equal(f.panel(),undefined);
  f.gate.listeners.get('transitionend')({target:f.title});await f.flush();assert.equal(f.images.length,0);
  f.gate.listeners.get('transitionend')({target:f.gate,propertyName:'transform'});await f.flush();assert.equal(f.images.length,0);
  await f.completeGate();assert.equal(f.images.length,1);assert.ok(f.panel());
  f.event('click');assert.equal(f.gate.listeners.has('transitionend'),false);f.safe();
});

test('restore the actual previously focused control rather than always title',async()=>{
  const f=fixture();await f.unlock(f.toggle);f.event('click');assert.equal(f.document.activeElement,f.toggle);f.safe();
});
for(const target of ['body','detached','unfocusable'])test(`focus ${target} falls back to focusable main title`,async()=>{
  const f=fixture();let focus=f.document.body;
  if(target!=='body') {focus=f.toggle;if(target==='detached')focus.isConnected=false;else focus.focus=()=>{};}
  // Model the browser's active element immediately before the decoded panel opens.
  f.document.activeElement=focus;await f.unlock(focus);
  f.event('click');assert.equal(f.document.activeElement,f.title);assert.equal(f.title.getAttribute('tabindex'),'-1');f.safe();
});
test('after unlock only, one image, KST persisted day, dialog/focus, immediate any-key and single attempt',async()=>{
  const f=fixture();assert.equal(f.images.length,0);await f.unlock();assert.equal(f.images.length,1);assert.ok(f.images[0].src.endsWith('day.webp'));
  assert.equal(f.panel().getAttribute('role'),'dialog');assert.ok(f.panel().getAttribute('aria-label'));assert.match(f.panel().parts.h2.textContent,/아침.*회장님/);
  assert.equal(f.document.activeElement,f.panel().parts.button);assert.equal(JSON.parse(f.local.get(key)).launchLastSeen,'2026-10-20');
  assert.ok(f.event('keydown'));assert.ok(f.panel().hidden);assert.equal(f.document.activeElement,f.title);assert.equal(f.active(),false);
  await f.unlock();assert.equal(f.images.length,1);assert.equal(f.listeners.has('keydown'),false);f.safe();
});
test('second open same KST day suppressed, next day shown',async()=>{
  const f=fixture();await f.unlock();f.event('click');
  const same=fixture({local:f.local});await same.unlock();assert.equal(same.images.length,0);
  const next=fixture({local:f.local,instant:'2026-10-21T00:00:00+09:00'});await next.unlock();assert.equal(next.images.length,1);next.safe();
});
for(const [hour,scene,line]of [[0,'night','밤'],[5,'night','밤'],[6,'day','아침'],[12,'day','오후'],[18,'day','저녁'],[21,'night','저녁'],[22,'night','밤'],[23,'night','밤']])test(`KST ${hour}: ${scene} / ${line}`,async()=>{
  const f=fixture({instant:`2026-10-20T${String(hour).padStart(2,'0')}:00:00+09:00`});await f.unlock();assert.ok(f.images[0].src.endsWith(scene+'.webp'));assert.ok(f.panel().parts.h2.textContent.includes(line));assert.match(f.panel().parts.h2.textContent,/회장님/);f.safe();
});
for(const reduced of [false,true])test(`${reduced?'reduced':'normal'} lifetime and listener cleanup`,async()=>{
  const f=fixture({reduced});await f.unlock();const duration=reduced?1200:2100;await f.advance(duration-1);assert.equal(f.panel().hidden,false);await f.advance(1);assert.equal(f.panel().hidden,true);assert.equal(f.active(),false);f.safe();
});
test('toggle off prevents request and writes only UI prefs; change persists and preserves unrelated fields',async()=>{
  const f=fixture({local:new Map([[life,'protected sentinel'],[key,JSON.stringify({launchEnabled:false,otherTheme:'keep'})]])});
  assert.equal(f.toggle.checked,false);await f.unlock();assert.equal(f.images.length,0);
  f.toggle.checked=true;f.toggle.listeners.get('change')();assert.equal(JSON.parse(f.local.get(key)).otherTheme,'keep');assert.equal(JSON.parse(f.local.get(key)).launchEnabled,true);
  f.safe();
});
for(const stage of ['before','loading','shown'])test(`blocking dialog ${stage} cancels, does not retry or steal its focus`,async()=>{
  const f=fixture({load:stage==='loading'?'pending':'success'});const modal={hidden:false,getClientRects:()=>[{}]};
  if(stage==='before')f.blockers.push(modal);await f.unlock();
  if(stage!=='before'){f.blockers.push(modal);f.document.activeElement=modal;await f.flush();if(stage==='loading'){f.release();await f.flush()}assert.equal(f.document.activeElement,modal)}
  assert.ok(!f.panel()||f.panel().hidden);f.blockers.length=0;await f.flush();assert.ok(!f.panel()||f.panel().hidden);f.safe();
});
test('relock immediately cancels pending greeting; auth stays inert',async()=>{
  const f=fixture({load:'pending'});await f.unlock();f.gate.classList.remove('is-hidden');f.app.inert=true;await f.flush();f.release();await f.flush();assert.equal(f.panel(),undefined);assert.ok(f.app.inert);f.safe();
});
for(const load of ['error','pending'])test(`image ${load}: silent skip, no seen flag, no late show after 800ms`,async()=>{
  const f=fixture({load});await f.unlock();await f.advance(800);f.release();await f.flush();assert.equal(f.panel(),undefined);assert.equal(f.local.has(key),false);assert.equal(f.active(),false);f.safe();
});
for(const options of [{failRead:true},{failRead:true,failWrite:true},{failWrite:true},{failWrite:true,failSession:true},{failRead:true,failWrite:true,failSession:true}])test(`storage errors ${JSON.stringify(options)}: memory/session fallback and clean protected data`,async()=>{
  const f=fixture(options);await f.unlock();assert.ok(f.panel());f.event('click');await f.unlock();assert.equal(f.images.length,1);f.safe();
  const reopened=fixture({...options,local:f.local,session:f.session,instant:'2026-10-21T09:00:00+09:00'});await reopened.unlock();
  assert.equal(reopened.images.length,options.failSession?1:0,'both stores denied allow one per new page; available session suppresses across days');
  if(options.failSession){reopened.event('click');await reopened.unlock();assert.equal(reopened.images.length,1);assert.equal(reopened.writes.length,0)}
  reopened.safe();
  const newTab=fixture({...options,local:f.local});await newTab.unlock();assert.ok(newTab.panel(),'fresh tab session may show');newTab.safe();
});
test('already unlocked app open still shows; hidden document never requests art',async()=>{
  const f=fixture({initialUnlocked:true});await f.flush();assert.ok(f.panel());f.safe();
  const hidden=fixture();hidden.document.hidden=true;await hidden.unlock();assert.equal(hidden.images.length,0);hidden.safe();
});
