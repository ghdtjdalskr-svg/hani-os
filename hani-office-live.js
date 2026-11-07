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
  function koreaTime(now=new Date()){return new Date(new Date(now).getTime()+32400000)}
  function tapBucket(now=new Date()){
    const hour=koreaTime(now).getUTCHours();
    return hour<7?'night':hour<11?'morning':hour<18?'day':'evening';
  }
  // Three fixed washes crossfade using only opacity on the shared scene clock.
  // Light has its own day: evening is the short sunset, and night starts with
  // the rooftop night art. Each change eases from the previous wash for ten minutes.
  const lightSchedule=Object.freeze([['morning',6*60],['day',11*60],['evening',17*60],['night',18*60+30]]);
  const lightTints=Object.freeze({night:.2,morning:.12,day:0,evening:.2});
  function officeLight(now=new Date(),reduced=false){
    const kst=koreaTime(now),minute=kst.getUTCHours()*60+kst.getUTCMinutes()+kst.getUTCSeconds()/60+kst.getUTCMilliseconds()/60000;
    let index=lightSchedule.length-1;for(let i=0;i<lightSchedule.length;i++)if(minute>=lightSchedule[i][1])index=i;
    const [phase,start]=lightSchedule[index],t=Math.min(1,((minute-start+1440)%1440)/10),blend=reduced?1:t*t*(3-2*t);
    const previous=lightSchedule[(index+3)%4][0],tint={morning:0,evening:0,night:0};
    if(previous!=='day')tint[previous]=lightTints[previous]*(1-blend);
    if(phase!=='day')tint[phase]=lightTints[phase]*blend;
    return {phase,tint,rooftopNight:phase==='night'};
  }
  function officeBackground(floor,now=new Date()){
    return floor.id==='5f'&&floor.nightBackground&&officeLight(now).rooftopNight?floor.nightBackground:floor.background;
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
  function dramaDate(now=new Date()){
    const kst=koreaTime(now),date=kst.toISOString().slice(0,10),day=kst.getUTCDay();
    if(day===0||day===6)return null;
    const monday=Date.UTC(kst.getUTCFullYear(),kst.getUTCMonth(),kst.getUTCDate()-day+1);
    const weeks=Math.floor((monday-Date.UTC(2026,10,2))/604800000);
    return {date,day,week:((weeks%4)+4)%4+1};
  }
  function validDramaBank(bank,roster){
    const text=(s,max)=>typeof s==='string'&&s.trim().length>0&&!/[\r\n]/.test(s)&&Array.from(s).length<=max;
    if(bank?.schemaVersion!=='office-drama-v1'||!Array.isArray(bank.weeks)||bank.weeks.length!==4)return false;
    const ids=new Set(roster.map(p=>p.id));
    return bank.weeks.every((week,i)=>week?.week===i+1&&text(week.title,100)&&Array.isArray(week.days)&&week.days.length===5&&
      week.days.every((day,j)=>day?.day===j+1&&text(day.summary,200)&&Array.isArray(day.lines)&&day.lines.length===5&&
        new Set(day.lines.map(row=>row?.staffId)).size===day.lines.length&&day.lines.every(row=>row&&ids.has(row.staffId)&&
          typeof row.floor==='string'&&/^[1-5]f$/.test(row.floor)&&typeof row.hidden==='boolean'&&text(row.line,40))));
  }
  // Approved local-only affinity. This owner stores counts and nothing else.
  function createOfficeAffinity(){
    const key='hani_office_affinity_v1',names=['처음 만남','인사하는 사이','편한 동료','단짝','최애 콤비'];
    const secrets=Object.freeze({
      hani:['회의 끝나면 창가에서 아이디어 하나만 더요♡','제 책상 메모엔 같이 만들 꿈이 가득해요!','회장님 오시면 사무실이 조금 더 신나요♡','이제 눈빛만 봐도 다음 아이디어가 보여요!','제일 멋진 콤비 자리, 저랑 예약해요♡'],
      gaeun:['로비 꽃은 제가 조금씩 방향을 바꿔요.','회장님 발소리가 나면 안내가 더 반가워요.','조용한 틈엔 빈 회의실 의자를 맞춰둬요.','회장님 자리 옆엔 늘 여유를 남겨둘게요.','함께 걷는 복도는 안내 없이도 편하네요.'],
      yuna:['제 정리함에 귀여운 스티커 칸도 있어요!','회장님 오실 때 인사 연습한 건 비밀이에요!','접수 없는 시간엔 종이클립을 색별로 놔요!','회장님 질문은 이제 목소리만 들어도 반가워요!','오늘의 베스트 콤비, 저희라고 적어둘까요!'],
      jieun:['제 책상 화분 이름은 꾸준함이에요.','창가 의자 하나는 회장님 몫으로 비워요.','가끔은 결론 없는 잡담도 괜찮더라고요.','회장님 편이라는 말, 이제 생략해도 아시죠.','이렇게 편히 웃는 사무실이면 충분해요.'],
      haru:['사실 제 서랍엔 예쁜 포장지가 모여요.','라운지 컵은 손잡이가 편한 게 좋더라고요.','회장님이랑 고르면 사무실 소품도 재밌어요.','이 컵 취향은 회장님도 알아보실 줄 알았어요.','최애 콤비면 소품 구경도 같이 가야죠.'],
      naeun:['제 책상 꽃은 매일 조금씩 피네요.','회장님이 오시면 라운지가 포근해져요.','가끔은 말없이 같은 창밖을 봐도 좋아요.','회장님 옆자리는 이제 제게도 편한 자리예요.','함께 있는 시간이 사무실의 작은 쉼표네요.'],
      hina:['제 필통엔 별 스티커가 숨어 있어용!','회장님 오시면 책갈피도 쫑긋해용♡','쉬는 시간엔 모찌랑 조용히 있어용.','이젠 회장님 웃음도 정답처럼 알아용♡','최애 콤비 도장, 별 다섯 개 찍어용!'],
      minji:['라운지 창빛이 가끔 영화 같아요.','제 책상엔 좋아하는 장면의 엽서가 있어요.','회장님이랑 잡담하면 엔딩이 늘 아쉬워요.','우리 사무실 영화라면 이 장면은 남길래요.','회장님과 제 콤비 장면엔 자막도 필요 없네요.'],
      sooyeon:['옥상 바람 방향은 제가 제일 잘 알아요!','회장님 오시면 산책 동선부터 떠올라요!','엘리베이터 앞에서도 작은 여행은 시작돼요!','회장님과는 복도 한 바퀴도 제법 즐겁네요!','최애 콤비 출발 신호는 눈빛으로 충분하죠!'],
      sua:['제 문서 끝엔 작은 꽃 낙서가 있어요ㅎㅎ','회장님 인사 한 번이면 초안이 술술 나와요.','회의실 이름표도 예쁘게 맞춰봤어요ㅎㅎ','회장님은 제 말줄임표도 알아주시네요ㅎㅎ','우리 콤비 소개 문구는 제가 써도 되죠? 헤헤.'],
      taeo:['제 메모지에도 가끔 쓸모없는 농담이 있습니다.','복도 잡담은 의외로 좋은 회의 형식입니다.','회장님 자리의 의자 소리도 이제 익숙합니다.','저희 콤비 안건은 만장일치로 즐겁군요.','오늘은 결론 없이 웃어도 성과로 치겠습니다.'],
      seoyun:['제 모니터 옆 작은 별은 아린이 붙였어요.','회장님 오시면 설명보다 먼저 미소가 나네요.','조용한 사무실에서 키보드 소리가 좋아요💜','함께 나눈 아이디어는 오래 기억에 남아요.','회장님과의 콤비는 확인할수록 든든하네요💜'],
      dohyun:['제 컵 받침엔 작은 버그 그림이 있어요☕','회장님 발소리가 나면 탭부터 정리하게 돼요.','고친 화면을 같이 보는 순간이 좋더라고요.','회장님이랑은 침묵도 꽤 편하네요☕','우리 콤비는 커피 식기 전에 통하네요.'],
      serin:['제 노트 여백에도 가설이 자라요!!📊','회장님 오시면 아이디어 속도가 붙어요!✨','사무실 잡담에도 재밌는 패턴이 보여요!!','이젠 회장님 눈빛에 물음표가 보여요!!','최애 콤비라니 새 그래프보다 신나요!!✨'],
      yuri:['제 책상에도 기준 없는 낙서는 있습니다.','회의실 의자는 조용히 맞춰두는 편입니다.','회장님과의 잡담은 검사표에 넣지 않습니다.','기준은 그대로지만 옆자리는 편해졌습니다.','최애 콤비 인정합니다. 도장은 생략하죠.'],
      arin:['제 스케치북엔 사무실 햇살도 그려요🎨','회장님 오시면 말풍선 색이 떠올라요✨','이 작은 여백은 같이 낙서해도 좋아요.','회장님 표정은 이제 스케치 없이도 그려요!','최애 콤비 배지는 하트 다섯 개로 해요✨'],
      daon:['제 메모지 모서리는 늘 조금 접혀 있어요😅','회장님 오시면 먼저 인사할 용기가 나요.','혹시… 창가 자리에서 잠깐 이야기할까요.','이제 회장님 옆에선 말이 덜 꼬이네요.','최애 콤비라니… 저도 자신 있게 고개 들게요.'],
      yoonseul:['제 책갈피엔 작은 별자리가 있어요🔖','회장님과 나눌 질문은 여백에 적어둬요📚','사무실 창밖도 한 장의 지도 같네요!','이제 질문보다 먼저 반가움이 펼쳐져요!','우리 콤비 이야기는 두꺼운 책이 되겠네요📚'],
      mir:['회장님 발소리, 이제 조금 알아, 헤헤.','창가에 같이 서면 생각이 천천히 자라.','사무실 불빛 아래 잡담하는 거 좋아.','회장님 옆에선 질문 없어도 편해.','우리 콤비 이름은 그냥 우리면 좋겠어.'],
      'pet-cat':['회장님 옆 상자는 특별히 비워뒀다옹.','관심 없는 척해도 발소리는 기억해요.','제 골골송은 가까이 와야 들려요.','회장님 무릎 옆은 예약 없이 괜찮다옹.','최애 콤비라면 상자 반쪽은 내어줄게요.'],
      'pet-dog':['회장님 발소리엔 꼬리가 먼저 답해요!','엘리베이터 앞에서 몰래 마중 연습했어요!','제 공은 회장님이 던져야 더 재밌어요!','이젠 눈만 마주쳐도 산책 약속이죠!','최애 콤비 오늘도 발도장 꾹 찍어요!'],
      'pet-rabbit':['회장님 발소리는 조용히 알아볼 수 있어요.','제 옆 햇살은 조금 나눠드릴게요.','귀를 기울이면 사무실도 포근해요.','이제 회장님 곁에서도 눈을 감을 수 있어요.','가장 조용한 콤비여도 괜찮겠지요.'],
      'pet-bori':['회장님 오시면 꼬리 끝부터 깨어나요, 멍.','로비 바닥의 따뜻한 자리를 알아뒀어요.','제 옆에선 천천히 이야기해도 돼요.','이젠 회장님 발소리에 눈 감고도 반겨요.','최애 콤비면 제 큰 그늘도 나눠드려요, 멍.'],
      iseul:['회장님 오시는 소리에 컵부터 꺼냈어요.','제 앞치마 주머니엔 하트 스케치가 있어요.','한가한 카페에선 원두 소리가 더 다정해요.','이젠 하트 모양만 봐도 제 잔인 줄 아시죠.','우리 콤비 잔 받침은 나란히 놓아둘게요.'],
      eunha:['야간 카페 시계 소리가 은근히 좋아요.','회장님 오시면 조용한 밤도 반가워져요.','제 앞치마 별 자수는 밤에 더 잘 보여요.','이젠 졸린 인사도 알아들으시겠네요.','최애 콤비 자리는 작은 조명 아래예요.']
    });
    const ids=new Set(Object.keys(secrets)),counts=Object.create(null),turns=new Map();
    let loaded=false,writable=true,warned=false,dirty=false,due=Infinity,lastWrite=-Infinity;
    function warn(){if(!warned){warned=true;console.warn('Office affinity storage unavailable or malformed; using memory only.')}}
    function load(){
      if(loaded)return;loaded=true;
      try{
        const raw=globalThis.localStorage.getItem(key);if(raw===null)return;
        const value=JSON.parse(raw);
        if(!value||Array.isArray(value)||value.v!==1||Object.keys(value).sort().join(',')!=='counts,v'||!value.counts||typeof value.counts!=='object'||Array.isArray(value.counts))throw Error('affinity format');
        for(const [id,count]of Object.entries(value.counts))if(ids.has(id)){
          if(!Number.isInteger(count)||count<0)throw Error('affinity count');
          counts[id]=Math.min(9999,count);
        }
      }catch(_){for(const id of Object.keys(counts))delete counts[id];writable=false;warn()}
    }
    function get(id){load();const count=ids.has(id)?counts[id]||0:0,level=1+[5,15,35,70].filter(n=>count>=n).length;return {count,level,name:names[level-1],hearts:'♥'.repeat(level)+'♡'.repeat(5-level)}}
    function tap(id,event){
      if(!ids.has(id)||event?.isTrusted!==true||!((event.type==='click')||(event.type==='keydown'&&event.key==='Enter'&&!event.repeat)))return null;
      const before=get(id);if(before.count<9999){counts[id]=before.count+1;dirty=true;if(due===Infinity)due=Date.now()+2000}
      const info=get(id),turn=turns.get(id)||0;turns.set(id,turn+1);
      const pool=secrets[id].slice(0,info.level>=5?5:3),up=info.level>before.level;
      const suffix=id==='hina'?'회장님이랑 이제 '+info.name+'예용♡':id==='mir'?'회장님이랑 이제 '+info.name+'네, 헤헤.':id==='yuri'||id==='taeo'?'회장님과 이제 '+info.name+'입니다.':'회장님이랑 이제 '+info.name+'네요!';
      return {...info,added:info.count>before.count,up,line:up?suffix:info.level>=3?pool[turn%pool.length]:''};
    }
    function flush(lifecycle=false){
      const now=Date.now();if(!dirty||!writable||now-lastWrite<2000||(!lifecycle&&now<due))return;
      try{globalThis.localStorage.setItem(key,JSON.stringify({v:1,counts}));dirty=false;due=Infinity;lastWrite=now}
      catch(_){writable=false;warn()}
    }
    return Object.freeze({get,tap,flush});
  }

  function createTapLines(roster){
    let bank=null,drama=null,request=null,ready=false,seenDay='',seen=new Set();const cursors=new Map();
    function load(){
      if(!request)request=Promise.all([(async()=>{try{
        if(typeof fetch!=='function')return;
        const response=await fetch('./assets/data/office-tap-lines-v1.json');
        if(response.ok){const data=await response.json();if(validTapBank(data,roster))bank=data}
      }catch(_){/* Keep the current status speech when the optional seed is absent. */}})(),(async()=>{try{
        if(typeof fetch!=='function')return;
        const response=await fetch('./assets/data/office-drama-v1.json');
        if(response.ok){const data=await response.json();if(validDramaBank(data,roster))drama=data}
      }catch(_){/* An absent or invalid drama never changes ordinary office speech. */}})()]).then(()=>{ready=true});
      return request;
    }
    function episode(now=new Date()){
      const selected=drama&&dramaDate(now);if(!selected)return null;
      const week=drama.weeks[selected.week-1];return {...selected,title:week.title,...week.days[selected.day-1]};
    }
    function tap(id,now=new Date(),options={}){
      // Wait for both optional reads on the UI path so a slow drama cannot lose its first tap.
      if(options.floor&&!ready)return '';
      const today=episode(now);
      if(today){
        if(seenDay!==today.date){seenDay=today.date;seen=new Set()}
        const row=today.lines.find(row=>row.staffId===id&&row.floor===options.floor);
        if(row&&!seen.has(id)&&(id!=='seongmin'||options.chairmanPresent===true)){
          seen.add(id);return {line:row.line,speaker:id,drama:true,day:today.date,floor:row.floor};
        }
      }
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
    return Object.freeze({load,tap,episode});
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
  const floors=canon?Object.freeze(canon.floors.map(f=>Object.freeze({id:f.id,label:f.label,tint:legacyFloors.find(l=>l.id===f.id)?.tint||'#9cbd9a',residents:Object.freeze(eligible.filter(p=>anchors.get(p.homeAnchor)?.floor===f.id).map(p=>p.id)),background:art.floors[f.id].background,nightBackground:art.floors[f.id].nightBackground,production:legacyFloors.find(l=>l.id===f.id)?.background||fallback,fallback}))):legacyFloors;
  const seatMaps=canon?Object.freeze(Object.fromEntries(floors.map(f=>[f.id,Object.freeze(canon.anchors.filter(a=>a.floor===f.id&&a.rendererSeat&&a.runtimeAssignable!==false).map(a=>Object.freeze({...a.rendererSeat,...art.anchors[a.id],anchor:a.id,posture:a.posture||(a.type==='seat'||a.type==='desk'?'sitting':'standing'),box:Object.freeze([art.anchors[a.id].x-1.4,art.anchors[a.id].y-1.4,art.anchors[a.id].x+1.4,art.anchors[a.id].y])})))]))):legacySeatMaps;
  const deskSurfaces=canon?Object.fromEntries(canon.floors.map(f=>[f.id,[]])):legacySurfaces;
  // Monitor centres are absent from the art map. Fractions within the EXISTING
  // homeFurniture deskBounds, followed by screen size in source pixels. Only
  // desks with a visible monitor are listed (no rooftop, MIR pod or spare chair).
  const monitorScreens=Object.freeze({
    'business-west':[.50,.14,62,44],'business-east':[.50,.14,62,44],
    'finance-a':[.38,.16,78,50],'finance-b':[.50,.19,96,58],'desk_daon':[.50,.19,96,58],
    'life-a':[.50,.18,88,54],'life-b':[.50,.18,88,54],'life-c':[.50,.18,88,54],'life-d':[.50,.18,88,54],'desk_yoonseul':[.50,.18,88,54],
    'dev-lead':[.43,.18,152,58],'dev-build':[.43,.18,152,58],'dev-research':[.43,.18,152,58],
    'dev-qa':[.50,.16,152,58],'dev-design':[.50,.16,152,58],
    'ceo-reserved':[.34,.18,80,48],'office_hani':[.40,.18,72,44],
    'secretary_desk':[.50,.16,82,52],'desk_yuna':[.50,.16,82,52]
  });
  function workingMonitors(floorId,entries){
    const furniture=art?.floors[floorId]?.homeFurniture;if(!furniture)return [];
    return entries.flatMap(p=>{
      const seat=p.seat,anchor=seat?.anchor,screen=furniture[anchor]?.monitorScreen||monitorScreens[anchor],rect=furniture[anchor]?.deskBounds;
      const owner=anchors.get(anchor)?.rendererSeat?.owner;
      if(!screen||!rect||p.id!==(owner==='chairman'?'seongmin':owner)||p.activity!=='work'||p.walking||p.travel||p.called||p.pose!=='sitting'||p.deskPartner||p.behaviorKind==='chairman-greeting')return [];
      if(p.state&&p.state!=='AT_HOME'&&p.state!=='AT_PLACE')return [];
      const [u,v,width,height]=screen;
      return [{id:p.id,anchor,x:(rect[0]+(rect[2]-rect[0])*u)/art.width*100,y:(rect[1]+(rect[3]-rect[1])*v)/art.height*100,width:width/art.width*100,height:height/art.height*100}];
    });
  }
  function monitorOpacity(now,reduced=false,visible=true){return (!visible||reduced) ? .42 : .42+.08*Math.sin(Number(now)*Math.PI/6000)}
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
    for(const card of placeTable?.errands||[])if(card.slots.every(id=>anchors.get(id)?.floor===card.floor&&anchors.get(id)?.room===card.room))errandPlaces.push(card.hostOnly?{...card,at:[...card.at,'상담 중','면접 진행 중']}:card);
    // The existing reception counter restores a short public work stop when
    // business desk approaches cannot fit phone sprites. Same reservation gates.
    if(places.length&&anchors.has('reception'))errandPlaces.push({id:'task-reception-1f',kind:'errand',errandKind:'task',floor:'1f',room:'lobby',slots:['reception'],pose:'stand',stay:[8,25],go:'접수대로 가는 중',at:['접수대에서 전달 사항 확인 중','접수대에서 방문 일정 확인 중']});
    // The business-floor desk approaches overlap fixed homes on phones. Use
    // the existing, clear entrance nodes for short work checks; no new graph.
    for(const [target,name]of [['hall_business','사업부'],['hall_consult','상담실']])if(places.length&&anchors.has(target))errandPlaces.push({id:'task-'+target,kind:'errand',errandKind:'task',floor:'1f',room:anchors.get(target).room,slots:[target],pose:'stand',stay:[8,25],go:name+' 앞 전달 사항 확인하러 가는 중',at:[name+' 앞에서 전달 일정 확인 중']});
    const defaults=actions.get('base-work'),cache=new Map(),paths=new Map(),targetCache=new Map(),slotCache=new Map();
    // Voice/role grounding: existing office-tap-lines toChairman and seeded jobs.
    // No new place or chair: the existing CEO entrance is real floor, reachable
    // through the same canon edges. Near-desk junctions overlap 40px phone sprites.
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
    const reportSlots=chairmanPoint?[...anchors.values()].filter(a=>a.floor==='4f'&&a.room==='ceo'&&['junction','door'].includes(a.type)&&a.runtimeAssignable!==false&&(()=>{const q=art.anchors[a.id],d=q&&Math.hypot((q.x-chairmanPoint.x)*(art.width||1672)/100,(q.y-chairmanPoint.y)*(art.height||941)/100);return d>=170})()).map(a=>a.id):[];
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
    function replaceLedgerIndex(ledger,old,event){
      const index=ledgerIndices.get(ledger);if(!index)return;
      const position=ledger.indexOf(event);if(position>=index.length)return;
      // A gathering extension only grows the end time. Replace its indexed
      // entries and insert new minutes in ledger order; retain the other 8k
      // formal entries and their already built buckets.
      for(let k=Math.floor(old.start/60);k<=Math.floor(event.end/60);k++){
        let bucket=index.buckets.get(k);if(!bucket){bucket=[];index.buckets.set(k,bucket)}
        const found=bucket.indexOf(old);
        if(found>=0)bucket[found]=event;
        else{const at=bucket.findIndex(e=>ledger.indexOf(e)>position);bucket.splice(at<0?bucket.length:at,0,event)}
      }
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
      // Formal catalog bounds stay fixed; the place data owns outing stays.
      const range=stayRanges[kind]||card?.stay||[45,120];stayBySlot.set(id,range);return range;
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
            // Leave real calendar gaps for the configured workday breaks.
            // Keep night cadence, authored signatures and group scenes intact.
            const deskCadence=placeTable?.outingRules?.deskAmbientSeconds;
            if(deskCadence&&tick>=32400&&tick<64800&&tick%deskCadence>=cadence)continue;
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
      const leg=(seconds<outEnd||seconds>=backStart)?(seconds<outEnd?t.out:t.back).find(l=>l.start<=seconds&&seconds<l.end):null;
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
    function positionAt(id,seconds,ledger,reduced=false){
      const e=ledger.find(e=>e.start<=seconds&&seconds<e.end&&e.people.some(t=>t.id===id));
      if(e)return stateAt(e,e.people.find(t=>t.id===id),seconds,reduced);
      const p=personById.get(id);if(!p||!presentAt(id,seconds))return null;
      const h=homeAt(p,seconds),seat=slot(h.anchorId,id==='mir'?'stand':'sit');return {seat,floor:h.floor,walking:false,position:null};
    }
    function gap(p,q){const a=pixels(p.position||[p.seat.x,p.seat.y]),b=pixels(q.position||[q.seat.x,q.seat.y]);return Math.hypot(a[0]-b[0],a[1]-b[1])}
    function resourceIntervals(e){
      if(intervalCache.has(e))return intervalCache.get(e);
      const result=new Map(),add=(id,start,end)=>{
        let ranges=result.get(id);if(!ranges){ranges=[];result.set(id,ranges)}
        const last=ranges[ranges.length-1];
        // Adjacent legs and the stay reserve one continuous node interval.
        // Preserve the exact union while avoiding duplicate tiny range objects.
        if(last&&last.end===start)last.end=end;else ranges.push({start,end});
      };
      for(const t of e.people){
        for(const l of t.out){add(l.from,l.start,l.end);add(l.to,l.start,l.end)}
        add(t.seat.anchor,t.out.at(-1)?.end??e.start,t.back[0]?.start??e.end);
        for(const l of t.back){add(l.from,l.start,l.end);add(l.to,l.start,l.end)}
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
      // Most nearby formal expressions share no route node. Build interval
      // maps lazily and inspect only shared resources, without nested callbacks.
      let x,y;
      for(const id of a.resources){
        if(!ids.has(id))continue;
        if(!x){x=resourceIntervals(a);y=resourceIntervals(b)}
        const left=x.get(id),right=y.get(id);if(!left||!right)continue;
        for(const p of left)for(const q of right)if(overlap(p,q))return true;
      }
      return false;
    }
    const eventMotion=new WeakMap(),stationaryMotion={moving:false};
    const resourceFloorCache=new WeakMap(),intermediateFloorCache=new WeakMap();
    function resourceFloors(e){
      let floors=resourceFloorCache.get(e.resources);
      if(!floors){floors=new Set(e.resources.map(id=>anchors.get(id).floor));resourceFloorCache.set(e.resources,floors)}
      return floors;
    }
    function sharesResourceFloor(e,floors){for(const floor of resourceFloors(e))if(floors.has(floor))return true;return false}
    function motion(e){
      let value=eventMotion.get(e);
      if(!value){value=e.people.some(t=>t.seat.anchor!==t.home.anchorId)?{moving:true,floors:new Set(e.people.flatMap(t=>[t.home.floor,anchors.get(t.seat.anchor).floor]))}:stationaryMotion;eventMotion.set(e,value)}
      return value;
    }
    function floorCapacity(candidate,nearby){
      const own=motion(candidate);if(!own.moving)return true;
      // A single actor with no moving neighbour fits every existing time cap.
      if(!nearby.length&&candidate.people.length===1)return true;
      const reservations=nearby.filter(e=>motion(e).moving);reservations.push(candidate);
      // Two people fit even the smallest daytime cap, on every route floor.
      if(candidate.start>=25200&&candidate.end<=86400&&reservations.reduce((n,e)=>n+e.people.length,0)<=2)return true;
      const ticks=new Set([candidate.start,candidate.end-.00001,3600,25200,41400,46800,...reservations.flatMap(e=>[e.start,e.end])].filter(s=>s>=candidate.start&&s<candidate.end));
      for(const floor of own.floors){
       const relevant=reservations.filter(e=>motion(e).floors.has(floor));
       if(relevant.length===1&&candidate.people.length===1)continue;
       for(const seconds of ticks){
        let count=0,groups=0,people=0;
        for(const e of relevant)if(e.start<=seconds&&seconds<e.end){count++;people+=e.people.length;if(e.people.length>1)groups++}
        if(isLate(seconds)){if(people>1)return false}
        else if(seconds>=41400&&seconds<46800){if(people>4)return false}
        else if(count>2||groups>1)return false;
      }
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
        // A floor changes only at a leg boundary. Build those exact intervals
        // directly, including FIFO gaps, without rendering midpoint positions.
        const add=(anchor,start,end)=>{if(end<=start)return;const floor=anchors.get(anchor).floor,previous=intervals.at(-1);
          if(previous?.id===t.id&&previous.floor===floor&&previous.end===start)previous.end=end;
          else intervals.push({id:t.id,start,end,floor});
        };
        let cursor=e.start,anchor=t.home.anchorId;
        for(const l of t.out){add(anchor,cursor,l.start);add(l.from,l.start,l.end);cursor=l.end;anchor=l.to}
        const backStart=t.back[0]?.start??e.end;
        add(t.seat.anchor,cursor,backStart);cursor=backStart;anchor=t.seat.anchor;
        for(const l of t.back){add(anchor,cursor,l.start);add(l.from,l.start,l.end);cursor=l.end;anchor=l.to}
        add(t.home.anchorId,cursor,e.end);
      }
      physicalFloorIntervals.set(e,intervals);return intervals;
    }
    function transitCapacity(candidate,nearby){
      if(!nearby.length)return true;
      const all=[candidate,...nearby].filter(e=>!e.visitor&&motion(e).moving);
      // Endpoint floors already have stronger full-excursion reservations.
      // Only an intermediate floor can introduce an uncounted transit unit.
      const extra=new Set();for(const e of all){
        let floors=intermediateFloorCache.get(e.resources);
        if(!floors){const endpoints=motion(e).floors;floors=endpoints.size>1?[...resourceFloors(e)].filter(f=>!endpoints.has(f)):[];intermediateFloorCache.set(e.resources,floors)}
        for(const floor of floors)extra.add(floor);
      }
      if(!extra.size)return true;
      const relevant=all.filter(e=>sharesResourceFloor(e,extra));
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
    // Screen reservations supplement (never replace) the art-space 20/24px sweep.
    // At map width342 the existing 40px humans are 30px wide. Foot envelopes
    // (human +/-19px, visitor +/-14px, height44) include idle and partner turns.
    // Only new card-based excursions own this extra phone rule. The reviewed
    // 216/221 catalog retains its existing art-space proximity checks.
    // Include every excursion stop, including FIFO/door/elevator waiting.
    const screenStops=new WeakMap(),screenPoints=new Map(),screenHomes=new WeakMap(),screenHomeBlocks=new WeakMap(),screenFloors=new WeakMap(),screenPairs=new WeakMap();
    function screenFloor(e){
      let floor=screenFloors.get(e.resources);
      if(floor===undefined){floor=e.resources.some(id=>anchors.get(id).floor==='1f');screenFloors.set(e.resources,floor)}
      return floor;
    }
    function screenPoint(seat){
      let point=screenPoints.get(seat.anchor);
      if(!point){point=[seat.x*342/100,seat.y*(342*941/1672)/100];screenPoints.set(seat.anchor,point)}
      return point;
    }
    function screenOverlap(a,b,visitorA=false,visitorB=false){const p=screenPoint(a),q=screenPoint(b);return Math.abs(p[0]-q[0])<(visitorA?14:19)+(visitorB?14:19)&&Math.abs(p[1]-q[1])<44}
    function screenStopConflict(a,b){return a.id!==b.id&&overlap(a,b)&&!(a.seat.anchor===a.home&&b.seat.anchor===b.home)&&screenOverlap(a.seat,b.seat,a.id.startsWith('visitor'),b.id.startsWith('visitor'))}
    function deskPairScreenClear(peers,entries,events,from,to,reduced=false){
      let pairs=screenPairs.get(events);if(!pairs){pairs=new Map();screenPairs.set(events,pairs)}
      // Decide for the entire text beat. A neighbour arriving or leaving halfway
      // through must not start or clip a ten-second desk conversation.
      const key=peers.map(p=>p.id).join('|')+'|'+from+'|'+reduced+'|'+entries.map(p=>p.id).join();
      if(!pairs.has(key)){
        const near=ledgerOverlaps(events,from,to),times=new Set([from,to-.000001]);
        const boundary=s=>{for(const tick of [s-.000001,s,s+.000001])if(from<=tick&&tick<to)times.add(tick)};
        // Stationary positions change only at these exact event/leg boundaries.
        // Empty homes stay empty for the beat; arrivals and FIFO waits count.
        for(const event of near){boundary(event.start);boundary(event.end);
          for(const t of event.people)for(const l of [...t.out,...t.back]){boundary(l.start);boundary(l.end)}
        }
        const stationary=[];
        for(const other of entries)for(const seconds of times){const state=positionAt(other.id,seconds,near,reduced);if(state&&!state.walking&&state.floor===peers[0].floor)stationary.push({id:other.id,seat:state.seat})}
        if(pairs.size>=256)pairs.delete(pairs.keys().next().value);
        pairs.set(key,peers.every(p=>stationary.every(other=>other.id===p.id||!screenOverlap(p.seat,other.seat))));
      }
      return pairs.get(key);
    }
    function screenHomeClear(id,home,seat,allowed,start,end){
      if(seat.anchor===home||anchors.get(seat.anchor).floor!=='1f')return true;
      const phase=(isLate(start)||isEvening(start)?1:0)|(isLate(end-.001)||isEvening(end-.001)?2:0);
      if(!screenHomes.has(allowed))screenHomes.set(allowed,[]);
      const phases=screenHomes.get(allowed);
      if(!phases[phase])phases[phase]=allowed.flatMap(p=>[...new Set([homeAt(p,start).anchorId,homeAt(p,end-.001).anchorId])].filter(id=>anchors.get(id).floor==='1f').map(id=>({id:p.id,seat:slot(id,'sit')})));
      const homes=phases[phase],visitor=id.startsWith('visitor');
      if(!screenHomeBlocks.has(homes))screenHomeBlocks.set(homes,new Map());
      const blocks=screenHomeBlocks.get(homes),pointKey=seat.anchor+'|'+visitor;
      if(!blocks.has(pointKey))blocks.set(pointKey,homes.filter(p=>screenOverlap(seat,p.seat,visitor)).map(p=>p.id));
      return blocks.get(pointKey).every(owner=>owner===id);
    }
    function stationaryStops(e){
      if(screenStops.has(e))return screenStops.get(e);
      const stops=[];
      if(!e.card||!screenFloor(e)){screenStops.set(e,stops);return stops}
      for(const t of e.people){
        const add=(seat,start,end)=>{if(end>start&&anchors.get(seat.anchor).floor==='1f')stops.push({id:t.id,home:t.home.anchorId,seat,start,end})};
        let cursor=e.start,seat=slot(t.home.anchorId,'sit');
        for(const legs of [t.out,t.back]){
          for(const l of legs){
            add(seat,cursor,l.start);
            // Same-floor legs walk; only floor transfers are stationary.
            if(anchors.get(l.from).floor!==anchors.get(l.to).floor)add(slot(l.from,'stand'),l.start,l.end);
            cursor=l.end;seat=slot(l.to,'stand');
          }
          if(legs===t.out)seat=t.seat;
        }
        add(seat,cursor,e.end);
      }
      screenStops.set(e,stops);return stops;
    }
    function screenReservations(candidate,nearby,allowed){
      if(!candidate.card||!screenFloor(candidate))return true;
      if(!nearby.length&&candidate.people.every(t=>!t.out.length&&!t.back.length&&t.seat.anchor===t.home.anchorId))return true;
      const own=stationaryStops(candidate);
      if(!own.length)return true;
      // Reject cached home geometry before collecting overlapping trip stops.
      for(const a of own)if(!screenHomeClear(a.id,a.home,a.seat,allowed,candidate.start,candidate.end))return false;
      const other=nearby.flatMap(e=>stationaryStops(e));
      for(let i=0;i<own.length;i++){
        const a=own[i];
        // As with the existing art-space home guard, protect private homes
        // even while empty. This also makes later returns/cancellations safe.
        for(let j=i+1;j<own.length;j++)if(screenStopConflict(a,own[j]))return false;
        for(const b of other)if(screenStopConflict(a,b))return false;
      }
      return true;
    }
    const sweepKnots=new WeakMap();
    function eventKnots(e){
      if(sweepKnots.has(e))return sweepKnots.get(e);
      const times=new Set([e.start,e.end-.000001,e.end]);
      for(const t of e.people)for(const legs of [t.out,t.back])for(const l of legs){
        const transfer=anchors.get(l.from).floor!==anchors.get(l.to).floor;
        for(const s of [l.start,l.end]){times.add(s);if(transfer){times.add(s-.000001);times.add(s+.000001)}}
      }
      const ticks=[...times].sort((a,b)=>a-b);sweepKnots.set(e,ticks);return ticks;
    }
    function reserve(candidate,ledger,allowed,nearby=ledgerOverlaps(ledger,candidate.start,candidate.end)){
      const ids=new Set(candidate.people.map(t=>t.id));
      if(nearby.some(e=>e.people.some(t=>ids.has(t.id))))return false;
      // Actor reservations span floors; geometry/resources cannot conflict on
      // disjoint route floors. Keep intermediate/transit floors in this set.
      const candidateFloors=resourceFloors(candidate);
      nearby=nearby.filter(e=>sharesResourceFloor(e,candidateFloors));
      if(nearby.some(e=>resourceConflict(e,candidate)))return false;
      nearby=nearby.filter(e=>motion(e).moving);
      if(!floorCapacity(candidate,nearby))return false;
      if(candidate.card&&!candidate.visitor&&!transitCapacity(candidate,nearby))return false;
      // Reserve a unit for travellers passing through this floor. Existing
      // capacity still owns home/destination floors; transit uses actual times.
      if(candidate.card?.kind==='errand'){
        const floor=candidate.card.floor;
        for(const e of nearby)if(!e.people.some(t=>t.home.floor===floor||anchors.get(t.seat.anchor).floor===floor)&&resourceFloors(e).has(floor)){
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
      // Accepted away stops protect all home footprints, including empty homes;
      // home-only expressions inherit that proof and the fixed-home exemption.
      const staticKey=homeOnly?rosterKey(allowed)+'|'+candidate.people.map(t=>t.id+':'+t.home.anchorId).join(',')+'|'+(isLate(candidate.start)||isEvening(candidate.start))+'|'+(isLate(candidate.end-.001)||isEvening(candidate.end-.001)):null;
      if(homeOnly&&staticSafe.has(staticKey)){ledger.push(candidate);return true}
      // Private homes remain owned even while empty; night lounge homes are also protected.
      if(candidate.people.some(t=>otherHomeOwner(t,candidate.start,candidate.end)))return false;
      if(candidate.people.some(t=>!t.visitor&&(!presentAt(t.id,candidate.end-.001)||homeAt(personById.get(t.id),candidate.end-.001).anchorId!==t.home.anchorId)))return false;
      if(candidate.people.some(t=>!clearHomeRoute(t,allowed,candidate.start,candidate.end)))return false;
      if(!homeOnly&&!screenReservations(candidate,nearby,allowed))return false;
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
      const sweptFloors=resourceFloors(candidate);
      const movingNearby=nearby.filter(e=>e.people.some(t=>t.visitor||t.out.length||t.back.length||t.seat.anchor!==t.home.anchorId)&&sharesResourceFloor(e,sweptFloors));
      const others=[...new Set(movingNearby.flatMap(e=>e.people.filter(t=>!ids.has(t.id)&&(t.visitor||t.out.length||t.back.length||t.seat.anchor!==t.home.anchorId)).map(t=>t.id)))];
      if(candidate.people.length===1&&!others.length){ledger.push(candidate);return true}
      const times=new Set([candidate.start,candidate.end-.00001]);
      for(const e of [candidate,...movingNearby]){
        const knots=eventKnots(e);let lo=0,hi=knots.length;
        while(lo<hi){const mid=(lo+hi)>>>1;if(knots[mid]<=candidate.start)lo=mid+1;else hi=mid}
        for(let i=lo;i<knots.length&&knots[i]<candidate.end;i++)times.add(knots[i]);
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
      if(line==='급하게 인스타 끄는 중')return '인스타 끄는 중';
      if(line==='급하게 창 닫는 중')return '창 닫는 중';
      if(line==='회장님 질문 듣는 중')return '질문 듣는 중';
      if(line==='회장님께 화면 설명 중')return '화면 설명 중';
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
      {kind:'client',sprite:'visitor-client',name:'방문 고객',hours:[[10,17]],target:'client_booth_slot_4',stay:[120,220],go:'상담실로 안내받아 가는 중',at:'상담 받는 중'},
      {kind:'courier',sprite:'visitor-courier',name:'택배 기사',hours:[[9,18]],target:'parcel_box',stay:[15,30],go:'택배함으로 가는 중',at:'택배 두고 갈게요'},
      {kind:'rider',sprite:'visitor-rider',name:'배달 기사',hours:[[11.5,13.5],[17.5,20]],target:'reception',stay:[15,30],go:'안내대로 배달 가는 중',at:'배달 왔습니다!'},
      {kind:'candidate',sprite:'visitor-candidate',name:'면접 지원자',hours:[[10,16]],weekdayOnly:true,target:'client_booth_slot_2',stay:[120,220],go:'면접 보러 상담실 가는 중',at:'면접 대기 중… 두근'},
      {kind:'generic',sprite:'visitor-generic',name:'테이크아웃 손님',hours:[[9,20]],target:'coffee_counter',stay:[20,40],go:'HANI Coffee 가는 중',at:'커피 받아 가는 중'}
    ];
    function blockPlan(day,index,events,options={}){
      const allowed=persons.filter(p=>(p.id!=='seongmin'||options.chairmanPresent)&&(!options.presentIds||options.presentIds.includes(p.id)));
      // Compatibility name/signature; the reservation horizon is now the whole day.
      // Adjacent blocks project the SAME ledger, including excursions crossing :00/:10.
      const key=day+'|'+allowed.map(p=>p.id).join(',');if(blocks.has(key))return blocks.get(key);
      const ledger=events.slice(),result=[],consultations=[],last=new Map(),due=new Map(),visits=new Map(),slotOrders=new Map(),tripsByPerson=new Map(),visitorUntil=new Map();
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
      // Keep one excursion unit available for staff during appointments.
      const publicSlots=s=>s>=36000&&s<61200?1:2;
      function withinCap(e,includeVisitors=false){
        const near=ledgerOverlaps(result,e.start,e.end).filter(q=>(includeVisitors||!q.visitor)&&q.floors.some(f=>e.floors.includes(f)));
        if((!near.length&&e.people.length===1)||(e.start>=25200&&e.end<=86400&&near.reduce((n,q)=>n+q.people.length,e.people.length)<=2))return true;
        const ticks=[e.start,e.end-.00001,41400,46800,3600,25200,...near.flatMap(q=>[q.start,q.end])].filter(s=>s>=e.start&&s<e.end);
        const reservations=[...near,e];
        return e.floors.every(f=>{const relevant=reservations.filter(q=>q.floors.includes(f));
          if((relevant.length===1&&e.people.length===1)||(e.start>=25200&&e.end<=86400&&relevant.reduce((n,q)=>n+q.people.length,0)<=2))return true;
          return ticks.every(s=>{
          let groups=0,solo=0,people=0;
          for(const q of relevant)if(q.start<=s&&s<q.end){if(q.people.length>1)groups++;else solo++;people+=q.people.length}
          return cap(s)===2?groups<=1&&solo+(groups?1:0)<=2:people<=cap(s);
        })});
      }
      const rhythms=Object.values(placeTable?.rhythm||{}),rhythmsAt=new Map();
      let gatheringWindow=null;
      function weight(card,people,at){
        let w=people.reduce((n,p)=>n*(card.affinity?.[p.id]||1),1)**(1/people.length);
        const sameFloor=people.every(p=>homeAt(p,at).floor===card.floor);
        w*=sameFloor?(people.length>1?12:5):(people.length>1?.35:1);
        // Reuse the existing gathering window for every card ranked at this
        // instant; querying the same ledger once per card adds cold-plan work.
        if(!gatheringWindow||gatheringWindow.at!==at||gatheringWindow.length!==result.length){
          const active=ledgerOverlaps(result,at,at+.001).filter(e=>!e.visitor),byCard=new Map();
          for(const e of active)if(e.performStart<=at&&at<e.performEnd){if(!byCard.has(e.card.id))byCard.set(e.card.id,[]);byCard.get(e.card.id).push(e)}
          gatheringWindow={at,length:result.length,active,byCard};
        }
        if(at>=32400&&at<64800&&(card.id==='cafe-1f'||card.floor==='5f')){
          const occupied=gatheringWindow.active.filter(e=>card.floor==='5f'?e.card.floor==='5f':e.card.id===card.id).reduce((n,e)=>n+e.people.length,0);
          w*=card.id==='cafe-1f'?(occupied<2?1000:.01):1;
        }
        let activeRhythms=rhythmsAt.get(at);if(!activeRhythms){activeRhythms=rhythms.filter(r=>at/3600>=r.hours[0]&&at/3600<r.hours[1]);rhythmsAt.set(at,activeRhythms)}
        for(const rhythm of activeRhythms)w*=rhythm.weights[card.kind]||1;
        // Novel places get a modest boost; preferences still shape each day's mix.
        w*=people.some(p=>!visits.get(p.id)?.has(card.id))?3:1;
        if(gatheringPlace(card)){
          const staying=gatheringWindow.byCard.get(card.id)||[];
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
          // Long authored rests may exceed the social extension ceiling by
          // themselves. They must not acquire an even longer gathering tail.
          const max=size>=3?gathering.trioMaxSeconds:Math.min(gathering.trioMaxSeconds,old.card.stay[1]*gathering.maxScale);
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
          replaceLedgerIndex(ledger,old,e);replaceLedgerIndex(result,old,e);
          for(const t of old.people){const trips=tripsByPerson.get(t.id);if(trips)trips[trips.indexOf(old)]=e;if(last.get(t.id)?.end===old.end)last.set(t.id,{end:e.end,card:e.card.id})}
        }
      }
      function blockedGeometry(person,home,target,at,end){
        const geometryKey=rosterKey(allowed)+'|'+(isLate(at)||isEvening(at))+'|'+(isLate(end-.001)||isEvening(end-.001));
        return clearGeometry.get(geometryKey+'|'+person.id+':'+home.anchorId+':'+target)===false;
      }
      const visitorCards=new Map(),visitorTargets=new Map();let visitorOpportunity=null;
      function visitorWindow(at){
        if(!visitorOpportunity||visitorOpportunity.at!==at||visitorOpportunity.length!==ledger.length){
          const active=ledgerOverlaps(ledger,at,at+.000001).filter(e=>e.start<=at&&at<e.end);
          visitorOpportunity={at,length:ledger.length,active,floor1:active.filter(e=>e.people.some(t=>t.seat.anchor!==t.home.anchorId)&&e.people.some(t=>t.home.floor==='1f'||anchors.get(t.seat.anchor).floor==='1f'))};
        }
        return visitorOpportunity;
      }
      const cadenceCache=new Map();
      function attempt(people,at,visitor=null,fill=false,joiningCard=null,formalId=null){
        if(!visitor&&people.length>1&&(at<32400||at>=70200))return false;
        // Invitations and floor repair must share the configured workday
        // cadence too. Keep the mean start interval above its existing minimum,
        // including insertion before an already reserved outing.
        if(!visitor&&at>=32400&&at<64800&&people.some(p=>{
          const trips=tripsByPerson.get(p.id)||[];
          let cadence=cadenceCache.get(p.id);
          if(!cadence||cadence.length!==trips.length){
            cadence={length:trips.length,count:0,first:Infinity,last:-Infinity};
            for(const e of trips)if(e.start>=32400&&e.start<64800){cadence.count++;cadence.first=Math.min(cadence.first,e.start);cadence.last=Math.max(cadence.last,e.start)}
            cadenceCache.set(p.id,cadence);
          }
          return cadence.count&&Math.max(at,cadence.last)-Math.min(at,cadence.first)<cadence.count*(rules.intervalByPerson?.[p.id]||rules.intervalSeconds)[0];
        }))return false;
        if(people.length>1&&pairKeys(people).some(key=>(pairCounts.get(key)||0)>=(placeTable?.behavior?.pairDailyMax||2)))return false;
        // Every candidate reserves all its actors from at. An existing actor
        // reservation covering that instant cannot be repaired by any card/FIFO.
        const activeAt=visitor?visitorWindow(at).active:ledgerOverlaps(ledger,at,at+.000001).filter(e=>e.start<=at&&at<e.end);
        if(activeAt.some(e=>e.people.some(t=>people.some(p=>p.id===t.id))))return false;
        // Every excursion also reserves its home floor from at. Check this
        // necessary capacity condition before card ranking or trajectory creation.
        const homeFloors=new Set(people.map(p=>visitor?'1f':homeAt(p,at).floor));
        function floorHasRoom(floor){
          const active=visitor?visitorOpportunity.floor1:activeAt.filter(e=>e.people.some(t=>t.seat.anchor!==t.home.anchorId)&&e.people.some(t=>t.home.floor===floor||anchors.get(t.seat.anchor).floor===floor));
          return isLate(at)?active.reduce((n,e)=>n+e.people.length,people.length)<=1:lunch(at)?active.reduce((n,e)=>n+e.people.length,people.length)<=4:active.length<2&&(people.length===1||!active.some(e=>e.people.length>1));
        }
        if([...homeFloors].some(floor=>!floorHasRoom(floor)))return false;
        const freeFloors=visitor?null:new Set(floors.filter(f=>homeFloors.has(f.id)||floorHasRoom(f.id)).map(f=>f.id));

        const deadline=visitor?86400:Math.min(people.length>1?70200:86400-rules.cooldownSeconds,...people.map(p=>nextCommitment(p.id,at)));
        if(deadline-at<(people.length>1?60*rules.groupStayScale:30))return false;
        const neighbours=fill?(people.length===1?[...(tripsByPerson.get(people[0].id)||[])]:result.filter(e=>!e.visitor&&e.people.some(t=>people.some(p=>p.id===t.id)))).sort((a,b)=>a.start-b.start):[];
        if(visitor&&!visitorCards.has(visitor.target))visitorCards.set(visitor.target,places.filter(c=>c.slots.includes(visitor.target)));
        let cards=visitor?visitorCards.get(visitor.target):places.filter(c=>(!joiningCard||c.id===joiningCard.id)&&freeFloors.has(c.floor)&&(
          c.stay[0]*(people.length>1?rules.groupStayScale:1)<=deadline-at&&
          c.room!=='consult'&&!c.slots.includes('reception')&&
          (!(at>=25200&&at<32400)||c.kind==='coffee')&&
          (at<70200||['coffee','sofa'].includes(c.kind))&&
          (people.length===1||people.every(p=>homeAt(p,at).floor===c.floor||(floorTrips.get(p.id)||0)<2))&&
          people.every(p=>fill?neighbours.filter(e=>e.people.some(t=>t.id===p.id)&&e.start<at).at(-1)?.card.id!==c.id&&neighbours.find(e=>e.people.some(t=>t.id===p.id)&&e.start>=at)?.card.id!==c.id:last.get(p.id)?.card!==c.id)&&(!isLate(at)||people.every(p=>homeAt(p,at).floor===c.floor))&&c.slots.length>=people.length));
        // Do not spend the strongest staff invitation on a 1F window that
        // already cannot fit its minimum stay alongside the public bookings.
        if(!visitor&&at>=32400&&at<64800)cards=cards.filter(card=>card.floor!=='1f'||withinCap({start:at,end:at+card.stay[0]*(people.length>1?rules.groupStayScale:1),people,floors:[...new Set([...homeFloors,card.floor])]},true));
        // A sofa consultation can displace a lounge break. Keep the existing
        // rest opportunity at safe same-floor seats or the rooftop, with every
        // cadence, minimum stay and reservation gate still applied below.
        const displacedLounge=!visitor&&consultations.length&&(lunch(at)||ledgerOverlaps(consultations,at,at+600).length);
        const rankBase=visitor?'':day+'|card|'+people.map(p=>p.id).join()+'|'+at+'|';
        const rankSeed=visitor?0:seed(rankBase),slotSeed=visitor?0:seed(day+'|slot|'+at);
        // Keep the lunch rest target with one fewer person when he is absent.
        const restPriority=lunch(at)?(options.chairmanPresent?16:10):null;
        if(!visitor||cards.length>1)cards=cards.map(c=>({c,rank:visitor?seed(day+at+c.id):-Math.log(Math.max(.000001,seedTail(rankSeed,c.id)/4294967296))/(weight(c,people,at)*(displacedLounge&&(c.floor==='5f'||people.every(p=>homeAt(p,at).floor===c.floor))&&['coffee','sofa','garden','terrace','window'].includes(c.kind)?(restPriority??(c.floor==='5f'?4:17)):1))})).sort((a,b)=>a.rank-b.rank||a.c.id.localeCompare(b.c.id)).map(r=>r.c);
        if(!visitor&&!fill&&at-(lastFloor.get(homeAt(people[0],at).floor)??-Infinity)<BLOCK)cards=cards.slice(0,3);
        // During work hours allow three ranked cards, so a busy cafe does not
        // suppress an otherwise legal rest upstairs. Other hours retain one.
        for(const card of cards.slice(0,at>=32400&&at<64800?3:1)){
          // Even without travel/FIFO the complete minimum stay consumes these
          // floor units. Reject impossible windows before building any routes.
          if(!visitor&&!withinCap({start:at,end:at+card.stay[0]*(people.length>1?rules.groupStayScale:1),people,floors:[...new Set([...homeFloors,card.floor])]},true))continue;
          const orderKey=card.id+'|'+at;
          if(!visitor&&!slotOrders.has(orderKey))slotOrders.set(orderKey,card.slots.map(id=>({id,rank:seedTail(slotSeed,id)})).sort((a,b)=>a.rank-b.rank).map(p=>p.id));
          const slots=visitor?[visitor.target]:slotOrders.get(orderKey);
          let proposals=0;
          for(let offset=0;offset<slots.length&&proposals<1;offset++){
            const range=visitor?.stay||card.stay,scale=people.length>1?rules.groupStayScale:1;
            const homes=people.map(p=>visitor?{floor:'1f',anchorId:'arrival_gate'}:homeAt(p,at));
            const destinations=people.map((p,i)=>slots[(offset+i)%slots.length]);
            // Displaced lounge groups must fit their replacement chairs on
            // phones too. FIFO cannot repair overlapping stationary partners.
            if(people.some((p,i)=>(anchors.get(destinations[i]).floor==='1f'||displacedLounge)&&people.some((q,j)=>j<i&&destinations[i]!==homes[i].anchorId&&destinations[j]!==homes[j].anchorId&&screenOverlap(slot(destinations[i],card.pose),slot(destinations[j],card.pose)))))continue;
            const sameHomePhase=![3600,25200,64800].some(s=>at<s&&s<deadline);
            // A constant home phase gives the same answer for every possible
            // stay in this window, before travel or leg allocation.
            if(sameHomePhase&&people.some((p,i)=>!screenHomeClear(p.id,homes[i].anchorId,slot(destinations[i],card.pose),allowed,at,deadline)))continue;
            if(!visitor&&![3600,25200,64800].some(s=>at<s&&s<deadline)&&people.some((p,i)=>blockedGeometry(p,homes[i],destinations[i],at,deadline)))continue;
            const travel=people.map((p,i)=>{const home=visitor?{anchorId:'arrival_gate'}:homeAt(p,at),target=slots[(offset+i)%slots.length];return pathDuration(path(home.anchorId,target))+pathDuration(path(target,home.anchorId))+i*1.5});
            // Choose a legal stay within the available formal-calendar gap. Its
            // minimum is never shortened, and a 10-minute boundary has no role.
            const ceiling=Math.min(range[1],Math.floor((deadline-at-Math.max(...travel))/scale));
            if(ceiling<range[0])continue;
            const stay=(range[0]+seed(day+'|stay|'+at+card.id)%(ceiling-range[0]+1))*scale;
            // The minimum destination stay is unavoidable even if FIFO adds
            // waits. Reject occupied phone slots before allocating trajectories.
            if(card.floor==='1f'&&people.some((p,i)=>{
              const start=at+i*1.5+pathDuration(path(homes[i].anchorId,destinations[i])),end=start+stay;
              const stop={id:p.id,home:homes[i].anchorId,seat:slot(destinations[i],card.pose),start,end};
              return ledgerOverlaps(ledger,start,end).some(e=>stationaryStops(e).some(q=>screenStopConflict(stop,q)));
            }))continue;
            // The proposal's travel/stay horizon owns this cache key. A later
            // deadline must not reserve evening lounge homes during daytime.
            // FIFO extensions still pass reserve() with their complete interval.
            if(!sameHomePhase&&people.some((p,i)=>!screenHomeClear(p.id,homes[i].anchorId,slot(destinations[i],card.pose),allowed,at,Math.min(deadline,at+Math.max(...travel)+stay))))continue;
            // Resolve static home/path geometry before allocating legs or FIFO.
            // No phase boundary may lie in the possible interval. Positive proofs
            // never bypass temporal, resource, capacity or continuous sweep checks.
            if(![3600,25200,64800].some(s=>at<s&&s<deadline)&&people.some((p,i)=>!clearHomeRoute({id:p.id,home:homes[i],seat:slot(destinations[i],card.pose),outbound:path(homes[i].anchorId,destinations[i]),inbound:path(destinations[i],homes[i].anchorId)},allowed,at,deadline)))continue;
            proposals++;
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
              for(const t of e.people){for(let i=0;i<t.out.length;i++){const leg=t.out[i],duration=leg.end-leg.start,conflicts=used.filter(other=>leg.from===other.from||leg.from===other.to||leg.to===other.from||leg.to===other.to);let begin=leg.start,changed=true;
                  while(changed){changed=false;for(const other of conflicts)if(begin<other.end+.2&&other.start<begin+duration){begin=other.end+.2;changed=true}}
                  const shift=begin-leg.start;if(shift)for(const l of t.out.slice(i)){l.start+=shift;l.end+=shift}used.push(leg);
                }}
              e.performStart=Math.max(...e.people.map(t=>t.out.at(-1).end));const commonEnd=e.performStart+stay;e.performEnd=commonEnd;
              let cursor=commonEnd;for(const t of e.people){const shift=cursor-t.back[0].start;for(const l of t.back){l.start+=shift;l.end+=shift}cursor=t.back.at(-1).end}
              e.end=Math.max(...e.people.map(t=>t.back.at(-1).end));
              e.group=people.map(p=>p.id);e.companion=placeTable.companions.find(r=>r.people.every(id=>e.group.includes(id)));
            }
            if(e.end>deadline||!visitor&&!withinCap(e)||visitor&&ledgerOverlaps(result,e.start,e.end).filter(q=>q.visitor&&overlap(q,e)).length>=publicSlots(at))continue;
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
            if(ledgerOverlaps(ledger,at,at+.001).some(e=>e.people.some(t=>t.id===p.id||t.id==='seongmin')))continue;
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
      // Book public appointments before optional staff outings. Two persistent
      // actors share one public unit at 10–17h, leaving room for staff rests.
      // Clock phases favour parcels, deliveries and appointments; reserve() owns
      // capacities, target uniqueness, gate FIFO and every swept trajectory.
      // Takeaway pairs retain the two distinct service slots, then cool down.
      const guestLast=new Map(),guestCadence={client:190,candidate:400,rider:40,generic:600};let takeaways=0;
      const guestChoices=new Map();
      for(let at=32400;at<72000;at+=20){
        // Choose the first available persistent visitor before ranking visits.
        // Both actors busy means no kind or destination can book this tick.
        const id=['visitor','visitor-2'].find(id=>(visitorUntil.get(id)||0)<=at+1);
        if(!id)continue;
        // This is the same necessary floor-capacity condition as attempt().
        // Reject a full window once, before ranking every kind and waiting seat.
        const active=visitorWindow(at+1).floor1;
        if(active.filter(e=>e.visitor).length>=publicSlots(at))continue;
        if(at+1>=41400&&at+1<46800?active.reduce((n,e)=>n+e.people.length,1)>4:active.length>=2)continue;
        const kinds=visitorKinds.filter(v=>(weekday||!v.weekdayOnly)&&at-(guestLast.get(v.kind)??-Infinity)>=(guestCadence[v.kind]||0)&&v.hours.some(([a,b])=>at/3600>=a&&at/3600<b));
        const ranked=kinds.map(v=>({v,rank:-Math.log(Math.max(.000001,unit(day+'|guest-kind|'+at+v.kind)))/(['client','candidate'].includes(v.kind)?5:v.kind==='courier'&&at<36000?4:v.kind==='rider'&&lunch(at)?5:1)})).sort((a,b)=>a.rank-b.rank);
        {
          let booked=false;
          for(const {v}of ranked){
            // Booths share the phone footprint of fixed business homes. Every
            // appointment waits on an existing lobby sofa, even with an absent
            // desk owner; reserve the same full round trip and waiting words.
            const target=anchors.get(v.target);
            if(!visitorTargets.has(v.target))visitorTargets.set(v.target,v.target==='coffee_counter'?places.find(c=>c.id==='coffee-1f').slots:target.room==='consult'?(places.find(c=>c.id==='cafe-1f')?.slots||[]):[v.target]);
            const choiceKey=v.kind+'|'+(isLate(at)||isEvening(at))+'|'+(isLate(at+1)||isEvening(at+1));
            if(!guestChoices.has(choiceKey))guestChoices.set(choiceKey,visitorTargets.get(v.target).filter(destination=>screenHomeClear(id,'arrival_gate',slot(destination,'stand'),allowed,at,at+1)));
            const targets=guestChoices.get(choiceKey);
            for(const destination of targets){
              const waiting=anchors.get(destination).room==='cafe'&&target.room==='consult';
              const visit=destination===v.target?v:{...v,target:destination,...(waiting?{go:v.kind==='client'?'상담 대기석으로 가는 중':'면접 대기석으로 가는 중',at:v.kind==='client'?'상담 대기 중':'면접 대기 중… 두근'}:{})};
              if(attempt([{id}],at+1,visit)){if(v.kind!=='generic'||++takeaways%2===0)guestLast.set(v.kind,at);booked=true;break}
            }
            if(booked)break;
          }
        }
      }
      // Reserve appointments before optional staff outings and errands.
      const arrivalKeys=new Set(),arrivalKey=(anchor,time)=>anchor+'|'+Math.floor(time/600);
      for(const e of [...events,...result])for(const t of e.people)if(t.out.length)arrivalKeys.add(arrivalKey(t.seat.anchor,t.out.at(-1).end));
      // A host visits a real free approach node while the guest is stationary.
      // Both trajectories remain in the same reservation ledger; no host teleport.
      const hostErrands=new Map(),hostSlots=new Map(),hostChoices=new Map(),hostCards=new Map(errandPlaces.filter(c=>c.hostOnly).map(c=>[c.slots[0],c]));
      for(const id of placeTable?.behavior?.visitorHosts||[])hostErrands.set(id,result.filter(q=>q.card.kind==='errand'&&q.people.some(t=>t.id===id)).sort((a,b)=>a.start-b.start));
      function reserveHosts(guests){
      // Spread one consultation per two visits of each kind across the day,
      // carrying failed opportunities forward. Unhosted guests keep waiting.
      const seen=new Map(),served=new Map();
      for(const guest of guests){
        const kind=guest.visitor.kind,n=(seen.get(kind)||0)+1;seen.set(kind,n);
        if(['client','candidate'].includes(kind)&&(served.get(kind)||0)>=Math.ceil(n/2))continue;
        const destination=guest.people[0].seat,point=pixels([destination.x,destination.y]);
        const hosts=(placeTable?.behavior?.visitorHosts||[]).map(id=>personById.get(id)).filter(p=>p&&allowed.includes(p)&&homeAt(p,guest.performStart).floor==='1f');
        // Existing host approach cards stay in the same room, but the old
        // 160-art-pixel radius was smaller than one phone sprite footprint.
        if(!hostSlots.has(destination.anchor))hostSlots.set(destination.anchor,[...anchors.values()].filter(a=>hostCards.has(a.id)&&a.floor==='1f'&&a.room===anchors.get(destination.anchor).room&&a.type==='junction'&&(()=>{const q=pixels(visualPoint(a)),d=Math.hypot(q[0]-point[0],q[1]-point[1]);return d>=170&&d<=400})()));
        const slots=hostSlots.get(destination.anchor);
        let booked=false;
        // Sofa appointments can meet a host later in their existing stay.
        // Delivery greetings retain their arrival-only opportunity.
        const consultation=['client','candidate'].includes(guest.visitor.kind);
        for(let at=guest.performStart;at<(consultation?guest.performEnd-8:Math.min(guest.performEnd-8,guest.performStart+15))&&!booked;at+=15)for(const p of hosts){
         if(consultation&&lunch(at))continue;
         const errands=hostErrands.get(p.id);
         if(errands.some(q=>Math.abs(q.start-at)<360))continue;
         const deadline=Math.min(guest.performEnd,nextCommitment(p.id,at),at+60);
         if(deadline-at<8)continue;
         if(ledgerOverlaps(ledger,at,at+.001).some(e=>e.people.some(t=>t.id===p.id)))continue;
         const home=homeAt(p,at),choiceKey=destination.anchor+'|'+p.id+'|'+home.anchorId+'|'+(isLate(at)||isEvening(at))+'|'+(isLate(deadline-.001)||isEvening(deadline-.001));
         if(!hostChoices.has(choiceKey))hostChoices.set(choiceKey,slots.filter(target=>screenHomeClear(p.id,home.anchorId,slot(target.id,'stand'),allowed,at,deadline)).map(target=>({target,duration:pathDuration(path(home.anchorId,target.id)),back:pathDuration(path(target.id,home.anchorId))})));
         for(const {target,duration,back} of hostChoices.get(choiceKey)){
          if(blockedGeometry(p,home,target.id,at,deadline))continue;
          const stay=Math.min(15,guest.performEnd-at-duration);
          if(stay<8)continue;
          if(at+stay+duration+back>deadline)continue;
          const c=hostCards.get(target.id),e=excursion(p.id,home,c,target.id,at,stay,day,null,deadline);
          if(!e||errands.some(q=>Math.abs(q.start-e.start)<360)||errands.filter(q=>q.start<e.start).at(-1)?.card.id===c.id||errands.find(q=>q.start>e.start)?.card.id===c.id)continue;
          if(arrivalKeys.has(arrivalKey(target.id,e.performStart)))continue;
          if(!e||!reserve(e,ledger,allowed))continue;
          e.guestId=guest.id;result.push(e);if(consultation)consultations.push(e);errands.push(e);errands.sort((a,b)=>a.start-b.start);arrivalKeys.add(arrivalKey(target.id,e.performStart));served.set(kind,(served.get(kind)||0)+1);booked=true;break;
        }if(booked)break}
      }
      }
      reserveHosts(result.filter(e=>['client','candidate'].includes(e.visitor?.kind)));
      // Lunch has four-person capacity. Offer the same reservation path every
      // 45 seconds there; retain the 180s clock and all personal gates otherwise.
      for(let at=0;at<86400;at+=lunch(at)?45:180){
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
          const candidates=available.slice(0,2),overdue=available.slice(2).find(p=>at-(due.get(p.id)??at)>=600);
          if(overdue)candidates.push(overdue);
          for(const p of candidates){
            let booked=attempt([p],at);
            // Sparse floors have fewer free calendar gaps. Once overdue, try
            // nearby clock phases instead of synchronizing forever with the
            // 40-second formal microexpression cadence.
            if(!booked&&overdueSparse(p))for(const delay of [15,30,45])if(attempt([p],at+delay,null,true)){booked=true;break}
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
            for(const p of peers.slice(0,1))if(attempt([p],time,null,false,stay.card))break;
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
      const errandLast=new Map(),errandDue=new Map(),errandTrips=result.filter(e=>e.card.kind==='errand');
      const bookedOutings=new Map(physical.map(p=>[p.id,(tripsByPerson.get(p.id)||[]).slice().sort((a,b)=>a.start-b.start)]));
      function nextOuting(id,at){const list=bookedOutings.get(id)||[];let lo=0,hi=list.length;while(lo<hi){const mid=(lo+hi)>>>1;if(list[mid].end<=at)lo=mid+1;else hi=mid}return list[lo]?Math.max(at,list[lo].start):86400}
      for(const e of [...events,...result])for(const t of e.people)if(t.out.length)arrivalKeys.add(arrivalKey(t.seat.anchor,t.out.at(-1).end));
      const collaborative=new Set(['seoyun','yuri','gaeun','hani','yuna','sua']);
      const choices=new Map();
      for(const p of physical)choices.set(p.id,errandPlaces.filter(c=>!c.hostOnly&&c.floor===p.home.floor&&c.targetPerson!==p.id&&(c.errandKind!=='delivery'||c.room!==p.home.room)).map(c=>{
        const target=personById.get(c.targetPerson),score=target?(relationshipScores.get(p.id+'|'+target.id)||0):0;
        return {c,weight:c.errandKind==='colleague'?(target.home.room===p.home.room?4:2)*(1+score/25):1};
      }));
      const errandPhases=new Map(physical.map(p=>[p.id,seed(day+'|errand-phase|'+p.id)%90]));
      const screenErrandChoices=new Map(),screenErrandSlots=new Map();
      for(let tick=32400;tick<75600;tick+=90){
        for(const p of physical){
         // Retry scarce 1F stops and overdue displaced-rest gaps inside the
         // existing clock window; accepted errands still own their full cadence.
         for(const delay of p.home.floor==='1f'||consultations.length&&tick>(errandDue.get(p.id)??Infinity)+600?[0,30,60]:[0]){
          const at=tick+errandPhases.get(p.id)+delay;
          if(hostErrands.get(p.id)?.some(e=>Math.abs(e.start-at)<360))continue;
          if(at+60>75600)continue;
          if(at<(errandDue.get(p.id)??(32400+seed(day+'|errand-first|'+p.id)%540)))continue;
          // A future leisure booking is already frozen. Any errand extending
          // into it would fail the same actor reservation in reserve().
          const deadline=Math.min(at+60,nextCommitment(p.id,at),nextOuting(p.id,at));if(deadline-at<8)continue;
          const near=ledgerOverlaps(ledger,at,at+1);
          if(near.some(e=>e.people.some(t=>t.id===p.id)||e.card?.targetPerson===p.id))continue;
          const home=homeAt(p,at),previous=errandLast.get(p.id);
          // Every same-floor errand consumes a full excursion unit immediately.
          // A full floor cannot accept any card or target at this tick.
          const moving=near.filter(e=>motion(e).moving&&e.people.some(t=>t.home.floor===home.floor||anchors.get(t.seat.anchor).floor===home.floor));
          if(lunch(at)?moving.reduce((n,e)=>n+e.people.length,1)>4:moving.length>=2)continue;
          const sameHomePhase=![3600,25200,64800].some(s=>at<s&&s<deadline);
          const screenKey=p.id+'|'+home.anchorId+'|'+(isLate(at)||isEvening(at));
          if(sameHomePhase&&!screenErrandChoices.has(screenKey)){
            const slots=new Map();
            for(const {c} of choices.get(p.id))slots.set(c.id,c.slots.filter(target=>screenHomeClear(p.id,home.anchorId,slot(target,c.pose),allowed,at,deadline)));
            screenErrandSlots.set(screenKey,slots);
            screenErrandChoices.set(screenKey,choices.get(p.id).filter(({c})=>slots.get(c.id).length));
          }
          const errandSeed=seed(day+'|errand|'+p.id+'|'+at+'|');
          const cards=(sameHomePhase?screenErrandChoices.get(screenKey):choices.get(p.id)).filter(({c})=>c.floor===home.floor&&c.id!==previous).map(({c,weight})=>{
            return {c,rank:-Math.log(Math.max(.000001,seedTail(errandSeed,c.id)/4294967296))/weight};
          }).sort((a,b)=>a.rank-b.rank);
          let booked=false;
          // Retry on the existing next tick instead of exhausting every errand
          // destination. Rest stays and their reservation budget remain intact.
          for(const {c}of cards.slice(0,2)){
            if(c.targetPerson&&(!allowed.some(q=>q.id===c.targetPerson)||!presentAt(c.targetPerson,at)||homeAt(personById.get(c.targetPerson),at).anchorId!==personById.get(c.targetPerson).home.anchorId||near.some(e=>e.people.some(t=>t.id===c.targetPerson&&t.seat.anchor!==t.home.anchorId))))continue;
            for(const target of sameHomePhase?screenErrandSlots.get(screenKey).get(c.id):c.slots){
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
          if(booked)break;
         }
        }
      }
      for(const id of hostErrands.keys())hostErrands.set(id,result.filter(q=>q.card.kind==='errand'&&q.people.some(t=>t.id===id)).sort((a,b)=>a.start-b.start));
      reserveHosts(result.filter(e=>e.visitor&&!['client','candidate'].includes(e.visitor.kind)));
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
        // A brief stretch uses the existing pose slot at the same reserved
        // chair. Keep the long-rest words and reduced-motion seated pose intact.
        if(card?.id==='cafe-1f'&&performing&&!options.reducedMotion&&Math.floor(seconds+seed(p.id)%30)%30===0)state.seat=slot(t.seat.anchor,'stand');
        return {id:p.id,...state,visitor:!!p.visitor,...(p.visitor?event.visitor:{}),idle:!event||!!card,plain,stroll:!!card&&!p.visitor&&!options.reducedMotion,home:p.home?.floor||'1f',
          pose:state.walking?(Math.floor(seconds*5)%2?'walk-a':'walk-b'):state.seat.posture,activity:p.visitor?'visit':event&&!card?(action.personalNonWork?'rest':action.layer===3?'meeting':'work'):lounge||card?.id==='cafe-1f'&&state.state==='AT_PLACE'?'rest':'work',
          actionId:event&&!card&&(performing||state.state==='AT_PLACE')?action.id:'base-work',eventId:card?undefined:event?.id,outingId:card?event.id:undefined,groupIds:event?.group,placeId:card?.id,targetAnchor:t?.seat.anchor,line,
          emoji:performing&&!card?(action.actorOverrides?.[p.id]?.emoji||action.performance.emoji):'',personalNonWork:action?.personalNonWork};
      };
      const entries=persons.filter(p=>(p.id!=='seongmin'||options.chairmanPresent)&&(!options.presentIds||options.presentIds.includes(p.id))&&!blocked.has(p.id)&&presentAt(p.id,seconds)).map(p=>render(p,
        active.find(e=>e.people.some(t=>t.id===p.id))||visibleOutings.find(e=>!e.visitor&&e.start<=seconds&&seconds<e.end&&e.people.some(t=>t.id===p.id)))).filter(Boolean);
      for(const pair of placeTable?.behavior?.deskPairs||[]){
        const peers=pair.people.map(id=>entries.find(p=>p.id===id));
        if(peers.some(p=>!p||p.eventId||p.outingId||p.state!=='AT_HOME')||peers[0].floor!==peers[1].floor||gap(peers[0],peers[1])>350)continue;
        const k=Math.floor(seconds/BEAT),j=Array.from({length:Math.ceil(ACTIVE_BEATS)},(_,i)=>k-i).find(j=>beatPick(day,peers[0].floor,j)===pair.people[0]&&Math.floor(j/MIN_CYCLE)%7===seed(pair.people.join())%7);
        if(j==null||seconds>=j*BEAT+ACTIVE_BEATS*BEAT||ledgerOverlaps(idleLedger,j*BEAT-5,j*BEAT+ACTIVE_BEATS*BEAT+2).some(e=>e.people.some(t=>pair.people.includes(t.id))))continue;
        // Homes remain untouched, including their documented overlaps. Only
        // start a NEW turning/talking gesture if its phone envelope is clear.
        if(!deskPairScreenClear(peers,entries,idleLedger,j*BEAT,j*BEAT+ACTIVE_BEATS*BEAT,options.reducedMotion))continue;
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
        // Arrival/return FIFO waits own their words until every partner is ready.
        if(seconds<e.performStart||seconds>=e.performEnd)continue;
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
      // The existing colleague visit owns the reply until departure. Derive
      // a secret-play reaction from the arrival clock, never from prior reads.
      for(const e of visibleOutings)if(e.card.errandKind==='colleague'&&e.performStart<=seconds&&seconds<e.performEnd){
        const chair=entries.find(p=>p.id==='seongmin'&&p.outingId===e.id&&p.state==='AT_PLACE'),staff=entries.find(p=>p.id===e.card.targetPerson);
        if(!chair||!staff||staff.walking||staff.outingId||staff.seat.anchor!==personById.get(staff.id).home.anchorId)continue;
        const home=homeAt(personById.get(staff.id),e.performStart),own=events.find(q=>q.start<=e.performStart&&e.performStart<q.end&&!cancelled.has(q.id)&&q.people.some(t=>t.id===staff.id));
        const idle=own?speech(actions.get(own.actionId)||defaults,staff.id,day):idleFlavour(day,staff.id,home.floor,e.performStart,false,isLate(e.performStart),idleLedger)?.line||workLines[staff.id];
        const secret=/몰래|인스타|고양이 영상|사진첩|게임/.test(idle),caught=seed(day+'|'+e.id+'|caught-out')%12===0;
        staff.line=(secret||caught)&&seconds<(e.performStart+e.performEnd)/2?(/인스타/.test(idle)||caught?'급하게 인스타 끄는 중':'급하게 창 닫는 중'):chair.line.includes('화면')?'회장님께 화면 설명 중':'회장님 질문 듣는 중';
        staff.plain=false;staff.behaviorKind='chairman-desk-reply';staff.deskPartner=chair.id;chair.deskPartner=staff.id;
      }
      const guests=visibleOutings.filter(e=>e.visitor&&e.start<=seconds&&seconds<e.end);
      const visitors=guests.map(guest=>render({id:guest.people[0].id,visitor:true},guest)).filter(p=>p&&(!options.reducedMotion||p.state==='AT_PLACE'));
      for(const guest of guests){const visitor=visitors.find(v=>v.id===guest.people[0].id);if(visitor?.state==='AT_PLACE')for(const p of entries){const host=visibleOutings.find(e=>e.id===p.outingId&&e.guestId===guest.id);if(host&&p.state==='AT_PLACE'&&seconds>=host.performStart&&seconds<host.performEnd){p.visitorPartner=guest.id;visitor.hostId=p.id;const interview=guest.visitor.kind==='candidate',consultation=interview||guest.visitor.kind==='client';visitor.line=visitor.at=consultation?(interview?'면접 보는 중':'상담 받는 중'):placeTable.behavior.visitorReply;p.line=interview?'면접 진행 중':consultation?'상담 중':placeTable.behavior.visitorHostLine}}}
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
  // UI-only authored actions: match the full source, never the lossy shortLine.
  // Lengths include spaces. Names (including the longest guest name) stay whole:
  // name <=9 + " · " (3) + action <=6 = at most 18 Unicode characters.
  const phoneActions=[
    [/급하게 인스타 끄는 중/,'인스타 끄기',true],[/급하게 창 닫는 중/,'창 닫기',true],
    [/회장님 질문 듣는 중/,'질문 듣기',true],[/회장님께 화면 설명 중/,'화면 설명',true],
    [/상담 중/,'상담 중',true],[/면접 진행 중/,'면접 진행',true],[/면접 보는 중/,'면접 보기',true],
    [/^상담 대기 중$/,'상담 대기',true],[/^면접 대기 중… 두근$/,'면접 대기',true],
    [/^알람 이름 짧게 바꾸는 중$/,'알람 이름|알람 정리|이름 바꾸기'],
    [/조용한 밤이라 메모가 잘 써지네요\.$/,'메모 쓰기|메모 작성|밤 메모'],[/오늘 기억할 장면을 적어둘게요\.$/,'장면 기록|장면 적기|장면 메모'],
    [/라운지에서 오늘 고생했다고 말하는 중$/,'수고 인사|격려 인사|수고 전하기'],[/소파에서 내일 할 일 적는 중$/,'내일 할일|할일 적기|내일 메모'],
    [/라운지에서 마지막 버스 확인 중$/,'막차 확인|버스 확인|막차 점검'],[/옥상 정원에서 화분 살피는 중$/,'화분 살피기|화분 관찰|화분 보기'],
    [/임원 라운지 소파에서 AI 오케스트레이션 메모 펼쳐 보는 중$/,'AI 메모|메모 펼치기|메모 살피기'],[/바뀐 범위부터 다시 확인할게요\.$/,'범위 확인|범위 점검|범위 살피기'],
    [/다음 장도 천천히 볼까요\.$/,'다음장 보기|다음장 읽기|다음장 확인'],[/자료 탭을 하나씩 맞춰볼게요\.$/,'자료 맞추기|자료 점검|자료 맞대기'],
    [/^회장님께 보고하러 가는 중$/,'보고하러 이동|보고하러 걷기|보고 이동'],
    [/회장님께 .*보고/,'회장님보고|보고 드리기|안건 보고'],[/좋아요, 이대로/,'진행 승인|안건 승인|진행 허가'],
    [/회장님.*인사|회장님.*오셨|회장님.*안녕/,'도착 인사|환영 인사|인사 건네기'],
    [/돌아가는|복귀|안녕히 계세요/,'자리 복귀|자리로 복귀|복귀 걷기'],
    [/커피 내리러/,'커피 내리러|커피준비 이동|커피준비하러'],[/커피.*(?:가[는기]|이동)/,'커피 사러감|커피점 이동|커피로 이동'],
    [/가는 중|이동 중|안내받아 가/,'목적지 이동|걸어서 이동|목적지 걷기'],
    [/커피.*내리/,'커피 내리기|커피 추출|커피 만들기'],[/커피.*주문/,'커피 주문|커피 고르기|커피 주문중'],
    [/커피.*(?:마시|모금|한 잔)/,'커피 마시기|커피 한모금|커피 홀짝'],[/커피.*리필/,'리필 고민|커피 더고민|리필 고르기'],
    [/택배.*(?:두고|왔|전달)/,'택배 전달|택배 놓기|택배 내려둠'],[/배달.*왔/,'음식 배달|배달 전달|음식 전달'],
    [/면접.*대기/,'면접 대기|면접 기다림|면접 준비'],[/상담.*받/,'상담 받기',true],
    [/보고.*기다/,'보고 기다림|보고 대기|보고 준비'],[/기다리|대기|기다리는/,'차례 기다림|순서 기다림|차례 대기'],
    [/퀴즈/,'퀴즈 풀기|퀴즈 풀이|문제 풀기|퀴즈 도전|문제 풀이|정답 찾기|퀴즈 맞히기|퀴즈 연습'],
    [/창밖|풍경|별빛|별 보는/,'창밖 구경|풍경 감상|창밖 바라봄|풍경 바라봄'],
    [/보고서/,'보고서 작성|보고서 정리|보고서 쓰기'],[/예산|비용|지출|금액/,'예산 검산|비용 계산|예산 점검|지출 검산'],
    [/기사.*구상|콘텐츠.*구상|콘텐츠.*제목/,'기사 구상|기사 밑그림|제목 구상'],[/기획.*정리|기획.*범위/,'기획안 정리|기획 정리|기획 다듬기'],
    [/요청.*분류/,'요청 분류|요청 나누기|요청 구분'],[/일정.*조율/,'일정 조율|일정 맞추기|일정 조정'],
    [/설계.*검토|설계.*영향/,'설계 검토|설계 살피기|설계 대조'],[/코드.*수정|버그.*끝내|오타.*고치/,'코드 수정|버그 수정|코드 고치기'],
    [/수치.*분석/,'수치 분석|숫자 분석|수치 읽기'],[/품질.*점검|예외|엣지 케이스/,'품질 점검|예외 찾기|품질 검사'],
    [/화면.*검토|작은 화면/,'화면 검토|화면 살피기|화면 점검'],[/검증.*기록/,'검증 기록|검증 적기|결과 기록'],
    [/자료.*대조/,'자료 대조|자료 비교|자료 맞추기'],[/접수.*확인/,'접수 점검|접수 읽기|접수 살피기'],
    [/안내.*준비/,'안내 준비|안내 채비|안내 챙기기'],[/결재|도장(?! 모양 낙서 중$)/,'결재 검토|결재 살피기|안건 검토'],
    [/흐름.*살피|흐름.*연결/,'흐름 검토|흐름 살피기|흐름 점검'],[/일정.*확인|일정.*겹침/,'일정 점검|일정 살피기|일정 대조'],
    [/문장.*다듬|문장.*줄이/,'문장 다듬기|문장 퇴고|문장 고치기'],[/메모.*순서|기록.*순서/,'메모 재배열|기록 재배열|메모 순서'],
    [/기록.*정리/,'기록 정리|기록 묶기|기록 나누기'],[/업무 메모|메모 중|메모만/,'메모 쓰기|메모 작성|메모 적기|기록 남기기|메모 남기기|내용 적기|메모 옮기기|노트 적기'],
    [/별.*그리|별표|동그라미|밑줄/,'메모 표시|별표 그리기|밑줄 긋기|표시 남기기'],[/아이디어|구상/,'구상 메모|아이디어 짜기|생각 적기'],
    [/음악|노래|플레이리스트|흥얼/,'음악 감상|노래 듣기|음악 듣기|노래 흥얼'],[/인스타/,'인스타 보기|피드 둘러봄|인스타 순찰'],
    [/영상|고양이/,'영상 보기|영상 감상|영상 시청'],[/간식.*가격|가격표|구독.*비교/,'가격 비교|가격 대조|가격 살피기'],
    [/기지개|스트레칭|어깨|손목|발목|손가락/,'몸 풀기|기지개 켜기|관절 풀기|몸 늘이기'],
    [/물.*모금|물.*마시|차.*모금/,'물 마시기|물 한모금|목 축이기'],[/수다|이야기 나누|이야기 중|질문 나누/,'수다 나누기|대화 나누기|말 주고받기|이야기 나눔'],
    [/쉬는|휴식|눈.*쉬|눈 감고/,'눈 쉬기|잠깐 쉬기|눈 휴식|휴식 취하기'],[/졸|꾸벅|하품/,'졸음 쫓기|잠 깨기|졸음 참기'],
    [/인사|손 흔드/,'인사 건네기|작별 인사|안부 나누기'],[/테스트|검증/,'테스트 점검|결과 살피기|검증하기'],
    [/간식|야식|메뉴|식단|투표|저녁 뭐/,'메뉴 고르기|먹거리 고름|식단 구상|간식 고르기'],[/그리|낙서|스케치/,'그림 그리기|낙서 하기|스케치 하기'],
    [/읽|책갈피|페이지/,'문장 읽기|글 읽기|독서 하기|읽던글 보기'],[/웃|미소/,'미소 짓기|웃음 짓기|살짝 웃기'],
    [/조언|설명.*듣/,'설명 듣기|조언 듣기|이야기 듣기'],[/공부|단어|외우|복습/,'단어 복습|공부 하기|단어 외우기']
  ];
  function phoneStatusLine(line,used=new Set(),state='work',compact=true){
    const eventStatus={'간식 먹는 중':'간식먹기','커피 마시는 중':'커피타임','칭찬 받는 중':'칭찬받기','화이팅 외치는 중':'화이팅','생일 축하 중':'생일축하'};
    if(eventStatus[line]){const result=compact?eventStatus[line]:line;used.add(result);return result}
    const report=line.match(/회장님께 (.+?) 보고/);
    if(report){const topic=report[1].replace(/^(오늘|다음) /,'').split(' ')[0],short=/^[가-힣A-Za-z0-9]{1,4}$/.test(topic)?topic+(compact?'':' ')+'보고':compact?'회장보고':'회장 보고';used.add(short);return short}
    const known=scheduler?.shortLine(line),action=phoneActions.find(([pattern])=>pattern.test(line)),authored=known==='회장님께 인사 중'?'도착 인사|환영 인사|인사 건네기':known==='보고 답변 중'?'보고 답변|보고 응답|답변 전하기':action?.[1];
    // Exact consultation/reply words stay exact even when another actor used them.
    if(action?.[2]){const result=compact?authored.replace(/ /g,''):authored;used.add(result);return result}
    // Future sentences use whole, state-based phrases; never slice source words.
    const fallback={work:'근무 중|일하는 중|업무 진행|근무 계속|근무 이어감|업무 이어감|업무 진행중|업무 보는중',rest:'휴식 중|쉬는 중|잠깐 휴식|휴식 취하기|잠시 쉬기|쉬어 가기|휴식 이어감|잠깐 쉬기',meeting:'회의 중|회의 참여|회의 진행|회의 참석|회의 함께|회의 나눔|회의 이어감|회의 진행중',moving:'이동 중|걸어가는 중|목적지 이동|걷는 중|이동 계속|이동 이어감|걸어서 이동|목적지 걷기',night:'야근 중|야간 근무|야근 진행|야근 계속|야근 이어감|야간 작업|밤 근무중|야근 진행중'};
    const options=(authored||fallback[state]||fallback.work).split('|');
    const choices=(compact?[...options.map(w=>w.replace(/ /g,'')),...options]:options).filter(w=>[...w].length>=2&&[...w].length<=(compact?6:8));
    const result=choices.find(w=>!used.has(w))||choices[0];used.add(result);return result;
  }
  function placeStatusLabels(floor,groups,obstacles=[]){
    const gap=groups.some(g=>g.compact)?.5:2,ordered=groups.slice().sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
    // Every sprite (including one's own face) is reserved before any label.
    // Actual sprite bounds include the partner turn; reserve idle motion too.
    const sprites=groups.map(g=>{const r=g.sprite?.width?g.sprite:g.actor,pad=Math.max(g.compact?1:2,r.height*.02);return {left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad}});
    // Floating-point edge arithmetic must not reject an exactly 2px gap.
    const overlaps=(a,b)=>a.left<b.right+gap-1e-7&&a.right+gap>b.left+1e-7&&a.top<b.bottom+gap-1e-7&&a.bottom+gap>b.top+1e-7;
    const boxGap=(a,b)=>Math.hypot(Math.max(a.left-b.right,b.left-a.right,0),Math.max(a.top-b.bottom,b.top-a.bottom,0));
    let best=null,bestScore=null;
    const fixed=[...obstacles,...sprites],pools=new Map(ordered.map(g=>[g.id,new Map()]));
    const phone=groups.some(g=>g.compact),value=s=>phone?[s[0],s[0]+s[1]+s[2],s[1],s[3]]:s;
    const compare=(a,b)=>{a=value(a);b=value(b);for(let i=0;i<4;i++)if(a[i]!==b[i])return b[i]-a[i];return 0};
    const positions=(g,b)=>{if(g.compact)return {name:{left:b.left,top:b.top},status:null};const d=floor.width<=600?0:gap;return b.inline?{name:{left:b.left,top:b.top},status:{left:b.left+g.name.width+d,top:b.top}}:{name:{left:b.left+(b.width-g.name.width)/2,top:b.top+g.status.height+d},status:{left:b.left+(b.width-g.status.width)/2,top:b.top}}};
    // One candidate path for full and name-only pills; sprites, floor bounds,
    // head reach and the top-edge exception are shared by both sizes.
    const candidatesFor=(g,reserved,nameOnly=false)=>{
      const labelName=nameOnly?g.nameOnly:g.name,candidates=[],joinGap=floor.width<=600?0:gap;
      for(const inline of (g.compact?[false]:[false,true])){
      const width=g.compact?labelName.width:inline?labelName.width+joinGap+g.status.width:Math.max(labelName.width,g.status.width),height=g.compact?labelName.height:inline?Math.max(labelName.height,g.status.height):labelName.height+joinGap+g.status.height;
      // Keep the head radius except where the floor top leaves no pill lane.
      // Only there may a pill hug the side/bottom of its uniquely nearest sprite.
      const head=g.sprite?.width?g.sprite:g.actor,headX=(head.left+head.right)/2,reach=g.priority===3?27.5:19.5,step=Math.ceil(reach);
      const topBlocked=g.compact&&head.top-floor.top<height+Math.max(1,head.height*.02)+2*gap;
      const left=Math.max(floor.left+gap,Math.min(g.actor.left+g.actor.width/2-width/2,floor.right-gap-width));
      const top=g.actor.top-gap-height;
      const reachX=Math.max(g.actor.width*1.5,floor.width<=600?96:100),reachY=Math.max(g.actor.height*2,64);
      const add=(x,y)=>{x=Math.max(floor.left+gap,Math.min(x,floor.right-gap-width));y=Math.max(floor.top+gap,Math.min(y,floor.bottom-gap-height));
        let edgeNear=false;
        if(g.compact&&Math.hypot(x+width/2-headX,y+height/2-head.top)>reach+1e-7){
          if(!topBlocked)return;
          const b={left:x,right:x+width,top:y,bottom:y+height},own=boxGap(b,head);
          const beside=(b.right<=head.left||b.left>=head.right)&&b.top<head.bottom&&b.bottom>head.top,below=b.top>=head.bottom&&b.left<head.right&&b.right>head.left;
          if(!(beside||below)||own>19.5+1e-7||groups.some(q=>q!==g&&boxGap(b,q.sprite?.width?q.sprite:q.actor)<=own+1e-7))return;
          edgeNear=true;
        }
        // Touching sprites tie on box distance, so the nearer head decides.
        if(nameOnly){const b={left:x,right:x+width,top:y,bottom:y+height},own=boxGap(b,head),toHead=s=>Math.hypot(x+width/2-(s.left+s.right)/2,y+height/2-s.top);if(groups.some(q=>{if(q===g)return false;const s=q.sprite?.width?q.sprite:q.actor,other=boxGap(b,s);return other<own-1e-7||other<=own+1e-7&&toHead(s)<=toHead(head)+1e-7}))return;}
        if(!edgeNear&&(Math.abs(x+width/2-(g.actor.left+g.actor.width/2))>reachX||y+height<g.actor.top-reachY||y>g.actor.bottom+reachY))return;
        const below=Math.max(0,y+height-g.actor.top);candidates.push({left:x,right:x+width,top:y,bottom:y+height,width,height,inline,cost:(x-left)**2+(y-top)**2+below*below*2+(inline?400:0)})};
      // Above/below and either side keep each person's two labels together.
      add(left,top);add(left,g.actor.bottom+gap);
      add(g.actor.left-gap-width,top);add(g.actor.right+gap,top);
      add(g.actor.left-gap-width,g.actor.top);add(g.actor.right+gap,g.actor.top);
      // Crowded floors: search horizontal lanes as well as vertical lanes.
      // Boundaries are candidates too, so narrow maps lose no edge space.
      const xs=[floor.right-gap-width,left],ys=[floor.bottom-gap-height,Math.max(floor.top+gap,top)];
      if(g.compact){for(let delta=-step;delta<=step;delta+=4){xs.push(headX-width/2+delta);ys.push(head.top-height/2+delta)}}
      else{for(let x=floor.left+gap;x<=floor.right-gap-width;x+=width+gap)xs.push(x);
      for(let y=floor.top+gap;y<=floor.bottom-gap-height;y+=height+gap)ys.push(y);}
      // Fit around irregular mascot/label edges instead of wasting a whole grid cell.
      for(const r of reserved){xs.push(r.right+gap,r.left-gap-width);ys.push(r.bottom+gap,r.top-gap-height)}
      for(const x of new Set(xs))for(const y of new Set(ys))add(x,y);
      }
      return candidates;
    };
    // Repacking may change priority order within nearby lanes, never send a
    // person's labels to a distant desk just to raise the visible count.
    for(let mode=0;mode<9;mode++){
    const reserved=[...obstacles,...sprites],result=new Map(),score=[0,0,0,0];
    const order=mode<5?ordered:ordered.slice().sort((a,b)=>b.priority-a.priority||(mode<7?(a.actor.left-b.actor.left)*(mode%2?1:-1):(a.actor.top-b.actor.top)*(mode%2?1:-1))||a.id.localeCompare(b.id));
    for(const g of order){
      let chosen=null,rank=Infinity;
      for(const b of candidatesFor(g,reserved)){const value=mode&&mode<5?(mode<=2?b.top:-b.bottom)*(floor.width+1)+(mode%2?b.left:-b.right):b.cost;
        if(b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!fixed.some(r=>overlaps(b,r)))pools.get(g.id).set([b.left,b.top,b.inline].join(','),b);
        if(value<rank&&b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!reserved.some(r=>overlaps(b,r))){chosen=b;rank=value}}
      if(chosen){score[3-g.priority]++;score[3]-=chosen.cost;reserved.push(chosen);result.set(g.id,positions(g,chosen))}
      else result.set(g.id,null);
    }
    const better=!bestScore||compare(score,bestScore)<0;
    if(better){best=result;bestScore=score}
    if(score[0]+score[1]+score[2]===groups.length)break;
    }
    // A bounded search repairs greedy blocking on crowded floors, using only
    // the same nearby, sprite-safe candidates. No global/remote fallback.
    if(bestScore[0]<ordered.filter(g=>g.priority===3).length||bestScore[0]+bestScore[1]+bestScore[2]<(phone?groups.length:Math.ceil(groups.length*(floor.width<=600?.7:.85)))){
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
    // Reserve every full pill before name-only pills and last-resort dots.
    // Dots use the same head radius and never displace a conversation label.
    const occupied=[...fixed];
    for(const g of ordered){const p=best.get(g.id);if(!p)continue;if(g.compact)occupied.push({left:p.name.left,right:p.name.left+g.name.width,top:p.name.top,bottom:p.name.top+g.name.height})}
    // Full pills are frozen before trying names. A smaller label can never
    // evict a dialogue/full pill, and all names are reserved before any dots.
    for(const g of ordered.filter(g=>g.compact&&g.nameOnly?.width&&!best.get(g.id))){
      const b=candidatesFor(g,occupied,true).filter(b=>b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!occupied.some(r=>overlaps(b,r))).sort((a,b)=>a.cost-b.cost||a.top-b.top||a.left-b.left)[0];
      if(b){best.set(g.id,{name:{left:b.left,top:b.top},status:null,mode:'name'});occupied.push(b)}
    }
    // Last text option: wear the same name slot on one's own lower body.
    // Keep the top 60% clear and exempt only this actor's sprite reservation.
    // Centre on the actual sprite; a wide tag cannot slide onto a neighbour.
    for(const g of ordered.filter(g=>g.compact&&g.nameOnly?.width&&!best.get(g.id))){
      const head=g.sprite?.width?g.sprite:g.actor,{width,height}=g.nameOnly,faceBottom=head.top+head.height*.6;
      const left=(head.left+head.right-width)/2,top=Math.max(floor.top+gap,faceBottom+gap,Math.min(head.top+head.height*.8-height/2,head.bottom-height,floor.bottom-gap-height));
      const b={left,right:left+width,top,bottom:top+height},own=sprites[groups.indexOf(g)];
      if(b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>faceBottom&&b.bottom<=Math.min(head.bottom,floor.bottom-gap)&&!occupied.some(r=>r!==own&&overlaps(b,r))){
        best.set(g.id,{name:{left,top},status:null,mode:'name',ownBody:true});occupied.push(b);
      }
    }
    for(const g of ordered.filter(g=>g.compact&&!best.get(g.id))){
      const head=g.sprite?.width?g.sprite:g.actor,x=(head.left+head.right)/2,candidates=[];
      // Obstacle edges include sub-3px lanes missed by the old fixed grid.
      // The closest point of every free rectangular cell is an edge or the
      // head projection, so this also finds tiny legal nearby dot slots.
      const xs=[x,floor.left+gap+2.5,floor.right-gap-2.5,...occupied.flatMap(r=>[r.left-gap-2.5,r.right+gap+2.5])],ys=[head.top,floor.top+gap+2.5,floor.bottom-gap-2.5,...occupied.flatMap(r=>[r.top-gap-2.5,r.bottom+gap+2.5])];
      for(const cx of new Set(xs))for(const cy of new Set(ys)){const dx=cx-x,dy=cy-head.top;if(Math.hypot(dx,dy)>27.5)continue;const b={left:cx-2.5,right:cx+2.5,top:cy-2.5,bottom:cy+2.5,cost:dx*dx+dy*dy};if(b.left>=floor.left+gap&&b.right<=floor.right-gap&&b.top>=floor.top+gap&&b.bottom<=floor.bottom-gap&&!occupied.some(r=>overlaps(b,r)))candidates.push(b)}
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
  function spriteSource(id,entry){return entry.officeCompanion?entry.file:entry.scale===3?'./assets/sprites-v3/'+entry.file:({daon:"./assets/sprites-v2/daon-v2.webp",yoonseul:"./assets/sprites-v2/yoonseul-v2.webp"})[id]||'./assets/sprites-v2/'+entry.file}
  // Residents own no staff seats, reservations, scheduler seeds or saved state.
  const residentNames=Object.freeze({cat:'치즈',dog:'크림',rabbit:'모찌',bori:'보리',cleaner:'청소 담당',gardener:'옥상 정원사',temp:'임시직'});
  const residentPeople=Object.freeze([
    {id:'pet-cat',name:residentNames.cat,sprite:'pet-cat',pet:true,hours:[[7,12,'1f'],[12,17,'5f'],[17,22,'1f'],[22,26,'1f'],[26,31,'1f']],places:{'1f':['resident_cat_lobby','resident_cat_front'],'5f':['resident_cat_roof','resident_cat_roof_front']},lines:["출근 도장은 발자국으로요.","낮잠도 일정에 넣어 주세요.","회장님, 햇볕 자리는 예약했어요.","서두를 일은 없어요.","관심은 없지만 곁에 있을게요.","키보드 위가 제 지정석인데요.","야옹 한 번이면 안건 통과죠.","택배 상자 검수는 제 소관이에요.","마우스 커서 잡기가 오늘 목표!","골골송은 유료 복지 서비스예요.","회의 길어지면 식빵 굽고 있을게요.","츄르 없이는 면담 신청 안 받아요.","복도 순찰 완료, 이상 무다옹.","쟤는 말이 없어서 괜찮네요."]},
    {id:'pet-dog',name:residentNames.dog,sprite:'pet-dog',pet:true,hours:[[7,9,'1f'],[9,16,'2f'],[16,22,'1f'],[22,26,'1f'],[26,31,'1f']],places:{'1f':['resident_dog_lobby','resident_dog_front'],'2f':['resident_dog_hall','resident_dog_hall_front']},lines:["회의는 산책하면서 할까요?","간식 결재는 언제 나나요?","오늘도 모두 무사 출근!","오셨어요? 같이 가요!","모두 만나니 기분이 좋아요!","문소리 나면 반기는 게 제 업무!","공 던져 주시면 바로 야근 가능!","칭찬 한 마디면 사기 충전 완료!","점심시간 알림은 제가 일등이에요!","엘리베이터 앞 마중 대기 중이에요.","발도장으로 협조전 꾹 찍었어요!","분위기 메이커 수당은 개껌으로요!","퇴근길 에스코트 예약 받습니다!"]},
    {id:'pet-rabbit',name:residentNames.rabbit,sprite:'pet-rabbit',pet:true,hours:[[7,12,'3f'],[12,17,'1f'],[17,22,'1f'],[22,26,'1f'],[26,31,'1f']],places:{'3f':['resident_rabbit_quiet_a','resident_rabbit_quiet_b'],'4f':['resident_rabbit_lounge_a','resident_rabbit_lounge_b'],'1f':['resident_rabbit_lobby_a','resident_rabbit_lobby_b']},lines:["조용한 자리가 있으면 알려주세요.","간식보다 평온이 좋아요.","작은 소리도 잘 들려요.","오늘은 여기서 지켜볼게요.","천천히 다가와 주실래요.","햇살이 머무는 자리네요.","히나 곁이면 마음이 놓여요.","잠깐 눈을 감아도 될까요.","발소리가 다정해서 알아봤어요.","말없이 함께 있어도 좋아요."]},
    {id:'pet-bori',name:residentNames.bori,sprite:'pet-bori',pet:true,hours:[[7,13,'1f'],[13,15,'2f'],[15,22,'1f'],[22,26,'1f'],[26,31,'1f']],places:{'1f':['resident_bori_lobby_a','resident_bori_lobby_b'],'2f':['resident_bori_lounge_a','resident_bori_lounge_b']},lines:["어서 와요. 큰 꼬리로 인사할게요.","로비는 제가 느긋하게 지킬게요.","옆에 기대도 괜찮아요, 멍.","햇살이 따뜻해서 눈이 감겨요.","천천히 걸어요. 같이 갈게요.","쓰다듬어 주면 꼬리가 살랑해요.","잠깐 누워서 기다릴게요.","오늘도 무사히 와 줘서 고마워요.","제 옆에서 한숨 돌려요.","졸려도 반가운 건 알아요, 멍."]},
    {id:'npc-cleaner',name:residentNames.cleaner,sprite:'npc-cleaner',hours:[[7,9,'1f'],[9,11,'2f'],[11,13,'3f'],[13,15,'4f'],[15,18,'5f']],places:{'1f':['resident_cleaner_1f'],'2f':['resident_cleaner_2f'],'3f':['resident_cleaner_3f'],'4f':['resident_cleaner_4f'],'5f':['resident_cleaner_5f']},lines:["먼지는 퇴근시켰습니다.","오늘도 바닥부터 차근차근.","커피 자국은 제가 맡을게요.","유리창 닦아 두니 햇살이 환하네.","바빠도 따뜻한 차 한 잔씩 해요.","회의실 의자도 반듯하게 맞춰 뒀어요.","탕비실 싱크대 반짝반짝해졌어요.","비 온 뒤엔 입구 매트부터 챙겨요.","파지함 비우면 마음까지 개운해요.","분리수거 잘해 줘서 늘 고마워요.","깨끗한 책상에서 좋은 생각 나지요."]},
    {id:'npc-gardener',name:residentNames.gardener,sprite:'npc-gardener',hours:[[8,18,'5f']],places:{'5f':['resident_gardener']},lines:["새싹은 결재 없이도 자라네요.","오늘 정원 회의는 맑음입니다.","물 주고 잠깐 바람 쐬는 중이에요.","허브 향이 좋으니 잠시 쉬어 가세요.","화분 흙을 갈아 주니 숨이 트이네요.","꽃망울도 자기 시간표대로 피더군요.","옥상 벤치에 내려앉은 낙엽 치웠어요.","햇살 좋은 날엔 잎사귀도 반짝입니다.","가지치기하듯 생각도 가끔 비워 봐요.","나무는 서두르지 않아도 그늘을 주죠.","비 예보가 있어 배수로를 살펴봤어요."]},
    {id:'npc-temp-a',name:residentNames.temp,sprite:'npc-temp-a',hours:[[9,13,'2f'],[13,18,'3f']],places:{'2f':['resident_temp_2f'],'3f':['resident_temp_a_3f']},lines:["복사기는 벌써 저를 알아봐요.","메모는 작아도 할 일은 확실히!","스테이플러 심 리필 완료했습니다!","라벨지 각 맞추는 데 진심인 편이에요.","회의 자료는 색깔 클립별로 묶었어요.","오늘 배운 단축키, 수첩에 적었어요!","우편물 분류는 가나다순으로 끝냈어요.","파쇄기 종이 걸림도 이제 혼자 풀어요.","비품 창고 재고 표, 새로 붙였습니다!","급한 심부름 있으면 바로 말씀하세요!"]},
    {id:'npc-temp-b',name:residentNames.temp,sprite:'npc-temp-b',hours:[[9,13,'3f'],[13,18,'2f']],places:{'2f':['resident_temp_2f'],'3f':['resident_temp_b_3f']},lines:["오늘의 첫 질문도 잘 부탁드려요.","회의실 위치는 이제 외웠어요.","내선 번호표는 모니터 옆에 붙였어요.","보드 마커는 잘 나오는 걸로 채웠어요!","방문객 명찰 줄 맞추기가 참 재밌네요.","사내 약어를 오늘 세 개나 배웠습니다!","할 일 목록 지울 때가 제일 뿌듯해요!","토너 교체도 매뉴얼 보고 해냈습니다!","인사성 밝다는 말씀에 힘이 불끈 나요!","회의록 초안, 오타 두 번 확인했어요!"]},
    {id:'npc-temp-c',name:residentNames.temp,sprite:'npc-temp-c',hours:[[9,18,'2f']],places:{'2f':['resident_temp_c_2f']},lines:["점심 메뉴 조사도 업무 맞죠?","작은 일부터 깔끔하게 해볼게요.","탕비실 원두 채우는 날이 제일 설레요.","엑셀 표 테두리 정리, 방금 끝냈어요!","간식 바구니 채우면 인기 만점이에요.","포스트잇 색상별로 우선순위 나눴어요!","영수증 풀칠은 이제 달인 수준이에요.","간식 주문 취합, 빠짐없이 적었습니다!","폴더 이름 정리하니 속이 다 시원해요.","퇴근 전 멀티탭 확인도 제가 챙길게요!"]}
  ].map(p=>Object.freeze({...p,hours:Object.freeze(p.hours.map(Object.freeze)),places:Object.freeze(Object.fromEntries(Object.entries(p.places).map(([f,spots])=>[f,Object.freeze(spots)]))),lines:Object.freeze(p.lines)})));
  // Calendar-day companions are display-only residents; the existing 07:00 pet day is unchanged.
  const companionPeople=Object.freeze([
    {id:'companion-frog',name:'아기 개구리',pet:true,atlasRow:0,lines:['회장님, 폴짝 따라갈게요!','회장님 옆이 제 연못이에요.','회장님, 잠깐 쉬어요!']},
    {id:'companion-penguin',name:'꼬마 펭귄',pet:true,atlasRow:1,lines:['회장님, 순찰 완료예요!','회장님 일정은 제가 챙겨요!','회장님, 뒤뚱뒤뚱 갑니다!']},
    {id:'companion-otter',name:'아기 수달',pet:true,atlasRow:2,lines:['회장님, 조개 선물이에요!','회장님 옆에서 냠냠해요.','회장님, 카페도 같이 가요!']},
    {id:'companion-chick',name:'병아리',pet:true,atlasRow:3,lines:['회장님, 삐약 출근했어요!','회장님 따라 통통통!','회장님, 제 날개도 쉬어요.']},
    {id:'companion-fox',name:'아기 여우',pet:true,atlasRow:4,lines:['회장님, 꼬리로 인사해요!','회장님 곁은 포근하네요.','회장님, 살금살금 갈게요!']},
    {id:'kid-suhyeon',name:'수현',kid:true,atlasRow:0,lines:['…지금 말고.','가방? 그냥 들어 준 거야.','아빠, 얘 좀 떼 줘.']},
    {id:'kid-suyeon',name:'수연',kid:true,atlasRow:1,lines:['아빠아아!','나 커서 아빠랑 결혼할 거야!','오빠는 맨날 아닌 척해!']}
  ].map(p=>Object.freeze({...p,companion:true,sprite:p.id,lines:Object.freeze(p.lines)})));
  const companionReactions=Object.freeze([
    {id:'hani',line:'어머, 수연이 왔어?'},{id:'hani',line:'수현이는 오늘도 든든하네.'},
    {id:'naeun',line:'남매 간식은 제가 챙길게요.'},{id:'hina',line:'수연아, 오빠랑 천천히 와.'},{id:'hina',line:'수현아, 무슨 책 읽고 있니?'}
  ].map(Object.freeze));
  function companionAtlas(person){
    const kid=!!person.kid,poses=kid?['standing','sitting','walk-a','walk-b']:['sitting','standing','walk-a','walk-b','sleep'];
    return {id:person.id,officeCompanion:true,file:kid?'./assets/office-companions/kids-v1.webp':'./assets/office-companions/companions-v1.webp',scale:3,cell:[96,144],atlas:[kid?384:480,kid?576:1440],frames:['left','right'].flatMap((dir,row)=>poses.map((pose,col)=>({name:pose+'-'+dir,rect:[col*96,(person.atlasRow*2+row)*144,96,144],pivot:[48,135]})))};
  }
  function companionSafe(floor,v,kid=false){
    const x=v[0]*art.width/100,y=v[1]*art.height/100,half=kid?34:38,height=kid?104:80,items=art.floors[floor];
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<half+12||x>art.width-half-12||y<height+60||y>art.height-12)return false;
    // Resident room-wide exclusions intentionally reserve the chairman room for staff.
    // His own companions use the actual desk/chair bounds, never the whole room box.
    const boxes=[...Object.values(items?.homeFurniture||{}).flatMap(item=>[item.seatBounds,item.deskBounds].filter(Boolean)),...(items?.freeDesks||[]).flatMap(item=>[item.seatBounds,item.deskBounds].filter(Boolean))];
    return !boxes.some(r=>x+half>=r[0]-8&&x-half<=r[2]+8&&y+6>=r[1]&&y-height<=r[3]+8);
  }
  function companionSnapshot(now=new Date(),staff=null,enabled=true,reduced=false,neighbors=[]){
    if(!enabled||!canon||!art)return [];
    const date=koreaTime(now),weekday=date.getUTCDay(),weekend=weekday===0||weekday===6,day=date.toISOString().slice(0,10),seconds=date.getUTCHours()*3600+date.getUTCMinutes()*60+date.getUTCSeconds()+date.getUTCMilliseconds()/1000;
    const people=[...(staff?.floors?.flatMap(f=>f.people||[])||[]),...neighbors],chair=people.find(p=>p.id==='seongmin'&&floors.some(f=>f.id===p.floor)&&p.state!=='ABSENT'),center=chair&&(chair.position||[chair.seat?.x,chair.seat?.y]),states=[];
    for(const person of companionPeople){
      const follow=person.kid?weekend:!weekend&&person.atlasRow===weekday-1;
      if(person.kid&&!weekend||!person.kid&&!weekend&&!follow||follow&&(!chair||!center?.every(Number.isFinite)))continue;
      const seed=residentSeed(day+'|'+person.id),rhythm=residentRhythm(person.id,day,seconds),free=(floor,v)=>!people.concat(states).some(p=>{const at=p.position||[p.seat?.x,p.seat?.y];return p.floor===floor&&at.every(Number.isFinite)&&Math.hypot((v[0]-at[0])*art.width/100,(v[1]-at[1])*art.height/100)<(p.id==='seongmin'?80:p.resident||p.pet?96:person.kid?90:70)});
      let floor,position,point=[500,330],walking=false,facing='left',pose='standing',motion;
      if(follow){
        floor=chair.floor;facing=chair.facing==='left'?'left':'right';
        const behind=facing==='left'?1:-1,distance=person.id==='kid-suhyeon'?172:98,candidates=[];
        // Shared furniture envelopes and distinct footprints, closest safe side first.
        for(const dx of [behind*distance,-behind*distance,behind*(distance+70),-behind*(distance+70),240,-240,0])for(const dy of [12,80,-60,140,220,-110]){
          const v=[center[0]+dx/art.width*100,center[1]+dy/art.height*100];
          if(companionSafe(floor,v,!!person.kid)&&free(floor,v))candidates.push(v);
        }
        candidates.sort((a,b)=>Math.hypot((a[0]-center[0])*art.width/100-behind*distance,(a[1]-center[1])*art.height/100-12)-Math.hypot((b[0]-center[0])*art.width/100-behind*distance,(b[1]-center[1])*art.height/100-12));
        position=candidates[0];
        // Narrow desk sides may need the nearest validated floor stop.
        if(!position)position=[...residentStops.values()].filter(a=>a.floor===floor&&residentSpot(a.id)&&free(floor,a.visual)).sort((a,b)=>Math.hypot(a.visual[0]-center[0],a.visual[1]-center[1])-Math.hypot(b.visual[0]-center[0],b.visual[1]-center[1]))[0]?.visual;
        if(!position)continue;
        walking=!reduced&&!!chair.walking;pose=walking?(Math.floor(seconds*4)%2?'walk-a':'walk-b'):chair.pose==='sitting'||chair.seat?.posture==='sitting'?'sitting':'standing';
      }else{
        // Weekend pets roam independently. Penguin patrols all five floors; otter favors the cafe.
        floor=person.id==='companion-otter'?'1f':floors[(Math.floor(seconds/900)+person.atlasRow)%floors.length].id;
        const stops=[...residentStops.values()].filter(a=>a.floor===floor&&a.pet&&residentSpot(a.id)).flatMap(a=>[0,-12,12,24].map(dy=>({...a,visual:[a.visual[0],a.visual[1]+dy]}))).filter(a=>residentSafe(floor,[a.x,a.y],a.visual)&&free(floor,a.visual));
        if(!stops.length)continue;
        const index=reduced?seed%stops.length:(rhythm.beat+seed)%stops.length,a=stops[(index+stops.length-1)%stops.length],b=stops[index];position=b.visual;point=[b.x,b.y];pose=rhythm.beat%3?'sitting':'standing';
        if(!reduced&&a!==b){motion=petMotion(person.id,day,rhythm.beat,a,b,rhythm.elapsed,v=>free(floor,v));if(motion){({position,point,walking,facing,pose}=motion);if(person.id==='companion-chick'&&walking)motion={...motion,bob:-Math.abs(Math.sin(seconds*9))*2.5}}}
      }
      const state={id:person.id,name:person.name,sprite:person.id,pet:!!person.pet,kid:!!person.kid,companion:true,following:follow,floor,anchor:follow?'companion-'+chair.id:person.id+'-'+floor,position,point,walking,facing,pose,...(motion?{motion}:{})};
      states.push(state);
    }
    // Pure proximity window; the existing bubble owner deduplicates and displays staff reactions.
    if(weekend&&Math.floor(seconds)%180<5){
      const kids=states.filter(p=>p.kid);for(const row of companionReactions){const peer=people.find(p=>p.id===row.id&&!p.walking&&kids.some(k=>p.floor===k.floor&&Math.hypot(((p.position||[p.seat?.x,p.seat?.y])[0]-k.position[0])*art.width/100,((p.position||[p.seat?.x,p.seat?.y])[1]-k.position[1])*art.height/100)<380));if(peer){const kid=kids[0];kid.reaction={...row,key:day+'|'+Math.floor(seconds/180)};break}}
    }
    return states;
  }
  function residentSeed(value){let n=2166136261;for(const ch of value)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0}
  // The pets' day starts at 07:00. 22:00..26:00 is one continuous 1F window.
  function residentClock(now){const time=koreaTime(now),seconds=time.getUTCHours()*3600+time.getUTCMinutes()*60+time.getUTCSeconds()+time.getUTCMilliseconds()/1000;return {day:new Date(time.getTime()-7*3600000).toISOString().slice(0,10),seconds:seconds+(seconds<7*3600?86400:0),hour:seconds/3600,sleeping:seconds>=2*3600&&seconds<7*3600,night:seconds>=22*3600||seconds<2*3600}}
  const residentNightSpots=Object.freeze({'pet-cat':['resident_cat_night_a','resident_cat_night_b'],'pet-dog':['resident_dog_night_a','resident_dog_night_b'],'pet-rabbit':['resident_rabbit_night_a','resident_rabbit_night_b'],'pet-bori':['resident_bori_night_a','resident_bori_night_b']});
  const residentVoice=Object.freeze({
    cat:Object.freeze(['쉬는 김에 옆에 있을게요.','따라온 건 아니에요.','모니터보다 여기가 좋네요.','관심은 없어요. 조금만 앉죠.','먼저 가세요. 전 좀 더요.']),
    dog:Object.freeze(['같이 쉬니까 더 좋아요!','옆자리 비었죠? 왔어요!','회장님, 같이 걸어요!','여기서 기다리고 있을게요!','오늘도 만나서 반가워요!']),
    bori:Object.freeze(['천천히 와요. 옆자리 비워 뒀어요.','쓰담 한 번이면 마음이 포근해요.','여기 누워서 함께 쉴까요, 멍.']),
    rabbit:Object.freeze(['히나 곁에서 조용히 쉴래요.','여기선 귀도 쉬어 가네요.','조용히 기다리고 있었어요.']),
    staff:Object.freeze({hani:'잠깐 함께 쉬고 다시 정리하죠.',taeo:'오늘 반가운 소식이 왔네!',yuri:'발밑 여유 공간 확인했어요.',naeun:'오늘 마음도 포근해지네요.',seoyun:'잠깐 쉬고 오류 다시 볼게.',dohyun:'이 조합, 꽤 좋은데요?',hina:'쉬는 시간도 점검 완료예요.',arin:'옆에 앉으니 분위기 좋다.',gaeun:'쉬는 시간, 일정에 남겨 둘게요.',yuna:'왔어? 여기는 늘 네 자리야.',minji:'간식 소식은 내가 알려 줄게!',jieun:'같이 쉬면 마음이 정돈돼요.',sua:'조용히 곁에 있어 줘서 고마워.',haru:'간식 예산도 확인해 볼게.',sooyeon:'같이 쉬니 하루가 든든하네요.',serin:'잠깐 충전하고 다시 시작하자.',mir:'동행 감지. 경계 유지할게요.',daon:'작은 발걸음도 반가운 변화죠.',yoonseul:'햇살처럼 살며시 왔네요.',seongmin:'크림, 잠깐 같이 쉬자.'})
  });
  // Stable, staggered pet cycles; NPC quarters and the 07:00 day stay unchanged.
  function residentRhythm(id,day,seconds){
    const seed=residentSeed('pet-rhythm|'+day+'|'+id),rabbit=id==='pet-rabbit',bori=id==='pet-bori',period=rabbit||bori?25+seed%21:15+seed%16,phase=seed%period;
    const time=seconds+phase;return {period,beat:Math.floor(time/period),elapsed:time%period,rest:bori?10+seed%5:rabbit?3+seed%3:seed%3};
  }
  const residentAffectionVoice=Object.freeze({
    cat:Object.freeze({hani:'후후, 확인 도장은 발로 받았네요.',yuri:'살짝만요. 발밑은 비워 뒀어요.',seoyun:'한 번 쓰다듬고 다시 볼게.',arin:'슬쩍 기대는 거, 다 봤어.',sua:'치즈, 조용히 와 줘서 고마워.',haru:'간식 말고 쓰담으로 정산할게.'}),
    dog:Object.freeze({seongmin:'크림, 하하. 한 번 더 쓰다듬자.',taeo:'하하, 오늘 인사는 아주 힘차네!',naeun:'크림 덕분에 마음이 환해져요.',dohyun:'이 환영 인사, 매일 받고 싶네요.',yuna:'왔어, 크림? 실컷 쓰담받고 가.',minji:'잠깐, 두 손 다 비워 줄게!',serin:'좋아, 충전은 쓰담 두 번이야.',sooyeon:'꼬리 인사 덕분에 힘이 나네요.'}),
    bori:Object.freeze({yuna:'보리, 천천히 기대도 돼.',sua:'포근한 로비 지킴이, 고마워.',taeo:'보리랑 쉬니 마음이 든든해.',naeun:'큰 온기가 곁에 와 줬네요.',seongmin:'보리, 편히 누워서 쉬자.'}),
    rabbit:Object.freeze({hina:'모찌, 편히 기대. 내가 지킬게.',gaeun:'조용한 쓰담 시간, 비워 둘게요.',jieun:'천천히 와도 돼. 기다릴게요.',mir:'작은 온기 확인. 곁을 지킬게요.',daon:'가만히 곁에 있어도 반갑죠.',yoonseul:'살며시 왔구나. 토닥여 줄게.'})
  });
  // Each pet owns its brief greeting window; stationary staff only.
  function residentAffection(now,states,staff){
    const clock=residentClock(now);if(clock.sleeping)return states;
    for(const pet of states.filter(p=>p.pet&&!p.walking&&!p.motion?.active&&p.pose!=='sleep')){
      const kind=pet.id==='pet-cat'?'cat':pet.id==='pet-dog'?'dog':pet.id==='pet-bori'?'bori':'rabbit',seed=residentSeed('pet-affection|'+clock.day+'|'+pet.id),period=kind==='cat'?100+seed%21:kind==='dog'?60+seed%21:80+seed%21,time=clock.seconds+seed%period,beat=Math.floor(time/period),elapsed=time%period,duration=kind==='cat'?3:kind==='dog'?6:7;
      if(elapsed<30||elapsed>=30+duration)continue;
      const peers=staff.filter(q=>q.floor===pet.floor&&!q.visitor&&!q.resident&&!q.walking&&residentVoice.staff[q.id]&&['rest','work'].includes(q.activity)&&(!q.state||q.state==='AT_HOME'||q.state==='AT_PLACE')).filter(q=>{const v=q.position||[q.seat?.x,q.seat?.y],d=Math.hypot((pet.position[0]-v[0])*art.width/100,(pet.position[1]-v[1])*art.height/100);return v.every(Number.isFinite)&&d>=100&&d<=320});
      peers.sort((a,b)=>(kind==='dog'?(a.id==='seongmin'?-1:b.id==='seongmin'?1:0):kind==='rabbit'?(a.id==='hina'?-1:b.id==='hina'?1:0):0)||residentSeed(seed+'|'+beat+'|'+a.id)-residentSeed(seed+'|'+beat+'|'+b.id));
      const peer=peers[0];if(!peer)continue;
      const name=peer.id==='seongmin'?'회장님':actionTable?.people.find(p=>p.id===peer.id)?.name||peer.id,petLine=kind==='cat'?'딱 한 번만 기대는 거예요.':kind==='dog'?'좋아해요! 한 번 더요!':kind==='bori'?'큰 머리 살짝 기대도 될까요, 멍.':'조용히 곁에 앉아도 될까요.',staffLine=residentAffectionVoice[kind][peer.id]||residentVoice.staff[peer.id],v=peer.position||[peer.seat.x,peer.seat.y];
      if(kind==='rabbit')pet.pose='sitting';
      pet.affection={key:clock.day+'|'+pet.floor+'|'+beat+'|'+pet.id+'|'+peer.id,partnerId:peer.id,partnerName:name,petLine,staffLine,line:petLine+' · '+name+' · '+staffLine,kind,heart:kind==='dog'?'💕':'♥',lean:v[0]<pet.position[0]?-1:1,bubble:(seed+beat)%3===0};
    }
    return states;
  }
  // Pure clock samples on persistent sprites, consumed by the existing 100ms tick.
  function residentLife(now,states,reduced){
    const clock=residentClock(now);if(clock.sleeping||reduced)return states;
    for(const pet of states.filter(p=>p.pet&&!p.walking&&!p.motion?.active&&!p.affection&&(p.id!=='pet-bori'||p.pose!=='sleep'))){
      // A shared six-second beat with two-second pet offsets prevents a chorus.
      const seed=residentSeed('pet-life|'+clock.day+'|'+pet.id),slot=['pet-cat','pet-dog','pet-rabbit','pet-bori'].indexOf(pet.id),period=pet.id==='pet-bori'?12:6,time=clock.seconds+residentSeed('pet-life|'+clock.day)%period-slot*2,beat=Math.floor(time/period),elapsed=time%period;
      pet.facing=(seed+beat)%2?'left':'right';
      if(elapsed>=1.2)continue;
      const kind=['hop','turn','sit-stand','wag'][(seed+beat)%4];
      pet.life={key:clock.day+'|'+pet.id+'|'+beat,kind};
      if(kind==='turn'&&elapsed<.35)pet.facing=pet.facing==='left'?'right':'left';
      if(kind==='sit-stand')pet.pose=pet.pose==='sitting'?'standing':'sitting';
    }
    return states;
  }
  // Pet-only, bounded route cache. Validate the entire curved body corridor once;
  // occupied floor is checked separately on each sample by the existing owner.
  const petRoutes=new Map();
  const petEase=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
  function petFacing(a,b,fallback){const dx=(b.visual[0]-a.visual[0])*art.width/100;return Math.abs(dx)<12?fallback:dx<0?'left':'right'}
  function petRoute(a,b,seed){
    const key=[a.floor,a.x,a.y,...a.visual,b.x,b.y,...b.visual,seed%2].join('|');if(petRoutes.has(key))return petRoutes.get(key);
    const dx=(b.visual[0]-a.visual[0])*art.width/100,dy=(b.visual[1]-a.visual[1])*art.height/100,length=Math.hypot(dx,dy);
    let nodes=[];
    for(const bend of length>=24?[Math.min(12,length*.12)*(seed%2?1:-1),-Math.min(12,length*.12)*(seed%2?1:-1),0]:[0]){
      nodes=[];let safe=true,total=0;const steps=Math.max(1,Math.ceil((length+4*Math.abs(bend))*2));
      for(let i=0;i<=steps;i++){
        const t=i/steps,offset=4*t*(1-t)*bend,visual=[a.visual[0]+dx*t/art.width*100-(length?dy/length:0)*offset/art.width*100,a.visual[1]+dy*t/art.height*100+(length?dx/length:0)*offset/art.height*100],point=[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t];
        if(!residentSafe(a.floor,point,visual)){safe=false;break}
        const prior=nodes.at(-1);if(prior)total+=Math.hypot((visual[0]-prior.visual[0])*art.width/100,(visual[1]-prior.visual[1])*art.height/100);
        nodes.push({visual,point,distance:total});
      }
      if(safe)break;nodes=[];
    }
    const route={nodes,length:nodes.at(-1)?.distance||0};if(petRoutes.size>=256)petRoutes.delete(petRoutes.keys().next().value);petRoutes.set(key,route);return route;
  }
  function petMotion(id,day,beat,a,b,elapsed,free=()=>true){
    const seed=residentSeed('pet-leg|'+day+'|'+id+'|'+beat),rabbit=id==='pet-rabbit',dog=id==='pet-dog',base=id==='pet-bori'?12:rabbit?18:dog?48:40,speed=base*(.9+seed%21/100),route=petRoute(a,b,seed),fallback=residentSeed('pet-facing|'+day+'|'+id)%2?'left':'right';
    if(!route.nodes.length||!route.nodes.every(n=>free(n.visual)))return null;
    const length=route.length,travel=length/speed,pause=length>=24&&seed%3===0?1+seed%201/100:0,split=.35+(seed%21)/100;
    // Mochi advances two 18px hops, then holds an ears-up rest before the next pair.
    const pairs=rabbit?Math.max(1,Math.ceil(length/36)):1,rest=rabbit?.8+seed%51/100:0,duration=travel+pause+(pairs-1)*rest;
    let time=Math.max(0,elapsed),distance=length,paused=false,progress=0,kind='',cursor=0;
    for(let pair=0;pair<pairs;pair++){
      const part=rabbit?Math.min(36,length-cursor):length,move=part/speed,hold=pair===0?pause:0,first=move*split;
      if(time<move+hold){
        if(hold&&time>=first&&time<first+hold){distance=cursor+part*split;paused=true;progress=(time-first)/hold;kind=dog&&seed%5===0?'spin':seed%2?'sniff':'look'}
        else if(hold){const after=time>=first+hold;distance=cursor+part*(after?split+(1-split)*petEase((time-first-hold)/(move-first)):split*petEase(time/first))}
        else distance=cursor+part*petEase(move?time/move:1);
        break;
      }
      time-=move+hold;cursor+=part;
      if(pair<pairs-1){if(time<rest){distance=cursor;paused=true;progress=time/rest;kind='ears';break}time-=rest}
    }
    const active=elapsed<duration,walking=active&&!paused&&length>.01;
    let lo=0,hi=route.nodes.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(route.nodes[mid].distance<distance)lo=mid+1;else hi=mid}
    const right=route.nodes[lo],left=route.nodes[Math.max(0,lo-1)],span=right.distance-left.distance,t=span?(distance-left.distance)/span:0;
    const position=left.visual.map((v,i)=>v+(right.visual[i]-v)*t),point=left.point.map((v,i)=>v+(right.point[i]-v)*t);
    // Keep the original collision/walkability guard at the actual interpolated point.
    if(!residentSafe(a.floor,point,position)||!free(position))return null;
    let facing=petFacing(a,b,fallback);if(paused&&kind==='look'&&length>=12&&progress>=.5)facing=facing==='left'?'right':'left';
    const stride=rabbit?18:dog?24:30,phase=distance/stride,frame=Math.floor(phase)%2?'b':'a',bob=walking?-Math.sin(Math.PI*(phase%1))*(rabbit?2.2:dog?1.3:.35):0;
    const lean=paused?(kind==='sniff'?3*Math.sin(Math.PI*progress):id==='pet-cat'?2*Math.sin(progress*Math.PI*4):0):0,spin=paused&&kind==='spin'?360*petEase(progress):0;
    return {position,point,walking,facing,pose:walking?(rabbit?'hop-':'walk-')+frame:rabbit&&paused?'standing':'sitting',distance,duration,speed,pause,paused,kind,active,bob,lean,spin};
  }
  // Native-pixel visual exclusions, checked against each art-map background.
  // Include whole furniture groups, counters, cabinets, plants and partitions;
  // logical walkability alone cannot describe the painted furniture footprint.
  const residentFurniture=Object.freeze({
    '1f':[[0,0,460,438],[475,0,1105,300],[600,185,655,346],[650,235,1018,410],[985,132,1105,346],[1105,0,1672,525],[0,438,452,805],[432,555,1238,941],[1450,450,1672,805],[1435,490,1550,572],[0,805,480,941],[1220,805,1672,941]],
    '2f':[[0,0,780,360],[0,400,780,635],[0,645,780,941],[930,0,1672,395],[980,385,1672,941],[0,0,1672,110]],
    '3f':[[0,0,805,360],[0,395,805,615],[0,615,805,941],[990,0,1672,941],[0,0,1672,260]],
    '4f':[[0,0,780,500],[0,500,760,941],[920,0,1672,445],[970,435,1672,941],[0,0,1672,200]],
    '5f':[[0,0,775,485],[0,455,745,941],[935,0,1672,485],[970,415,1672,941],[0,0,1672,200]]
  });
  // Resident-only stops never enter the shared staff anchor/edge maps. Logical
  // corridor points and visual floor points are both checked, including travel.
  const residentStops=new Map([
    ['resident_cat_lobby','1f',43,55,true],['resident_cat_front','1f',47,55,true],
    ['resident_dog_lobby','1f',57,55,true],['resident_dog_front','1f',61,55,true],
    ['resident_cleaner_1f','1f',32,55],['resident_dog_hall','2f',51,44,true],['resident_dog_hall_front','2f',51,46,true],
    ['resident_cleaner_2f','2f',51,72],['resident_temp_2f','2f',51,98],['resident_temp_c_2f','2f',51,30],
    ['resident_cleaner_3f','3f',52,52],['resident_temp_a_3f','3f',52,76],['resident_temp_b_3f','3f',52,94],
    ['resident_cleaner_4f','4f',51,66],['resident_cat_roof','5f',51,38,true],['resident_cat_roof_front','5f',51,44,true],
    ['resident_cleaner_5f','5f',51,70],['resident_gardener','5f',51,96],
    // Clear strip beside the 1F lounge; separate walking ranges for 22:00..02:00.
    ['resident_cat_night_a','1f',54,55,true],['resident_cat_night_b','1f',55.5,55,true],
    ['resident_dog_night_a','1f',61.5,55,true],['resident_dog_night_b','1f',62.5,55,true],
    ['resident_rabbit_quiet_a','3f',52,38.5,true],['resident_rabbit_quiet_b','3f',52,40.5,true],
    ['resident_rabbit_lounge_a','4f',51,66,true],['resident_rabbit_lounge_b','4f',51,70,true],
    ['resident_rabbit_lobby_a','1f',34,55,true],['resident_rabbit_lobby_b','1f',35,55,true],
    ['resident_rabbit_night_a','1f',47,55,true],['resident_rabbit_night_b','1f',47.5,55,true],
    ['resident_rabbit_sleep_spare','1f',50,55,true],
    // Clear right lobby aisle: beyond the lounge, left of the cafe and barista.
    ['resident_bori_lobby_a','1f',79.5,72,true],['resident_bori_lobby_b','1f',81,72,true],
    ['resident_bori_night_a','1f',79.5,72,true],['resident_bori_night_b','1f',81,72,true],
    ['resident_bori_lounge_a','2f',51,57,true],['resident_bori_lounge_b','2f',51,59,true]
  ].map(([id,floor,vx,vy,pet],i)=>[id,Object.freeze({id,floor,x:/^resident_(rabbit|bori)_/.test(id)?500:100+i*40,y:330,visual:[vx,vy],pet:!!pet})]));
  function residentBounds(id,pose){if(id.startsWith('companion-'))return [12,60,84,135];if(id.startsWith('kid-'))return [18,35,78,135];const pet=id.startsWith('pet-');if(id==='pet-bori')return [2,({sitting:52,standing:53,'walk-a':63,'walk-b':65,sleep:89})[pose]??52,94,135];if(id==='pet-rabbit')return [11,({sitting:61,standing:63,'hop-a':74,'hop-b':70,sleep:100})[pose]??61,85,135];const top=pet?(pose==='sleep'?102:({sitting: id==='pet-cat'?81:76,standing:id==='pet-cat'?83:75,'walk-a':id==='pet-cat'?87:82,'walk-b':id==='pet-cat'?90:83})[pose]):({standing:15,sitting:30,'walk-a':24,'walk-b':24})[pose];return [pet?13:9,top??15,pet?82:87,135]}
  const residentPaths=new Map();
  function residentSafe(floorId,point,visual,pet=true){
    const floor=canon?.floors.find(f=>f.id===floorId);if(!floor||!point||!visual)return false;
    const inside=(p,r)=>p[0]>=r.x&&p[0]<=r.x+r.w&&p[1]>=r.y&&p[1]<=r.y+r.h;
    if(!floor.walkable.some(r=>inside(point,r))||floor.noWalk.some(r=>inside(point,r)))return false;
    const px=[visual[0]*(art?.width||1672)/100,visual[1]*(art?.height||941)/100];
    // Reserve the visible body at a 360px map (40px minimum cell), plus room
    // for idle motion. Pets keep their smaller, pose-independent envelope.
    const half=pet?46:56,height=pet?88:164,items=art?.floors[floorId];
    const boxes=[...(residentFurniture[floorId]||[]),...Object.values(items?.homeFurniture||{}).flatMap(item=>[item.seatBounds,item.deskBounds].filter(Boolean)),...(items?.freeDesks||[]).flatMap(item=>[item.seatBounds,item.deskBounds].filter(Boolean))];
    if(boxes.some(r=>px[0]+half>=r[0]-8&&px[0]-half<=r[2]+8&&px[1]+8>=r[1]&&px[1]-height<=r[3]+8))return false;
    return !(seatMaps[floorId]||[]).some(s=>(s.posture==='sitting'||s.owner)&&Math.hypot((visual[0]-s.x)*(art?.width||1672)/100,(visual[1]-s.y)*(art?.height||941)/100)<24);
  }
  function residentSpot(id){const a=residentStops.get(id);return a&&residentSafe(a.floor,[a.x,a.y],a.visual,a.pet)?a:null}
  function residentPath(from,to){
    const key=from+'|'+to;if(residentPaths.has(key))return residentPaths.get(key);
    const a=residentSpot(from),b=residentSpot(to);let safe=!!a&&!!b&&a.floor===b.floor;
    if(safe){
      const va=a.visual,vb=b.visual,steps=Math.max(1,Math.ceil(Math.max(Math.hypot(a.x-b.x,a.y-b.y),Math.hypot((va[0]-vb[0])*art.width/100,(va[1]-vb[1])*art.height/100))));
      // At most one native pixel / logical unit per sample; the 8px safety
      // border also prevents a thin furniture corner slipping between samples.
      for(let k=0;k<=steps;k++){const t=k/steps;if(!residentSafe(a.floor,[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t],[va[0]+(vb[0]-va[0])*t,va[1]+(vb[1]-va[1])*t],a.pet&&b.pet)){safe=false;break}}
    }
    const path=safe?(from===to?[a]:[a,b]):[];
    residentPaths.set(key,path);return path;
  }
  const residentVisits=new Map();
  function residentVisit(person,floor,staff,seed,beat,free,motionBeat){
    const chairman=person.id==='pet-dog'&&staff.find(p=>p.id==='seongmin'&&p.floor===floor&&(p.walking||p.pose==='sitting'||p.seat?.posture==='sitting'));
    const peers=chairman?[chairman]:staff.filter(p=>p.floor===floor&&!p.visitor&&p.id!=='seongmin'&&residentVoice.staff[p.id]&&p.activity==='rest'&&!p.walking&&(!p.state||p.state==='AT_HOME'||p.state==='AT_PLACE'));
    peers.sort((a,b)=>(person.id==='pet-rabbit'?(a.id==='hina'?-1:b.id==='hina'?1:0):0)||residentSeed(seed+'|'+beat+'|'+a.id)-residentSeed(seed+'|'+beat+'|'+b.id));
    for(const peer of peers){
      const center=peer.position||[peer.seat?.x,peer.seat?.y];if(!center.every(Number.isFinite))continue;
      const monitor=person.id==='pet-cat'&&beat%3===0&&monitorScreens[peer.seat?.anchor]&&art.floors[floor]?.homeFurniture?.[peer.seat.anchor];
      const key=[person.id,floor,peer.id,center.join(','),!!monitor].join('|');let choices=residentVisits.get(key);
      if(!choices){
        choices=[];
        // Only clear floor beside the actor: no shared anchors, seats or desk surfaces.
        const columns=new Set([-280,-220,-160,-100,0,100,160,220,280,...[...residentStops.values()].filter(a=>!a.id.startsWith('resident_bori_')&&a.floor===floor&&(person.id==='pet-rabbit'||!a.id.startsWith('resident_rabbit_'))).map(a=>(a.visual[0]-center[0])*art.width/100)]);
        for(const dx of columns)for(const dy of [0,100,-100,180,-180,260,-260]){
          if(Math.hypot(dx,dy)<100||Math.hypot(dx,dy)>320)continue;
          const visual=[center[0]+dx/art.width*100,center[1]+dy/art.height*100],point=[500,330];
          if(!residentSafe(floor,point,visual))continue;
          if(monitor){const box=monitor.deskBounds,px=visual[0]*art.width/100,py=visual[1]*art.height/100;if(Math.hypot(px-Math.max(box[0],Math.min(box[2],px)),py-Math.max(box[1],Math.min(box[3],py)))>180)continue}
          choices.push({id:'resident-visit-'+peer.id+'-'+dx+'-'+dy,floor,x:point[0],y:point[1],visual,pet:true});
        }
        choices.sort((a,b)=>Math.hypot((a.visual[0]-center[0])*art.width/100,(a.visual[1]-center[1])*art.height/100)-Math.hypot((b.visual[0]-center[0])*art.width/100,(b.visual[1]-center[1])*art.height/100));
        if(residentVisits.size>=64)residentVisits.delete(residentVisits.keys().next().value);residentVisits.set(key,choices);
      }
      const available=choices.filter(a=>free(a.visual)),first=available[0];if(!first)continue;
      const second=available.find(a=>a!==first&&residentVisitPath(first,a,free).length),stops=second?[first,second]:[first],index=motionBeat%stops.length,anchor=stops[index],previous=stops[(index+stops.length-1)%stops.length];
      const name=peer.id==='seongmin'?'회장님':actionTable?.people.find(p=>p.id===peer.id)?.name||peer.id,bank=person.id==='pet-bori'?residentVoice.bori:person.id==='pet-cat'?residentVoice.cat:person.id==='pet-rabbit'?residentVoice.rabbit:residentVoice.dog;
      const petLine=monitor?residentVoice.cat[2]:bank[(seed+beat)%bank.length],staffLine=person.id==='pet-rabbit'&&peer.id==='hina'?'모찌, 편히 쉬어. 내가 지킬게.':residentVoice.staff[peer.id];
      return {anchor,previous,scene:{key:seed+'|'+beat+'|'+peer.id,partnerId:peer.id,partnerName:name,kind:chairman?'chairman':monitor?'monitor':'rest',petLine,staffLine,line:petLine+' · '+name+' · '+staffLine}};
    }
    return null;
  }
  function residentVisitPath(a,b,free){
    if(!a||a.floor!==b.floor)return [];
    const steps=Math.max(1,Math.ceil(Math.max(Math.hypot(b.x-a.x,b.y-a.y),Math.hypot((b.visual[0]-a.visual[0])*art.width/100,(b.visual[1]-a.visual[1])*art.height/100))));
    for(let i=0;i<=steps;i++){const t=i/steps,point=[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t],visual=[a.visual[0]+(b.visual[0]-a.visual[0])*t,a.visual[1]+(b.visual[1]-a.visual[1])*t];if(!residentSafe(a.floor,point,visual)||!free(visual))return []}
    return [a,b];
  }
  // In-memory, display-only quarter-hour scene; no scheduler or saved state.
  let residentTrioHold=null;
  const residentTrioLines=Object.freeze([{id:'pet-dog',line:'같이 놀자!!'},{id:'pet-cat',line:'싫어요.'},{id:'pet-rabbit',line:'……조용히 놀면요.'},{id:'pet-bori',line:'천천히 놀아요. 난 여기 있을게요, 멍.'}].map(Object.freeze));
  function residentTrioKey(now){const c=residentClock(now);return c.day+'|'+Math.floor(c.seconds/900)}
  function residentTrio(now,states,staff){
    const available=residentTrioLines.filter(p=>states.some(s=>s.id===p.id&&s.pose!=='sleep')),offset=available.length>3?Math.floor(residentClock(now).seconds/900)%available.length:0;
    const lines=[...available.slice(offset),...available.slice(0,offset)].slice(0,3),pets=lines.map(p=>states.find(s=>s.id===p.id));
    if(pets.length!==3||pets.some(p=>p.floor!==pets[0].floor))return null;
    const floor=pets[0].floor,key=residentTrioKey(now),occupied=staff?.floors?.flatMap(f=>f.people||[])||[];
    // All three share 1F in the evening/night; these stops keep full body clearance.
    const spots=lines.map(p=>residentSpot(residentNightSpots[p.id][0]));
    if(spots.some(a=>!a||a.floor!==floor||occupied.some(p=>{const v=p.position||(p.seat&&[p.seat.x,p.seat.y]);return p.floor===floor&&v&&Math.hypot((a.visual[0]-v[0])*art.width/100,(a.visual[1]-v[1])*art.height/100)<100})))return null;
    if(!residentTrioHold||residentTrioHold.key!==key)residentTrioHold={key,floor,until:Number(now)+12000,spots:Object.fromEntries(lines.map((p,i)=>[p.id,spots[i]]))};
    return {key,lines};
  }
  // Select exactly three nearby awake pets; a fourth resident never silences the trio.
  function residentTrioChat(states){
    const awake=residentTrioLines.filter(p=>states.some(s=>s.id===p.id&&!s.walking&&s.pose!=='sleep'&&!s.affection));
    for(let a=0;a<awake.length;a++)for(let b=a+1;b<awake.length;b++)for(let c=b+1;c<awake.length;c++){
      const lines=[awake[a],awake[b],awake[c]],pets=lines.map(p=>states.find(s=>s.id===p.id));
      if(pets.every(p=>pets.every(q=>p.floor===q.floor&&Math.hypot((p.position[0]-q.position[0])*art.width/100,(p.position[1]-q.position[1])*art.height/100)<280)))return lines;
    }
    return null;
  }
  function residentSnapshot(now=new Date(),staff=null,enabled=true,reduced=false,interactions=true){
    if(!enabled||!canon||!art)return [];
    const time=koreaTime(now),clock=residentClock(now),hour=clock.hour;
    const occupied=staff?.floors?.flatMap(f=>f.people||[])||[];
    if(residentTrioHold&&(residentTrioHold.key!==residentTrioKey(now)||Number(now)>=residentTrioHold.until))residentTrioHold=null;
    const states=[...residentPeople.filter(p=>p.id!=='pet-rabbit'),...residentPeople.filter(p=>p.id==='pet-rabbit')].flatMap(person=>{
      const scheduleHour=person.pet?clock.seconds/3600:hour,window=person.hours.find(([start,end])=>scheduleHour>=start&&scheduleHour<end);if(!window)return [];
      const seconds=person.pet?clock.seconds:clock.seconds%86400,day=person.pet?clock.day:time.toISOString().slice(0,10),sleeping=person.pet&&(clock.sleeping||person.id==='pet-bori'&&!reduced&&(clock.seconds+residentSeed('bori-nap|'+clock.day)%300)%900<600);
      const chairman=interactions&&person.id==='pet-dog'&&!sleeping&&occupied.find(p=>p.id==='seongmin'&&p.seat&&(p.walking||p.pose==='sitting'||p.seat.posture==='sitting'));
      const floor=chairman&&(!clock.night||chairman.floor==='1f')?chairman.floor:window[2],spots=(person.pet&&clock.night?residentNightSpots[person.id]:person.places[floor]||[...residentStops.values()].filter(a=>a.floor===floor&&(person.id==='pet-rabbit'||!a.id.startsWith('resident_rabbit_'))).map(a=>a.id)).filter(residentSpot);if(!spots.length)return [];
      const seed=residentSeed('office-residents|'+day+'|'+person.id),beat=Math.floor(seconds/900),rhythm=person.pet?residentRhythm(person.id,day,seconds):{beat,elapsed:seconds%900,rest:0},index=sleeping||reduced?0:(rhythm.beat+(person.pet?seed%spots.length:0))%spots.length;
      const free=p=>!occupied.some(q=>{const at=q.position||(q.seat&&[q.seat.x,q.seat.y]);return q.floor===floor&&at&&Math.hypot((p[0]-at[0])*art.width/100,(p[1]-at[1])*art.height/100)<(q.resident?96:100)});
      const companions=interactions&&person.pet&&person.id!=='pet-bori'&&!sleeping&&!clock.night&&floor==='1f'&&residentPeople.some(q=>q.pet&&q.id!==person.id&&q.hours.some(([a,b,f])=>clock.seconds/3600>=a&&clock.seconds/3600<b&&f===floor));
      const group=companions&&residentSpot(residentNightSpots[person.id][0]);
      if(group&&residentVisitPath(residentSpot(spots[0]),group,free).length)spots.splice(1,spots.length-1,group.id);
      const trio=interactions&&!reduced&&!sleeping&&residentTrioHold?.floor===floor?residentTrioHold.spots[person.id]:null;
      let anchor=trio||residentSpot(spots[index]),path=residentPath(spots[(index+spots.length-1)%spots.length],spots[index]),scene=null;
      // A social visit yields to the other pet's usual stops, including pets
      // evaluated later; neither late-night companion gets pushed offscreen.
      const visitFree=p=>free(p)&&!residentPeople.some(other=>other.pet&&other.id!==person.id&&other.id!=='pet-rabbit'&&(other.id!=='pet-bori'||other.hours.some(([a,b,f])=>clock.seconds/3600>=a&&clock.seconds/3600<b&&f===floor))&&(clock.night?residentNightSpots[other.id]:other.places[floor]||[]).some(id=>{const a=residentSpot(id);return a&&Math.hypot((p[0]-a.visual[0])*art.width/100,(p[1]-a.visual[1])*art.height/100)<96}));
      const visit=interactions&&!reduced&&person.pet&&person.id!=='pet-bori'&&!sleeping&&!trio?residentVisit(person,floor,occupied,seed,beat,visitFree,rhythm.beat):null;
      if(visit){const approach=residentVisitPath({...anchor,pet:true},visit.anchor,free);if(approach.length||!person.places[floor]||visit.scene.kind==='chairman'){anchor=visit.anchor;path=residentVisitPath(visit.previous,anchor,free);scene=visit.scene}}
      let position=anchor.visual,point=[anchor.x,anchor.y],walking=false,facing=seed%2?'left':'right',pose=person.pet?(sleeping?'sleep':scene?'sitting':beat%3?'sitting':'standing'):'standing',distance=0,motion;
      // Same validated routes: 15..30s cat/dog cycles, 25..45s rabbit cycles.
      // No lifts, shared reservations, layout reads or persistent state.
      let elapsed=rhythm.elapsed;
      const rabbit=person.id==='pet-rabbit';
      if(!reduced&&!trio&&!sleeping&&elapsed<rhythm.rest){anchor=path[0]||anchor;position=anchor.visual;point=[anchor.x,anchor.y];path=[anchor]}
      else elapsed-=rhythm.rest;
      if(trio)path=[anchor];
      if(person.pet&&!reduced&&path.length>1&&!sleeping){
        const a=path[0],b=path.at(-1),sample=petMotion(person.id,day,rhythm.beat,a,b,elapsed,free);
        if(sample){motion=sample;({position,point,walking,facing,pose}=sample);if(sample.active)anchor=a;else {position=b.visual;point=[b.x,b.y];pose=scene?'sitting':beat%3?'sitting':'standing'}}
      }else if(!reduced&&path.length>1&&!sleeping)for(let i=1;i<path.length;i++){
        const a=path[i-1],b=path[i],va=a.visual,vb=b.visual,length=Math.hypot((vb[0]-va[0])*art.width/100,(vb[1]-va[1])*art.height/100),duration=length/(rabbit?18:person.id==='pet-dog'?48:40);
        if(elapsed<duration){const t=duration?elapsed/duration:1;anchor=a;position=[va[0]+(vb[0]-va[0])*t,va[1]+(vb[1]-va[1])*t];point=[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t];distance+=length*t;walking=true;facing=vb[0]<va[0]?'left':'right';pose=(rabbit?'hop-':'walk-')+(Math.floor(distance/(rabbit?18:30))%2?'b':'a');break}
        elapsed-=duration;distance+=length;
      }
      if(!free(position)){const alternatives=sleeping?[...spots.map(residentSpot),...[...residentStops.values()].filter(a=>a.floor===floor&&(person.id==='pet-rabbit'||!a.id.startsWith('resident_rabbit_'))&&residentSpot(a.id))]:spots.map(residentSpot),fallback=alternatives.find(a=>free(a.visual));if(!fallback)return [];anchor=fallback;position=anchor.visual;point=[anchor.x,anchor.y];walking=false;pose=person.pet?(sleeping?'sleep':'sitting'):'standing';scene=null;motion=undefined}
      occupied.push({floor,resident:true,seat:{x:position[0],y:position[1]}});
      if(walking)scene=null;
      return [{id:person.id,name:person.name,sprite:person.sprite,pet:!!person.pet,floor,anchor:anchor.id,position,point,walking,facing,pose,scene,...(motion?{motion}:{})}];
    });
    return residentLife(now,interactions?residentAffection(now,states,occupied):states,reduced);
  }
  // Compact atlas fallback also works with a cached, pre-resident manifest.
  // The approved entries in manifest-v3.json remain the asset source of truth.
  function residentAtlas(person){const poses=person.pet?['sitting','standing',...(person.id==='pet-rabbit'?['hop-a','hop-b']:['walk-a','walk-b']),'sleep']:['standing','sitting','walk-a','walk-b'];return {id:person.id,file:person.sprite+'.webp',scale:3,cell:[96,144],atlas:person.pet?[480,288]:[768,768],frames:(person.pet?['left','right']:['']).flatMap((direction,row)=>poses.map((pose,col)=>({name:pose+(direction?'-'+direction:''),rect:[col*96,row*144,96,144],pivot:[48,135]})))}}
  const residents=Object.freeze({names:residentNames,people:residentPeople,companions:companionPeople,companionSnapshot,companionAtlas,companionReactions,companionSafe,seed:residentSeed,clock:residentClock,rhythm:residentRhythm,motion:petMotion,route:petRoute,ease:petEase,facing:petFacing,life:residentLife,affection:residentAffection,affectionVoice:residentAffectionVoice,voice:residentVoice,snapshot:residentSnapshot,safe:residentSafe,spot:residentSpot,path:residentPath,atlas:residentAtlas,bounds:residentBounds,trio:residentTrio,trioLines:residentTrioLines,trioChat:residentTrioChat,furniture:residentFurniture});
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
  // Visual projection only. The scheduler still owns every leg and deadline.
  function distanceGait(distance,dx,reduced=false){
    const step=60,phase=Math.max(0,distance)/step;
    return {pose:Math.floor(phase)%2?'walk-b':'walk-a',bounce:reduced?0:-Math.abs(Math.sin(phase*Math.PI))*.65,lean:reduced?0:Math.sign(dx)*.9};
  }
  function sampleMotion(event,person,seconds,reduced=false){
    const state=scheduler.stateAt(event,person,seconds,reduced),outEnd=person.out.at(-1)?.end??event.start;
    const legs=seconds<outEnd?person.out:person.back;let distance=0,dx=0;
    for(const leg of legs){
      if(seconds<=leg.start)break;
      const a=anchors.get(leg.from),b=anchors.get(leg.to),pa=visualPoint(a),pb=visualPoint(b);
      if(a.floor!==b.floor)continue;
      const ratio=Math.max(0,Math.min(1,(seconds-leg.start)/(leg.end-leg.start)));
      distance+=Math.hypot((pb[0]-pa[0])*(art?.width||1672)/100,(pb[1]-pa[1])*(art?.height||941)/100)*ratio;
      if(seconds<leg.end)dx=pb[0]-pa[0];
    }
    return {...state,...distanceGait(distance,dx,reduced),distance};
  }
  const effectDurations=Object.freeze({stand:480,sit:520,nod:460,lean:620,tap:440,wiggle:720,hop:480});
  function createReactions(){
    let active=null,queue=[],last={};
    function request(kind,at,priority=false){
      if(!effectDurations[kind]||active?.kind===kind||queue.some(q=>q.kind===kind))return;
      const next={kind,at};if(priority){active=null;queue.unshift(next)}else queue.push(next);
      queue=queue.slice(0,3);
    }
    return {request,observe(data,now){
      if(data.greeting==='true'&&last.greeting!=='true')request('nod',now);
      if(data.partner&&(last.partner!==data.partner||data.speaking==='true'&&last.speaking!=='true'))request('lean',now+(data.person<data.partner?0:320));
      last={greeting:data.greeting,partner:data.partner,speaking:data.speaking};
    },tick(now,reduced=false,walking=false){
      if(reduced){active=null;queue=[];return null}
      if(active&&now>=active.end)active=null;
      if(walking){if(active){if(['nod','lean','tap'].includes(active.kind))queue.unshift({kind:active.kind,at:now});active=null}return null}
      if(!active&&queue.length&&now>=queue[0].at){const next=queue.shift();active={kind:next.kind,end:now+effectDurations[next.kind]}}
      return active;
    },reset(){active=null;queue=[]}};
  }
  // Stable geometry never samples the sprite's animated transform.
  function stableActorBox(actor){
    const r=actor.getBoundingClientRect();
    return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
  }
  function stableSpriteBox(actor,box,reduced=false){
    const cell=box,bounds=actor.dataset.resident&&actor.officeArtBounds;
    if(bounds){const [l,t,r,b]=bounds;box={left:cell.left+cell.width*l,right:cell.left+cell.width*r,top:cell.top+cell.height*t,bottom:cell.top+cell.height*b,width:cell.width*(r-l),height:cell.height*(b-t)}}
    // Retain the existing static partner turn in the reservation, without
    // reading the animated sprite rectangle or fitting again during an effect.
    const angle=reduced||actor.dataset.resident||actor.dataset.walking==='true'?0:actor.dataset.facing==='left'?-4:actor.dataset.facing==='right'?4:0;
    if(!angle)return box;
    const pivot=actor.officePivot||[.5,.953125],x=cell.left+cell.width*pivot[0],y=cell.top+cell.height*pivot[1],c=Math.cos(angle*Math.PI/180),s=Math.sin(angle*Math.PI/180);
    const points=[[box.left,box.top],[box.right,box.top],[box.right,box.bottom],[box.left,box.bottom]].map(([a,b])=>[x+(a-x)*c-(b-y)*s,y+(a-x)*s+(b-y)*c]);
    const left=Math.min(...points.map(p=>p[0])),right=Math.max(...points.map(p=>p[0])),top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
    return {left,right,top,bottom,width:right-left,height:bottom-top};
  }
  function stableMascotBox(node,floor){
    const width=node.offsetWidth,height=node.offsetHeight,parent=node.offsetParent?.parentElement;
    const left=floor.left+(parent?.clientLeft||0)+node.offsetLeft-width/2,top=floor.top+(parent?.clientTop||0)+node.offsetTop-height;
    return {left,right:left+width,top,bottom:top+height,width,height};
  }
  globalThis.HaniBuildingScene=Object.freeze({floors,snapshot,projection,profile,spriteSource,residents,seatMaps,deskSurfaces,homeSeat,assignSeats,actionPool,bubble,canon,art,visualPoint,anchors,route,deskPropArt:DESK_PROP_ART,legacySeatMaps,legacySurfaces,scheduler,createScheduler,createPresence,motion:Object.freeze({gait:distanceGait,sample:sampleMotion,createReactions,stableActorBox,stableSpriteBox,stableMascotBox,effectDurations}),atmosphere:Object.freeze({light:officeLight,background:officeBackground,monitors:workingMonitors,opacity:monitorOpacity}),labels:Object.freeze({priority:statusLabelPriority,place:placeStatusLabels,short:phoneStatusLine}),places:Object.freeze([...places,...(scheduler?.errandPlaces||[]),...(scheduler?.reportPlaces||[])]),tapLines:Object.freeze({bucket:tapBucket,validate:validTapBank,create:createTapLines,dramaDate,validateDrama:validDramaBank})});
})();
/* Read-only Living Office. The Agent Case renderer remains the sole owner of requests, answers and decisions. */
(() => {
  "use strict";
  const root=document.getElementById("haniOfficeLive"),map=document.getElementById("haniOfficeMap");
  if(!root||!map)return;
  const officePresence=HaniBuildingScene.createPresence({now:()=>Date.now(),locked:()=>!document.getElementById('app')||document.getElementById('app').classList.contains('login-locked'),visible:()=>document.visibilityState==='visible',override:()=>window.HaniOfficePresence});
  for(const type of ['pointerdown','keydown','wheel','touchstart'])document.addEventListener(type,event=>{officePresence.interact(event);if(type==='pointerdown'&&event?.target)activateActor(event,true);else if(type==='keydown'&&event?.key==='Escape')closeBubble(true,true)},{passive:true,capture:type==='pointerdown'});
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
  const actors=new Map();let caseData=null,meeting=false,travelId=0,liveStage="",liveAgents=null,liveCross=null;
  let mapOnScreen=true,sceneActive=false,lastProjection=0;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motion.matches;
  motion.addEventListener?.('change',event=>{reduced=event.matches;if(reduced)for(const actor of actors.values()){finishTravel(actor);clearMotion(actor)}if(sceneVisible())updateBuilding(true,false)});
  const spriteEntries=new Map((assets?.sprites.entries||[]).map(e=>[e.id,e])),spriteCache=new Map();
  const hdEntries=new Map((assets?.spritesV3?.entries||[]).filter(e=>e.scale===3&&(e.frames?.length===4||['pet-cat','pet-dog'].includes(e.id)&&e.frames?.length===10)&&e.cell?.length===2&&e.atlas?.length===2).map(e=>[e.id,e]));
  const residentSlots=assets?.spritesV3?[...HaniBuildingScene.residents.people,...HaniBuildingScene.residents.companions]:[];
  for(const person of residentSlots)if(!spriteEntries.has(person.id))spriteEntries.set(person.id,(person.companion?HaniBuildingScene.residents.companionAtlas(person):HaniBuildingScene.residents.atlas(person)));
  const visualIdentity=HaniBuildingScene.scheduler?.identity||{seongmin:{entity:'human_user',role:'chairman',officeVisual:'ceo_frog',spriteId:'seongmin'}};
  function spriteId(actor){return actor.dataset.sprite||visualIdentity[actor.dataset.person]?.spriteId||actor.dataset.person}
  function pose(actor,name){
    const previous=actor.dataset.pose;
    if(!reduced&&previous&&previous!==name&&['sitting','standing'].includes(name)&&(previous==='sitting'||previous==='standing'||name==='sitting'&&previous.startsWith('walk-'))){
      actor.officeReactions.request(name==='sitting'?'sit':'stand',Date.now(),true);
    }
    // Logical pose and atlas always follow the scheduler immediately. The dip
    // is a one-shot transform, never a delayed scheduler or data-pose change.
    applyPose(actor,name);
  }
  function applyPose(actor,name){
    const sprite=actor.querySelector('.hani-office-sprite'),entry=spriteEntries.get(spriteId(actor));
    actor.dataset.pose=name;
    if(actor.dataset.avatar!=='v2'||!entry)return;
    const f=entry.frames.find(f=>f.name===((actor.dataset.resident==='pet'||entry.officeCompanion)?name+'-'+(actor.dataset.facing||'left'):name))||entry.frames[0];
    actor.officePivot=[f.pivot[0]/entry.cell[0],f.pivot[1]/entry.cell[1]];
    if(actor.dataset.resident){const bounds=HaniBuildingScene.residents.bounds(actor.dataset.person,name);actor.officeArtBounds=bounds.map((v,i)=>v/entry.cell[i%2]);actor.style.setProperty('--resident-top',String(bounds[1]/entry.cell[1]))}
    sprite.style.backgroundPosition=(f.rect[0]/(entry.atlas[0]-entry.cell[0])*100)+'% '+(f.rect[1]/(entry.atlas[1]-entry.cell[1])*100)+'%';
    actor.style.setProperty('--actor-pivot-x',String(-f.pivot[0]/entry.cell[0]));actor.style.setProperty('--actor-pivot-y',String(-f.pivot[1]/entry.cell[1]));
    actor.style.setProperty('--idle-pivot-x',(f.pivot[0]/entry.cell[0]*100)+'%');actor.style.setProperty('--idle-pivot-y',(f.pivot[1]/entry.cell[1]*100)+'%');
  }
  function loadSprite(actor,onLoad){
    const id=spriteId(actor),entry=spriteEntries.get(id),sprite=actor.querySelector('.hani-office-sprite');if(!entry)return;
    if(actor.officeSpriteRequest===id)return;actor.officeSpriteRequest=id;
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
  function place(actor,position){moveActor(actor,position)}
  function moveActor(actor,position){
    actor.officePosition=position;
    actor.style.left=position[0]+'%';actor.style.top=position[1]+'%';
  }
  function clearMotion(actor){actor.officeReactions.reset();delete actor.dataset.motion;actor.style.setProperty('--step-bounce','0px');actor.style.setProperty('--step-lean','0deg')}
  function activityStatus(actor,full){
    if(actor.dataset.visitor==='true'&&!actor.officeTravel&&actor.dataset.walking!=='true'&&!['GOING','RETURNING'].includes(actor.dataset.behavior)&&/^(?:상담 대기 중|면접 대기 중… 두근)$/.test(full))return 'waiting';
    const leisure=/물 한 모금|쉬|휴식|수다|간식|커피|야식|메뉴|투표|저녁 뭐|인스타|음악|영화|산책|졸|약속|휴대폰|고양이 영상|기지개|스트레칭|하품|노래|플레이리스트|흥얼|사진첩|(?:오늘 찍은|여행) 사진|날씨|퇴근 시간|알람|물병|점심 후보|단백질 식단|잠깐 몸 풀기/;
    const workPhrase=/(?:고객 표현 쉬운 말로 바꾸는 중|어려운 용어 쉬운 말 퀴즈 중|다음 약속 준비물 적는 중|졸린 눈으로 문장 줄이는 중)$/;
    const deskNote=/^(?:영화 메모에 작은 별 그리는 중|알람 이름 짧게 바꾸는 중)$/.test(full);
    const everydayScene=/^scene-(?:meme|coffee-menu|snack-budget|watch-pick|travel-talk|roof-selfie)$/.test(actor.dataset.action||'');
    return actor.officeTravel||actor.dataset.walking==='true'||['GOING','RETURNING'].includes(actor.dataset.behavior)||full==='이동 중'?'moving':actor.dataset.called==='true'||actor.dataset.activity==='meeting'&&!everydayScene||/(?:상담(?: 받는)?|면접 (?:진행|보는)) 중$/.test(full)?'meeting':/^(?:visitor-host|report)-/.test(actor.dataset.place||'')||actor.dataset.activity==='visit'&&/택배|배달/.test(full)||/(?:급하게 (?:인스타 끄는|창 닫는)|회장님 질문 듣는|회장님께 화면 설명) 중$/.test(full)?'work':everydayScene||['rest','play'].includes(actor.dataset.activity)||/^(?:coffee|cafe|pantry|sofa|garden|terrace|window)-/.test(actor.dataset.place||'')||actor.dataset.zone==='lounge'&&!/^(?:task|errand)-/.test(actor.dataset.place||'')||!workPhrase.test(full)&&!deskNote&&leisure.test(full)?'rest':/야근/.test(full)?'night':'work';
  }
  const statusNames={work:'근무 중',rest:'휴식 중',waiting:'대기 중',meeting:'회의 중',moving:'이동 중',night:'야근 중'};
  const statusIcons={work:'💻',rest:'☕',waiting:'💬',meeting:'💬',moving:'🚶',night:'🌙'};
  function statusDot(actor){if(actor.dataset.resident){actor.dataset.status='resident';actor.setAttribute('aria-label',actor.dataset.name);return}const dot=actor.querySelector('.hani-office-status-dot'),full=actor.querySelector('.hani-office-status').dataset.full||'';actor.dataset.status=activityStatus(actor,full);dot.title=statusNames[actor.dataset.status];dot.setAttribute('aria-label',dot.title);actor.setAttribute('aria-label',`${actor.dataset.name}: ${dot.title} · ${full}`)}
  function label(actor,value,mood=false){
    const status=actor.querySelector('.hani-office-status'),icon=actor.querySelector('.hani-office-activity-icon'),compact=matchMedia('(max-width:600px)').matches;
    status.dataset.full=value;status.title=value;status.setAttribute('aria-label',value);actor.dataset.mood=String(mood);statusDot(actor);
    icon.textContent=actor.dataset.emoji||statusIcons[actor.dataset.status];icon.hidden=false;icon.title=value;
    status.textContent=icon.textContent+' '+HaniBuildingScene.labels.short(value,new Set(),actor.dataset.status,compact);
    if(actor.officeText)actor.officeText.textContent=value;
  }
  function headIcon(actor){
    const data=actor.dataset,line=data.line||'';
    if(actor.officeTravel||data.walking==='true'||['GOING','RETURNING'].includes(data.behavior))return '';
    if(data.emoji)return data.emoji;
    if(/(?:상담(?: 받는)? 중|상담 대기|면접)/.test(line))return '💬';
    if(/급하게 창 닫는 중|인스타/.test(line))return '📱';
    if(/커피|카페|Coffee/i.test(line))return '☕';
    if(/점심|식사|도시락|밥 먹|아침 먹|저녁 먹/.test(line))return '🍱';
    if(/옥상|정원|테라스/.test(line))return '🌿';
    if(/소파/.test(line))return '🛋️';
    if(data.called==='true'||data.activity==='meeting'&&activityStatus(actor,line)==='meeting'||/^meeting-/.test(data.place||'')||/회의(?:실| 중|하는| 참여| 진행)/.test(line))return '📋';
    if(/택배|배달/.test(line))return '📦';
    return '';
  }
  // Batch reset -> one geometry read per node -> pure packing -> batch commit.
  // Name and status travel together; actor coordinates and foot pivots never move.
  function fitStatusLabels(){
    const floor=map.getBoundingClientRect?.();if(!floor?.width)return;
    const visible=[...actors.values()].filter(a=>!a.hidden),compact=matchMedia('(max-width:600px)').matches;
    const rows=visible.map(actor=>({actor,name:actor.querySelector('.hani-office-name'),status:actor.querySelector('.hani-office-status')}));
    const used=new Set();
    for(const {actor,name,status}of rows){
      if(actor.dataset.resident){actor.dataset.labelMode='name';actor.officeCompact.textContent='';name.title=actor.dataset.name;name.setAttribute('aria-label',name.title);name.hidden=false;name.style.visibility='';name.style.setProperty('--name-x','0px');name.style.setProperty('--name-y','0px');status.hidden=true;status.style.visibility='hidden';continue}
      statusDot(actor);
      actor.dataset.labelMode=compact?'pill':'separate';
      status.textContent=actor.querySelector('.hani-office-activity-icon').textContent+' '+HaniBuildingScene.labels.short(status.dataset.full,used,actor.dataset.status,compact);
      actor.officeCompact.textContent=compact?' · '+status.textContent:'';
      name.title=actor.dataset.name+' · '+status.dataset.full;name.setAttribute('aria-label',name.title);
      for(const [kind,node]of [['name',name],['status',status]]){node.style.setProperty('--'+kind+'-x','0px');node.style.setProperty('--'+kind+'-y','0px');node.style.visibility='';node.hidden=false;}
      status.hidden=compact;
    }
    // Reserve the full pet gesture envelope before the existing label packer runs.
    const groups=rows.map(({actor,name,status})=>{const box=HaniBuildingScene.motion.stableActorBox(actor),sprite=HaniBuildingScene.motion.stableSpriteBox(actor,box,reduced);if(actor.dataset.resident==='pet'&&!reduced){const pad=Math.max(4,sprite.height*.14);sprite.left-=pad;sprite.right+=pad;sprite.top-=pad;sprite.bottom+=pad;sprite.width+=pad*2;sprite.height+=pad*2}return {id:actor.dataset.person,compact,priority:HaniBuildingScene.labels.priority(actor.dataset),actor:actor.dataset.resident?sprite:box,sprite,name:name.getBoundingClientRect(),status:status.getBoundingClientRect()}});
    // Measure the same persistent slot without activity text, in one batch.
    // Keep full text in the slot/title/aria; CSS only hides the short activity.
    if(compact){
      for(const {actor}of rows)actor.dataset.labelMode='name';
      for(let i=0;i<rows.length;i++)groups[i].nameOnly=rows[i].name.getBoundingClientRect();
    }
    for(let i=0;i<rows.length;i++)if(rows[i].actor.dataset.resident)groups[i].nameOnly=groups[i].name;
    // Reserve the separate mascot owner's actual visible sprite boxes.
    const obstacles=[];
    if(compact&&!actorBubble.hidden&&actors.get(bubblePerson)?.dataset.companion==='true'){const b=actorBubble.getBoundingClientRect();if(b.width&&b.height)obstacles.push(b)}
    for(const node of root.querySelectorAll('.hani-desk-mascots:not([hidden]) .hani-desk-mascot[data-ready="true"]')){const r=HaniBuildingScene.motion.stableMascotBox(node,floor);if(r.width&&r.height)obstacles.push(r)}
    const placements=HaniBuildingScene.labels.place(floor,groups,obstacles);
    for(const {actor}of rows)if(compact||actor.dataset.resident)actor.dataset.labelMode=actor.dataset.resident?'name':placements.get(actor.dataset.person)?.dot?'dot':placements.get(actor.dataset.person)?.mode||'pill';
    for(let i=0;i<rows.length;i++)for(const kind of ['name','status']){
      if(rows[i].actor.dataset.resident&&kind==='status'){rows[i][kind].officeLabelPlacement=null;continue}
      const node=rows[i][kind],base=compact&&placements.get(groups[i].id)?.dot?node.getBoundingClientRect():compact&&placements.get(groups[i].id)?.mode==='name'&&kind==='name'?groups[i].nameOnly:groups[i][kind],p=rows[i].actor.dataset.resident&&placements.get(groups[i].id)?.dot?null:placements.get(groups[i].id)?.[kind];
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
  for(const [key,name,group,row] of [...people,...residentSlots.map(p=>[p.id,p.name,null,0])]){
    const actor=document.createElement("div");actor.className="hani-office-actor";actor.dataset.person=key;actor.dataset.name=name;actor.dataset.seat=residentSlots.some(p=>p.id===key)?'':(HaniBuildingScene.homeSeat(key)||buildingChairmanSlot()).id;actor.dataset.spot="seat";actor.officeReactions=HaniBuildingScene.motion.createReactions();
    const resident=residentSlots.find(p=>p.id===key);if(resident){actor.dataset.resident=resident.pet?'pet':resident.kid?'kid':'npc';if(resident.companion)actor.dataset.companion='true';actor.dataset.sprite=resident.sprite;actor.hidden=true}
    if(resident?.pet){const heart=document.createElement('span');heart.className='hani-office-pet-heart';heart.setAttribute('aria-hidden','true');heart.hidden=true;actor.append(heart);actor.officeHeart=heart}
    const sprite=document.createElement('div');sprite.className='hani-office-sprite';sprite.dataset.row=String(row);actor.officeLegacy={group,row};
    const status=document.createElement('span');status.className='hani-office-status';const tag=document.createElement('small');tag.className='hani-office-name';
    const dot=document.createElement('span'),icon=document.createElement('span'),tagName=document.createElement('span'),compactLine=document.createElement('span');dot.className='hani-office-status-dot';dot.setAttribute('role','img');icon.className='hani-office-activity-icon';icon.setAttribute('aria-hidden','true');icon.hidden=true;compactLine.className='hani-office-compact-line';tagName.textContent=name.split(' · ').at(-1);tag.append(dot,icon,tagName,compactLine);actor.officeName=tagName;actor.officeCompact=compactLine;
    const member=key==='seongmin'?window.HaniOrganizationRoster?.chairman:window.HaniOrganizationRoster?.people.find(p=>p.id===key),team=window.HaniOrganizationRoster?.teams.find(t=>t.id===member?.team);
    actor.dataset.team=member?.team||'';
    if(team){tag.style.setProperty('--office-team',team.color);tag.style.setProperty('--office-team-tint',team.tint)}
    const rank=document.createElement('span');rank.className='hani-office-rank';rank.textContent=key==='seongmin'?'':member?.rank?' '+member.rank:'';tagName.after(rank);
    const prop=document.createElement('span');prop.className='hani-office-prop';prop.setAttribute('aria-hidden','true');actor.append(sprite,tag,status,prop);actor.setAttribute('role','button');actor.tabIndex=0;actor.dataset.avatar='pending';actorLayer.append(actor);actors.set(key,actor);
    const rhythm=resident?HaniBuildingScene.residents.seed('idle-motion|'+key):HaniBuildingScene.scheduler?.seed('idle-motion|'+key)||row;actor.style.setProperty('--idle-duration',(3.6+rhythm%29/10)+'s');actor.style.setProperty('--idle-delay',(-rhythm%67/10)+'s');
  }
  // One scene host; actors remain mounted and only their floor/position changes.
  const building=HaniBuildingScene,tabs=root.querySelector(".hani-building-tabs"),floorLabel=document.createElement("span"),overflowChip=document.createElement("span"),floorButtons=new Map(),backgroundCache=new Map();
  const roster=document.createElement("ul");roster.className="hani-building-roster";roster.setAttribute("aria-label","현재 층 직원과 활동");root.querySelector(".hani-office-scroll").after(roster);for(const actor of actors.values()){const row=document.createElement("li"),name=document.createElement("b"),text=document.createElement("span");name.textContent=actor.dataset.name;row.append(name,text);if(!actor.dataset.resident)roster.append(row);actor.officeRow=row;actor.officeRowName=name;actor.officeText=text}
  const actorBubble=document.createElement('div'),bubbleLine=document.createElement('p'),profileLink=document.createElement('a'),bubbleSprite=document.createElement('div'),bubbleClose=document.createElement('button');
  actorBubble.className='hani-office-character-bubble';actorBubble.hidden=true;actorBubble.setAttribute('aria-live','polite');actorBubble.setAttribute('aria-atomic','false');bubbleLine.setAttribute('aria-atomic','true');profileLink.setAttribute('aria-live','off');profileLink.textContent='프로필 ↗';profileLink.href='#organization/people';bubbleSprite.className='hani-office-bubble-sprite';bubbleSprite.hidden=true;bubbleSprite.setAttribute('aria-hidden','true');bubbleClose.type='button';bubbleClose.className='hani-office-bubble-close';bubbleClose.textContent='✕';bubbleClose.setAttribute('aria-label','말풍선 닫기');actorBubble.append(bubbleLine,profileLink,bubbleSprite,bubbleClose);actorBubble.onclick=event=>{if(!profileLink.contains(event.target))closeBubble(true,true)};map.append(actorBubble);
  const affinity=createOfficeAffinity();window.HaniOfficeAffinity=Object.freeze({get:affinity.get});
  const affinityRow=document.createElement('small'),affinityFloat=document.createElement('span');
  affinityRow.className='hani-office-affinity';affinityRow.hidden=true;
  affinityFloat.className='hani-office-affinity-float';affinityFloat.setAttribute('aria-hidden','true');affinityFloat.textContent='+1 ♡';affinityFloat.hidden=true;
  actorBubble.append(affinityRow,affinityFloat);
  function showAffinity(id,result=null){
    const info=affinity.get(id),actor=actors.get(id),known=actor?actor.dataset.companion!=='true'&&(actor.dataset.resident==='pet'||(!actor.dataset.resident&&actor.dataset.visitor!=='true'&&id!=='seongmin')):id==='iseul'||id==='eunha';
    affinityRow.hidden=!known;affinityFloat.hidden=!result?.added;
    if(!known)return;
    affinityRow.textContent=(actor?.dataset.name||(id==='eunha'?'은하':'이슬'))+' · Lv'+info.level+' '+info.name+' '+info.hearts;
    affinityFloat.dataset.beat=affinityFloat.dataset.beat==='a'?'b':'a';
  }
  function tapActor(actor,event){
    if(actor.hidden||!sceneVisible()||document.getElementById('app')?.classList.contains('login-locked'))return;
    openBubble(actor,false,event);
  }
  const tapLines=building.tapLines.create(building.canon?.people||window.HaniOrganizationRoster?.people||[]);
  let bubblePerson=null,bubbleSerial=0,bubbleSelection=null,pendingTap=null,cancelled=new Set(),cancelledDay='',meetingStartedAt=0;
  let bubbleTimer=null,lastBubbleTap=-Infinity,autoBubbleEntry=true;
  const autoBubbleFloors=new Map();
  function clearBubbleTimer(){if(bubbleTimer!==null)globalThis.clearTimeout?.(bubbleTimer);bubbleTimer=null}
  function queueBubbleTimer(fn,ms){clearBubbleTimer();bubbleTimer=setTimeout(fn,ms)}
  function bubbleDuration(ms=3000){return globalThis.innerWidth<=480?Math.max(5000,ms):ms}
  function autoBubbleQuiet(){return reduced||document.hidden||!sceneVisible()||!actorBubble.hidden||Date.now()-lastBubbleTap<5000||!document.getElementById('app')||document.getElementById('app').classList.contains('login-locked')}
  function scheduleFloorBubble(){
    if(!autoBubbleEntry||map.dataset.art==='loading'||!sceneVisible())return;
    autoBubbleEntry=false;
    if(autoBubbleQuiet()||Date.now()-(autoBubbleFloors.get(activeFloor)??-Infinity)<60000)return;
    const floor=activeFloor,serial=bubbleSerial;
    queueBubbleTimer(()=>{
      if(serial!==bubbleSerial||floor!==activeFloor)return;
      bubbleTimer=null;
      if(autoBubbleQuiet()||Date.now()-(autoBubbleFloors.get(floor)??-Infinity)<60000)return;
      const eligible=[...actors.values()].filter(actor=>!actor.hidden&&!actor.officeTravel&&actor.dataset.walking!=='true'&&!actor.dataset.pose?.startsWith('walk')&&actor.querySelector('.hani-office-prop').textContent.trim());
      const preferred=eligible.filter(actor=>['💬','📱'].includes(actor.querySelector('.hani-office-prop').textContent.trim()));
      const pool=(preferred.length?preferred:eligible).sort((a,b)=>a.dataset.person.localeCompare(b.dataset.person));
      if(!pool.length)return;
      const day=new Date(Date.now()+32400000).toISOString().slice(0,10);
      let seed=0;for(const char of day+'|'+floor)seed=(seed*31+char.charCodeAt(0))>>>0;
      autoBubbleFloors.set(floor,Date.now());openBubble(pool[seed%pool.length],true);
    },450);
  }
  function cancelScheduledDuringMeeting(now=new Date()){
    if(!meeting||!building.scheduler)return;
    const day=new Date(now.getTime()+32400000).toISOString().slice(0,10),midnight=Date.parse(day+'T00:00:00+09:00');
    const presence=officePresence.read();
    for(const event of building.scheduler.plan(day,presence))if(midnight+event.start*1000<=now.getTime()&&midnight+event.end*1000>=meetingStartedAt)cancelled.add(event.id);
  }
  function actionRunning(actor){return meeting||!!actor.officeTravel||actor.dataset.walking==='true'||!!actor.dataset.event||actor.dataset.action&&actor.dataset.action!=='base-work'}
  function bubbleText(actor){
    if(bubbleSelection?.affinity)return actor.dataset.name+' · '+bubbleSelection.line;
    if(actor.dataset.resident)return actor.dataset.name+' · '+(bubbleSelection?.line||actor.dataset.line);
    if(bubbleSelection&&(bubbleSelection.drama||bubbleSelection.ownerEvent||!actionRunning(actor))){const speaker=actors.get(bubbleSelection.speaker);return (speaker?.dataset.name||actor.dataset.name)+' · '+actor.querySelector('.hani-office-status').dataset.full+' · '+bubbleSelection.line}
    return actor.dataset.name+' · '+statusNames[actor.dataset.status]+' · '+actor.querySelector('.hani-office-status').dataset.full;
  }
  function fitBubble(follow=false){
    const cached=actorBubble.officeFollow,personNow=actors.get(bubblePerson);
    if(follow){
      if(actorBubble.hidden||!cached||cached.person!==bubblePerson||!personNow?.officePosition)return;
      const [x,y]=personNow.officePosition,left=Math.max(4,Math.min(cached.width-cached.bw-4,cached.left+(x-cached.position[0])*cached.width/100)),top=Math.max(4,Math.min(cached.height-cached.bh-4,cached.top+(y-cached.position[1])*cached.height/100));
      if(actorBubble.style.left!==left+'px')actorBubble.style.left=left+'px';if(actorBubble.style.top!==top+'px')actorBubble.style.top=top+'px';return;
    }
    if(actorBubble.hidden)return;
    const person=actors.get(bubblePerson),floor=map.getBoundingClientRect?.();
    if(actorBubble.dataset.zoom==='true'&&floor?.height)actorBubble.style.setProperty('--bubble-max-height',Math.max(0,floor.height-8)+'px');
    const bubble=actorBubble.getBoundingClientRect?.(),actor=person?.getBoundingClientRect?building.motion.stableActorBox(person):null;
    if(!floor?.width||!bubble?.width||!actor)return;
    const left=Math.max(4,Math.min(floor.width-bubble.width-4,actor.left-floor.left+actor.width/2-bubble.width/2));
    const top=Math.max(4,Math.min(floor.height-bubble.height-4,actor.top-floor.top-bubble.height-6));
    actorBubble.officeFollow={person:bubblePerson,position:person.officePosition?.slice()||[0,0],left:actor.left-floor.left+actor.width/2-bubble.width/2,top:actor.top-floor.top-bubble.height-6,width:floor.width,height:floor.height,bw:bubble.width,bh:bubble.height};
    actorBubble.style.left=left+'px';actorBubble.style.top=top+'px';
  }
  function closeBubble(clearPending=true,explicit=false){
    if(explicit){
      lastBubbleTap=Date.now();autoBubbleEntry=false;
      // A viewer dismissal also consumes this automatic trio window. Otherwise
      // the next 100ms resident sample can immediately reopen the same bubble.
      const clock=building.residents.clock(new Date());root.officeTrioBeat=clock.day+'|'+Math.floor(clock.seconds/120);
    }
    clearBubbleTimer();affinityRow.hidden=true;affinityFloat.hidden=true;bubbleSerial++;bubblePerson=null;bubbleSelection=null;if(clearPending)pendingTap=null;actorBubble.hidden=true;for(const actor of actors.values())actor.dataset.speaking='false';fitStatusLabels();
    if(baristaAwake){baristaAwake=false;updateBarista()}
  }
  function updateBubbleSprite(actor,automatic){
    const sprite=actor.querySelector('.hani-office-sprite'),entry=spriteEntries.get(spriteId(actor));
    const ready=!automatic&&actor.dataset.avatar==='v2'&&entry&&sprite?.style.backgroundImage&&sprite.style.backgroundImage!=='none';
    bubbleSprite.hidden=!ready;actorBubble.dataset.zoom=String(!!ready);
    if(!ready)return;
    // Copy the loaded atlas and its current frame; never load or advance a sprite here.
    for(const property of ['backgroundImage','backgroundSize','backgroundPosition'])bubbleSprite.style[property]=sprite.style[property];
    bubbleSprite.style.setProperty('--bubble-sprite-ratio',String(entry.cell[0]/entry.cell[1]));
    bubbleSprite.dataset.pose=actor.dataset.pose;
  }
  function showBubble(actor,selection,duration=3000,automatic=false){showAffinity(actor.dataset.person,selection?.affinity||(!automatic?actor.officeAffinityTap:null));actor.officeAffinityTap=null;bubblePerson=actor.dataset.person;bubbleSelection=selection;updateBubbleSprite(actor,automatic);actorBubble.hidden=false;bubbleLine.textContent=bubbleText(actor);profileLink.href='#organization/people/'+bubblePerson;profileLink.hidden=!!actor.dataset.resident||actors.get(bubblePerson)?.dataset.visitor==='true';for(const a of actors.values())a.dataset.speaking=String(a===actor);if(actor.dataset.companion==='true'){fitBubble();fitStatusLabels()}else{fitStatusLabels();fitBubble()}const serial=++bubbleSerial;queueBubbleTimer(()=>{if(serial===bubbleSerial){bubbleTimer=null;const next=selection?.residentTrio?.lines[selection.trioIndex+1],speaker=next&&actors.get(next.id);if(speaker&&!speaker.hidden&&selection.residentTrio.key===building.residents.clock(new Date()).day+'|'+Math.floor(building.residents.clock(new Date()).seconds/900))showBubble(speaker,{speaker:next.id,line:next.line,resident:true,residentTrio:selection.residentTrio,trioIndex:selection.trioIndex+1},duration,automatic);else closeBubble(globalThis.innerWidth<=480)}},bubbleDuration(duration))}
  function openBubble(actor,automatic=false,event=null){
    if(!automatic){lastBubbleTap=Date.now();autoBubbleEntry=false;clearBubbleTimer()}
    if(actor.hidden)return;
    const result=automatic||actor.dataset.companion==='true'?null:affinity.tap(actor.dataset.person,event);
    if(result?.line){
      pendingTap=null;const person=residentSlots.find(p=>p.id===actor.dataset.person);
      if(!reduced){if(person?.pet)actor.officeReactions.reset();actor.officeReactions.request(person?.pet?'hop':'tap',Date.now(),true)}
      showBubble(actor,{speaker:actor.dataset.person,line:result.line,affinity:result,resident:!!person},3000,false);return;
    }
    actor.officeAffinityTap=result;
    if(actor.dataset.resident){
      const affection=actor.officeResidentState?.affection;
      if(affection){pendingTap=null;showBubble(actor,{speaker:actor.dataset.person,line:affection.line,resident:true},3000,automatic);return}
      if(!automatic&&actor.dataset.resident==='pet'&&actor.dataset.companion!=='true'){const now=new Date(),trio=building.residents.trio(now,residentSlots.map(p=>actors.get(p.id)).filter(a=>!a.hidden).map(a=>a.officeResidentState).filter(Boolean),floorSnapshot);if(trio){pendingTap=null;updateResidents(now);const first=trio.lines[0];showBubble(actors.get(first.id),{speaker:first.id,line:first.line,resident:true,residentTrio:trio,trioIndex:0});return}}
      const person=residentSlots.find(p=>p.id===actor.dataset.person),index=actor.officeResidentTap||0;actor.officeResidentTap=index+1;pendingTap=null;if(!reduced){if(person.pet&&!automatic)actor.officeReactions.reset();actor.officeReactions.request(person.pet?'hop':'tap',Date.now(),true)}showBubble(actor,{speaker:person.id,line:actor.officeResidentState?.scene?.line||person.lines[index%person.lines.length],resident:true},3000,automatic);return}
    if(!reduced)actor.officeReactions.request('tap',Date.now());
    pendingTap=null;const now=new Date(),floor=activeFloor,options={floor,chairmanPresent:officePresence.read().chairmanPresent},selection=tapLines.tap(actor.dataset.person,now,options);
    if(!automatic&&selection&&!selection.drama&&actionRunning(actor))pendingTap={actor,selection,floor:activeFloor};
    showBubble(actor,selection||null,automatic?4000:3000,automatic);
    const serial=bubbleSerial;
    void tapLines.load().then(()=>{
      // Replay taps in order even if the first view is still fetching the seed.
      if(floor!==activeFloor||actor.hidden||!sceneVisible()||building.tapLines.dramaDate(now)?.date!==building.tapLines.dramaDate(new Date())?.date)return;
      const loaded=selection?null:tapLines.tap(actor.dataset.person,now,{floor,chairmanPresent:officePresence.read().chairmanPresent});
      if(serial!==bubbleSerial||!loaded||actor.hidden||!sceneVisible())return;
      bubbleSelection=loaded;if(!automatic&&!loaded.drama&&actionRunning(actor))pendingTap={actor,selection:loaded,floor:activeFloor};
      bubbleLine.textContent=bubbleText(actor);fitBubble();
    });
  }
  function activateActor(event,dismissOnly=false){
    if(!eventPanel.hidden&&!eventPanel.contains(event.target)&&!eventButton.contains(event.target))closeEventPanel();
    if(eventPanel.contains(event.target)||eventButton.contains(event.target)){if(dismissOnly&&!actorBubble.hidden)closeBubble(true,true);return}
    const actor=event.target.closest?.('.hani-office-actor');
    if(actor&&actorLayer.contains(actor)){if(!dismissOnly)tapActor(actor,event);return}
    if(event.target.closest?.('.hani-office-barista')===baristaButton){if(!dismissOnly)openBaristaBubble(event);return}
    if(!dismissOnly||actorBubble.contains(event.target)||[...actors.values()].some(a=>a.officeRow.contains(event.target)))return;
    closeBubble(true,true);
  }
  actorLayer.addEventListener('click',activateActor);
  actorLayer.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activateActor(event)}else if(event.key==='Escape')closeBubble(true,true)});
  profileLink.addEventListener('click',event=>{if(typeof showView==='function'){event.preventDefault();showView('organization/people/'+bubblePerson)}});
  // The existing roster is also a touch-sized entry to the same bubble.
  for(const actor of actors.values()){actor.officeRow.setAttribute('role','button');actor.officeRow.tabIndex=0;actor.officeRow.addEventListener('click',event=>tapActor(actor,event));actor.officeRow.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();tapActor(actor,event)}})}
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
  // Measured purple inner canvas in art-map 1F floor-1f-217.webp (1672 x 941).
  const queenFrame=document.createElement('button');queenFrame.type='button';queenFrame.className='hani-office-queen-frame';queenFrame.hidden=true;
  const queenImage=document.createElement('img'),queenCaption=document.createElement('span');
  queenImage.alt='';queenImage.draggable=false;queenCaption.className='hani-office-queen-caption';queenCaption.setAttribute('aria-hidden','true');queenFrame.append(queenImage,queenCaption);
  queenFrame.style.left=(1171/(building.art?.width||1672)*100)+'%';queenFrame.style.top=(73/(building.art?.height||941)*100)+'%';queenFrame.style.width=(176/(building.art?.width||1672)*100)+'%';queenFrame.style.height=(107/(building.art?.height||941)*100)+'%';
  map.append(queenFrame);
  function updateQueenFrame(now=Date.now()){
    const award=activeFloor==='1f'&&map.dataset.art==='floor'?window.HaniBoard?.queenWinner?.(now):null;
    const image=award&&window.HaniBoard?.queenImages?.[award.month];
    const hidden=!image;if(queenFrame.hidden!==hidden)queenFrame.hidden=hidden;if(hidden)return;
    const caption='👑 '+Number(award.month.slice(5))+'월의 퀸',title=caption+' · '+award.name;
    if(queenFrame.dataset.month!==award.month){queenFrame.dataset.month=award.month;queenImage.src=image;queenCaption.textContent=caption}
    if(queenFrame.title!==title){queenFrame.title=title;queenFrame.setAttribute('aria-label',title)}
  }
  queenFrame.onclick=()=>{
    updateQueenFrame();if(queenFrame.hidden)return;
    closeBubble();lastBubbleTap=Date.now();autoBubbleEntry=false;
    bubbleSprite.hidden=true;actorBubble.dataset.zoom='false';actorBubble.officeFollow=null;
    bubbleLine.textContent=queenFrame.title;profileLink.hidden=true;actorBubble.style.left='4px';actorBubble.style.top='4px';actorBubble.hidden=false;
    const serial=++bubbleSerial;queueBubbleTimer(()=>{if(serial===bubbleSerial){bubbleTimer=null;closeBubble()}},bubbleDuration());
  };
  queenFrame.onkeydown=event=>{if(event.key==='Escape')closeBubble()};
  // Visible barista pixels only: (1536,650)..(1581,706) in floor-1f-217.webp.
  // Below staff/visitor sprites; no enlarged invisible touch area over the counter.
  const baristaButton=document.createElement('button');baristaButton.type='button';baristaButton.id='haniOfficeBarista';baristaButton.className='hani-office-barista';baristaButton.hidden=true;baristaButton.onclick=activateActor;baristaButton.onkeydown=event=>{if(event.key==='Escape')closeBubble()};baristaButton.setAttribute('aria-label','바리스타 이슬 · 카페 운영 중');
  baristaButton.style.left=(1536/(building.art?.width||1672)*100)+'%';baristaButton.style.top=(650/(building.art?.height||941)*100)+'%';baristaButton.style.width=(45/(building.art?.width||1672)*100)+'%';baristaButton.style.height=(56/(building.art?.height||941)*100)+'%';map.append(baristaButton);
  const baristaLines=['회장님, 오늘도 늘 드시던 걸로요?','원두는 오늘 아침에 새로 볶았어요.','라떼 아트는 하트가 제일 자신 있어요.','직원분들 주문 순서, 다 외웠답니다.','크림이가 또 쿠키 냄새 맡고 왔네요.','치즈는 창가 자리 단골손님이에요.','바쁜 날엔 샷 하나 추가해 드릴게요.','디카페인도 맛있게 내려 드려요.'];
  const baristaNightLines=['야근이세요? 따뜻한 걸로 드릴게요.','보리가 문 앞에서 지켜 줘서 든든해요.','조용한 밤엔 원두 향이 더 잘 느껴져요.','급하지 않아요. 잠깐 쉬었다 가세요.','디카페인도 따뜻하게 준비해 둘게요.','창밖 달빛이 오늘은 참 포근하네요.','늦은 시간까지 수고 많으셨어요.','아침까지 카페는 제가 지킬게요.'];
  let baristaTap=0,baristaNightTap=0,baristaAwake=false;
  function baristaClock(now=new Date()){const hour=koreaTime(now).getUTCHours();return {night:hour>=19||hour<7,dozing:hour>=2&&hour<7}}
  function updateBarista(now=new Date()){
    const clock=baristaClock(now),hidden=activeFloor!=='1f'||map.dataset.art!=='floor';baristaButton.hidden=hidden;
    const label=clock.night?'은하 · 야간 카페':'바리스타 이슬 · 카페 운영 중';if(baristaButton.getAttribute('aria-label')!==label)baristaButton.setAttribute('aria-label',label);
    baristaNight.hidden=hidden||!clock.night;
    const frame=clock.dozing?(baristaAwake?3:2):1;if(baristaNight.dataset.frame!==String(frame)){baristaNight.dataset.frame=String(frame);baristaNight.style.backgroundPosition=((frame-1)*50)+'% 0'}
  }
  function openBaristaBubble(event){
    updateBarista();if(baristaButton.hidden||!sceneVisible()||document.getElementById('app')?.classList.contains('login-locked'))return;
    const clock=baristaClock(),waking=clock.dozing&&!baristaAwake;
    closeBubble();lastBubbleTap=Date.now();autoBubbleEntry=false;
    baristaAwake=clock.dozing;updateBarista();
    bubbleSprite.hidden=true;actorBubble.dataset.zoom='false';actorBubble.officeFollow=null;
    bubbleLine.textContent=clock.night?'은하 · 야간 카페 · '+(waking?'앗, 회장님! 졸지 않았어요… 커피 드릴게요.':baristaNightLines[baristaNightTap++%baristaNightLines.length]):'바리스타 이슬 · '+(matchMedia('(max-width:600px)').matches?'카페운영':'카페 운영 중')+' · '+baristaLines[baristaTap++%baristaLines.length];
    const id=clock.night?'eunha':'iseul',result=affinity.tap(id,event);
    showAffinity(id,result);if(result?.line)bubbleLine.textContent=(clock.night?'은하 · 야간 카페':'바리스타 이슬 · 카페 운영 중')+' · '+result.line;
    profileLink.hidden=true;actorBubble.style.left='4px';actorBubble.style.top='4px';actorBubble.hidden=false;
    const serial=++bubbleSerial,duration=bubbleDuration();queueBubbleTimer(()=>{
      if(serial!==bubbleSerial)return;
      bubbleTimer=null;
      if(baristaAwake){baristaAwake=false;updateBarista();if(duration>3000){queueBubbleTimer(()=>{if(serial===bubbleSerial){bubbleTimer=null;closeBubble()}},duration-3000);return}}
      closeBubble();
    },baristaAwake?3000:duration);
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
  // Annual KST windows are read-only; the exclusive end includes Dec 26 23:59.
  // Future events add a row/atlas using the five shared CSS atlas rectangle presets.
  const officeEventCalendar=Object.freeze([
    Object.freeze({id:'christmas',atlas:'./assets/office-season/xmas.webp',startKst:'12-01T00:00',endKstExclusive:'12-27T00:00',decorations:Object.freeze([
      ['xmas-tree','event-tall','1f',493,435,112,136,'bottom-center',false],
      ['xmas-snow','event-window','1f',1580,230,160,204,'center',false],
      ['xmas-wreath','event-wall','1f',832,196,76,76,'center',false],
      ['xmas-gifts','event-floor','1f',520,443,48,36,'bottom-center',false],
      ['xmas-lights','event-wide','5f',1344,565,384,64,'bottom-center',true]
    ].map(Object.freeze))})
  ]);
  // Opaque 120x110 patch in the same art coordinates; below props and actors.
  const baristaNight=document.createElement('span');baristaNight.className='hani-office-barista-night';baristaNight.setAttribute('aria-hidden','true');baristaNight.hidden=true;
  baristaNight.style.left=(1500/(building.art?.width||1672)*100)+'%';baristaNight.style.top=(610/(building.art?.height||941)*100)+'%';baristaNight.style.width=(120/(building.art?.width||1672)*100)+'%';baristaNight.style.height=(110/(building.art?.height||941)*100)+'%';map.append(baristaNight);
  // Approved four-frame art: one map-owned layer and persistent prop/event slots.
  const livePropLayer=document.createElement('div');livePropLayer.className='hani-office-live-props';livePropLayer.setAttribute('aria-hidden','true');livePropLayer.hidden=true;map.append(livePropLayer);
  const liveProps=[
    ['coffee-desk','coffee-steam','1f',238,570,32,48,'bottom-center'],
    ['coffee-counter','coffee-steam','1f',1530,720,32,48,'bottom-center'],
    ['plant','plant-sway','2f',1197,314,48,64,'bottom-center'],
    ['monitor','monitor-glow','3f',466,480,64,40,'center'],
    ['lantern','lantern-flicker','5f',1380,738,40,56,'bottom-center'],
    ['stamp','stamp-sparkle','3f',213,676,32,32,'center'],
    ['paper','paper-flutter','1f',1605,520,40,48,'center'],
    ...officeEventCalendar.flatMap(event=>event.decorations.map(decoration=>[...decoration,event]))
  ].map(([id,art,floor,x,y,width,height,anchor,nightOnly=false,event=null])=>{
    const prop=document.createElement('span');prop.className='hani-office-live-prop';prop.dataset.prop=id;prop.dataset.sprite=art;prop.dataset.anchor=anchor;prop.hidden=true;
    if(event){prop.dataset.event=event.id;prop.style.backgroundImage='url("'+event.atlas+'")'}
    prop.style.left=x/(building.art?.width||1672)*100+'%';prop.style.top=y/(building.art?.height||941)*100+'%';prop.style.width=width/(building.art?.width||1672)*100+'%';prop.style.height=height/(building.art?.height||941)*100+'%';
    livePropLayer.append(prop);return {prop,floor,nightOnly:nightOnly||id==='lantern',event};
  });
  function updateLiveProps(floor,background,isFloor,now=new Date()){
    const date=koreaTime(now).toISOString().slice(5,16);
    const activeEvents=new Set(officeEventCalendar.filter(event=>event.startKst<event.endKstExclusive
      ?date>=event.startKst&&date<event.endKstExclusive:date>=event.startKst||date<event.endKstExclusive));
    livePropLayer.hidden=!isFloor;
    for(const entry of liveProps)entry.prop.hidden=!isFloor||entry.floor!==floor.id||(entry.nightOnly&&background!==floor.nightBackground)||(!!entry.event&&!activeEvents.has(entry.event));
  }
  let activeFloor="4f",floorSnapshot=null,layoutKey="",backgroundToken=0,returnFloor="4f",displayedFloor=null;
  floorLabel.className="hani-building-floor-label";overflowChip.className="hani-building-overflow";const caption=document.createElement('div');caption.className='hani-building-floor-caption';const presenceNote=document.createElement('small');presenceNote.className='hani-building-presence-note';presenceNote.setAttribute('role','status');presenceNote.hidden=true;caption.append(floorLabel,overflowChip,presenceNote);root.querySelector('.hani-office-scroll').after(caption);
  const dramaCaption=document.createElement('small'),dramaTitle=document.createElement('b'),dramaSummary=document.createElement('span');dramaCaption.className='hani-building-drama-caption';dramaCaption.hidden=true;dramaCaption.append(dramaTitle,dramaSummary);caption.append(dramaCaption);let tapCatalogStarted=false;
  // View-only snack overlay. The table is the sole copy-edit point (up to 3 lines per staff id).
  const snackLines={
    hani:["회장님, 간식은 이번 Scope 안이네요♡","회장님, 당 충전 끝! 전략부터 잡을게요.","회장님 간식이라니, 헤헤 힘이 나네요♡"],
    gaeun:["회장님, 간식 타임도 일정에 넣어둘게요.","회장님 감사해요, 회의 준비도 마쳤어요.","회장님 덕분에 다음 일정도 든든하겠어요."],
    yuna:["회장님! 간식 접수는 제가 먼저 할게요!","감사합니다 회장님, 기운 내서 안내할게요!","회장님, 이 간식은 제 자리로 분류할게요!"],
    mir:["회장님, 간식 주시는 거예요? 헤헤.","회장님, 다들 좋아하네. 헤헤, 고마워요.","왜 기분이 좋지? 조금 더 볼게, 회장님."],
    seoyun:["회장님, 먼저 간식 범위부터 살펴볼게요.","회장님, 정리하면 맛있고 든든하네요 💜","회장님 덕분에 설계가 한결 잘 풀리네요."],
    dohyun:["회장님, 당 충전 완료. 테스트 통과요.","회장님, 간식 수령 완료. 구현 갑니다.","회장님, 간식 재현 완료. 바로 통과요 ☕"],
    serin:["회장님!! 간식 보급도 자동화 각인데요?!","회장님! 집중력 오르는 패턴이 보여요!!","회장님 감사해요!! 리서치 속도 올라가요!"],
    yuri:["회장님, 간식 품질 확인. 깔끔합니다.","회장님, 직접 먹어보니 PASS입니다.","회장님, 감사히 먹되 검수는 공정합니다."],
    arin:["회장님, 간식 색감까지 너무 예쁜데요? ✨","회장님, 잠깐 숨 쉬게 간식 타임 어때요?","회장님 고마워요, 마음까지 말랑해지네요!"],
    jieun:["회장님, 예산 밖이지만 이번만 승인할게요.","회장님, 사기 진작 예산으로 처리할게요.","회장님, 계획소비 맞죠? 감사히 먹을게요."],
    haru:["회장님, 오늘 간식 큐레이션 아주 좋네요.","회장님, 다들 좋아할 맛이에요. 고마워요.","회장님, 후회 없는 픽이네요. 고마워요."],
    daon:["회장님… 혹시 제 몫까지 주시는 건가요?","회장님 감사합니다… 아껴서 먹을게요.","회장님, 간식은 하방 위험이 전혀 없네요…"],
    naeun:["회장님, 칼로리는 제가 살짝 확인했어요!","회장님도 드셨어요? 같이 맛있게 먹어요!","회장님 고마워요! 기분 좋게 충전할게요."],
    hina:["회장님! 오늘 간식 센스 백점이에용♡","회장님 고마워용♡ 먹고 열심히 검수할게요!","와아 간식이다! 회장님 최고예용, 헤헤♡"],
    minji:["회장님, 간식 주시는 장면 바로 찍었어요!","컷! 회장님 미담 장면 하나 기록했어요.","회장님, 오늘 간식 연출 아주 완벽해요!"],
    sooyeon:["회장님! 간식 보급이라니 낭만상 가능해요!","회장님, 에너지 충전 끝! 힘내서 뛸게요!","회장님, 현장 보급 최고! 잘 먹을게요!"],
    yoonseul:["회장님, 이거 아세요? 책이랑 딱 맞아요!","회장님, 간식과 책이 여기서 이어지네요!","회장님 감사해요! 책갈피 꽂고 먹을게요."],
    sua:["회장님, 간식 기한 내 빈틈없이 먹을게요!","회장님이 챙겨주시다니, 헤헤ㅎㅎ 고마워요!","회장님, 잘 먹고 오후 제안서도 끝낼게요!"],
    taeo:["회장님, 정리하면 세 가지로 완벽합니다.","회장님, 간식 지원 건은 즉시 수용합니다.","회장님, 감사히 먹고 후속 실행 갈게요."]
  };
  // One event/staff table; birthday pairs are [own thanks, colleague congratulations].
  const eventLines={snack:snackLines,
    coffee:{
      hani:["회장님 커피라니, 오후 전략도 문제없어요♡","회장님, 커피로 팀 정렬 완료예요♡","회장님 센스 최고! 헤헤, 잘 마실게요♡"],
      gaeun:["회장님, 커피 타임도 일정에 반영해둘게요.","회장님 감사해요, 브리핑 준비도 마쳤어요.","회장님 덕분에 회의실 공기가 향긋해졌어요."],
      yuna:["회장님! 커피 배부는 제가 먼저 안내할게요!","감사합니다 회장님, 자리마다 잘 전달할게요!","회장님 커피 덕분에 안내 목소리가 밝아져요!"],
      mir:["회장님, 커피 향이 좋네. 헤헤, 고마워요.","왜 다들 웃지? 커피랑 연결되네, 회장님.","회장님, 따뜻한 잔이네. 조금 더 볼게."],
      seoyun:["회장님, 먼저 커피부터 마시고 설계 볼게요.","회장님, 정리하면 향도 좋고 든든해요 💜","회장님 커피 덕분에 구조가 깔끔히 잡혀요."],
      dohyun:["회장님, 커피 수령 완료. 빌드 통과요 ☕","회장님, 커피 패치 적용. 버그 0건요.","회장님, 커피 충전 완료. 바로 구현해요."],
      serin:["회장님!! 커피 보급도 자동화 각인데요?!","회장님! 커피 마시니 분석 패턴 보여요!!","회장님 감사해요!! 데이터 정리가 빨라져요!"],
      yuri:["회장님, 커피 온도·향 검수 깔끔합니다.","회장님, 직접 마셔보니 커피 PASS입니다.","회장님 감사해요. 오후 검증도 빈틈없습니다."],
      arin:["회장님, 커피잔 색감까지 너무 예쁜데요? ✨","회장님, 커피로 잠깐 숨 쉬는 건 어때요?","회장님 고마워요, 오후 여백이 따뜻해지네요!"],
      jieun:["회장님, 오늘 커피 건은 즉시 결재할게요.","회장님 덕분에 오후 집중도 지표가 올라가요.","회장님 감사해요, 마감 검토도 여유롭겠어요."],
      haru:["회장님, 오늘 원두 큐레이션 아주 좋네요.","회장님, 호불호 없는 깔끔한 픽이네요!","회장님, 다들 만족할 커피예요. 고마워요."],
      daon:["회장님… 혹시 제 커피도 챙겨주신 건가요?","회장님 감사합니다… 천천히 아껴 마실게요.","회장님, 이 커피는 졸음 위험이 없네요…"],
      naeun:["회장님, 기분 좋은 오후 루틴이 되겠어요!","회장님도 한 잔 드셨죠? 같이 잠깐 쉬어요!","회장님 고마워요! 산뜻한 리듬으로 갈게요."],
      hina:["회장님! 오늘 커피 센스도 백점이에용♡","회장님 고마워용♡ 마시고 꼼꼼히 볼게요!","와아 커피다! 회장님 최고예용, 헤헤♡"],
      minji:["회장님, 커피 돌리시는 훈훈한 컷 찍었어요!","회장님, 오후 카페 분위기 연출 완벽해요!","컷! 회장님 커피 미담도 한 장면 남겼어요."],
      sooyeon:["회장님! 커피 타임이라니 낭만상 최고예요!","회장님, 커피 보급 완료! 후반전도 뛸게요!","회장님 덕분에 여행지 카페 온 기분이에요!"],
      yoonseul:["회장님, 이거 아세요? 커피가 딱 맞아요!","회장님, 커피와 책이 여기서 이어지네요!","회장님 감사해요! 마시며 책장 넘길게요."],
      sua:["회장님, 식기 전에 빈틈없이 잘 마실게요!","회장님 커피라니, 헤헤ㅎㅎ 힘나네요!","회장님, 잘 마시고 오후 제안도 끝낼게요!"],
      taeo:["회장님, 정리하면 향·온도 모두 완벽합니다.","회장님, 커피 지원은 즉시 반영하겠습니다.","회장님, 잘 마시고 후속 미팅 정리할게요."]
    },
    applause:{
      hani:["회장님 칭찬이라니, 헤헤 더 힘이 나네요♡","회장님, 우리 팀 호흡이 딱 맞아떨어졌어요♡","회장님 박수 덕분에 다음 전략도 든든해요♡"],
      gaeun:["회장님 칭찬 말씀도 회의록에 남겨둘게요.","회장님 감사해요, 후속 일정도 잘 챙길게요.","회장님 격려 덕분에 준비한 보람이 있어요."],
      yuna:["회장님! 칭찬 접수도 제가 일등으로 할게요!","회장님 박수 소리, 온 층에 안내할래요!","감사합니다 회장님! 더 밝게 연결해볼게요!"],
      mir:["회장님, 박수 쳐주시는 거예요? 헤헤.","회장님, 칭찬은 기분 좋네. 이건 연결되네.","왜 따뜻하지? 조금 더 볼게, 회장님."],
      seoyun:["회장님, 정리하면 함께 만든 결과예요 💜","회장님 칭찬 덕분에 다음 설계도 든든해요.","회장님, 먼저 팀원들 공부터 챙겨볼게요."],
      dohyun:["회장님, 칭찬 수신 완료. 다음 구현 가요.","회장님, 이번 릴리스도 깔끔히 통과요 ☕","회장님, 결과로 답할게요. 통과요."],
      serin:["회장님!! 사기 오르는 패턴이 보여요!!","회장님 박수에 자동화 영감이 솟아요!!","회장님 감사해요!! 이 기세로 더 파볼게요!"],
      yuri:["회장님, 근거 있는 칭찬 PASS입니다.","회장님, 다음 검수도 깔끔히 보겠습니다.","회장님, 칭찬은 기쁘되 기준은 유지합니다."],
      arin:["회장님, 칭찬 결이 너무 예쁜데요? ✨","회장님 고마워요, 디테일 챙긴 보람 있네요!","회장님, 기분 좋게 화면도 더 다듬을게요!"],
      jieun:["회장님, 오늘 성과는 만장일치 승인이네요.","회장님 덕분에 팀 사기 지표가 든든해요.","회장님 감사해요, 다음 마감도 잘 챙길게요."],
      haru:["회장님, 칭찬 타이밍도 베스트 픽이네요.","회장님 박수 덕분에 팀 만족도가 최고예요.","회장님, 더 좋은 큐레이션으로 답할게요."],
      daon:["회장님… 혹시 저도 칭찬에 포함인가요?","회장님 감사합니다… 더 꼼꼼히 살펴볼게요.","회장님 격려라면… 실수 확률도 줄어들겠어요."],
      naeun:["회장님 박수 소리에 어깨가 절로 펴지네요!","회장님 고마워요! 좋은 루틴으로 이어갈게요.","회장님 덕분에 오늘 리듬이 참 경쾌해요!"],
      hina:["회장님 칭찬이라니! 기분 백점 만점이에용♡","헤헤♡ 회장님 박수 받고 더 꼼꼼히 볼게용!","와아 신난다! 회장님 칭찬 최고예용, 헤헤♡"],
      minji:["회장님, 박수 치시는 명장면 바로 남겼어요!","컷! 오늘 하이라이트는 회장님 칭찬이에요.","회장님 덕분에 멋진 에피소드가 늘었어요!"],
      sooyeon:["회장님 박수, 경기장 함성보다 짜릿해요!","회장님! 칭찬 받고 낭만 있게 달려볼게요!","회장님 감사해요! 좋은 페이스로 뛸게요!"],
      yoonseul:["회장님, 이거 아세요? 칭찬은 큰 힘이에요!","회장님, 노력과 칭찬이 여기서 이어지네요!","회장님 감사해요! 기쁘게 다음 장 펼칠게요."],
      sua:["회장님 칭찬에 헤헤ㅎㅎ 더 빈틈없이 할게요!","회장님, 후속 실행까지 깔끔히 마무리할게요!","회장님 덕분에 다음 제안도 자신 있어요!"],
      taeo:["회장님, 정리하면 팀워크의 결과입니다.","회장님, 격려 말씀은 실행으로 잇겠습니다.","회장님, 긍정 피드백 확인. 후속 진행해요."]
    },
    cheer:{
      hani:["회장님도 오늘 하루 화이팅이에요, 헤헤♡","네 회장님! 오늘 우선순위도 힘차게 갈게요♡","회장님 응원 받고 전 부서 화이팅할게요♡"],
      gaeun:["회장님 화이팅이에요, 오늘 일정 시작할게요.","네 회장님, 오늘 요청도 잘 정리할게요.","회장님 응원 덕분에 오늘 브리핑도 힘나네요."],
      yuna:["회장님도 오늘 하루 활기차게 화이팅이에요!","네 회장님! 작은 요청도 씩씩하게 챙길게요!","회장님 화이팅! 오늘 안내도 기운 넘쳐요!"],
      mir:["회장님, 화이팅! 헤헤, 기운이 연결되네.","왜 힘이 나지? 회장님도 오늘 화이팅이에요.","회장님 응원 좋네. 조금 더 볼게, 헤헤."],
      seoyun:["회장님 화이팅! 먼저 범위부터 살펴볼게요.","회장님, 정리하면 오늘도 힘차게 갑니다 💜","회장님 응원 덕분에 오늘 설계도 든든해요."],
      dohyun:["회장님, 화이팅 수신. 오늘 코드도 통과요.","회장님도 화이팅요. 바로 구현 들어갑니다 ☕","회장님, 오늘 목표 재현 완료. 화이팅요."],
      serin:["회장님 화이팅!! 오늘도 자동화 각이에요!","회장님 응원 덕에 좋은 패턴이 딱 보여요!!","네 회장님!! 신나게 리서치 달려볼게요!!"],
      yuri:["회장님도 화이팅입니다. 검수 시작합니다.","회장님, 응원 확인. 오늘도 깔끔합니다.","회장님, 미검증 없는 하루로 만들겠습니다."],
      arin:["회장님 화이팅! 오늘도 예쁘게 채워봐요 ✨","회장님 응원 덕분에 마음까지 산뜻해지네요!","회장님, 잠깐 숨 쉬며 기분 좋게 가봐요!"],
      jieun:["회장님 화이팅! 오늘 숫자도 든든히 볼게요.","회장님, 오늘 흐름도 안정적으로 챙길게요.","회장님 응원 덕분에 내일의 여유가 보이네요."],
      haru:["회장님 화이팅! 오늘도 좋은 선택 해봐요.","회장님, 오늘 하루도 후회 없이 채울게요.","회장님 응원 픽 최고네요, 힘내서 갈게요!"],
      daon:["회장님도… 오늘 하루 화이팅이에요…!","네 회장님… 오늘도 시나리오 꼼꼼히 볼게요.","회장님 응원 덕분에… 걱정이 한결 줄었어요."],
      naeun:["회장님 화이팅! 오늘 루틴도 힘차게 가요!","회장님! 기분 좋은 페이스로 시작해볼게요.","회장님 응원 들으니 에너지가 반짝 나요!"],
      hina:["회장님도 오늘 하루 힘차게 화이팅이에용♡","네 회장님! 오늘도 백점짜리 하루 만들게용♡","와아 화이팅! 회장님 응원 최고예용, 헤헤♡"],
      minji:["회장님 화이팅! 오늘 첫 장면도 활기차네요!","액션! 회장님 응원부터 멋지게 기록할게요.","회장님 화이팅! 기억할 한 장면 만들게요!"],
      sooyeon:["회장님 화이팅! 오늘도 낭만 있게 달려요!","네 회장님! 출발 신호처럼 힘차게 뛸게요!","회장님 응원 덕에 오늘 에너지가 넘쳐요!"],
      yoonseul:["회장님, 아세요? 응원 한마디에 힘나요!","회장님도 화이팅! 배움이 여기서 이어지네요!","네 회장님! 오늘도 즐겁게 책장 펼칠게요!"],
      sua:["회장님 화이팅! 오늘도 빈틈없이 챙길게요!","회장님 응원에 헤헤ㅎㅎ 힘내서 제안할게요!","회장님! 후속 실행까지 씩씩하게 끝낼게요!"],
      taeo:["회장님, 정리하면 오늘도 준비 끝났습니다.","회장님도 화이팅입니다. 바로 실행할게요.","회장님, 응원은 결과로 번역하겠습니다."]
    },
    birthday:{
      hani:["회장님, 생일 축하 고마워요! 헤헤♡","하니 전무님, 생일 진심으로 축하해요!"],
      gaeun:["회장님, 생일 축하도 일정에 담아둘게요.","가은 비서님, 생일 축하해요! 늘 든든해요!"],
      yuna:["회장님! 생일 축하 접수는 제가 일등이에요!","유나 사원님, 생일 축하해요! 오늘 주인공!"],
      mir:["회장님, 내 생일이에요? 헤헤, 고마워요.","미르님, 생일 축하해요! 오늘도 반가워요!"],
      seoyun:["회장님, 정리하면 가장 행복한 생일이에요 💜","서윤 리드님, 생일 축하해요! 늘 고마워요!"],
      dohyun:["회장님, 생일 축하 수령 완료. 고마워요 ☕","도연 선임님, 생일 축하해요! 오늘도 최고!"],
      serin:["회장님!! 생일 행복도 상승 패턴 보여요!!","세린 연구원님, 생일 신나게 축하해요!!"],
      yuri:["회장님, 생일 기분 검수 PASS입니다.","유리 책임님, 생일 깔끔하게 축하드립니다!"],
      arin:["회장님, 생일 분위기 너무 예쁜데요? ✨","아린 선임님, 반짝이는 생일 축하해요!"],
      jieun:["회장님, 생일 축하 건 기쁘게 승인해요.","지은 부장님, 생일 축하해요! 늘 든든해요!"],
      haru:["회장님, 오늘 축하 센스도 최고의 픽이네요.","하루 대리님, 기분 좋은 생일 축하해요!"],
      daon:["회장님… 제 생일까지 챙겨주셔서 감사해요…","다온 사원님, 따뜻한 생일 축하해요!"],
      naeun:["회장님 고마워요! 행복한 생일 루틴이에요!","나은 차장님, 활기찬 생일 축하해요!"],
      hina:["회장님 고마워용♡ 오늘 생일 백점이에용♡","히나 과장님, 사랑스러운 생일 축하해용!"],
      minji:["회장님, 제 생일 명장면 바로 남겼어요!","민지 대리님, 영화 같은 생일 축하해요!"],
      sooyeon:["회장님! 생일 축하까지 낭만상 최고예요!","수연 주임님, 에너지 넘치는 생일 축하해요!"],
      yoonseul:["회장님, 아세요? 생일과 기쁨이 이어져요!","윤슬 사원님, 책향기 가득한 생일 축하해요!"],
      sua:["회장님 축하라니, 헤헤ㅎㅎ 오늘 참 기뻐요!","수아 과장님, 빈틈없이 행복한 생일 되세요!"],
      taeo:["회장님, 정리하면 뜻깊고 감사한 생일입니다.","채원 매니저님, 뜻깊은 생일 축하드립니다!"]
    }
  };
  const ownerEvents={
    snack:{label:'🍪 간식 돌리기',icon:'🍪',status:'간식 먹는 중'},
    coffee:{label:'☕ 커피 쏘기',icon:'☕',status:'커피 마시는 중'},
    applause:{label:'👏 칭찬 박수',icon:'👏',status:'칭찬 받는 중'},
    cheer:{label:'📣 깜짝 응원',icon:'📣',status:'화이팅 외치는 중'},
    birthday:{label:'🎂 생일 축하',icon:'🎂',status:'생일 축하 중'}
  };
  const staffBirthdays={hani:'01-17',gaeun:'09-25',yuna:'02-20',mir:'05-14',seoyun:'03-12',dohyun:'06-18',serin:'07-23',yuri:'09-11',arin:'04-24',jieun:'04-09',haru:'05-29',daon:'11-21',naeun:'07-08',hina:'08-21',minji:'10-08',sooyeon:'11-06',yoonseul:'03-26',sua:'12-12',taeo:'02-06'};
  const eventButton=document.createElement('button');eventButton.id='haniOfficeEvents';eventButton.type='button';eventButton.className='btn hani-office-events';eventButton.textContent='🎉 회장님 이벤트';eventButton.hidden=true;eventButton.setAttribute('aria-expanded','false');eventButton.setAttribute('aria-controls','haniOfficeEventPanel');caption.append(eventButton);
  const eventPanel=document.createElement('div');eventPanel.id='haniOfficeEventPanel';eventPanel.className='hani-office-event-panel';eventPanel.hidden=true;eventPanel.setAttribute('role','group');eventPanel.setAttribute('aria-label','회장님 이벤트');caption.append(eventPanel);
  const eventButtons=new Map();
  for(const [id,event]of Object.entries(ownerEvents)){const button=document.createElement('button');button.id=id==='snack'?'haniOfficeSnack':'haniOfficeEvent-'+id;button.type='button';button.className='btn hani-office-snack';button.dataset.ownerEvent=id;button.textContent=event.label;eventPanel.append(button);eventButtons.set(id,button);button.addEventListener('click',()=>runOwnerEvent(id))}
  const eventCooldowns=new Map();let eventPeople=new Set(),eventFloor=null,eventUntil=0,eventEndTimer=null,eventCooldownTimer=null,activeEvent=null,eventBirthday=null,birthdayDay='',birthdayPresent=new Set();
  function closeEventPanel(){eventPanel.hidden=true;eventButton.setAttribute('aria-expanded','false')}
  function birthdayPerson(){
    const day=new Date(Date.now()+32400000).toISOString().slice(0,10),id=Object.keys(staffBirthdays).find(id=>staffBirthdays[id]===day.slice(5));
    if(!id)return null;
    // Daytime presence also covers a colleague temporarily away or already home at night.
    const presence=officePresence.read(),key=day+'|'+JSON.stringify(presence.presentIds||null);
    if(birthdayDay!==key){birthdayDay=key;birthdayPresent=new Set(building.snapshot(new Date(day+'T12:00:00+09:00'),presence).floors.flatMap(f=>f.people.map(p=>p.id)))}
    return actors.get(id)?.hidden===false||birthdayPresent.has(id)?id:null;
  }
  function syncEventButtons(){
    eventButton.hidden=!document.getElementById('app')||document.getElementById('app').classList.contains('login-locked');
    if(eventButton.hidden)closeEventPanel();
    for(const [id,button]of eventButtons){button.hidden=eventButton.hidden||id==='birthday'&&!birthdayPerson();button.disabled=(eventCooldowns.get(activeFloor+'|'+id)||0)>Date.now();const text=ownerEvents[id].label+(button.disabled?' (10분 뒤)':'');if(button.textContent!==text)button.textContent=text}
  }
  function eventStationary(actor){return !actor.hidden&&!actor.dataset.resident&&actor.dataset.visitor!=='true'&&Object.hasOwn(eventLines.snack,actor.dataset.person)&&!actor.officeTravel&&actor.dataset.walking!=='true'&&!actor.dataset.pose?.startsWith('walk')&&!['GOING','RETURNING'].includes(actor.dataset.behavior)}
  function eventApplies(actor){return eventFloor===activeFloor&&Date.now()<eventUntil&&eventPeople.has(actor.dataset.person)&&eventStationary(actor)}
  function clearEventReaction(){if(eventEndTimer!==null)clearTimeout(eventEndTimer);eventEndTimer=null;eventFloor=null;eventUntil=0;activeEvent=null;eventBirthday=null;eventPeople=new Set()}
  function armEventCooldown(){
    if(eventCooldownTimer!==null)clearTimeout(eventCooldownTimer);eventCooldownTimer=null;
    const floor=activeFloor,now=Date.now(),ends=[...eventButtons.keys()].map(id=>eventCooldowns.get(floor+'|'+id)||0).filter(end=>end>now);
    if(ends.length)eventCooldownTimer=setTimeout(()=>{eventCooldownTimer=null;if(activeFloor===floor){syncEventButtons();armEventCooldown()}},Math.min(...ends)-now);
  }
  eventButton.addEventListener('click',()=>{syncEventButtons();if(eventButton.hidden||!sceneVisible())return;eventPanel.hidden=!eventPanel.hidden;eventButton.setAttribute('aria-expanded',String(!eventPanel.hidden))});
  eventPanel.addEventListener('keydown',event=>{if(event.key==='Escape'){closeEventPanel();eventButton.focus()}});
  function runOwnerEvent(id){
    syncEventButtons();const button=eventButtons.get(id);if(button.hidden||button.disabled||!sceneVisible())return;
    closeEventPanel();updateBuilding(true,false);
    const eligible=[...actors.values()].filter(eventStationary).sort((a,b)=>a.dataset.person.localeCompare(b.dataset.person));
    const now=Date.now(),floor=activeFloor,end=now+8000,birthday=id==='birthday'?birthdayPerson():null;clearEventReaction();
    activeEvent=id;eventBirthday=birthday;eventFloor=floor;eventUntil=end;for(const actor of eligible)eventPeople.add(actor.dataset.person);
    eventCooldowns.set(floor+'|'+id,now+600000);syncEventButtons();armEventCooldown();autoBubbleEntry=false;
    eventEndTimer=setTimeout(()=>{if(eventFloor!==floor||eventUntil!==end||activeEvent!==id)return;eventEndTimer=null;clearEventReaction();updateBuilding(true,false)},8000);
    updateBuilding(true,false);
    // Use the existing single bubble. A pending/recent viewer choice keeps priority.
    if(eligible.length&&!pendingTap&&(actorBubble.hidden||now-lastBubbleTap>=5000)){
      const actor=eligible.find(a=>a.dataset.person===birthday)||eligible[0],lines=eventLines[id][birthday||actor.dataset.person];
      showBubble(actor,{speaker:actor.dataset.person,line:lines[id==='birthday'&&actor.dataset.person!==birthday?1:0],ownerEvent:true},4000,true);
    }
  }
  const foregrounds=[...map.querySelectorAll(".hani-office-foreground")];
  for(const img of foregrounds){img.className='hani-office-foreground';img.hidden=true}
  // One persistent, non-interactive layer; monitor gradients share one pulse.
  const atmosphere=document.createElement('div'),washes=new Map(),monitorGlow=document.createElement('div');
  atmosphere.className='hani-office-atmosphere';atmosphere.setAttribute('aria-hidden','true');
  for(const phase of ['morning','evening','night']){const wash=document.createElement('div');wash.className='hani-office-wash hani-office-wash-'+phase;atmosphere.append(wash);washes.set(phase,wash)}
  monitorGlow.className='hani-office-monitor-glow';atmosphere.append(monitorGlow);map.append(atmosphere);
  let backgroundRequest='',monitorKey='';
  function updateAtmosphere(now,visible=sceneActive){
    const light=building.atmosphere.light(now,reduced);atmosphere.dataset.phase=light.phase;
    for(const [phase,wash] of washes){const opacity=light.tint[phase].toFixed(5);if(wash.style.opacity!==opacity)wash.style.opacity=opacity}
    const floor=building.floors.find(f=>f.id===activeFloor);
    updateLiveProps(floor,map.querySelector('.hani-office-background').getAttribute('src'),map.dataset.art==='floor'&&map.dataset.floor===activeFloor,now);
    if(visible&&backgroundRequest!==floor.id+'|'+building.atmosphere.background(floor,now))setBackground(floor);
    const monitors=map.dataset.art==='floor'?building.atmosphere.monitors(activeFloor,[...actors.values()].filter(a=>!a.hidden).map(a=>({
      id:a.dataset.person,seat:building.seatMaps[activeFloor]?.find(s=>s.id===a.dataset.seat),activity:a.dataset.activity,
      pose:a.dataset.pose,walking:a.dataset.walking==='true',travel:!!a.officeTravel,called:a.dataset.called==='true',
      state:a.dataset.behavior,deskPartner:a.dataset.partner,behaviorKind:a.dataset.greeting==='true'?'chairman-greeting':''
    }))):[];
    const key=activeFloor+'|'+monitors.map(p=>p.anchor).join(',');
    if(key!==monitorKey){monitorKey=key;monitorGlow.hidden=!monitors.length;monitorGlow.style.backgroundImage=monitors.map(p=>`radial-gradient(ellipse ${p.width*.65}% ${p.height*.8}% at ${p.x}% ${p.y}%, #b8e7ff 0%, #86cfff88 45%, #86cfff00 100%)`).join(',')||'none'}
    const opacity=building.atmosphere.opacity(now,reduced,visible).toFixed(4);if(monitorGlow.style.opacity!==opacity)monitorGlow.style.opacity=opacity;
  }
  const rooms=document.createElement('div');rooms.className='hani-building-rooms';root.querySelector('.hani-office-scroll').after(rooms);
  const roomLabels=new Map();
  for(const floor of building.floors){const list=document.createElement('p');list.textContent=[...(building.canon?.floors.find(f=>f.id===floor.id)?.rooms||[]).map(r=>r.label),...(building.art?.floors[floor.id].plates||[]).filter(p=>p.detail).map(p=>p.fullLabel)].join(' · ');rooms.append(list);roomLabels.set(floor.id,list)}
  function legacySprite(actor){
    const sprite=actor.querySelector('.hani-office-sprite'),{group,row}=actor.officeLegacy;
    if(actor.dataset.resident||actor.dataset.person==='seongmin'||actor.dataset.person.startsWith('visitor')){sprite.className='hani-office-sprite';sprite.style.backgroundImage='';actor.dataset.avatar='pending';return}
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
    if(path.length>1){actor.officeTravel={path,index:0,elapsed:0,startedAt:Date.now(),distance:0,seat};pose(actor,'walk-a');place(actor,building.visualPoint(path[0]))}
    else{actor.officeAnchor=target;place(actor,[seat.x,seat.y]);pose(actor,seat.posture||'sitting')}
  }
  for(const floor of building.floors){
    const button=document.createElement("button"),title=document.createElement("strong"),count=document.createElement("small");
    button.type="button";button.dataset.buildingFloor=floor.id;button.setAttribute("role","tab");button.setAttribute("aria-controls",map.id);button.id="hani-building-tab-"+floor.id;
    title.textContent=floor.label;button.append(title,count);tabs.append(button);floorButtons.set(floor.id,button);
  }
  function viewVisible(){return !document.hidden&&!!root.closest(".view")?.classList.contains("active")&&!root.hidden&&getComputedStyle(root).display!=="none"}
  function sceneVisible(){return mapOnScreen&&viewVisible()}
  function loadImage(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(src);img.onerror=()=>resolve(null);img.src=src})}
  function setBackground(floor){
    // Floor selection must load/commit art even when only the tabs are in view.
    // Offscreen motion remains paused by sceneVisible in the shared clock.
    if(!viewVisible())return;
    const token=++backgroundToken,bg=map.querySelector('.hani-office-background'),source=building.atmosphere.background(floor);
    const request=floor.id+'|'+source;
    // Never leave a previous floor/variant showing while its replacement loads.
    if(backgroundRequest!==request){backgroundRequest=request;bg.hidden=true;map.dataset.art='loading';baristaNight.hidden=true;livePropLayer.hidden=true;monitorGlow.hidden=true;for(const entry of plates)entry.plate.hidden=true;for(const entry of deskProps)entry.prop.hidden=true}
    if(!backgroundCache.has(floor.id))backgroundCache.set(floor.id,new Map());
    const variants=backgroundCache.get(floor.id);
    const day=()=>{if(!variants.has(floor.background))variants.set(floor.background,(async()=>{
      const background=await loadImage(floor.background)||await loadImage(floor.production||floor.fallback)||floor.fallback;
      return {background,isFloor:background===floor.background};
    })());return variants.get(floor.background)};
    if(source===floor.background)day();
    else if(!variants.has(source))variants.set(source,(async()=>{
      const background=await loadImage(source);return background?{background,isFloor:true}:day();
    })());
    variants.get(source).then(({background,isFloor})=>{
      if(token!==backgroundToken||floor.id!==activeFloor||source!==building.atmosphere.background(floor)||!viewVisible())return;
      bg.src=background;if(floor.id==='3f')foregrounds[0].src=background;bg.hidden=false;bg.alt=floor.label+' · HANI GROUP';map.dataset.art=isFloor?'floor':'fallback';
      foregrounds.forEach(img=>{img.hidden=true});
      map.dataset.mask='none';
      for(const entry of plates)entry.plate.hidden=entry.floor!==floor.id||!isFloor;
      for(const entry of deskProps){entry.prop.hidden=entry.floor!==floor.id||!isFloor;if(!entry.prop.hidden&&!entry.prop.src)entry.prop.src=entry.src}
      updateLiveProps(floor,background,isFloor);updateQueenFrame();updateBarista();
      updateAtmosphere(Date.now());
      scheduleFloorBubble();
    });
  }
  function updateBuilding(force=false,animate=true){
    syncEventButtons();
    if(sceneVisible()&&!tapCatalogStarted){tapCatalogStarted=true;void tapLines.load().then(()=>{if(sceneVisible())updateBuilding(true,false)})}
    const now=new Date(),day=new Date(now.getTime()+32400000).toISOString().slice(0,10);
    const episode=tapLines.episode(now),dramaText=episode?episode.title+' · '+episode.summary:'';
    if(dramaCaption.title!==dramaText){dramaTitle.textContent=episode?episode.title+' · ':'';dramaSummary.textContent=episode?.summary||'';dramaCaption.title=dramaText}dramaCaption.hidden=!episode;
    if(bubbleSelection?.drama&&bubbleSelection.day!==day)closeBubble();
    if(day!==cancelledDay){cancelled=new Set();cancelledDay=day}
    const presence=officePresence.read();
    cancelScheduledDuringMeeting(now);
    floorSnapshot=building.snapshot(now,{...presence,reducedMotion:reduced,cancelled,summoned:meeting?selectedAgents():[]});
    presenceNote.textContent=floorSnapshot.presenceNote||'';presenceNote.hidden=!floorSnapshot.presenceNote;
    for(const floor of floorSnapshot.floors){const button=floorButtons.get(floor.id),selected=floor.id===activeFloor;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;button.querySelector("small").textContent=`근무 ${floor.work} · 휴식 ${floor.rest}`}
    const floor=floorSnapshot.floors.find(f=>f.id===activeFloor),selected=meeting&&activeFloor==="2f"?selectedAgents():null;
    const entries=selected?building.assignSeats(activeFloor,selected.map(id=>({id,activity:"meeting"}))):meeting&&activeFloor==='4f'&&selectedAgents().includes('mir')?building.assignSeats(activeFloor,[...floor.visible.filter(p=>p.id!=='mir'),{id:'mir',activity:'meeting'}]):[...floor.visible,...(meeting?[]:(floorSnapshot.visitors||[]).filter(v=>v.floor===activeFloor))];
    const nextKey=floorSnapshot.day+":"+activeFloor+":"+entries.map(p=>p.id+"/"+p.activity+"/"+p.seat?.id+"/"+p.actionId+"/"+p.eventId+"/"+p.outingId+"/"+p.line+"/"+p.state+"/"+(p.walking?'walk':p.pose)).join(",")+":"+Boolean(selected)+":"+Math.floor(floorSnapshot.minutes/5);
    updateQueenFrame(now.getTime());updateBarista();
    if(!force&&nextKey===layoutKey)return;
    const sameFloor=displayedFloor===activeFloor;displayedFloor=activeFloor;
    for(const [id,list] of roomLabels)list.hidden=id!==activeFloor;
    layoutKey=nextKey;map.dataset.floor=activeFloor;map.style.setProperty("--floor-tint",floor.tint);map.setAttribute("aria-labelledby",floorButtons.get(activeFloor).id);map.setAttribute("aria-label",floor.label);floorLabel.textContent=floor.label;
    const overflow=selected?0:floor.overflow;overflowChip.hidden=!overflow;overflowChip.textContent="+"+overflow;overflowChip.setAttribute("aria-label",`이 층의 다른 직원 ${overflow}명`);
    for(const entry of plates)entry.plate.hidden=entry.floor!==activeFloor||map.dataset.art!=='floor';
    if(!sameFloor)for(const entry of deskProps)entry.prop.hidden=true;
    if(!sameFloor)foregrounds.forEach(img=>{img.hidden=true});
    setBackground(floor);updateQueenFrame(now.getTime());updateBarista();
    for(const entry of plannedRows)entry.row.hidden=entry.floor!==activeFloor;
    // Reuse the scheduler's exact formal/outing legs; never predict a route.
    const formal=building.scheduler&&!meeting?building.scheduler.plan(day,presence):[];
    const scheduled=building.scheduler&&!meeting?[...formal,...building.scheduler.blockPlan(day,Math.floor(floorSnapshot.seconds/600),formal,presence)]:[];
    const midnight=Date.parse(day+'T00:00:00+09:00');
    for(const actor of actors.values()){if(actor.dataset.resident)continue;actor.officeWasVisible=!actor.hidden;actor.hidden=true;actor.officeRow.hidden=true;actor.dataset.called="false"}
    for(const p of entries){const actor=actors.get(p.id);if(!actor||!p.seat)continue;actor.hidden=false;actor.officeRow.hidden=false;actor.dataset.activity=p.activity;actor.dataset.plain=String(Boolean(p.plain&&!selected&&!meeting));
      if(p.visitor){actor.dataset.visitor='true';actor.dataset.name=p.name;actor.officeName.textContent=p.name;actor.officeRowName.textContent=p.name;if(actor.dataset.sprite!==p.sprite){actor.dataset.sprite=p.sprite;actor.dataset.avatar='pending'}}
      if(actor.dataset.avatar==='pending')legacySprite(actor);if(sceneVisible())loadSprite(actor,fitStatusLabels);
      if(!actor.officeWasVisible||!sameFloor){clearMotion(actor);applyPose(actor,reduced&&p.walking?'standing':p.pose||p.seat.posture)}
      const event=scheduled.find(e=>e.id===(p.eventId||p.outingId));actor.officeSchedule=event?{event,person:event.people.find(t=>t.id===p.id),midnight}:null;
      // Prepare the existing sitting sprite before a scheduled departure. This
      // never delays the leg, its coordinates, or its arrival deadline.
      let departure=Infinity;
      if(!p.walking)for(const trip of scheduled){
        if(cancelled.has(trip.id)||cancelled.has(trip.guestId))continue;
        const person=trip.people.find(t=>t.id===p.id);if(!person)continue;
        for(const leg of [...person.out,...person.back])if(leg.from===p.seat.anchor&&leg.start>=floorSnapshot.seconds&&leg.start<departure&&building.anchors.get(leg.from).floor===building.anchors.get(leg.to).floor)departure=leg.start;
      }
      actor.officeDepartureAt=Number.isFinite(departure)?midnight+departure*1000:null;
      if(building.scheduler&&!meeting){actor.officeTravel=null;actor.officeAnchor=p.seat.anchor;actor.dataset.seat=p.seat.id;actor.dataset.zone=p.seat.zone;actor.dataset.spot=p.seat.zone==='desk'?'seat':p.seat.zone;actor.dataset.home=[p.seat.x,p.seat.y].join(',');place(actor,p.position||[p.seat.x,p.seat.y]);if(!p.walking)pose(actor,p.pose);else if(reduced)pose(actor,'standing')}
      else seatActor(actor,p.seat,animate&&(sameFloor||meeting));
      actor.dataset.behavior=p.state||'AT_HOME';actor.dataset.place=p.placeId||'';actor.dataset.slot=p.targetAnchor||'';
      actor.dataset.partner=p.deskPartner||'';actor.dataset.greeting=String(p.behaviorKind==='chairman-greeting'||p.id==='seongmin'&&entries.some(q=>q.behaviorKind==='chairman-greeting'));actor.dataset.facing=p.facing||p.seat.facing||'';
      const peer=entries.find(q=>q.id===p.deskPartner);actor.style.setProperty('--response-lean',peer&&peer.seat.x<p.seat.x?'-1deg':'1deg');
      actor.dataset.action=selected?'agent-case':p.actionId||'base-work';actor.dataset.event=p.eventId||'';actor.dataset.line=selected?'실제 안건 검토 중':p.line||'자료 확인 중';
      actor.dataset.emoji=selected||actor.dataset.action==='base-work'?'':p.emoji||'';actor.dataset.walking=String(Boolean(p.walking||actor.officeTravel));
      actor.dataset.ownerEvent=eventApplies(actor)?activeEvent:'';actor.dataset.snack=String(actor.dataset.ownerEvent==='snack');if(actor.dataset.ownerEvent){actor.dataset.line=ownerEvents[activeEvent].status;actor.dataset.emoji=activeEvent==='birthday'&&p.id!==eventBirthday?'🎉':ownerEvents[activeEvent].icon}
      actor.officeReactions.observe(actor.dataset,now.getTime());
      const prop=actor.querySelector('.hani-office-prop'),emoji=headIcon(actor);if(prop.textContent!==emoji)prop.textContent=emoji;
      if(selected)actor.dataset.called='true';
      label(actor,actor.dataset.ownerEvent?actor.dataset.line:(actor.dataset.emoji?actor.dataset.emoji+' ':'')+actor.dataset.line);
      if(bubblePerson===p.id)bubbleLine.textContent=bubbleText(actor);
    }
    for(const actor of actors.values())if(actor.hidden){clearMotion(actor);actor.officeSchedule=null;actor.dataset.partner='';actor.dataset.greeting='false'}
    updateResidents(now);
    if(pendingTap){const {actor,selection,floor}=pendingTap;if(floor!==activeFloor||actor.hidden)pendingTap=null;else if(!actionRunning(actor)&&sceneVisible()){pendingTap=null;showBubble(actor,selection)}}
    if(bubblePerson&&actors.get(bubblePerson)?.hidden)closeBubble();
    updateAtmosphere(now);
    fitStatusLabels();fitBubble();
    scheduleFloorBubble();
  }
  function updateResidents(now){
    if(!residentSlots.length)return;
    const existing=building.residents.snapshot(now,floorSnapshot,true,reduced),states=[...existing,...building.residents.companionSnapshot(now,floorSnapshot,true,reduced,existing)];let changed=false;
    for(const person of residentSlots){
      const actor=actors.get(person.id),state=states.find(p=>p.id===person.id&&p.floor===activeFloor),wasVisible=!actor.hidden;
      if(!state){delete actor.officePetFloor;if(wasVisible){actor.hidden=true;clearMotion(actor);if(bubblePerson===person.id)closeBubble();changed=true}continue}
      const prior=actor.officeResidentState,walking=String(state.walking),moved=!prior||prior.position[0]!==state.position[0]||prior.position[1]!==state.position[1],turned=!prior||prior.facing!==state.facing,posed=!prior||prior.pose!==state.pose;
      if(person.pet&&state.pose==='sleep'&&(!wasVisible||prior?.pose!=='sleep'))clearMotion(actor);
      if(!wasVisible){actor.hidden=false;changed=true}
      if(!prior||prior.walking!==state.walking||prior.anchor!==state.anchor)changed=true;
      if(sceneVisible())loadSprite(actor,fitStatusLabels);
      if(!prior){actor.officeRow.hidden=true;actor.dataset.activity='resident';actor.dataset.status='resident';actor.dataset.line=person.lines[0];const status=actor.querySelector('.hani-office-status');status.dataset.full=actor.dataset.line;status.hidden=true;actor.setAttribute('aria-label',actor.dataset.name)}
      if(turned)actor.dataset.facing=state.facing;
      if(!prior||prior.walking!==state.walking)actor.dataset.walking=walking;
      if(!prior||prior.anchor!==state.anchor)actor.officeAnchor=state.anchor;
      if(moved)place(actor,state.position);
      if(posed||turned)applyPose(actor,state.pose);
      if(person.pet){
        // One entrance greeting uses the existing reaction queue and clock.
        // Walking defers it until arrival; hidden floors never consume it.
        if(!person.companion&&actor.officePetFloor!==activeFloor){actor.officePetFloor=activeFloor;if(!reduced&&state.pose!=='sleep'&&sceneVisible())actor.officeReactions.request('hop',now.getTime()+1000*(1+['pet-cat','pet-dog','pet-rabbit','pet-bori'].indexOf(person.id)))}
        const values=state.motion&&!reduced?[state.motion.bob.toFixed(3)+'px',state.motion.lean.toFixed(3)+'deg',state.motion.spin.toFixed(3)+'deg']:['0px','0deg','0deg'];
        for(const [i,key]of ['--pet-bob','--pet-lean','--pet-spin'].entries())if((actor.style.getPropertyValue?.(key)??actor.style[key])!==values[i])actor.style.setProperty(key,values[i]);
        const gesture=state.motion?.paused?state.motion.kind:'';if((actor.dataset.petPause||'')!==gesture){if(gesture)actor.dataset.petPause=gesture;else delete actor.dataset.petPause}
      }
      actor.officeResidentState=state;
      if(prior?.life?.kind!==state.life?.kind){if(state.life)actor.dataset.life=state.life.kind;else delete actor.dataset.life;}
      if(state.life&&state.life.key!==prior?.life?.key&&!reduced&&sceneVisible())actor.officeReactions.request(({hop:'hop',turn:'nod','sit-stand':'stand',wag:'wiggle'})[state.life.kind],now.getTime());
      const affection=state.affection;
      if(actor.officeHeart&&prior?.affection?.key!==affection?.key){
        actor.officeHeart.hidden=!affection;
        if(affection){actor.officeHeart.textContent=affection.heart;actor.dataset.affection=affection.kind;actor.style.setProperty('--affection-lean',affection.lean+'deg')}
        else delete actor.dataset.affection;
        if(affection?.bubble&&actorBubble.hidden&&Date.now()-lastBubbleTap>=5000)showBubble(actor,{speaker:person.id,line:affection.line,resident:true},3000,true);
      }
      const line=affection?.line||state.scene?.line||person.lines[0];
      if(actor.dataset.line!==line){actor.dataset.line=line;actor.querySelector('.hani-office-status').dataset.full=line;if(bubblePerson===person.id&&!bubbleSelection?.affinity&&(!person.companion||autoBubbleEntry)){bubbleSelection={speaker:person.id,line,resident:true};bubbleLine.textContent=bubbleText(actor)}}
      if(state.scene&&actor.officeResidentScene!==state.scene.key){actor.officeResidentScene=state.scene.key;if(actorBubble.hidden&&Date.now()-lastBubbleTap>=5000)showBubble(actor,{speaker:person.id,line:state.scene.line,resident:true})}
      if(state.reaction&&root.officeCompanionReaction!==state.reaction.key&&actorBubble.hidden&&Date.now()-lastBubbleTap>=5000){const speaker=actors.get(state.reaction.id);if(speaker&&!speaker.hidden){root.officeCompanionReaction=state.reaction.key;showBubble(speaker,{speaker:state.reaction.id,line:state.reaction.line},3000,true)}}
      if(moved&&bubblePerson===person.id){fitBubble(true);if(person.companion&&matchMedia('(max-width:600px)').matches)changed=true}
    }
    const pets=states.filter(p=>p.pet&&p.floor===activeFloor),clock=building.residents.clock(now),trioBeat=clock.day+'|'+Math.floor(clock.seconds/120);
    const trioLines=building.residents.trioChat(pets);
    if(trioLines&&actorBubble.hidden&&Date.now()-lastBubbleTap>=5000&&root.officeTrioBeat!==trioBeat){
      root.officeTrioBeat=trioBeat;const trio={key:clock.day+'|'+Math.floor(clock.seconds/900),lines:trioLines},first=trio.lines[0];
      showBubble(actors.get(first.id),{speaker:first.id,line:first.line,resident:true,residentTrio:trio,trioIndex:0},3000,true);
    }
    if(changed)fitStatusLabels();
  }
  function selectFloor(id,animate=false){closeEventPanel();closeBubble();if(!floorButtons.has(id))return;autoBubbleEntry=true;for(const actor of actors.values())finishTravel(actor);if(id!==activeFloor)clearEventReaction();activeFloor=id;armEventCooldown();updateBuilding(true,animate)}
  tabs.addEventListener("click",event=>{const button=event.target.closest("[data-building-floor]");if(button&&tabs.contains(button))selectFloor(button.dataset.buildingFloor)});
  tabs.addEventListener("keydown",event=>{const keys=[...floorButtons.keys()],index=keys.indexOf(activeFloor);let next;if(event.key==="ArrowRight")next=(index+1)%keys.length;else if(event.key==="ArrowLeft")next=(index+keys.length-1)%keys.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=keys.length-1;else return;event.preventDefault();selectFloor(keys[next]);floorButtons.get(keys[next]).focus()});
  function syncVisibility(){officePresence.read();const visible=sceneVisible();if(visible&&!sceneActive)autoBubbleEntry=true;sceneActive=visible;root.dataset.paused=String(!visible);if(visible)updateBuilding(true,false);else{closeEventPanel();autoBubbleEntry=false;for(const actor of actors.values())clearMotion(actor);closeBubble()}map.officeMascotMotion?.({now:Date.now(),reduced,visible,actors})}
  document.addEventListener("visibilitychange",()=>{if(document.hidden)affinity.flush(true);syncVisibility()});
  // Exactly one new listener: a visible unload may have no visibilitychange.
  globalThis.addEventListener?.('pagehide',()=>affinity.flush(true));
  new MutationObserver(syncVisibility).observe(root.closest(".view"),{attributes:true,attributeFilter:["class","hidden","style"]});
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{mapOnScreen=entries[0].isIntersecting;syncVisibility()}).observe(map);
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
  // One existing 100ms movement clock. Sample the reserved route at wall time;
  // persistent actor left/top remain the canonical coordinates for all readers.
  setInterval(()=>{affinity.flush();const now=Date.now();if(!sceneActive||document.hidden)return;
    if(building.scheduler&&!meeting&&now-lastProjection>=200){lastProjection=now;updateBuilding(false,false)}
    updateResidents(new Date(now));
    for(const actor of actors.values()){
      if(actor.hidden)continue;
      if(actor.dataset.resident){const effect=actor.officeReactions.tick(now,reduced,actor.dataset.walking==='true');if(effect){if(actor.dataset.motion!==effect.kind)actor.dataset.motion=effect.kind}else if(actor.dataset.motion!==undefined)delete actor.dataset.motion;continue}
      if(!reduced&&actor.dataset.walking!=='true'&&actor.dataset.pose==='sitting'&&actor.officeDepartureAt&&actor.officeAnticipatedDeparture!==actor.officeDepartureAt&&now>=actor.officeDepartureAt-200&&now<actor.officeDepartureAt){actor.officeAnticipatedDeparture=actor.officeDepartureAt;actor.officeReactions.request('stand',now,true)}
      if(!reduced&&actor.officeDepartureAt&&now>=actor.officeDepartureAt){actor.officeDepartureAt=null;updateBuilding(false,false)}
      const track=actor.officeSchedule;let gait=null;
      if(track&&!reduced){
        const seconds=(now-track.midnight)/1000,state=building.motion.sample(track.event,track.person,seconds);
        if(state.floor!==activeFloor||state.state!==actor.dataset.behavior||String(state.walking)!==actor.dataset.walking||seconds>=track.event.end){updateBuilding(false,false)}
        else if(state.walking){moveActor(actor,state.position);gait=state}
      }
      const travel=actor.officeTravel;
      if(travel&&!reduced){travel.elapsed=now-travel.startedAt;
        while(travel.index<travel.path.length-1){
          const a=travel.path[travel.index],b=travel.path[travel.index+1],duration=Math.max(1,Math.hypot(b.x-a.x,b.y-a.y)/building.canon.movement.speedPxPerSecond*1000),va=building.visualPoint(a),vb=building.visualPoint(b);
          const length=Math.hypot((vb[0]-va[0])*(building.art?.width||1672)/100,(vb[1]-va[1])*(building.art?.height||941)/100);
          if(travel.elapsed<duration){const t=travel.elapsed/duration;moveActor(actor,[va[0]+(vb[0]-va[0])*t,va[1]+(vb[1]-va[1])*t]);gait=building.motion.gait(travel.distance+length*t,vb[0]-va[0]);break}
          travel.elapsed-=duration;travel.startedAt+=duration;travel.distance+=length;travel.index++;
        }
        if(travel.index===travel.path.length-1){finishTravel(actor);actor.dataset.walking='false'}
      }
      if(gait){if(actor.dataset.pose!==gait.pose)pose(actor,gait.pose);actor.style.setProperty('--step-bounce',gait.bounce+'px');actor.style.setProperty('--step-lean',gait.lean+'deg')}
      else{actor.style.setProperty('--step-bounce','0px');actor.style.setProperty('--step-lean','0deg')}
      actor.officeReactions.observe(actor.dataset,now);
      const effect=actor.officeReactions.tick(now,reduced,actor.dataset.walking==='true'||!!actor.officeTravel);
      if(effect){if(actor.dataset.motion!==effect.kind)actor.dataset.motion=effect.kind}else delete actor.dataset.motion;
    }
    updateAtmosphere(now,true);
    map.officeMascotMotion?.({now,reduced,visible:true,actors});
  },100);
  setInterval(changeOne,4200);
})();

})();
