// 독립 설계 도구. 운영 앱을 import하거나 실행하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const contractFile=path.join(root,'data/hani-building/spatial-contract.json');
const C=JSON.parse(fs.readFileSync(contractFile,'utf8'));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function hash(value){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function kst(instant){const d=new Date(new Date(instant).getTime()+32400000);return{day:d.toISOString().slice(0,10),weekday:d.getUTCDay(),minutes:d.getUTCHours()*60+d.getUTCMinutes()}}
export function minute(s){const [h,m]=s.split(':').map(Number);return h*60+m}
export function route(c,from,to,mode='elevator'){
  const nodes=new Map(c.anchors.map(a=>[a.id,a]));
  if(!nodes.has(from)||!nodes.has(to)||nodes.get(to).walkTarget===false)return null;
  const q=[[from]],seen=new Set([from]);
  while(q.length){const p=q.shift(),last=p.at(-1);if(last===to)return p;
    for(const edge of c.edges){if((mode==='elevator'&&edge.kind==='stairs')||(mode==='stairs'&&edge.kind==='elevator'))continue;
      const next=edge.from===last?edge.to:edge.bidirectional&&edge.to===last?edge.from:null;
      if(!next||seen.has(next)||(['desk','seat'].includes(nodes.get(next).type)&&next!==to))continue;
      seen.add(next);q.push([...p,next]);
    }
  }return null;
}
export function transition(c,from,to){return from===to||!!c.states[from]?.next.includes(to)}
export function schedule(c,person,instant,inputs={}){
  const t=kst(instant);if(person.entity==='ai_entity')return{state:'Away',target:person.homeAnchor,day:t.day};
  if(person.id==='seongmin')return{state:inputs.chairmanActive?'Work':'Away',target:inputs.chairmanActive?person.homeAnchor:'offsite',day:t.day};
  const rows=t.weekday===0||t.weekday===6?c.schedules.weekend:c.schedules.weekday;
  let chosen=rows[0];
  for(const row of rows){const purpose=row.state==='Arrive'?'arrival':row.state==='Lunch'?'lunch':row.state==='Coffee'?'coffee':row.state==='Leave'?'leave':null;
    const spread=purpose?c.schedules.variation[purpose+'JitterMinutes']:0;
    const offset=spread?hash(t.day+'|'+person.id+'|'+purpose)%(spread*2+1)-spread:0;
    if(t.minutes>=minute(row.from)+offset)chosen=row;
  }
  if(chosen.teams&&!chosen.teams.includes(person.team)||chosen.requires&&!inputs[chosen.requires])chosen={state:'Work',target:'home'};
  let target=chosen.target;
  if(target==='home')target=person.homeAnchor;
  if(target==='team_meeting')target=person.team==='platform'?'standup_room':'meeting_2f';
  if(target==='lunch_choice')target=c.schedules.choices.lunch[hash(t.day+'|'+person.id+'|lunch-choice')%2];
  if(target==='coffee_choice')target=c.schedules.choices.coffee[hash(t.day+'|'+person.id+'|coffee-choice')%2];
  return{state:chosen.state,target,day:t.day};
}
export function evaluateEvents(c,instant,input={},memory={}){
  const t=kst(instant),result=[];
  for(const ev of c.events){let reason='선택 가능';
    if(!ev.enabled)reason='비활성';
    else if(t.minutes<minute(ev.window[0])||t.minutes>=minute(ev.window[1]))reason='시간창 밖';
    else if((t.weekday===0||t.weekday===6)&&!input.weekendApproved)reason='주말 기본 부재';
    else if(!ev.conditions.every(cond=>{const v=cond.field==='weekday'?t.weekday:input[cond.field];if(v===undefined||v===null)return false;return cond.op==='isTrue'?v===true:cond.op==='eq'?v===cond.value:cond.op==='gte'?Number.isFinite(v)&&v>=cond.value:cond.op==='lte'?Number.isFinite(v)&&v<=cond.value:false}))reason='확정 입력 없음/조건 불충족';
    else if(memory.lastDay?.[ev.id]&&(Date.parse(t.day)-Date.parse(memory.lastDay[ev.id]))/86400000<ev.cooldownDays)reason='cooldown';
    else if((memory.counts?.[t.day]?.[ev.id]||0)>=ev.dailyMax)reason='이벤트 일일 한도';
    else if((memory.total?.[t.day]||0)>=c.eventPolicy.globalDailyMax)reason='전체 일일 한도';
    else if(memory.running)reason='다른 이벤트 진행 중';
    else if(hash(t.day+'|'+ev.id+'|variation')%10000/10000>=ev.probability)reason='오늘 확률 미선택';
    result.push({id:ev.id,reason,eligible:reason==='선택 가능',priority:ev.priority});
  }
  const selected=result.filter(r=>r.eligible).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))[0];
  return{day:t.day,selected:selected?.id??null,result};
}
export function markEvent(memory,day,id){memory.lastDay??={};memory.counts??={};memory.total??={};memory.lastDay[id]=day;memory.counts[day]??={};memory.counts[day][id]=(memory.counts[day][id]||0)+1;memory.total[day]=(memory.total[day]||0)+1;memory.running=id}
export function presence(c,instant,active){const t=kst(instant);return{state:active?'Work':'Away',target:active?c.chairman.homeAnchor:'offsite',label:active?'회장실 재실':t.minutes>=480&&t.minutes<1080?'외근 중':'퇴근',light:!!active}}
export function reaction(c,instant){const t=kst(instant),slot=hash(t.day+'|chairman-reaction')%3,bucket=t.minutes>=300&&t.minutes<720?'morning':t.minutes>=720&&t.minutes<1080?'afternoon':'evening';return{staff:c.chairman.reactions.staff[slot],text:c.chairman.reactions[bucket][slot]}}

function floorSVG(c,f,graph=false){
  const anchors=c.anchors.filter(a=>a.floor===f.id),byId=new Map(c.anchors.map(a=>[a.id,a]));
  const rect=(r,fill,stroke='#536878')=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="5" fill="${fill}" stroke="${stroke}"/>`;
  return `<svg viewBox="0 0 1000 640" role="img" aria-label="${esc(f.label)} 공간도"><title>${esc(f.label)} · 문·복도·엘리베이터·계단</title>${rect({x:15,y:15,w:970,h:610},'#eff3f6')}${f.walkable.slice(0,2).map(z=>rect(z,'#d9e6eb')).join('')}${f.rooms.map(r=>rect(r,'#fffdf5')).join('')}${f.walkable.slice(2).map(z=>rect(z,'#e5eee7','#bbcfc0')).join('')}${rect({x:880,y:190,w:90,h:100},'#cad9f1')}${rect({x:880,y:370,w:90,h:100},'#e2d7ca')}<text x="925" y="217" text-anchor="middle">승강기</text><text x="925" y="447" text-anchor="middle">계단</text>${graph?c.edges.filter(e=>byId.get(e.from)?.floor===f.id&&byId.get(e.to)?.floor===f.id).map(e=>{const a=byId.get(e.from),b=byId.get(e.to);return`<path d="M${a.x},${a.y} L${b.x},${b.y}" fill="none" stroke="#448b9a" stroke-width="2" stroke-dasharray="4 4"/>`}).join(''):''}${anchors.filter(a=>a.type==='door').map(a=>`<path d="M${a.x-22} ${a.y}h44" stroke="#fffdf5" stroke-width="10"/><path d="M${a.x-22} ${a.y}h44" stroke="#177863" stroke-width="4"/>`).join('')}${anchors.filter(a=>!['junction','door','elevator','stairs'].includes(a.type)).map(a=>`<g><title>${esc(a.id)} · ${esc(a.label)}</title><rect x="${a.x-26}" y="${a.y-15}" width="52" height="30" rx="4" fill="${a.type==='display'?'#b5e3ef':a.type==='desk'?'#d1c4ab':a.type==='seat'?'#dbcedf':'#f3d99d'}" stroke="#52606b"/><text x="${a.x}" y="${a.y+35}" text-anchor="middle" font-size="12">${esc(a.occupant?c.people.find(p=>p.id===a.occupant).name:a.label.split(' · ')[0])}</text></g>`).join('')}</svg>`;
}
function plates(f){return f.rooms.map(r=>`<span class="plate" style="left:${r.plate.x/10}%;top:${r.plate.y/6.4}%">${esc(r.label)}</span>`).join('')}
const css=`:root{font:16px/1.65 system-ui,'Malgun Gothic',sans-serif;color:#24323e;background:#eef2f4}*{box-sizing:border-box}body{margin:0}main{max-width:1260px;margin:auto;padding:28px 24px}h1{font-size:clamp(25px,4vw,40px);line-height:1.22}h2{font-size:23px}h3{font-size:18px}p{max-width:85ch}a{color:#14557c}small,.muted{color:#536470}code{overflow-wrap:anywhere}header{border-bottom:2px solid #adc1ca;margin-bottom:24px;padding-bottom:14px}.kicker{letter-spacing:.16em;color:#30636c;font-weight:700}.notice{padding:12px 16px;border-left:4px solid #587f8e;background:#e1eced}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,450px),1fr));gap:22px}.card,section.panel{background:#fff;border:1px solid #c7d3d9;border-radius:12px;padding:18px;margin-bottom:20px;min-width:0}.scene{position:relative;width:100%;aspect-ratio:1000/640;isolation:isolate}.scene svg{position:absolute;inset:0;width:100%;height:100%;font-family:inherit;font-size:14px}.plate{position:absolute;transform:translate(-50%,-50%);background:#223c4be8;color:white;font-size:clamp(7px,1.25vw,12px);padding:1px 5px;border-radius:3px;white-space:nowrap;pointer-events:none;z-index:10000}.legend{display:flex;flex-wrap:wrap;gap:14px;font-size:13px}.legend span:before{content:'';display:inline-block;width:12px;height:12px;margin-right:5px;background:var(--color);border:1px solid #71828b}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;border-bottom:1px solid #d9e2e7;padding:9px;vertical-align:top}td code{font-size:12px}.table-wrap{overflow:auto}button,select,input{font:inherit;min-height:44px;max-width:100%;border:1px solid #8ca5b2;border-radius:6px;padding:6px 10px;background:white;color:#223c4b}button{cursor:pointer}button[aria-pressed=true],button.primary{background:#255b70;color:white}button:disabled{opacity:.5;cursor:wait}.controls{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:14px}label{display:flex;gap:6px;align-items:center;flex-wrap:wrap}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f0f4f6;padding:12px;font-size:13px}.actor{position:absolute;width:4.8%;height:10%;transform:translate(-50%,-100%);pointer-events:none}.actor .body{position:absolute;inset:8% 12% 0;background:var(--actor-color,#7ba5bd);border:2px solid #233d4d;border-radius:35% 35% 12% 12%}.actor .head{position:absolute;left:22%;top:2%;width:56%;height:40%;background:#f1d6ab;border:1px solid #53616c;border-radius:25%}.actor .shadow{position:absolute;width:65%;height:12%;bottom:-4%;left:18%;background:#20374633;border-radius:50%}.actor.sitting .body{top:20%;height:66%}.actor.walking .body{border-style:dashed}.actor.back .head{background:#a2abb3}.furniture{position:absolute;transform:translate(-50%,-50%);pointer-events:none}.desk-mask{width:6%;height:4.7%;background:#b99f76;border:1px solid #6e634e;border-radius:4px}.chair{width:3.2%;height:5%;background:#9aabbc;border:1px solid #536577;border-radius:5px}.seat-mask{width:8%;height:3%;background:#aa98b5;border:1px solid #6d5d78}.actor-name{position:absolute;transform:translate(-50%,5px);font-size:clamp(7px,1.2vw,12px);white-space:nowrap;background:#ffffffe6;z-index:11000;pointer-events:none}.stage-scroll{overflow:auto;max-width:100%}.zoom .scene{min-width:900px}#log{min-height:110px;max-height:220px;overflow:auto}#status{padding:8px 12px;background:#dcebed;border-radius:6px}details{margin:14px 0}summary{cursor:pointer;font-weight:700}@media(max-width:600px){main{padding:18px 12px}.card,section.panel{padding:12px}td,th{padding:6px}button,select{font-size:14px}.controls>*{flex-shrink:1}.plate{font-size:7px}.grid{gap:10px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;

// 아래 함수는 생성 HTML에 자체 포함한다. Node와 브라우저가 같은 순수 함수를 사용한다.
function boot(c){
  const $=id=>document.getElementById(id),nodes=new Map(c.anchors.map(a=>[a.id,a])),people=new Map(c.people.map(p=>[p.id,p]));
  let activeFloor='4f',token=0,busy=false,mode='elevator';const actors=new Map(),seenDays=new Set(),eventMemory={},reservations=new Map();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let manualIdle=false,lastInput=Date.now(),light=false;
  const log=message=>{$('log').textContent=(message+'\n'+$('log').textContent).slice(0,7000)};
  const currentInstant=()=>new Date($('date').value+'T'+$('time').value+':00+09:00');
  const stateLabel=s=>c.states[s]?.label||s;
  function renderFloor(id){activeFloor=id;const f=c.floors.find(f=>f.id===id);$('stage').innerHTML=floorSVG(c,f,true)+plates(f);$('floor-title').textContent=f.label;document.querySelectorAll('[data-floor]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.floor===id)));$('dest').replaceChildren(...c.anchors.filter(a=>a.floor===id&&!['junction','door','stairs','elevator','display'].includes(a.type)).map(a=>new Option(a.label,a.id)));for(const [aid,actor] of actors){$('stage').append(actor.el,actor.nameEl);paint(aid)}drawFurniture();$('stage').dataset.light=String(light);$('stage').style.background=light&&id==='4f'?'#fff8dc':''}
  function drawFurniture(){for(const a of c.anchors.filter(a=>a.floor===activeFloor&&['desk','seat'].includes(a.type))){for(const [cls,dy,z] of [['chair',0,-10],[a.type==='desk'?'desk-mask':'seat-mask',-3,6]]){const el=document.createElement('div');el.className='furniture '+cls;el.style.cssText=`left:${a.x/10}%;top:${(a.y+dy)/6.4}%;z-index:${1000+(a.y+z)*10}`;el.dataset.anchor=a.id;$('stage').append(el)}}}
  function paint(id){const a=actors.get(id);const hidden=a.floor!==activeFloor||a.state==='Away'||a.hidden;a.el.hidden=hidden;a.nameEl.hidden=hidden;if(hidden)return;a.el.style.left=a.x/10+'%';a.el.style.top=a.y/6.4+'%';a.el.style.zIndex=1000+Math.round(a.y*10);a.el.className='actor'+(['Work','Meeting','Client','Lunch','Rest','Overtime'].includes(a.state)&&['desk','seat'].includes(nodes.get(a.anchor)?.type)?' sitting':'')+(a.state==='Walk'?' walking':'')+(a.back?' back':'');a.nameEl.style.left=a.x/10+'%';a.nameEl.style.top=a.y/6.4+'%';a.nameEl.textContent=people.get(id).name+' · '+stateLabel(a.state);a.el.dataset.state=a.state}
  function setState(id,state){const a=actors.get(id);if(!transition(c,a.state,state))throw Error('허용되지 않은 상태 전이: '+a.state+'→'+state);a.state=state;paint(id)}
  function releaseSeat(id){for(const [key,value] of reservations){if(value===id)reservations.delete(key)}}
  function reserve(id,target){const anchor=nodes.get(target);releaseSeat(id);if(!['desk','seat'].includes(anchor.type))return 0;for(let slot=0;slot<anchor.capacity;slot++){const key=target+':'+slot;if(!reservations.has(key)){reservations.set(key,id);return slot}}return -1}
  async function animate(id,target,finalState,travelToken,totalMs=null){
    const actor=actors.get(id),p=route(c,actor.anchor,target,mode);if(!p){log('경로 없음 · 출발 위치 유지');return false}
    const slot=reserve(id,target);if(slot<0){log('자리 가득 참 · 문 앞 예약 대기 필요 (이 데모는 이동하지 않음)');return false}
    if(actor.state==='Away'||actor.state==='Leave')setState(id,'Arrive');if(actor.state!=='Walk')setState(id,'Walk');actor.hidden=false;
    const segments=p.slice(1).map((next,i)=>{const a=nodes.get(p[i]),b=nodes.get(next),edge=c.edges.find(e=>e.from===a.id&&e.to===b.id||e.bidirectional&&e.to===a.id&&e.from===b.id);return{a,b,edge,duration:edge.kind==='elevator'?700:edge.kind==='stairs'?1600:Math.max(45,Math.hypot(a.x-b.x,a.y-b.y)/c.movement.speedPxPerSecond*1000)}});
    const sum=segments.reduce((s,e)=>s+e.duration,0)||1;
    for(const seg of segments){if(travelToken!==token){releaseSeat(id);return false}const {a,b,edge}=seg;if(a.floor!==activeFloor)renderFloor(a.floor);if(edge.kind==='elevator')log(a.floor+'→'+b.floor+' · 승강기 문 닫힘/탑승');
      const duration=reduced?0:totalMs?totalMs*seg.duration/sum:seg.duration;
      await new Promise(resolve=>{const started=performance.now();function frame(now){if(travelToken!==token){resolve();return}const u=duration?Math.min(1,(now-started)/duration):1;actor.back=b.y<a.y;actor.hidden=a.floor!==b.floor&&u<1;actor.x=a.x+(b.x-a.x)*u;actor.y=a.y+(b.y-a.y)*u;paint(id);if(u<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});
      if(travelToken!==token){releaseSeat(id);return false}Object.assign(actor,{anchor:b.id,x:b.x,y:b.y,floor:b.floor,hidden:false});if(b.floor!==activeFloor)renderFloor(b.floor);paint(id);
    }
    const dest=nodes.get(target);actor.anchor=target;actor.floor=dest.floor;actor.x=dest.x;actor.y=dest.y;
    if(dest.capacity>1&&['desk','seat'].includes(dest.type)){const off=c.movement.meetingOffsets[slot]||[0,0];actor.x+=off[0];actor.y+=off[1]}
    if(finalState==='Leave'){setState(id,'Leave');setState(id,'Away');releaseSeat(id)}else setState(id,finalState);paint(id);return true;
  }
  async function run(action){if(busy)return;busy=true;document.querySelectorAll('[data-action]').forEach(b=>b.disabled=true);try{await action()}catch(error){log('오류: '+error.message)}finally{busy=false;document.querySelectorAll('[data-action]').forEach(b=>b.disabled=false)}}
  function chairStatus(){const model=presence(c,currentInstant(),!manualIdle&&!document.hidden&&Date.now()-lastInput<300000);$('presence').textContent=model.label;light=model.light;const actor=actors.get('seongmin');if(!model.light){if(actor.state!=='Away')setState('seongmin','Away');actor.hidden=true;releaseSeat('seongmin');paint('seongmin')}if(activeFloor==='4f')$('stage').style.background=light?'#fff8dc':'';return model}
  async function arrival(){manualIdle=false;lastInput=Date.now();chairStatus();const t=kst(currentInstant());if(seenDays.has(t.day)){await animate('seongmin','ceo_desk','Work',token,reduced?0:300);log('오늘 입장 연출 완료됨 · 재실 복귀');return}seenDays.add(t.day);const actor=actors.get('seongmin'),gate=nodes.get('arrival_gate');Object.assign(actor,{anchor:gate.id,floor:gate.floor,x:gate.x,y:gate.y,state:'Arrive',hidden:false});renderFloor('1f');light=false;log('회장님 첫 방문 · 게이트 출입');const steps=c.chairman.arrival.steps;let previous=0;for(const step of steps.slice(1)){if(!await animate('seongmin',step.anchor,step.anchor==='ceo_desk'?'Work':'Walk',token,step.atMs-previous))return;previous=step.atMs;if(manualIdle||document.hidden)return;if(step.anchor==='door_ceo'){light=true;if(activeFloor==='4f')$('stage').style.background='#fff8dc';log('회장실 불 켜짐')}}const line=reaction(c,currentInstant());log(people.get(line.staff).name+': '+line.text);chairStatus()}
  for(const p of c.people.filter(p=>p.entity==='human_chibi')){const a=nodes.get(p.homeAnchor),el=document.createElement('div'),nameEl=document.createElement('span');el.className='actor';el.setAttribute('aria-label',p.name);el.innerHTML='<span class="shadow"></span><span class="body"></span><span class="head"></span>';el.style.setProperty('--actor-color',`hsl(${hash(p.id)%360} 30% 66%)`);nameEl.className='actor-name';actors.set(p.id,{el,nameEl,anchor:a.id,x:a.x,y:a.y,floor:a.floor,state:p.id==='seongmin'?'Away':'Work',hidden:p.id==='seongmin'});if(p.id!=='seongmin')reserve(p.id,p.homeAnchor)}
  const today=kst(new Date());$('date').value=today.day;$('time').value='09:30';$('person').replaceChildren(...c.people.filter(p=>p.entity==='human_chibi'&&p.id!=='seongmin').map(p=>new Option(p.name+' · '+p.rank,p.id)));$('person').value='dohyun';
  $('event').replaceChildren(...c.events.map(e=>new Option(e.label,e.id)));
  document.querySelectorAll('[data-floor]').forEach(b=>b.onclick=()=>renderFloor(b.dataset.floor));
  $('stairs').onchange=()=>{mode=$('stairs').checked?'stairs':'elevator'};
  $('zoom').onchange=()=>$('stage-scroll').classList.toggle('zoom',$('zoom').checked);
  $('home').onclick=()=>run(()=>animate($('person').value,people.get($('person').value).homeAnchor,'Work',token));
  $('walk').onclick=()=>run(()=>animate($('person').value,$('dest').value,nodes.get($('dest').value).type==='seat'?'Rest':'Work',token));
  $('meeting').onclick=()=>run(async()=>{for(const id of ['hani','dohyun','yuri'])await animate(id,'meeting_exec','Meeting',token);log('임원회의 3명 착석 · MIR은 화면 점등만');$('mir').textContent='MIR · AI 코어 연결'});
  $('coffee').onclick=()=>run(()=>animate($('person').value,'coffee_counter','Coffee',token));
  $('elevator').onclick=()=>run(()=>animate($('person').value,'rooftop_table','Rest',token));
  $('arrival').onclick=()=>run(arrival);
  $('idle').onclick=()=>{manualIdle=true;++token;chairStatus();log('회장님 '+presence(c,currentInstant(),false).label)};
  $('schedule').onclick=()=>run(async()=>{const id=$('person').value,p=people.get(id),s=schedule(c,p,currentInstant());log(p.name+' '+s.day+' · '+stateLabel(s.state)+' · '+s.target);if(s.target==='offsite'){const actor=actors.get(id);setState(id,'Away');actor.hidden=true;releaseSeat(id);paint(id)}else await animate(id,s.target,s.state==='Arrive'?'Work':s.state,token)});
  $('evaluate').onclick=()=>{const input={chairmanActive:!manualIdle,releaseEveConfirmed:$('fixture').checked,monthEnd:$('fixture').checked,studyWeek:$('fixture').checked,marketFresh:$('fixture').checked,marketAbsMovePct:$('fixture').checked?4:null,travelTomorrow:$('fixture').checked,rooftopApproved:$('fixture').checked};const out=evaluateEvents(c,currentInstant(),input,eventMemory);$('event-result').textContent=out.result.map(r=>(r.id===out.selected?'▶ ':'')+c.events.find(e=>e.id===r.id).label+': '+r.reason).join('\n');if(out.selected){markEvent(eventMemory,out.day,out.selected);eventMemory.running=null;log('일일 이벤트 선택·메모리 한도 반영: '+out.selected)}else log('이 시각 선택 이벤트 없음')};
  $('rehearse').onclick=()=>run(async()=>{const ev=c.events.find(e=>e.id===$('event').value);log('동선 리허설 · 확률/조건 외 별도 수동 미리보기: '+ev.label);for(const id of ev.participants){if(id==='seongmin'&&actors.get(id).state==='Away')continue;await animate(id,ev.target,'Meeting',token)}log('리허설 완료 · 복귀 버튼으로 홈 복귀. 실제 이벤트 타이머·선점·FIFO 큐는 후속 구현')});
  $('return-all').onclick=()=>run(async()=>{++token;for(const [id,a] of actors){if(a.state==='Away')continue;await animate(id,people.get(id).homeAnchor,'Work',token)}$('mir').textContent='MIR · AI 코어 대기'});
  for(const event of ['pointerdown','keydown','touchstart'])document.addEventListener(event,()=>{lastInput=Date.now()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){++token;chairStatus()}else chairStatus()});
  setInterval(chairStatus,10000);
  renderFloor(activeFloor);chairStatus();log('공간 계약 로드 · 운영 데이터와 분리된 메모리 실험');
  window.HaniSpatial216={contract:c,actors,route:(a,b)=>route(c,a,b),schedule,evaluateEvents,reservations,renderFloor};
}

function table(headers,rows){return`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function documentBody(c){return`<header><div class="kicker">HANI BUILDING V2 · 공간 검토 216</div><h1>층마다 역할이 보이는<br>하니 빌딩 공간계획</h1><p>성민 대표님 검토용 · 도연(Codex) · 2026-10-16 KST</p><p class="notice">방·동선·자리부터 확정합니다. 색상 도형은 공간 확인용이며 미술 시안이 아닙니다. 운영 앱·직원 등록·저장·버전 변경 없음.</p><p><a href="../../scripts/hani-office-lowfi-216.html">동작 프로토타입 열기</a> · <a href="../../data/hani-building/spatial-contract.json">공간 계약 JSON</a> · <a href="../development-history/handoffs/2026-10-16-spatial-plan-216.md">설계·검증 인수인계</a></p></header><div class="legend"><span style="--color:#e5eee7">실내 보행 가능</span><span style="--color:#d9e6eb">공용 복도</span><span style="--color:#177863">문 개구부</span><span style="--color:#d1c4ab">고정석</span><span style="--color:#cad9f1">승강기</span></div><div class="grid">${c.floors.map(f=>`<article class="card"><h2>${esc(f.label)}</h2><div class="scene">${floorSVG(c,f,true)}${plates(f)}</div><p>${esc(f.rooms.map(r=>r.label).join(' / '))}</p><details><summary>이 층 상호작용 앵커</summary>${table(['안정 ID','용도','정원'],c.anchors.filter(a=>a.floor===f.id&&!['junction','door'].includes(a.type)).map(a=>[a.id,a.label,a.capacity]))}</details></article>`).join('')}</div>
<section class="panel"><h2>직원 홈 · 고정석</h2><p>윤슬은 히나 바로 오른쪽. 유나는 4F 운영 안내, 가은/MUSE는 회장 개인 비서입니다. 1F reception은 무인 안내 단말이며 유나에게 접수만 연결합니다.</p>${table(['이름 / 직급','등록 상태','홈 앵커','구분'],c.people.map(p=>[p.name+' · '+p.rank,p.registration==='planned'?'예정 · 명부 미등록':p.registration==='chairman'?'인간 회장 · 재실 기반':'명부 등록',p.homeAnchor,p.entity==='ai_entity'?'AI ENTITY · 책상/인간 초상 없음':'치비 인물']))}</section>

<section class="panel"><h2>이동·상태</h2><p>방 밖→공용 복도→해당 문→실내 통로→측면 접근→착석. 층간 연결은 승강기 또는 계단 간선만 허용합니다. 모든 상태 변경은 ${esc(c.movement.routing)}.</p>${table(['상태','허용 전이'],Object.entries(c.states).map(([id,s])=>[id+' · '+s.label,s.next.join(' → ')]))}<p>${esc(c.movement.reservation)} ${esc(c.movement.access)}</p></section>

<section class="panel"><h2>하루 일정 · KST</h2><p>${esc(c.schedules.seed)} 출근 ±12분 · 점심 ±8분 · 커피 ±10분 · 퇴근 ±15분. 같은 날짜와 직원은 새로 계산해도 같은 일정입니다. 주말은 기본 부재.</p>${table(['시작','상태','목적지 / 조건'],c.schedules.weekday.map(r=>[r.from,r.state,r.target+(r.teams?' · '+r.teams.join(', '):'')+(r.requires?' · 확정 예약 필요':'')]))}</section>

<section class="panel"><h2>특별 이벤트 · 낮은 확률·cooldown</h2><p>조건과 확정된 읽기 전용 입력이 있는 날만 결정적 추첨. 세션 일일 최대2건·동시1건. 새로고침 간 cooldown 영속성은 미구현입니다. 프로토타입은 합성 입력만 사용합니다.</p>${table(['이벤트 / 참여','앵커 / 시각','확률 / 간격'],c.events.map(e=>[e.label+' · '+e.participants.map(id=>c.people.find(p=>p.id===id)?.name).join('/'),e.target+' · '+e.window.join('~'),e.probability*100+'% / '+e.cooldownDays+'일']))}<details><summary>기존 앱에서 확인한 근거와 연결 전제</summary>${table(['입력','기존 근거','연결 상태'],c.inputAdapters.map(a=>[a.id,a.source+' · '+a.verified,a.status]))}</details></section>

<section class="panel"><h2>성민 회장님 재실</h2><p>${esc(c.chairman.active)}. ${esc(c.chairman.idle)}. 첫 active 방문은 2.6초 동안 게이트→1F 승강기→4F 승강기→불 켜짐→착석. ${esc(c.chairman.firstVisit)}</p>${table(['반응 직원','아침 / 오후 / 저녁'],c.chairman.reactions.staff.map((id,i)=>[c.people.find(p=>p.id===id).name,[c.chairman.reactions.morning[i],c.chairman.reactions.afternoon[i],c.chairman.reactions.evening[i]].join(' / ')]))}</section>

<section class="panel"><h2>렌더링·가림·모바일</h2>${table(['항목','규격'],[['기본 인물','48×64, 발 중앙(24,60), 서기2·앉기2·걷기4프레임 × 전후좌우'],['레이어',c.rendering.layers.join(' → ')],['책상 가림',c.rendering.occlusion],['의자·소파',c.rendering.furniture],['문·승강기',c.rendering.doors+' '+c.rendering.elevator],['그림자',c.rendering.shadows],['방·팀 이름',c.rendering.nameplates],['모바일',c.rendering.mobile],['이번 데모 한계',c.rendering.prototypeLimit]])}</section>

<section class="panel"><h2>미술은 다음 단계 · 전체 4MB 이내</h2><p>19명(성민·다온·윤슬 포함) + 방문 NPC 5명. 미르는 별도 AI 코어이며 인간 초상화를 만들지 않습니다. 이번에는 이미지 자산을 제작하지 않습니다.</p>${table(['자산','개수 / 규격','최대 합계'],c.assets.items.map(a=>[a.id,a.count+'개 · '+a.size,(a.totalBytes/1000)+' KB']))}<p>합계 3,380,000 bytes · 여유 620,000 bytes · 최대 4,000,000 bytes. ${esc(c.assets.loading)}</p></section>

<section class="panel"><h2>Canon 충돌 해결·후속 범위</h2><p>taeo는 채원으로 고정하며 chaewon ID를 새로 만들지 않습니다. 도연은 dohyun, 수연은 sooyeon을 사용합니다. MIR · 미르 / 뮤즈 · 가은 표기는 같은 mir / gaeun의 기존 별칭입니다. 하루는 소비·구매 검토를 맡는 재무팀, 유나는 4F 운영 안내로 배치합니다. 기존 4층 장면의 유나 1F·MIR 좌석·2F 소집 회의는 이 계획에서 재설계하되 운영 코드는 그대로 유지합니다.</p><p>다온·윤슬의 등록과 상용 어댑터·이벤트 자동 실행·재실의 탭 간 영속성·실제 미술/최종 모바일 QA는 다음 작업입니다. 독립 프로토타입은 운영 Candidate나 배포 Preview가 아닙니다.</p></section>
`}
function prototypeBody(c){return`<header><div class="kicker">공간 동작 실험 · 운영 미연결</div><h1>하니 빌딩 V2 · 저충실도 프로토타입</h1><p>성민 대표님, 아래 버튼으로 자리·문·층간 이동·가림 순서를 확인할 수 있습니다. 미술 없이 색상 도형만 사용합니다.</p><p><a href="../docs/design/hani-building-v2-spatial.html">전체 공간계획</a> · <a href="../data/hani-building/spatial-contract.json">원본 계약</a></p><p id="status" role="status">JSON 계약 로딩 중…</p></header>
<section class="panel"><div class="controls">${c.floors.map(f=>`<button data-floor="${f.id}" aria-pressed="false">${f.id.toUpperCase()}</button>`).join('')}<label><input type="checkbox" id="zoom">2배 자세히</label></div><h2 id="floor-title">공간도</h2><div id="stage-scroll" class="stage-scroll"><div id="stage" class="scene"></div></div><p class="muted">청록 점선=보행 그래프 · 초록 선=문 · 몸통 하단=책상 전경 가림 · 이름=HTML overlay · <span id="mir">MIR · AI 코어 대기</span></p></section>

<section class="panel"><h2>이동 시험</h2><div class="controls"><label>직원 <select id="person"></select></label><label><input id="stairs" type="checkbox">계단 이용</label><button data-action id="home">홈 착석</button><button data-action id="meeting">3명 임원회의</button><button data-action id="coffee">커피</button><button data-action id="elevator">5F 휴식 이동</button><button data-action id="return-all">전원 복귀</button></div><div class="controls"><label>현재 층 목적지 <select id="dest"></select></label><button data-action id="walk">선택 앵커로 이동</button></div><p>좌석 가득 참 시 이동을 멈춥니다. 최종 자동 실행기의 문 앞 FIFO·선점·종료 타이머는 설계만 포함합니다.</p></section>

<section class="panel"><h2>일정·회장님 재실</h2><div class="controls"><label>날짜(KST) <input id="date" type="date"></label><label>시각(KST) <input id="time" type="time"></label><button data-action id="schedule">선택 직원 일정 적용</button><button data-action id="arrival">회장님 방문/활동</button><button id="idle">회장님 idle</button><strong id="presence"></strong></div><p>첫 방문 2.6초(이동 감소 설정은 즉시). 날짜별 연출 완료·좌석 예약·cooldown은 이 페이지 메모리에만 보관됩니다. 첫 방문과 idle을 수동 시험하고, 실제 입력은 마지막 활동시각에 반영합니다.</p></section>

<section class="panel"><h2>이벤트 합성 입력</h2><div class="controls"><label><input id="fixture" type="checkbox">확정 조건 fixture 켜기</label><button id="evaluate">현재 날짜·시각 추첨</button></div><pre id="event-result">현재 앱 상태는 읽지 않습니다. fixture를 켜고 16:30 등을 선택하면 조건·추첨·cooldown 결과를 확인할 수 있습니다.</pre><div class="controls"><select id="event" aria-label="동선 리허설 이벤트"></select><button data-action id="rehearse">선택 이벤트 동선 리허설</button></div><p>동선 리허설은 확률·조건을 건너뛰는 수동 공간 시험입니다. 추첨 버튼은 조건·확률·cooldown·일일 한도만 평가하며 자동 실행하지 않습니다.</p></section>

<section class="panel"><h2>실행 기록</h2><pre id="log" aria-live="polite"></pre><details><summary>홈 앵커와 등록 상태</summary>${table(['직원','홈','상태'],c.people.map(p=>[p.name,p.homeAnchor,p.registration]))}</details></section>
`}

const browserFunctions=[hash,kst,minute,route,transition,schedule,evaluateEvents,markEvent,presence,reaction,floorSVG,plates,boot].map(fn=>fn.toString()).join('\n');
function html(body,script=''){return`<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HANI BUILDING V2 SPATIAL PLAN · 216</title><style>${css}</style></head><body><main>${body}</main>${script}</body></html>\n`}
function outputs(c){const data=JSON.stringify(c).replace(/</g,'\\u003c');const script=`<script id="spatial-contract" type="application/json">${data}</script><script>\nconst esc=${esc.toString()};\n${browserFunctions}\n(async()=>{const status=document.getElementById('status');let c=JSON.parse(document.getElementById('spatial-contract').textContent);if(location.protocol==='http:'||location.protocol==='https:'){try{const response=await fetch('../data/hani-building/spatial-contract.json',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);c=await response.json();status.textContent='원본 spatial-contract.json 읽기 성공 · 운영 연결 없음';}catch(error){status.textContent='원본 JSON 조회 실패 · 생성 시점 계약으로 실행: '+error.message;}}else status.textContent='파일 직접 열기 · spatial-contract.json의 생성 시점 내장본 사용';boot(c)})().catch(error=>document.getElementById('status').textContent='시작 실패: '+error.message);\n</script>`;return{'docs/design/hani-building-v2-spatial.html':html(documentBody(c)),'scripts/hani-office-lowfi-216.html':html(prototypeBody(c),script)}}

function validate(c){
  assert.equal(c.floors.length,5);assert.equal(c.people.length,20);assert.equal(new Set(c.people.map(p=>p.id)).size,20);
  const anchors=new Map(c.anchors.map(a=>[a.id,a]));assert.equal(anchors.size,c.anchors.length);
  const rosterSource=fs.readFileSync(path.join(root,'hani-organization-hub.js'),'utf8');
  const roster=[...rosterSource.matchAll(/\['([a-z]+)','([^']+)','([^']+)','([^']+)'/g)].map(m=>({id:m[1],name:m[2],rank:m[3],team:m[4]}));assert.equal(roster.length,17);
  const displayAliases={mir:'미르/MIR',gaeun:'가은/MUSE'};
  for(const p of roster){const actual=c.people.find(a=>a.id===p.id);assert.ok(actual,p.id);assert.equal(actual.name,displayAliases[p.id]||p.name);assert.equal(actual.rank,p.rank);assert.equal(actual.team,p.team)}
  for(const p of c.people){assert.ok(anchors.has(p.homeAnchor));assert.equal(p.registration,['daon','yoonseul'].includes(p.id)?'planned':p.id==='seongmin'?'chairman':'registered')}
  assert.equal(c.people.find(p=>p.id==='mir').desk,null);assert.equal(c.people.find(p=>p.id==='mir').portrait,null);assert.equal(anchors.get('desk_yuna').floor,'4f');assert.equal(anchors.get('desk_haru').room,'finance');assert.equal(anchors.get('desk_yoonseul').x-anchors.get('desk_hina').x,70);
  for(const e of c.edges){assert.ok(anchors.has(e.from)&&anchors.has(e.to));const a=anchors.get(e.from),b=anchors.get(e.to);if(a.floor!==b.floor){assert.ok(['elevator','stairs'].includes(e.kind));assert.equal(a.type,b.type);assert.equal(Math.abs(parseInt(a.floor)-parseInt(b.floor)),1)}else if(e.kind!=='seat'){
      // 실제 선분을 2px 간격으로 검사. 벽 경계는 문의 44px 개구부로만 통과.
      const f=c.floors.find(f=>f.id===a.floor),steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/2)||1;
      for(let n=0;n<=steps;n++){const x=a.x+(b.x-a.x)*n/steps,y=a.y+(b.y-a.y)*n/steps;assert.ok(f.walkable.some(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h)||c.anchors.some(d=>d.floor===f.id&&d.type==='door'&&Math.abs(x-d.x)<=22&&Math.abs(y-d.y)<=65),'보행 구역 이탈 '+e.from+'→'+e.to)}
    }}
  for(const a of c.anchors.filter(a=>!['display'].includes(a.type))){for(const mode of ['elevator','stairs'])assert.ok(route(c,'arrival_gate',a.id,mode),'도달 불가 '+a.id)}
  const pathToCEO=route(c,'arrival_gate','ceo_desk');for(const id of ['door_lobby','elevator_1f','elevator_2f','elevator_3f','elevator_4f','door_ceo'])assert.ok(pathToCEO.includes(id),id);
  for(const p of c.people.filter(p=>p.entity==='human_chibi'))for(const target of ['coffee_counter','meeting_exec','rooftop_table',p.homeAnchor])assert.ok(route(c,p.homeAnchor,target));
  for(const [state,info] of Object.entries(c.states))for(const next of info.next)assert.ok(c.states[next],state+'→'+next);
  assert.ok(!transition(c,'Work','Meeting'));assert.ok(transition(c,'Work','Walk'));assert.ok(transition(c,'Walk','Meeting'));
  assert.equal(kst('2026-10-15T15:00:00Z').day,'2026-10-16');assert.equal(kst('2026-10-16T14:59:59Z').day,'2026-10-16');
  const person=c.people.find(p=>p.id==='dohyun');for(let i=0;i<1440;i+=15){const time=new Date(Date.UTC(2026,9,16,0,i));assert.deepEqual(schedule(c,person,time),schedule(c,person,time))}
  assert.equal(schedule(c,person,'2026-10-17T03:00:00Z').state,'Away');assert.equal(presence(c,'2026-10-16T00:00:00Z',false).label,'외근 중');assert.equal(presence(c,'2026-10-16T14:00:00Z',false).label,'퇴근');
  for(const event of c.events){assert.ok(anchors.has(event.target));for(const id of event.participants)assert.ok(c.people.some(p=>p.id===id));assert.ok(event.probability>0&&event.probability<=0.35);assert.ok(event.cooldownDays>=2)}
  const input={chairmanActive:true,releaseEveConfirmed:true,monthEnd:true,studyWeek:true,marketFresh:true,marketAbsMovePct:4,travelTomorrow:true,rooftopApproved:true};let sample=null;
  for(let day=1;day<29;day++){const instant=`2026-10-${String(day).padStart(2,'0')}T07:30:00Z`,r=evaluateEvents(c,instant,input);assert.deepEqual(r,evaluateEvents(c,instant,input));if(r.selected)sample={instant,r}}
  assert.ok(sample);const mem={};markEvent(mem,sample.r.day,sample.r.selected);assert.equal(evaluateEvents(c,sample.instant,input,mem).selected,null);mem.running=null;assert.equal(evaluateEvents(c,sample.instant,input,mem).result.find(e=>e.id===sample.r.selected).reason,'cooldown');mem.total[sample.r.day]=2;assert.equal(evaluateEvents(c,sample.instant,input,mem).selected,null);
  assert.ok(!evaluateEvents(c,'2026-10-16T00:30:00Z',{marketAbsMovePct:9}).result.find(e=>e.id==='market_shock').eligible);
  assert.equal(c.assets.items.reduce((sum,a)=>sum+a.totalBytes,0),c.assets.totalPlannedBytes);assert.ok(c.assets.totalPlannedBytes+c.assets.reserveBytes<=c.assets.budgetBytes);
  return '명부17+예정2+회장 / 앵커 유일성·홈 / 전체 문·보행구역·승강기·계단 도달성 / 상태 / KST·일정 결정성 / 이벤트 조건·cooldown·한도 / 자산 예산 PASS';
}

async function browserCheck(moduleFile,browserFile){
  const {chromium}=await import(pathToFileURL(path.resolve(moduleFile)).href);
  const {createServer}=await import('node:http');
  const server=createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const allowed=['/scripts/hani-office-lowfi-216.html','/docs/design/hani-building-v2-spatial.html','/data/hani-building/spatial-contract.json'];
    if(!allowed.includes(pathname)){res.writeHead(404).end();return}
    res.setHeader('Content-Type',pathname.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,pathname.slice(1))));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({headless:true,executablePath:browserFile});
    const errors=[];
    for(const width of [360,390,412,768,884,1440]){
      const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      for(const file of ['/docs/design/hani-building-v2-spatial.html','/scripts/hani-office-lowfi-216.html']){
        await page.goto('http://127.0.0.1:'+server.address().port+file);
        if(file.includes('/scripts/'))await page.waitForFunction(()=>window.HaniSpatial216);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'페이지 넘침 '+width+' '+file);
        if(file.includes('/docs/'))assert.equal(await page.locator('svg').count(),5);
      }
      await page.selectOption('#person','dohyun');
      await page.click('#coffee');await page.waitForFunction(()=>window.HaniSpatial216.actors.get('dohyun').state==='Coffee');
      assert.equal(await page.evaluate(()=>window.HaniSpatial216.actors.get('dohyun').anchor),'coffee_counter');
      await page.click('#meeting');await page.waitForFunction(()=>['hani','dohyun','yuri'].every(id=>window.HaniSpatial216.actors.get(id).state==='Meeting'));
      assert.equal(await page.evaluate(()=>new Set(['hani','dohyun','yuri'].map(id=>window.HaniSpatial216.actors.get(id).x)).size),3);
      await page.click('#elevator');await page.waitForFunction(()=>window.HaniSpatial216.actors.get('dohyun').anchor==='rooftop_table');
      await page.check('#stairs');await page.click('#home');await page.waitForFunction(()=>window.HaniSpatial216.actors.get('dohyun').anchor==='desk_dohyun');
      assert.ok(await page.evaluate(()=>window.HaniSpatial216.actors.get('dohyun').el.classList.contains('sitting')));
      await page.click('#arrival');await page.waitForFunction(()=>window.HaniSpatial216.actors.get('seongmin').state==='Work');
      assert.equal(await page.evaluate(()=>window.HaniSpatial216.actors.get('seongmin').anchor),'ceo_desk');
      await page.click('#idle');assert.equal(await page.evaluate(()=>window.HaniSpatial216.actors.get('seongmin').state),'Away');
      await page.check('#zoom');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await context.close();console.log('실제 브라우저 '+width+'px · 지도/넘침/커피/회의/층간/착석/재실 PASS');
    }
    assert.deepEqual(errors,[]);
    const filePage=await browser.newPage();await filePage.goto(pathToFileURL(path.join(root,'scripts/hani-office-lowfi-216.html')).href);await filePage.waitForFunction(()=>window.HaniSpatial216);assert.ok((await filePage.locator('#status').textContent()).includes('파일 직접 열기'));await filePage.close();
    console.log('file:// 독립 실행 PASS');
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
}

async function executionCheck(htmlText){
  // 실제 생성 HTML의 스크립트·event handler를 메모리 DOM에서 실행한다.
  // 브라우저 layout/computed style/스크린샷 검증을 대체하지 않는다.
  const vm=await import('node:vm');
  class Element{
    constructor(){this.children=[];this.dataset={};this.style={setProperty(k,v){this[k]=v}};this.className='';this.value='';this.checked=false;this.hidden=false;this.textContent='';this.attributes={};this.classList={contains:n=>this.className.split(' ').includes(n),toggle:(n,on)=>{const s=new Set(this.className.split(' ').filter(Boolean));on?s.add(n):s.delete(n);this.className=[...s].join(' ')}}}
    set innerHTML(value){this.html=value;this.children=[]}get innerHTML(){return this.html||''}
    append(...items){this.children.push(...items)}
    replaceChildren(...items){this.children=items;if(items[0]?.value)this.value=items[0].value}
    setAttribute(k,v){this.attributes[k]=v}
  }
  const dom=new Map([...htmlText.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],new Element()]));
  const floors=[...htmlText.matchAll(/data-floor="([^"]+)"/g)].map(m=>{const e=new Element();e.dataset.floor=m[1];return e});
  const actions=[...htmlText.matchAll(/data-action id="([^"]+)"/g)].map(m=>dom.get(m[1]));
  const contractText=htmlText.match(/<script id="spatial-contract" type="application\/json">([\s\S]*?)<\/script>/)[1];dom.get('spatial-contract').textContent=contractText;
  let clock=0;const listener={};const sandbox={console,Date,Map,Set,Promise,Option:class extends Element{constructor(label,value){super();this.textContent=label;this.value=value}},location:{protocol:'file:'},matchMedia:()=>({matches:true}),performance:{now:()=>clock},requestAnimationFrame:fn=>queueMicrotask(()=>fn(clock+=16)),setInterval:()=>0,document:{hidden:false,getElementById:id=>dom.get(id),createElement:()=>new Element(),querySelectorAll:selector=>selector==='[data-floor]'?floors:selector==='[data-action]'?actions:[],addEventListener:(name,fn)=>listener[name]=fn},localStorage:new Proxy({},{get(){throw Error('보호 저장소 접근 금지')}}),fetch:()=>{throw Error('예상하지 않은 네트워크')}};sandbox.window=sandbox;
  const context=vm.createContext(sandbox),script=[...htmlText.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];await new vm.Script(script).runInContext(context);
  const office=sandbox.HaniSpatial216;assert.ok(office);assert.equal(office.actors.size,19);
  const click=async id=>{assert.ok(dom.get(id).onclick,id);await dom.get(id).onclick()};
  await click('coffee');assert.equal(office.actors.get('dohyun').state,'Coffee');assert.equal(office.actors.get('dohyun').floor,'1f');
  await click('meeting');for(const id of ['hani','dohyun','yuri'])assert.equal(office.actors.get(id).state,'Meeting');assert.equal(new Set(['hani','dohyun','yuri'].map(id=>office.actors.get(id).x)).size,3);
  await click('elevator');assert.equal(office.actors.get('dohyun').anchor,'rooftop_table');
  dom.get('stairs').checked=true;dom.get('stairs').onchange();await click('home');const actor=office.actors.get('dohyun');assert.equal(actor.anchor,'desk_dohyun');assert.ok(actor.el.classList.contains('sitting'));
  const mask=dom.get('stage').children.find(el=>el.dataset.anchor==='desk_dohyun'&&el.className.includes('desk-mask'));assert.ok(mask);assert.ok(Number(mask.style.cssText.match(/z-index:(\d+)/)[1])>actor.el.style.zIndex,'착석 하체 가림 순서');
  dom.get('date').value='2026-10-17';dom.get('time').value='12:00';await click('schedule');assert.equal(actor.state,'Away');dom.get('date').value='2026-10-16';dom.get('time').value='09:30';await click('schedule');assert.equal(actor.state,'Work');
  dom.get('stairs').checked=false;dom.get('stairs').onchange();await click('arrival');assert.equal(office.actors.get('seongmin').anchor,'ceo_desk');assert.equal(office.actors.get('seongmin').state,'Work');
  const reactionCount=()=>dom.get('log').textContent.split('\n').filter(line=>line.includes('회장님.')||line.includes('회장님 오셨다')||line.endsWith('왔어?')).length;
  assert.equal(reactionCount(),1);await click('idle');assert.equal(office.actors.get('seongmin').state,'Away');await click('arrival');assert.equal(reactionCount(),1);
  dom.get('time').value='16:30';dom.get('fixture').checked=true;await click('evaluate');assert.ok(dom.get('event-result').textContent.includes('Market Shock'));
  await click('return-all');for(const [id,a] of office.actors)if(a.state!=='Away')assert.equal(a.anchor,office.contract.people.find(p=>p.id===id).homeAnchor);
  assert.ok(!dom.get('log').textContent.includes('오류:'));assert.ok(dom.get('status').textContent.includes('파일 직접 열기'));
  console.log('생성 HTML 실행 · 초기화/커피/회의3명/승강기/계단/착석 z-order/주말/회장 첫 방문·중복 억제/idle/이벤트/전원 복귀 PASS (메모리 DOM, 실제 화면 아님)');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(validate(C));
  const out=outputs(C);
  if(process.argv.includes('--check')){for(const [name,content] of Object.entries(out))assert.equal(fs.readFileSync(path.join(root,name),'utf8'),content,'재생성 필요: '+name);console.log('생성 HTML·JSON 계약 일치 PASS');await executionCheck(out['scripts/hani-office-lowfi-216.html'])}
  else for(const [name,content] of Object.entries(out)){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),content);console.log('생성: '+name)}
  const browserArg=process.argv.indexOf('--browser');if(browserArg>=0)await browserCheck(process.argv[browserArg+1],process.argv[browserArg+2]);
}
