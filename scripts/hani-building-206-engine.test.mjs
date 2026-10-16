// Execute the actual scene owner with DOM doubles; this does not assert pixel layout.
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
export function fixture(time='09:00',reduced=false,loadArt=null){
 const ids=new Map(),timers=[],observers=[];let clock=new Date(`2026-10-11T${time}:00+09:00`).getTime();
 class Element{
  constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.events={};this.style={setProperty(k,v){this[k]=v}};this.hidden=false;this.className='';this.textContent='';this.classList={contains:c=>this.className.split(' ').includes(c),add:c=>{this.className+=' '+c}}}
  set id(v){this._id=v;ids.set(v,this)}get id(){return this._id}
  append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n)}}
  after(node){this.parentElement.append(node)}
  setAttribute(k,v){this.attributes[k]=String(v)}getAttribute(k){return this.attributes[k]??(k==='src'?this.src:null)}
  addEventListener(k,fn){this.events[k]=fn}contains(node){return this===node||this.children.some(c=>c.contains(node))}
  closest(selector){if(selector==='.view')return view;if(selector==='[data-building-floor]'&&this.dataset.buildingFloor)return this;return this.parentElement?.closest(selector)||null}
  querySelectorAll(selector){const descendants=this.children.flatMap(c=>[c,...c.querySelectorAll('*')]);return selector==='*'?descendants:descendants.filter(c=>selector.split(',').some(s=>s.startsWith('.')?c.classList.contains(s.slice(1)):c.tagName===s))}
  querySelector(s){return this.querySelectorAll(s)[0]||null}replaceChildren(...nodes){this.children=[];this.append(...nodes)}
  focus(){document.activeElement=this}scrollIntoView(){}get firstElementChild(){return this.children[0]||null}
 }
 const document={hidden:false,events:{},getElementById:id=>ids.get(id)||null,createElement:t=>new Element(t),addEventListener(k,fn){this.events[k]=fn}};
 const view=new Element();view.className='view active';const root=new Element();root.id='haniOfficeLive';view.append(root);
 const tabs=new Element();tabs.className='hani-building-tabs';const scroll=new Element();scroll.className='hani-office-scroll';const map=new Element();map.id='haniOfficeMap';scroll.append(map);root.append(tabs,scroll);
 for(const cls of ['hani-office-background','hani-office-foreground','hani-office-foreground','hani-office-foreground']){const img=new Element('img');img.className=cls;map.append(img)}
 for(const id of ['haniOfficeActors','haniOfficeConversation','haniOfficeMeeting','haniOfficeParticipants','haniOfficeQuestions','haniOfficeMeetingOpen','haniOfficeReturn','haniOfficeCaseState','haniOfficeReportLink','haniOfficeMeetingTitle','haniOfficeMeetingMeta','agentCaseDetail']){const el=new Element();el.id=id;root.append(el)}
 ids.get('haniOfficeMeeting').hidden=true;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}}
 let availableArt=null;
 class Image{set src(v){if(v===availableArt||loadArt?.(v))this.onload();else this.onerror()}}
 const context=vm.createContext({document,window:{},Date:Clock,Image,matchMedia:()=>({matches:reduced}),getComputedStyle:()=>({display:'block'}),MutationObserver:class{constructor(cb){observers.push(cb)}observe(){}},setInterval:(fn,ms)=>{timers.push({fn,ms})},setTimeout,console});
 // Canonical roster publishes even when its own view is absent.
 vm.runInContext(read('hani-organization-hub.js'),context);vm.runInContext(read('hani-office-live.js'),context);
 const click=floor=>tabs.events.click({target:[...tabs.children].find(b=>b.dataset.buildingFloor===floor)});
 const visible=()=>ids.get('haniOfficeActors').children.filter(a=>!a.hidden);
 return {context,ids,root,map,tabs,click,visible,timers,document,setTime:t=>{clock=new Date(`2026-10-11T${t}:00+09:00`).getTime()},hide:()=>{view.className='view';observers[0]()},show:()=>{view.className='view active';observers[0]()},art:value=>{availableArt=value}};
}
test('actual owner reuses 17 actors and a single host across all floor clicks',()=>{
 const f=fixture(),actors=[...f.ids.get('haniOfficeActors').children];assert.equal(actors.length,17);assert.equal(f.map.dataset.floor,'4f');
 for(const [floor,n] of [['3f',5],['2f',6],['1f',3],['4f',3]]){f.click(floor);assert.equal(f.map.dataset.floor,floor);assert.equal(f.visible().length,n);assert.deepEqual(f.ids.get('haniOfficeActors').children,actors);assert.equal(f.tabs.children.filter(b=>b.getAttribute('aria-selected')==='true').length,1);assert.ok(f.visible().every(a=>a.officeRow.hidden===false))}
 assert.ok(f.visible().every(a=>a.officeText.textContent));assert.equal(f.map.dataset.art,'fallback');
});
test('actual owner places break visitors in lounge, meeting leads in conference, caps and counts overflow',()=>{
 const f=fixture('12:05');assert.ok(f.visible().filter(a=>a.dataset.activity==='rest').every(a=>Number(a.style.left.slice(0,-1))>=68));
 f.setTime('10:05');f.click('2f');assert.equal(f.visible().length,6);assert.equal(f.map.querySelector('.hani-building-overflow').textContent,'+2');
 assert.deepEqual(f.visible().filter(a=>a.dataset.activity==='meeting').map(a=>a.dataset.person).sort(),['hani','jieun','seoyun']);assert.match(f.tabs.children.find(b=>b.dataset.buildingFloor==='2f').querySelector('small').textContent,/근무 8 · 휴식 0/);
});
test('actual owner loads future art when present and caches fallback when absent',()=>{const f=fixture();f.art('./assets/building/floor-3f-v1.webp');f.click('3f');assert.equal(f.map.dataset.art,'floor');assert.equal(f.map.querySelector('.hani-office-background').src,'./assets/building/floor-3f-v1.webp');f.click('1f');assert.equal(f.map.dataset.art,'fallback')});
test('hidden view and document pause sprite frames and behaviour; visible view resumes',()=>{
 const f=fixture(),action=f.timers.find(t=>t.ms===4200),frames=f.timers.find(t=>t.ms===600),actor=f.visible()[0],sprite=actor.querySelector('.hani-office-sprite'),initialFrame=sprite.style.backgroundPosition;
 f.hide();assert.equal(f.root.dataset.paused,'true');const previous=actor.officeText.textContent;for(let n=0;n<20;n++)for(const timer of f.timers)timer.fn();assert.equal(actor.officeText.textContent,previous);assert.equal(sprite.style.backgroundPosition,initialFrame);
 f.show();assert.equal(f.root.dataset.paused,'false');f.document.hidden=true;f.document.events.visibilitychange();action.fn();assert.equal(f.root.dataset.paused,'true');assert.equal(actor.officeText.textContent,previous);
 f.document.hidden=false;f.document.events.visibilitychange();frames.fn();assert.notEqual(sprite.style.backgroundPosition,initialFrame);for(let n=0;n<12;n++)action.fn();assert.ok(f.visible().some(a=>a.officeText.textContent!==previous));
});
test('existing case meeting stays available during floor switches and returns to prior floor',async()=>{
 const f=fixture('09:00',true);f.context.window.haniOfficeLiveUpdate({case:{id:'synthetic',title:'합성 안건'},reviews:[{agent_key:'JIEUN',review_round:1,summary:'저장된 의견'}]});
 await f.ids.get('haniOfficeMeetingOpen').events.click();assert.equal(f.map.dataset.state,'meeting');assert.equal(f.map.dataset.floor,'2f');assert.equal(f.ids.get('haniOfficeMeeting').hidden,false);assert.equal(f.visible().length,2);
 f.click('3f');assert.equal(f.ids.get('haniOfficeMeeting').hidden,false);assert.equal(f.visible().length,5);await f.ids.get('haniOfficeReturn').events.click();assert.equal(f.map.dataset.floor,'4f');assert.equal(f.map.dataset.state,'idle');assert.equal(f.visible().length,3);
});
test('summon animation waits while its view is hidden and resumes without a second engine',async()=>{
 const f=fixture('09:00',true);f.context.window.haniOfficeLiveUpdate({case:{id:'synthetic',title:'숨김 중 회의'},reviews:[]});
 const opening=f.ids.get('haniOfficeMeetingOpen').events.click();f.hide();const actor=f.visible()[0],position=actor.style.left;
 await new Promise(resolve=>setTimeout(resolve,90));assert.equal(actor.style.left,position);assert.equal(f.ids.get('haniOfficeMeeting').hidden,true);
 f.show();await opening;assert.equal(f.ids.get('haniOfficeMeeting').hidden,false);assert.equal(f.map.dataset.state,'meeting');
});
