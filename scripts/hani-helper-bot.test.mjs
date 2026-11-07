// Node: node scripts/hani-helper-bot.test.mjs
// Real app/screenshots: append <playwright/index.mjs> <browser.exe>.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import http from 'node:http';
import {test} from 'node:test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ui=read('hani-ui-v02992.js'),source=ui.slice(ui.indexOf('// BEGIN HANI HELPER BOT'));
const css=read('hani-style-08.css'),tapBank=JSON.parse(read('assets/data/office-tap-lines-v1.json'));
const releases=JSON.parse(read('assets/data/hani-history-releases-v1.json'));
const manifest=JSON.parse(read('assets/sprites-v3/manifest-v3.json'));
// Execute the actual roster declaration; do not maintain a second staff list in tests.
const rosterContext={window:{},document:{getElementById:()=>null,querySelectorAll:()=>[]}};
vm.runInNewContext(read('hani-organization-hub.js'),rosterContext);
const staff=rosterContext.window.HaniOrganizationRoster.people;
const plain=x=>JSON.parse(JSON.stringify(x));
// Read species, identities and public lines from the actual resident declarations.
const office=read('hani-office-live.js'),residentStart=office.indexOf('  const residentNames=Object.freeze(');
assert.ok(residentStart>=0);
const residentEnd=office.indexOf('  function residentSeed(',residentStart);assert.ok(residentEnd>residentStart);
const residents=vm.runInNewContext(office.slice(residentStart,residentEnd)+';residentPeople');
const pets=residents.filter(p=>p.pet),cycleSize=staff.length+pets.length;
const cycle=(api,start)=>Array.from({length:cycleSize},(_,i)=>api.duty(staff,start+i*86400000));

// Minimal event/DOM fixture. Geometry and CSS painting are tested separately in a real browser.
function fixture({now=Date.parse('2026-11-06T12:30:00+09:00'),failRelease=false,loading=false,stored=null,storageFails=false}={}) {
  const callbacks=new Map(),frames=[],observers=[],calls=[],requests=[],storageCalls=[];
  let document;
  const matches=(el,selector)=>selector.split(',').some(s=>{
    s=s.trim();
    if(s==='*')return true;
    if(s.includes(':not('))return el.tagName==='INPUT'&&el.attributes.type!=='hidden';
    if(s.startsWith('.'))return s.slice(1).split('.').every(c=>(el.attributes.class||'').split(/\s+/).includes(c));
    if(s.startsWith('#'))return el.id===s.slice(1);
    const attr=s.match(/^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if(attr)return (!attr[1]||el.tagName===attr[1].toUpperCase())&&el.attributes[attr[2]]!==undefined&&(attr[3]===undefined||el.attributes[attr[2]]===attr[3]);
    return el.tagName===s.toUpperCase();
  });
  class Element {
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.dataset=new Proxy({}, {set:(data,key,value)=>{data[key]=String(value);this.attributes['data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=String(value);return true;}});this.style={};this.hidden=false;this.textContent='';this.isConnected=false;}
    setPointerCapture(id){this.captured=id;}
    hasPointerCapture(id){return this.captured===id;}
    releasePointerCapture(){this.captured=null;}
    set id(v){this.attributes.id=v;}get id(){return this.attributes.id;}
    setAttribute(k,v){this.attributes[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);if(k==='hidden')this.hidden=true;}
    getAttribute(k){return this.attributes[k]??null;}
    matches(s){return matches(this,s);}
    get classList(){return {contains:name=>(this.attributes.class||'').split(/\s+/).includes(name)};}
    append(...els){for(const el of els){el.parent=this;el.isConnected=true;this.children.push(el);}}
    contains(el){return this===el||this.children.some(c=>c.contains(el));}
    closest(s){return matches(this,s)?this:this.parent?.closest(s)||null;}
    querySelectorAll(s){return this.children.flatMap(c=>[...(matches(c,s)?[c]:[]),...c.querySelectorAll(s)]);}
    querySelector(s){return this.querySelectorAll(s)[0]||null;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){
      let invisible=false;for(let el=this;el;el=el.parent)if(el.hidden)invisible=true;
      const b=this.box||{left:0,top:0,width:this.tagName==='SECTION'?320:0,height:this.tagName==='SECTION'?320:0};
      return {...b,right:b.left+b.width,bottom:b.top+b.height,...(invisible?{width:0,height:0}:{} )};
    }
    set innerHTML(html){
      this.children=[];const stack=[this];
      for(const match of html.matchAll(/<\/?[^>]+>/g)){
        const token=match[0];if(token.startsWith('</')){stack.pop();continue;}
        const tag=token.match(/^<(\w+)/)[1],el=new Element(tag);
        const attrs=token.slice(tag.length+1,-1);
        for(const m of attrs.matchAll(/([^\s=]+)(?:="([^"]*)")?/g))el.setAttribute(m[1],m[2]??'');
        stack.at(-1).append(el);if(!['input','img','br','hr'].includes(tag))stack.push(el);
      }
    }
  }
  const body=new Element('body');body.dataset.view='home';body.isConnected=true;
  const events=(target,name,fn)=>{const key=target+':'+name;if(!callbacks.has(key))callbacks.set(key,[]);callbacks.get(key).push(fn);};
  document={body,readyState:loading?'loading':'complete',activeElement:body,createElement:tag=>new Element(tag),getElementById:id=>body.querySelector('#'+id),querySelectorAll:s=>body.querySelectorAll(s),addEventListener:(name,fn)=>events('document',name,fn)};
  for(const id of ['home','tasks','agentReview','ilbo','investmentCommittee']){const el=new Element('section');el.id=id;body.append(el);}
  let saved=stored;
  const storage={getItem(key){storageCalls.push(['getItem',key]);assert.equal(key,'hani_helper_pos_v1');if(storageFails)throw Error('unavailable');return saved;},
    setItem(key,value){storageCalls.push(['setItem',key,value]);assert.equal(key,'hani_helper_pos_v1');if(storageFails)throw Error('full');saved=value;}};
  class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const window={innerWidth:390,innerHeight:844,HaniOrganizationRoster:{people:staff},addEventListener:(name,fn)=>events('window',name,fn)};
  const context=vm.createContext({window,document,Date:Clock,localStorage:storage,sessionStorage:storage,
    requestAnimationFrame:fn=>frames.push(fn),
    MutationObserver:class {constructor(fn){observers.push(fn);}observe(){}},
    getComputedStyle:el=>({visibility:'visible',display:'block',opacity:'1',pointerEvents:'auto',position:'static',getPropertyValue:()=> '0px',...el.computed}),
    showView:id=>{calls.push(id);body.dataset.view=id;observers.forEach(fn=>fn([{target:body}]));},
    fetch:async(url,opts)=>{requests.push({url,opts});if(failRelease&&url.includes('releases'))throw Error('offline');return {ok:true,json:async()=>url.includes('tap-lines')?tapBank:releases};}
  });
  vm.runInContext(source,context);
  const flush=()=>{let n=0;while(frames.length){assert.ok(++n<20,'no animation loop');frames.shift()();}};
  const fire=(name,target=body,extra={})=>{const event={type:name,target,key:'',button:0,pointerId:1,isPrimary:true,clientX:0,clientY:0,preventDefault(){this.prevented=true;},...extra};for(const fn of callbacks.get('document:'+name)||[])fn(event);flush();return event;};
  const resize=(width,height)=>{window.innerWidth=width;window.innerHeight=height;for(const fn of callbacks.get('window:resize')||[])fn();flush();};
  const ready=async()=>{for(let i=0;i<8;i++)await Promise.resolve();flush();};
  return {saved:()=>saved,window,document,api:window.HaniHelperBot,callbacks,calls,requests,storageCalls,Element,flush,fire,resize,ready,rerun:()=>vm.runInContext(source,context),setNow:v=>{now=v;},mutate:target=>{observers.forEach(fn=>fn([{target}]));flush();},navigate:id=>{body.dataset.view=id;observers.forEach(fn=>fn([{target:body}]));flush();}};
}

test('KST midnight, deterministic fair 23-day rotation, 19 staff + 4 separated pets',()=>{
  const {api}=fixture({loading:true}),start=Date.parse('2026-11-06T00:00:00+09:00');
  const before=plain(staff);
  assert.equal(staff.length,19);assert.equal(pets.length,4);assert.equal(cycleSize,23);
  assert.equal(api.kstDate(start-1),'2026-11-05');assert.equal(api.kstDate(start),'2026-11-06');
  const expected=[...staff,...pets].map(p=>p.id).sort();
  const ids=cycle(api,start).map(p=>p.id);
  assert.deepEqual(ids.slice().sort(),plain(expected));assert.equal(new Set(ids).size,23);
  assert.ok(!ids.includes('seongmin'));
  // Check every sliding window, cycle seams and pre-epoch modulo too.
  for(const offset of [-30000,-1,0,1,22,23,45,68]){
    const t=start+offset*86400000,windowIds=cycle(api,t).map(p=>p.id);
    assert.deepEqual(windowIds.slice().sort(),plain(expected));
    for(let i=0;i<cycleSize;i++){
      const day=t+i*86400000,person=api.duty(staff,day);
      assert.equal(person.id,api.duty([...staff].reverse(),day).id);
      assert.equal(person.id,api.duty(staff,day+86400000-1).id);
      assert.equal(person.id,api.duty(staff,day+cycleSize*86400000).id);
      if(person.id.startsWith('pet-'))assert.ok(!api.duty(staff,day+86400000).id.startsWith('pet-'),'pets adjacent across midnight/cycle seam');
    }
  }
  const slots=ids.flatMap((id,i)=>id.startsWith('pet-')?[i]:[]);
  const gaps=slots.map((p,i)=>(slots[(i+1)%4]-p+23)%23).sort();assert.deepEqual(gaps,[5,6,6,6]);
  assert.notEqual(api.duty(staff,start-1).id,api.duty(staff,start).id);
  assert.equal(api.duty([],start),null);
  const doubled=[...ids,...cycle(api,start+cycleSize*86400000).map(p=>p.id)];
  for(const id of expected)assert.equal(doubled.filter(p=>p===id).length,2);
  assert.deepEqual(plain(staff),before,'canonical employee roster unchanged');
});

test('five KST greeting bands; all staff voices, no private state dependency',()=>{
  const {api}=fixture({loading:true});
  for(const [hour,expected] of [[5,'night'],[6,'morning'],[10,'morning'],[11,'lunch'],[13,'lunch'],[14,'afternoon'],[17,'afternoon'],[18,'evening'],[21,'evening'],[22,'night']]){
    const now=Date.parse(`2026-11-06T${String(hour).padStart(2,'0')}:00:00+09:00`);
    assert.equal(api.timeBand(now),expected);
    for(const p of staff){const text=api.greeting(p,tapBank,now);assert.equal(typeof text,'string');assert.ok(text.length>8);assert.doesNotMatch(text,/undefined|\d[\d,]*\s*원|잔고|수익률/);}
  }
  assert.ok(api.greeting(staff[0],null));
});

test('pet voices, real species, five greetings, same help/routes and midnight return to staff',async()=>{
  const f=fixture();await f.ready();
  const start=Date.parse('2026-11-06T00:00:00+09:00'),root=f.document.getElementById('haniHelperBot'),face=root.querySelector('.hani-helper-face');
  const expected={ 'pet-cat':['치즈','사무실 고양이','냥'], 'pet-dog':['크림','사무실 강아지','멍'], 'pet-rabbit':['모찌','사무실 토끼','깡총'], 'pet-bori':['보리','로비 지킴이 리트리버','멍'] };
  const staffDay=Array.from({length:23},(_,i)=>start+i*86400000).find(t=>!f.api.duty(staff,t).id.startsWith('pet-'));
  const reference=f.api.duty(staff,staffDay),buttons=root.querySelectorAll('[data-helper-go]'),labels=buttons.map(b=>{f.setNow(staffDay);f.api.update();return b.textContent;});
  for(const resident of pets){
    const day=Array.from({length:23},(_,i)=>start+i*86400000).find(t=>f.api.duty(staff,t).id===resident.id);
    const person=f.api.duty(staff,day),[name,rank,call]=expected[resident.id];
    assert.equal(person.name,name);assert.equal(person.name,resident.name);assert.equal(person.rank,rank);
    const greetings=[6,11,14,18,22].map(hour=>f.api.greeting(person,null,day+hour*3600000));
    assert.equal(new Set(greetings).size,5);
    for(const line of greetings){assert.ok(line.length>8&&line.length<70);assert.doesNotMatch(line,/undefined|잔고|수익률/);}
    assert.ok(greetings.some(line=>resident.lines.some(existing=>line.includes(existing))),'reuse resident voice '+resident.id);
    assert.ok(greetings.some(line=>line.includes(call)));
    f.setNow(day+12*3600000);f.api.update();f.flush();
    assert.equal(root.dataset.staff,resident.id);assert.equal(root.querySelector('h2').textContent,name+' · '+rank);
    assert.match(face.getAttribute('aria-label'),new RegExp(name));
    assert.equal(root.querySelector('.hani-helper-greeting').textContent,f.api.greeting(person,null,day+12*3600000));
    for(const view of ['home','agentReview','reading','ledger','future-view']){
      f.navigate(view);const displayed=root.querySelector('.hani-helper-help').textContent;
      assert.equal(displayed,f.api.help(view,person));assert.ok(displayed.endsWith(f.api.help(view,reference)),'help content retained');
    }
    assert.deepEqual(buttons.map(b=>b.dataset.helperGo),['tasks','agentReview','ilbo','investmentCommittee']);
    assert.deepEqual(buttons.map(b=>b.textContent),labels.map(label=>label+' · '+call));
    for(const button of buttons){f.fire('click',face);f.fire('click',button);assert.equal(root.querySelector('.hani-helper-speech').hidden,true);}
    // Refresh the same persistent slot at the next midnight, with original employee text restored.
    f.setNow(day+86400000);f.fire('click',face);
    assert.ok(!root.dataset.staff.startsWith('pet-'));assert.equal(root,f.document.getElementById('haniHelperBot'));
    assert.deepEqual(buttons.map(b=>b.textContent),labels);f.fire('keydown',face,{key:'Escape'});
  }
  assert.deepEqual(f.calls,Array(4).fill(['tasks','agentReview','ilbo','investmentCommittee']).flat());
  assert.deepEqual(f.storageCalls,[['getItem','hani_helper_pos_v1']]);assert.equal(f.requests.length,2);assert.equal(f.callbacks.get('document:click').length,1);
});

test('per-view help follows canonical body view; unknown route has fallback',async()=>{
  const f=fixture();await f.ready();
  const fallback=f.api.help('future-view');assert.equal(fallback,f.api.help(null));
  for(const id of ['home','tasks','agentReview','ilbo','investmentCommittee','reading','ledger','settings'])assert.notEqual(f.api.help(id),fallback);
  const sidebar=read('index.html').match(/<aside\b[^>]*class="[^"]*\bside\b[^"]*"[^>]*>([\s\S]*?)<\/aside>/)[1];
  for(const [,id] of sidebar.matchAll(/data-view="([^"]+)"/g))assert.notEqual(f.api.help(id),fallback,'main view help: '+id);
  assert.equal(f.api.help('organization/people'),f.api.help('organization'));
  f.navigate('agentReview');assert.equal(f.document.body.querySelector('.hani-helper-help').textContent,f.api.help('agentReview'));
  f.navigate('future-view');assert.equal(f.document.body.querySelector('.hani-helper-help').textContent,fallback);
});

test('real release catalog + 24-hour boundaries + future/draft + birthdays',()=>{
  const {api}=fixture({loading:true}),now=Date.parse('2026-11-06T12:00:00+09:00');
  assert.equal(api.news(releases,staff,now).dot,true);
  const catalog={entries:[{date:'2026-11-06',status:'released',title:'release'}]};
  assert.equal(api.news(catalog,staff,Date.parse('2026-11-05T23:59:59+09:00')).dot,false);
  assert.equal(api.news(catalog,staff,Date.parse('2026-11-07T00:00:00+09:00')).dot,true);
  assert.equal(api.news(catalog,staff,Date.parse('2026-11-07T00:00:00.001+09:00')).dot,false);
  const stamped={entries:[{publishedAt:new Date(now-86400000).toISOString(),status:'released',title:'edge'}]};
  assert.equal(api.news(stamped,staff,now).dot,true);assert.equal(api.news(stamped,staff,now+1).dot,false);
  assert.equal(api.news({entries:[{date:'bad',status:'released'},{date:'2026-11-06',status:'draft'}]},staff,now).dot,false);
  assert.equal(api.news(null,[],now).dot,false);
  assert.match(api.news(null,[{name:'테스트',birthday:'11-06'}],now).text,/테스트 생일/);
  assert.equal(api.news(null,[{name:'테스트',birthDate:'2000-11-05'}],now).dot,false);
});

test('persistent root, click toggle, X, outside click, Escape, focus, four existing nav calls',async()=>{
  const f=fixture();await f.ready();
  const root=f.document.getElementById('haniHelperBot'),panel=root.querySelector('.hani-helper-speech'),face=root.querySelector('.hani-helper-face'),x=root.querySelector('[data-helper-close]');
  assert.equal(panel.hidden,true);assert.equal(root.hidden,false);
  f.rerun();f.api.init();assert.equal(f.document.body.querySelectorAll('#haniHelperBot').length,1);
  assert.equal(f.callbacks.get('document:click').length,1);
  face.focus();f.fire('click',face);assert.equal(panel.hidden,false);assert.equal(face.getAttribute('aria-expanded'),'true');assert.equal(f.document.activeElement,x);
  f.fire('click',root.querySelector('.hani-helper-greeting'));assert.equal(panel.hidden,false);
  f.fire('click',x);assert.equal(panel.hidden,true);assert.equal(f.document.activeElement,face);
  f.fire('click',face);f.fire('click',f.document.body);assert.equal(panel.hidden,true);
  f.fire('click',face);assert.equal(f.fire('keydown',f.document.body,{key:'Escape'}).prevented,true);assert.equal(panel.hidden,true);
  f.fire('click',face);f.fire('click',face);assert.equal(panel.hidden,true);
  for(const button of root.querySelector('nav').children){f.fire('click',face);f.fire('click',button);assert.equal(panel.hidden,true);}
  assert.deepEqual(f.calls,['tasks','agentReview','ilbo','investmentCommittee']);
  assert.equal(root,f.document.getElementById('haniHelperBot'));
  assert.equal(root.querySelector('.hani-helper-dot').hidden,false);
  assert.match(face.getAttribute('aria-label'),/새 소식/);
  assert.deepEqual(f.storageCalls,[['getItem','hani_helper_pos_v1']]);
  assert.equal(f.requests.length,2);for(const r of f.requests)assert.ok(!r.opts.method||r.opts.method==='GET');
});

test('midnight refresh on open, deferred mount, failed read has no false news dot',async()=>{
  const f=fixture({loading:true,failRelease:true});assert.equal(f.document.getElementById('haniHelperBot'),null);
  f.fire('DOMContentLoaded');await f.ready();
  const root=f.document.getElementById('haniHelperBot'),face=root.querySelector('.hani-helper-face'),first=root.dataset.staff;
  assert.equal(root.querySelector('.hani-helper-dot').hidden,true);
  assert.match(root.querySelector('.hani-helper-news').textContent,/확인하지 못/);
  f.setNow(Date.parse('2026-11-07T12:30:00+09:00'));f.fire('click',face);assert.notEqual(root.dataset.staff,first);
  assert.deepEqual(f.storageCalls,[['getItem','hani_helper_pos_v1']]);
});

test('phone keeps fixed UI and focused input avoidance; no-space fallback stays shown',async()=>{
  const f=fixture();await f.ready();
  for(const [width,height] of [[390,844],[1280,900]]){
    const viewport={left:0,top:0,width,height};
    const obstacles=[{left:0,right:width,top:height-64,bottom:height},
      {left:width-100,right:width-10,top:height-124,bottom:height-74},
      {left:width-140,right:width-10,top:height-184,bottom:height-134},
      {left:width-220,right:width-10,top:height-260,bottom:height-194}];
    const box=f.api.slot(viewport,obstacles);assert.ok(box);assert.ok(box.bottom<=height-268);
    for(const b of obstacles)assert.ok(box.right<=b.left||box.left>=b.right||box.bottom<=b.top||box.top>=b.bottom);
    assert.ok(box.top>=0&&box.right<=width);
  }
  const button=new f.Element('button');button.box={left:300,top:760,width:80,height:60};f.document.body.append(button);
  // A floating helper may cover in-flow buttons; exhausted slots now use the default corner.
  f.navigate('home');const helper=f.document.getElementById('haniHelperBot');assert.equal(helper.style.top,'750px');
  button.computed={position:'fixed'};f.fire('input',button);assert.ok(parseFloat(helper.style.top)+78<=752);
  const full=new f.Element('textarea');full.box={left:0,top:0,width:390,height:844};f.document.body.append(full);full.focus();f.fire('focusin',full);assert.equal(helper.hidden,false);assert.equal(helper.style.top,'750px');assert.equal(helper.dataset.helperReason,'shown');
  const nav=new f.Element('nav');nav.computed={position:'fixed'};nav.box={left:0,top:780,width:390,height:64};f.document.body.append(nav);f.fire('input',nav);
  assert.equal(helper.hidden,false);assert.equal(helper.style.top,'686px','fallback above fixed bottom bar');
  assert.equal(f.api.slot({left:0,top:0,width:390,height:844},[{left:0,right:390,top:0,bottom:844}]),null);
});

function desktopFixture(f,width,height) {
  const app=new f.Element('div');app.id='app';app.setAttribute('class','app');
  const main=new f.Element('main');main.setAttribute('class','main');main.box={left:240,top:0,width:width-476,height};
  const rail=new f.Element('aside');rail.id='haniContextRemote';rail.setAttribute('class','hani-context-remote');rail.computed={position:'sticky'};rail.box={left:width-236,top:0,width:236,height};
  const toggle=new f.Element('button');toggle.setAttribute('class','hani-remote-collapse');toggle.box={left:width-48,top:16,width:32,height:32};
  rail.append(toggle);app.append(main,rail);f.document.body.append(app);f.resize(width,height);
  const helper=f.document.getElementById('haniHelperBot'),face=helper.querySelector('.hani-helper-face'),panel=helper.querySelector('.hani-helper-speech');
  const setRail=mode=>{
    app.setAttribute('class',mode==='mini'?'app hani-remote-mini':'app');
    rail.hidden=mode==='hidden';rail.box={left:width-(mode==='mini'?64:236),top:0,width:mode==='mini'?64:236,height};
    // The real rail handler changes #app before the existing document click handler runs.
    f.fire('click',toggle);
  };
  const xy=()=>({left:parseFloat(helper.style.left),top:parseFloat(helper.style.top)});
  return {app,main,rail,toggle,helper,face,panel,setRail,xy};
}

for(const [width,height] of [[1280,900],[1440,900],[1920,1080]]){
  test(`PC ${width}x${height}: open / collapsed / hidden rail, ordinary cards, panel within column`,async()=>{
    const f=fixture();await f.ready();const d=desktopFixture(f,width,height);
    // All these normal content controls may be under a floating face without hiding it.
    for(const tag of ['button','a','input','textarea','select','summary','nav','footer']){
      const el=new f.Element(tag);if(tag==='a')el.setAttribute('href','#');
      el.box={left:240,top:0,width:width-240,height};d.main.append(el);
    }
    for(const mode of ['open','mini','hidden','open']){
      d.setRail(mode);assert.equal(d.helper.hidden,false,mode);
      const right=mode==='open'?width-236:width;
      assert.deepEqual(d.xy(),{left:right-(width>850?106:94),top:height-(width>850?106:94)},mode+' anchor');
      // All canonical sidebar views remain visible over content cards.
      const sidebar=read('index.html').match(/<aside\b[^>]*class="[^\"]*\bside\b[^\"]*"[^>]*>([\s\S]*?)<\/aside>/)[1];
      const views=[...sidebar.matchAll(/data-view="([^\"]+)"/g)].map(m=>m[1]);assert.ok(views.length>20);
      for(const view of views){
        f.navigate(view);assert.equal(d.helper.hidden,false,view);assert.equal(d.xy().left,right-(width>850?106:94));
      }
      f.fire('click',d.face);assert.equal(d.panel.hidden,false);
      const panelLeft=parseFloat(d.panel.style.left),panelWidth=parseFloat(d.panel.style.width),panelTop=parseFloat(d.panel.style.top);
      assert.equal(panelLeft+panelWidth,right-16);assert.ok(panelLeft>=d.main.box.left);
      assert.ok(panelTop>=16&&panelTop+320<=d.xy().top-12);
      assert.ok(parseFloat(d.panel.style.maxHeight)<=d.xy().top-28);
      f.fire('keydown',d.face,{key:'Escape'});
    }
    assert.deepEqual(f.storageCalls,[['getItem','hani_helper_pos_v1']]);
    assert.equal(f.callbacks.get('document:click').length,1);
    assert.equal(f.callbacks.get('window:resize').length,1);
  });

  test(`PC ${width}x${height}: Yuna, event button/panel, toast, focused input and mini rail controls`,async()=>{
    const f=fixture();await f.ready();const d=desktopFixture(f,width,height);
    const selectors=['yuna-composer','hani-office-events','hani-office-event-panel','toast','offline-entry-badge'];
    for(const mode of ['open','mini']){
      d.setRail(mode);const right=mode==='open'?width-236:width;
      for(const name of selectors){
        const el=new f.Element('div');el.setAttribute('class',name);el.box={left:right-180,top:height-90,width:180,height:90};
        el.computed={position:name==='hani-office-events'?'sticky':'fixed',...(name==='toast'?{pointerEvents:'none'}:{})};
        f.document.body.append(el);
        f.fire('input',el);assert.equal(d.helper.hidden,false);assert.equal(d.xy().left,right-(width>850?106:94));assert.equal(d.xy().top,height-188,name);
        el.hidden=true;f.fire('input',el);assert.equal(d.xy().top,height-(width>850?106:94),'hidden '+name);
      }
      const input=new f.Element('textarea');input.box={left:right-180,top:height-90,width:180,height:90};d.main.append(input);
      f.navigate('home');assert.equal(d.xy().top,height-(width>850?106:94),'idle input is ordinary content');
      input.focus();f.fire('focusin',input);assert.equal(d.xy().top,height-188,'focused input');
      f.document.body.focus();f.fire('focusin');assert.equal(d.xy().top,height-(width>850?106:94));
    }
    const utility=new f.Element('button');utility.box={left:width-56,top:height-60,width:48,height:44};d.rail.append(utility);
    f.fire('click',d.toggle);assert.equal(d.helper.hidden,false);assert.ok(d.xy().top+90<=utility.box.top-8,'collapsed rail control');
  });
}

test('existing resize and open paths remeasure rail and viewport; phone geometry restored',async()=>{
  const f=fixture();await f.ready();const d=desktopFixture(f,1280,900);
  d.rail.box={left:1440-236,top:0,width:236,height:900};f.resize(1440,900);
  assert.deepEqual(d.xy(),{left:1440-236-106,top:794});
  d.rail.box.left=1440-300;f.fire('click',d.face);
  assert.equal(d.xy().left,1440-300-106,'open measures current rail geometry');
  f.resize(390,844);assert.equal(d.helper.hidden,false);assert.deepEqual(d.xy(),{left:296,top:750});assert.equal(d.panel.style.width,'320px');
  assert.equal(d.panel.style.maxHeight,'722px');
  assert.equal((source.match(/addEventListener\(/g)||[]).length,10,'one shared pointer listener registration added');
});

test('PC without a rail uses viewport corner even over an ordinary full-screen card',async()=>{
  const f=fixture();await f.ready();const button=new f.Element('button');button.box={left:0,top:0,width:1920,height:1080};f.document.body.append(button);
  f.resize(1920,1080);const helper=f.document.getElementById('haniHelperBot');
  assert.equal(helper.hidden,false);assert.equal(helper.style.left,'1814px');assert.equal(helper.style.top,'974px');
});

for(const [width,height] of [[390,844],[1280,900],[1920,1080]]){
  test(`crowded ${width}x${height}: in-flow controls cannot hide helper; fixed wall falls back`,async()=>{
    const f=fixture();await f.ready();const d=desktopFixture(f,width,height);
    for(let i=0;i<80;i++){
      const el=new f.Element(['button','a','input','nav','footer'][i%5]);if(el.tagName==='A')el.setAttribute('href','#');
      el.box={left:0,top:i*10,width,height:80};d.main.append(el);
    }
    for(const mode of ['open','mini','hidden']){
      d.setRail(mode);if(width<=850){d.rail.hidden=true;f.fire('input');}
      const right=width>850&&mode==='open'?width-236:width;
      assert.equal(d.helper.hidden,false);assert.equal(d.helper.dataset.helperReason,'shown');
      assert.deepEqual(d.xy(),{left:right-(width>850?106:94),top:height-(width>850?106:94)});
      const wall=new f.Element('div');wall.computed={position:'fixed'};wall.box={left:0,top:0,width,height};f.document.body.append(wall);
      f.fire('input',wall);assert.equal(d.helper.hidden,false);assert.equal(d.helper.dataset.helperReason,'shown');
      assert.deepEqual(d.xy(),{left:right-(width>850?106:94),top:height-(width>850?106:94)},'default corner despite exhausted slots');
      wall.hidden=true;f.fire('input',wall);
      if(width>850&&mode==='mini'){
        const railControl=new f.Element('button');railControl.box={left:width-64,top:0,width:64,height};d.rail.append(railControl);
        f.fire('input',railControl);assert.equal(d.helper.hidden,false);assert.deepEqual(d.xy(),{left:right-(width>850?106:94),top:height-(width>850?106:94)},'exhausted mini rail controls');
        railControl.hidden=true;
      }
    }
    assert.deepEqual(f.storageCalls,[['getItem','hani_helper_pos_v1']]);
  });
}

test('visibility reasons follow login, external dialogs and duty; helper dialog never hides itself',async()=>{
  const f=fixture();await f.ready();const root=f.document.getElementById('haniHelperBot');
  const check=(hidden,reason)=>{assert.equal(root.hidden,hidden);assert.equal(root.dataset.helperReason,reason);};
  check(false,'shown');f.fire('click',root.querySelector('.hani-helper-face'));check(false,'shown');
  const app=new f.Element('div');app.id='app';f.document.body.append(app);
  app.setAttribute('class','login-locked');f.mutate(app);check(true,'login');
  assert.equal(root.querySelector('.hani-helper-speech').hidden,true);
  app.setAttribute('class','');f.mutate(app);check(false,'shown');
  f.navigate('login');check(true,'login');f.navigate('home');check(false,'shown');
  const gate=new f.Element('div');gate.id='loginGate';gate.box={left:0,top:0,width:390,height:844};f.document.body.append(gate);
  f.mutate(gate);check(true,'login');gate.hidden=true;f.mutate(gate);check(false,'shown');
  for(const kind of ['native','role','modal']){
    const dialog=new f.Element(kind==='native'?'dialog':'section');dialog.box={left:30,top:30,width:300,height:300};
    if(kind==='native')dialog.setAttribute('open','');else if(kind==='role')dialog.setAttribute('role','dialog');else dialog.setAttribute('class','modal open');
    f.document.body.append(dialog);f.mutate(dialog);check(true,'modal');
    dialog.hidden=true;f.mutate(dialog);check(false,'shown');
  }
  f.window.HaniOrganizationRoster.people=[];f.api.update();f.flush();check(true,'no-duty');
  f.window.HaniOrganizationRoster.people=staff;f.api.update();f.flush();check(false,'shown');
});

// Resolve the actual shared and per-staff CSS variables, including :is() groups.
function helperCrop(id){
  const vars={};let ownEntry=false;
  for(const [,selector,body] of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)){
    if(!selector.trim().startsWith('#haniHelperBot')||selector.includes(' .hani-helper-'))continue;
    if(selector.includes('[data-staff=')&&!selector.includes(`[data-staff="${id}"]`))continue;
    if(selector.trim()===`#haniHelperBot[data-staff="${id}"]`)ownEntry=true;
    for(const [,key,value] of body.matchAll(/(--helper-[\w-]+):([^;}]+)/g))vars[key]=value.trim();
  }
  const image=vars['--helper-image']?.match(/url\(['"]\.\/([^'"]+)['"]\)/)?.[1];
  const [width,height]=(vars['--helper-size']||'272px 170px').match(/[\d.]+/g).map(Number);
  const x=parseFloat(vars['--helper-x']),y=parseFloat(vars['--helper-y']);
  const trim=(vars['--helper-trim']||'0px 0px 0px 0px').match(/[\d.]+/g).map(Number);
  return {ownEntry,image,width,height,x,y,trim,shape:vars['--helper-shape']};
}

test('every canonical staff has an explicit crop; none paints the chairman frog',()=>{
  const identities={
    hani:[690,660],yuna:[1425,695],mir:[1370,165],seoyun:[270,155],
    dohyun:[490,145],serin:[710,155],yuri:[935,155],arin:[1165,155],
    gaeun:[450,420],jieun:[190,405],haru:[210,665],naeun:[440,675],
    hina:[1180,685],minji:[695,415],sooyeon:[930,425],sua:[1160,425],taeo:[1410,425]
  };
  const used=new Set();
  for(const person of staff){
    const c=helperCrop(person.id);assert.ok(c.ownEntry,'missing explicit crop: '+person.id);
    assert.ok(c.image&&fs.existsSync(path.join(root,c.image)),'missing source: '+person.id);
    assert.ok([c.width,c.height,c.x,c.y].every(Number.isFinite),'invalid crop: '+person.id);
    assert.equal(c.trim.length,4,'four trim edges: '+person.id);
    const key=JSON.stringify(c);assert.ok(!used.has(key),'reused staff crop: '+person.id);used.add(key);
    const sheet=c.image==='assets/launch/chibi-launch-v1-day.webp';
    const scale=c.width/(sheet?1600:1152);
    assert.ok(scale<=1,'never upscale the source: '+person.id);
    assert.ok(Math.abs(c.height/(sheet?1000:1536)-scale)<1e-7,'preserve aspect ratio');
    if(sheet){
      const [cx,cy]=identities[person.id]||[];
      const px=cx*scale+c.x,py=cy*scale+c.y;
      assert.ok(Math.hypot(px-26,py-26)<9,'wrong identity region: '+person.id);
      // Conservatively enclose the frog, including its hair and suit. Even the
      // rectangular visible bounds must miss it; circular clipping only removes more.
      const [t,r,b,l]=c.trim,left=(l-c.x)/scale,top=(t-c.y)/scale;
      const right=(52-r-c.x)/scale,bottom=(52-b-c.y)/scale;
      assert.ok(right<=800||left>=1045||bottom<=568||top>=950,'chairman visible: '+person.id);
    }else{
      assert.ok(['daon','yoonseul'].includes(person.id),'unexpected sprite identity');
      assert.equal(c.image,`assets/sprites-v3/${person.id}.webp`);
      assert.ok(Math.abs(scale-0.48)<1e-9,'downsample v3 standing head');
      // Both inspected standing heads fit inside the first frame, with hair/chin margin.
      for(const [sx,sy] of [[70,16],[70,102],[35,64],[108,64]]){
        const px=sx*scale+c.x,py=sy*scale+c.y;
        assert.ok(Math.hypot(px-26,py-26)<24,'head clipped: '+person.id);
      }
      assert.ok((52-c.x)/scale<144&&(52-c.y)/scale<192,'no neighbouring sprite frame');
    }
  }
  assert.deepEqual(Object.keys(identities).sort(),plain(staff.filter(p=>!['daon','yoonseul'].includes(p.id)).map(p=>p.id).sort()));
  assert.equal(helperCrop('unknown').image,undefined,'unmapped staff must not inherit a face');
  assert.match(css,/background-image:var\(--helper-image,none\)/);
});

test('all four pet crops use approved profile art, never a frog or employee sheet',()=>{
  const profiles={'pet-cat':'cheese','pet-dog':'cream','pet-rabbit':'mochi','pet-bori':'bori'};
  const before=JSON.parse(read('artifacts/helper-bot/baseline-closure.json'));
  assert.deepEqual(plain(pets.map(p=>p.id).sort()),Object.keys(profiles).sort());
  for(const p of pets){
    const crop=helperCrop(p.id),expected='assets/profiles/thumb/hani-profile-'+profiles[p.id]+'-256.webp';
    assert.equal(crop.ownEntry,true);assert.equal(crop.image,expected);assert.ok(fs.existsSync(path.join(root,expected)));
    assert.equal(before.includes(expected),p.id!=='pet-bori','only the approved Bori thumb is newly shipped');
    assert.equal(crop.width,52);assert.equal(crop.height,52);assert.equal(crop.x,0);assert.equal(crop.y,0);
    assert.deepEqual(crop.trim,[0,0,0,0]);assert.equal(crop.shape,undefined);
  }
  assert.ok(!source.includes('seongmin.webp'));assert.ok(!source.includes('pet-frog'));
});

test('asset closure <= 160, existing images only, CSS covers canonical staff and reduced motion',async()=>{
  const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>fs.readFileSync(path.join(root,f))});
  assert.deepEqual(closure.missing,[]);assert.equal(closure.files.length,158);assert.ok(closure.files.length<=160);
  const before=JSON.parse(read('artifacts/helper-bot/baseline-closure.json'));
  assert.deepEqual(closure.files.filter(f=>!before.includes(f)).sort(),['assets/profiles/thumb/hani-profile-bori-128.webp','assets/profiles/thumb/hani-profile-bori-256.webp','assets/sprites-v3/daon.webp','assets/sprites-v3/pet-bori.webp','assets/sprites-v3/yoonseul.webp']);
  for(const p of staff){assert.ok(manifest.entries.some(e=>e.id===p.id),'missing chibi '+p.id);assert.ok(css.includes(`[data-staff="${p.id}"]`),'missing crop '+p.id);}
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{#haniHelperBot \.hani-helper-art\{animation:none\}/);
  assert.equal((source.match(/localStorage\.getItem\(POSITION_KEY\)/g)||[]).length,1);
  assert.equal((source.match(/localStorage\.setItem\(POSITION_KEY, JSON\.stringify\(value\)\)/g)||[]).length,1);
  assert.equal((source.match(/const POSITION_KEY = 'hani_helper_pos_v1';/g)||[]).length,1);
  const remaining=source.replace('localStorage.getItem(POSITION_KEY)','APPROVED_POSITION_READ').replace('localStorage.setItem(POSITION_KEY, JSON.stringify(value))','APPROVED_POSITION_WRITE');
  assert.doesNotMatch(remaining,/localStorage|sessionStorage|setInterval|setTimeout|\.setItem\(|\.removeItem\(|\.clear\(|supabase|\bagentApi\b|\bcommit\(|\bsave\(/);
});

test('pointer threshold, capture, single save and click suppression, then ordinary tap',async()=>{
  const f=fixture();await f.ready();const helper=f.document.getElementById('haniHelperBot'),face=helper.querySelector('.hani-helper-face'),panel=helper.querySelector('.hani-helper-speech');
  const writes=()=>f.storageCalls.filter(c=>c[0]==='setItem');
  f.fire('pointerdown',face,{clientX:320,clientY:770});assert.equal(face.captured,1);
  f.fire('pointermove',face,{clientX:323,clientY:774});f.fire('pointerup',face,{clientX:323,clientY:774});
  assert.equal(panel.hidden,false,'tap is resolved by pointerup even when a touch browser omits click');
  assert.equal(writes().length,0);f.fire('click',face);assert.equal(panel.hidden,false);f.fire('click',face);
  f.fire('pointerdown',face,{clientX:320,clientY:770});
  f.fire('pointermove',face,{clientX:326,clientY:770});assert.equal(helper.style.left,'302px');assert.equal(writes().length,0);
  f.fire('pointermove',face,{clientX:100,clientY:180});assert.equal(writes().length,0);
  f.fire('pointerup',face,{clientX:100,clientY:180});assert.equal(face.captured,null);assert.equal(writes().length,1);
  assert.equal(f.fire('click',face).prevented,true);assert.equal(panel.hidden,true);
  const value=JSON.parse(f.saved());assert.deepEqual(Object.keys(value).sort(),['v','x','y']);assert.equal(value.v,1);
  assert.equal(value.x,76/390);assert.equal(value.y,160/844);
  f.fire('pointerdown',face);f.fire('pointerup',face);f.fire('click',face);assert.equal(panel.hidden,false);assert.equal(writes().length,1);
  f.fire('keydown',face,{key:'Escape'});
  f.fire('pointerdown',face);f.fire('pointermove',face,{clientX:20});f.fire('pointerup',face,{clientX:20});
  f.fire('click',face,{detail:0});assert.equal(panel.hidden,false,'keyboard activation survives a drag without a synthesized click');
});

test('drag clamps all edges, survives resize/reload, user position beats input and rail avoidance',async()=>{
  const f=fixture();await f.ready();const helper=f.document.getElementById('haniHelperBot'),face=helper.querySelector('.hani-helper-face');
  const xy=()=>[parseFloat(helper.style.left),parseFloat(helper.style.top)];
  f.fire('pointerdown',face);f.fire('pointermove',face,{clientX:-9000,clientY:-9000});assert.deepEqual(xy(),[0,0]);
  f.fire('pointermove',face,{clientX:9000,clientY:9000});assert.deepEqual(xy(),[312,766]);
  f.fire('pointerup',face,{clientX:9000,clientY:9000});f.fire('click',face);
  const value=f.saved(),reloaded=fixture({stored:value});await reloaded.ready();const h=reloaded.document.getElementById('haniHelperBot');
  assert.equal(h.style.left,'312px');assert.equal(h.style.top,'766px');
  const input=new f.Element('textarea');input.box={left:0,top:0,width:390,height:844};f.document.body.append(input);input.focus();f.fire('focusin',input);assert.deepEqual(xy(),[312,766]);
  f.resize(200,150);assert.deepEqual(xy(),[122,72]);assert.equal(f.saved(),value,'resize never writes');
  const d=desktopFixture(f,1280,900);assert.ok(d.xy().left+90>d.rail.box.left,'manual position overrides rail');
  f.fire('click',face);const left=parseFloat(d.panel.style.left),top=parseFloat(d.panel.style.top);assert.ok(left>=16&&left+parseFloat(d.panel.style.width)<=1264);assert.ok(top>=16&&top+320<=884);
});

test('cancel/lost capture rolls back without saving; secondary pointers cannot interfere',async()=>{
  const f=fixture();await f.ready();const root=f.document.getElementById('haniHelperBot'),face=root.querySelector('.hani-helper-face');
  const original=root.style.left;
  f.fire('pointerdown',face,{button:2});assert.equal(face.captured,undefined);
  f.fire('pointerdown',face,{isPrimary:false});assert.equal(face.captured,undefined);
  for(const end of ['pointercancel','lostpointercapture']){
    f.fire('pointerdown',face);f.fire('pointermove',face,{pointerId:2,clientX:-100});assert.equal(root.style.left,original);
    f.fire('pointermove',face,{clientX:-100});assert.notEqual(root.style.left,original);f.fire(end,face);assert.equal(root.style.left,original);
  }
  assert.deepEqual(f.storageCalls,[['getItem','hani_helper_pos_v1']]);
});

test('strict saved-position validation, default overwrite and unavailable storage stay usable',async()=>{
  for(const stored of ['broken','null','[]','{}','{"x":0.2,"y":0.3,"v":2}','{"x":"0.2","y":0.3,"v":1}','{"x":-0.1,"y":0.3,"v":1}','{"x":0.2,"y":1.01,"v":1}','{"x":0.2,"y":null,"v":1}','{"x":0.2,"y":0.3,"v":1,"extra":1}','{"x":1,"y":1,"v":1}']){
    const f=fixture({stored});await f.ready();const h=f.document.getElementById('haniHelperBot');assert.equal(h.style.left,'296px',stored);assert.equal(h.style.top,'750px',stored);
  }
  for(const storageFails of [false,true]){
    const f=fixture({stored:'{"x":0.2,"y":0.3,"v":1}',storageFails});await f.ready();const h=f.document.getElementById('haniHelperBot'),face=h.querySelector('.hani-helper-face');
    if(!storageFails){assert.equal(h.style.left,'78px');assert.equal(h.style.top,'253.2px');}
    f.fire('click',face);f.fire('click',h.querySelector('[data-helper-reset]'));assert.equal(h.style.left,'296px');assert.equal(h.style.top,'750px');
    assert.deepEqual(f.storageCalls.filter(c=>c[0]==='setItem'),[['setItem','hani_helper_pos_v1','{"x":1,"y":1,"v":1}']]);
    if(!storageFails){const again=fixture({stored:f.saved()});await again.ready();assert.equal(again.document.getElementById('haniHelperBot').style.left,'296px');}
  }
});

test('actual app screenshots and collision read-back', {skip:!process.argv[2]}, async()=>{
  const {chromium}=await import(pathToFileURL(path.resolve(process.argv[2])).href);
  const evidence=path.join(root,'artifacts/helper-bot/round2-shots');fs.mkdirSync(evidence,{recursive:true});
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html')));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  const results=[];
  try {
    browser=await chromium.launch({executablePath:process.argv[3],headless:true});
    const origin='http://127.0.0.1:'+server.address().port;
    for(const [width,height] of [[390,844],[1280,900],[1440,900],[1920,1080]]){
      const identities=[];
      for(const day of ['2026-11-06','2026-11-07']){
        const context=await browser.newContext({viewport:{width,height},timezoneId:'Asia/Seoul'});
        await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
        const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.clock.setFixedTime(new Date(day+'T12:30:00+09:00'));
        await page.goto(origin);await page.waitForFunction(()=>!!window.HaniHelperBot&&!!window.HaniOrganizationRoster);
        await page.evaluate(()=>{
          unlockLoginGate();showView('home');
          // Simulate a populated screen using ordinary in-flow controls, without private records.
          const content=document.createElement('div');content.id='helperCrowdedFixture';
          content.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px';
          for(let i=0;i<120;i++){const b=document.createElement('button');b.textContent='화면 항목 '+i;b.style.minHeight='44px';content.append(b);}
          document.querySelector('#app > .main').prepend(content);
        });
        await page.waitForFunction(()=>!document.getElementById('haniLaunchGreeting'));
        await page.locator('#haniHelperBot').waitFor({state:'visible'});
        await page.waitForFunction(()=>document.querySelector('.hani-helper-news').textContent!=='소식을 확인하는 중이에요.');
        const helper=page.locator('#haniHelperBot'),face=helper.locator('.hani-helper-face');
        // A real click also waits out any transient launch overlay before the closed capture.
        await face.click();await page.keyboard.press('Escape');
        identities.push(await helper.getAttribute('data-staff'));
        const before=await page.evaluate(()=>localStorage.getItem('hani_os_life_v23'));
        await page.screenshot({path:path.join(evidence,`${width}-${day}-closed.png`)});
        for(const view of ['home','agentReview']){
          await page.evaluate(id=>showView(id),view);
          for(const railState of width>850?['open','mini']:['phone']){
          if(width>850){
            const mini=await page.locator('#app').evaluate(e=>e.classList.contains('hani-remote-mini'));
            if(mini!==(railState==='mini'))await page.locator('#haniContextRemote .hani-remote-collapse').click();
            await page.waitForFunction(state=>{
              const helper=document.getElementById('haniHelperBot');
              const right=state==='open'?document.getElementById('haniContextRemote').getBoundingClientRect().left:innerWidth;
              return !helper.hidden&&Math.abs(helper.getBoundingClientRect().right-(right-16))<1;
            },railState);
          }
          await face.click();await page.locator('#haniHelperSpeech').waitFor({state:'visible'});
          assert.equal(await helper.locator('.hani-helper-help').innerText(),await page.evaluate(id=>HaniHelperBot.help(id),view));
          const geometry=await helper.evaluate(el=>{
            const face=el.querySelector('.hani-helper-face').getBoundingClientRect(),panel=el.querySelector('.hani-helper-speech').getBoundingClientRect();
            const desktop=innerWidth>850,mini=document.getElementById('app').classList.contains('hani-remote-mini');
            const rail=document.getElementById('haniContextRemote'),railBox=rail.getBoundingClientRect();
            // Ordinary content may be covered by a floating helper on phone as well as PC.
            const controls=[...[...document.querySelectorAll('*')].filter(e=>['fixed','sticky'].includes(getComputedStyle(e).position)&&!(desktop&&e===rail)),
              ...(['fixed','sticky'].includes(getComputedStyle(rail).position)?[...rail.querySelectorAll('button,a[href],input,textarea,select,[role="button"]')]:[]),
              ...(document.activeElement.matches('input,textarea,select,[contenteditable="true"]')?[document.activeElement]:[])].filter(e=>!el.contains(e));
            const collisions=controls.filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width&&b.height&&s.visibility!=='hidden'&&s.opacity!=='0'&&face.left<b.right&&face.right>b.left&&face.top<b.bottom&&face.bottom>b.top;}).map(e=>({id:e.id,cls:e.className}));
            return {face:face.toJSON(),panel:panel.toJSON(),collisions,mainLeft:document.querySelector('#app > .main').getBoundingClientRect().left,columnRight:desktop&&!mini?railBox.left:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth};
          });
          assert.deepEqual(geometry.collisions,[]);assert.ok(geometry.face.right<=width&&geometry.face.bottom<=height);assert.ok(geometry.panel.top>=0&&geometry.panel.bottom<=height);assert.ok(geometry.overflow<=1);
          if(width>850){assert.ok(Math.abs(geometry.face.right-(geometry.columnRight-16))<1);assert.ok(geometry.panel.left>=geometry.mainLeft);assert.ok(geometry.panel.right<=geometry.columnRight-16+1);assert.ok(geometry.panel.bottom<=geometry.face.top-12+1);}
          await page.screenshot({path:path.join(evidence,`${width}-${day}-${view}-${railState}.png`)});
          results.push({width,height,day,view,railState,staff:identities.at(-1),geometry});
          await page.keyboard.press('Escape');assert.equal(await face.getAttribute('aria-expanded'),'false');
          }
        }
        await face.click();await helper.locator('[data-helper-go="ilbo"]').click();assert.equal(await page.evaluate(()=>document.body.dataset.view),'ilbo');
        await face.click();await helper.locator('[data-helper-close]').click();assert.equal(await face.getAttribute('aria-expanded'),'false');
        await face.click();await page.locator('#title').click();assert.equal(await face.getAttribute('aria-expanded'),'false');
        assert.equal(await page.locator('#haniHelperBot').count(),1);
        assert.equal(await page.evaluate(()=>localStorage.getItem('hani_os_life_v23')),before);
        await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await helper.locator('.hani-helper-art').evaluate(e=>getComputedStyle(e).animationName),'none');
        assert.deepEqual(errors,[]);await context.close();
      }
      assert.notEqual(identities[0],identities[1]);
    }
    fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(results,null,2));
  } finally {await browser?.close();await new Promise(r=>server.close(r));}
});
