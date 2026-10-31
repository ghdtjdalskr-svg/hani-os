// Node-only execution of the actual owners. These doubles do not prove pixels
// or Android performance; the reviewer runs the real browser checks separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {loadScene} from './hani-office-lively-fixture.mjs';
import {readPhoneLabels,assertPhoneLabels} from './hani-office-obr18-browser-geometry.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const source=read('hani-office-live.js'),css=read('hani-office-live.css');
const {scene,table}=loadScene(),m=scene.motion,s=scene.scheduler;
const plain=x=>JSON.parse(JSON.stringify(x));
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});

test('distance, not elapsed ticks, swaps both walk frames; stopping and resampling never invent steps',()=>{
  for(const [distance,pose] of [[0,'walk-a'],[59.99,'walk-a'],[60,'walk-b'],[119.99,'walk-b'],[120,'walk-a']]){
    assert.equal(m.gait(distance,1).pose,pose);
    for(let n=0;n<20;n++)assert.equal(m.gait(distance,-1).pose,pose);
  }
  assert.equal(m.gait(30,1).bounce,-.65);assert.equal(m.gait(30,-1).lean,-.9);
  assert.equal(m.gait(30,0).lean,0);
});

test('scheduler source remains byte-identical, including every route and arrival calculation',()=>{
  const normalized=source.replace(/\r/g,''),scheduler=normalized.slice(normalized.indexOf('  function createScheduler('),normalized.indexOf('  // Read-only label geometry'));
  assert.equal(createHash('sha256').update(scheduler).digest('hex'),'489abfb9052be195a9c2aba98ec4596aa1c46514cd15538a4316f5cb63cf5cea');
  const placement=normalized.slice(normalized.indexOf('  function placeStatusLabels('),normalized.indexOf('  const scheduler='));
  assert.equal(createHash('sha256').update(placement).digest('hex'),'5070f7e62556b89410bc7588600fefe80ba99579e945ae49bab89def98bec6f0','placeStatusLabels rules remain unchanged');
});

test('current-time projection follows scheduler stateAt on every sampled leg, wait, floor change and exact arrival',()=>{
  const formal=s.plan('2026-10-22',{chairmanPresent:true});
  const events=[...formal,...s.blockPlan('2026-10-22',0,formal,{chairmanPresent:true})];let samples=0,walks=0;
  for(const event of events.filter((_,i)=>i%7===0))for(const person of event.people){
    const times=new Set([event.start,event.end,...[...person.out,...person.back].flatMap(l=>[l.start,l.start+(l.end-l.start)*.25,l.start+(l.end-l.start)*.75,l.end-1e-6,l.end])]);
    for(const seconds of times){
      const actual=m.sample(event,person,seconds),expected=s.stateAt(event,person,seconds);
      for(const key of ['state','seat','floor','position','walking','waiting'])assert.deepEqual(plain(actual[key]??null),plain(expected[key]??null),event.id+' '+seconds+' '+key);
      if(actual.walking){walks++;assert.ok(actual.position);assert.ok(actual.distance>=0)}samples++;
    }
  }
  assert.ok(samples>1000&&walks>100);
});

test('reduced motion removes every one-shot and gait effect, with scheduler positions unchanged',()=>{
  for(const kind of Object.keys(m.effectDurations)){
    const r=m.createReactions();r.request(kind,0);assert.ok(r.tick(0));assert.equal(r.tick(1,true),null);assert.equal(r.tick(9999),null);
  }
  for(const distance of [0,30,60,150]){const gait=m.gait(distance,1,true);assert.equal(gait.bounce,0);assert.equal(gait.lean,0)}
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\s*\.hani-office-sprite\{animation:none!important;transform:none!important;rotate:none!important\}/);
  assert.match(css,/\.hani-desk-mascot\{animation:none!important;transform:translate\(-50%,-100%\)!important\}/);
});

test('greeting, conversation and tap reactions wait until walking ends and coalesce repeated taps',()=>{
  const r=m.createReactions();r.observe({person:'hani',partner:'yuri',greeting:'true',speaking:'true'},0);
  for(let now=0;now<1000;now+=34)assert.equal(r.tick(now,false,true),null);
  assert.equal(r.tick(1000).kind,'nod');assert.equal(r.tick(1460).kind,'lean');assert.equal(r.tick(2080),null);
  r.observe({person:'hani',partner:'yuri',greeting:'true',speaking:'true'},3000);assert.equal(r.tick(3000),null,'unchanged states do not replay');
  r.request('tap',3100);r.request('tap',3101);assert.equal(r.tick(3102).kind,'tap');
  assert.equal(r.tick(3200,false,true),null);assert.equal(r.tick(5000).kind,'tap');assert.equal(r.tick(5440),null);assert.equal(r.tick(6000),null);
  const later=m.createReactions();later.observe({person:'yuri',partner:'hani'},0);assert.equal(later.tick(319),null);assert.equal(later.tick(320).kind,'lean');
});

test('all one-shot effects finish, clear their state, and never repeat without a new trigger',()=>{
  for(const [kind,duration] of Object.entries(m.effectDurations)){
    const r=m.createReactions();r.request(kind,0);assert.equal(r.tick(0).kind,kind);assert.ok(r.tick(duration-1));assert.equal(r.tick(duration),null);assert.equal(r.tick(duration*10),null);
    r.request(kind,duration*11);assert.ok(r.tick(duration*11));r.reset();assert.equal(r.tick(duration*11+1),null);
  }
});

test('stable actor and mascot measurement keeps label packing identical through bounce, lean, dip and hop',()=>{
  const actor={dataset:{facing:'right'},getBoundingClientRect:()=>rect(100,80,30,40),querySelector:()=>{throw Error('animated sprite must not be measured')}};
  const make=()=>{const box=m.stableActorBox(actor);return [{id:'hani',compact:true,priority:1,actor:box,sprite:m.stableSpriteBox(actor,box),name:rect(0,0,85,10),nameOnly:rect(0,0,25,10),status:rect(0,0,0,0)}]};
  const image={offsetWidth:16,offsetHeight:16,offsetLeft:220,offsetTop:160,offsetParent:{clientLeft:0,clientTop:0},getBoundingClientRect:()=>{throw Error('animated mascot must not be measured')}};
  const floor=rect(0,0,360,202),before=plain([...scene.labels.place(floor,make(),[m.stableMascotBox(image,floor)])]);
  for(const effect of ['stand','sit','nod','lean','tap']){
    actor.dataset.motion=effect;image.dataset={motion:'hop'};
    assert.deepEqual(plain([...scene.labels.place(floor,make(),[m.stableMascotBox(image,floor)])]),before);
  }
});

test('phone checker independently uses the same stable facing box through all visual phases and still rejects ambiguous ownership',()=>{
  let phase=0;
  const floor=rect(0,0,360,202),heads=[rect(100,80,30,40),rect(134,80,30,40)];
  const make=(id,index)=>{
    const sprite={offsetWidth:30,offsetHeight:40,offsetLeft:0,offsetTop:0,getBoundingClientRect:()=>rect(heads[index].left,80-phase,30,40+phase)};
    const name={hidden:false,title:id,getBoundingClientRect:()=>rect(index?220:100,69,30,10)},status={hidden:false,dataset:{full:'업무 메모 중'}};
    const dot={hidden:true},line={hidden:false,textContent:' · 메모쓰기'};
    return {hidden:false,dataset:{person:id,labelMode:index?'dot':'name'},officeName:{textContent:id},officeCompact:line,getBoundingClientRect:()=>heads[index],sprite,name,
      querySelector:s=>({'.hani-office-sprite':sprite,'.hani-office-name':name,'.hani-office-status':status,'.hani-office-status-dot':dot,'.hani-office-compact-line':line})[s]};
  };
  const actors=[make('hani',0),make('yuri',1)],map={dataset:{floor:'1f'},getBoundingClientRect:()=>floor,querySelectorAll:()=>[]};
  for(const reduced of [false,true])for(const facing of ['','left','right']){
    const style={display:'block',visibility:'visible',fontSize:'10px',rotate:reduced?'none':facing==='left'?'-4deg':facing==='right'?'4deg':'none',getPropertyValue:k=>k==='--idle-pivot-x'?'50%':'95.3125%'};
    const readLabels=()=>plain(vm.runInNewContext('('+readPhoneLabels.toString()+')()',{document:{getElementById:()=>map,querySelectorAll:()=>actors},matchMedia:()=>({matches:true}),getComputedStyle:()=>style,HaniBuildingScene:scene}));
    phase=0;const baseline=readLabels();assert.deepEqual(baseline.ambiguous,[]);
    for(let i=0;i<actors.length;i++){
      const expected=m.stableSpriteBox({dataset:{facing},officePivot:[.5,.953125]},heads[i],reduced);
      for(const key of ['left','top','right','bottom'])assert.ok(Math.abs(baseline.rows[i].head[key]-expected[key])<1e-9,key);
    }
    for(const value of [-1.2,-.65,0,.48]){phase=value;assert.deepEqual(readLabels(),baseline,'visual phase cannot change ownership or coverage')}
    const saved=actors[0].name.getBoundingClientRect;actors[0].name.getBoundingClientRect=()=>rect(134,69,30,10);
    assert.ok(readLabels().ambiguous.includes('hani'),'stable measurement must still reject a label closer to another person');actors[0].name.getBoundingClientRect=saved;
    const bad={...baseline,phone:true,missing:[],ambiguous:['hani'],distant:[],overlap:[],spriteOverlap:[],mascotOverlap:[],outside:[]};
    assert.throws(()=>assertPhoneLabels(bad));
  }
});

// Reuse the existing DOM-double factory. Runtime owners execute unmodified.
function mounted(){
  const factorySource=read('scripts/hani-building-206-engine.test.mjs');
  const factory=factorySource.slice(factorySource.indexOf('export function fixture('),factorySource.indexOf('\ntest(')).replace('export function','function');
  let intersection,resize;const timeouts=[];
  const env={IntersectionObserver:class{constructor(fn){intersection=fn}observe(){}},ResizeObserver:class{constructor(fn){resize=fn}observe(){}},setTimeout:fn=>{timeouts.push(fn)}};
  const assets={canon:JSON.parse(read('data/hani-building/spatial-contract.json')),art:JSON.parse(read('data/hani-building/art-map-v1.json')),sprites:JSON.parse(read('assets/sprites-v2/manifest.json')),places:JSON.parse(read('data/hani-building/office-places.json'))};
  const make=vm.runInNewContext(factory+';fixture',{vm,read,assets,setTimeout,console});
  const f=make('09:00',false,()=>true,table,env);f.context.window.HaniBuildingScene=f.context.HaniBuildingScene;
  f.map.clientWidth=360;f.map.clientHeight=202;resize();
  return {...f,intersection:visible=>intersection([{isIntersecting:visible}]),timeouts,tick:f.timers.find(t=>t.ms===100).fn};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};

test('217 floor art and desk-prop readiness commits offscreen while movement stays paused',async()=>{
  const f=mounted();await flush();f.setReduced(true);f.intersection(false);
  const nodes=[...f.ids.get('haniOfficeActors').children];
  for(const floor of ['4f','3f','2f','1f','5f']){
    f.click(floor);await flush();
    const expected=f.context.HaniBuildingScene.floors.find(p=>p.id===floor);
    assert.equal(f.map.dataset.floor,floor);assert.equal(f.map.dataset.art,'floor');assert.equal(f.map.querySelector('.hani-office-background').src,expected.background);
    const props=f.map.querySelectorAll('.hani-office-desk-props').filter(p=>!p.hidden);
    assert.equal(props.length,f.context.HaniBuildingScene.art.floors[floor].deskProps.length);
    for(const image of props)assert.ok(image.src);
    const before=nodes.map(a=>[a.style.left,a.style.top]);f.tick();assert.deepEqual(nodes.map(a=>[a.style.left,a.style.top]),before);
    assert.equal(f.root.dataset.paused,'true');assert.deepEqual([...f.ids.get('haniOfficeActors').children],nodes);
  }
});

test('actual owner uses one 100ms motion clock, preserves actor slots, pauses offscreen/hidden and resumes at current scheduler time',async()=>{
  const f=mounted();await flush();const nodes=[...f.ids.get('haniOfficeActors').children];
  assert.equal(f.timers.length,2);assert.equal(f.timers.filter(t=>t.ms===100).length,1);
  const start=Date.parse('2026-10-22T09:00:00+09:00');f.setDateTime(start);f.click('1f');
  f.intersection(false);assert.equal(f.root.dataset.paused,'true');const before=nodes.map(a=>a.style.left);
  f.setDateTime(start+120000);f.tick();assert.deepEqual(nodes.map(a=>a.style.left),before);
  f.intersection(true);assert.equal(f.root.dataset.paused,'false');assert.equal(f.ids.get('haniOfficeActors').children.length,nodes.length);assert.ok(nodes.every((node,i)=>f.ids.get('haniOfficeActors').children[i]===node));
  const snap=f.context.HaniBuildingScene.snapshot(new Date(start+120000));
  for(const actor of f.visible()){const p=[...snap.entries,...snap.visitors].find(p=>p.id===actor.dataset.person);assert.ok(p);assert.equal(actor.style.left,(p.position||[p.seat.x,p.seat.y])[0]+'%')}
  f.document.hidden=true;f.document.events.visibilitychange();f.setDateTime(start+240000);const hidden=nodes.map(a=>a.style.left);f.tick();assert.deepEqual(nodes.map(a=>a.style.left),hidden);
  f.document.hidden=false;f.document.events.visibilitychange();assert.equal(f.root.dataset.paused,'false');
});

test('actual tap keeps delegated bubble handling and clears its hop after one cycle',async()=>{
  const f=mounted();await flush();const actor=f.visible()[0],base=Date.parse('2026-10-11T09:00:00+09:00');
  f.ids.get('haniOfficeActors').events.click({target:actor});
  const panel=f.root.querySelector('.hani-office-character-bubble');assert.equal(panel.hidden,false);assert.ok(panel.querySelector('p').textContent.includes(actor.dataset.name));
  f.setDateTime(base+34);f.tick();assert.equal(actor.dataset.motion,'tap');
  f.setDateTime(base+480);f.tick();assert.equal(actor.dataset.motion,undefined);
  f.setDateTime(base+1000);f.tick();assert.equal(actor.dataset.motion,undefined);assert.equal(panel.hidden,false,'existing bubble lifetime is independent');
});

test('actual walking advances canonical left/top on one tick and follows reserved distance frames without label refits',async()=>{
  const f=mounted();await flush();const api=f.context.HaniBuildingScene,day='2026-10-22',midnight=Date.parse(day+'T00:00:00+09:00');
  let picked;
  for(const event of api.scheduler.plan(day))for(const person of event.people)for(const leg of person.out){
    if(!picked&&leg.end-leg.start>1&&api.anchors.get(leg.from).floor===api.anchors.get(leg.to).floor)picked={event,person,leg};
  }
  assert.ok(picked);const {event,person,leg}=picked;
  f.setDateTime(midnight+(leg.start+.1)*1000);f.click(api.anchors.get(leg.from).floor);await flush();
  const actor=f.visible().find(a=>a.dataset.person===person.id);assert.ok(actor);
  let reads=0;f.map.getBoundingClientRect=()=>{reads++;return null};
  const feet=[actor.style.left,actor.style.top];
  f.setDateTime(midnight+(leg.start+.2)*1000);f.tick();
  assert.notDeepEqual([actor.style.left,actor.style.top],feet);
  const before=reads;
  for(const delta of [.3,.4,.5]){
    const now=Math.round(midnight+(leg.start+delta)*1000);f.setDateTime(now);f.tick();
    const expected=api.motion.sample(event,person,(now-midnight)/1000);
    assert.deepEqual(plain(actor.officePosition),plain(expected.position));assert.equal(actor.dataset.pose,expected.pose);
    assert.deepEqual([actor.style.left,actor.style.top],plain(expected.position).map(p=>p+'%'));
  }
  assert.equal(reads,before,'walking frames do not refit labels');
  const sprite=actor.querySelector('.hani-office-sprite'),frozen=[actor.style.left,actor.style.top,actor.dataset.pose,sprite.style.backgroundPosition];
  f.hide();f.setDateTime(midnight+(leg.start+.7)*1000);f.tick();
  assert.deepEqual([actor.style.left,actor.style.top,actor.dataset.pose,sprite.style.backgroundPosition],frozen,'hidden moving actors pause coordinates and sprite frames');
  f.show();const now=Math.round(midnight+(leg.start+.8)*1000);f.setDateTime(now);f.tick();
  const resumed=api.motion.sample(event,person,(now-midnight)/1000);
  assert.deepEqual([actor.style.left,actor.style.top],plain(resumed.position).map(p=>p+'%'));assert.equal(actor.dataset.pose,resumed.pose);
});

test('scheduled stand anticipation starts before departure and never shifts its route or arrival time',async()=>{
  const f=mounted();await flush();const api=f.context.HaniBuildingScene,day='2026-10-22',midnight=Date.parse(day+'T00:00:00+09:00');
  let picked;
  for(const event of api.scheduler.plan(day))for(const person of event.people){const leg=person.out[0];
    if(!picked&&person.id!=='mir'&&leg&&leg.end-leg.start>1&&api.anchors.get(leg.from).floor===api.anchors.get(leg.to).floor)picked={event,person,leg};
  }
  const {event,person,leg}=picked;
  f.setDateTime(midnight+(leg.start-.25)*1000);f.click(api.anchors.get(leg.from).floor);await flush();
  const actor=f.visible().find(a=>a.dataset.person===person.id),feet=[actor.style.left,actor.style.top];assert.equal(actor.dataset.pose,'sitting');
  f.setDateTime(midnight+(leg.start-.15)*1000);f.tick();assert.equal(actor.dataset.motion,'stand');assert.equal(actor.dataset.pose,'sitting');assert.deepEqual([actor.style.left,actor.style.top],feet);
  const now=Math.round(midnight+(leg.start+.01)*1000);f.setDateTime(now);f.tick();
  assert.equal(actor.dataset.walking,'true');assert.match(actor.dataset.pose,/^walk-/);assert.equal(actor.dataset.motion,undefined);
  assert.deepEqual(plain(actor.officePosition),plain(api.scheduler.stateAt(event,person,(now-midnight)/1000).position));
});

test('actual mascot owner shares the office clock, reacts once on return, limits concurrency and clears reduced/hidden effects',async()=>{
  const f=mounted();await flush();
  const prototype=Object.getPrototypeOf(f.map);prototype.hasAttribute=function(k){return this.getAttribute(k)!==null};
  f.context.fetch=async()=>({ok:true,json:async()=>JSON.parse(read('assets/data/desk-mascots-v1.json'))});
  f.map.dataset.art='floor';const timers=f.timers.length;vm.runInContext(read('hani-desk-mascots.js'),f.context);await flush();
  const images=f.map.querySelectorAll('.hani-desk-mascot');assert.ok(images.length>10);for(const image of images)image.dataset.ready='true';
  const actors=new Map(f.ids.get('haniOfficeActors').children.map(a=>[a.dataset.person,a]));
  const chosen=images.find(i=>i.parentElement.dataset.floor===f.map.dataset.floor&&actors.has(i.dataset.person));assert.ok(chosen);
  const owner=actors.get(chosen.dataset.person);owner.dataset.behavior='AT_HOME';owner.dataset.walking='false';owner.officeAnchor=chosen.dataset.anchor;
  const tick=(now,extra={})=>f.map.officeMascotMotion({now,reduced:false,visible:true,actors,...extra});
  const active=()=>images.filter(i=>i.dataset.motion);
  tick(0);assert.equal(active().length,0);
  owner.dataset.walking='true';tick(100);owner.dataset.walking='false';tick(200);assert.equal(chosen.dataset.motion,'hop');assert.equal(active().length,1);
  tick(680);assert.equal(active().length,0);tick(1000);assert.equal(active().length,0,'same home state never replays');
  tick(18000);assert.equal(active().length,1);assert.ok(active().every(i=>i.parentElement.dataset.floor===f.map.dataset.floor));
  tick(18034,{reduced:true});assert.equal(active().length,0);tick(18068);assert.equal(active().length,0);
  tick(36000);assert.equal(active().length,1);tick(36034,{visible:false});assert.equal(active().length,0);
  assert.equal(f.timers.length,timers,'mascots add no timer');
});

test('actual sit/stand changes logical pose immediately while the visual dip is a single independent effect',()=>{
  const sprite={style:{}},actor={dataset:{person:'hani',avatar:'pending',pose:'sitting'},style:{setProperty(){}},querySelector:()=>sprite,officeReactions:m.createReactions()};
  let now=0;const c={Date:{now:()=>now},reduced:false,spriteEntries:new Map(),spriteId:()=>'',actor};
  const poseSource=source.slice(source.indexOf('  function pose(actor,name)'),source.indexOf('  function loadSprite('));
  vm.runInNewContext(poseSource+';pose(actor,"standing")',c);
  assert.equal(actor.dataset.pose,'standing');assert.equal(actor.officeReactions.tick(0).kind,'stand');
  now=200;vm.runInNewContext('pose(actor,"standing")',c);assert.equal(actor.dataset.pose,'standing');assert.equal(actor.officeReactions.tick(480),null);
  now=600;vm.runInNewContext('pose(actor,"sitting")',c);assert.equal(actor.dataset.pose,'sitting');assert.equal(actor.officeReactions.tick(600).kind,'sit');assert.equal(actor.officeReactions.tick(1120),null);
  assert.ok(!('left' in actor.style)&&!('top' in actor.style));
});

test('walking frames update canonical coordinates without label refits or layout reads',()=>{
  const body=source.slice(source.indexOf('  setInterval(()=>{const now=Date.now()'),source.indexOf('  setInterval(changeOne'));
  assert.doesNotMatch(body,/getBoundingClientRect|offsetWidth|offsetHeight|clientWidth|clientHeight|fitStatusLabels\(|fitBubble\(|getComputedStyle/);
  assert.match(body,/moveActor\(actor,state.position\)/);assert.doesNotMatch(body,/place\(actor/);
  assert.doesNotMatch(css,/--travel-[xy]/);
  for(const kind of ['stand','sit','nod','lean','tap'])assert.match(css,new RegExp('data-motion="'+kind+'"'));
});
