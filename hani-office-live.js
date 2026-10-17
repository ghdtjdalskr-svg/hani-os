/* V2 metadata is read-only; a failed metadata request keeps the production renderer. */
(async () => {
  let assets=globalThis.HaniOfficeV2Assets||null;
  if(!assets&&typeof fetch==='function'){
    try{
      const [canon,sprites,art]=await Promise.all(['./data/hani-building/spatial-contract.json','./assets/sprites-v2/manifest.json','./data/hani-building/art-map-v1.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw Error('office metadata');return response.json()}));
      if(canon.contractVersion==='spatial-216-v1'&&canon.anchors.length===326&&art.contractVersion===canon.contractVersion&&canon.anchors.every(a=>art.anchors[a.id]))assets={canon,sprites,art};
    }catch(_){/* Production art and seats remain available without metadata. */}
  }
/* Scene-only model: KST clock and rosters, never persisted. */
(() => {
  "use strict";
  const fallback="./assets/ai-approval-concepts/v3-office-background-empty-8-seats.webp";
  const legacyFloors=Object.freeze([
    {id:"4f",label:"4F 대표실·라운지",tint:"#b692df",residents:["hani","gaeun","mir"]},
    {id:"3f",label:"3F AI플랫폼개발실",tint:"#79aecf",residents:["seoyun","dohyun","serin","yuri","arin"]},
    {id:"2f",label:"2F 재무·라이프",tint:"#94bd8e",residents:["jieun","haru","naeun","hina","minji","sooyeon"]},
    {id:"1f",label:"1F 로비",tint:"#e3b67d",residents:["yuna","sua","taeo"]}
  ].map(f=>Object.freeze({...f,residents:Object.freeze(f.residents),background:`./assets/building/floor-${f.id}-v1.webp`,fallback})));

  // Coordinates are chair/feet anchors on the 1672 x 941 floor art, in percent.
  // box = floor footprint (x radius 1.4%, depth 1.4%); desk rects also drive occlusion.
  const chair=(id,zone,x,y,owner=null)=>Object.freeze({id,zone,x,y,owner,layer:zone==="meeting"&&y>75?9:4,box:Object.freeze([x-1.4,y-1.4,x+1.4,y])});
  const legacySeatMaps=Object.freeze({
    "1f":Object.freeze([
      chair("reception","reception",50,30.5,"yuna"),
      chair("business-west","lounge",12,58,"sua"),chair("business-east","lounge",18,58,"taeo"),
      chair("lobby-nw","lounge",72,36),chair("lobby-ne","lounge",86,36),
      chair("lobby-sw","lounge",72,49),chair("lobby-se","lounge",87,49)
    ]),
    "2f":Object.freeze([
      chair("finance-lead","desk",20,18),chair("finance-a","desk",13,49,"jieun"),
      chair("finance-b","desk",25,49,"haru"),chair("life-a","desk",38,49,"naeun"),
      chair("life-b","desk",13,73,"hina"),chair("life-c","desk",25,73,"minji"),
      chair("life-d","desk",38,73,"sooyeon"),
      chair("finance-lounge-a","lounge",72,27),chair("finance-lounge-b","lounge",78,27),
      chair("meeting-nw","meeting",75,63),chair("meeting-ne","meeting",85,63),
      chair("meeting-sw","meeting",74,83),chair("meeting-s","meeting",81,83),
      chair("meeting-se","meeting",87,83),chair("meeting-e","meeting",94,72)
    ]),
    "3f":Object.freeze([
      chair("dev-lead","desk",13,46,"seoyun"),chair("dev-build","desk",25,46,"dohyun"),
      chair("dev-research","desk",38,46,"serin"),chair("dev-qa","desk",13,68,"yuri"),
      chair("dev-design","desk",25,68,"arin"),chair("dev-spare","desk",38,68),
      chair("dev-lounge-a","lounge",19,20.5),chair("dev-lounge-b","lounge",27,20.5),
      chair("dev-meeting-nw","meeting",73,59),chair("dev-meeting-n","meeting",81,59),
      chair("dev-meeting-ne","meeting",88,59),chair("dev-meeting-sw","meeting",74,79),
      chair("dev-meeting-s","meeting",81,79),chair("dev-meeting-se","meeting",88,79),
      chair("server-console","server",89,20)
    ]),
    "4f":Object.freeze([
      chair("ceo-reserved","desk",22.5,27.8,"chairman"),
      chair("hani-side","lounge",71,32,"hani"),chair("lounge-center","lounge",77,32),
      chair("lounge-east","lounge",82,32),chair("lounge-armchair","lounge",64,42),
      chair("secretary-side","meeting",71.5,65,"gaeun"),chair("context-side","meeting",85,65,"mir"),
      chair("board-n","meeting",80.5,65),chair("board-ne","meeting",76,65),
      chair("board-sw","meeting",71.5,84),chair("board-s","meeting",76,84),
      chair("board-se","meeting",80.5,84),chair("board-e","meeting",85,84)
    ])
  });
  const legacySurfaces=Object.freeze({
    "1f":[[39,31,61,36],[8.5,63,20,70],[75,38,83,43]],
    "2f":[[11,19,28,25.5],[6,50,45,60],[6,74,45,84],[70,64,91,75],[70,30,81,37]],
    "3f":[[5,47,46,56],[4,69,46,78],[70,60,92,71],[17.5,22,26.5,27.5]],
    "4f":[[10.5,28.2,34,35],[67.5,66,89.5,76],[71,34,83,41]]
  });
  const canon=assets?.canon, art=assets?.art, anchors=new Map((canon?.anchors||[]).map(a=>[a.id,a]));
  const eligible=(canon?.people||[]).filter(p=>p.status==='active'&&p.registration==='registered'&&(!window.HaniOrganizationRoster||window.HaniOrganizationRoster.people.some(r=>r.id===p.id)));
  const floors=canon?Object.freeze(canon.floors.map(f=>Object.freeze({id:f.id,label:f.label,tint:legacyFloors.find(l=>l.id===f.id)?.tint||'#9cbd9a',residents:Object.freeze(eligible.filter(p=>anchors.get(p.homeAnchor)?.floor===f.id).map(p=>p.id)),background:art.floors[f.id].background,production:legacyFloors.find(l=>l.id===f.id)?.background||fallback,fallback}))):legacyFloors;
  const seatMaps=canon?Object.freeze(Object.fromEntries(floors.map(f=>[f.id,Object.freeze(canon.anchors.filter(a=>a.floor===f.id&&a.rendererSeat&&a.runtimeAssignable!==false).map(a=>Object.freeze({...a.rendererSeat,...art.anchors[a.id],anchor:a.id,posture:a.posture||(a.type==='seat'||a.type==='desk'?'sitting':'standing'),box:Object.freeze([art.anchors[a.id].x-1.4,art.anchors[a.id].y-1.4,art.anchors[a.id].x+1.4,art.anchors[a.id].y])})))]))):legacySeatMaps;
  const deskSurfaces=canon?Object.fromEntries(canon.floors.map(f=>[f.id,[]])):legacySurfaces;
  function visualPoint(anchor){const point=art?.anchors[anchor.id];return point?[point.x,point.y]:[anchor.x/10,anchor.y/6.4]}
  // Dijkstra over explicit canon edges. Intermediate chairs and stairs are forbidden.
  function route(from,to){
    if(!canon||!anchors.has(from)||!anchors.has(to))return [];
    const distance=new Map([[from,0]]),previous=new Map(),open=new Set([from]);
    while(open.size){const current=[...open].sort((a,b)=>distance.get(a)-distance.get(b))[0];open.delete(current);if(current===to)break;
      for(const edge of canon.edges){if(edge.kind==='stairs')continue;const next=edge.from===current?edge.to:edge.bidirectional&&edge.to===current?edge.from:null;if(!next)continue;const a=anchors.get(current),b=anchors.get(next);if(!a||!b||next!==to&&b.rendererSeat)continue;
        const cost=distance.get(current)+(a.floor===b.floor?Math.hypot(a.x-b.x,a.y-b.y):180);
        if(cost<(distance.get(next)??Infinity)){distance.set(next,cost);previous.set(next,current);open.add(next)}
      }
    }
    if(!distance.has(to))return [];const path=[to];while(path[0]!==from)path.unshift(previous.get(path[0]));return path.map(id=>anchors.get(id));
  }
  for(const rects of Object.values(deskSurfaces)){for(const rect of rects)Object.freeze(rect);Object.freeze(rects)}
  function homeSeat(id){return Object.values(seatMaps).flat().find(s=>s.owner===id&&s.owner!=="chairman")}
  function assignSeats(floor,entries){
    const used=new Set(),result=new Map();
    // Reserve present residents' home chairs before visitors choose a free chair.
    for(const p of entries){const seat=homeSeat(p.id);if(p.activity==="work"&&seatMaps[floor].includes(seat)){result.set(p.id,seat);used.add(seat.id)}}
    for(const p of entries){if(result.has(p.id))continue;const zone=p.activity==="rest"?"lounge":p.activity==="meeting"?"meeting":homeSeat(p.id)?.zone;
      const seat=canon&&p.id==='mir'&&p.activity==='meeting'?seatMaps[floor].find(s=>s.anchor==='mir_meeting_pos'):seatMaps[floor].find(s=>s.zone===zone&&s.owner!=="chairman"&&!used.has(s.id)&&(!canon||s.anchor!=='mir_meeting_pos'&&(!s.owner||s.owner===p.id)));
      if(seat){result.set(p.id,seat);used.add(seat.id)}
    }
    return entries.map(p=>({...p,seat:result.get(p.id)}));
  }
  const roleActions=Object.freeze({
    hani:["안건 검토 중","팀 일정 정리 중"],jieun:["보고서 작성 중","예산 검산 중"],
    haru:["구매 자료 비교 중","소비 보고서 작성 중"],naeun:["건강 기록 정리 중","루틴 검토 중"],
    hina:["학습 자료 검토 중","최종 검수 중"],minji:["기사 작성 중","콘텐츠 자료 정리 중"],
    sooyeon:["여행 자료 조사 중","경기 일정 확인 중"],seoyun:["설계 검토 중","코드 리뷰 중"],
    dohyun:["구현과 테스트 중","코드 리뷰 중"],serin:["자동화 점검 중","분석 자료 정리 중"],
    yuri:["회귀 검증 중","변경 범위 리뷰 중"],arin:["화면 사용성 검토 중","접근성 점검 중"],
    gaeun:["일정 정리 중","회의 자료 준비 중"],mir:["맥락 연결 중","자료 탐색 중"],
    yuna:["방문 일정 확인 중","안내 자료 정리 중"],sua:["고객 제안 검토 중","보고서 작성 중"],
    taeo:["고객 제안 검토 중","솔루션 자료 정리 중"]
  });
  const zoneActions=Object.freeze({
    desk:Object.freeze(["보고서 작성 중","자료 정리 중"]),
    lounge:Object.freeze(["커피 한 잔","잠깐 수다","잠시 쉬는 중"]),
    meeting:Object.freeze(["회의 중","회의 자료 함께 보는 중","의견 나누는 중"]),
    reception:Object.freeze(["방문객 안내 중","방문 일정 확인 중"]),
    server:Object.freeze(["서버 상태 확인 중","자동화 상태 점검 중"])
  });
  function actionPool(id,zone){
    const role=roleActions[id]||zoneActions.desk;
    if(zone==="desk")return [...role,...zoneActions.desk];
    if(zone==="meeting")return [...zoneActions.meeting,role[0].replace(/ 중$/,"")+" 안건 회의 중"];
    if(zone==="reception")return [...zoneActions.reception,...(id==="yuna"?["안내 요청 확인 중"]:["고객 방문 준비 중"])];
    return zoneActions[zone]||[];
  }
  function bubble(id,seat,slot){const pool=actionPool(id,seat.zone),icon={desk:"💻",lounge:"☕",meeting:"📑",reception:"👋",server:"🖥"};
    return icon[seat.zone]+" "+pool[hash(id+":"+slot)%pool.length];
  }

  function hash(value){let n=0;for(const ch of value)n=(Math.imul(n,31)+ch.charCodeAt(0))>>>0;return n}
  function projection(entries){const ordered=[...entries].sort((a,b)=>Number(b.activity!=="work")-Number(a.activity!=="work"));return {visible:ordered.slice(0,6),overflow:Math.max(0,entries.length-6)}}
  function snapshot(now=new Date()){
    const date=new Date(new Date(now).getTime()+9*60*60*1000),day=date.toISOString().slice(0,10),minutes=date.getUTCHours()*60+date.getUTCMinutes();
    const onBreak=minutes>=720&&minutes<780||minutes>=900&&minutes<920,onMeeting=minutes>=600&&minutes<630||minutes>=960&&minutes<990;
    const entries=floors.flatMap(f=>f.residents.map(id=>({id,home:f.id,floor:f.id,activity:"work"})));
    if(onBreak){const seed=hash(day+":"+(minutes<780?"lunch":"afternoon")),visitors=entries.filter(p=>p.home!=="4f");for(let i=0;i<1+seed%3;i++){const p=visitors[(seed+i*5)%visitors.length];p.floor="4f";p.activity="rest"}}
    if(onMeeting)for(const p of entries.filter(p=>["hani","seoyun","jieun"].includes(p.id))){p.floor="2f";p.activity="meeting"}
    return {day,minutes,onBreak,onMeeting,floors:floors.map(f=>{const residents=entries.filter(p=>p.floor===f.id);return {...f,people:assignSeats(f.id,residents),work:residents.filter(p=>p.activity!=="rest").length,rest:residents.filter(p=>p.activity==="rest").length,...projection(assignSeats(f.id,residents))}})};
  }
  function profile(id){return `./assets/profiles/thumb/hani-profile-${id}-256.webp`}
  globalThis.HaniBuildingScene=Object.freeze({floors,snapshot,projection,profile,seatMaps,deskSurfaces,homeSeat,assignSeats,actionPool,bubble,canon,art,visualPoint,anchors,route,legacySeatMaps,legacySurfaces});
})();
/* Read-only Living Office. The Agent Case renderer remains the sole owner of requests, answers and decisions. */
(() => {
  "use strict";
  const root=document.getElementById("haniOfficeLive"),map=document.getElementById("haniOfficeMap");
  if(!root||!map)return;
  const people=[
    ["hani","하니","a",0],
    ["jieun","지은","a",1],
    ["naeun","나은","a",2],
    ["hina","히나","b",0],
    ["sua","수아","b",1],
    ["haru","하루","b",2],
    ["minji","민지","c",0],
    ["sooyeon","수연","c",1],
    ["yuna","유나","c",2]
  ];
  for(const key of HaniBuildingScene.floors.flatMap(f=>f.residents))if(!people.some(p=>p[0]===key)){const member=window.HaniOrganizationRoster?.people.find(p=>p.id===key);people.push([key,member?.name||key,null,0])}
  function personKey(value){const raw=String(value||"").trim().toLowerCase();return raw==="suyeon"?"sooyeon":raw==="nauen"?"naeun":raw}
  const actorLayer=document.getElementById("haniOfficeActors"),conversation=document.getElementById("haniOfficeConversation"),meetingBox=document.getElementById("haniOfficeMeeting"),participantBar=document.getElementById("haniOfficeParticipants"),questionSlot=document.getElementById("haniOfficeQuestions"),openButton=document.getElementById("haniOfficeMeetingOpen"),returnButton=document.getElementById("haniOfficeReturn"),caseState=document.getElementById("haniOfficeCaseState");
  const actors=new Map();let frame=0,caseData=null,meeting=false,travelId=0,liveStage="",liveAgents=null,liveCross=null;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motion.matches;
  motion.addEventListener?.('change',event=>{reduced=event.matches;if(reduced)for(const actor of actors.values())finishTravel(actor)});
  const spriteEntries=new Map((assets?.sprites.entries||[]).map(e=>[e.id,e])),spriteCache=new Map();
  function pose(actor,name){
    const sprite=actor.querySelector('.hani-office-sprite'),entry=spriteEntries.get(actor.dataset.person);
    actor.dataset.pose=name;
    if(actor.dataset.avatar!=='v2'||!entry)return;
    const f=entry.frames.find(f=>f.name===name)||entry.frames[0];
    sprite.style.backgroundPosition=(f.rect[0]/(entry.atlas[0]-entry.cell[0])*100)+'% '+(f.rect[1]/(entry.atlas[1]-entry.cell[1])*100)+'%';
    actor.style.transform='translate(-'+(f.pivot[0]/entry.cell[0]*100)+'%,-'+(f.pivot[1]/entry.cell[1]*100)+'%)';
  }
  function loadSprite(actor){
    const id=actor.dataset.person,entry=spriteEntries.get(id),sprite=actor.querySelector('.hani-office-sprite');if(!entry)return;
    if(!spriteCache.has(id))spriteCache.set(id,new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src='./assets/sprites-v2/'+entry.file}));
    spriteCache.get(id).then(ok=>{if(!ok)return;actor.dataset.avatar='v2';sprite.className='hani-office-sprite';sprite.style.backgroundImage='url("./assets/sprites-v2/'+entry.file+'")';sprite.style.backgroundSize=(entry.atlas[0]/entry.cell[0]*100)+'% '+(entry.atlas[1]/entry.cell[1]*100)+'%';pose(actor,actor.dataset.pose||'sitting')});
  }
  function finishTravel(actor){if(!actor.officeTravel)return;const {seat}=actor.officeTravel;actor.officeTravel=null;actor.officeAnchor=seat.anchor||seat.id;place(actor,[seat.x,seat.y]);pose(actor,seat.posture||'sitting')}
  function place(actor,position){actor.style.left=position[0]+"%";actor.style.top=position[1]+"%"}
  function label(actor,value,mood=false){actor.querySelector(".hani-office-status").textContent=value;actor.dataset.mood=String(mood);actor.setAttribute("aria-label",`${actor.dataset.name}: ${value}`);if(actor.officeText)actor.officeText.textContent=value}
  for(const [key,name,group,row] of people){
    const actor=document.createElement("div");actor.className="hani-office-actor";actor.dataset.person=key;actor.dataset.name=name;actor.dataset.seat=HaniBuildingScene.homeSeat(key).id;actor.dataset.spot="seat";
    const sprite=document.createElement('div');sprite.className='hani-office-sprite';sprite.dataset.row=String(row);actor.officeLegacy={group,row};
    const status=document.createElement("span");status.className="hani-office-status";const tag=document.createElement("small");tag.className="hani-office-name";tag.textContent=name.split(" · ").at(-1);actor.append(sprite,tag,status);actor.dataset.avatar="pending";actorLayer.append(actor);actors.set(key,actor);
  }
  // One scene host; actors remain mounted and only their floor/position changes.
  const building=HaniBuildingScene,tabs=root.querySelector(".hani-building-tabs"),floorLabel=document.createElement("span"),overflowChip=document.createElement("span"),floorButtons=new Map(),backgroundCache=new Map();
  const roster=document.createElement("ul");roster.className="hani-building-roster";roster.setAttribute("aria-label","현재 층 직원과 활동");root.querySelector(".hani-office-scroll").after(roster);for(const actor of actors.values()){const row=document.createElement("li"),name=document.createElement("b"),text=document.createElement("span");name.textContent=actor.dataset.name;row.append(name,text);roster.append(row);actor.officeRow=row;actor.officeText=text}
  const plannedRows=(building.canon?.people||window.HaniOrganizationRoster?.people||[]).filter(p=>p.status==='planned').map(p=>{
    const row=document.createElement('li'),name=document.createElement('b'),badge=document.createElement('span'),info=document.createElement('span');
    row.dataset.plannedPerson=p.id;name.textContent=p.name;badge.className='hani-office-planned-badge';badge.textContent='입사 예정';
    const floor=building.anchors.get(p.homeAnchor)?.floor||p.floor?.toLowerCase()||'2f',note=building.art?.floors[floor]?.homeFurniture?.[p.homeAnchor]?.seatNote;
    info.textContent='사원 · '+(p.team==='finance'?'재무자산관리실 · 리스크 애널리스트':'라이프&엔터테인먼트 · 러닝 리서처')+(note?' · '+note:'');
    row.append(name,badge,info);roster.append(row);return {row,floor};
  });
  const plates=[];
  for(const floor of building.floors)for(const entry of building.art?.floors[floor.id].plates||[]){
    const plate=document.createElement('span');plate.className='hani-office-room-plate';plate.dataset.room=entry.room;
    plate.dataset.material=entry.material;plate.dataset.secondary=String(Boolean(entry.secondary));plate.dataset.label=entry.label;plate.textContent=entry.label;plate.title=entry.fullLabel||entry.label;
    if(entry.mount){
      plate.dataset.mount=entry.mount;
      const korean=document.createElement('b');korean.textContent=entry.label;plate.replaceChildren(korean);
      plate.setAttribute('aria-label',entry.label+' · '+entry.english);
    }
    if(entry.logo){
      plate.dataset.brand='true';plate.textContent='';
      const logo=document.createElement('span');logo.className='hani-office-brand';
      for(const part of ['mark','word']){const image=document.createElement('img');image.className='hani-office-brand-'+part;image.src=entry.logo;image.alt=part==='word'?'HANI GROUP':'';logo.append(image)}
      const subtitle=document.createElement('small');subtitle.textContent=entry.label;plate.append(logo,subtitle);
    }
    plate.style.left=entry.x+'%';plate.style.top=entry.y+'%';plate.style.width=entry.width+'%';
    plate.style.transform='rotate('+entry.rotate+'deg) skewX('+entry.skew+'deg) scaleX('+(entry.textScaleX||1)+')';plate.style.color=entry.ink;
    plate.style.setProperty('--letter-size',String(entry.nativeFont||24));
    map.append(plate);plates.push({plate,floor:floor.id,painted:Boolean(entry.mount)});
  }
  let activeFloor="4f",floorSnapshot=null,layoutKey="",backgroundToken=0,returnFloor="4f",displayedFloor=null;
  floorLabel.className="hani-building-floor-label";overflowChip.className="hani-building-overflow";const caption=document.createElement('div');caption.className='hani-building-floor-caption';caption.append(floorLabel,overflowChip);root.querySelector('.hani-office-scroll').after(caption);
  const nameplate=document.createElement("span");nameplate.className="hani-office-ceo-nameplate";nameplate.textContent="회장님 자리";map.append(nameplate);
  const foregrounds=[...map.querySelectorAll(".hani-office-foreground")];
  for(const img of foregrounds){img.className='hani-office-foreground';img.hidden=true}
  // Reuse the first art slot for native lossless sign patches, below actors and text.
  const signArt=foregrounds[0];if(signArt)signArt.dataset.interior='true';
  const rooms=document.createElement('div');rooms.className='hani-building-rooms';root.querySelector('.hani-office-scroll').after(rooms);
  const roomLabels=new Map();
  for(const floor of building.floors){const list=document.createElement('p');list.textContent=[...(building.canon?.floors.find(f=>f.id===floor.id)?.rooms||[]).map(r=>r.label),...(building.art?.floors[floor.id].plates||[]).filter(p=>p.detail).map(p=>p.fullLabel)].join(' · ');rooms.append(list);roomLabels.set(floor.id,list)}
  function legacySprite(actor){
    const sprite=actor.querySelector('.hani-office-sprite'),{group,row}=actor.officeLegacy;
    if(group){sprite.className='hani-office-sprite hani-office-sheet-'+group;sprite.style.backgroundImage='';sprite.style.backgroundSize='600% 300%';sprite.style.backgroundPosition='0% '+['0%','50%','100%'][row];actor.dataset.avatar='chibi'}
    else{sprite.className='hani-office-sprite hani-office-avatar';sprite.style.backgroundImage='url("'+building.profile(actor.dataset.person)+'")';sprite.style.backgroundSize='cover';sprite.style.backgroundPosition='center';actor.dataset.avatar='badge'}
  }
  function seatActor(actor,seat,animate=false){
    const target=seat.anchor||seat.id,old=actor.officeAnchor;
    if(actor.officeTravel&&actor.officeTravel.seat.id===seat.id)return;
    actor.officeTravel=null;actor.dataset.seat=seat.id;actor.dataset.zone=seat.zone;actor.dataset.spot=seat.zone==='desk'?'seat':seat.zone;
    actor.dataset.home=[seat.x,seat.y].join(',');actor.style.zIndex='4';
    const path=animate&&!reduced&&building.canon?building.route(old&&building.anchors.get(old)?.floor===activeFloor?old:'elevator_'+activeFloor,target):[];
    if(animate&&!reduced&&building.canon&&!path.length){actor.dataset.route='blocked';label(actor,'이동 경로를 확인할 수 없어 출발 위치에서 대기 중');return}
    actor.dataset.route='ready';
    if(path.length>1){actor.officeTravel={path,index:0,elapsed:0,seat};pose(actor,'walk-a');place(actor,building.visualPoint(path[0]))}
    else{actor.officeAnchor=target;place(actor,[seat.x,seat.y]);pose(actor,seat.posture||'sitting')}
  }
  for(const floor of building.floors){
    const button=document.createElement("button"),title=document.createElement("strong"),count=document.createElement("small");
    button.type="button";button.dataset.buildingFloor=floor.id;button.setAttribute("role","tab");button.setAttribute("aria-controls",map.id);button.id="hani-building-tab-"+floor.id;
    title.textContent=floor.label;button.append(title,count);tabs.append(button);floorButtons.set(floor.id,button);
  }
  function sceneVisible(){return !document.hidden&&!!root.closest(".view")?.classList.contains("active")&&!root.hidden&&getComputedStyle(root).display!=="none"}
  function loadImage(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(src);img.onerror=()=>resolve(null);img.src=src})}
  function setBackground(floor){
    if(!sceneVisible())return;
    const token=++backgroundToken,bg=map.querySelector('.hani-office-background');
    if(!backgroundCache.has(floor.id))backgroundCache.set(floor.id,(async()=>{
      const background=await loadImage(floor.background)||await loadImage(floor.production||floor.fallback)||floor.fallback;
      const patch=building.art?.floors[floor.id]?.signPatch;
      const foreground=background===floor.background&&patch?await loadImage(patch):null;
      return {background,foreground};
    })());
    backgroundCache.get(floor.id).then(({background,foreground})=>{
      if(token!==backgroundToken||!sceneVisible())return;
      bg.src=background;bg.alt=floor.label+' · 하니 본사';map.dataset.art=background===floor.background?'floor':'fallback';
      foregrounds.forEach(img=>{img.hidden=true});
      if(signArt&&foreground){signArt.src=foreground;signArt.hidden=false}
      map.dataset.mask=foreground?'interior':'none';
      for(const entry of plates)if(entry.floor===floor.id&&entry.painted)entry.plate.hidden=!foreground;
    });
  }
  function updateBuilding(force=false,animate=true){
    floorSnapshot=building.snapshot();
    for(const floor of floorSnapshot.floors){const button=floorButtons.get(floor.id),selected=floor.id===activeFloor;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;button.querySelector("small").textContent=`근무 ${floor.work} · 휴식 ${floor.rest}`}
    const floor=floorSnapshot.floors.find(f=>f.id===activeFloor),selected=meeting&&activeFloor==="2f"?selectedAgents():null;
    const entries=selected?building.assignSeats(activeFloor,selected.map(id=>({id,activity:"meeting"}))):meeting&&activeFloor==='4f'&&selectedAgents().includes('mir')?building.assignSeats(activeFloor,floor.visible.map(p=>p.id==='mir'?{...p,activity:'meeting'}:p)):floor.visible;
    const nextKey=floorSnapshot.day+":"+activeFloor+":"+entries.map(p=>p.id+"/"+p.activity+"/"+p.seat?.id).join(",")+":"+Boolean(selected)+":"+Math.floor(floorSnapshot.minutes/5);
    if(!force&&nextKey===layoutKey)return;
    const sameFloor=displayedFloor===activeFloor;displayedFloor=activeFloor;
    for(const [id,list] of roomLabels)list.hidden=id!==activeFloor;
    layoutKey=nextKey;map.dataset.floor=activeFloor;map.style.setProperty("--floor-tint",floor.tint);map.setAttribute("aria-labelledby",floorButtons.get(activeFloor).id);map.setAttribute("aria-label",floor.label);floorLabel.textContent=floor.label;
    const overflow=selected?0:floor.overflow;overflowChip.hidden=!overflow;overflowChip.textContent="+"+overflow;overflowChip.setAttribute("aria-label",`이 층의 다른 직원 ${overflow}명`);
    for(const entry of plates)entry.plate.hidden=entry.floor!==activeFloor||entry.painted;
    if(!sameFloor)foregrounds.forEach(img=>{img.hidden=true});
    nameplate.hidden=activeFloor!=="4f";
    const ceo=building.seatMaps["4f"].find(s=>s.owner==="chairman");nameplate.style.left=ceo.x+"%";nameplate.style.top=(ceo.y+7)+"%";
    setBackground(floor);
    for(const entry of plannedRows)entry.row.hidden=entry.floor!==activeFloor;
    for(const actor of actors.values()){actor.hidden=true;actor.officeRow.hidden=true;actor.dataset.called="false"}
    for(const p of entries){const actor=actors.get(p.id);if(!actor||!p.seat)continue;actor.hidden=false;actor.officeRow.hidden=false;actor.dataset.activity=p.activity;
      if(actor.dataset.avatar==='pending')legacySprite(actor);if(sceneVisible())loadSprite(actor);
      seatActor(actor,p.seat,animate&&(sameFloor||meeting));label(actor,building.bubble(p.id,p.seat,floorSnapshot.day+":"+Math.floor(floorSnapshot.minutes/5)));
      if(selected)actor.dataset.called="true";
    }
  }
  function selectFloor(id,animate=false){if(!floorButtons.has(id))return;for(const actor of actors.values())finishTravel(actor);activeFloor=id;updateBuilding(true,animate)}
  tabs.addEventListener("click",event=>{const button=event.target.closest("[data-building-floor]");if(button&&tabs.contains(button))selectFloor(button.dataset.buildingFloor)});
  tabs.addEventListener("keydown",event=>{const keys=[...floorButtons.keys()],index=keys.indexOf(activeFloor);let next;if(event.key==="ArrowRight")next=(index+1)%keys.length;else if(event.key==="ArrowLeft")next=(index+keys.length-1)%keys.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=keys.length-1;else return;event.preventDefault();selectFloor(keys[next]);floorButtons.get(keys[next]).focus()});
  function syncVisibility(){const visible=sceneVisible();root.dataset.paused=String(!visible);if(visible)updateBuilding(true,false)}
  document.addEventListener("visibilitychange",syncVisibility);
  new MutationObserver(syncVisibility).observe(root.closest(".view"),{attributes:true,attributeFilter:["class","hidden","style"]});
  updateBuilding(true);syncVisibility();
  function changeOne(){if(sceneVisible()&&!meeting)updateBuilding()}
  function homeAll(){updateBuilding(true)}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function walk(selected,returning=false){
    const token=++travelId;map.dataset.state=returning?"return":"summon";
    if(!returning)selected.forEach(key=>{const actor=actors.get(key);if(actor){actor.dataset.called="true";label(actor,"📣 회의 소집")}});
    if(returning&&building.canon)for(const key of selected){const actor=actors.get(key),elevator=building.anchors.get('elevator_'+activeFloor);if(actor&&!actor.hidden&&elevator)seatActor(actor,{id:elevator.id,anchor:elevator.id,zone:'meeting',x:building.visualPoint(elevator)[0],y:building.visualPoint(elevator)[1],posture:'standing'},true)}
    // The same named meeting chairs own summon/return placement; no legacy waypoints.
    while(!sceneVisible()){await sleep(200);if(token!==travelId)return false}
    await sleep(reduced?25:100);if(token!==travelId)return false;
    while(!reduced&&selected.some(id=>actors.get(id)?.officeTravel)){await sleep(100);if(token!==travelId)return false}
    while(!sceneVisible()){await sleep(200);if(token!==travelId)return false}
    if(!returning)updateBuilding(true,false);
    return true;
  }
  function textLine(name,text,key,summary=false){const row=document.createElement("div");row.className="hani-office-line"+(summary?" hani-office-line-summary":"");const img=document.createElement("img");img.src=`./assets/profiles/hani-profile-${key||"hani"}.webp`;img.alt="";img.loading="lazy";const body=document.createElement("div");body.className="hani-office-line-body";const title=document.createElement("b");title.textContent=name;const para=document.createElement("p");para.textContent=text;body.append(title,para);row.append(img,body);conversation.append(row)}
  const stageLabels={INTAKE:"하니가 안건을 접수했습니다.",ROUTING:"담당 Agent를 배정하고 있습니다.",SUMMONING:"선택된 Agent가 회의실로 이동 중입니다.",MEETING_ROUND_1:"1차 검토 중 · 실제 의견을 기다리고 있습니다.",REVIEW_COMPLETE:"저장된 Agent 의견을 확인했습니다.",CROSS_REVIEW:"Agent들이 서로의 실제 의견을 검토하고 있습니다.",PREFLIGHT:"하니가 빠진 조건을 확인하고 있습니다.",NEED_USER_INFO:"대표님의 추가 답변을 기다리고 있습니다.",RESEARCH:"필요한 자료를 조사하고 있습니다.",MEETING_ROUND_2:"조사 결과를 반영해 2차 검토 중입니다.",SYNTHESIZING:"하니가 실제 검토 결과를 종합 중입니다.",READY:"결정 준비가 완료됐습니다.",HELD:"안건이 보류되었습니다. 같은 Case에서 이어갈 수 있습니다.",UNRESOLVED:"중요 이견이 남아 재검토가 필요합니다.",NEED_RESEARCH:"추가 자료 확인이 필요합니다.",ERROR:"진행 중 문제가 발생했습니다. 저장된 Case 상태를 확인해 주세요."};
  function stageText(){return stageLabels[liveStage]||"실제 검토 의견 보기"}
  function syncQuestions(freshDetail=false){
    if(!questionSlot)return;
    const detail=document.getElementById("agentCaseDetail"),source=detail?.querySelector(".agent-readiness-questions");
    if(!meeting||meetingBox.hidden){
      if(questionSlot.firstElementChild&&detail){const dock=detail.querySelector("#agentDecisionDock");detail.insertBefore(questionSlot.firstElementChild,dock||null)}
      questionSlot.hidden=true;return;
    }
    if(source&&source!==questionSlot.firstElementChild)questionSlot.replaceChildren(source);
    else if(!source&&freshDetail)questionSlot.replaceChildren();
    questionSlot.hidden=!questionSlot.firstElementChild;
  }
  function renderParticipants(){if(!participantBar)return;participantBar.hidden=!liveStage||!liveAgents?.length;if(participantBar.hidden)return;participantBar.replaceChildren();for(const key of liveAgents){const member=people.find(person=>person[0]===key),chip=document.createElement("span"),actualReview=caseData?.reviews?.some(review=>personKey(review.agent_key)===key);let state="대기";if(liveStage==="SUMMONING")state="이동 중";else if(key==="hani"&&liveStage==="SYNTHESIZING")state="종합 중";else if(key==="hani"&&liveStage==="READY"&&caseData?.case?.hani_final?.executive_summary)state="결론 정리됨";else if(key!=="hani"&&["MEETING_ROUND_1","MEETING_ROUND_2"].includes(liveStage))state="검토 중";else if(liveStage==="CROSS_REVIEW")state=key==="hani"?"쟁점 정리":"교차 검토 중";else if(actualReview)state="의견 저장됨";chip.textContent=`${member?.[1]||key} · ${state}`;participantBar.append(chip)}}
  function renderMeeting(){
    conversation.replaceChildren();const detail=caseData;if(!detail)return;renderParticipants();
    const c=detail.case||{},h=c.hani_final&&typeof c.hani_final==="object"?c.hani_final:{};
    document.getElementById("haniOfficeMeetingTitle").textContent=c.title||"선택한 안건";
    const reviews=Array.isArray(detail.reviews)?detail.reviews:[],round=Math.max(0,...reviews.map(r=>Number(r.review_round)||0));
    document.getElementById("haniOfficeMeetingMeta").textContent=`${c.case_code||"CASE"} · ${round?`${round}차 검토`+" · ":""}저장된 실제 의견만 표시`;
    const latest=reviews.filter(r=>(Number(r.review_round)||0)===round);
    if(liveStage){const status=document.createElement("div");status.className="hani-office-empty";status.setAttribute("role","status");status.textContent=stageText();conversation.append(status)}
    if(!latest.length){const empty=document.createElement("div");empty.className="hani-office-empty";empty.textContent=liveStage?"Agent 의견은 실제 검토가 완료되고 저장되면 표시됩니다.":"아직 저장된 Agent 검토 의견이 없습니다. 아래 안건 상태와 질문을 확인해 주세요.";conversation.append(empty)}
    latest.forEach(r=>{const key=personKey(r.agent_key),person=people.find(p=>p[0]===key),name=person?.[1]||String(r.agent_key||"Agent");textLine(`${name} · ${r.verdict||"검토"}`,r.summary||r.key_point||"검토 내용이 비어 있습니다.",person?.[0]||"hani")});
    const stored=Array.isArray(detail.events)?detail.events.filter(event=>event.event_type==="CROSS_REVIEW_COMPLETED"&&Number(event.payload?.review_round)===round).at(-1)?.payload:null;
    const cross=stored||((Number(liveCross?.review_round)===round)?liveCross:null);
    if(cross){const stanceLabels={AGREE:"동의",QUALIFY:"보완",DISAGREE:"반론",QUESTION:"질문"};for(const turn of Array.isArray(cross.turns)?cross.turns:[]){const key=personKey(turn.speaker),person=people.find(p=>p[0]===key);textLine(`${person?.[1]||turn.speaker} · ${stanceLabels[turn.stance]||"답변"}`,turn.content||"",key)}const issue=cross.hani_issue_summary||{},parts=[["합의",issue.agreement],["이견",issue.disagreement],["남은 조건",issue.missing_condition],["다음 판단",issue.next_decision]].filter(([,value])=>value);if(parts.length)textLine("하니 · 쟁점 정리",parts.map(([label,value])=>`${label}: ${value}`).join("\n"),"hani",true)}
    if(h.executive_summary&&(!liveStage||["READY","HELD","UNRESOLVED","NEED_RESEARCH","NEED_USER_INFO"].includes(liveStage)))textLine("하니 · 종합",h.executive_summary,"hani",true);
    else if(latest.length&&!liveStage){const empty=document.createElement("div");empty.className="hani-office-empty";empty.textContent="하니의 종합 결론은 아직 준비 중입니다. 결정 가능 여부는 아래 원본 검토서에서 확인하세요.";conversation.append(empty)}
  }
  function selectedAgents(){if(liveAgents?.length)return liveAgents;const reviews=Array.isArray(caseData?.reviews)?caseData.reviews:[],round=Math.max(0,...reviews.map(r=>Number(r.review_round)||0));const keys=["hani"];for(const r of reviews.filter(r=>(Number(r.review_round)||0)===round)){const key=personKey(r.agent_key),person=people.find(p=>p[0]===key||p[1]===key);if(person&&!keys.includes(person[0]))keys.push(person[0])}return keys.slice(0,6)}
  async function openMeeting(){if(!caseData||meeting)return;returnFloor=activeFloor;meeting=true;selectFloor("2f",true);openButton.disabled=true;caseState.textContent="회의실로 이동 중";const selected=selectedAgents();if(!await walk(selected)||!meeting||!caseData)return;meetingBox.hidden=false;returnButton.hidden=false;map.dataset.state="meeting";caseState.textContent=stageText();renderMeeting();syncQuestions();meetingBox.scrollIntoView({behavior:reduced?"instant":"smooth",block:"nearest"})}
  async function returnOffice(){if(!meeting)return;meetingBox.hidden=true;returnButton.hidden=true;syncQuestions();caseState.textContent="자리로 복귀 중";const selected=selectedAgents();await walk(selected,true);meeting=false;selectFloor(returnFloor,true);homeAll();map.dataset.state="idle";openButton.disabled=!caseData;caseState.textContent=caseData?"안건 선택됨 · 회의실 준비":"평상시 근무 중"}
  openButton.addEventListener("click",openMeeting);returnButton.addEventListener("click",returnOffice);
  document.getElementById("haniOfficeReportLink").addEventListener("click",()=>document.getElementById("agentCaseDetail")?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"}));
  window.haniOfficeLiveUpdate=detail=>{if(caseData?.case?.id!==detail?.case?.id){liveStage="";liveAgents=null;liveCross=null}caseData=detail?.case?detail:null;openButton.disabled=!caseData||meeting;caseState.textContent=caseData?stageText():"평상시 근무 중";if(meeting){if(caseData){renderMeeting();syncQuestions(true)}else void returnOffice()}};
  window.haniOfficeLiveStage=({stage,case:activeCase,selected_agents,reviews,cross_review}={})=>{if(activeCase){if(caseData?.case?.id!==activeCase.id){liveAgents=null;liveCross=null;caseData={case:activeCase,reviews:[]}}else caseData.case={...caseData.case,...activeCase}}if(Array.isArray(selected_agents)){liveAgents=["hani"];for(const member of selected_agents){const key=personKey(member?.agent_key);if(people.some(person=>person[0]===key)&&!liveAgents.includes(key))liveAgents.push(key)}liveAgents=liveAgents.slice(0,6)}if(Array.isArray(reviews)&&caseData)caseData.reviews=reviews;if(cross_review)liveCross=cross_review;if(stage)liveStage=stage;openButton.disabled=!caseData||meeting;caseState.textContent=stageText();if(stage==="SUMMONING"&&liveAgents?.length&&!meeting)void openMeeting();else if(meeting&&!meetingBox.hidden)renderMeeting()};
  if(typeof agentDetailCache!=="undefined"&&agentDetailCache?.case)window.haniOfficeLiveUpdate(agentDetailCache);
  // Only moving actors advance. Nodes and art probes are never recreated on a tick.
  setInterval(()=>{if(reduced||!sceneVisible())return;frame++;
    for(const actor of actors.values()){
      const travel=actor.officeTravel;if(actor.hidden||!travel)continue;
      travel.elapsed+=100;
      while(travel.index<travel.path.length-1){
        const a=travel.path[travel.index],b=travel.path[travel.index+1],duration=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)/building.canon.movement.speedPxPerSecond*1000);
        if(travel.elapsed<duration){const t=travel.elapsed/duration,va=building.visualPoint(a),vb=building.visualPoint(b);place(actor,[va[0]+(vb[0]-va[0])*t,va[1]+(vb[1]-va[1])*t]);pose(actor,frame%2?'walk-a':'walk-b');break}
        travel.elapsed-=duration;travel.index++;
      }
      if(travel.index===travel.path.length-1)finishTravel(actor);
    }
  },100);
  setInterval(changeOne,4200);
})();

})();
