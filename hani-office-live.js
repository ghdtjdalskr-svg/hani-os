/* V2 metadata is read-only; a failed metadata request keeps the production renderer. */
(async () => {
  let assets=globalThis.HaniOfficeV2Assets||null;
  if(!assets&&typeof fetch==='function'){
    try{
      // All office catalogs/art are seeded separately; use the existing metadata URL list.
      const [canon,sprites,art,spritesV3]=await Promise.all([
        './data/hani-building/spatial-contract.json','./assets/sprites-v2/manifest.json','./data/hani-building/art-map-v1.json','./assets/sprites-v3/manifest-v3.json'
      ].map(async (url,index)=>{
        try{const response=await fetch(url);if(!response.ok)throw Error('office metadata');return await response.json()}
        catch(error){if(index===3)return null;throw error}
      }));
      if(canon.contractVersion==='spatial-216-v1'&&canon.anchors.length===326&&art.contractVersion===canon.contractVersion&&canon.anchors.every(a=>art.anchors[a.id]))assets={canon,sprites,art,spritesV3:spritesV3?.scale===3&&Array.isArray(spritesV3.entries)?spritesV3:null};
    }catch(_){/* Production art and seats remain available without metadata. */}
  }
  function validActions(table,version){
    return table?.schemaVersion===version&&Array.isArray(table.actions)&&table.actions.length>=98&&table.actions.length<=300&&table.actions.some(a=>a.id==='base-work')&&Array.isArray(table.families)&&Array.isArray(table.people)&&table.rules?.hinaBalance&&table.actions.every(a=>Array.isArray(a.participants)&&Array.isArray(a.places)&&Array.isArray(a.conditions?.timeWindows)&&Array.isArray(a.conditions.triggerIds)&&a.performance);
  }
  let actionTable=validActions(globalThis.HaniOfficeActions221,'office-actions-221-v1')?globalThis.HaniOfficeActions221:validActions(globalThis.HaniOfficeActions216,'office-actions-216-v1')?globalThis.HaniOfficeActions216:null;
  if(!actionTable&&typeof fetch==='function'){
    try{const response=await fetch('./assets/data/office-actions-221.json');if(response.ok){const table=await response.json();if(validActions(table,'office-actions-221-v1'))actionTable=table}}catch(_){/* Try the released catalog next. */}
    if(!actionTable)try{const response=await fetch('./assets/data/office-actions-216.json');if(response.ok){const table=await response.json();if(validActions(table,'office-actions-216-v1'))actionTable=table}}catch(_){/* Read-only base-work fallback. */}
  }
  // Tap speech shares the scene clock (KST). Its catalog and cursors live in memory.
  function tapBucket(now=new Date()){
    const hour=new Date(now.getTime()+32400000).getUTCHours();
    return hour<7?'night':hour<11?'morning':hour<18?'day':'evening';
  }
  function validTapBank(bank,roster){
    if(bank?.schemaVersion!=='office-tap-lines-v1'||!bank.staff||bank.chairman?.id!=='seongmin')return false;
    const ids=new Set(roster.map(p=>p.id)),night=new Set(['seoyun','dohyun','mir','yuna','minji']);
    const line=s=>typeof s==='string'&&s.trim().length>0&&Array.from(s).length<=28;
    const list=(v,n)=>Array.isArray(v)&&v.length===n&&v.every(line);
    return Object.entries(bank.staff).length===roster.filter(p=>p.id!=='seongmin').length&&Object.entries(bank.staff).every(([id,row])=>
      ids.has(id)&&id!=='seongmin'&&row&&['morning','day','evening','toChairman'].every(k=>list(row[k],3))&&
      (night.has(id)?list(row.night,2):row.night===undefined)&&line(row.tripleTap)&&line(row.friend))&&
      Array.isArray(bank.chairman.staffReactions)&&bank.chairman.staffReactions.length===5&&bank.chairman.staffReactions.every(r=>r&&ids.has(r.staffId)&&r.staffId!=='seongmin'&&line(r.line));
  }
  function createTapLines(roster){
    let bank=null,request=null;const cursors=new Map();
    function load(){
      if(!request)request=(async()=>{try{
        if(typeof fetch!=='function')return;
        const response=await fetch('./assets/data/office-tap-lines-v1.json');
        if(response.ok){const data=await response.json();if(validTapBank(data,roster))bank=data}
      }catch(_){/* Keep the current status speech when the optional seed is absent. */}})();
      return request;
    }
    function tap(id,now=new Date()){
      if(!bank)return '';
      const bucket=tapBucket(now),time=now.getTime(),row=bank.staff[id];
      if(id!=='seongmin'&&!row?.[bucket])return '';
      let cursor=cursors.get(id);
      if(!cursor||cursor.bucket!==bucket||time-cursor.last>10000||time<cursor.last)cursor={bucket,last:time,count:0,turn:0,recent:[]};
      cursor.recent=cursor.recent.filter(t=>time-t<=2000);cursor.recent.push(time);cursor.last=time;
      const index=cursor.count++;cursors.set(id,cursor);
      if(id==='seongmin'){const reaction=bank.chairman.staffReactions[index%5];return {line:reaction.line,speaker:reaction.staffId}}
      if(cursor.recent.length>=3){cursor.recent=[];return {line:row.tripleTap,speaker:id}}
      // A stable one-in-five cadence avoids a second random scene scheduler.
      if(index>0&&index%5===4)return {line:row.friend,speaker:id};
      const turn=cursor.turn++;
      return {line:turn%2?row.toChairman[Math.floor(turn/2)%3]:row[bucket][Math.floor(turn/2)%row[bucket].length],speaker:id};
    }
    return Object.freeze({load,tap});
  }
/* Scene-only model: KST clock and rosters, never persisted. */
(() => {
  "use strict";
  const fallback="./assets/ai-approval-concepts/v3-office-background-empty-8-seats.webp";
  // Dynamic floor art is seeded on main separately from the runtime closure.
  const FLOOR_ART=Object.freeze({"1f":"./assets/building/floor-1f-217.webp","2f":"./assets/building/floor-2f-217.webp","3f":"./assets/building/floor-3f-215.webp","4f":"./assets/building/floor-4f-217.webp","5f":"./assets/building/floor-5f-217.webp"});
  const DESK_PROP_ART=Object.freeze({"hani":"./assets/building/props/hani-217.webp","yuna":"./assets/building/props/yuna-217.webp","jieun":"./assets/building/props/jieun-217.webp","haru":"./assets/building/props/haru-217.webp","naeun":"./assets/building/props/naeun-217.webp","hina":"./assets/building/props/hina-217.webp","minji":"./assets/building/props/minji-217.webp","sooyeon":"./assets/building/props/sooyeon-217.webp","sua":"./assets/building/props/sua-217.webp","seoyun":"./assets/building/props/seoyun-217.webp","dohyun":"./assets/building/props/dohyun-217.webp","serin":"./assets/building/props/serin-217.webp","yuri":"./assets/building/props/yuri-217.webp","arin":"./assets/building/props/arin-217.webp","gaeun":"./assets/building/props/gaeun-217.webp","taeo":"./assets/building/props/taeo-217.webp","daon":"./assets/building/props/daon-217.webp","yoonseul":"./assets/building/props/yoonseul-217.webp","mir":"./assets/building/props/mir-217.webp"});
  const legacyFloors=Object.freeze([
    {id:"4f",label:"4F 대표실·라운지",tint:"#b692df",residents:["hani","gaeun","mir"]},
    {id:"3f",label:"3F AI플랫폼개발실",tint:"#79aecf",residents:["seoyun","dohyun","serin","yuri","arin"]},
    {id:"2f",label:"2F 재무·라이프",tint:"#94bd8e",residents:["jieun","haru","naeun","hina","minji","sooyeon"]},
    {id:"1f",label:"1F 로비",tint:"#e3b67d",residents:["yuna","sua","taeo"]}
  ].map(f=>Object.freeze({...f,residents:Object.freeze(f.residents),background:FLOOR_ART[f.id],fallback})));

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
  // One canonical scheduler. Daily plans are projections, never queues to replay.
  // All mutable state is disposable memory; no life records or data triggers enter here.
  function createScheduler(table){
    const nightCatalog=table.schemaVersion==='office-actions-221-v1';
    const actions=new Map(table.actions.filter(a=>a.automaticReady&&(a.releaseTarget==='216'||nightCatalog&&a.releaseTarget==='221')&&!a.manualPreviewOnlyIn216&&!a.conditions.triggerIds.length).map(a=>[a.id,a]));
    const persons=table.people.filter(p=>p.registration==='registered'&&eligible.some(e=>e.id===p.id)||p.id==='seongmin');
    const defaults=actions.get('base-work'),cache=new Map(),paths=new Map();
    const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
    const seed=value=>{let n=2166136261;for(let i=0;i<value.length;i++){n^=value.charCodeAt(i);n=Math.imul(n,16777619)}return n>>>0};
    const unit=value=>seed(value)/4294967296;
    const overlap=(a,b)=>a.start<b.end&&b.start<a.end;
    function path(from,to){const key=from+'|'+to;if(!paths.has(key))paths.set(key,route(from,to));return paths.get(key)}
    function slot(id,pose='sit'){
      const a=anchors.get(id),p=art?.anchors[id];if(!a||!p||a.runtimeAssignable===false||a.type==='core')return null;
      return {...(a.rendererSeat||{id:a.id,zone:'lounge'}),...p,anchor:id,posture:pose==='sit'?'sitting':'standing'};
    }
    const lateWorkers=new Set(['seoyun','dohyun','mir','yuna','minji']);
    const isLate=seconds=>seconds>=3600&&seconds<7*3600;
    const isEvening=seconds=>seconds>=18*3600||seconds<3600;
    const presentAt=(id,seconds)=>!isLate(seconds)||lateWorkers.has(id)||id==='seongmin';
    function homeAt(person,seconds){
      if(nightCatalog&&(isLate(seconds)||isEvening(seconds))&&['yuna','minji'].includes(person.id))return {floor:'1f',anchorId:person.id==='yuna'?'lobby-nw':'lobby-ne'};
      return person.home;
    }
    function targets(action,subject,day,seconds=9*3600){
      const ids=subject?[subject]:action.participants;
      return ids.map(id=>{
        const person=persons.find(p=>p.id===id);if(!person||!action.participants.includes(id))return null;
        if(id==='seongmin'&&action.id==='base-arrive-leave')return null; // Human presence owns arrival/departure.
        let place=action.places.find(p=>p.personId===id);
        if(!place&&action.participantSelector!=='explicit'&&action.places.length===action.participants.length)place=action.places[action.participants.indexOf(id)];
        if(!place){let places=action.places.filter(p=>!p.personId);
          if(action.id==='base-walk')places=places.filter(p=>p.floor===homeAt(person,seconds).floor);
          place=places[seed(day+'|'+action.id+'|'+id+'|place')%places.length];
        }
        const home=homeAt(person,seconds);
        if(action.targetResolution==='presence_home'||nightCatalog&&home!==person.home&&place?.anchorId===person.home.anchorId)place={anchorId:home.anchorId};
        // MIR's generic props are virtual; generic human movement stays at Station.
        if(id==='mir'&&action.layer===1)place={anchorId:person.home.anchorId};
        const pose=id==='mir'?'stand':action.poseByPerson?.[id]||action.actorOverrides?.[id]?.pose||action.performance.pose;
        const seat=place&&slot(place.anchorId,pose),anchor=seat&&anchors.get(seat.anchor);
        const owner=anchor?.rendererSeat?.owner;
        if(!seat||owner&&owner!==(id==='seongmin'?'chairman':id)||anchor.occupant&&anchor.occupant!==id)return null;
        const outbound=path(home.anchorId,seat.anchor),inbound=path(seat.anchor,home.anchorId);
        if(!outbound.length||!inbound.length)return null;
        return {id,home,seat,outbound,inbound};
      });
    }
    function windows(action,weekday){
      const c=action.conditions;if(c.days==='평일'&&!weekday||c.days==='주말'&&weekday)return [];
      // Wrapped ranges use the matching KST calendar day: [22,24) + [0,02).
      const ranges=(!weekday&&c.weekendTimeWindows||c.timeWindows).flatMap(([a,b])=>{const start=minute(a)*60,end=minute(b)*60;return start<end?[[start,end]]:start>end?[[0,end],[start,86400]]:[]}).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
      return ranges.reduce((merged,range)=>{const last=merged.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);return merged},[]);
    }
    function opportunitiesFor(day,allowed,includeCadence=true){
      const present=new Set(allowed.map(p=>p.id)),weekday=![0,6].includes(new Date(day+'T00:00:00Z').getUTCDay()),opportunities=[];
      for(const family of table.families){
        const parent=family.parent;if(parent.conditions.triggerIds.length||parent.manualPreviewOnlyIn216)continue;
        const group=family.limits.scope==='scene',subjects=group?[null]:parent.participants.filter(id=>present.has(id));
        if(family.limits.cadenceSeconds){
          if(!includeCadence)continue;
          // Floor microexpressions share the canonical opportunity/reservation path.
          // One opportunity per floor regardless of roster size; no render catch-up.
          const cadence=weekday?family.limits.cadenceSeconds:family.limits.weekendCadenceSeconds,base=day+'|'+family.id;
          let n=0;
          for(const [a,b] of windows(parent,weekday))for(let tick=a;tick<b;tick+=cadence){
            const index=n++,start=tick+unit(base+'|'+index)*3,candidates=[];
            for(const id of family.memberActionIds){const action=actions.get(id);if(!action)continue;
              for(const subject of action.participants){const person=allowed.find(p=>p.id===subject);if(person&&presentAt(subject,start)&&homeAt(person,start).floor===family.limits.floor)candidates.push({subject,action})}
            }
            if(candidates.length){const offset=seed(base+'|variant|'+index)%candidates.length;opportunities.push({family,parent,...candidates[offset],candidates:[...candidates.slice(offset),...candidates.slice(0,offset)],start,base,n:index,group:false,windowEnd:b})}
          }
          continue;
        }
        for(const subject of subjects){
          const base=day+'|'+family.sourceActionId+(subject?'|'+subject:'');
          // One daily family gate, not one gate per variant or render tick.
          if(unit(base)>=family.limits.probabilityPerDay*(weekday?1:table.rules.weekendFrequencyScale??1))continue;
          const ranges=windows(parent,weekday);if(!ranges.length)continue;
          for(let n=0;n<family.limits.maxPerDay;n++){
            const timeSeed=family.limits.cooldownSeconds>=86400?family.id+'|'+subject:base;
            let range=ranges[n%ranges.length];
            if(nightCatalog){let pick=unit(base+'|window|'+n)*ranges.reduce((sum,[a,b])=>sum+b-a,0);range=ranges.find(([a,b])=>(pick-=b-a)<0)||ranges.at(-1)}
            const start=range[0]+Math.floor(unit(timeSeed+'|time|'+n)*(range[1]-range[0]));
            const id=family.memberActionIds[seed(base+'|variant|'+n)%family.memberActionIds.length],action=actions.get(id);
            if(action)opportunities.push({family,parent,subject,action,start,base,n,group,windowEnd:range[1]});
          }
        }
      }
      return opportunities;
    }
    function plan(day,{chairmanPresent=false,presentIds=null}={}){
      const allowed=persons.filter(p=>(p.id!=='seongmin'||chairmanPresent)&&(!presentIds||presentIds.includes(p.id))),present=new Set(allowed.map(p=>p.id));
      const key=day+'|'+[...present].sort().join(','),old=cache.get(key);if(old)return old;
      const weekday=![0,6].includes(new Date(day+'T00:00:00Z').getUTCDay()),events=[],opportunities=opportunitiesFor(day,allowed);
      opportunities.sort((a,b)=>a.start-b.start||b.action.layer-a.action.layer||a.base.localeCompare(b.base));
      const lastNonWork=new Map(),lastMove=new Map(),counts=new Map(),lastFamily=new Map();let groups=0,teacherCompletedAt=[];
      if(nightCatalog){
        // Conservative previous-day envelope keeps cooldowns across midnight without
        // replay, persistence, recursive plans, or dependence on which day was viewed.
        // A rejected prior opportunity can only reduce early-day exposure, never add it.
        const previousDay=new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
        for(const o of opportunitiesFor(previousDay,allowed,false)){
          const chosen=targets(o.action,o.subject,previousDay,o.start);if(!chosen.length||chosen.some(t=>!t))continue;
          const travel=chosen.reduce((sum,t)=>sum+[t.outbound,t.inbound].reduce((total,path)=>total+path.slice(1).reduce((seconds,to,i)=>{const from=path[i];return seconds+Math.max(.1,from.floor===to.floor?Math.hypot(to.x-from.x,to.y-from.y)/canon.movement.speedPxPerSecond:1.6)},0),0),0);
          const end=o.start+o.family.durationCeilingSeconds+travel-86400,counter=o.family.id+'|'+(o.subject||'scene');
          lastFamily.set(counter,Math.max(lastFamily.get(counter)??-Infinity,o.start-86400));
          for(const t of chosen){
            if(o.action.personalNonWork)lastNonWork.set(t.id,Math.max(lastNonWork.get(t.id)??-Infinity,end));
            if(anchors.get(t.seat.anchor).floor!==t.home.floor)lastMove.set(t.id,Math.max(lastMove.get(t.id)??-Infinity,end));
          }
        }
      }
      function available(targets,start,end,signature=false,group=false){
        if(!targets.length||targets.some(t=>!t||!present.has(t.id)||!presentAt(t.id,start)||!presentAt(t.id,end-.001)))return false;
        if(nightCatalog){
          // Reject excursions spanning a departure or a lounge/home switch.
          if(targets.some(t=>homeAt(persons.find(p=>p.id===t.id),start).anchorId!==homeAt(persons.find(p=>p.id===t.id),end-.001).anchorId))return false;
          if(targets.some(t=>persons.some(p=>present.has(p.id)&&presentAt(p.id,start)&&p.id!==t.id&&homeAt(p,start)!==p.home&&homeAt(p,start).anchorId===t.seat.anchor&&!targets.some(q=>q.id===p.id))))return false;
        }
        const ids=new Set(targets.map(t=>t.id)),spots=targets.map(t=>t.seat.anchor);
        if(new Set(spots).size!==spots.length)return false;
        const resources=new Set(targets.flatMap(t=>[...t.outbound,...t.inbound].map(a=>a.id)));
        return !events.some(e=>overlap(e,{start,end})&&(e.people.some(t=>ids.has(t.id))||e.resources.some(id=>resources.has(id))||signature&&e.layer===2&&e.floors.some(f=>targets.some(t=>anchors.get(t.seat.anchor).floor===f))||group&&e.layer===3&&e.floors.some(f=>targets.some(t=>anchors.get(t.seat.anchor).floor===f))));
      }
      for(const o of opportunities){
        if(o.candidates){
          const chosen=o.candidates.find(c=>available(targets(c.action,c.subject,day,o.start),o.start,o.start+o.family.durationCeilingSeconds));
          if(!chosen)continue;Object.assign(o,chosen);
        }
        const {family,parent,subject,action,start,group}=o,counter=family.id+'|'+(family.limits.cadenceSeconds?'floor':subject||'scene');
        if((counts.get(counter)||0)>=family.limits.maxPerDay||start-(lastFamily.get(counter)??-Infinity)<family.limits.cooldownSeconds||group&&groups>=table.rules.groupGlobalDailyMax)continue;
        const actionWindow=windows(action,weekday).find(([a,b])=>start>=a&&start<b);if(!actionWindow)continue;
        const parentTargets=targets(parent,subject,day,start),chosen=targets(action,subject,day,start);
        if(!available(parentTargets,start,start+family.durationCeilingSeconds,parent.layer===2,group)||!chosen.length||chosen.some(t=>!t))continue;
        const changed=chosen.filter(t=>anchors.get(t.seat.anchor).floor!==t.home.floor);
        if(changed.some(t=>start-(lastMove.get(t.id)??-Infinity)<table.rules.floorChanging.initialMinIntervalSeconds))continue;
        if(action.personalNonWork&&chosen.some(t=>start-(lastNonWork.get(t.id)??-Infinity)<table.rules.personalNonWork.initialMinIntervalSeconds))continue;
        const duration=Math.min(family.durationCeilingSeconds,action.durationSeconds[0]+Math.floor(unit(o.base+'|duration|'+o.n)*(action.durationSeconds[1]-action.durationSeconds[0]+1)));
        // One route at a time inside a group; reserve the whole excursion atomically.
        // This conservative FIFO also keeps shared doors/elevators below capacity.
        let cursor=start;const people=chosen.map(t=>({...t}));
        function travel(t,p,phase){
          const legs=[];for(let i=1;i<p.length;i++){
            const from=p[i-1],to=p[i],seconds=Math.max(.1,from.floor===to.floor?Math.hypot(to.x-from.x,to.y-from.y)/canon.movement.speedPxPerSecond:1.6);
            legs.push({from:from.id,to:to.id,start:cursor,end:cursor+seconds});cursor+=seconds;
          }t[phase]=legs;
        }
        for(const t of people)travel(t,t.outbound,'out');
        const performStart=cursor,performEnd=cursor+duration;cursor=performEnd;
        for(const t of people)travel(t,t.inbound,'back');
        const end=cursor;
        if(end>Math.min(o.windowEnd,actionWindow[1])||!available(people,start,end,action.layer===2,group))continue;
        const selfies=table.rules.hinaBalance.selfieActionIds.includes(action.id);
        if(selfies&&teacherCompletedAt.filter(t=>t<=start).length<=events.filter(e=>table.rules.hinaBalance.selfieActionIds.includes(e.actionId)).length)continue;
        const resources=[...new Set(people.flatMap(t=>[...t.outbound,...t.inbound].map(a=>a.id)))];
        events.push({id:o.base+'|'+o.n,actionId:action.id,familyId:family.id,layer:action.layer,start,end,performStart,performEnd,duration,personalNonWork:action.personalNonWork,people,resources,floors:[...new Set(people.map(t=>anchors.get(t.seat.anchor).floor))]});
        counts.set(counter,(counts.get(counter)||0)+1);lastFamily.set(counter,start);
        if(group)groups++;
        if(table.rules.hinaBalance.teacherActionIds.includes(action.id))teacherCompletedAt.push(performEnd);
        if(action.personalNonWork)for(const t of people)lastNonWork.set(t.id,end);
        if(changed.length)for(const t of changed)lastMove.set(t.id,end);
      }
      if(cache.size>=4)cache.delete(cache.keys().next().value);cache.set(key,events);return events;
    }
    // Idle liveliness: each floor rotates its people through short visible bits (a playful or
    // time-of-day line, sometimes standing, sometimes a stroll to another room through its door).
    // Each person gets at most one bit per cycle; everyone else is plain base work (dot only).
    // Pure function of the local clock; scheduled events always win.
    const BEAT=2.4,ACTIVE_BEATS=4,MIN_CYCLE=12,STROLL_STAY=8,STROLL_MAX=30,STROLL_TYPES=new Set(['seat','interaction','group','object']);
    const idlePools={
      day:[['키보드 두드리는 중'],['보고서 다듬는 중'],['메일함 정리 중'],['몰래 인스타 순찰 중'],['간식 서랍 점검 중'],['고양이 영상 1분만…'],['기지개 켜는 중','stand'],['옆자리랑 수다 중'],['커피 리필 고민 중','stand'],['창밖 멍때리는 중'],['스트레칭 중','stand'],['화이트보드에 낙서 중','stand']],
      evening:[['가방 챙기는 중','stand'],['오늘 할 일 체크 중'],['저녁 메뉴 검색 중'],['간식 서랍 점검 중'],['몰래 인스타 순찰 중'],['퇴근길 날씨 확인 중'],['옆자리랑 수다 중'],['고양이 영상 1분만…'],['기지개 켜는 중','stand'],['퇴근 시간 카운트다운 중'],['스트레칭 중','stand']],
      late:[['야식 고민 중'],['커피 한 잔 더…','stand'],['졸음 참는 중'],['코드 한 줄만 더'],['몰래 인스타 순찰 중'],['기지개 켜는 중','stand'],['플레이리스트 고르는 중'],['간식 서랍 점검 중']],
      lounge:[['라운지에서 간식 나누는 중'],['소파에서 수다 중'],['라운지에서 몰래 인스타 순찰 중'],['야식 메뉴 투표 중'],['라운지에서 야근 이야기 중']],
      loungeLate:[['라운지에서 야식 고민 중'],['소파에서 꾸벅꾸벅'],['라운지에서 조용히 수다 중'],['라운지에서 별 보는 중']],
      stroll:['창밖 구경 중','화분 구경 중','동료 자리 기웃기웃','잠깐 바람 쐬는 중','간식 찾으러 왔다가 두리번','커피 내리러 왔어요']
    };
    function idleRoster(day,floor,seconds){return persons.filter(p=>p.id!=='mir'&&p.id!=='seongmin'&&presentAt(p.id,seconds)&&homeAt(p,seconds).floor===floor).map(p=>p.id).sort()}
    const pickCache=new Map();
    function beatPick(day,floor,k){const key=day+'|'+floor+'|'+k;if(pickCache.has(key))return pickCache.get(key);if(pickCache.size>4000)pickCache.delete(pickCache.keys().next().value);const pick=rotationPick(day,floor,k);pickCache.set(key,pick);return pick}
    function rotationPick(day,floor,k){const roster=idleRoster(day,floor,k*BEAT);if(!roster.length)return null;
      // People sit evenly spaced in the cycle, so quiet gaps are short and nobody repeats early.
      const order=[...roster].sort((a,b)=>seed(day+'|cycle|'+floor+'|'+a)-seed(day+'|cycle|'+floor+'|'+b)),len=Math.max(MIN_CYCLE,order.length),pos=((k%len)+len)%len;
      return order.find((_,i)=>Math.floor(i*len/order.length)===pos)??null;
    }
    const strollStart=(day,floor,j)=>beatPick(day,floor,j)!==null&&seed(day+'|stroll|'+floor+'|'+j)%3===0;
    // Consecutive beats walk a per-floor shuffled pool, so concurrent bits never repeat a line.
    function poolLine(day,floor,kind,pool,j){const order=pool.map((_,i)=>i).sort((a,b)=>seed(day+floor+kind+a)-seed(day+floor+kind+b));return pool[order[((j%pool.length)+pool.length)%pool.length]]}
    function idleFlavour(day,id,floor,seconds,lounge,late,events=[]){
      const k=Math.floor(seconds/BEAT);
      for(let j=k;j>k-ACTIVE_BEATS;j--)if(beatPick(day,floor,j)===id){
        // A bit never runs into, or straight out of, the person's scheduled action.
        const from=j*BEAT,to=from+ACTIVE_BEATS*BEAT;if(events.some(e=>e.people.some(t=>t.id===id)&&e.start<to+2&&from<e.end+5))return null;
        const kind=lounge?late?'loungeLate':'lounge':late?'late':isEvening(seconds)?'evening':'day',[line,pose]=poolLine(day,floor,kind,idlePools[kind],j+Math.floor(j/MIN_CYCLE)*5);
        return {beat:j,line,pose};
      }
      return null;
    }
    const strollTargets=new Map();
    function strollPlan(id,home){
      const key=id+'|'+home.anchorId;if(strollTargets.has(key))return strollTargets.get(key);
      const legs=p=>{const out=[];let at=0;for(let i=1;i<p.length;i++){const from=p[i-1],to=p[i],s=Math.hypot(to.x-from.x,to.y-from.y)/canon.movement.speedPxPerSecond;out.push({from:from.id,to:to.id,start:at,end:at+Math.max(.1,s)});at+=Math.max(.1,s)}return out};
      const list=[];
      for(const a of anchors.values()){
        if(a.id===home.anchorId||a.floor!==home.floor||!STROLL_TYPES.has(a.type)||a.room===anchors.get(home.anchorId)?.room||!slot(a.id,'stand')||a.rendererSeat?.owner&&a.rendererSeat.owner!==id||a.occupant&&a.occupant!==id)continue;
        const out=path(home.anchorId,a.id),back=path(a.id,home.anchorId);
        // Strolls visit another room through its door, never a corridor point.
        if(out.length<2||back.length<2||[...out,...back].some(n=>n.floor!==home.floor)||!out.some(n=>n.type==='door'))continue;
        const o=legs(out),b=legs(back),total=o.at(-1).end+STROLL_STAY+b.at(-1).end;
        if(total<=STROLL_MAX)list.push({target:a.id,out:o,back:b,total,resources:[...new Set([...out,...back].map(n=>n.id))]});
      }
      strollTargets.set(key,list);return list;
    }
    function idleStroll(day,id,floor,seconds,home,events){
      const k=Math.floor(seconds/BEAT);
      for(let j=k;j>=k-Math.ceil(STROLL_MAX/BEAT);j--){
        if(beatPick(day,floor,j)!==id||!strollStart(day,floor,j))continue;
        // One stroller per floor at a time, so doors and corridors never crowd.
        let busy=false;for(let i=j-1;i>=j-Math.ceil(STROLL_MAX/BEAT);i--)if(strollStart(day,floor,i)){busy=true;break}if(busy)continue;
        const options=strollPlan(id,home);if(!options.length)return null;
        const t0=j*BEAT,s=options[seed(day+'|'+id+'|stroll|'+j)%options.length],local=seconds-t0;if(local>=s.total)continue;
        if(events.some(e=>e.start<t0+s.total&&t0<e.end&&(e.people.some(t=>t.id===id)||e.resources.some(r=>s.resources.includes(r)))))return null;
        const backStart=s.total-s.back.at(-1).end,leg=local<backStart?s.out.find(l=>l.start<=local&&local<l.end):s.back.map(l=>({...l,start:l.start+backStart,end:l.end+backStart})).find(l=>l.start<=local&&local<l.end);
        const spotLine=poolLine(day,floor,'stroll',idlePools.stroll,j);
        if(!leg)return {seat:slot(s.target,'stand'),walking:false,position:null,line:spotLine};
        const a=anchors.get(leg.from),b=anchors.get(leg.to),progress=(local-leg.start)/(leg.end-leg.start),pa=visualPoint(a),pb=visualPoint(b);
        return {seat:slot(a.id,'stand'),walking:true,position:[pa[0]+(pb[0]-pa[0])*progress,pa[1]+(pb[1]-pa[1])*progress],line:local<backStart?'잠깐 자리 비움 · '+spotLine:'자리로 돌아가는 중'};
      }
      return null;
    }
    function speech(action,id,day){const override=action.actorOverrides?.[id],p=action.performance;
      const line=override?.speech||(Array.isArray(p.speech)?p.speech.find(s=>s.personId===id)?.line:p.speech)||action.title;
      return p.speechVariants?.length?p.speechVariants[seed(day+'|'+id+'|'+action.id+'|line')%p.speechVariants.length]:line;
    }
    function snapshot(now,options={}){
      const kst=new Date(new Date(now).getTime()+32400000),day=kst.toISOString().slice(0,10),seconds=kst.getUTCHours()*3600+kst.getUTCMinutes()*60+kst.getUTCSeconds()+kst.getUTCMilliseconds()/1000;
      const events=plan(day,options),cancelled=options.cancelled||new Set(),blocked=new Set(options.summoned||[]);
      // Presence is a base scene state on every day, independent of weekday action windows.
      // Reuse base-work when idle; disabled rows stay disabled.
      const late=isLate(seconds),evening=isEvening(seconds);
      const presenceNote=late?'심야에도 함께해요 · 개발실과 라운지에 직원들이 남아 있어요':'';
      const completedTeachers=events.filter(e=>e.performEnd<=seconds&&!cancelled.has(e.id)&&table.rules.hinaBalance.teacherActionIds.includes(e.actionId)).length;
      const selfiesBefore=events.filter(e=>e.start<seconds&&!cancelled.has(e.id)&&table.rules.hinaBalance.selfieActionIds.includes(e.actionId));
      const liveEvents=events.filter(e=>!cancelled.has(e.id));
      const active=events.filter(e=>e.start<=seconds&&seconds<e.end&&!cancelled.has(e.id)&&!e.people.some(p=>blocked.has(p.id))&&(!table.rules.hinaBalance.selfieActionIds.includes(e.actionId)||completedTeachers>=selfiesBefore.length));
      const entries=persons.filter(p=>(p.id!=='seongmin'||options.chairmanPresent)&&(!options.presentIds||options.presentIds.includes(p.id))&&!blocked.has(p.id)).flatMap(p=>{
        const event=active.find(e=>e.people.some(t=>t.id===p.id)),t=event?.people.find(t=>t.id===p.id);
        if(late&&!lateWorkers.has(p.id)&&p.id!=='seongmin')return [];
        const action=actions.get(event?.actionId)||defaults;if(!action)return [];
        const home=homeAt(p,seconds);
        let seat=slot(home.anchorId,p.id==='mir'?'stand':'sit'),position=null,walking=false,floor=home.floor,strolling=false;
        if(t){
          const leg=options.reducedMotion?null:[...t.out,...t.back].find(l=>l.start<=seconds&&seconds<l.end);
          const atTarget=options.reducedMotion||seconds>= (t.out.at(-1)?.end??event.start)&&seconds<(t.back[0]?.start??event.end);
          if(atTarget){seat=t.seat;floor=anchors.get(seat.anchor).floor}
          if(leg){const a=anchors.get(leg.from),b=anchors.get(leg.to),progress=(seconds-leg.start)/(leg.end-leg.start),pa=visualPoint(a),pb=visualPoint(b);floor=a.floor;seat=slot(a.id,'stand');walking=true;position=a.floor===b.floor?[pa[0]+(pb[0]-pa[0])*progress,pa[1]+(pb[1]-pa[1])*progress]:pa;}
        }
        const performing=event&&(options.reducedMotion||seconds>=event.performStart&&seconds<event.performEnd);
        let idleLine=p.id==='mir'||p.id==='seongmin'?speech(defaults,p.id,day):(late||evening&&lateWorkers.has(p.id))?'야근 중':evening?'퇴근 준비 중':speech(defaults,p.id,day),plain=!event;
        if(!event&&p.id!=='mir'&&p.id!=='seongmin'){
          const lounge=home!==p.home||(late||evening)&&['yuna','minji'].includes(p.id),stroll=!options.reducedMotion&&!lounge&&idleStroll(day,p.id,home.floor,seconds,home,liveEvents);
          if(stroll){seat=stroll.seat;walking=stroll.walking;position=stroll.position;idleLine=stroll.line;strolling=true;plain=false}
          else{const flavour=idleFlavour(day,p.id,home.floor,seconds,lounge,late||evening&&lateWorkers.has(p.id),liveEvents);
            if(flavour){idleLine=flavour.line;plain=false;if(flavour.pose&&!options.reducedMotion&&p.id!=='mir')seat=slot(home.anchorId,'stand')||seat}}
        }
        return [{id:p.id,idle:!event,plain,stroll:strolling,home:p.home.floor,floor,seat,position,walking,pose:walking?(Math.floor(seconds*5)%2?'walk-a':'walk-b'):seat.posture,activity:event?(action.personalNonWork?'rest':action.layer===3?'meeting':'work'):'work',actionId:performing?action.id:'base-work',eventId:event?.id,line:performing?speech(action,p.id,day):event?'이동 중':idleLine,emoji:performing?(action.actorOverrides?.[p.id]?.emoji||action.performance.emoji):'',personalNonWork:action.personalNonWork}];
      });
      // Lounge residents are persistent presence, not newly scheduled actions.
      // Existing events own their seats first; their frequency/cooldown budgets stay unchanged.
      if(late||evening){
        const occupied=new Set(entries.map(p=>p.seat.anchor));
        for(const id of ['yuna','minji']){
          const p=entries.find(p=>p.id===id);if(!p||p.eventId)continue;
          const home=homeAt(persons.find(person=>person.id===id),seconds);
          const anchor=nightCatalog?home.anchorId:['lobby-nw','lobby-ne','lobby-sw','lobby-se'].find(a=>!occupied.has(a));
          const seat=anchor&&slot(anchor);if(!seat)continue;
          occupied.delete(p.seat.anchor);occupied.add(anchor);
          const flavour=idleFlavour(day,id,home.floor,seconds,true,late,liveEvents);
          Object.assign(p,{floor:anchors.get(anchor).floor,seat,pose:seat.posture,walking:false,position:null,stroll:false,plain:!flavour,activity:'rest',line:flavour?.line||(late?'라운지에서 조용히 쉬는 중':'라운지에서 야근 이야기 중')});
        }
      }
      // A stroll never takes a spot someone else is shown on; the stroller simply stays home.
      const spot=p=>p.floor+'|'+(p.position||[p.seat.x,p.seat.y]).map(x=>Math.round(x*1000)).join(',');
      for(const p of entries)if(p.stroll&&entries.some(q=>q!==p&&(q.seat.anchor===p.seat.anchor||spot(q)===spot(p)))){
        const seat=slot(homeAt(persons.find(person=>person.id===p.id),seconds).anchorId,'sit');
        Object.assign(p,{seat,pose:seat.posture,walking:false,position:null,stroll:false,plain:true,line:late||evening&&lateWorkers.has(p.id)?'야근 중':evening?'퇴근 준비 중':speech(defaults,p.id,day)});
      }
      return {day,minutes:seconds/60,seconds,entries,events:active,presenceNote};
    }
    return Object.freeze({plan,snapshot,seed,slot,actions,windows,presentAt,identity:table.identity});
  }
  const scheduler=canon&&actionTable?createScheduler(actionTable):null;
  function snapshot(now=new Date(),options={}){
    const scheduled=scheduler?.snapshot(now,options),date=new Date(new Date(now).getTime()+32400000),day=date.toISOString().slice(0,10),minutes=date.getUTCHours()*60+date.getUTCMinutes();
    const entries=scheduled?.entries||floors.flatMap(f=>f.residents.map(id=>({id,home:f.id,floor:f.id,activity:'work',seat:homeSeat(id),actionId:'base-work',line:'자료 확인 중'})));
    return {day,minutes,...scheduled,onBreak:false,onMeeting:false,floors:floors.map(f=>{const people=entries.filter(p=>p.floor===f.id);return {...f,people,work:people.filter(p=>p.activity!=='rest').length,rest:people.filter(p=>p.activity==='rest').length,...projection(people)}})};
  }

  function profile(id){return ({daon:"./assets/profiles/thumb/hani-profile-daon-v2-256.webp",yoonseul:"./assets/profiles/thumb/hani-profile-yoonseul-v2-256.webp",sua:"./assets/profiles/thumb/hani-profile-sua-id-256.webp"})[id]||`./assets/profiles/thumb/hani-profile-${id}-256.webp`}
  // Both densities share proportional atlas/cell/pivot coordinates and one loader.
  function spriteSource(id,entry){return entry.scale===3?'./assets/sprites-v3/'+entry.file:({daon:"./assets/sprites-v2/daon-v2.webp",yoonseul:"./assets/sprites-v2/yoonseul-v2.webp"})[id]||'./assets/sprites-v2/'+entry.file}
  globalThis.HaniBuildingScene=Object.freeze({floors,snapshot,projection,profile,spriteSource,seatMaps,deskSurfaces,homeSeat,assignSeats,actionPool,bubble,canon,art,visualPoint,anchors,route,deskPropArt:DESK_PROP_ART,legacySeatMaps,legacySurfaces,scheduler,createScheduler,tapLines:Object.freeze({bucket:tapBucket,validate:validTapBank,create:createTapLines})});
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
  motion.addEventListener?.('change',event=>{reduced=event.matches;if(reduced)for(const actor of actors.values())finishTravel(actor);if(sceneVisible())updateBuilding(true,false)});
  const spriteEntries=new Map((assets?.sprites.entries||[]).map(e=>[e.id,e])),spriteCache=new Map();
  const hdEntries=new Map((assets?.spritesV3?.entries||[]).filter(e=>e.scale===3&&e.frames?.length===4&&e.cell?.length===2&&e.atlas?.length===2).map(e=>[e.id,e]));
  const visualIdentity=HaniBuildingScene.scheduler?.identity||{seongmin:{entity:'human_user',role:'chairman',officeVisual:'ceo_frog',spriteId:'seongmin'}};
  function spriteId(actor){return visualIdentity[actor.dataset.person]?.spriteId||actor.dataset.person}
  function pose(actor,name){
    const sprite=actor.querySelector('.hani-office-sprite'),entry=spriteEntries.get(spriteId(actor));
    actor.dataset.pose=name;
    if(actor.dataset.avatar!=='v2'||!entry)return;
    const f=entry.frames.find(f=>f.name===name)||entry.frames[0];
    sprite.style.backgroundPosition=(f.rect[0]/(entry.atlas[0]-entry.cell[0])*100)+'% '+(f.rect[1]/(entry.atlas[1]-entry.cell[1])*100)+'%';
    actor.style.transform='translate(-'+(f.pivot[0]/entry.cell[0]*100)+'%,-'+(f.pivot[1]/entry.cell[1]*100)+'%)';
  }
  function loadSprite(actor,onLoad){
    const id=spriteId(actor),entry=spriteEntries.get(id),sprite=actor.querySelector('.hani-office-sprite');if(!entry)return;
    if(!spriteCache.has(id))spriteCache.set(id,(async()=>{
      for(const candidate of [hdEntries.get(id),entry].filter(Boolean)){
        const ok=await new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=HaniBuildingScene.spriteSource(id,candidate)});
        if(ok)return candidate;
      }
      return null;
    })());
    spriteCache.get(id).then(loaded=>{if(!loaded)return;spriteEntries.set(id,loaded);actor.dataset.avatar='v2';actor.dataset.spriteScale=String(loaded.scale||1);actor.style.setProperty('--sprite-ratio',String(loaded.cell[0]/loaded.cell[1]));sprite.className='hani-office-sprite';sprite.style.backgroundImage='url("'+HaniBuildingScene.spriteSource(id,loaded)+'")';sprite.style.backgroundSize=(loaded.atlas[0]/loaded.cell[0]*100)+'% '+(loaded.atlas[1]/loaded.cell[1]*100)+'%';pose(actor,actor.dataset.pose||'sitting');onLoad?.()});
  }
  function finishTravel(actor){if(!actor.officeTravel)return;const {seat}=actor.officeTravel;actor.officeTravel=null;actor.officeAnchor=seat.anchor||seat.id;place(actor,[seat.x,seat.y]);pose(actor,seat.posture||'sitting')}
  function place(actor,position){actor.style.left=position[0]+"%";actor.style.top=position[1]+"%"}
  function activityStatus(actor,full){return actor.officeTravel||actor.dataset.walking==='true'||full==='이동 중'?'moving':actor.dataset.called==='true'||actor.dataset.activity==='meeting'?'meeting':actor.dataset.activity==='rest'?'rest':/야근/.test(full)?'night':'work'}
  const statusNames={work:'근무 중',rest:'휴식 중',meeting:'회의 중',moving:'이동 중',night:'야근 중'};
  function statusDot(actor){const dot=actor.querySelector('.hani-office-status-dot'),full=actor.querySelector('.hani-office-status').dataset.full||'';actor.dataset.status=activityStatus(actor,full);dot.title=statusNames[actor.dataset.status];dot.setAttribute('aria-label',dot.title);actor.setAttribute('aria-label',`${actor.dataset.name}: ${dot.title} · ${full}`)}
  function label(actor,value,mood=false){
    const status=actor.querySelector('.hani-office-status'),icon=actor.querySelector('.hani-office-activity-icon');
    status.textContent=value;status.dataset.full=value;status.title=value;actor.dataset.mood=String(mood);statusDot(actor);
    icon.textContent=actor.dataset.emoji||'';icon.hidden=!icon.textContent;icon.title=value;
    if(actor.officeText)actor.officeText.textContent=value;
  }
  // One name slot per actor. Lay out tags first, then reserve their boxes before
  // placing desktop pills in priority order. Only labels move, never seat anchors.
  function fitStatusLabels(){
    const floor=map.getBoundingClientRect?.();if(!floor?.width)return;
    const visible=[...actors.values()].filter(a=>!a.hidden),reserved=[],compact=floor.width<=600;
    const overlaps=(a,b)=>a.left<b.right+2&&a.right+2>b.left&&a.top<b.bottom+2&&a.bottom+2>b.top;
    function placeLabel(node,kind){
      node.style.setProperty('--'+kind+'-x','0px');node.style.setProperty('--'+kind+'-y','0px');
      const base=node.getBoundingClientRect(),dx=Math.max(floor.left+2-base.left,Math.min(0,floor.right-2-base.right));
      for(let step=0;step<=visible.length*2;step++){
        const shift=step===0?0:Math.ceil(step/2)*(base.height+3)*(step%2?1:-1)*(kind==='status'?-1:1),dy=Math.max(floor.top+2-base.top,Math.min(shift,floor.bottom-2-base.bottom));
        const box={left:base.left+dx,right:base.right+dx,top:base.top+dy,bottom:base.bottom+dy};
        if(!reserved.some(r=>overlaps(box,r))){node.style.setProperty('--'+kind+'-x',dx+'px');node.style.setProperty('--'+kind+'-y',dy+'px');reserved.push(box);return true}
      }
      return false;
    }
    for(const actor of visible){statusDot(actor);placeLabel(actor.querySelector('.hani-office-name'),'name')}
    const priority=a=>a.dataset.speaking==='true'?3:a.dataset.called==='true'||a.dataset.activity==='meeting'?2:1;
    for(const actor of visible.sort((a,b)=>priority(b)-priority(a))){
      // Plain base work is dot-only; phones keep the reviewed names-only layout (219).
      const status=actor.querySelector('.hani-office-status');status.hidden=compact||actor.dataset.plain==='true'&&actor.dataset.speaking!=='true'&&actor.dataset.called!=='true'&&actor.dataset.activity!=='meeting';status.style.visibility=status.hidden&&!compact?'hidden':'';
      if(!status.hidden&&!placeLabel(status,'status'))status.style.visibility='hidden';
    }
  }
  if(buildingChairmanSlot())people.push(['seongmin','회장님',null,0]);
  function buildingChairmanSlot(){return HaniBuildingScene.scheduler?.slot('ceo-reserved')}
  for(const [key,name,group,row] of people){
    const actor=document.createElement("div");actor.className="hani-office-actor";actor.dataset.person=key;actor.dataset.name=name;actor.dataset.seat=(HaniBuildingScene.homeSeat(key)||buildingChairmanSlot()).id;actor.dataset.spot="seat";
    const sprite=document.createElement('div');sprite.className='hani-office-sprite';sprite.dataset.row=String(row);actor.officeLegacy={group,row};
    const status=document.createElement('span');status.className='hani-office-status';const tag=document.createElement('small');tag.className='hani-office-name';
    const dot=document.createElement('span'),icon=document.createElement('span'),tagName=document.createElement('span');dot.className='hani-office-status-dot';dot.setAttribute('role','img');icon.className='hani-office-activity-icon';icon.setAttribute('aria-hidden','true');icon.hidden=true;tagName.textContent=name.split(' · ').at(-1);tag.append(dot,icon,tagName);
    const prop=document.createElement('span');prop.className='hani-office-prop';prop.setAttribute('aria-hidden','true');actor.append(sprite,tag,status,prop);actor.setAttribute('role','button');actor.tabIndex=0;actor.dataset.avatar='pending';actorLayer.append(actor);actors.set(key,actor);
  }
  // One scene host; actors remain mounted and only their floor/position changes.
  const building=HaniBuildingScene,tabs=root.querySelector(".hani-building-tabs"),floorLabel=document.createElement("span"),overflowChip=document.createElement("span"),floorButtons=new Map(),backgroundCache=new Map();
  const roster=document.createElement("ul");roster.className="hani-building-roster";roster.setAttribute("aria-label","현재 층 직원과 활동");root.querySelector(".hani-office-scroll").after(roster);for(const actor of actors.values()){const row=document.createElement("li"),name=document.createElement("b"),text=document.createElement("span");name.textContent=actor.dataset.name;row.append(name,text);roster.append(row);actor.officeRow=row;actor.officeText=text}
  const actorBubble=document.createElement('div'),bubbleLine=document.createElement('p'),profileLink=document.createElement('a');
  actorBubble.className='hani-office-character-bubble';actorBubble.hidden=true;actorBubble.setAttribute('aria-live','polite');actorBubble.setAttribute('aria-atomic','true');profileLink.textContent='프로필 ↗';profileLink.href='#organization/people';actorBubble.append(bubbleLine,profileLink);map.append(actorBubble);
  const tapLines=building.tapLines.create(building.canon?.people||window.HaniOrganizationRoster?.people||[]);
  let bubblePerson=null,bubbleSerial=0,bubbleSelection=null,pendingTap=null,cancelled=new Set(),cancelledDay='',meetingStartedAt=0;
  function cancelScheduledDuringMeeting(now=new Date()){
    if(!meeting||!building.scheduler)return;
    const day=new Date(now.getTime()+32400000).toISOString().slice(0,10),midnight=Date.parse(day+'T00:00:00+09:00');
    const presence={chairmanPresent:window.HaniOfficePresence?.chairman==='active'};
    for(const event of building.scheduler.plan(day,presence))if(midnight+event.start*1000<=now.getTime()&&midnight+event.end*1000>=meetingStartedAt)cancelled.add(event.id);
  }
  function actionRunning(actor){return meeting||!!actor.officeTravel||actor.dataset.walking==='true'||!!actor.dataset.event||actor.dataset.action&&actor.dataset.action!=='base-work'}
  function bubbleText(actor){
    if(bubbleSelection&&!actionRunning(actor)){const speaker=actors.get(bubbleSelection.speaker);return (speaker?.dataset.name||actor.dataset.name)+' · '+bubbleSelection.line}
    return actor.dataset.name+' · '+statusNames[actor.dataset.status]+' · '+actor.querySelector('.hani-office-status').dataset.full;
  }
  function fitBubble(){
    if(actorBubble.hidden)return;
    const floor=map.getBoundingClientRect?.(),bubble=actorBubble.getBoundingClientRect?.(),actor=actors.get(bubblePerson)?.getBoundingClientRect?.();
    if(!floor?.width||!bubble?.width||!actor)return;
    const left=Math.max(4,Math.min(floor.width-bubble.width-4,actor.left-floor.left+actor.width/2-bubble.width/2));
    const top=Math.max(4,Math.min(floor.height-bubble.height-4,actor.top-floor.top-bubble.height-6));
    actorBubble.style.left=left+'px';actorBubble.style.top=top+'px';
  }
  function closeBubble(clearPending=true){bubbleSerial++;bubblePerson=null;bubbleSelection=null;if(clearPending)pendingTap=null;actorBubble.hidden=true;for(const actor of actors.values())actor.dataset.speaking='false';fitStatusLabels()}
  function showBubble(actor,selection){bubblePerson=actor.dataset.person;bubbleSelection=selection;actorBubble.hidden=false;bubbleLine.textContent=bubbleText(actor);profileLink.href='#organization/people/'+bubblePerson;for(const a of actors.values())a.dataset.speaking=String(a===actor);fitStatusLabels();fitBubble();const serial=++bubbleSerial;setTimeout(()=>{if(serial===bubbleSerial)closeBubble(false)},3000)}
  function openBubble(actor){
    if(actor.hidden)return;
    pendingTap=null;const now=new Date(),selection=tapLines.tap(actor.dataset.person,now);
    if(selection&&actionRunning(actor))pendingTap={actor,selection,floor:activeFloor};
    showBubble(actor,selection||null);
    const serial=bubbleSerial;
    void tapLines.load().then(()=>{
      // Replay taps in order even if the first view is still fetching the seed.
      const loaded=selection?null:tapLines.tap(actor.dataset.person,now);
      if(serial!==bubbleSerial||!loaded||actor.hidden||!sceneVisible())return;
      bubbleSelection=loaded;if(actionRunning(actor))pendingTap={actor,selection:loaded,floor:activeFloor};
      bubbleLine.textContent=bubbleText(actor);fitBubble();
    });
  }
  function activateActor(event){const actor=event.target.closest('.hani-office-actor');if(actor&&actorLayer.contains(actor))openBubble(actor)}
  actorLayer.addEventListener('click',activateActor);
  actorLayer.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activateActor(event)}else if(event.key==='Escape')closeBubble()});
  profileLink.addEventListener('click',event=>{if(typeof showView==='function'){event.preventDefault();showView('organization/people/'+bubblePerson)}});
  // The existing roster is also a touch-sized entry to the same bubble.
  for(const actor of actors.values()){actor.officeRow.setAttribute('role','button');actor.officeRow.tabIndex=0;actor.officeRow.addEventListener('click',()=>openBubble(actor));actor.officeRow.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openBubble(actor)}})}
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
    plate.dataset.material=entry.material;plate.dataset.label=entry.label;plate.title=entry.fullLabel||entry.label;
    plate.dataset.mount=entry.mount||'wall';
    const english=document.createElement('b'),korean=document.createElement('small');
    english.textContent=entry.english;korean.textContent=entry.label;plate.append(english,korean);
    plate.setAttribute('aria-label',entry.english+' · '+entry.label);
    if(entry.logo){
      plate.dataset.brand='true';plate.replaceChildren();
      const logo=document.createElement('span');logo.className='hani-office-brand';
      const image=document.createElement('img');image.className='hani-office-brand-mark';image.src=entry.logo;image.alt='';
      const word=document.createElement('b');word.textContent='HANI GROUP';logo.append(image,word);plate.append(logo);
      plate.setAttribute('aria-label','HANI GROUP');
    }
    plate.style.left=entry.x+'%';plate.style.top=entry.y+'%';plate.style.width=entry.width+'%';
    plate.style.transform='rotate('+entry.rotate+'deg) skewX('+entry.skew+'deg)';
    map.append(plate);plates.push({plate,floor:floor.id});
  }
  // Each floor owns persistent decorative slots; positions are desk anchor + art offset.
  const deskProps=[];
  for(const floor of building.floors)for(const entry of building.art?.floors[floor.id].deskProps||[]){
    const anchor=building.art.anchors[entry.anchor];if(!anchor)continue;
    const prop=document.createElement('img');prop.className='hani-office-desk-props';prop.dataset.person=entry.id;
    prop.dataset.planned=String(Boolean(entry.planned));prop.setAttribute('aria-hidden','true');prop.alt='';prop.hidden=true;
    prop.style.left=(anchor.x+entry.offset[0]/building.art.width*100)+'%';
    prop.style.top=(anchor.y+entry.offset[1]/building.art.height*100)+'%';
    prop.style.width=entry.width/building.art.width*100+'%';
    prop.onload=()=>{prop.dataset.loaded='true'};prop.onerror=()=>{prop.dataset.loaded='false'};
    map.append(prop);deskProps.push({prop,floor:floor.id,src:building.deskPropArt[entry.id]});
  }
  let activeFloor="4f",floorSnapshot=null,layoutKey="",backgroundToken=0,returnFloor="4f",displayedFloor=null;
  floorLabel.className="hani-building-floor-label";overflowChip.className="hani-building-overflow";const caption=document.createElement('div');caption.className='hani-building-floor-caption';const presenceNote=document.createElement('small');presenceNote.className='hani-building-presence-note';presenceNote.setAttribute('role','status');presenceNote.hidden=true;caption.append(floorLabel,overflowChip,presenceNote);root.querySelector('.hani-office-scroll').after(caption);
  const foregrounds=[...map.querySelectorAll(".hani-office-foreground")];
  for(const img of foregrounds){img.className='hani-office-foreground';img.hidden=true}
  const rooms=document.createElement('div');rooms.className='hani-building-rooms';root.querySelector('.hani-office-scroll').after(rooms);
  const roomLabels=new Map();
  for(const floor of building.floors){const list=document.createElement('p');list.textContent=[...(building.canon?.floors.find(f=>f.id===floor.id)?.rooms||[]).map(r=>r.label),...(building.art?.floors[floor.id].plates||[]).filter(p=>p.detail).map(p=>p.fullLabel)].join(' · ');rooms.append(list);roomLabels.set(floor.id,list)}
  function legacySprite(actor){
    const sprite=actor.querySelector('.hani-office-sprite'),{group,row}=actor.officeLegacy;
    if(actor.dataset.person==='seongmin'){sprite.className='hani-office-sprite';sprite.style.backgroundImage='';actor.dataset.avatar='pending';return}
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
      return {background};
    })());
    backgroundCache.get(floor.id).then(({background})=>{
      if(token!==backgroundToken||!sceneVisible())return;
      bg.src=background;bg.alt=floor.label+' · HANI 본사';map.dataset.art=background===floor.background?'floor':'fallback';
      foregrounds.forEach(img=>{img.hidden=true});
      map.dataset.mask='none';
      for(const entry of plates)entry.plate.hidden=entry.floor!==floor.id||background!==floor.background;
      for(const entry of deskProps){entry.prop.hidden=entry.floor!==floor.id||background!==floor.background;if(!entry.prop.hidden&&!entry.prop.src)entry.prop.src=entry.src}
    });
  }
  function updateBuilding(force=false,animate=true){
    if(sceneVisible())void tapLines.load();
    const now=new Date(),day=new Date(now.getTime()+32400000).toISOString().slice(0,10);
    if(day!==cancelledDay){cancelled=new Set();cancelledDay=day}
    const presence={chairmanPresent:window.HaniOfficePresence?.chairman==='active'};
    cancelScheduledDuringMeeting(now);
    floorSnapshot=building.snapshot(now,{...presence,reducedMotion:reduced,cancelled,summoned:meeting?selectedAgents():[]});
    presenceNote.textContent=floorSnapshot.presenceNote||'';presenceNote.hidden=!floorSnapshot.presenceNote;
    for(const floor of floorSnapshot.floors){const button=floorButtons.get(floor.id),selected=floor.id===activeFloor;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;button.querySelector("small").textContent=`근무 ${floor.work} · 휴식 ${floor.rest}`}
    const floor=floorSnapshot.floors.find(f=>f.id===activeFloor),selected=meeting&&activeFloor==="2f"?selectedAgents():null;
    const entries=selected?building.assignSeats(activeFloor,selected.map(id=>({id,activity:"meeting"}))):meeting&&activeFloor==='4f'&&selectedAgents().includes('mir')?building.assignSeats(activeFloor,[...floor.visible.filter(p=>p.id!=='mir'),{id:'mir',activity:'meeting'}]):floor.visible;
    const nextKey=floorSnapshot.day+":"+activeFloor+":"+entries.map(p=>p.id+"/"+p.activity+"/"+p.seat?.id+"/"+p.actionId+"/"+p.eventId+"/"+p.line+"/"+(p.walking?Math.floor(floorSnapshot.seconds*10):p.pose)).join(",")+":"+Boolean(selected)+":"+Math.floor(floorSnapshot.minutes/5);
    if(!force&&nextKey===layoutKey)return;
    const sameFloor=displayedFloor===activeFloor;displayedFloor=activeFloor;
    for(const [id,list] of roomLabels)list.hidden=id!==activeFloor;
    layoutKey=nextKey;map.dataset.floor=activeFloor;map.style.setProperty("--floor-tint",floor.tint);map.setAttribute("aria-labelledby",floorButtons.get(activeFloor).id);map.setAttribute("aria-label",floor.label);floorLabel.textContent=floor.label;
    const overflow=selected?0:floor.overflow;overflowChip.hidden=!overflow;overflowChip.textContent="+"+overflow;overflowChip.setAttribute("aria-label",`이 층의 다른 직원 ${overflow}명`);
    for(const entry of plates)entry.plate.hidden=entry.floor!==activeFloor;
    if(!sameFloor)for(const entry of deskProps)entry.prop.hidden=true;
    if(!sameFloor)foregrounds.forEach(img=>{img.hidden=true});
    setBackground(floor);
    for(const entry of plannedRows)entry.row.hidden=entry.floor!==activeFloor;
    for(const actor of actors.values()){actor.hidden=true;actor.officeRow.hidden=true;actor.dataset.called="false"}
    for(const p of entries){const actor=actors.get(p.id);if(!actor||!p.seat)continue;actor.hidden=false;actor.officeRow.hidden=false;actor.dataset.activity=p.activity;actor.dataset.plain=String(Boolean(p.plain&&!selected&&!meeting));
      if(actor.dataset.avatar==='pending')legacySprite(actor);if(sceneVisible())loadSprite(actor,fitStatusLabels);
      if(building.scheduler&&!meeting){actor.officeTravel=null;actor.officeAnchor=p.seat.anchor;actor.dataset.seat=p.seat.id;actor.dataset.zone=p.seat.zone;actor.dataset.spot=p.seat.zone==='desk'?'seat':p.seat.zone;actor.dataset.home=[p.seat.x,p.seat.y].join(',');place(actor,p.position||[p.seat.x,p.seat.y]);pose(actor,reduced?(p.walking?'standing':p.pose):p.pose)}
      else seatActor(actor,p.seat,animate&&(sameFloor||meeting));
      actor.dataset.action=selected?'agent-case':p.actionId||'base-work';actor.dataset.event=p.eventId||'';actor.dataset.line=selected?'실제 안건 검토 중':p.line||'자료 확인 중';
      actor.dataset.emoji=selected||actor.dataset.action==='base-work'?'':p.emoji||'';actor.dataset.walking=String(Boolean(p.walking));
      actor.querySelector('.hani-office-prop').textContent=actor.dataset.emoji;
      if(selected)actor.dataset.called='true';
      label(actor,(actor.dataset.emoji?actor.dataset.emoji+' ':'')+actor.dataset.line);
      if(bubblePerson===p.id)bubbleLine.textContent=bubbleText(actor);
    }
    if(pendingTap){const {actor,selection,floor}=pendingTap;if(floor!==activeFloor||actor.hidden)pendingTap=null;else if(!actionRunning(actor)&&sceneVisible()){pendingTap=null;showBubble(actor,selection)}}
    if(bubblePerson&&actors.get(bubblePerson)?.hidden)closeBubble();
    fitStatusLabels();fitBubble();
  }
  function selectFloor(id,animate=false){closeBubble();if(!floorButtons.has(id))return;for(const actor of actors.values())finishTravel(actor);activeFloor=id;updateBuilding(true,animate)}
  tabs.addEventListener("click",event=>{const button=event.target.closest("[data-building-floor]");if(button&&tabs.contains(button))selectFloor(button.dataset.buildingFloor)});
  tabs.addEventListener("keydown",event=>{const keys=[...floorButtons.keys()],index=keys.indexOf(activeFloor);let next;if(event.key==="ArrowRight")next=(index+1)%keys.length;else if(event.key==="ArrowLeft")next=(index+keys.length-1)%keys.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=keys.length-1;else return;event.preventDefault();selectFloor(keys[next]);floorButtons.get(keys[next]).focus()});
  function syncVisibility(){const visible=sceneVisible();root.dataset.paused=String(!visible);if(visible)updateBuilding(true,false);else closeBubble()}
  document.addEventListener("visibilitychange",syncVisibility);
  new MutationObserver(syncVisibility).observe(root.closest(".view"),{attributes:true,attributeFilter:["class","hidden","style"]});
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{fitStatusLabels();fitBubble()}).observe(map);
  document.fonts?.ready.then(()=>{fitStatusLabels();fitBubble()});
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
  function textLine(name,text,key,summary=false){const row=document.createElement("div");row.className="hani-office-line"+(summary?" hani-office-line-summary":"");const img=document.createElement("img");img.src=building.profile(personKey(key||"hani"));img.alt="";img.loading="lazy";const body=document.createElement("div");body.className="hani-office-line-body";const title=document.createElement("b");title.textContent=name;const para=document.createElement("p");para.textContent=text;body.append(title,para);row.append(img,body);conversation.append(row)}
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
  async function openMeeting(){if(!caseData||meeting)return;returnFloor=activeFloor;meetingStartedAt=Date.now();meeting=true;selectFloor("2f",true);openButton.disabled=true;caseState.textContent="회의실로 이동 중";const selected=selectedAgents();if(!await walk(selected)||!meeting||!caseData)return;meetingBox.hidden=false;returnButton.hidden=false;map.dataset.state="meeting";caseState.textContent=stageText();renderMeeting();syncQuestions();meetingBox.scrollIntoView({behavior:reduced?"instant":"smooth",block:"nearest"})}
  async function returnOffice(){if(!meeting)return;meetingBox.hidden=true;returnButton.hidden=true;syncQuestions();caseState.textContent="자리로 복귀 중";const selected=selectedAgents();await walk(selected,true);cancelScheduledDuringMeeting();meeting=false;selectFloor(returnFloor,true);homeAll();map.dataset.state="idle";openButton.disabled=!caseData;caseState.textContent=caseData?"안건 선택됨 · 회의실 준비":"평상시 근무 중"}
  openButton.addEventListener("click",openMeeting);returnButton.addEventListener("click",returnOffice);
  document.getElementById("haniOfficeReportLink").addEventListener("click",()=>document.getElementById("agentCaseDetail")?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"}));
  window.haniOfficeLiveUpdate=detail=>{if(caseData?.case?.id!==detail?.case?.id){liveStage="";liveAgents=null;liveCross=null}caseData=detail?.case?detail:null;openButton.disabled=!caseData||meeting;caseState.textContent=caseData?stageText():"평상시 근무 중";if(meeting){if(caseData){renderMeeting();syncQuestions(true)}else void returnOffice()}};
  window.haniOfficeLiveStage=({stage,case:activeCase,selected_agents,reviews,cross_review}={})=>{if(activeCase){if(caseData?.case?.id!==activeCase.id){liveAgents=null;liveCross=null;caseData={case:activeCase,reviews:[]}}else caseData.case={...caseData.case,...activeCase}}if(Array.isArray(selected_agents)){liveAgents=["hani"];for(const member of selected_agents){const key=personKey(member?.agent_key);if(people.some(person=>person[0]===key)&&!liveAgents.includes(key))liveAgents.push(key)}liveAgents=liveAgents.slice(0,6)}if(Array.isArray(reviews)&&caseData)caseData.reviews=reviews;if(cross_review)liveCross=cross_review;if(stage)liveStage=stage;openButton.disabled=!caseData||meeting;caseState.textContent=stageText();if(stage==="SUMMONING"&&liveAgents?.length&&!meeting)void openMeeting();else if(meeting&&!meetingBox.hidden)renderMeeting()};
  if(typeof agentDetailCache!=="undefined"&&agentDetailCache?.case)window.haniOfficeLiveUpdate(agentDetailCache);
  // Only moving actors advance. Nodes and art probes are never recreated on a tick.
  setInterval(()=>{if(reduced||!sceneVisible())return;frame++;
    if(building.scheduler&&!meeting){updateBuilding(false,false);return}
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
    fitStatusLabels();
  },100);
  setInterval(changeOne,4200);
})();

})();
