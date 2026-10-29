/* V2 metadata is read-only; a failed metadata request keeps the production renderer. */
(async () => {
  const Math=globalThis.Math,Map=globalThis.Map,Set=globalThis.Set,Infinity=globalThis.Infinity;
  let assets=globalThis.HaniOfficeV2Assets||null,seededPlaces=null;
  if(!assets&&typeof fetch==='function'){
    try{
      // All office catalogs/art are seeded separately; use the existing metadata URL list.
      // The v3 sprites and the seeded place catalog are optional (index >= 3).
      const [canon,sprites,art,spritesV3,places]=await Promise.all([
        './data/hani-building/spatial-contract.json','./assets/sprites-v2/manifest.json','./data/hani-building/art-map-v1.json','./assets/sprites-v3/manifest-v3.json','./data/hani-building/office-places.json'
      ].map(async (url,index)=>{
        try{const response=await fetch(url);if(!response.ok)throw Error('office metadata');return await response.json()}
        catch(error){if(index>=3)return null;throw error}
      }));
      seededPlaces=places;
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
  // No places means no optional excursions.
  let placeTable=assets?.places||globalThis.HaniOfficePlaces||seededPlaces;
  // Place-only nodes (window spots) ship with the places file so the frozen spatial contract
  // stays unchanged; merge them only when every attachment already exists.
  if(assets&&placeTable?.schemaVersion==='office-places-v1'){
    const ids=new Set(assets.canon.anchors.map(a=>a.id)),extra=(placeTable.anchors||[]).filter(a=>!ids.has(a.id)&&placeTable.art?.[a.id]);
    const known=new Set([...ids,...extra.map(a=>a.id)]),edges=(placeTable.edges||[]).filter(e=>known.has(e.from)&&known.has(e.to)&&extra.some(a=>a.id===e.from||a.id===e.to));
    // Copies only: the loaded contract objects are never mutated.
    if(extra.length&&extra.every(a=>edges.some(e=>e.from===a.id||e.to===a.id)))assets={...assets,
      canon:{...assets.canon,anchors:[...assets.canon.anchors,...extra],edges:[...assets.canon.edges,...edges]},
      art:{...assets.art,anchors:{...assets.art.anchors,...Object.fromEntries(extra.map(a=>[a.id,placeTable.art[a.id]]))}}};
  }
  const places=Object.freeze(placeTable?.schemaVersion==='office-places-v1'?placeTable.places:[]);
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
  const routeTrees=new Map(),adjacent=new Map();
  for(const e of canon?.edges||[]){if(e.kind==='stairs')continue;
    if(!adjacent.has(e.from))adjacent.set(e.from,[]);adjacent.get(e.from).push(e.to);
    if(e.bidirectional){if(!adjacent.has(e.to))adjacent.set(e.to,[]);adjacent.get(e.to).push(e.from)}
  }
  // Edge geometry is immutable; reuse the identical weight in every source tree.
  const weightedAdjacent=new Map([...adjacent].map(([from,next])=>{const a=anchors.get(from);return [from,next.filter(id=>anchors.has(id)).map(id=>{const b=anchors.get(id);return {id,weight:a.floor===b.floor?Math.hypot(a.x-b.x,a.y-b.y):180}})]}));
  const routeNodes=[...anchors.values()],routeIds=new Map(routeNodes.map((a,i)=>[a.id,i]));
  const routeEdges=routeNodes.map(a=>(weightedAdjacent.get(a.id)||[]).map(e=>({id:routeIds.get(e.id),weight:e.weight})));
  // Equal-distance nodes keep the original Set's insertion order, including
  // distance decreases. Stale heap entries never change Dijkstra tie breaking.
  const routeBefore=(a,b)=>a.cost<b.cost||a.cost===b.cost&&a.order<b.order;
  function routePush(heap,value){let i=heap.length;heap.push(value);while(i){const p=(i-1)>>>1;if(!routeBefore(value,heap[p]))break;heap[i]=heap[p];i=p}heap[i]=value}
  function routePop(heap){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&routeBefore(heap[c+1],heap[c]))c++;if(!routeBefore(heap[c],last))break;heap[i]=heap[c];i=c}heap[i]=last}return first}
  function route(from,to){
    if(!canon||!anchors.has(from)||!anchors.has(to))return [];
    const source=routeIds.get(from),destination=routeIds.get(to);
    if(!routeTrees.has(from)){
      const distance=new Float64Array(routeNodes.length).fill(Infinity),previous=new Int32Array(routeNodes.length).fill(-1),open=new Int32Array(routeNodes.length).fill(-1),heap=[{id:source,cost:0,order:0}];let sequence=1;
      distance[source]=0;open[source]=0;
      while(heap.length){const entry=routePop(heap),current=entry.id;if(open[current]!==entry.order||distance[current]!==entry.cost)continue;
        open[current]=-1;const a=routeNodes[current];if(current!==source&&a.rendererSeat)continue;
        for(const {id:next,weight} of routeEdges[current]){
          const cost=distance[current]+weight;
          if(cost<distance[next]){distance[next]=cost;previous[next]=current;if(open[next]===-1)open[next]=sequence++;routePush(heap,{id:next,cost,order:open[next]})}
        }
      }
      routeTrees.set(from,{distance,previous});
    }
    const {distance,previous}=routeTrees.get(from);
    if(distance[destination]===Infinity)return [];const path=[destination];while(path[0]!==source)path.unshift(previous[path[0]]);return path.map(id=>routeNodes[id]);
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
  // Keep every resident's physical desk visible when a floor grows beyond six.
  function projection(entries,capacity=6){const ordered=[...entries].sort((a,b)=>Number(b.activity!=="work")-Number(a.activity!=="work"));return {visible:ordered.slice(0,capacity),overflow:Math.max(0,entries.length-capacity)}}
  // One canonical scheduler. Daily plans are projections, never queues to replay.
  // All mutable state is disposable memory; no life records or data triggers enter here.
  function createScheduler(table){
    const Math=globalThis.Math,Set=globalThis.Set,Map=globalThis.Map,Object=globalThis.Object,Infinity=globalThis.Infinity,Array=globalThis.Array,Date=globalThis.Date;
    const nightCatalog=table.schemaVersion==='office-actions-221-v1';
    const actions=new Map(table.actions.filter(a=>a.automaticReady&&(a.releaseTarget==='216'||nightCatalog&&a.releaseTarget==='221')&&!a.manualPreviewOnlyIn216&&!a.conditions.triggerIds.length).map(a=>[a.id,a]));
    const persons=table.people.filter(p=>p.registration==='registered'&&eligible.some(e=>e.id===p.id)||p.id==='seongmin');
    const personById=new Map(persons.map(p=>[p.id,p]));
    // Short work visits reuse existing art/graph nodes, never a colleague's chair.
    const errandPlaces=places.length?persons.filter(p=>!['mir','seongmin'].includes(p.id)).flatMap(p=>{
      const h=art.anchors[p.home.anchorId];
      const slots=[...new Set(['side_desk_'+p.id,'approach_desk_'+p.id,'side_'+p.home.anchorId,'approach_'+p.home.anchorId])].filter(id=>{
        const a=anchors.get(id),v=art.anchors[id];
        const distance=v&&Math.hypot((v.x-h.x)*(art.width||1672)/100,(v.y-h.y)*(art.height||941)/100);
        return a?.type==='junction'&&a.room===p.home.room&&distance>=32&&distance<=200;
      }).sort((a,b)=>Math.abs(art.anchors[a].y-h.y)-Math.abs(art.anchors[b].y-h.y)||Math.abs(art.anchors[b].x-h.x)-Math.abs(art.anchors[a].x-h.x));
      return slots.length?[{id:'errand-colleague-'+p.id,kind:'errand',errandKind:'colleague',targetPerson:p.id,floor:p.home.floor,room:p.home.room,slots,pose:'stand',stay:[8,25],
        go:p.name+' 자리로 가는 중',at:[p.name+'에게 잠깐 물어보는 중',p.name+'랑 화면 같이 보는 중']}]:[];
    }):[];
    // Existing public noticeboard is drawn in 1F. No invented printers/cabinets.
    if(places.length&&anchors.has('ilbo_board'))errandPlaces.push({id:'errand-notice',kind:'errand',errandKind:'notice',floor:'1f',room:'lobby',slots:['ilbo_board'],pose:'stand',stay:[8,25],go:'게시판으로 가는 중',at:['게시판 공지 확인 중']});
    for(const a of anchors.values())if(places.length&&a.type==='door'&&['secretariat','hani_office','finance','life','platform','business'].includes(a.room)){
      const room=canon.floors.find(f=>f.id===a.floor)?.rooms.find(r=>r.id===a.room),name=(room?.label||a.label).split(' · ')[0];
      errandPlaces.push({id:'errand-deliver-'+a.room,kind:'errand',errandKind:'delivery',floor:a.floor,room:a.room,slots:[a.id],pose:'stand',stay:[8,25],go:name+' 가는 중',at:['서류 전달 중']});
    }
    for(const card of placeTable?.errands||[])if(card.slots.every(id=>anchors.get(id)?.floor===card.floor&&anchors.get(id)?.room===card.room))errandPlaces.push(card);
    const defaults=actions.get('base-work'),cache=new Map(),paths=new Map(),targetCache=new Map(),slotCache=new Map();
    // Voice/role grounding: existing office-tap-lines toChairman and seeded jobs.
    // No new place or chair: reports stand on the existing CEO approach junctions.
    const chairmanVoice={
      hani:{greet:'회장님, 오늘 안건 정리해 뒀어요',topic:'오늘 안건',reply:'네, 핵심부터 묶어 둘게요',short:'안건 보고 중'},
      gaeun:{greet:'회장님, 다음 일정 챙겨 뒀어요',topic:'다음 일정',reply:'네, 이동 여유도 챙길게요',short:'일정 보고 중'},
      yuna:{greet:'회장님 오셨어요! 메모 모아 뒀어요!',topic:'접수 메모',reply:'네! 담당별로 정리해 둘게요!',short:'접수 보고 중'},
      jieun:{topic:'예산',reply:'네, 필요한 예산 길을 찾아볼게요',short:'예산 보고 중'},
      seoyun:{topic:'배포 일정',reply:'네, 범위와 순서를 정리할게요',short:'배포 보고 중'},
      dohyun:{topic:'구현 진행',reply:'네, 동작까지 확인해 둘게요',short:'구현 보고 중'},
      yuri:{topic:'품질 점검',reply:'네, 확인한 근거를 묶어 둘게요',short:'품질 보고 중'},
      arin:{topic:'화면 검토',reply:'네, 쓰기 편하게 다듬을게요',short:'화면 보고 중'},
      hina:{topic:'검증 결과',reply:'네, 확인된 결과로 정리할게요',short:'검증 보고 중'},
      naeun:{topic:'비용 점검',reply:'네, 비용부터 살펴둘게요',short:'비용 보고 중'}
    };
    const chairmanPoint=art.anchors['ceo-reserved'];
    const reportSlots=chairmanPoint?[...anchors.values()].filter(a=>a.floor==='4f'&&a.room==='ceo'&&a.type==='junction'&&a.runtimeAssignable!==false&&(()=>{const q=art.anchors[a.id],d=q&&Math.hypot((q.x-chairmanPoint.x)*(art.width||1672)/100,(q.y-chairmanPoint.y)*(art.height||941)/100);return d>=32&&d<=160})()).map(a=>a.id):[];
    const reportPlaces=reportSlots.length?Object.entries(chairmanVoice).map(([id,v])=>({id:'chairman-report-'+id,kind:'report',floor:'4f',room:'ceo',slots:reportSlots,pose:'stand',stay:[20,60],go:'회장님께 보고하러 가는 중',at:['회장님께 '+v.topic+' 보고 중',v.reply],atByPerson:{[id]:['회장님께 '+v.topic+' 보고 중',v.reply]}})):[];
    const chairmanShort=new Map(Object.values(chairmanVoice).flatMap(v=>[[v.greet,'회장님께 인사 중'],['회장님께 '+v.topic+' 보고 중',v.short],[v.reply,'보고 답변 중']]));
    const greetingCache=new WeakMap();
    const minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
    const imul=Math.imul;
    const seed=value=>{let n=2166136261;for(let i=0;i<value.length;i++){n^=value.charCodeAt(i);n=imul(n,16777619)}return n>>>0};
    const seedTail=(n,value)=>{for(let i=0;i<value.length;i++){n^=value.charCodeAt(i);n=imul(n,16777619)}return n>>>0};
    const unit=value=>seed(value)/4294967296;
    const overlap=(a,b)=>a.start<b.end&&b.start<a.end;
    const ledgerIndices=new WeakMap(),intervalCache=new WeakMap(),homeGeometry=new Map(),clearGeometry=new Map(),rosterKeys=new WeakMap(),staticSafe=new Set();
    function rosterKey(allowed){if(!rosterKeys.has(allowed))rosterKeys.set(allowed,allowed.map(p=>p.id).join(','));return rosterKeys.get(allowed)}
    function ledgerOverlaps(ledger,start,end){
      let index=ledgerIndices.get(ledger);if(!index){index={length:0,buckets:new Map()};ledgerIndices.set(ledger,index)}
      for(;index.length<ledger.length;index.length++){const e=ledger[index.length];for(let k=Math.floor(e.start/60);k<=Math.floor(e.end/60);k++){
        if(!index.buckets.has(k))index.buckets.set(k,[]);index.buckets.get(k).push(e);
      }}
      const first=Math.floor(start/60),last=Math.floor(end/60);
      if(first===last)return (index.buckets.get(first)||[]).filter(e=>e.start<end&&start<e.end);
      const result=new Set();for(let k=first;k<=last;k++)for(const e of index.buckets.get(k)||[])if(e.start<end&&start<e.end)result.add(e);
      return [...result];
    }
    function path(from,to){let targets=paths.get(from);if(!targets){targets=new Map();paths.set(from,targets)}if(!targets.has(to))targets.set(to,route(from,to));return targets.get(to)}
    function slot(id,pose='sit'){
      let poses=slotCache.get(id);if(poses?.has(pose))return poses.get(pose);
      const a=anchors.get(id),p=art?.anchors[id];if(!a||!p||a.runtimeAssignable===false||a.type==='core')return null;
      const value={...(a.rendererSeat||{id:a.id,zone:'lounge'}),...p,anchor:id,posture:pose==='sit'?'sitting':'standing'};if(!poses){poses=new Map();slotCache.set(id,poses)}poses.set(pose,value);return value;
    }
    const lateWorkers=new Set(['seoyun','dohyun','mir','yuna','minji']);
    const isLate=seconds=>seconds>=3600&&seconds<7*3600;
    const isEvening=seconds=>seconds>=18*3600||seconds<3600;
    const presentAt=(id,seconds)=>!isLate(seconds)||lateWorkers.has(id)||id==='seongmin';
    const displacedHomesById=new Map(['yuna','minji'].map(id=>[id,{floor:'1f',anchorId:id==='yuna'?'lobby-nw':'lobby-ne'}]));
    function homeAt(person,seconds){
      if((isLate(seconds)||isEvening(seconds))&&displacedHomesById.has(person.id))return displacedHomesById.get(person.id);
      return person.home;
    }
    let targetCount=0;
    function targetBranch(day,action,subject){
      let byAction=targetCache.get(day);if(!byAction){byAction=new Map();targetCache.set(day,byAction)}
      let bySubject=byAction.get(action.id);if(!bySubject){bySubject=new Map();byAction.set(action.id,bySubject)}
      let phases=bySubject.get(subject);if(!phases){phases=[];bySubject.set(subject,phases)}return phases;
    }
    function targets(action,subject,day,seconds=9*3600){
      const phase=+(isLate(seconds)||isEvening(seconds)),cached=targetBranch(day,action,subject)[phase];
      if(cached)return cached;
      const ids=subject?[subject]:action.participants;
      const result=ids.map(id=>{
        const person=personById.get(id);if(!person||!action.participants.includes(id))return null;
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
      if(targetCount>6000){for(const cachedDay of targetCache.keys())targetCache.delete(cachedDay);targetCount=0}targetBranch(day,action,subject)[phase]=result;targetCount++;return result;
    }
    function windows(action,weekday){
      const c=action.conditions;if(c.days==='평일'&&!weekday||c.days==='주말'&&weekday)return [];
      // Wrapped ranges use the matching KST calendar day: [22,24) + [0,02).
      const ranges=(!weekday&&c.weekendTimeWindows||c.timeWindows).flatMap(([a,b])=>{const start=minute(a)*60,end=minute(b)*60;return start<end?[[start,end]]:start>end?[[0,end],[start,86400]]:[]}).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
      return ranges.reduce((merged,range)=>{const last=merged.at(-1);if(last&&range[0]<=last[1])last[1]=Math.max(last[1],range[1]);else merged.push([...range]);return merged},[]);
    }
    // Runtime catalog objects are immutable; reuse their parsed windows across
    // thousands of cadence opportunities. Public windows() still parses probes.
    const actionWindowCache=new WeakMap();
    function actionWindows(action,weekday){
      if(!actionWindowCache.has(action))actionWindowCache.set(action,{});
      const cached=actionWindowCache.get(action);return cached[weekday]??(cached[weekday]=windows(action,weekday));
    }
    // Catalog durations stay immutable. Only an actual trip away from the
    // presence home acquires the destination's real-clock minimum/maximum.
    const stayRanges={coffee:[60,180],window:[40,120],sofa:[120,300],board:[60,180],server:[45,120],garden:[90,240],terrace:[90,240],lobby:[30,90],meeting:[90,240]};
    const stayBySlot=new Map();
    function stayRange(target){
      const id=target.seat.anchor;if(stayBySlot.has(id))return stayBySlot.get(id);
      const card=places.find(c=>c.slots.includes(id)),room=anchors.get(id)?.room;
      const kind=card?.kind||(/window/.test(id)?'window':({cafe:'coffee',pantry:'coffee',platform:'sofa',mir_nook:'sofa',exec_lounge:'sofa',standup:'board',server:'server',garden:'garden',terrace:'terrace',lobby:'lobby',consult:'meeting',team_meeting:'meeting',release:'meeting',exec:'meeting'})[room]);
      const range=card?.stay||stayRanges[kind]||[45,120];stayBySlot.set(id,range);return range;
    }
    const formalStayBounds=new WeakMap();
    function formalStay(action,chosen,seconds){
      if(!formalStayBounds.has(chosen)){
        const scale=action.id.startsWith('scene-')?placeTable?.outingRules?.groupStayScale||1.2:1;
        let min=0,max=Infinity;
        for(const t of chosen)if(t&&t.seat.anchor!==t.home.anchorId){const range=stayRange(t);min=Math.max(min,range[0]*scale);max=Math.min(max,range[1]*scale)}
        formalStayBounds.set(chosen,{min,max,scale:min?scale:1});
      }
      const {min,max,scale}=formalStayBounds.get(chosen);
      return Math.min(max,Math.max(seconds*scale,min));
    }
    const targetResources=new WeakMap();
    function resourcesFor(chosen){
      if(!targetResources.has(chosen))targetResources.set(chosen,[...new Set(chosen.flatMap(t=>[...t.outbound,...t.inbound].map(a=>a.id)))]);
      return targetResources.get(chosen);
    }
    const formalCeiling=(family,action,chosen)=>Math.max(family.durationCeilingSeconds,formalStay(action,chosen,action.durationSeconds[1]));
    const homeFormalPeople=new WeakMap(),formalFloors=new WeakMap(),formalHomeKeys=new WeakMap();
    function opportunitiesFor(day,allowed,includeCadence=true){
      const present=new Set(allowed.map(p=>p.id)),weekday=![0,6].includes(new Date(day+'T00:00:00Z').getUTCDay()),opportunities=[];
      for(const family of table.families){
        const parent=family.parent;if(parent.conditions.triggerIds.length||parent.manualPreviewOnlyIn216)continue;
        const group=family.limits.scope==='scene',subjects=group?[null]:parent.participants.filter(id=>present.has(id));
        if(nightCatalog&&family.id==='sig-seongmin-1'){
          // One reserved opportunity for each existing chairman variant during
          // work hours. Keep the original three-hour cooldown and safety path.
          if(present.has('seongmin'))for(const [n,id] of family.memberActionIds.entries()){
            const start=32700+[0,14400,25200][n]+seed(day+'|chairman-work')%60;
            opportunities.push({family:{...family,limits:{...family.limits,maxPerDay:family.memberActionIds.length}},parent,subject:'seongmin',action:actions.get(id),start,base:day+'|'+family.id+'|seongmin',n,group:false,windowEnd:64800});
          }
          continue;
        }
        if(family.limits.cadenceSeconds){
          if(!includeCadence)continue;
          // Floor microexpressions share the canonical opportunity/reservation path.
          // One opportunity per floor regardless of roster size; no render catch-up.
          const cadence=weekday?family.limits.cadenceSeconds:family.limits.weekendCadenceSeconds,base=day+'|'+family.id;
          const candidatePools=new Map(),rotations=new Map();
          let n=0;
          for(const [a,b] of actionWindows(parent,weekday))for(let tick=a;tick<b;tick+=cadence){
            const index=n++,start=tick+unit(base+'|'+index)*3,period=isLate(start)?'late':isEvening(start)?'evening':'day';
            if(!candidatePools.has(period)){const pool=[];
              for(const id of family.memberActionIds){const action=actions.get(id);if(!action)continue;
                for(const subject of action.participants){const person=allowed.find(p=>p.id===subject);if(person&&presentAt(subject,start)&&homeAt(person,start).floor===family.limits.floor)pool.push({subject,action})}
              }
              candidatePools.set(period,pool);
            }
            const candidates=candidatePools.get(period);
            if(candidates.length){const offset=seed(base+'|variant|'+index)%candidates.length,key=period+'|'+offset;
              if(!rotations.has(key))rotations.set(key,[...candidates.slice(offset),...candidates.slice(0,offset)]);
              opportunities.push({family,parent,...candidates[offset],candidates:rotations.get(key),start,base,n:index,group:false,windowEnd:b})}
          }
          continue;
        }
        for(const subject of subjects){
          const base=day+'|'+family.sourceActionId+(subject?'|'+subject:'');
          // One daily family gate, not one gate per variant or render tick.
          if(unit(base)>=family.limits.probabilityPerDay*(weekday?1:table.rules.weekendFrequencyScale??1))continue;
          const ranges=actionWindows(parent,weekday);if(!ranges.length)continue;
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
      // Only displaced presence homes can block somebody else's destination.
      const actorUntil=new Map(),signatureUntil=new Map(),groupUntil=new Map();let latestAcceptedStart=-Infinity;
      const displacedHomes=allowed.filter(p=>homeAt(p,0)!==p.home);
      if(nightCatalog){
        // Conservative previous-day envelope keeps cooldowns across midnight without
        // replay, persistence, recursive plans, or dependence on which day was viewed.
        // A rejected prior opportunity can only reduce early-day exposure, never add it.
        const previousDay=new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
        for(const o of opportunitiesFor(previousDay,allowed,false)){
          const chosen=targets(o.action,o.subject,previousDay,o.start);if(!chosen.length||chosen.some(t=>!t))continue;
          const travel=chosen.reduce((sum,t)=>sum+[t.outbound,t.inbound].reduce((total,path)=>total+path.slice(1).reduce((seconds,to,i)=>{const from=path[i];return seconds+travelSeconds(from,to)},0),0),0);
          const retryEnvelope=chosen.some(t=>places.some(p=>p.kind==='window'&&p.slots.includes(t.seat.anchor)))?60:0;
          const end=o.start+retryEnvelope+formalCeiling(o.family,o.action,chosen)+travel-86400,counter=o.family.id+'|'+(o.subject||'scene');
          lastFamily.set(counter,Math.max(lastFamily.get(counter)??-Infinity,o.start+retryEnvelope-86400));
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
          if(targets.some(t=>homeAt(personById.get(t.id),start).anchorId!==homeAt(personById.get(t.id),end-.001).anchorId))return false;
          if((isLate(start)||isEvening(start))&&targets.some(t=>displacedHomes.some(p=>presentAt(p.id,start)&&p.id!==t.id&&homeAt(p,start).anchorId===t.seat.anchor&&!targets.some(q=>q.id===p.id))))return false;
        }
        // Accepted formal events start chronologically. In that case each
        // overlap predicate reduces exactly to its latest end at this start.
        // Keep the interval fallback for nonchronological or empty intervals.
        if(start>=latestAcceptedStart&&end>start){
          if(targets.some(t=>(actorUntil.get(t.id)??-Infinity)>start))return false;
          if(signature&&targets.some(t=>(signatureUntil.get(anchors.get(t.seat.anchor).floor)??-Infinity)>start))return false;
          if(group&&targets.some(t=>(groupUntil.get(anchors.get(t.seat.anchor).floor)??-Infinity)>start))return false;
          return targets.length===1||new Set(targets.map(t=>t.seat.anchor)).size===targets.length;
        }
        const solo=targets.length===1,ids=solo?null:new Set(targets.map(t=>t.id));
        if(!solo&&new Set(targets.map(t=>t.seat.anchor)).size!==targets.length)return false;
        // Actor/floor eligibility first; actual slot/door intervals are reserved below.
        return !ledgerOverlaps(events,start,end).some(e=>e.people.some(t=>solo?t.id===targets[0].id:ids.has(t.id))||signature&&e.layer===2&&e.floors.some(f=>targets.some(t=>anchors.get(t.seat.anchor).floor===f))||group&&e.layer===3&&e.floors.some(f=>targets.some(t=>anchors.get(t.seat.anchor).floor===f)));
      }
      for(const o of opportunities){
        const before=events.length;
        try{
        if(o.candidates){
          const chosen=o.candidates.find(c=>{const people=targets(c.action,c.subject,day,o.start);return available(people,o.start,o.start+formalCeiling(o.family,c.action,people))});
          if(!chosen)continue;Object.assign(o,chosen);
        }
        const {family,parent,subject,action,start,group}=o,counter=family.id+'|'+(family.limits.cadenceSeconds?'floor':subject||'scene');
        if((counts.get(counter)||0)>=family.limits.maxPerDay||start-(lastFamily.get(counter)??-Infinity)<family.limits.cooldownSeconds||group&&groups>=table.rules.groupGlobalDailyMax)continue;
        const actionWindow=actionWindows(action,weekday).find(([a,b])=>start>=a&&start<b);if(!actionWindow)continue;
        const parentTargets=targets(parent,subject,day,start),chosen=targets(action,subject,day,start);
        if(!available(parentTargets,start,start+formalCeiling(family,parent,parentTargets),parent.layer===2,group)||!chosen.length||chosen.some(t=>!t))continue;
        const changed=chosen.filter(t=>anchors.get(t.seat.anchor).floor!==t.home.floor);
        if(changed.some(t=>start-(lastMove.get(t.id)??-Infinity)<table.rules.floorChanging.initialMinIntervalSeconds))continue;
        if(action.personalNonWork&&chosen.some(t=>start-(lastNonWork.get(t.id)??-Infinity)<table.rules.personalNonWork.initialMinIntervalSeconds))continue;
        const catalogDuration=Math.min(family.durationCeilingSeconds,action.durationSeconds[0]+Math.floor(unit(o.base+'|duration|'+o.n)*(action.durationSeconds[1]-action.durationSeconds[0]+1)));
        let duration=formalStay(action,chosen,catalogDuration);
        // One route at a time inside a group; reserve the whole excursion atomically.
        // This conservative FIFO also keeps shared doors/elevators below capacity.
        const atHome=chosen.every(t=>t.outbound.length===1&&t.inbound.length===1);
        if(atHome&&!homeFormalPeople.has(chosen))homeFormalPeople.set(chosen,chosen.map(t=>({...t,out:[],back:[]})));
        let cursor=start;const people=atHome?homeFormalPeople.get(chosen):chosen.map(t=>({...t}));
        function travel(t,p,phase){
          const legs=[];for(let i=1;i<p.length;i++){
            const from=p[i-1],to=p[i],seconds=travelSeconds(from,to);if(!seconds)continue;
            legs.push({from:from.id,to:to.id,start:cursor,end:cursor+seconds});cursor+=seconds;
          }t[phase]=legs;
        }
        if(!atHome)for(const t of travelOrder(people,'outbound'))travel(t,t.outbound,'out');
        // FIFO waiting counts as AT_PLACE too. Bound each away participant's
        // total stay, including earlier arrival and later return departure.
        const minimumStay=formalStay(action,chosen,0);
        if(!atHome&&minimumStay){
          let returnDelay=0;const scale=action.id.startsWith('scene-')?placeTable?.outingRules?.groupStayScale||1.2:1;
          for(const t of travelOrder(people,'inbound')){
            if(t.seat.anchor!==t.home.anchorId)duration=Math.min(duration,stayRange(t)[1]*scale-(cursor-(t.out.at(-1)?.end??cursor))-returnDelay);
            returnDelay+=pathDuration(t.inbound);
          }
          if(duration<minimumStay)continue;
        }
        const performStart=cursor,performEnd=cursor+duration;cursor=performEnd;
        if(!atHome)for(const t of travelOrder(people,'inbound'))travel(t,t.inbound,'back');
        const end=cursor;
        if(end>Math.min(o.windowEnd,actionWindow[1])||!available(people,start,end,action.layer===2,group))continue;
        const selfies=table.rules.hinaBalance.selfieActionIds.includes(action.id);
        if(selfies&&teacherCompletedAt.filter(t=>t<=start).length<=events.filter(e=>table.rules.hinaBalance.selfieActionIds.includes(e.actionId)).length)continue;
        const resources=resourcesFor(chosen);
        if(!formalFloors.has(chosen))formalFloors.set(chosen,[...new Set(chosen.map(t=>anchors.get(t.seat.anchor).floor))]);
        const event={id:o.base+'|'+o.n,actionId:action.id,familyId:family.id,layer:action.layer,start,end,performStart,performEnd,duration,runtimeDurationCeilingSeconds:formalCeiling(family,action,chosen),personalNonWork:action.personalNonWork,people,resources,floors:formalFloors.get(chosen)};
        // available() already proved actor/floor eligibility for this interval.
        // Accepted away routes continuously protect every allowed home, so a
        // cached home-only proof has no remaining resource or moving conflict.
        if(atHome&&!formalHomeKeys.has(chosen))formalHomeKeys.set(chosen,people.map(t=>t.id+':'+t.home.anchorId).join(','));
        const staticKey=atHome?rosterKey(allowed)+'|'+formalHomeKeys.get(chosen)+'|'+(isLate(start)||isEvening(start))+'|'+(isLate(end-.001)||isEvening(end-.001)):null;
        if(atHome&&staticSafe.has(staticKey))events.push(event);
        else if(!reserve(event,events,allowed))continue;
        latestAcceptedStart=Math.max(latestAcceptedStart,start);
        for(const t of people)actorUntil.set(t.id,Math.max(actorUntil.get(t.id)??-Infinity,end));
        const floorUntil=action.layer===2?signatureUntil:action.layer===3?groupUntil:null;
        if(floorUntil)for(const floor of event.floors)floorUntil.set(floor,Math.max(floorUntil.get(floor)??-Infinity,end));
        counts.set(counter,(counts.get(counter)||0)+1);lastFamily.set(counter,start);
        if(group)groups++;
        if(table.rules.hinaBalance.teacherActionIds.includes(action.id))teacherCompletedAt.push(performEnd);
        if(action.personalNonWork)for(const t of people)lastNonWork.set(t.id,end);
        if(changed.length)for(const t of changed)lastMove.set(t.id,end);
        }finally{
          // Keep a gated catalog opportunity alive after a transient reservation
          // refusal. Reinsert chronologically; do not reroll the action or budget.
          const counter=o.family.id+'|'+(o.subject||'scene'),nextTime=o.start+30;
          if(events.length===before&&!o.family.limits.cadenceSeconds&&o.family.limits.cooldownSeconds<86400&&(o.retry||0)<2&&nextTime<o.windowEnd&&(counts.get(counter)||0)<o.family.limits.maxPerDay&&(o.subject==='seongmin'||targets(o.action,o.subject,day,o.start).some(t=>t&&places.some(p=>p.kind==='window'&&p.slots.includes(t.seat.anchor))))&&!events.some(e=>e.actionId===o.action.id&&e.people.some(t=>t.id===o.subject))){
            const next={...o,start:nextTime,retry:(o.retry||0)+1};let lo=opportunities.indexOf(o)+1,hi=opportunities.length;
            while(lo<hi){const mid=(lo+hi)>>>1;if(opportunities[mid].start<next.start)lo=mid+1;else hi=mid}
            opportunities.splice(lo,0,next);
          }
        }
      }
      if(cache.size>=4)cache.delete(cache.keys().next().value);cache.set(key,events);return events;
    }
    // Idle liveliness: each floor rotates its people through short visible bits (a playful or
    // time-of-day line, sometimes standing, sometimes a stroll to another room through its door).
    // Each person gets at most one bit per cycle; everyone else keeps a personal base-work line.
    // Pure function of the local clock; scheduled events always win.
    const BEAT=2.4,ACTIVE_BEATS=4.5,MIN_CYCLE=12;
    const idlePools={
      day:[['키보드 두드리는 중'],['보고서 다듬는 중'],['메일함 정리 중'],['몰래 인스타 순찰 중'],['간식 서랍 점검 중'],['고양이 영상 1분만…'],['기지개 켜는 중','stand'],['옆자리랑 수다 중'],['커피 리필 고민 중','stand'],['생각 정리 중'],['스트레칭 중','stand'],['메모에 낙서 중']],
      evening:[['가방 챙기는 중','stand'],['오늘 할 일 체크 중'],['저녁 메뉴 검색 중'],['간식 서랍 점검 중'],['몰래 인스타 순찰 중'],['퇴근길 날씨 확인 중'],['옆자리랑 수다 중'],['고양이 영상 1분만…'],['기지개 켜는 중','stand'],['퇴근 시간 카운트다운 중'],['스트레칭 중','stand']],
      late:[['야식 고민 중'],['한 줄만 더 고민 중','stand'],['졸음 참는 중'],['코드 한 줄만 더'],['몰래 인스타 순찰 중'],['기지개 켜는 중','stand'],['플레이리스트 고르는 중'],['간식 서랍 점검 중']],
      lounge:[['라운지에서 간식 나누는 중'],['소파에서 수다 중'],['라운지에서 몰래 인스타 순찰 중'],['야식 메뉴 투표 중'],['라운지에서 야근 이야기 중']],
      loungeLate:[['라운지에서 야식 고민 중'],['소파에서 꾸벅꾸벅'],['라운지에서 조용히 수다 중'],['라운지에서 별 보는 중']]
    };
// Desk words never imply travel. Personal lines follow the seeded voice/quirks;
    // all original playful words remain available in their original time buckets.
    const legacyDeskVoice={
      hani:['커진 아이디어 세 줄로 줄이는 중','다음 기획 이름 혼자 지어보는 중','칭찬받은 문장 다시 읽는 중','아이디어에 별표 하나 더 치는 중'],
      yuna:['제가요?! 하고 다시 확인 중','메모를 담당자별로 나누는 중','새 요청 차근차근 읽는 중','놓친 메모 없는지 살피는 중'],
      gaeun:['일정 사이 여유 한 칸 찾는 중','체크 표시 가지런히 맞추는 중','빠진 후속 메모 챙기는 중','다음 약속 준비물 적는 중'],
      seoyun:['큰 문제를 작은 조각으로 나누는 중','설계 메모에 화살표 더하는 중','바꿀 범위 조용히 짚는 중','복잡한 흐름 한 줄로 잇는 중'],
      dohyun:['일단 재현부터 해보는 중','작은 버그 하나 끝내는 중','테스트 결과 기다리는 중','고친 부분 다시 눌러보는 중'],
      serin:['숫자 두 줄 나란히 비교 중','반복 작업 줄일 방법 찾는 중','패턴 하나 더 발견하는 중','실험 결과에 밑줄 긋는 중'],
      yuri:['확인한 것만 체크하는 중','놓친 예외 하나 더 찾는 중','미검증 메모 따로 적는 중','통과 기준 다시 읽는 중'],
      arin:['작은 화면으로 다시 보는 중','문장 한 줄 덜어내는 중','누르는 순서 따라가 보는 중','읽기 편한 간격 고민 중'],
      jieun:['안 되는 이유 차근히 적는 중','이번 달 숫자 맞춰보는 중','지출 한 줄 다시 계산 중','작은 비용도 한 번 더 보는 중'],
      haru:['장바구니 하나 빼는 중','예쁜데 꼭 필요한지 고민 중','가격표 두 개 비교 중','읽던 책 제목 메모 중'],
      naeun:['밥 먹었는지 슬쩍 묻는 중','어깨 힘 빼라고 손짓 중','오늘 운동 횟수 세는 중','무리한 계획 줄여보는 중'],
      hina:['일본어 단어 혼자 퀴즈 중','정답에 동그라미 치는 중','칭찬 한 줄 옆에 적는 중','헷갈린 한자 다시 보는 중'],
      minji:['오늘 사건 제목 뽑는 중','명장면 하나 떠올리는 중','감동 포인트 메모 중','리뷰 첫 문장 고치는 중'],
      sooyeon:['다음 여행 코스 그리는 중','경기 결과 다시 확인 중','자전거 탈 날씨 찾는 중','가보고 싶은 곳 별표 중'],
      sua:['후속 조치 빠짐없이 챙기는 중','담당자 이름 밑줄 긋는 중','칭찬받고 헤헤 웃는 중','고객 메모 한 번 더 읽는 중'],
      taeo:['요구사항 번호 붙이는 중','고객 표현 쉬운 말로 바꾸는 중','흩어진 요청 한데 묶는 중','빠진 조건 하나 찾는 중'],
      daon:['좋은 전망의 반대 근거 찾는 중','하방 시나리오 조용히 적는 중','위험 신호 한 번 더 확인 중','작은 가정부터 다시 보는 중'],
      yoonseul:['궁금한 주제 하나 더 적는 중','읽을 순서 차곡차곡 정리 중','작은 배움끼리 연결하는 중','독서 메모에 질문 더하는 중']
    };
    const deskVoice=placeTable?.behavior?.deskVoice||legacyDeskVoice;
    const extraIdle={
      day:['물 한 모금 마시는 중','지운 문장 다시 쓰는 중','오늘 날짜 한 번 더 보는 중','노래 제목 떠올리는 중','단축키 하나 외우는 중','안 읽은 알림 세는 중','펜 뚜껑 찾는 중','손목 가볍게 푸는 중','점심 후보 두 개로 줄이는 중','사진첩 잠깐 넘기는 중','책갈피 문장 다시 읽는 중','모니터 밝기 조절 중','할 일 하나 지우는 중','가사 없이 흥얼거리는 중','책상 메모 순서 바꾸는 중','충전 케이블 정리 중','물병 얼마나 남았나 보는 중','집중 음악 바꿔보는 중','작은 오타 찾는 중','메모 색깔 고르는 중','알람 소리 줄이는 중','읽던 문장에 밑줄 긋는 중','타이머 남은 시간 보는 중'],
      evening:['오늘 잘한 일 하나 적는 중','내일 첫 할 일 적는 중','이어폰 챙겼나 확인 중','휴대폰 배터리 확인 중','저녁 약속 시간 보는 중','오늘 찍은 사진 고르는 중','읽다 만 기사 마저 읽는 중','할 일 목록 접어두는 중','퇴근 음악 골라두는 중','메모 제목 날짜로 바꾸는 중','오늘의 작은 성공 체크 중','가방 속 충전기 찾는 중','집에 가서 볼 영화 고르는 중','내일 날씨 미리 보는 중','답장 한 줄 마무리 중','노트 마지막 장 넘기는 중','휴대폰 알림 정리 중','저녁 뭐 먹지 투표 중'],
      late:['눈 비비고 다시 읽는 중','물 한 모금으로 잠 깨는 중','야식 후보 두 개로 줄이는 중','소리 줄이고 음악 듣는 중','오타 하나 조용히 고치는 중','시계 보고 살짝 놀라는 중','따뜻한 차 마실까 고민 중','마지막 할 일 표시 중','눈 감고 십 초 쉬는 중','내일의 나에게 메모 중','졸린 눈으로 문장 줄이는 중','오늘은 여기까지 고민 중','아침 알람 맞추는 중','손가락 가볍게 푸는 중','조용히 하품 삼키는 중'],
      lounge:['라운지에서 오늘 이야기 듣는 중','라운지에서 내일 계획 묻는 중','소파에서 웃음 참는 중','라운지에서 노래 추천하는 중','소파에서 영화 제목 맞히는 중','라운지에서 간식 봉지 접는 중','라운지에서 사진 한 장 보여주는 중','소파에서 고개 끄덕이는 중'],
      loungeLate:['라운지에서 작은 목소리로 웃는 중','소파에서 물 한 모금 마시는 중','라운지에서 마지막 버스 확인 중','소파에서 잠깐 눈 쉬는 중','라운지에서 야식 후보 고르는 중','소파에서 조용히 음악 듣는 중','라운지에서 오늘 고생했다고 말하는 중','소파에서 내일 할 일 적는 중']
    };
    const idlePosePools=Object.fromEntries(Object.entries(idlePools).map(([kind,pool])=>[kind,[...pool]]));
    for(const [kind,lines]of Object.entries(extraIdle))idlePools[kind].push(...lines.map(line=>[line]));

    function idleRoster(day,floor,seconds){return persons.filter(p=>p.id!=='mir'&&p.id!=='seongmin'&&presentAt(p.id,seconds)&&homeAt(p,seconds).floor===floor).map(p=>p.id).sort()}
    const pickCache=new Map();
    function beatPick(day,floor,k){const key=day+'|'+floor+'|'+k;if(pickCache.has(key))return pickCache.get(key);if(pickCache.size>4000)pickCache.delete(pickCache.keys().next().value);const pick=rotationPick(day,floor,k);pickCache.set(key,pick);return pick}
    function rotationPick(day,floor,k){const roster=idleRoster(day,floor,k*BEAT);if(!roster.length)return null;
      // People sit evenly spaced in the cycle, so quiet gaps are short and nobody repeats early.
      const order=[...roster].sort((a,b)=>seed(day+'|cycle|'+floor+'|'+a)-seed(day+'|cycle|'+floor+'|'+b)),len=Math.max(MIN_CYCLE,order.length),pos=((k%len)+len)%len;
      return order.find((_,i)=>Math.floor(i*len/order.length)===pos)??null;
    }
    // Consecutive beats walk a per-floor shuffled pool, so concurrent bits never repeat a line.
    const idleOrders=new Map();
    function poolLine(day,floor,kind,pool,j){const key=day+'|'+floor+'|'+kind+'|'+pool.length;let order=idleOrders.get(key);if(!order){order=pool.map((_,i)=>i).sort((a,b)=>seed(day+floor+kind+a)-seed(day+floor+kind+b));if(idleOrders.size>=80)idleOrders.delete(idleOrders.keys().next().value);idleOrders.set(key,order)}return pool[order[((j%pool.length)+pool.length)%pool.length]]}
    function idleFlavour(day,id,floor,seconds,lounge,late,events=[]){
      const k=Math.floor(seconds/BEAT);
      for(let j=k;j>k-ACTIVE_BEATS;j--)if(beatPick(day,floor,j)===id){
        // A bit never runs into, or straight out of, the person's scheduled action.
        const from=j*BEAT,to=from+ACTIVE_BEATS*BEAT;if(ledgerOverlaps(events,from-5,to+2).some(e=>e.people.some(t=>t.id===id)))return null;
        for(const pair of placeTable?.behavior?.deskPairs||[])if(pair.people.includes(id)){
          const peers=pair.people.map(id=>personById.get(id)),homes=peers.map(p=>homeAt(p,from));
          if(peers.some(p=>!presentAt(p.id,from))||homes.some(h=>h.floor!==floor)||gap({seat:slot(homes[0].anchorId)},{seat:slot(homes[1].anchorId)})>350)continue;
          for(let q=Math.floor(from/BEAT)-6;q<=Math.floor(to/BEAT)+2;q++){
            const begin=q*BEAT,end=begin+ACTIVE_BEATS*BEAT;
            if((begin<to&&from<end||Math.abs(begin-from)<14)&&beatPick(day,floor,q)===pair.people[0]&&Math.floor(q/MIN_CYCLE)%7===seed(pair.people.join())%7&&!ledgerOverlaps(events,begin-5,end+2).some(e=>e.people.some(t=>pair.people.includes(t.id))))return null;
          }
        }
        if(seconds>=to)continue;
        const kind=lounge?late?'loungeLate':'lounge':late?'late':isEvening(seconds)?'evening':'day',cycle=Math.floor(j/MIN_CYCLE),voice=!lounge&&deskVoice[id];
        let [line]=poolLine(day,floor,kind,idlePools[kind],j+cycle*5);
        const [,pose]=poolLine(day,floor,kind,idlePosePools[kind],j+cycle*5);
        const roster=idleRoster(day,floor,from),generic=cycle%4===3;
        if(voice&&!generic)line=voice[(cycle+seed(day+'|'+id))%voice.length];
        const moment=placeTable?.behavior?.moments.find(m=>from/3600>=m.hours[0]&&from/3600<m.hours[1]);
        if(!lounge&&moment&&cycle%11===seed(id)%11&&id===roster[(cycle+seed(day+moment.id))%roster.length])line=moment.lines[(Math.floor(cycle/11)+seed(id))%moment.lines.length];
        // Text lasts 10.8s. One gentle posture change keeps a two-person floor
        // visually alive without cycling that person's words every few seconds.
        return {beat:j,line,pose:seconds-from>=5.4?(pose==='stand'?'sit':'stand'):pose};
      }
      return null;
    }
    // All trajectories use the art's foot coordinates and a fixed screen speed.
    const SCREEN_SPEED=180,BLOCK=600,blocks=new Map(),travelCache=new Map(),pathDurations=new WeakMap(),idleLedgers=new WeakMap();
    const pixels=p=>[p[0]*(art.width||1672)/100,p[1]*(art.height||941)/100];
    function travelOrder(people,phase){
      if(people.length<2)return people;
      const dependencies=new Map(people.map(t=>[t.id,new Set()]));
      for(const moving of people)for(const seated of people){if(moving===seated)continue;
        const point=pixels([seated.seat.x,seated.seat.y]),floor=anchors.get(seated.seat.anchor).floor;
        const crosses=moving[phase].slice(1).some((to,i)=>{const from=moving[phase][i];if(from.floor!==floor||to.floor!==floor)return false;
          const a=pixels(visualPoint(from)),b=pixels(visualPoint(to)),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,u=length?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length)):0;
          return Math.hypot(a[0]+u*dx-point[0],a[1]+u*dy-point[1])<24.01;
        });
        if(crosses)dependencies.get(phase==='outbound'?seated.id:moving.id).add(phase==='outbound'?moving.id:seated.id);
      }
      const pending=[...people],ordered=[];
      while(pending.length){const index=pending.findIndex(t=>[...dependencies.get(t.id)].every(id=>ordered.some(p=>p.id===id)));
        if(index<0)return people;ordered.push(...pending.splice(index,1));
      }
      return ordered;
    }
    function travelSeconds(a,b){let targets=travelCache.get(a.id);if(!targets){targets=new Map();travelCache.set(a.id,targets)}if(targets.has(b.id))return targets.get(b.id);const p=pixels(visualPoint(a)),q=pixels(visualPoint(b)),value=a.floor!==b.floor?1.6:Math.hypot(p[0]-q[0],p[1]-q[1])/SCREEN_SPEED;targets.set(b.id,value);return value}
    function pathDuration(nodes){if(!pathDurations.has(nodes))pathDurations.set(nodes,nodes.slice(1).reduce((sum,to,i)=>sum+travelSeconds(nodes[i],to),0));return pathDurations.get(nodes)}
    function stateAt(event,t,seconds,reduced=false){
      const outEnd=t.out.at(-1)?.end??event.start,backStart=t.back[0]?.start??event.end;
      const returned=t.back.length&&seconds>=t.back.at(-1).end;
      const state=returned?'AT_HOME':seconds<outEnd?'GOING':seconds>=backStart?'RETURNING':t.seat.anchor===t.home.anchorId?'AT_HOME':'AT_PLACE';
      const leg=(seconds<outEnd?t.out:t.back).find(l=>l.start<=seconds&&seconds<l.end);
      if(leg&&!reduced){
        const a=anchors.get(leg.from),b=anchors.get(leg.to),pa=visualPoint(a),pb=visualPoint(b),ratio=(seconds-leg.start)/(leg.end-leg.start);
        return {state,seat:slot(a.id,'stand'),floor:a.floor,walking:a.floor===b.floor,waiting:a.floor!==b.floor,position:a.floor===b.floor?[pa[0]+(pb[0]-pa[0])*ratio,pa[1]+(pb[1]-pa[1])*ratio]:pa};
      }
      if(!reduced&&(state==='GOING'||state==='RETURNING')){
        const phase=state==='GOING'?t.out:t.back,previous=phase.filter(l=>l.end<=seconds).at(-1),next=phase.find(l=>l.start>seconds);
        if(previous&&next){const seat=slot(previous.to,'stand');return {state,seat,floor:anchors.get(previous.to).floor,walking:false,waiting:true,position:null}}
      }
      const at=seconds>=outEnd&&seconds<backStart,seat=at?t.seat:slot(t.home.anchorId,t.id==='mir'?'stand':'sit');
      return {state,seat,floor:anchors.get(seat.anchor).floor,walking:false,position:null};
    }
    function positionAt(id,seconds,ledger){
      const e=ledger.find(e=>e.start<=seconds&&seconds<e.end&&e.people.some(t=>t.id===id));
      if(e)return stateAt(e,e.people.find(t=>t.id===id),seconds);
      const p=personById.get(id);if(!p||!presentAt(id,seconds))return null;
      const h=homeAt(p,seconds),seat=slot(h.anchorId,id==='mir'?'stand':'sit');return {seat,floor:h.floor,walking:false,position:null};
    }
    function gap(p,q){const a=pixels(p.position||[p.seat.x,p.seat.y]),b=pixels(q.position||[q.seat.x,q.seat.y]);return Math.hypot(a[0]-b[0],a[1]-b[1])}
    function resourceIntervals(e){
      if(intervalCache.has(e))return intervalCache.get(e);
      const result=new Map(),add=(id,start,end)=>{if(!result.has(id))result.set(id,[]);result.get(id).push({start,end})};
      for(const t of e.people){
        for(const l of [...t.out,...t.back]){add(l.from,l.start,l.end);add(l.to,l.start,l.end)}
        add(t.seat.anchor,t.out.at(-1)?.end??e.start,t.back[0]?.start??e.end);
      }
      // Internal cache only; do not alter the public event shape or formal ledger.
      intervalCache.set(e,result);return result;
    }
    const resourceSets=new WeakMap();
    function resourceConflict(a,b){
      let ids=resourceSets.get(b.resources);if(!ids){ids=new Set(b.resources);resourceSets.set(b.resources,ids)}
      const person=a.people[0];
      if(a.resources.length===1&&a.people.length===1&&!person.out.length&&!person.back.length&&person.seat.anchor===a.resources[0]){
        if(!ids.has(a.resources[0]))return false;
        const ranges=resourceIntervals(b).get(a.resources[0]);return !!ranges&&ranges.some(p=>overlap(a,p));
      }
      if(!a.resources.some(r=>ids.has(r)))return false;
      const x=resourceIntervals(a),y=resourceIntervals(b);
      for(const [id,ranges]of x)if(y.has(id)&&ranges.some(p=>y.get(id).some(q=>overlap(p,q))))return true;
      return false;
    }
    const eventMotion=new WeakMap(),stationaryMotion={moving:false};
    function motion(e){
      let value=eventMotion.get(e);
      if(!value){value=e.people.some(t=>t.seat.anchor!==t.home.anchorId)?{moving:true,floors:new Set(e.people.flatMap(t=>[t.home.floor,anchors.get(t.seat.anchor).floor]))}:stationaryMotion;eventMotion.set(e,value)}
      return value;
    }
    function floorCapacity(candidate,nearby){
      const own=motion(candidate);if(!own.moving)return true;
      const reservations=nearby.filter(e=>motion(e).moving);reservations.push(candidate);
      const ticks=[candidate.start,candidate.end-.00001,3600,25200,41400,46800,...reservations.flatMap(e=>[e.start,e.end])].filter(s=>s>=candidate.start&&s<candidate.end);
      for(const floor of own.floors)for(const seconds of ticks){
        let count=0,groups=0,people=0;
        for(const e of reservations)if(motion(e).floors.has(floor)&&e.start<=seconds&&seconds<e.end){count++;people+=e.people.length;if(e.people.length>1)groups++}
        if(isLate(seconds)){if(people>1)return false}
        else if(seconds>=41400&&seconds<46800){if(people>4)return false}
        else if(count>2||groups>1)return false;
      }
      return true;
    }
    const edgeHomeBlocks=new WeakMap(),seatHomeBlocks=new WeakMap();
    function blockedByHome(homes,a,b,owner){
      let edges=edgeHomeBlocks.get(homes);if(!edges){edges=new Map();edgeHomeBlocks.set(homes,edges)}
      let targets=edges.get(a);if(!targets){targets=new Map();edges.set(a,targets)}
      let blocked=targets.get(b);
      if(!blocked){blocked=new Set();const pa=pixels(visualPoint(a)),pb=pixels(visualPoint(b)),dx=pb[0]-pa[0],dy=pb[1]-pa[1],length=dx*dx+dy*dy;
        for(const h of homes){if(h.anchor.floor!==a.floor)continue;const q=h.point,ratio=length?Math.max(0,Math.min(1,((q[0]-pa[0])*dx+(q[1]-pa[1])*dy)/length)):0;
          if(Math.hypot(pa[0]+ratio*dx-q[0],pa[1]+ratio*dy-q[1])<24.01)blocked.add(h.owner);
        }targets.set(b,blocked);
      }
      for(const id of blocked)if(id!==owner)return true;return false;
    }
    function clearHomeRoute(t,allowed,start,end){
      const geometryKey=rosterKey(allowed)+'|'+(isLate(start)||isEvening(start))+'|'+(isLate(end-.001)||isEvening(end-.001));
      if(!homeGeometry.has(geometryKey))homeGeometry.set(geometryKey,allowed.flatMap(other=>[...new Set([other.home.anchorId,homeAt(other,start).anchorId,homeAt(other,end-.001).anchorId])].map(id=>({owner:other.id,anchor:anchors.get(id),point:pixels(visualPoint(anchors.get(id)))}))));
      const homes=homeGeometry.get(geometryKey),key=geometryKey+'|'+t.id+':'+t.home.anchorId+':'+t.seat.anchor;
      if(clearGeometry.has(key))return clearGeometry.get(key);
      const a=anchors.get(t.seat.anchor);
      let seats=seatHomeBlocks.get(homes);if(!seats){seats=new Map();seatHomeBlocks.set(homes,seats)}
      let blocked=seats.get(t.seat);if(!blocked){const p=pixels([t.seat.x,t.seat.y]);blocked=new Set(homes.filter(h=>h.anchor.floor===a.floor&&Math.hypot(p[0]-h.point[0],p[1]-h.point[1])<20.01).map(h=>h.owner));seats.set(t.seat,blocked)}
      for(const id of blocked)if(id!==t.id){clearGeometry.set(key,false);return false}
      for(const nodes of [t.outbound,t.inbound])for(let i=1;i<nodes.length;i++){
        const a=nodes[i-1],b=nodes[i];if(a.floor!==b.floor||!travelSeconds(a,b))continue;
        if(blockedByHome(homes,a,b,t.id)){clearGeometry.set(key,false);return false}
      }
      clearGeometry.set(key,true);return true;
    }
    const privateHomeOwners=new Map();
    function otherHomeOwner(t,start,end){
      const key=(isLate(start)||isEvening(start))+'|'+(isLate(end-.001)||isEvening(end-.001));
      if(!privateHomeOwners.has(key)){
        const owners=new Map();for(const p of persons)for(const id of [p.home.anchorId,homeAt(p,start).anchorId,homeAt(p,end-.001).anchorId]){
          if(!owners.has(id))owners.set(id,new Set());owners.get(id).add(p.id);
        }privateHomeOwners.set(key,owners);
      }
      const owners=privateHomeOwners.get(key).get(t.seat.anchor);return owners&&[...owners].some(id=>id!==t.id);
    }
    const transitIntervals=new WeakMap();
    const physicalFloorIntervals=new WeakMap();
    function physicalFloors(e){
      if(physicalFloorIntervals.has(e))return physicalFloorIntervals.get(e);
      const intervals=[];
      for(const t of e.people){
        const ticks=[...new Set([e.start,e.end,...[...t.out,...t.back].flatMap(l=>[l.start,l.end])])].sort((a,b)=>a-b);
        for(let i=1;i<ticks.length;i++)if(ticks[i]>ticks[i-1]){
          const floor=stateAt(e,t,(ticks[i-1]+ticks[i])/2).floor,previous=intervals.at(-1);
          if(previous?.id===t.id&&previous.floor===floor&&previous.end===ticks[i-1])previous.end=ticks[i];
          else intervals.push({id:t.id,start:ticks[i-1],end:ticks[i],floor});
        }
      }
      physicalFloorIntervals.set(e,intervals);return intervals;
    }
    function transitCapacity(candidate,nearby){
      const all=[candidate,...nearby].filter(e=>!e.visitor&&motion(e).moving);
      if(!all.some(e=>motion(e).floors.size>1))return true;
      // Endpoint floors already have stronger full-excursion reservations.
      // Only an intermediate floor can introduce an uncounted transit unit.
      const extra=new Set();for(const e of all)if(motion(e).floors.size>1)for(const id of e.resources){const floor=anchors.get(id).floor;if(!motion(e).floors.has(floor))extra.add(floor)}
      if(!extra.size)return true;
      const relevant=all.filter(e=>e.resources.some(id=>extra.has(anchors.get(id).floor)));
      if(relevant.length<=1)return true;
      const rows=relevant.map(e=>({e,intervals:physicalFloors(e).filter(i=>extra.has(i.floor))}));
      const times=[...new Set(rows.flatMap(r=>r.intervals.flatMap(i=>[i.start,i.end])))].filter(s=>candidate.start<=s&&s<candidate.end);
      for(const seconds of times){const counts=new Map();
        for(const {e,intervals}of rows){const people=new Map();for(const i of intervals)if(i.start<=seconds&&seconds<i.end){if(!people.has(i.floor))people.set(i.floor,new Set());people.get(i.floor).add(i.id)}
          for(const [floor,ids]of people){const c=counts.get(floor)||{units:0,groups:0,people:0};c.units++;c.groups+=e.people.length>1;c.people+=ids.size;counts.set(floor,c)}
        }
        for(const c of counts.values())if(isLate(seconds)?c.people>1:seconds>=41400&&seconds<46800?c.people>4:c.units>2||c.groups>1)return false;
      }
      return true;
    }
    function reserve(candidate,ledger,allowed,nearby=ledgerOverlaps(ledger,candidate.start,candidate.end)){
      const ids=new Set(candidate.people.map(t=>t.id));
      if(nearby.some(e=>e.people.some(t=>ids.has(t.id))||resourceConflict(e,candidate)))return false;
      nearby=nearby.filter(e=>motion(e).moving);
      if(!floorCapacity(candidate,nearby))return false;
      if(candidate.card&&!candidate.visitor&&!transitCapacity(candidate,nearby))return false;
      // Reserve a unit for travellers passing through this floor. Existing
      // capacity still owns home/destination floors; transit uses actual times.
      if(candidate.card?.kind==='errand'){
        const floor=candidate.card.floor;
        for(const e of nearby)if(!e.people.some(t=>t.home.floor===floor||anchors.get(t.seat.anchor).floor===floor)&&e.resources.some(id=>anchors.get(id).floor===floor)){
          if(!transitIntervals.has(e)){
            const intervals=[];for(const t of e.people)for(const legs of [t.out,t.back])for(let i=0;i<legs.length;i++){
              const l=legs[i];intervals.push({floor:anchors.get(l.from).floor,start:l.start,end:l.end});
              if(i&&legs[i-1].end<l.start)intervals.push({floor:anchors.get(legs[i-1].to).floor,start:legs[i-1].end,end:l.start});
            }transitIntervals.set(e,intervals);
          }
          if(transitIntervals.get(e).some(r=>r.floor===floor&&overlap(r,candidate)))return false;
        }
      }
      // Every accepted away trajectory continuously protects ALL other homes,
      // including empty/cancelled ones. A stationary home expression therefore
      // needs only the same actor/resource checks and cached home geometry, even
      // while an unrelated colleague is walking elsewhere on this floor.
      const homeOnly=candidate.people.every(t=>!t.out.length&&!t.back.length&&t.seat.anchor===t.home.anchorId);
      const staticKey=homeOnly?rosterKey(allowed)+'|'+candidate.people.map(t=>t.id+':'+t.home.anchorId).join(',')+'|'+(isLate(candidate.start)||isEvening(candidate.start))+'|'+(isLate(candidate.end-.001)||isEvening(candidate.end-.001)):null;
      if(homeOnly&&staticSafe.has(staticKey)){ledger.push(candidate);return true}
      // Private homes remain owned even while empty; night lounge homes are also protected.
      if(candidate.people.some(t=>otherHomeOwner(t,candidate.start,candidate.end)))return false;
      if(candidate.people.some(t=>!t.visitor&&(!presentAt(t.id,candidate.end-.001)||homeAt(personById.get(t.id),candidate.end-.001).anchorId!==t.home.anchorId)))return false;
      if(candidate.people.some(t=>!clearHomeRoute(t,allowed,candidate.start,candidate.end)))return false;
      // Desk-only microexpressions share the already checked static home geometry.
      // No sampled state objects are needed when every overlapping actor is home.
      if(homeOnly){staticSafe.add(staticKey);ledger.push(candidate);return true}
      // Most catalog rows are stationary desk microexpressions. With no moving
      // reservation in this interval their pairwise distances are constant.
      if(candidate.people.every(t=>!t.out.length&&!t.back.length)&&nearby.every(e=>e.people.every(t=>!t.out.length&&!t.back.length))){
        for(const t of candidate.people){const p=stateAt(candidate,t,candidate.start);
          for(const other of allowed){if(other.id===t.id)continue;const own=candidate.people.find(q=>q.id===other.id);
            for(const seconds of [candidate.start,candidate.end-.001]){const q=own?stateAt(candidate,own,seconds):positionAt(other.id,seconds,nearby);
              if(q&&p.floor===q.floor&&gap(p,q)<20.01)return false;
            }
          }
        }
        ledger.push(candidate);return true;
      }
      // Exact piecewise-linear sweep at every trajectory/event boundary (both
      // sides of a floor transfer). This covers every instant, including between
      // the former 0.5s samples; 20/24px limits are unchanged.
      // Desk microexpressions never change physical position. Their homes were
      // checked continuously above; only moving/away reservations add sweep knots.
      const sweptFloors=new Set(candidate.resources.map(id=>anchors.get(id).floor));
      const movingNearby=nearby.filter(e=>e.people.some(t=>t.visitor||t.out.length||t.back.length||t.seat.anchor!==t.home.anchorId)&&e.resources.some(id=>sweptFloors.has(anchors.get(id).floor)));
      const others=[...new Set(movingNearby.flatMap(e=>e.people.filter(t=>!ids.has(t.id)&&(t.visitor||t.out.length||t.back.length||t.seat.anchor!==t.home.anchorId)).map(t=>t.id)))];
      if(candidate.people.length===1&&!others.length){ledger.push(candidate);return true}
      const times=new Set([candidate.start,candidate.end-.00001]);
      const boundary=(s,transfer=false)=>{for(const tick of transfer?[s-.000001,s,s+.000001]:[s])if(tick>candidate.start&&tick<candidate.end)times.add(tick)};
      for(const e of [candidate,...movingNearby]){for(const s of [e.start,e.end-.000001,e.end])boundary(s);
        for(const t of e.people)for(const l of [...t.out,...t.back]){
          for(const s of [l.start,l.end])boundary(s,anchors.get(l.from).floor!==anchors.get(l.to).floor);
        }
      }
      const ticks=[...times].sort((a,b)=>a-b);
      // Static homes were checked continuously above (stronger than sampling).
      // Sample all remaining people: those with a reserved trajectory or stay.
      const frames=new Map(candidate.people.map(t=>[t.id,ticks.map(s=>stateAt(candidate,t,s))]));
      for(const id of others){const own=movingNearby.filter(e=>e.people.some(t=>t.id===id));frames.set(id,ticks.map(s=>positionAt(id,s,own)))}
      for(const t of candidate.people){
        for(const id of others){
          const otherTrips=movingNearby.filter(e=>e.people.some(p=>p.id===id));
          const optionalCrossing=candidate.card&&otherTrips.some(e=>e.card);
          let prev=null;
          for(let index=0;index<ticks.length;index++){const p=frames.get(t.id)[index],q=frames.get(id)[index];
            if(!q||q.floor!==p.floor){prev=null;continue}
            // The original 20/24px gate remains mandatory. Optional trips,
            // including both public guests, keep the 30px crossing buffer.
            const limit=optionalCrossing&&p.walking&&q.walking?30:p.walking||q.walking?24:20;
            const pp=pixels(p.position||[p.seat.x,p.seat.y]),qp=pixels(q.position||[q.seat.x,q.seat.y]),r=[pp[0]-qp[0],pp[1]-qp[1]];
            if(Math.hypot(r[0],r[1])<limit+.01)return false;
            if(prev&&prev.floor===p.floor){const d=[r[0]-prev.r[0],r[1]-prev.r[1]],v=d[0]*d[0]+d[1]*d[1],u=v?Math.max(0,Math.min(1,-(prev.r[0]*d[0]+prev.r[1]*d[1])/v)):0;
              if(Math.hypot(prev.r[0]+u*d[0],prev.r[1]+u*d[1])<Math.max(limit,prev.limit)+.01)return false}
            prev={r,limit,floor:p.floor};
          }
        }
        // Within a group too: FIFO travel does not waive physical spacing.
        for(const q of candidate.people.filter(q=>q.id<t.id)){
          let previous=null;
          for(let index=0;index<ticks.length;index++){const p1=frames.get(t.id)[index],p2=frames.get(q.id)[index];
            if(p1.floor!==p2.floor){previous=null;continue}
            const limit=p1.walking||p2.walking?24:20;
            const a=pixels(p1.position||[p1.seat.x,p1.seat.y]),b=pixels(p2.position||[p2.seat.x,p2.seat.y]),r=[a[0]-b[0],a[1]-b[1]];
            if(Math.hypot(r[0],r[1])<limit+.01)return false;
            if(previous&&previous.floor===p1.floor){const dx=r[0]-previous.r[0],dy=r[1]-previous.r[1],v=dx*dx+dy*dy,u=v?Math.max(0,Math.min(1,-(previous.r[0]*dx+previous.r[1]*dy)/v)):0;
              if(Math.hypot(previous.r[0]+u*dx,previous.r[1]+u*dy)<Math.max(limit,previous.limit)+.01)return false}
            previous={r,limit,floor:p1.floor};
          }
        }
      }
      ledger.push(candidate);return true;
    }
    const excursionGeometry=new WeakMap(),legGeometry=new WeakMap();
    function pathLegs(nodes){
      if(!legGeometry.has(nodes))legGeometry.set(nodes,nodes.slice(1).map((to,i)=>({from:nodes[i].id,to:to.id,duration:travelSeconds(nodes[i],to)})).filter(l=>l.duration));
      return legGeometry.get(nodes);
    }
    function excursion(id,home,card,target,start,stay,day,visitor=null,deadline=86400){
      const outbound=path(home.anchorId,target),inbound=path(target,home.anchorId),seat=slot(target,card.pose);
      if(!seat||target===home.anchorId||!outbound.length||!inbound.length)return null;
      if(start+stay+pathDuration(outbound)+pathDuration(inbound)>deadline)return null;
      let cursor=start;
      const legs=nodes=>{const result=[];for(const {from,to,duration}of pathLegs(nodes)){result.push({from,to,start:cursor,end:cursor+duration});cursor+=duration}return result};
      const out=legs(outbound),performStart=cursor;cursor+=stay;const performEnd=cursor,back=legs(inbound);
      let geometry=excursionGeometry.get(outbound);if(!geometry){geometry={resources:[...new Set([...outbound,...inbound].map(n=>n.id))],floors:[...new Set([home.floor,card.floor])]};excursionGeometry.set(outbound,geometry)}
      return {id:day+'|outing|'+id+'|'+start,actionId:'base-work',start,end:cursor,performStart,performEnd,card,visitor,
        people:[{id,home,seat,outbound,inbound,out,back,visitor:!!visitor}],resources:geometry.resources,floors:geometry.floors};
    }
    // Pure vocabulary shared by snapshots and the existing persistent label slot.
    const workLines={hani:'기획안 정리 중',yuna:'요청 분류 중',jieun:'일정 조율 중',haru:'기록 정리 중',gaeun:'일정 확인 중',seoyun:'설계 검토 중',dohyun:'코드 수정 중',serin:'수치 분석 중',yuri:'품질 점검 중',arin:'화면 검토 중',hina:'검증 기록 중',daon:'콘텐츠 구상 중',yoonseul:'문장 다듬는 중',sua:'접수 확인 중',taeo:'안내 준비 중',minji:'업무 메모 중',mir:'흐름 살피는 중',seongmin:'결재 검토 중',sooyeon:'자료 대조 중',naeun:'예산 점검 중'};
    const shortWords=[[/고민/,'잠깐 고민 중'],[/퀴즈/,'퀴즈 푸는 중'],[/비용|예산/,'비용 살피는 중'],[/고생|인사/,'인사 나누는 중'],[/웃|미소/,'살짝 웃는 중'],[/도장|결재/,'결재 확인 중'],[/메일/,'메일 확인 중'],[/일정|약속/,'일정 확인 중'],[/노래|음악|플레이리스트/,'음악 고르는 중'],[/졸음|꾸벅/,'졸음 쫓는 중'],[/커피 주문/,'커피 주문 중'],[/메뉴 고르/,'메뉴 고르는 중'],[/커피/,'커피 한 모금'],[/택배/,'택배 확인 중'],[/배달/,'배달 확인 중'],[/게시판|소식/,'소식 읽는 중'],[/검증|테스트/,'결과 확인 중'],[/수다|이야기/,'이야기 나누는 중'],[/코드|버그/,'코드 살피는 중'],[/메모/,'메모 정리 중'],[/보고서/,'보고서 다듬는 중'],[/스트레칭|기지개/,'기지개 켜는 중'],[/고양이/,'고양이 영상 중'],[/인스타/,'인스타 보는 중'],[/간식/,'간식 살피는 중'],[/생각|아이디어/,'생각 정리 중'],[/창밖|풍경|별/,'풍경 보는 중'],[/쉬는|휴식|소파/,'잠깐 쉬는 중'],[/확인|체크/,'내용 확인 중'],[/정리/,'자료 정리 중'],[/읽|책|페이지/,'읽어 보는 중']];
    function fullShortLine(line){
      if(chairmanShort.has(line))return chairmanShort.get(line);
      if(line==='좋아요, 이대로 갑시다')return '좋아요, 갑시다';
      if([...line].length<=10)return line;
      if(/돌아가는 중|안녕히 계세요/.test(line))return '복귀하는 중';
      if(/가는 중/.test(line))return /커피|Coffee/.test(line)?'커피 사러 가는 중':/택배/.test(line)?'택배 찾으러 이동':'용무 보러 이동 중';
      if(/기다리는 중|대기/.test(line))return '차례 기다리는 중';
      return shortWords.find(([pattern])=>pattern.test(line))?.[1]||'업무 이어가는 중';
    }
    function shortLine(line,limit=10){
      const short=fullShortLine(line);if(limit>=10||[...short].length<=limit)return short;
      // Authored reductions, never clipping a word or hiding an ellipsis.
      const compact=short.replace('회장님께 인사 중','회장님께 인사').replace('좋아요, 갑시다','좋아요, 진행해요').replace('사러 가는 중','사러 이동').replace('찾으러 이동','찾기 이동').replace('용무 보러 이동 중','용무 보러 이동').replace('차례 기다리는 중','차례 대기 중').replace('이야기 나누는 중','대화 나누는 중').replace('업무 이어가는 중','업무 진행 중').replace('살피는 중','확인 중').replace('고르는 중','선택 중').replace('다듬는 중','수정 중');
      return [...compact].length<=limit?compact:'업무 진행 중';
    }
    const visitorKinds=[
      {kind:'client',sprite:'visitor-client',name:'방문 고객',hours:[[10,17]],target:'client_booth_slot_4',stay:[120,300],go:'상담실로 안내받아 가는 중',at:'상담 받는 중'},
      {kind:'courier',sprite:'visitor-courier',name:'택배 기사',hours:[[9,18]],target:'parcel_box',stay:[15,30],go:'택배함으로 가는 중',at:'택배 두고 갈게요'},
      {kind:'rider',sprite:'visitor-rider',name:'배달 기사',hours:[[11.5,13.5],[17.5,20]],target:'reception',stay:[15,30],go:'안내대로 배달 가는 중',at:'배달 왔습니다!'},
      {kind:'candidate',sprite:'visitor-candidate',name:'면접 지원자',hours:[[10,16]],weekdayOnly:true,target:'client_booth_slot_2',stay:[120,300],go:'면접 보러 상담실 가는 중',at:'면접 대기 중… 두근'},
      {kind:'generic',sprite:'visitor-generic',name:'테이크아웃 손님',hours:[[9,20]],target:'coffee_counter',stay:[20,40],go:'HANI Coffee 가는 중',at:'커피 받아 가는 중'}
    ];
    function blockPlan(day,index,events,options={}){
      const allowed=persons.filter(p=>(p.id!=='seongmin'||options.chairmanPresent)&&(!options.presentIds||options.presentIds.includes(p.id)));
      // Compatibility name/signature; the reservation horizon is now the whole day.
      // Adjacent blocks project the SAME ledger, including excursions crossing :00/:10.
      const key=day+'|'+allowed.map(p=>p.id).join(',');if(blocks.has(key))return blocks.get(key);
      const ledger=events.slice(),result=[],last=new Map(),due=new Map(),visits=new Map(),slotOrders=new Map(),tripsByPerson=new Map(),visitorUntil=new Map();
      const weekday=![0,6].includes(new Date(day+'T00:00:00Z').getUTCDay());
      const rules=placeTable?.outingRules||{cooldownSeconds:600,intervalSeconds:[1500,3000],groupStayScale:1.2};
      // The present chairman uses the same affinity, reservations and proximity
      // checks as staff. Presence still owns his arrival/departure.
      const lastFloor=new Map(),physical=allowed.filter(p=>p.id!=='mir'&&(nightCatalog||p.id!=='seongmin'));
      // Presence/home changes only at 01/07/18h. Reuse the exact filtered order;
      // hundreds of invitation ticks must not rebuild identical floor rosters.
      const floorRosters=new Map();
      function rosterAt(floor,at){
        const phase=isLate(at)?'late':isEvening(at)?'evening':'day';
        let byFloor=floorRosters.get(phase);if(!byFloor){byFloor=new Map();floorRosters.set(phase,byFloor)}
        if(!byFloor.has(floor))byFloor.set(floor,physical.filter(p=>presentAt(p.id,at)&&homeAt(p,at).floor===floor));
        return byFloor.get(floor);
      }
      // Companion eligibility is membership-only; retain the catalog's order.
      const companions=placeTable?.companions||[];
      const relationshipScores=new Map();
      for(const r of companions)for(const a of r.people)for(const b of r.people)if(a!==b){const key=a+'|'+b;relationshipScores.set(key,Math.max(relationshipScores.get(key)||0,r.score))}
      const pairCounts=new Map(),preMeeting=new Set(),preMeetingEvents=events.filter(e=>e.layer===3),gathering=placeTable?.behavior?.gathering;
      const pairKeys=people=>people.flatMap((p,i)=>people.slice(i+1).map(q=>[p.id,q.id].sort().join('|')));
      const gatheringPlace=card=>gathering&&card.slots.length>=2&&gathering.kinds.includes(card.kind);
      const floorTrips=new Map();
      for(const e of events.filter(e=>e.people.length>1))for(const t of e.people)if(anchors.get(t.seat.anchor).floor!==t.home.floor)floorTrips.set(t.id,(floorTrips.get(t.id)||0)+1);
      const commitments=new Map(allowed.map(p=>[p.id,[]]));
      for(const e of events)for(const t of e.people)commitments.get(t.id)?.push(e);
      function nextCommitment(id,at){const list=commitments.get(id)||[];let lo=0,hi=list.length;
        while(lo<hi){const mid=(lo+hi)>>>1;if(list[mid].end<=at)lo=mid+1;else hi=mid}
        return list[lo]?Math.max(at,list[lo].start):86400;
      }
      const lunch=s=>s>=41400&&s<46800,cap=s=>isLate(s)?1:lunch(s)?4:2;
      function withinCap(e){
        const near=ledgerOverlaps(result,e.start,e.end).filter(q=>!q.visitor);
        const ticks=[e.start,e.end-.00001,41400,46800,3600,25200,...near.flatMap(q=>[q.start,q.end])].filter(s=>s>=e.start&&s<e.end);
        const reservations=[...near,e];
        return e.floors.every(f=>ticks.every(s=>{
          let groups=0,solo=0,people=0;
          for(const q of reservations)if(q.start<=s&&s<q.end&&q.floors.includes(f)){if(q.people.length>1)groups++;else solo++;people+=q.people.length}
          return cap(s)===2?groups<=1&&solo+(groups?1:0)<=2:people<=cap(s);
        }));
      }
      const rhythms=Object.values(placeTable?.rhythm||{}),rhythmsAt=new Map();
      function weight(card,people,at){
        let w=people.reduce((n,p)=>n*(card.affinity?.[p.id]||1),1)**(1/people.length);
        const sameFloor=people.every(p=>homeAt(p,at).floor===card.floor);
        w*=sameFloor?(people.length>1?12:5):(people.length>1?.35:1);
        let activeRhythms=rhythmsAt.get(at);if(!activeRhythms){activeRhythms=rhythms.filter(r=>at/3600>=r.hours[0]&&at/3600<r.hours[1]);rhythmsAt.set(at,activeRhythms)}
        for(const rhythm of activeRhythms)w*=rhythm.weights[card.kind]||1;
        // Novel places get a modest boost; preferences still shape each day's mix.
        w*=people.some(p=>!visits.get(p.id)?.has(card.id))?3:1;
        if(gatheringPlace(card)){
          const staying=ledgerOverlaps(result,at,at+.001).filter(e=>!e.visitor&&e.card.id===card.id&&e.performStart<=at&&at<e.performEnd);
          if(staying.length){
            const friends=staying.some(e=>companions.some(r=>r.people.some(id=>people.some(p=>p.id===id))&&r.people.some(id=>e.people.some(t=>t.id===id))));
            w*=gathering.joinWeight*(friends?2:1)*(sameFloor?gathering.sameFloorWeight:1);
          }
        }
        return w;
      }
      function extendGathering(joining){
        if(!gatheringPlace(joining.card))return;
        const elders=ledgerOverlaps(result,joining.performStart,joining.performEnd).filter(e=>e!==joining&&!e.visitor&&e.card.id===joining.card.id&&e.performStart<joining.performStart&&joining.performStart<e.performEnd);
        if(!elders.length)return;
        const size=joining.people.length+elders.reduce((n,e)=>n+e.people.length,0),updates=[];
        for(const old of elders){
          const max=size>=3?gathering.trioMaxSeconds:old.card.stay[1]*gathering.maxScale;
          const shared=Math.min(old.performEnd,joining.performEnd)-joining.performStart;
          const end=Math.min(old.performEnd+shared,old.performStart+max),shift=end-old.performEnd;
          if(shift<=0)continue;
          const e={...old,people:old.people.map(t=>({...t,back:t.back.map(l=>({...l,start:l.start+shift,end:l.end+shift}))})),end:old.end+shift,performEnd:end,gatheringExtension:(old.gatheringExtension||0)+shift,gatheringChecks:[...(old.gatheringChecks||[]),{at:joining.performStart,size,until:end}]};
          if(e.people.some(t=>t.back[0].start-t.out.at(-1).end>max+1e-6))return;
          if(e.end>Math.min(...e.people.map(t=>nextCommitment(t.id,e.start)),86400-rules.cooldownSeconds))return;
          if(result.some(q=>q!==old&&!q.visitor&&q.people.some(t=>e.people.some(p=>p.id===t.id))&&q.start>=old.end&&q.start<e.end+rules.cooldownSeconds))return;
          updates.push([old,e]);
        }
        if(!updates.length)return;
        // Scratch reservations form one transaction. Never edit an indexed event
        // in place: resource/sweep caches and rejected proposals stay immutable.
        const removed=new Set(updates.map(([old])=>old)),scratch=[];
        for(const [,e]of updates){const near=ledgerOverlaps(ledger,e.start,e.end).filter(q=>!removed.has(q));near.push(...scratch.filter(q=>overlap(q,e)));if(!reserve(e,scratch,allowed,near))return}
        for(const [old,e]of updates){
          ledger[ledger.indexOf(old)]=e;result[result.indexOf(old)]=e;
          for(const t of old.people){const trips=tripsByPerson.get(t.id);if(trips)trips[trips.indexOf(old)]=e;if(last.get(t.id)?.end===old.end)last.set(t.id,{end:e.end,card:e.card.id})}
        }
        ledgerIndices.delete(ledger);ledgerIndices.delete(result);
      }
      function blockedGeometry(person,home,target,at,end){
        const geometryKey=rosterKey(allowed)+'|'+(isLate(at)||isEvening(at))+'|'+(isLate(end-.001)||isEvening(end-.001));
        return clearGeometry.get(geometryKey+'|'+person.id+':'+home.anchorId+':'+target)===false;
      }
      function attempt(people,at,visitor=null,fill=false,joiningCard=null,formalId=null){
        if(!visitor&&people.length>1&&(at<32400||at>=70200))return false;
        if(people.length>1&&pairKeys(people).some(key=>(pairCounts.get(key)||0)>=(placeTable?.behavior?.pairDailyMax||2)))return false;
        // Every candidate reserves all its actors from at. An existing actor
        // reservation covering that instant cannot be repaired by any card/FIFO.
        const activeAt=ledgerOverlaps(ledger,at,at+.000001).filter(e=>e.start<=at&&at<e.end);
        if(activeAt.some(e=>e.people.some(t=>people.some(p=>p.id===t.id))))return false;
        // Every excursion also reserves its home floor from at. Check this
        // necessary capacity condition before card ranking or trajectory creation.
        const homeFloors=new Set(people.map(p=>visitor?'1f':homeAt(p,at).floor));
        for(const floor of homeFloors){
          const active=activeAt.filter(e=>e.people.some(t=>t.seat.anchor!==t.home.anchorId)&&e.people.some(t=>t.home.floor===floor||anchors.get(t.seat.anchor).floor===floor));
          if(isLate(at)){if(active.reduce((n,e)=>n+e.people.length,people.length)>1)return false}
          else if(at>=41400&&at<46800){if(active.reduce((n,e)=>n+e.people.length,people.length)>4)return false}
          else if(active.length>=2||people.length>1&&active.some(e=>e.people.length>1))return false;
        }

        const deadline=visitor?86400:Math.min(people.length>1?70200:86400-rules.cooldownSeconds,...people.map(p=>nextCommitment(p.id,at)));
        if(deadline-at<(people.length>1?60*rules.groupStayScale:30))return false;
        const neighbours=fill?(people.length===1?[...(tripsByPerson.get(people[0].id)||[])]:result.filter(e=>!e.visitor&&e.people.some(t=>people.some(p=>p.id===t.id)))).sort((a,b)=>a.start-b.start):[];
        let cards=places.filter(c=>(!joiningCard||c.id===joiningCard.id)&&(visitor?c.slots.includes(visitor.target):
          c.stay[0]*(people.length>1?rules.groupStayScale:1)<=deadline-at&&
          c.room!=='consult'&&!c.slots.includes('reception')&&
          (!(at>=25200&&at<32400)||c.kind==='coffee')&&
          (at<70200||['coffee','sofa'].includes(c.kind))&&
          (people.length===1||people.every(p=>homeAt(p,at).floor===c.floor||(floorTrips.get(p.id)||0)<2))&&
          people.every(p=>fill?neighbours.filter(e=>e.people.some(t=>t.id===p.id)&&e.start<at).at(-1)?.card.id!==c.id&&neighbours.find(e=>e.people.some(t=>t.id===p.id)&&e.start>=at)?.card.id!==c.id:last.get(p.id)?.card!==c.id)&&(!isLate(at)||people.every(p=>homeAt(p,at).floor===c.floor))&&c.slots.length>=people.length));
        const rankBase=day+'|card|'+people.map(p=>p.id).join()+'|'+at+'|';
        const rankSeed=seed(rankBase),slotSeed=seed(day+'|slot|'+at);
        cards=cards.map(c=>({c,rank:visitor?seed(day+at+c.id):-Math.log(Math.max(.000001,seedTail(rankSeed,c.id)/4294967296))/weight(c,people,at)})).sort((a,b)=>a.rank-b.rank||a.c.id.localeCompare(b.c.id)).map(r=>r.c);
        if(!visitor&&!fill&&at-(lastFloor.get(homeAt(people[0],at).floor)??-Infinity)<BLOCK)cards=cards.slice(0,3);
        for(const card of cards){
          const orderKey=card.id+'|'+at;
          if(!visitor&&!slotOrders.has(orderKey))slotOrders.set(orderKey,card.slots.map(id=>({id,rank:seedTail(slotSeed,id)})).sort((a,b)=>a.rank-b.rank).map(p=>p.id));
          const slots=visitor?[visitor.target]:slotOrders.get(orderKey);
          for(let offset=0;offset<slots.length;offset++){
            const range=visitor?.stay||card.stay,scale=people.length>1?rules.groupStayScale:1;
            const homes=people.map(p=>visitor?{floor:'1f',anchorId:'arrival_gate'}:homeAt(p,at));
            const destinations=people.map((p,i)=>slots[(offset+i)%slots.length]);
            if(!visitor&&![3600,25200,64800].some(s=>at<s&&s<deadline)&&people.some((p,i)=>blockedGeometry(p,homes[i],destinations[i],at,deadline)))continue;
            const travel=people.map((p,i)=>{const home=visitor?{anchorId:'arrival_gate'}:homeAt(p,at),target=slots[(offset+i)%slots.length];return pathDuration(path(home.anchorId,target))+pathDuration(path(target,home.anchorId))+i*1.5});
            // Choose a legal stay within the available formal-calendar gap. Its
            // minimum is never shortened, and a 10-minute boundary has no role.
            const ceiling=Math.min(range[1],Math.floor((deadline-at-Math.max(...travel))/scale));
            if(ceiling<range[0])continue;
            const stay=(range[0]+seed(day+'|stay|'+at+card.id)%(ceiling-range[0]+1))*scale;
            // Resolve static home/path geometry before allocating legs or FIFO.
            // No phase boundary may lie in the possible interval. Positive proofs
            // never bypass temporal, resource, capacity or continuous sweep checks.
            if(![3600,25200,64800].some(s=>at<s&&s<deadline)&&people.some((p,i)=>!clearHomeRoute({id:p.id,home:homes[i],seat:slot(destinations[i],card.pose),outbound:path(homes[i].anchorId,destinations[i]),inbound:path(destinations[i],homes[i].anchorId)},allowed,at,deadline)))continue;
            const trips=people.map((p,i)=>excursion(p.id,visitor?{floor:'1f',anchorId:'arrival_gate'}:homeAt(p,at),card,slots[(offset+i)%slots.length],at+i*1.5,stay,day,visitor,deadline));
            if(trips.some(t=>!t))continue;
            const e=trips.length===1?trips[0]:{...trips[0],people:trips.flatMap(t=>t.people),end:Math.max(...trips.map(t=>t.end)),performStart:Math.max(...trips.map(t=>t.performStart)),performEnd:Math.min(...trips.map(t=>t.performEnd)),
              resources:[...new Set(trips.flatMap(t=>t.resources))],floors:[...new Set(trips.flatMap(t=>t.floors))]};
            if(formalId)e.preMeetingId=formalId;
            // Everyone gets the full shared stay; FIFO returns follow the common end.
            if(people.length>1){
              // Depart 1.5s apart, then queue at actual shared door/path resources.
              // Waiting is a stationary state, never a timed zero-pixel walk.
              const used=[];
              for(const t of e.people){for(let i=0;i<t.out.length;i++){const leg=t.out[i],duration=leg.end-leg.start;let begin=leg.start,changed=true;
                  while(changed){changed=false;for(const other of used)if((leg.from===other.from||leg.from===other.to||leg.to===other.from||leg.to===other.to)&&begin<other.end+.2&&other.start<begin+duration){begin=other.end+.2;changed=true}}
                  const shift=begin-leg.start;if(shift)for(const l of t.out.slice(i)){l.start+=shift;l.end+=shift}used.push(leg);
                }}
              e.performStart=Math.max(...e.people.map(t=>t.out.at(-1).end));const commonEnd=e.performStart+stay;e.performEnd=commonEnd;
              let cursor=commonEnd;for(const t of e.people){const shift=cursor-t.back[0].start;for(const l of t.back){l.start+=shift;l.end+=shift}cursor=t.back.at(-1).end}
              e.end=Math.max(...e.people.map(t=>t.back.at(-1).end));
              e.group=people.map(p=>p.id);e.companion=placeTable.companions.find(r=>r.people.every(id=>e.group.includes(id)));
            }
            if(e.end>deadline||!visitor&&!withinCap(e)||visitor&&ledgerOverlaps(result,e.start,e.end).filter(q=>q.visitor&&overlap(q,e)).length>=2)continue;
            if(fill&&neighbours.some(q=>e.start<q.end+rules.cooldownSeconds&&q.start<e.end+rules.cooldownSeconds))continue;
            if(!reserve(e,ledger,allowed))continue;
            result.push(e);if(visitor)visitorUntil.set(people[0].id,e.end);
            if(!visitor&&people.length>1)for(const key of pairKeys(people))pairCounts.set(key,(pairCounts.get(key)||0)+1);
            if(!visitor)for(const p of people){if(!tripsByPerson.has(p.id))tripsByPerson.set(p.id,[]);tripsByPerson.get(p.id).push(e)}
            if(!visitor)for(const p of people){last.set(p.id,{end:e.end,card:card.id});if(!visits.has(p.id))visits.set(p.id,new Set());visits.get(p.id).add(card.id);
              if(people.length>1&&homeAt(p,at).floor!==card.floor)floorTrips.set(p.id,(floorTrips.get(p.id)||0)+1);
              const interval=rules.intervalByPerson?.[p.id]||rules.intervalSeconds;
              due.set(p.id,at+interval[0]+seed(day+'|due|'+p.id+at)%(interval[1]-interval[0]+1));
              lastFloor.set(homeAt(p,at).floor,at);
            }
            if(!visitor&&!fill)extendGathering(e);
            return true;
          }
        }
        return false;
      }
      // At most six fixed daily slots, one report per employee. Reserve the
      // chairman at his own seat for the whole round trip, so later outings
      // cannot leave a visitor reporting to an empty chair. Formal work wins.
      if(nightCatalog&&allowed.some(p=>p.id==='seongmin')){
        const reported=new Set(),chair=personById.get('seongmin');
        const candidates=physical.filter(p=>chairmanVoice[p.id]&&reportPlaces.some(c=>c.id==='chairman-report-'+p.id));
        for(let n=0;n<6;n++){
          const begin=33600+n*4800+seed(day+'|report-phase|'+n)%120;
          const ranked=candidates.filter(p=>!reported.has(p.id)).sort((a,b)=>seed(day+'|report-person|'+n+a.id)-seed(day+'|report-person|'+n+b.id));
          let booked=false;
          for(let at=begin;at<begin+1800&&!booked;at+=15)for(const p of ranked){
            if(reported.has(p.id))continue;
            const card=reportPlaces.find(c=>c.id==='chairman-report-'+p.id),home=homeAt(p,at);
            const stay=20+seed(day+'|report-stay|'+p.id)%41;
            const deadline=Math.min(64800,nextCommitment(p.id,at),nextCommitment('seongmin',at));
            if(deadline-at<stay)continue;
            for(const target of card.slots){
              const e=excursion(p.id,home,card,target,at,stay,day,null,deadline);if(!e)continue;
              const seat=slot(chair.home.anchorId,'sit'),nodes=path(chair.home.anchorId,chair.home.anchorId);
              e.report=p.id;e.people.push({id:chair.id,home:chair.home,seat,outbound:nodes,inbound:nodes,out:[],back:[]});
              e.resources=[...new Set([...e.resources,chair.home.anchorId])];
              if(!withinCap(e)||!reserve(e,ledger,allowed))continue;
              result.push(e);reported.add(p.id);
              for(const t of e.people){if(!tripsByPerson.has(t.id))tripsByPerson.set(t.id,[]);tripsByPerson.get(t.id).push(e);}
              booked=true;break;
            }
            if(booked)break;
          }
        }
      }
      for(let at=0;at<86400;at+=180){
        if(at>=32400&&at<64800)for(const formal of preMeetingEvents){
          if(formal.layer!==3||preMeeting.has(formal.id)||formal.start-at<120||formal.start-at>300)continue;
          preMeeting.add(formal.id);
          const people=formal.people.map(t=>physical.find(p=>p.id===t.id)).filter(Boolean).slice(0,2);
          if(people.length!==2||people.some(p=>at-(last.get(p.id)?.end??-Infinity)<rules.cooldownSeconds))continue;
          const card=places.find(c=>c.kind==='meeting'&&formal.people.every(t=>c.slots.includes(t.seat.anchor)));
          if(card)attempt(people,at,null,false,card,formal.id);
        }
        const busy=new Set(ledgerOverlaps(events,at,at+30).flatMap(e=>e.people.map(t=>t.id)));
        for(const floor of floors){
          const roster=rosterAt(floor.id,at);
          const needsFloorVisit=at>=32400&&at<64800&&roster.length>=3&&at-(lastFloor.get(floor.id)??-Infinity)>=BLOCK;
          const overdueSparse=p=>roster.length<3&&at>=32400&&at<64800&&at-(due.get(p.id)??at)>=600;
          const available=roster.filter(p=>(!busy.has(p.id)||overdueSparse(p))&&at-(last.get(p.id)?.end??-Infinity)>=rules.cooldownSeconds&&(at>=(due.get(p.id)??0)||needsFloorVisit));
          available.sort((a,b)=>(last.get(a.id)?.end??-1)-(last.get(b.id)?.end??-1)||seed(day+at+a.id)-seed(day+at+b.id));
          if(!available.length)continue;
          if(at>=32400&&at<70200&&unit(day+'|group|'+floor.id+at)<.55){
            const invitees=roster.filter(p=>!busy.has(p.id)&&at-(last.get(p.id)?.end??-Infinity)>=rules.cooldownSeconds);
            const availableIds=new Set(available.map(p=>p.id)),inviteeIds=new Set(invitees.map(p=>p.id));
            const pairs=companions.filter(r=>r.people.some(id=>availableIds.has(id))&&r.people.every(id=>inviteeIds.has(id))&&pairKeys(r.people.map(id=>({id}))).every(key=>(pairCounts.get(key)||0)<(placeTable?.behavior?.pairDailyMax||2)))
              .map(r=>({r,rank:-Math.log(Math.max(.000001,unit(day+at+r.people.join())))/((r.score-70+1)**2*(lunch(at)&&r.people.length===3?20:1))})).sort((a,b)=>a.rank-b.rank).map(p=>p.r);
            if(pairs.slice(0,lunch(at)?3:1).some(r=>attempt(r.people.map(id=>invitees.find(p=>p.id===id)),at)))continue;
          }
          // A failed geometry/booking never teleports or partially books anyone.
          for(const p of available){
            let booked=attempt([p],at);
            // Sparse floors have fewer free calendar gaps. Once overdue, try
            // nearby clock phases instead of synchronizing forever with the
            // 40-second formal microexpression cadence.
            if(!booked&&overdueSparse(p))for(const delay of [0,15,30,45])if(attempt([p],at+delay,null,true)){booked=true;break}
            if(booked)break;
          }
        }
        if(at>=32400&&at<64800)for(const delay of [60,120]){
          const time=at+delay;
          const stays=ledgerOverlaps(result,time,time+.001).filter(e=>!e.visitor&&gatheringPlace(e.card)&&e.performStart<time&&time<e.performEnd);
          for(const stay of stays){
            if(unit(day+'|join-opportunity|'+stay.id+'|'+time)>(lunch(time)?.8:.25))continue;
            const peers=physical.filter(p=>presentAt(p.id,time)&&time-(last.get(p.id)?.end??-Infinity)>=rules.cooldownSeconds);
            peers.sort((a,b)=>{
              const score=p=>(homeAt(p,time).floor===stay.card.floor?100:0)+Math.max(0,...stay.people.map(t=>relationshipScores.get(p.id+'|'+t.id)||0));
              return score(b)-score(a)||seed(day+time+a.id)-seed(day+time+b.id);
            });
            for(const p of peers.slice(0,3))if(attempt([p],time,null,false,stay.card))break;
          }
        }
      }
      // Repair only empty work-hour windows, using the same reserve() and ledger.
      // Check both preceding and following cooldowns because this pass inserts
      // into a completed day. Never truncate a stay to satisfy the lower bound.
      for(let start=32400;start<64800;start+=BLOCK)for(const floor of floors){
        const roster=rosterAt(floor.id,start);
        if(roster.length<3||result.some(e=>!e.visitor&&e.floors.includes(floor.id)&&e.start<start+BLOCK&&start<e.end))continue;
        let filled=false;
        for(let at=start;at<start+BLOCK&&!filled;at+=30)for(const p of roster){
          if((tripsByPerson.get(p.id)||[]).some(e=>at<e.end+rules.cooldownSeconds&&e.start<at+rules.cooldownSeconds+30))continue;
          if(attempt([p],at,null,true)){filled=true;break}
        }
      }
      // Leisure is frozen first. Errands fill only legal gaps in that same ledger.
      const errandLast=new Map(),errandDue=new Map(),errandTrips=[];
      const bookedOutings=new Map(physical.map(p=>[p.id,(tripsByPerson.get(p.id)||[]).slice().sort((a,b)=>a.start-b.start)]));
      function nextOuting(id,at){const list=bookedOutings.get(id)||[];let lo=0,hi=list.length;while(lo<hi){const mid=(lo+hi)>>>1;if(list[mid].end<=at)lo=mid+1;else hi=mid}return list[lo]?Math.max(at,list[lo].start):86400}
      const arrivalKeys=new Set(),arrivalKey=(anchor,time)=>anchor+'|'+Math.floor(time/600);
      for(const e of [...events,...result])for(const t of e.people)if(t.out.length)arrivalKeys.add(arrivalKey(t.seat.anchor,t.out.at(-1).end));
      const collaborative=new Set(['seoyun','yuri','gaeun','hani','yuna','sua']);
      const choices=new Map();
      for(const p of physical)choices.set(p.id,errandPlaces.filter(c=>!c.hostOnly&&c.floor===p.home.floor&&c.targetPerson!==p.id&&(c.errandKind!=='delivery'||c.room!==p.home.room)).map(c=>{
        const target=personById.get(c.targetPerson),score=target?(relationshipScores.get(p.id+'|'+target.id)||0):0;
        return {c,weight:c.errandKind==='colleague'?(target.home.room===p.home.room?4:2)*(1+score/25):1};
      }));
      const errandPhases=new Map(physical.map(p=>[p.id,seed(day+'|errand-phase|'+p.id)%90]));
      for(let tick=32400;tick<75600;tick+=90){
        for(const p of physical){
          const at=tick+errandPhases.get(p.id);
          if(at+60>75600)continue;
          if(at<(errandDue.get(p.id)??(32400+seed(day+'|errand-first|'+p.id)%540)))continue;
          // A future leisure booking is already frozen. Any errand extending
          // into it would fail the same actor reservation in reserve().
          const deadline=Math.min(at+60,nextCommitment(p.id,at),nextOuting(p.id,at));if(deadline-at<8)continue;
          const near=ledgerOverlaps(ledger,at,at+1);
          if(near.some(e=>e.people.some(t=>t.id===p.id)||e.card?.targetPerson===p.id))continue;
          const home=homeAt(p,at),previous=errandLast.get(p.id);
          const errandSeed=seed(day+'|errand|'+p.id+'|'+at+'|');
          const cards=choices.get(p.id).filter(({c})=>c.floor===home.floor&&c.id!==previous).map(({c,weight})=>{
            return {c,rank:-Math.log(Math.max(.000001,seedTail(errandSeed,c.id)/4294967296))/weight};
          }).sort((a,b)=>a.rank-b.rank);
          let booked=false;
          for(const {c}of cards){
            if(c.targetPerson&&(!allowed.some(q=>q.id===c.targetPerson)||!presentAt(c.targetPerson,at)||homeAt(personById.get(c.targetPerson),at).anchorId!==personById.get(c.targetPerson).home.anchorId||near.some(e=>e.people.some(t=>t.id===c.targetPerson&&t.seat.anchor!==t.home.anchorId))))continue;
            for(const target of c.slots){
              const stay=8+seed(day+'|errand-stay|'+p.id+at+c.id)%18;
              if(arrivalKeys.has(arrivalKey(target,at+pathDuration(path(home.anchorId,target)))))continue;
              if(![3600,25200,64800].some(s=>at<s&&s<deadline)&&blockedGeometry(p,home,target,at,deadline))continue;
              const e=excursion(p.id,home,c,target,at,stay,day,null,deadline);
              if(!e)continue;
              if(c.targetPerson&&homeAt(personById.get(c.targetPerson),e.end-.001).anchorId!==personById.get(c.targetPerson).home.anchorId)continue;
              const occupied=ledgerOverlaps(ledger,e.start,e.end);
              if(occupied.some(q=>q.card?.targetPerson===p.id||c.targetPerson&&q.people.some(t=>t.id===c.targetPerson&&t.seat.anchor!==t.home.anchorId)))continue;
              const active=ledgerOverlaps(errandTrips,e.start,e.end);
              if(active.filter(q=>q.card.floor===c.floor).length>=(c.floor==='2f'?3:2))continue;
              if(!reserve(e,ledger,allowed,occupied))continue;
              result.push(e);errandTrips.push(e);errandLast.set(p.id,c.id);
              arrivalKeys.add(arrivalKey(target,e.performStart));
              // Seeded cadence is shorter for collaborative personalities. Failed
              // bookings retry without shortening either a rest or a work stay.
              errandDue.set(p.id,at+360+seed(day+'|errand-due|'+p.id+at)%(collaborative.has(p.id)?241:541));
              booked=true;break;
            }
            if(booked)break;
          }
        }
      }
      // Two persistent public guests. Clock phases favour morning parcels,
      // lunch deliveries/coffee and afternoon appointments; reserve() still owns
      // capacities, target uniqueness, gate FIFO and every swept trajectory.
      for(let at=32400;at<72000;at+=20){
        const kinds=visitorKinds.filter(v=>(weekday||!v.weekdayOnly)&&v.hours.some(([a,b])=>at/3600>=a&&at/3600<b));
        const ranked=kinds.map(v=>({v,rank:-Math.log(Math.max(.000001,unit(day+'|guest-kind|'+at+v.kind)))/(v.kind==='courier'&&at<36000?4:v.kind==='rider'&&lunch(at)?5:['client','candidate'].includes(v.kind)&&at>=46800?3:1)})).sort((a,b)=>a.rank-b.rank);
        for(const id of ['visitor','visitor-2']){
          if((visitorUntil.get(id)||0)>at+1)continue;
          for(const {v}of ranked)if(attempt([{id}],at+1,v))break;
          break;
        }
      }
      // A host visits a real free approach node while the guest is stationary.
      // Both trajectories remain in the same reservation ledger; no host teleport.
      const hostErrands=new Map(),hostSlots=new Map();
      for(const id of placeTable?.behavior?.visitorHosts||[])hostErrands.set(id,result.filter(q=>q.card.kind==='errand'&&q.people.some(t=>t.id===id)).sort((a,b)=>a.start-b.start));
      for(const guest of result.filter(e=>e.visitor)){
        const destination=guest.people[0].seat,point=pixels([destination.x,destination.y]);
        const hosts=(placeTable?.behavior?.visitorHosts||[]).map(id=>personById.get(id)).filter(p=>p&&allowed.includes(p)&&homeAt(p,guest.performStart).floor==='1f');
        if(!hostSlots.has(destination.anchor))hostSlots.set(destination.anchor,[...anchors.values()].filter(a=>a.floor==='1f'&&a.room===anchors.get(destination.anchor).room&&a.type==='junction'&&(()=>{const q=pixels(visualPoint(a)),d=Math.hypot(q[0]-point[0],q[1]-point[1]);return d>=40&&d<=160})()));
        const slots=hostSlots.get(destination.anchor);
        let booked=false;
        for(const p of hosts){for(const target of slots){
          const at=guest.performStart,home=homeAt(p,at),duration=pathDuration(path(home.anchorId,target.id)),stay=Math.min(15,guest.performEnd-at-duration);
          if(stay<8)continue;
          const c=errandPlaces.find(c=>c.hostOnly&&c.slots[0]===target.id),e=c&&excursion(p.id,home,c,target.id,at,stay,day,null,Math.min(guest.performEnd,nextCommitment(p.id,at),at+60));
          const errands=hostErrands.get(p.id);
          if(!e||errands.some(q=>Math.abs(q.start-e.start)<360)||errands.filter(q=>q.start<e.start).at(-1)?.card.id===c.id||errands.find(q=>q.start>e.start)?.card.id===c.id)continue;
          if(arrivalKeys.has(arrivalKey(target.id,e.performStart)))continue;
          if(!e||!reserve(e,ledger,allowed))continue;
          e.guestId=guest.id;result.push(e);errands.push(e);errands.sort((a,b)=>a.start-b.start);arrivalKeys.add(arrivalKey(target.id,e.performStart));booked=true;break;
        }if(booked)break}
      }
      result.sort((a,b)=>a.start-b.start||a.id.localeCompare(b.id));
      if(blocks.size>=4)blocks.delete(blocks.keys().next().value);blocks.set(key,result);return result;
    }

    function speech(action,id,day){const override=action.actorOverrides?.[id],p=action.performance;
      const line=override?.speech||(Array.isArray(p.speech)?p.speech.find(s=>s.personId===id)?.line:p.speech)||action.title;
      return p.speechVariants?.length?p.speechVariants[seed(day+'|'+id+'|'+action.id+'|line')%p.speechVariants.length]:line;
    }
    function placeLine(card,id,day,event,t,seconds,firstLine){
      const pool=card.atByPerson?.[id]||card.at,key=day+'|'+id+'|'+event.start;
      const first=firstLine??pool[seed(key)%pool.length],arrival=t.out.at(-1).end,departure=t.back[0].start;
      // One switch at a deterministic midpoint, measured from this actor's
      // actual arrival (including FIFO waiting), without any timer/state.
      const switched=departure-arrival>90&&seconds>=arrival+(departure-arrival)/2;
      if(!switched)return first;
      const next=[...new Set([...pool,...card.at])].filter(line=>line!==first);
      return next.length?next[seed(key+'|next')%next.length]:first;
    }
    function snapshot(now,options={}){
      const kst=new Date(new Date(now).getTime()+32400000),day=kst.toISOString().slice(0,10),seconds=kst.getUTCHours()*3600+kst.getUTCMinutes()*60+kst.getUTCSeconds()+kst.getUTCMilliseconds()/1000;
      const events=plan(day,options),cancelled=options.cancelled||new Set(),blocked=new Set(options.summoned||[]);
      const late=isLate(seconds),evening=isEvening(seconds),presenceNote=late?'심야에도 함께해요 · 개발실과 라운지에 직원들이 남아 있어요':'';
      // Outings respect the complete frozen formal ledger, including suppressed events.
      const outings=blockPlan(day,Math.floor(seconds/BLOCK),events,options);
      if(!idleLedgers.has(outings))idleLedgers.set(outings,[...events,...outings]);const idleLedger=idleLedgers.get(outings);
      const since=options.chairmanSince==null?-Infinity:(options.chairmanSince-Date.parse(day+'T00:00:00+09:00'))/1000;
      const visibleOutings=cancelled.size||blocked.size||since!==-Infinity?outings.filter(e=>!cancelled.has(e.id)&&!cancelled.has(e.guestId)&&!e.people.some(t=>blocked.has(t.id))&&!blocked.has(e.card?.targetPerson)&&(!e.report||e.start>=since)):outings;
      const completedTeachers=events.filter(e=>e.performEnd<=seconds&&!cancelled.has(e.id)&&table.rules.hinaBalance.teacherActionIds.includes(e.actionId)).length;
      const selfiesBefore=events.filter(e=>e.start<seconds&&!cancelled.has(e.id)&&table.rules.hinaBalance.selfieActionIds.includes(e.actionId));
      const active=events.filter(e=>e.start<=seconds&&seconds<e.end&&!cancelled.has(e.id)&&!e.people.some(p=>blocked.has(p.id))&&(!table.rules.hinaBalance.selfieActionIds.includes(e.actionId)||completedTeachers>=selfiesBefore.length));
      const render=(p,event)=>{
        const t=event?.people.find(t=>t.id===p.id),action=actions.get(event?.actionId)||defaults,home=p.visitor?{floor:'1f',anchorId:'arrival_gate'}:homeAt(p,seconds);
        const state=t?stateAt(event,t,seconds,options.reducedMotion):{state:'AT_HOME',seat:slot(home.anchorId,p.id==='mir'?'stand':'sit'),floor:home.floor,position:null,walking:false};
        if(!state.seat)return null;
        const performing=event&&seconds>=event.performStart&&seconds<event.performEnd,card=event?.card;
        let plain=!event,line=p.id==='mir'||p.id==='seongmin'?speech(defaults,p.id,day):(late||evening&&lateWorkers.has(p.id))?'야근 중':evening?'퇴근 준비 중':speech(defaults,p.id,day);
        if(!event)line=workLines[p.id]||deskVoice[p.id]?.[0]||'자료 확인 중';
        const lounge=['lobby-nw','lobby-ne'].includes(home.anchorId)&&['yuna','minji'].includes(p.id);
        if(!event&&!p.visitor&&p.id!=='mir'&&p.id!=='seongmin'){
          const flavour=idleFlavour(day,p.id,home.floor,seconds,lounge,late||evening&&lateWorkers.has(p.id),idleLedger);
          if(flavour){line=flavour.line;plain=false;if(flavour.pose&&!options.reducedMotion)state.seat=slot(home.anchorId,flavour.pose)||state.seat}
          else if(lounge)line=late?'라운지에서 조용히 쉬는 중':'라운지에서 야근 이야기 중';
        }
        if(event){
          if(state.state==='GOING'){
            const destination=anchors.get(t.seat.anchor),place=places.find(c=>c.slots.includes(t.seat.anchor));
            const room=canon.floors.find(f=>f.id===destination.floor)?.rooms.find(r=>r.id===destination.room);
            const name=place?.kind==='window'?place.name:(room?.label||destination.label||action.title).split(' · ')[0];
            const partners=event.group?.filter(id=>id!==p.id).map(id=>persons.find(p=>p.id===id).name).join('·');
            line=p.visitor?event.visitor.go:(partners?partners+'와 ':'')+(card?.go||destination.floor.toUpperCase()+' '+name+' 가는 중');
          }
          else if(state.state==='RETURNING'){
            const voice=placeTable?.behavior?.travelVoice[p.id];
            line=p.visitor?'안녕히 계세요~':voice?.length?voice[Math.floor(event.start/90)%voice.length]:'자리로 돌아가는 중';
          }
          else if(state.state==='AT_PLACE'||t.seat.anchor===home.anchorId){
            line=event.report?(p.id==='seongmin'?'보고 기다리는 중':card.at[0]):p.visitor?event.visitor.at:card?placeLine(card,p.id,day,event,t,seconds):speech(action,p.id,day);
            if(event.group&&state.state==='AT_PLACE'){
              const partners=event.group.filter(id=>id!==p.id).map(id=>persons.find(p=>p.id===id).name).join('·'),location=card.at[0].split('에서')[0];
              line=seconds<event.performStart?location+'에서 '+partners+' 기다리는 중':seconds>=event.performEnd?location+'에서 '+partners+'와 나눈 이야기 정리 중':partners+'와 '+location+'에서 '+(event.companion?.topic||'잠깐 수다')+' 중';
            }
          }
        }
        return {id:p.id,...state,visitor:!!p.visitor,...(p.visitor?event.visitor:{}),idle:!event||!!card,plain,stroll:!!card&&!p.visitor&&!options.reducedMotion,home:p.home?.floor||'1f',
          pose:state.walking?(Math.floor(seconds*5)%2?'walk-a':'walk-b'):state.seat.posture,activity:p.visitor?'visit':event&&!card?(action.personalNonWork?'rest':action.layer===3?'meeting':'work'):lounge?'rest':'work',
          actionId:performing&&!card?action.id:'base-work',eventId:card?undefined:event?.id,outingId:card?event.id:undefined,groupIds:event?.group,placeId:card?.id,targetAnchor:t?.seat.anchor,line,
          emoji:performing&&!card?(action.actorOverrides?.[p.id]?.emoji||action.performance.emoji):'',personalNonWork:action?.personalNonWork};
      };
      const entries=persons.filter(p=>(p.id!=='seongmin'||options.chairmanPresent)&&(!options.presentIds||options.presentIds.includes(p.id))&&!blocked.has(p.id)&&presentAt(p.id,seconds)).map(p=>render(p,
        active.find(e=>e.people.some(t=>t.id===p.id))||visibleOutings.find(e=>!e.visitor&&e.start<=seconds&&seconds<e.end&&e.people.some(t=>t.id===p.id)))).filter(Boolean);
      for(const pair of placeTable?.behavior?.deskPairs||[]){
        const peers=pair.people.map(id=>entries.find(p=>p.id===id));
        if(peers.some(p=>!p||p.eventId||p.outingId||p.state!=='AT_HOME')||peers[0].floor!==peers[1].floor||gap(peers[0],peers[1])>350)continue;
        const k=Math.floor(seconds/BEAT),j=Array.from({length:Math.ceil(ACTIVE_BEATS)},(_,i)=>k-i).find(j=>beatPick(day,peers[0].floor,j)===pair.people[0]&&Math.floor(j/MIN_CYCLE)%7===seed(pair.people.join())%7);
        if(j==null||seconds>=j*BEAT+ACTIVE_BEATS*BEAT||ledgerOverlaps(idleLedger,j*BEAT-5,j*BEAT+ACTIVE_BEATS*BEAT+2).some(e=>e.people.some(t=>pair.people.includes(t.id))))continue;
        peers.forEach((p,i)=>{p.line=pair.lines[i];p.plain=false;p.deskPartner=pair.people[1-i]});
      }
      // Reuse deskPartner for a two-line exchange, only at the actual approach
      // and the chairman's real home. No dialogue during travel or waiting.
      for(const e of visibleOutings)if(e.report&&e.performStart<=seconds&&seconds<e.performEnd){
        const staff=entries.find(p=>p.id===e.report),chair=entries.find(p=>p.id==='seongmin');
        if(!staff||!chair||staff.state!=='AT_PLACE'||chair.seat.anchor!=='ceo-reserved'||staff.outingId!==e.id||chair.outingId!==e.id)continue;
        staff.reportTopic=chairmanVoice[staff.id].topic;staff.behaviorKind='chairman-report';
        // First half names the report; second half is a short reply.
        if(seconds>=(e.performStart+e.performEnd)/2)staff.line=chairmanVoice[staff.id].reply;
        chair.line='좋아요, 이대로 갑시다';chair.plain=staff.plain=false;
        chair.deskPartner=staff.id;staff.deskPartner=chair.id;
      }
      const arrival=options.chairmanArrivalAt,arrivalSeconds=(arrival-Date.parse(day+'T00:00:00+09:00'))/1000;
      if(options.chairmanPresent&&entries.some(p=>p.id==='seongmin')&&Number.isFinite(arrivalSeconds)&&arrivalSeconds>=0&&arrivalSeconds<86400&&seconds>=arrivalSeconds&&seconds<arrivalSeconds+10){
        let cached=greetingCache.get(outings);if(!cached){cached=new Map();greetingCache.set(outings,cached)}
        const greetingKey=arrival+'|'+since;
        if(!cached.has(greetingKey)){
          const duration=5+seed(day+'|greeting|'+arrival)%6,atArrival=snapshot(new Date(arrival),{chairmanPresent:true,presentIds:options.presentIds,chairmanSince:options.chairmanSince}),chair=atArrival.entries.find(p=>p.id==='seongmin');
          const people=chair?.floor==='4f'?atArrival.entries.filter(p=>p.id!=='seongmin'&&chairmanVoice[p.id]?.greet&&p.floor==='4f'&&p.state==='AT_HOME'&&!p.eventId&&!p.outingId&&gap(p,chair)<=650&&!ledgerOverlaps(idleLedger,arrivalSeconds,arrivalSeconds+duration).some(e=>e.people.some(t=>t.id===p.id))).sort((a,b)=>gap(a,chair)-gap(b,chair)||a.id.localeCompare(b.id)).slice(0,1+seed(day+'|greeters|'+arrival)%2).map(p=>p.id):[];
          if(cached.size>=8)cached.delete(cached.keys().next().value);cached.set(greetingKey,{duration,people});
        }
        const greeting=cached.get(greetingKey);
        if(seconds<arrivalSeconds+greeting.duration)for(const id of greeting.people){const p=entries.find(p=>p.id===id);if(!p||p.eventId||p.outingId||p.state!=='AT_HOME')continue;p.line=chairmanVoice[id].greet;p.pose='standing';p.seat=slot(p.seat.anchor,'stand');p.plain=false;p.behaviorKind='chairman-greeting';p.greetingUntil=arrival+greeting.duration*1000;delete p.deskPartner;}
      }
      for(const p of entries){
        if(!p.outingId||p.state!=='AT_PLACE')continue;
        const e=visibleOutings.find(e=>e.id===p.outingId),card=e.card;
        const signatures=placeTable?.behavior?.signatures[p.id]?.filter(s=>s.place===card.id)||[];
        if(!p.groupIds&&signatures.length){const signature=signatures[seed(day+'|signature|'+p.id+e.start)%signatures.length],t=e.people.find(t=>t.id===p.id);p.line=placeLine(card,p.id,day,e,t,seconds,card.at[0].split('에서')[0]+'에서 '+signature.task);p.behaviorKind=signature.id}
        if(placeTable?.behavior?.gathering.kinds.includes(card.kind)&&card.slots.length>=2){
          const peers=entries.filter(q=>q.id!==p.id&&q.state==='AT_PLACE'&&q.placeId===card.id&&card.slots.includes(q.seat.anchor)).sort((a,b)=>a.id.localeCompare(b.id));
          if(peers.length){
            const boundaries=visibleOutings.filter(q=>!q.visitor&&q.card.id===card.id).flatMap(q=>q.people.flatMap(t=>[t.out.at(-1).end,t.back[0].start])).filter(t=>e.performStart<t&&t<=seconds).length;
            const phrase=card.gatheringPhrases?.[boundaries%card.gatheringPhrases.length]||'수다 중';
            p.gatheringIds=[p.id,...peers.map(q=>q.id)].sort();p.line=card.at[0].split('에서')[0]+'에서 '+peers.map(q=>personById.get(q.id).name).join('·')+'이랑 '+phrase;p.behaviorKind='gathering';
          }
        }
        // Social words retain the actual companions, but their place phrase
        // also changes once during a long stay, using the same arrival clock.
        const t=e.people.find(t=>t.id===p.id),arrival=t.out.at(-1).end,departure=t.back[0].start;
        if((p.groupIds||p.gatheringIds)&&departure-arrival>90&&seconds>=(arrival+departure)/2&&seconds>=e.performStart&&seconds<e.performEnd){
          const ids=(p.gatheringIds||p.groupIds).filter(id=>id!==p.id);
          p.stayLine=placeLine(card,p.id,day,e,t,seconds);p.line=ids.map(id=>personById.get(id).name).join('·')+'와 '+p.stayLine;
        }
      }
      const shownLines=new Map();
      const claim=p=>{let lines=shownLines.get(p.floor);if(!lines){lines=new Set();shownLines.set(p.floor,lines)}lines.add(p.line);return lines};
      for(const p of entries)if(p.eventId||p.outingId)claim(p);
      for(const p of entries)if(!p.eventId&&!p.outingId){
        let lines=shownLines.get(p.floor);if(!lines){lines=new Set();shownLines.set(p.floor,lines)}
        if(lines.has(p.line)){
          const person=personById.get(p.id),home=homeAt(person,seconds),lounge=['lobby-nw','lobby-ne'].includes(home.anchorId),kind=lounge?late?'loungeLate':'lounge':late?'late':evening?'evening':'day';
          const alternatives=lounge?idlePools[kind].map(v=>v[0]):[...(deskVoice[p.id]||[]),...idlePools[kind].map(v=>v[0])];
          const offset=seed(day+'|'+p.id+'|'+Math.floor(seconds/(BEAT*MIN_CYCLE)))%alternatives.length;
          for(let n=0;n<alternatives.length;n++){const line=alternatives[(offset+n)%alternatives.length];if(!lines.has(line)){p.line=line;break}}
        }
        lines.add(p.line);
      }
      for(const p of entries)if(!p.plain&&!p.eventId&&!p.outingId&&p.behaviorKind!=='chairman-greeting'){
        const personal=deskVoice[p.id]?.indexOf(p.line);
        p.behaviorKind=p.deskPartner?'desk-pair-'+[p.id,p.deskPartner].sort().join('-'):personal>=0?'desk-'+p.id+'-'+personal:'idle-'+p.line;
      }
      const guests=visibleOutings.filter(e=>e.visitor&&e.start<=seconds&&seconds<e.end);
      const visitors=guests.map(guest=>render({id:guest.people[0].id,visitor:true},guest)).filter(p=>p&&(!options.reducedMotion||p.state==='AT_PLACE'));
      for(const guest of guests){const visitor=visitors.find(v=>v.id===guest.people[0].id);if(visitor?.state==='AT_PLACE')for(const p of entries){const host=visibleOutings.find(e=>e.id===p.outingId&&e.guestId===guest.id);if(host&&p.state==='AT_PLACE'){p.visitorPartner=guest.id;visitor.hostId=p.id;visitor.line=visitor.at=placeTable.behavior.visitorReply}}}
      for(const p of [...entries,...visitors]){p.shortLine=shortLine(p.line);if(p.deskPartner&&(p.id==='seongmin'||p.deskPartner==='seongmin')){const peer=entries.find(q=>q.id===p.deskPartner);if(peer&&peer.floor===p.floor)p.facing=peer.seat.x<p.seat.x?'left':'right';}}
      return {day,minutes:seconds/60,seconds,entries,visitors,events:active,presenceNote};
    }

    return Object.freeze({plan,snapshot,seed,slot,actions,windows,presentAt,homeAt,blockPlan,stateAt,resourceIntervals,errandPlaces,reportPlaces,shortLine,identity:table.identity});
  }
  // Read-only label geometry, shared by the persistent renderer and Node tests.
  function statusLabelPriority(data){
    if(data.partner||data.greeting==='true'||data.speaking==='true')return 3;
    if(data.walking==='true'||data.plain==='false'||data.called==='true'||data.activity==='meeting')return 2;
    return 1;
  }
  function phoneStatusLine(line){
    const short=scheduler?.shortLine(line,8)||line;
    if(/좋아요/.test(short))return '좋아요';
    if(/보고/.test(short))return short.replace(/^회장님께 /,'').replace(/ 중$/,'').replace(/\s/g,'');
    const words=[[/인사/,'인사'],[/이동|가는|복귀/,'이동'],[/커피/,'커피'],[/대기|차례/,'대기'],[/검증|테스트|결과/,'검증'],[/설계|검토/,'검토'],[/코드|버그|수정/,'수정'],[/문장|콘텐츠/,'집필'],[/수치|분석/,'분석'],[/조율|일정/,'조율'],[/정리|기록|자료|메모/,'정리'],[/대화|이야기|수다/,'대화'],[/휴식|쉬는|풍경/,'휴식'],[/확인|점검|흐름|예산|비용/,'확인']];
    return words.find(([pattern])=>pattern.test(short))?.[1]||'업무';
  }
  function placeStatusLabels(floor,groups,obstacles=[]){
    const gap=groups.some(g=>g.compact)?.5:2,ordered=groups.slice().sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
    // Every sprite (including one's own face) is reserved before any label.
    // Actual sprite bounds include the partner turn; reserve idle motion too.
    const sprites=groups.map(g=>{const r=g.sprite?.width?g.sprite:g.actor,pad=Math.max(g.compact?1:2,r.height*.02);return {left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad}});
    // Floating-point edge arithmetic must not reject an exactly 2px gap.
    const overlaps=(a,b)=>a.left<b.right+gap-1e-7&&a.right+gap>b.left+1e-7&&a.top<b.bottom+gap-1e-7&&a.bottom+gap>b.top+1e-7;
    let best=null,bestScore=null;
    const fixed=[...obstacles,...sprites],pools=new Map(ordered.map(g=>[g.id,new Map()]));
    const phone=groups.some(g=>g.compact),value=s=>phone?[s[0],s[0]+s[1]+s[2],s[1],s[3]]:s;
    const compare=(a,b)=>{a=value(a);b=value(b);for(let i=0;i<4;i++)if(a[i]!==b[i])return b[i]-a[i];return 0};
    const positions=(g,b)=>{if(g.compact)return {name:{left:b.left,top:b.top},status:null};const d=floor.width<=600?0:gap;return b.inline?{name:{left:b.left,top:b.top},status:{left:b.left+g.name.width+d,top:b.top}}:{name:{left:b.left+(b.width-g.name.width)/2,top:b.top+g.status.height+d},status:{left:b.left+(b.width-g.status.width)/2,top:b.top}}};
    // Repacking may change priority order within nearby lanes, never send a
    // person's labels to a distant desk just to raise the visible count.
    for(let mode=0;mode<9;mode++){
    const reserved=[...obstacles,...sprites],result=new Map(),score=[0,0,0,0];
    const order=mode<5?ordered:ordered.slice().sort((a,b)=>b.priority-a.priority||(mode<7?(a.actor.left-b.actor.left)*(mode%2?1:-1):(a.actor.top-b.actor.top)*(mode%2?1:-1))||a.id.localeCompare(b.id));
    for(const g of order){
      let chosen=null,rank=Infinity;
      const joinGap=floor.width<=600?0:gap;
      for(const inline of (g.compact?[false]:[false,true])){
      const width=g.compact?g.name.width:inline?g.name.width+joinGap+g.status.width:Math.max(g.name.width,g.status.width),height=g.compact?g.name.height:inline?Math.max(g.name.height,g.status.height):g.name.height+joinGap+g.status.height;
      const head=g.sprite?.width?g.sprite:g.actor,headX=(head.left+head.right)/2;
      const left=Math.max(floor.left+gap,Math.min(g.actor.left+g.actor.width/2-width/2,floor.right-gap-width));
      const top=g.actor.top-gap-height,candidates=[];
      const reachX=Math.max(g.actor.width*1.5,floor.width<=600?96:100),reachY=Math.max(g.actor.height*2,64);
      const add=(x,y)=>{x=Math.max(floor.left+gap,Math.min(x,floor.right-gap-width));y=Math.max(floor.top+gap,Math.min(y,floor.bottom-gap-height));
        if(g.compact&&Math.hypot(x+width/2-headX,y+height/2-head.top)>27.5+1e-7)return;
        if(Math.abs(x+width/2-(g.actor.left+g.actor.width/2))>reachX||y+height<g.actor.top-reachY||y>g.actor.bottom+reachY)return;
        const below=Math.max(0,y+height-g.actor.top);candidates.push({left:x,right:x+width,top:y,bottom:y+height,width,height,inline,cost:(x-left)**2+(y-top)**2+below*below*2+(inline?400:0)})};
      // Above/below and either side keep each person's two labels together.
      add(left,top);add(left,g.actor.bottom+gap);
      add(g.actor.left-gap-width,top);add(g.actor.right+gap,top);
      add(g.actor.left-gap-width,g.actor.top);add(g.actor.right+gap,g.actor.top);
      // Crowded floors: search horizontal lanes as well as vertical lanes.
      // Boundaries are candidates too, so narrow maps lose no edge space.
      const xs=[floor.right-gap-width,left],ys=[floor.bottom-gap-height,Math.max(floor.top+gap,top)];
      if(g.compact){for(let delta=-28;delta<=28;delta+=4){xs.push(headX-width/2+delta);ys.push(head.top-height/2+delta)}}
      else{for(let x=floor.left+gap;x<=floor.right-gap-width;x+=width+gap)xs.push(x);
      for(let y=floor.top+gap;y<=floor.bottom-gap-height;y+=height+gap)ys.push(y);}
      // Fit around irregular mascot/label edges instead of wasting a whole grid cell.
      for(const r of reserved){xs.push(r.right+gap,r.left-gap-width);ys.push(r.bottom+gap,r.top-gap-height)}
      for(const x of new Set(xs))for(const y of new Set(ys))add(x,y);
      for(const b of candidates){const value=mode&&mode<5?(mode<=2?b.top:-b.bottom)*(floor.width+1)+(mode%2?b.left:-b.right):b.cost;
        if(b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!fixed.some(r=>overlaps(b,r)))pools.get(g.id).set([b.left,b.top,b.inline].join(','),b);
        if(value<rank&&b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!reserved.some(r=>overlaps(b,r))){chosen=b;rank=value}}
      }
      if(chosen){score[3-g.priority]++;score[3]-=chosen.cost;reserved.push(chosen);result.set(g.id,positions(g,chosen))}
      else result.set(g.id,null);
    }
    const better=!bestScore||compare(score,bestScore)<0;
    if(better){best=result;bestScore=score}
    if(score[0]+score[1]+score[2]===groups.length)break;
    }
    // A bounded search repairs greedy blocking on crowded floors, using only
    // the same nearby, sprite-safe candidates. No global/remote fallback.
    if(bestScore[0]<ordered.filter(g=>g.priority===3).length||bestScore[0]+bestScore[1]+bestScore[2]<Math.ceil(groups.length*(floor.width<=600?.7:.85))){
      let beam=[{boxes:[],result:new Map(),score:[0,0,0,0]}];
      for(const g of ordered){
        const pool=[...pools.get(g.id).values()].sort((a,b)=>a.cost-b.cost),next=[];
        for(const state of beam){
          const legal=pool.filter(b=>!state.boxes.some(r=>overlaps(b,r)));
          const options=new Set(legal.slice(0,8));
          for(const axis of ['left','top']){const sorted=legal.slice().sort((a,b)=>a[axis]-b[axis]);for(const b of [...sorted.slice(0,2),...sorted.slice(-2)])options.add(b)}
          for(const b of [null,...options]){const score=state.score.slice(),result=new Map(state.result);result.set(g.id,b?positions(g,b):null);if(b){score[3-g.priority]++;score[3]-=b.cost}next.push({boxes:b?[...state.boxes,b]:state.boxes,result,score})}
        }
        next.sort((a,b)=>compare(a.score,b.score));beam=next.slice(0,phone?64:32);
      }
      if(beam.length&&compare(beam[0].score,bestScore)<0)best=beam[0].result;
    }
    // A suppressed phone pill keeps the existing name slot as a tiny status dot.
    // Dots use the same head radius and never displace a conversation label.
    const occupied=[...fixed];
    for(const g of ordered){const p=best.get(g.id);if(!p)continue;if(g.compact)occupied.push({left:p.name.left,right:p.name.left+g.name.width,top:p.name.top,bottom:p.name.top+g.name.height})}
    for(const g of ordered.filter(g=>g.compact&&!best.get(g.id))){
      const head=g.sprite?.width?g.sprite:g.actor,x=(head.left+head.right)/2,candidates=[];
      for(let dx=-27;dx<=27;dx+=3)for(let dy=-27;dy<=27;dy+=3){if(Math.hypot(dx,dy)>27.5)continue;const b={left:x+dx-2.5,right:x+dx+2.5,top:head.top+dy-2.5,bottom:head.top+dy+2.5,cost:dx*dx+dy*dy};if(b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!occupied.some(r=>overlaps(b,r)))candidates.push(b)}
      candidates.sort((a,b)=>a.cost-b.cost||a.top-b.top||a.left-b.left);const dot=candidates[0];
      if(dot){best.set(g.id,{name:{left:dot.left,top:dot.top},status:null,dot:true});occupied.push(dot)}
    }
    return best;
  }
  const scheduler=canon&&actionTable?createScheduler(actionTable):null;
  function snapshot(now=new Date(),options={}){
    const scheduled=scheduler?.snapshot(now,options),date=new Date(new Date(now).getTime()+32400000),day=date.toISOString().slice(0,10),minutes=date.getUTCHours()*60+date.getUTCMinutes();
    const entries=scheduled?.entries||floors.flatMap(f=>f.residents.map(id=>({id,home:f.id,floor:f.id,activity:'work',seat:homeSeat(id),actionId:'base-work',line:'자료 확인 중'})));
    return {day,minutes,...scheduled,onBreak:false,onMeeting:false,floors:floors.map(f=>{const people=entries.filter(p=>p.floor===f.id);return {...f,people,work:people.filter(p=>p.activity!=='rest').length,rest:people.filter(p=>p.activity==='rest').length,...projection(people,Math.max(6,f.residents.length))}})};
  }

  function profile(id){return ({daon:"./assets/profiles/thumb/hani-profile-daon-v2-256.webp",yoonseul:"./assets/profiles/thumb/hani-profile-yoonseul-v2-256.webp",sua:"./assets/profiles/thumb/hani-profile-sua-id-256.webp"})[id]||`./assets/profiles/thumb/hani-profile-${id}-256.webp`}
  // Both densities share proportional atlas/cell/pivot coordinates and one loader.
  function spriteSource(id,entry){return entry.scale===3?'./assets/sprites-v3/'+entry.file:({daon:"./assets/sprites-v2/daon-v2.webp",yoonseul:"./assets/sprites-v2/yoonseul-v2.webp"})[id]||'./assets/sprites-v2/'+entry.file}
  // Read-only app signals; the caller installs one shared passive input callback
  // and reuses the office update/visibility cycle. No persistence or timer.
  function createPresence({now,locked,visible,override}){
    const grace=600000;let lastInteraction=now(),hiddenSince=null,present=!locked()&&visible(),previous=false,absentSince=null,chairmanSince=null,chairmanArrivalAt=null,greetedDay='';
    return {interact(){lastInteraction=now()},read(){
      const time=now(),external=override(),shown=visible();
      if(shown)hiddenSince=null;else if(hiddenSince===null)hiddenSince=time;
      if(external!==undefined&&external!==null)present=external.chairman==='active';
      // A login lock is an immediate exclusion; inactivity/hidden use 10 minutes.
      else if(locked())present=false;
      else if(shown)present=time-lastInteraction<grace;
      else if(time-hiddenSince>=grace)present=false;
      const day=new Date(time+32400000).toISOString().slice(0,10);
      if(present&&!previous){chairmanSince=time;if(greetedDay!==day||absentSince!==null&&time-absentSince>=grace){chairmanArrivalAt=time;greetedDay=day;}else chairmanArrivalAt=null;}
      if(!present&&previous){absentSince=time;chairmanArrivalAt=null;}
      previous=present;
      return present?{chairmanPresent:true,chairmanSince,chairmanArrivalAt}:{chairmanPresent:false};
    }};
  }
  globalThis.HaniBuildingScene=Object.freeze({floors,snapshot,projection,profile,spriteSource,seatMaps,deskSurfaces,homeSeat,assignSeats,actionPool,bubble,canon,art,visualPoint,anchors,route,deskPropArt:DESK_PROP_ART,legacySeatMaps,legacySurfaces,scheduler,createScheduler,createPresence,labels:Object.freeze({priority:statusLabelPriority,place:placeStatusLabels,short:phoneStatusLine}),places:Object.freeze([...places,...(scheduler?.errandPlaces||[]),...(scheduler?.reportPlaces||[])]),tapLines:Object.freeze({bucket:tapBucket,validate:validTapBank,create:createTapLines})});
})();
/* Read-only Living Office. The Agent Case renderer remains the sole owner of requests, answers and decisions. */
(() => {
  "use strict";
  const root=document.getElementById("haniOfficeLive"),map=document.getElementById("haniOfficeMap");
  if(!root||!map)return;
  const officePresence=HaniBuildingScene.createPresence({now:()=>Date.now(),locked:()=>!document.getElementById('app')||document.getElementById('app').classList.contains('login-locked'),visible:()=>document.visibilityState==='visible',override:()=>window.HaniOfficePresence});
  for(const type of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(type,officePresence.interact,{passive:true});
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
  function spriteId(actor){return actor.dataset.sprite||visualIdentity[actor.dataset.person]?.spriteId||actor.dataset.person}
  function pose(actor,name){
    const sprite=actor.querySelector('.hani-office-sprite'),entry=spriteEntries.get(spriteId(actor));
    actor.dataset.pose=name;
    if(actor.dataset.avatar!=='v2'||!entry)return;
    const f=entry.frames.find(f=>f.name===name)||entry.frames[0];
    sprite.style.backgroundPosition=(f.rect[0]/(entry.atlas[0]-entry.cell[0])*100)+'% '+(f.rect[1]/(entry.atlas[1]-entry.cell[1])*100)+'%';
    actor.style.setProperty('--actor-pivot-x',String(-f.pivot[0]/entry.cell[0]));actor.style.setProperty('--actor-pivot-y',String(-f.pivot[1]/entry.cell[1]));
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
    spriteCache.get(id).then(loaded=>{if(!loaded)return;spriteEntries.set(id,loaded);actor.style.setProperty('--idle-pivot-x',(loaded.frames[0].pivot[0]/loaded.cell[0]*100)+'%');actor.style.setProperty('--idle-pivot-y',(loaded.frames[0].pivot[1]/loaded.cell[1]*100)+'%');actor.dataset.avatar='v2';actor.dataset.spriteScale=String(loaded.scale||1);actor.style.setProperty('--sprite-ratio',String(loaded.cell[0]/loaded.cell[1]));sprite.className='hani-office-sprite';sprite.style.backgroundImage='url("'+HaniBuildingScene.spriteSource(id,loaded)+'")';sprite.style.backgroundSize=(loaded.atlas[0]/loaded.cell[0]*100)+'% '+(loaded.atlas[1]/loaded.cell[1]*100)+'%';pose(actor,actor.dataset.pose||'sitting');onLoad?.()});
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
  // Batch reset -> one geometry read per node -> pure packing -> batch commit.
  // Name and status travel together; actor coordinates and foot pivots never move.
  function fitStatusLabels(){
    const floor=map.getBoundingClientRect?.();if(!floor?.width)return;
    const visible=[...actors.values()].filter(a=>!a.hidden),compact=matchMedia('(max-width:600px)').matches;
    const rows=visible.map(actor=>({actor,name:actor.querySelector('.hani-office-name'),status:actor.querySelector('.hani-office-status')}));
    for(const {actor,name,status}of rows){
      statusDot(actor);
      actor.dataset.labelMode=compact?'pill':'separate';
      actor.officeCompact.textContent=compact?'·'+HaniBuildingScene.labels.short(status.dataset.full):'';
      name.title=actor.dataset.name+' · '+status.dataset.full;name.setAttribute('aria-label',name.title);
      for(const [kind,node]of [['name',name],['status',status]]){node.style.setProperty('--'+kind+'-x','0px');node.style.setProperty('--'+kind+'-y','0px');node.style.visibility='';node.hidden=false;}
      status.textContent=status.dataset.full;status.hidden=compact;
    }
    const groups=rows.map(({actor,name,status})=>({id:actor.dataset.person,compact,priority:HaniBuildingScene.labels.priority(actor.dataset),actor:actor.getBoundingClientRect(),sprite:actor.querySelector('.hani-office-sprite').getBoundingClientRect(),name:name.getBoundingClientRect(),status:status.getBoundingClientRect()}));
    // Reserve the separate mascot owner's actual visible sprite boxes.
    const obstacles=[];
    for(const node of root.querySelectorAll('.hani-desk-mascots:not([hidden]) .hani-desk-mascot[data-ready="true"]')){const r=node.getBoundingClientRect();if(r.width&&r.height)obstacles.push(r)}
    const placements=HaniBuildingScene.labels.place(floor,groups,obstacles);
    for(const {actor}of rows)if(compact)actor.dataset.labelMode=placements.get(actor.dataset.person)?.dot?'dot':'pill';
    for(let i=0;i<rows.length;i++)for(const kind of ['name','status']){
      const node=rows[i][kind],base=compact&&placements.get(groups[i].id)?.dot?node.getBoundingClientRect():groups[i][kind],p=placements.get(groups[i].id)?.[kind];
      node.officeLabelPlacement=p?{dx:p.left-base.left,dy:p.top-base.top}:null;node.style.visibility=p?'':'hidden';
      if(p){node.style.setProperty('--'+kind+'-x',(p.left-base.left)+'px');node.style.setProperty('--'+kind+'-y',(p.top-base.top)+'px')}
    }
    // Readiness is committed only after every label's offset and visibility.
    map.dataset.labelsReady=map.dataset.floor;map.dataset.labelsAt=String(Date.now());
  }
  if(buildingChairmanSlot())people.push(['seongmin','회장님',null,0]);
  // Two persistent 1F guest slots, never recreated during a visit.
  if(HaniBuildingScene.scheduler)people.push(['visitor','방문객',null,0],['visitor-2','방문객',null,0]);
  function buildingChairmanSlot(){return HaniBuildingScene.scheduler?.slot('ceo-reserved')}
  for(const [key,name,group,row] of people){
    const actor=document.createElement("div");actor.className="hani-office-actor";actor.dataset.person=key;actor.dataset.name=name;actor.dataset.seat=(HaniBuildingScene.homeSeat(key)||buildingChairmanSlot()).id;actor.dataset.spot="seat";
    const sprite=document.createElement('div');sprite.className='hani-office-sprite';sprite.dataset.row=String(row);actor.officeLegacy={group,row};
    const status=document.createElement('span');status.className='hani-office-status';const tag=document.createElement('small');tag.className='hani-office-name';
    const dot=document.createElement('span'),icon=document.createElement('span'),tagName=document.createElement('span'),compactLine=document.createElement('span');dot.className='hani-office-status-dot';dot.setAttribute('role','img');icon.className='hani-office-activity-icon';icon.setAttribute('aria-hidden','true');icon.hidden=true;compactLine.className='hani-office-compact-line';tagName.textContent=name.split(' · ').at(-1);tag.append(dot,icon,tagName,compactLine);actor.officeName=tagName;actor.officeCompact=compactLine;
    const prop=document.createElement('span');prop.className='hani-office-prop';prop.setAttribute('aria-hidden','true');actor.append(sprite,tag,status,prop);actor.setAttribute('role','button');actor.tabIndex=0;actor.dataset.avatar='pending';actorLayer.append(actor);actors.set(key,actor);
    const rhythm=HaniBuildingScene.scheduler?.seed('idle-motion|'+key)||row;actor.style.setProperty('--idle-duration',(3.6+rhythm%29/10)+'s');actor.style.setProperty('--idle-delay',(-rhythm%67/10)+'s');
  }
  // One scene host; actors remain mounted and only their floor/position changes.
  const building=HaniBuildingScene,tabs=root.querySelector(".hani-building-tabs"),floorLabel=document.createElement("span"),overflowChip=document.createElement("span"),floorButtons=new Map(),backgroundCache=new Map();
  const roster=document.createElement("ul");roster.className="hani-building-roster";roster.setAttribute("aria-label","현재 층 직원과 활동");root.querySelector(".hani-office-scroll").after(roster);for(const actor of actors.values()){const row=document.createElement("li"),name=document.createElement("b"),text=document.createElement("span");name.textContent=actor.dataset.name;row.append(name,text);roster.append(row);actor.officeRow=row;actor.officeRowName=name;actor.officeText=text}
  const actorBubble=document.createElement('div'),bubbleLine=document.createElement('p'),profileLink=document.createElement('a');
  actorBubble.className='hani-office-character-bubble';actorBubble.hidden=true;actorBubble.setAttribute('aria-live','polite');actorBubble.setAttribute('aria-atomic','true');profileLink.textContent='프로필 ↗';profileLink.href='#organization/people';actorBubble.append(bubbleLine,profileLink);map.append(actorBubble);
  const tapLines=building.tapLines.create(building.canon?.people||window.HaniOrganizationRoster?.people||[]);
  let bubblePerson=null,bubbleSerial=0,bubbleSelection=null,pendingTap=null,cancelled=new Set(),cancelledDay='',meetingStartedAt=0;
  function cancelScheduledDuringMeeting(now=new Date()){
    if(!meeting||!building.scheduler)return;
    const day=new Date(now.getTime()+32400000).toISOString().slice(0,10),midnight=Date.parse(day+'T00:00:00+09:00');
    const presence=officePresence.read();
    for(const event of building.scheduler.plan(day,presence))if(midnight+event.start*1000<=now.getTime()&&midnight+event.end*1000>=meetingStartedAt)cancelled.add(event.id);
  }
  function actionRunning(actor){return meeting||!!actor.officeTravel||actor.dataset.walking==='true'||!!actor.dataset.event||actor.dataset.action&&actor.dataset.action!=='base-work'}
  function bubbleText(actor){
    if(bubbleSelection&&!actionRunning(actor)){const speaker=actors.get(bubbleSelection.speaker);return (speaker?.dataset.name||actor.dataset.name)+' · '+actor.querySelector('.hani-office-status').dataset.full+' · '+bubbleSelection.line}
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
  function showBubble(actor,selection){bubblePerson=actor.dataset.person;bubbleSelection=selection;actorBubble.hidden=false;bubbleLine.textContent=bubbleText(actor);profileLink.href='#organization/people/'+bubblePerson;profileLink.hidden=actors.get(bubblePerson)?.dataset.visitor==='true';for(const a of actors.values())a.dataset.speaking=String(a===actor);fitStatusLabels();fitBubble();const serial=++bubbleSerial;setTimeout(()=>{if(serial===bubbleSerial)closeBubble(false)},3000)}
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
    if(actor.dataset.person==='seongmin'||actor.dataset.person.startsWith('visitor')){sprite.className='hani-office-sprite';sprite.style.backgroundImage='';actor.dataset.avatar='pending';return}
    if(group){sprite.className='hani-office-sprite hani-office-sheet-'+group;sprite.style.backgroundImage='';sprite.style.backgroundSize='600% 300%';sprite.style.backgroundPosition='0% '+['0%','50%','100%'][row];actor.dataset.avatar='chibi'}
    else{sprite.className='hani-office-sprite hani-office-avatar';sprite.style.backgroundImage='url("'+building.profile(actor.dataset.person)+'")';sprite.style.backgroundSize='cover';sprite.style.backgroundPosition='center';actor.dataset.avatar='badge'}
  }
  function seatActor(actor,seat,animate=false){
    const target=seat.anchor||seat.id,old=actor.officeAnchor;
    if(actor.officeTravel&&actor.officeTravel.seat.id===seat.id)return;
    actor.officeTravel=null;actor.dataset.seat=seat.id;actor.dataset.zone=seat.zone;actor.dataset.spot=seat.zone==='desk'?'seat':seat.zone;
    actor.dataset.home=[seat.x,seat.y].join(',');
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
    const presence=officePresence.read();
    cancelScheduledDuringMeeting(now);
    floorSnapshot=building.snapshot(now,{...presence,reducedMotion:reduced,cancelled,summoned:meeting?selectedAgents():[]});
    presenceNote.textContent=floorSnapshot.presenceNote||'';presenceNote.hidden=!floorSnapshot.presenceNote;
    for(const floor of floorSnapshot.floors){const button=floorButtons.get(floor.id),selected=floor.id===activeFloor;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;button.querySelector("small").textContent=`근무 ${floor.work} · 휴식 ${floor.rest}`}
    const floor=floorSnapshot.floors.find(f=>f.id===activeFloor),selected=meeting&&activeFloor==="2f"?selectedAgents():null;
    const entries=selected?building.assignSeats(activeFloor,selected.map(id=>({id,activity:"meeting"}))):meeting&&activeFloor==='4f'&&selectedAgents().includes('mir')?building.assignSeats(activeFloor,[...floor.visible.filter(p=>p.id!=='mir'),{id:'mir',activity:'meeting'}]):[...floor.visible,...(meeting?[]:(floorSnapshot.visitors||[]).filter(v=>v.floor===activeFloor))];
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
    // Hidden actors keep no stale dialogue partner from an earlier frame.
    for(const actor of actors.values()){actor.hidden=true;actor.officeRow.hidden=true;actor.dataset.called="false";actor.dataset.partner=""}
    for(const p of entries){const actor=actors.get(p.id);if(!actor||!p.seat)continue;actor.hidden=false;actor.officeRow.hidden=false;actor.dataset.activity=p.activity;actor.dataset.plain=String(Boolean(p.plain&&!selected&&!meeting));
      if(p.visitor){actor.dataset.visitor='true';actor.dataset.name=p.name;actor.officeName.textContent=p.name;actor.officeRowName.textContent=p.name;if(actor.dataset.sprite!==p.sprite){actor.dataset.sprite=p.sprite;actor.dataset.avatar='pending'}}
      if(actor.dataset.avatar==='pending')legacySprite(actor);if(sceneVisible())loadSprite(actor,fitStatusLabels);
      if(building.scheduler&&!meeting){actor.officeTravel=null;actor.officeAnchor=p.seat.anchor;actor.dataset.seat=p.seat.id;actor.dataset.zone=p.seat.zone;actor.dataset.spot=p.seat.zone==='desk'?'seat':p.seat.zone;actor.dataset.home=[p.seat.x,p.seat.y].join(',');place(actor,p.position||[p.seat.x,p.seat.y]);pose(actor,reduced?(p.walking?'standing':p.pose):p.pose)}
      else seatActor(actor,p.seat,animate&&(sameFloor||meeting));
      actor.dataset.behavior=p.state||'AT_HOME';actor.dataset.place=p.placeId||'';actor.dataset.slot=p.targetAnchor||'';
      actor.dataset.partner=p.deskPartner||'';actor.dataset.greeting=String(p.behaviorKind==='chairman-greeting'||p.id==='seongmin'&&entries.some(q=>q.behaviorKind==='chairman-greeting'));actor.dataset.facing=p.facing||'';
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
  function syncVisibility(){officePresence.read();const visible=sceneVisible();root.dataset.paused=String(!visible);if(visible)updateBuilding(true,false);else closeBubble()}
  document.addEventListener("visibilitychange",syncVisibility);
  new MutationObserver(syncVisibility).observe(root.closest(".view"),{attributes:true,attributeFilter:["class","hidden","style"]});
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{fitStatusLabels();fitBubble()}).observe(map);
  document.fonts?.ready.then(()=>{fitStatusLabels();fitBubble()});
  updateBuilding(true);syncVisibility();
  function changeOne(){officePresence.read();if(sceneVisible()&&!meeting)updateBuilding()}
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
