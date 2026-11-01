// Real label functions + persistent renderer with DOM doubles; pixel QA is separate.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';

const read=f=>fs.readFileSync(f,'utf8'),source=read('hani-office-live.js'),css=read('hani-office-live.css');
const {scene}=loadScene(),states=['work','rest','meeting','moving','night'];
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const short=(line,state='work',used=new Set(),compact=true)=>scene.labels.short(line,used,state,compact);
const phrase=(line,state='work',used=new Set(),compact=true)=>{
 const result=short(line,state,used,compact);
 assert.ok([...result].length>0&&[...result].length<=(compact?6:8),JSON.stringify({line,result,compact}));
 assert.match(result,/^[가-힣A-Za-z0-9 ]+$/);assert.doesNotMatch(result,/…|\.{2,}/);
 if(state==='rest')assert.doesNotMatch(result,/근무\s*중|일하는\s*중|업무 (?:진행|이어감|보는)/,'leisure never falls back to work: '+line);
 assert.equal(short(line,state,new Set(),compact),short(line,state,new Set(),compact),'stable for a source sentence');return result;
};
function strings(value,into){if(typeof value==='string')into.add(value);else if(value&&typeof value==='object')for(const v of Object.values(value))strings(v,into)}

test('QA18/19: every vocabulary sentence has a display state and whole phone <=6 / wide <=8 phrases',()=>{
 const corpus=new Set();
 for(const file of ['assets/data/office-actions-216.json','assets/data/office-actions-221.json','data/hani-building/office-places.json'])strings(JSON.parse(read(file)),corpus);
 // Include every literal in the scheduler, not only actions chosen on sample days.
 const schedulerSource=source.slice(source.indexOf('  function createScheduler('),source.indexOf('  // Read-only label geometry'));
 for(const m of schedulerSource.matchAll(/(['"])((?:\\.|(?!\1)[^\\\r\n])*?)\1/g))if(/[가-힣]/.test(m[2]))corpus.add(m[2]);
 assert.ok(corpus.size>500);
 const vocabulary=[];
 for(const line of corpus){const {actor}=actorStub('work',{zone:'desk'}),state=labels.activityStatus(actor,line);assert.ok(states.includes(state));vocabulary.push({line,state,phone:phrase(line,state),wide:phrase(line,state,new Set(),false)})}
 // Retain the original all-state vocabulary regression, now for both widths.
 for(const line of corpus)for(const state of states)for(const compact of [true,false])phrase(line,state,new Set(),compact);
 let generated=0;
 for(const day of ['2026-10-22','2026-11-07'])for(const chairmanPresent of [false,true]){
  const options={chairmanPresent},s=scene.scheduler,formal=s.plan(day,options),out=s.blockPlan(day,0,formal,options);
  const times=new Set(Array.from({length:144},(_,i)=>i*600));
  const kinds=new Map();for(const e of [...formal,...out]){const key=e.actionId+'|'+e.card?.id+'|'+e.visitor?.kind;if(!kinds.has(key))kinds.set(key,e)}
  for(const e of kinds.values())for(const t of [e.start,e.performStart,(e.performStart+e.performEnd)/2,e.performEnd,e.end-.001])if(t>=0&&t<86400)times.add(t);
  for(const seconds of times){const snap=s.snapshot(at(day,seconds),options),usedByFloor=new Map();for(const p of [...snap.entries,...snap.visitors]){
   const full=p.line,{actor}=actorStub(p.activity,{zone:p.seat?.zone,walking:String(p.walking)}),state=labels.activityStatus(actor,full);assert.ok(states.includes(state));
   for(const compact of [true,false]){const key=p.floor+'|'+compact,used=usedByFloor.get(key)||new Set();usedByFloor.set(key,used);phrase(full,state,used,compact)}assert.equal(p.line,full);generated++;
  }}
 }
 fs.writeFileSync('artifacts/office-labels-qa/review-vocabulary-states.json',JSON.stringify(vocabulary,null,2)+'\n');
 console.log('QA18 coverage',{authoredStrings:corpus.size,generatedSentences:generated,stateCounts:Object.fromEntries(states.map(s=>[s,vocabulary.filter(v=>v.state===s).length]))});assert.ok(generated>10000);
});

test('QA18: unknown sentences use state fallbacks; used set selects whole alternatives',()=>{
 for(const [state,expected]of Object.entries({work:'근무중',rest:'휴식중',meeting:'회의중',moving:'이동중',night:'야근중'})){
  assert.equal(short('새로운활동문장',state),expected);
  const used=new Set(),words=Array.from({length:8},()=>phrase('새로운활동문장',state,used));assert.equal(new Set(words).size,8);
 }
 assert.equal(short('알수없는문장','future'),'근무중');assert.equal(short('회장님께 ... 보고 중'),'회장보고');
});

const statusSource=source.slice(source.indexOf('  function activityStatus('),source.indexOf('  // Batch reset'));
function actorStub(activity,extra={}){
 const node=()=>({dataset:{},textContent:'',setAttribute(k,v){this[k]=v}}),status=node(),icon=node(),dot=node(),actor={dataset:{name:'하니',activity,...extra},officeText:node(),setAttribute(k,v){this[k]=v},querySelector:s=>({'.hani-office-status':status,'.hani-office-activity-icon':icon,'.hani-office-status-dot':dot})[s]};
 return {actor,status,icon,dot};
}
const labels=vm.runInNewContext(statusSource+';({activityStatus,label})',{HaniBuildingScene:scene,matchMedia:()=>({matches:false})});
const luminance=hex=>{const chars=hex.slice(1),rgb=chars.length===3?[...chars].map(x=>parseInt(x+x,16)):chars.match(/../g).map(x=>parseInt(x,16));return rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((a,b,i)=>a+b*[.2126,.7152,.0722][i],0)};

test('QA19: real single status owner maps work/rest/play/meeting/moving/night to AA CSS colours',()=>{
 const palette={};for(const state of states){const body=css.match(new RegExp('\\[data-status="'+state+'"\\]\\{([^}]+)\\}'))?.[1];assert.ok(body,state);palette[state]=Object.fromEntries([...body.matchAll(/--activity-(bg|ink|border):(#[\da-f]+)/gi)].map(m=>[m[1],m[2]]));const a=luminance(palette[state].bg),b=luminance(palette[state].ink);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,state)}
 for(const [activity,extra,full,expected]of [['work',{},'자료 확인 중','work'],['rest',{},'커피 마시는 중','rest'],['play',{},'영상 보는 중','rest'],['meeting',{},'검토 중','meeting'],['work',{called:'true'},'안건 검토 중','meeting'],['rest',{walking:'true'},'커피 사러 가는 중','moving'],['work',{},'야근 중','night']]){
  const {actor,status}=actorStub(activity,extra);labels.label(actor,full);assert.equal(actor.dataset.status,expected);assert.equal(status.title,full);assert.equal(status['aria-label'],full);assert.ok(actor['aria-label'].includes(full));
 }
 assert.equal(palette.work.bg,'#fff');assert.equal(palette.rest.bg,'#fff8df');assert.equal(palette.meeting.bg,'#7354ca');
 assert.doesNotMatch(css,/\[data-(?:mood|called)="true"\] \.hani-office-status\{/);
 assert.match(css,/\.hani-office-status,\.hani-office-compact-line\{background:var\(--activity-bg/);
});

test('QA19: leisure at desks and rest seats is yellow; four overlapping work phrases stay white',()=>{
 const leisure=['저녁 뭐 먹지 투표 중','저녁 뭐 먹지 고민 중','소파에서 잠깐 눈 쉬는 중','옆자리랑 수다 중','간식 서랍 점검 중','커피 리필 고민 중','야식 고민 중','저녁 메뉴 검색 중','몰래 인스타 순찰 중','집중 음악 바꿔보는 중','집에 가서 볼 영화 고르는 중','복도 짧은 산책','졸음 참는 중','저녁 약속 시간 보는 중','휴대폰 알림 정리 중','고양이 영상 1분만…','기지개 켜는 중','스트레칭 중','플레이리스트 고르는 중'];
 for(const full of leisure){const {actor,status,icon}=actorStub('work',{zone:'desk'});labels.label(actor,full);assert.equal(actor.dataset.status,'rest',full);assert.equal(icon.textContent,'☕');assert.equal(status.title,full);for(const compact of [true,false])assert.doesNotMatch(phrase(full,actor.dataset.status,new Set(),compact),/근무\s*중/)}
 const work=['고객 표현 쉬운 말로 바꾸는 중','어려운 용어 쉬운 말 퀴즈 중','다음 약속 준비물 적는 중','졸린 눈으로 문장 줄이는 중','다음 기획 범위 정리 중','설계 영향 범위 짚어보는 중','재현한 버그 해결책 메모 중','보고서 다듬는 중','일정 조율 중','고객 후속 조치 확인 중'];
 for(const full of work){const {actor,icon}=actorStub('work',{zone:'desk'});labels.label(actor,full);assert.equal(actor.dataset.status,'work',full);assert.equal(icon.textContent,'💻')}
 for(const [activity,extra,full,state]of [['work',{zone:'lounge'},'내일 할 일 적는 중','rest'],['work',{zone:'server'},'서버 점검 중','work'],['work',{zone:'reception'},'접수 확인 중','work'],['work',{zone:'desk'},'야근 중','night'],['work',{zone:'lounge'},'야근 중','rest'],['rest',{walking:'true',called:'true'},'야근 중','moving'],['play',{called:'true',zone:'lounge'},'커피 한 모금','meeting'],['meeting',{zone:'lounge'},'휴식 중','meeting']])assert.equal(labels.activityStatus(actorStub(activity,extra).actor,full),state);
 const {actor}=actorStub('work',{zone:'lounge'});actor.officeTravel={};assert.equal(labels.activityStatus(actor,'커피 마시는 중'),'moving');
 assert.doesNotMatch(statusSource.slice(0,statusSource.indexOf('  const statusNames=')),/getBoundingClientRect|offsetWidth|scrollWidth|clientWidth|matchMedia/,'status classification never reads layout');
});

test('QA18: wide chooses spaced phrases, phones choose space-free phrases including food votes',()=>{
 for(const [full,state,phone,wide]of [['다음 기획 범위 정리 중','work','기획안정리','기획안 정리'],['저녁 뭐 먹지 투표 중','rest','메뉴고르기','메뉴 고르기'],['투표 중','rest','메뉴고르기','메뉴 고르기'],['저녁 뭐 먹지','rest','메뉴고르기','메뉴 고르기'],['새로운활동문장','rest','휴식중','휴식 중'],['회장님께 배포 일정 보고 중','work','배포보고','배포 보고']]){
  assert.equal(short(full,state),phone);assert.equal(short(full,state,new Set(),false),wide);
  for(const compact of [true,false]){
   const used=new Set();for(let i=0;i<8;i++)phrase(full,state,used,compact);
   const ui=vm.runInNewContext(statusSource+';({label})',{HaniBuildingScene:scene,matchMedia:()=>({matches:compact})}),{actor,status}=actorStub(state);
   ui.label(actor,full);assert.equal(status.textContent.slice(status.textContent.indexOf(' ')+1),compact?phone:wide,'label passes compact through');
  }
 }
});

function mounted(phone=false,scheduled=false){
 const f=fixture('09:00',false,()=>true,scheduled?JSON.parse(read('assets/data/office-actions-221.json')):null,{matchMedia:q=>({matches:phone&&q==='(max-width:600px)',addEventListener(){}}),setTimeout:()=>0});
 f.map.getBoundingClientRect=()=>rect(0,0,phone?390:1440,phone?220:810);
 for(const [i,a]of [...f.ids.get('haniOfficeActors').children].entries()){
  a.getBoundingClientRect=()=>rect(20+i*15,120,30,40);a.querySelector('.hani-office-sprite').getBoundingClientRect=()=>a.getBoundingClientRect();
  a.querySelector('.hani-office-name').getBoundingClientRect=()=>rect(0,0,a.dataset.labelMode==='dot'?5:a.dataset.labelMode==='name'?31:phone?85:120,10);
  a.querySelector('.hani-office-status').getBoundingClientRect=()=>rect(0,0,80,14);
 }
 f.click('4f');return f;
}

test('QA3: persistent names use canonical roster team/rank/colours; chairman has no nickname or duplicated rank',()=>{
 const f=mounted(false,true),roster=f.context.window.HaniOrganizationRoster,actors=f.ids.get('haniOfficeActors').children;
 for(const a of actors){const p=roster.people.find(p=>p.id===a.dataset.person);if(!p)continue;const team=roster.teams.find(t=>t.id===p.team),name=a.querySelector('.hani-office-name');assert.equal(a.dataset.team,p.team);assert.equal(name.style['--office-team'],team.color);assert.equal(name.style['--office-team-tint'],team.tint);assert.equal(name.querySelector('.hani-office-rank').textContent,' '+p.rank);const l=luminance('#493752'),b=luminance(team.tint);assert.ok((b+.05)/(l+.05)>=4.5)}
 const chair=actors.find(a=>a.dataset.person==='seongmin');assert.equal(chair.officeName.textContent,'회장님');assert.equal(chair.querySelector('.hani-office-rank').textContent,'');
 assert.match(css,/@media\(max-width:600px\)\{\s*\.hani-office-prop,\.hani-office-rank,\.hani-office-activity-icon\{display:none\}/);
 assert.match(css,/\[data-label-mode="name"\] \.hani-office-compact-line\{display:none\}/);assert.match(css,/\[data-label-mode="dot"\] \.hani-office-name>span:not\(\.hani-office-status-dot\)\{display:none\}/);
});

test('QA18: real desktop/phone label keeps full title/aria/roster and delegated tap/keyboard bubble without writes',async()=>{
 for(const phone of [false,true]){
  const f=mounted(phone),a=f.visible()[0],layer=f.ids.get('haniOfficeActors'),slots=[...layer.children],name=a.querySelector('.hani-office-name'),status=a.querySelector('.hani-office-status'),full=status.dataset.full;
  let writes=0;const deny=()=>{writes++;throw Error('forbidden write')};f.context.localStorage=f.context.sessionStorage={setItem:deny,removeItem:deny,clear:deny};f.context.save=deny;f.context.fetch=async(url,options)=>{assert.ok(!options?.method||options.method==='GET');assert.match(String(url),/assets\/data\//);return {ok:false}};f.context.supabase={from:deny};
  assert.equal(status.title,full);assert.equal(status.getAttribute('aria-label'),full);assert.ok(name.title.includes(full));assert.ok(name.getAttribute('aria-label').includes(full));assert.ok(a.getAttribute('aria-label').includes(full));assert.equal(a.officeText.textContent,full);
  const displayed=status.textContent,parts=displayed.split(' ');assert.equal([...new Intl.Segmenter('ko',{granularity:'grapheme'}).segment(parts[0])].length,1);assert.match(parts[0],/\p{Extended_Pictographic}/u);assert.ok([...parts.slice(1).join(' ')].length<=(phone?6:8));assert.doesNotMatch(displayed,/…|\.\.\./);
  const used=new Set();for(const actor of f.visible()){const slot=actor.querySelector('.hani-office-status'),expected=scene.labels.short(slot.dataset.full,used,actor.dataset.status,phone);assert.equal(slot.textContent,actor.querySelector('.hani-office-activity-icon').textContent+' '+expected,'fit passes compact through');if(phone)assert.equal(actor.officeCompact.textContent,' · '+slot.textContent)}
  const feet=[a.style.left,a.style.top];layer.events.click({target:name});const bubble=f.root.querySelector('.hani-office-character-bubble');assert.equal(bubble.hidden,false);assert.ok(bubble.querySelector('p').textContent.includes(full));
  layer.events.keydown({key:'Escape'});assert.equal(bubble.hidden,true);layer.events.keydown({key:'Enter',target:name,preventDefault(){}});assert.equal(bubble.hidden,false);assert.ok(bubble.querySelector('p').textContent.includes(full));
  assert.deepEqual([a.style.left,a.style.top],feet);assert.deepEqual(layer.children,slots);await Promise.resolve();assert.equal(writes,0);
 }
 const f=mounted();await new Promise(r=>setTimeout(r,0));assert.match(f.map.querySelector('.hani-office-background').alt,/ · HANI GROUP$/);
});

test('QA18: label fitting keeps batched reads; existing steady frames do not add layout measurements',()=>{
 const f=mounted(),fit=source.slice(source.indexOf('  function fitStatusLabels('),source.indexOf('  if(buildingChairmanSlot())people.push'));
 assert.equal((fit.match(/getBoundingClientRect/g)||[]).length,5,'existing floor/name/status/name-only/dot read sites');
 let reads=0;for(const node of [f.map,...f.root.querySelectorAll('*')])if(node.getBoundingClientRect){const measure=node.getBoundingClientRect;node.getBoundingClientRect=()=>{reads++;return measure()}}
 for(let i=0;i<30;i++)f.timers.find(t=>t.ms===100).fn();assert.equal(reads,0,'no layout reads on unchanged frame');
 const frame=source.slice(source.indexOf('  setInterval(()=>{const now=Date.now()'),source.indexOf('  setInterval(changeOne'));
 assert.doesNotMatch(frame,/getBoundingClientRect|offsetWidth|scrollWidth|clientWidth/);
});
