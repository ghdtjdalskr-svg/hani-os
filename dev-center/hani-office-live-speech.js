/* Front-only action-state preview. The events below are fixtures, not HANI OS production data. */
(() => {
  const stage=document.querySelector('#officeStage');
  if(!stage)return;
  const actors=Object.fromEntries([...stage.querySelectorAll('.actor')].map(actor=>[actor.dataset.person,actor]));
  const eventCatalog={
    JISPI_CIRCUIT_BREAKER_ACTIVE:{character:'jieun',activity:'CHECKING_BUDGET',icon:'🧮',contexts:{
      FIRST_TRIGGER:['예산 경고 확인 중','이번 달 지출선 점검 중','JISPI 수치 검산 중'],
      REPEATED:['지속 경고 확인 중','남은 예산 다시 계산 중','지출 속도 재점검 중'],
      WORSENING:['지출 증가 폭 분석 중','추가 소비 제동 검토 중','월말 위험도 재계산 중'],
      RECOVERING:['예산 회복 흐름 확인 중','지출선 안정 여부 검산 중','정상 범위 복귀 추적 중'],
      RESOLVED:['서킷브레이커 해제 확인 중','예산 정상화 기록 중','회복 수치 최종 검산 중']
    }},
    JLPT_QUIZ_PENDING:{character:'hina',activity:'PREPARING_QUIZ',icon:'📚',contexts:{
      FIRST_TRIGGER:['오늘의 퀴즈 준비 중','학습 문제 고르는 중','JLPT 한 문제 꺼내는 중'],
      REPEATED:['미완료 퀴즈 확인 중','오늘 문제 다시 펼치는 중','퀴즈 대기 상태 확인 중']
    }},
    JLPT_QUIZ_COMPLETED:{character:'hina',activity:'REVIEWING_QUIZ',icon:'✨',contexts:{
      RESOLVED:['완료한 퀴즈 정리 중','오답 포인트 표시 중','오늘 학습 기록 확인 중']
    }},
    EXERCISE_LOGGED:{character:'naeun',activity:'CHECKING_EXERCISE',icon:'💪',contexts:{
      FIRST_TRIGGER:['오늘 운동 기록 확인 중','운동 후 회복 체크 중','활동량 살펴보는 중'],
      REPEATED:['운동 기록 이어 보는 중','루틴 흐름 체크 중','누적 활동량 살펴보는 중']
    }},
    EXERCISE_MISSING:{character:'naeun',activity:'CHECKING_ROUTINE',icon:'🌿',contexts:{
      FIRST_TRIGGER:['오늘 운동 기록 확인 중','가벼운 움직임 제안 준비 중','휴식·운동 균형 살피는 중'],
      REPEATED:['비어 있는 기록 다시 확인 중','오늘 루틴 재점검 중','짧은 스트레칭 제안 중']
    }}
  };
  const used=new Map();
  const nextAction=(key,pool)=>{
    const history=used.get(key)||{seen:new Set(),last:-1,cursor:0};
    let choices=pool.map((_,index)=>index).filter(index=>!history.seen.has(index));
    if(!choices.length){history.seen.clear();choices=pool.map((_,index)=>index);}
    const withoutLast=choices.filter(index=>index!==history.last);
    if(withoutLast.length)choices=withoutLast;
    const choice=choices[history.cursor%choices.length];
    history.cursor+=1;history.last=choice;history.seen.add(choice);used.set(key,history);
    return pool[choice];
  };
  const controls=document.createElement('section');
  controls.className='speech-preview-controls';
  controls.innerHTML='<header><div><h3>HANI OFFICE LIVE · Character Activity</h3><p>9명 모두 각자의 행동을 표시합니다. 실제 이벤트 시연 시 담당자의 행동만 우선 바뀌며, 나머지 캐릭터는 기존 행동·교류를 계속합니다.</p></div><span class="demo-label">FRONT DEMO · LIVE DATA 아님</span></header><div class="speech-demo-row"><button type="button" data-demo="NONE" class="active">일상 Office</button><button type="button" data-demo="JISPI_CIRCUIT_BREAKER_ACTIVE">JISPI 경고</button><button type="button" data-demo="JLPT_QUIZ_PENDING">퀴즈 대기</button><button type="button" data-demo="JLPT_QUIZ_COMPLETED">퀴즈 완료</button><button type="button" data-demo="EXERCISE_LOGGED">운동 기록</button><button type="button" data-demo="EXERCISE_MISSING">운동 미기록</button><select id="speechContext" aria-label="이벤트 문맥"></select><button type="button" class="speech-repeat" id="speechReplay">다음 행동 보기</button></div><div class="speech-demo-meta"><b id="speechPriority">CHARACTER ACTIVITY</b><code id="speechEventId">NO EVENT</code><span id="speechActivity">9명의 행동 상태 · 일부만 천천히 변화</span></div>';
  document.querySelector('#stageScroll').before(controls);
  const contextSelect=controls.querySelector('#speechContext'),priority=controls.querySelector('#speechPriority'),eventIdText=controls.querySelector('#speechEventId'),activityText=controls.querySelector('#speechActivity');
  let selectedEvent=null,selectedContext=null,renderQueued=false;
  const signal=()=>selectedEvent&&eventCatalog[selectedEvent]?.contexts[selectedContext]
    ?{eventId:selectedEvent,context:selectedContext,...eventCatalog[selectedEvent]}:null;
  const apply=()=>{
    renderQueued=false;
    const active=stage.dataset.state==='idle'?signal():null;
    for(const actor of Object.values(actors))actor.dataset.officeEvent='false';
    if(!active)return;
    const actor=actors[active.character],em=actor.querySelector('.actor-tag em'),tag=actor.querySelector('.actor-tag');
    const key=`${active.eventId}:${active.context}:${active.character}`;
    const action=nextAction(key,active.contexts[active.context]);
    actor.dataset.officeEvent='true';actor.dataset.eventAction=action;
    if(em.textContent!==action)em.textContent=action;
    if(em.dataset.icon!==active.icon)em.dataset.icon=active.icon;
    const aria=`${active.character.toUpperCase()} · ${action}`;
    if(tag.getAttribute('aria-label')!==aria)tag.setAttribute('aria-label',aria);
    priority.textContent='EVENT ACTIVITY > CHARACTER ACTIVITY';
    eventIdText.textContent=`${active.eventId} · ${active.context}`;
    activityText.textContent=`${active.character.toUpperCase()} · ${active.activity}`;
    if(matchMedia('(max-width:620px)').matches){
      const scroll=document.querySelector('#stageScroll');
      const target=stage.clientWidth*parseFloat(actor.style.left)/100-scroll.clientWidth/2;
      if(Math.abs(scroll.scrollLeft-target)>24)scroll.scrollTo({left:Math.max(0,target),behavior:'smooth'});
    }
  };
  const queueApply=()=>{if(renderQueued)return;renderQueued=true;queueMicrotask(apply)};
  const choose=(eventId,context)=>{
    const previous=selectedEvent;
    selectedEvent=eventCatalog[eventId]?eventId:null;
    const contexts=selectedEvent?Object.keys(eventCatalog[selectedEvent].contexts):[];
    selectedContext=contexts.includes(context)?context:contexts[0]||null;
    contextSelect.replaceChildren(...contexts.map(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;return option;}));
    contextSelect.disabled=!selectedEvent;contextSelect.value=selectedContext||'';
    controls.querySelectorAll('[data-demo]').forEach(button=>button.classList.toggle('active',button.dataset.demo===(selectedEvent||'NONE')));
    if(stage.dataset.state!=='idle'||previous&&previous!==selectedEvent)document.querySelector('.step[data-state="idle"]').click();
    if(!selectedEvent){priority.textContent='CHARACTER ACTIVITY';eventIdText.textContent='NO EVENT';activityText.textContent='9명의 행동 상태 · 일부만 천천히 변화';}
    queueApply();
  };
  controls.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.demo)));
  contextSelect.addEventListener('change',()=>{selectedContext=contextSelect.value;queueApply()});
  controls.querySelector('#speechReplay').addEventListener('click',()=>{if(selectedEvent)queueApply();else document.querySelector('#ambientShuffle').click()});
  new MutationObserver(queueApply).observe(stage,{attributes:true,attributeFilter:['data-state']});
  for(const actor of Object.values(actors)){
    const em=actor.querySelector('.actor-tag em');
    new MutationObserver(()=>{if(actor.dataset.officeEvent==='true'&&actor===actors[signal()?.character]&&em.textContent!==actor.dataset.eventAction)queueMicrotask(()=>{if(actor.dataset.officeEvent==='true'){em.textContent=actor.dataset.eventAction;em.dataset.icon=signal()?.icon||'•';}});}).observe(em,{childList:true,characterData:true});
  }
  window.HaniOfficeActivityPreview={dispatch:value=>choose(value?.eventId,value?.context),catalog:eventCatalog};
  choose(null);
  setTimeout(()=>{if(stage.dataset.state==='assign')document.querySelector('.step[data-state="idle"]').click();},1350);
})();
