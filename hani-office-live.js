/* Read-only Living Office. The Agent Case renderer remains the sole owner of requests, answers and decisions. */
(() => {
  "use strict";
  const root=document.getElementById("haniOfficeLive"),map=document.getElementById("haniOfficeMap");
  if(!root||!map)return;
  const base="./assets/ai-approval-characters/v3-animation-approved-transparent-group-";
  const people=[
    ["hani","하니","a",0,"leader",[20,21]],
    ["jieun","지은","a",1,"01",[12,55]],
    ["naeun","나은","a",2,"04",[44,55]],
    ["hina","히나","b",0,"02",[23,55]],
    ["sua","수아","b",1,"03",[34,55]],
    ["haru","하루","b",2,"05",[12,80]],
    ["minji","민지","c",0,"06",[23,80]],
    ["sooyeon","수연","c",1,"07",[34,80]],
    ["yuna","유나","c",2,"08",[44,80]]
  ];
  const statusPools={
    hani:[{mode:'work',label:'안건 검토 중',tone:'work',icon:'📌',spot:'seat'},{mode:'work',label:'결재 도장 찍는 중',tone:'work',icon:'✅',spot:'seat'},{mode:'work',label:'팀 캘린더 정리 중',tone:'work',icon:'🗓',spot:'seat'},{mode:'work',label:'회의 자료 순서 다시 보는 중',tone:'research',icon:'📑',spot:'seat'},{mode:'idle',label:'직원들 자리 슬쩍 둘러보는 중',tone:'social',icon:'👀',spot:'staffAisle'},{mode:'work',label:'팀 흐름 한눈에 보는 중',tone:'research',icon:'🧭',spot:'seat',signature:true,fx:'🔭'}],
    jieun:[{mode:'work',label:'보고서 작성 중',tone:'research',icon:'📊',spot:'seat'},{mode:'work',label:'예산 숫자와 씨름 중',tone:'mischief',icon:'🧮',spot:'seat'},{mode:'work',label:'메일 쓰는 중',tone:'work',icon:'✉️',spot:'seat'},{mode:'work',label:'영수증 숫자 맞춰보는 중',tone:'research',icon:'🧾',spot:'seat'},{mode:'work',label:'소수점 셋째 자리까지 검산 중',tone:'research',icon:'🔢',spot:'seat',signature:true,fx:'🧮'}],
    naeun:[{mode:'work',label:'건강 기록 정리 중',tone:'research',icon:'📋',spot:'seat'},{mode:'idle',label:'커피 마시는 중',tone:'rest',icon:'☕',spot:'loungeCoffee'},{mode:'work',label:'직원 컨디션 메모 중',tone:'work',icon:'📝',spot:'seat'},{mode:'idle',label:'자리 사이 안부 묻는 중',tone:'social',icon:'💬',spot:'naeunAisle'},{mode:'idle',label:'소파에서 숨 고르는 중',tone:'rest',icon:'🌿',spot:'loungeSofa'},{mode:'work',label:'자료 정리 중',tone:'work',icon:'🗂',spot:'seat'},{mode:'idle',label:'유나에게 커피 메뉴 추천 중',tone:'social',icon:'☕',spot:'loungeTalkA',event:'coffee-chat'},{mode:'idle',label:'커피 향으로 컨디션 체크 중',tone:'rest',icon:'☕',spot:'loungeCoffee',signature:true,fx:'✨'}],
    hina:[{mode:'work',label:'몰래 인스타 순찰 중',tone:'mischief',icon:'📱',spot:'seat'},{mode:'work',label:'웹서핑 중',tone:'research',icon:'🌐',spot:'seat'},{mode:'work',label:'오늘 볼 콘텐츠 메모 중',tone:'research',icon:'🎬',spot:'seat'},{mode:'idle',label:'책상 옆 수다 중',tone:'social',icon:'💬',spot:'chatA'},{mode:'idle',label:'복도 스트레칭 중',tone:'rest',icon:'🙆',spot:'corridorUpper'},{mode:'idle',label:'수아에게 밈 보여주는 중',tone:'social',icon:'🤣',spot:'chatA',event:'meme-chat'},{mode:'idle',label:'셀카 각도 연구 중',tone:'mischief',icon:'🤳',spot:'photoSpot',signature:true,fx:'✨'}],
    sua:[{mode:'work',label:'메일함 0개 도전 중',tone:'work',icon:'✉️',spot:'seat'},{mode:'work',label:'업무 체크 중',tone:'work',icon:'✅',spot:'seat'},{mode:'work',label:'오늘 안건 우선순위 맞추는 중',tone:'research',icon:'📌',spot:'seat'},{mode:'idle',label:'책상 옆 수다 중',tone:'social',icon:'💬',spot:'chatB'},{mode:'work',label:'보고서 검토 중',tone:'research',icon:'📑',spot:'seat'},{mode:'idle',label:'히나 밈 보고 웃음 참는 중',tone:'social',icon:'🤭',spot:'chatB',event:'meme-chat'},{mode:'work',label:'책상 각도 1mm 맞추는 중',tone:'work',icon:'📐',spot:'seat',signature:true,fx:'📐'}],
    haru:[{mode:'work',label:'자료 읽는 중',tone:'research',icon:'📚',spot:'seat'},{mode:'idle',label:'프린터와 협상 중',tone:'mischief',icon:'🖨',spot:'printer'},{mode:'work',label:'고양이 영상 1분만…',tone:'mischief',icon:'🐈',spot:'seat'},{mode:'work',label:'관심 기사 한 줄 적는 중',tone:'research',icon:'📝',spot:'seat'},{mode:'idle',label:'복도 스트레칭 중',tone:'rest',icon:'🙆',spot:'corridorLower'},{mode:'idle',label:'화분에게 오늘 일정 설명 중',tone:'social',icon:'🪴',spot:'plantCorner',signature:true,fx:'🌱'}],
    minji:[{mode:'work',label:'보고서 작성 중',tone:'work',icon:'📝',spot:'seat'},{mode:'work',label:'몰래 인스타 중',tone:'mischief',icon:'📱',spot:'seat'},{mode:'idle',label:'간식 서랍 점검 중',tone:'mischief',icon:'🍪',spot:'snack'},{mode:'work',label:'일정 정리 중',tone:'work',icon:'🗓',spot:'seat'},{mode:'work',label:'새 콘텐츠 추천 목록 적는 중',tone:'research',icon:'🎬',spot:'seat'},{mode:'idle',label:'간식 재고 감사 중',tone:'mischief',icon:'🍪',spot:'snack',signature:true,fx:'🔍'}],
    sooyeon:[{mode:'work',label:'시장 조사 중',tone:'research',icon:'🔎',spot:'seat'},{mode:'work',label:'여행 자료 검색 중',tone:'research',icon:'✈️',spot:'seat'},{mode:'work',label:'메일 쓰는 중',tone:'work',icon:'✉️',spot:'seat'},{mode:'work',label:'경기 일정 확인 중',tone:'research',icon:'⚾',spot:'seat'},{mode:'work',label:'항공권 가격 다시 보는 중',tone:'research',icon:'🛫',spot:'seat'},{mode:'work',label:'지도에 별표 찍는 중',tone:'research',icon:'🗺️',spot:'seat',signature:true,fx:'⭐'}],
    yuna:[{mode:'work',label:'자리에서 독서 메모 중',tone:'research',icon:'📖',spot:'seat'},{mode:'idle',label:'자료 읽는 중',tone:'research',icon:'📖',spot:'loungeShelf'},{mode:'idle',label:'휴게실 담소 중',tone:'social',icon:'💬',spot:'loungeTalkB'},{mode:'idle',label:'커피 기다리는 중',tone:'rest',icon:'☕',spot:'loungeCoffeeRight'},{mode:'work',label:'자리 정리 중',tone:'work',icon:'🗂',spot:'seat'},{mode:'idle',label:'나은 추천 메뉴 고민 중',tone:'social',icon:'☕',spot:'loungeTalkB',event:'coffee-chat'},{mode:'idle',label:'책갈피 색 조합 고민 중',tone:'research',icon:'🔖',spot:'loungeShelf',signature:true,fx:'🎨'}]
  };
  const moodPools={
    hani:[{label:'집중 모드',icon:'🧐'},{label:'팀이 든든한 기분',icon:'😌'},{label:'좋은 생각이 날 듯해',icon:'🤔'}],
    jieun:[{label:'숫자에 진심',icon:'🤓'},{label:'계획대로 진행 중',icon:'😎'},{label:'엑셀이랑 눈싸움 중',icon:'😵‍💫'}],
    naeun:[{label:'평온한 기분',icon:'☺️'},{label:'기분 좋은 휴식',icon:'🥰'},{label:'카페인 충전 완료',icon:'☕'}],
    hina:[{label:'장난칠 타이밍 보는 중',icon:'😏'},{label:'재밌는 거 발견',icon:'🤭'},{label:'아무것도 안 했어요',icon:'😇'}],
    sua:[{label:'집중력 MAX',icon:'😤'},{label:'조금 뿌듯함',icon:'✨'},{label:'알림이 99+…',icon:'😶'}],
    haru:[{label:'호기심 폭발',icon:'🤩'},{label:'고양이 생각 중',icon:'🐱'},{label:'살짝 졸림',icon:'😴'}],
    minji:[{label:'간식 생각 중',icon:'😋'},{label:'의욕 충전 완료',icon:'🔥'},{label:'딴짓 안 했어요',icon:'😳'}],
    sooyeon:[{label:'여행 갈 생각에 신남',icon:'🤗'},{label:'조사 모드 ON',icon:'😎'},{label:'마음은 휴가 중',icon:'🌊'}],
    yuna:[{label:'느긋한 기분',icon:'😊'},{label:'책에 푹 빠짐',icon:'📚'},{label:'잠깐 딴생각 중',icon:'💭'}]
  };
  const free={loungeCoffee:[69,44],loungeSofa:[73,43],loungeShelf:[91,44],loungeCoffeeRight:[87,44],loungeTalkA:[68,45],loungeTalkB:[82,45],chatA:[17,49],chatB:[31,49],printer:[6.5,43],photoSpot:[50,48],plantCorner:[59,43],corridorUpper:[50,58],corridorLower:[53,71],snack:[43,70],staffAisle:[47,68],naeunAisle:[40,46]};
  const pairScenes=[
    ["hina","sua","🤣 밈 보고 웃음 참는 중",[17,49],[31,49]],
    ["naeun","yuna","☕ 커피 메뉴 추천하며 담소 중",[68,45],[82,45]],
    ["jieun","haru","🧾 Wish-list 가격 보고 눈 마주치는 중",[17,49],[29,49]],
    ["hani","jieun","📊 월말 숫자 조용히 검토 중",[39,47],[48,47]],
    ["hani","sua","📌 오늘 안건 우선순위 맞추는 중",[40,47],[49,47]],
    ["haru","minji","🎬 오늘 볼 거 고르는 중",[17,71],[28,71]],
    ["sooyeon","minji","✈️ 다음 여행에서 뭐 볼지 얘기 중",[36,71],[46,71]],
    ["sua","yuna","🗓 일정 입력 내용 같이 확인 중",[41,48],[51,48]]
  ];
  const meetingPositions=[[64,80],[75,80],[86,80],[64,89],[75,89],[86,89]];
  const actorLayer=document.getElementById("haniOfficeActors"),conversation=document.getElementById("haniOfficeConversation"),meetingBox=document.getElementById("haniOfficeMeeting"),openButton=document.getElementById("haniOfficeMeetingOpen"),returnButton=document.getElementById("haniOfficeReturn"),caseState=document.getElementById("haniOfficeCaseState");
  const actors=new Map(),history=new Map(),pairUntil=new Map();let tick=0,frame=0,caseData=null,meeting=false,travelId=0;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function place(actor,position){actor.style.left=position[0]+"%";actor.style.top=position[1]+"%"}
  function label(actor,value,mood=false){actor.querySelector(".hani-office-status").textContent=value;actor.dataset.mood=String(mood);actor.setAttribute("aria-label",`${actor.dataset.name}: ${value}`)}
  for(const [key,name,group,row,seat,home] of people){
    const actor=document.createElement("div");actor.className="hani-office-actor";actor.dataset.person=key;actor.dataset.name=name;actor.dataset.seat=seat;actor.dataset.spot="seat";
    const sprite=document.createElement("div");sprite.className="hani-office-sprite";sprite.style.setProperty("--sheet",`url('${base+group}.png')`);sprite.style.backgroundPosition=`0% ${["0%","50%","100%"][row]}`;sprite.dataset.row=String(row);
    const status=document.createElement("span");status.className="hani-office-status";actor.append(sprite,status);actorLayer.append(actor);place(actor,home);label(actor,`${statusPools[key][0].icon} ${statusPools[key][0].label}`);actors.set(key,actor);history.set(key,-1);
  }
  function changeOne(){
    if(meeting||document.hidden||!root.closest(".view")?.classList.contains("active"))return;
    const [key,,,,,home]=people[tick%people.length],actor=actors.get(key),pool=statusPools[key].filter(item=>!item.event),previous=history.get(key);tick++;
    if(tick%18===0){const pair=pairScenes[(tick/18-1)%pairScenes.length];for(const [index,member] of pair.slice(0,2).entries()){const target=actors.get(member);if(!target)continue;target.dataset.spot="pair";place(target,pair[3+index]);label(target,pair[2]);pairUntil.set(member,Date.now()+22000)}return}
    if((pairUntil.get(key)||0)>Date.now())return;
    if(tick%3===0){const list=moodPools[key],mood=list[Math.floor(tick/3)%list.length];label(actor,`${mood.icon} ${mood.label}`,true);return}
    const common=pool.map((_,i)=>i).filter(i=>!pool[i].signature&&i!==previous),rare=pool.map((_,i)=>i).filter(i=>pool[i].signature&&i!==previous);
    const choices=tick%7===0&&rare.length?rare:common.length?common:pool.map((_,i)=>i).filter(i=>i!==previous);
    const index=choices[(Math.floor(tick/people.length)+tick)%choices.length],action=pool[index];history.set(key,index);
    const target=action.spot==="seat"?home:free[action.spot]||home;
    if(actor.dataset.spot!==action.spot){actor.dataset.spot=action.spot;place(actor,target)}
    label(actor,`${action.icon} ${action.label}`);
  }
  function homeAll(){people.forEach(([key,,,,,home])=>{const actor=actors.get(key);actor.dataset.called="false";actor.dataset.spot="seat";place(actor,home)})}
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function walk(selected,returning=false){
    const token=++travelId;map.dataset.state=returning?"return":"summon";
    if(!returning)selected.forEach(key=>{const actor=actors.get(key);if(actor){actor.dataset.called="true";label(actor,"📣 회의 소집")}});
    const phases=returning?[[55,75],[49,62],null]:[[49,62],[55,75],null];
    for(let step=0;step<phases.length;step++){
      selected.forEach((key,index)=>{const actor=actors.get(key);if(!actor)return;const p=phases[step]||(returning?people.find(person=>person[0]===key)?.[5]:meetingPositions[index%meetingPositions.length]);if(p)place(actor,p)});
      await sleep(reduced?25:1400);if(token!==travelId)return false;
    }
    return true;
  }
  function textLine(name,text,key,summary=false){const row=document.createElement("div");row.className="hani-office-line"+(summary?" hani-office-line-summary":"");const img=document.createElement("img");img.src=`./assets/profiles/hani-profile-${key||"hani"}.webp`;img.alt="";img.loading="lazy";const body=document.createElement("div");body.className="hani-office-line-body";const title=document.createElement("b");title.textContent=name;const para=document.createElement("p");para.textContent=text;body.append(title,para);row.append(img,body);conversation.append(row)}
  function renderMeeting(){
    conversation.replaceChildren();const detail=caseData;if(!detail)return;
    const c=detail.case||{},h=c.hani_final&&typeof c.hani_final==="object"?c.hani_final:{};
    document.getElementById("haniOfficeMeetingTitle").textContent=c.title||"선택한 안건";
    const reviews=Array.isArray(detail.reviews)?detail.reviews:[],round=Math.max(0,...reviews.map(r=>Number(r.review_round)||0));
    document.getElementById("haniOfficeMeetingMeta").textContent=`${c.case_code||"CASE"} · ${round}차 검토 · 저장된 실제 의견만 표시`;
    const latest=reviews.filter(r=>(Number(r.review_round)||0)===round);
    if(!latest.length){const empty=document.createElement("div");empty.className="hani-office-empty";empty.textContent="아직 저장된 Agent 검토 의견이 없습니다. 아래 안건 상태와 질문을 확인해 주세요.";conversation.append(empty)}
    latest.forEach(r=>{const key=people.find(p=>[p[0],p[1]].includes(String(r.agent_key||"").toLowerCase()))?.[0]||"hani";const name=people.find(p=>p[0]===key)?.[1]||String(r.agent_key||"Agent");textLine(`${name} · ${r.verdict||"검토"}`,r.summary||r.key_point||"검토 내용이 비어 있습니다.",key)});
    if(h.executive_summary)textLine("하니 · 종합",h.executive_summary,"hani",true);
    else {const empty=document.createElement("div");empty.className="hani-office-empty";empty.textContent="하니의 종합 결론은 아직 준비 중입니다. 결정 가능 여부는 아래 원본 검토서에서 확인하세요.";conversation.append(empty)}
  }
  function selectedAgents(){const reviews=Array.isArray(caseData?.reviews)?caseData.reviews:[],round=Math.max(0,...reviews.map(r=>Number(r.review_round)||0));const keys=["hani"];for(const r of reviews.filter(r=>(Number(r.review_round)||0)===round)){const key=String(r.agent_key||"").toLowerCase();const person=people.find(p=>p[0]===key||p[1]===key);if(person&&!keys.includes(person[0]))keys.push(person[0])}return keys.slice(0,6)}
  async function openMeeting(){if(!caseData||meeting)return;meeting=true;openButton.disabled=true;caseState.textContent="회의실로 이동 중";const selected=selectedAgents();if(!await walk(selected))return;meetingBox.hidden=false;returnButton.hidden=false;map.dataset.state="meeting";caseState.textContent="실제 검토 의견 보기";renderMeeting();meetingBox.scrollIntoView({behavior:reduced?"instant":"smooth",block:"nearest"})}
  async function returnOffice(){if(!meeting)return;meetingBox.hidden=true;returnButton.hidden=true;caseState.textContent="자리로 복귀 중";const selected=selectedAgents();await walk(selected,true);homeAll();meeting=false;map.dataset.state="idle";openButton.disabled=!caseData;caseState.textContent=caseData?"안건 선택됨 · 회의실 준비":"평상시 근무 중"}
  openButton.addEventListener("click",openMeeting);returnButton.addEventListener("click",returnOffice);
  document.getElementById("haniOfficeReportLink").addEventListener("click",()=>document.getElementById("agentCaseDetail")?.scrollIntoView({behavior:reduced?"instant":"smooth",block:"start"}));
  window.haniOfficeLiveUpdate=detail=>{caseData=detail?.case?detail:null;openButton.disabled=!caseData;caseState.textContent=caseData?"안건 선택됨 · 회의실 준비":"평상시 근무 중";if(meeting){if(caseData)renderMeeting();else void returnOffice()}};
  if(typeof agentDetailCache!=="undefined"&&agentDetailCache?.case)window.haniOfficeLiveUpdate(agentDetailCache);
  setInterval(()=>{if(reduced||meeting)return;frame=1-frame;for(const actor of actors.values()){const sprite=actor.querySelector(".hani-office-sprite"),row=Number(sprite.dataset.row);sprite.style.backgroundPosition=`${frame?"20%":"0%"} ${["0%","50%","100%"][row]}`}},600);
  setInterval(changeOne,4200);
})();
