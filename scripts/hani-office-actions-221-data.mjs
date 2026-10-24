// Static scene data only. Keep the released 216 catalog byte-for-byte intact.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

export function nightTable(original){
  const table=structuredClone(original);
  table.schemaVersion='office-actions-221-v1';
  table.sourceCommit='4a913303';
  table.rules.weekendFrequencyScale=.6;
  table.rules.floorAmbient={weekdaySeconds:40,weekendSeconds:55,description:'층별 짧은 표정·업무 동작. 휴식/식사·층간 이동은 기존 합산 budget 유지. 재실·예약 실패 시 skip.'};
  const social=new Set(['scene-meme','scene-coffee-menu','scene-snack-budget','scene-watch-pick','scene-travel-talk','scene-roof-selfie','scene-scope-banter','scene-rest-bookmark','scene-camera-route','scene-haru-minji-cover','scene-map-rest']);
  function extend(action){
    if(['base-lunch','base-arrive-leave'].includes(action.id)||action.layer===3&&!social.has(action.id))return;
    action.conditions.days='매일';
    action.conditions.timeWindows=[['00:00','07:00'],...action.conditions.timeWindows,['18:00','24:00']];
    action.conditions.weekendTimeWindows=[['00:00','24:00']];
  }
  table.actions.forEach(a=>{extend(a);if(a.actorOverrides?.mir)a.actorOverrides.mir.emoji='✨'});
  // Parents own eligibility; expanding variants alone would leave their gates closed.
  for(const family of table.families)extend(family.parent);
  const byId=new Map(table.people.map(p=>[p.id,p]));
  const humans=table.people.filter(p=>p.id!=='mir').map(p=>p.id);
  function row(id,title,ids,emoji,speech,{rest=false,anchor=null,days='매일',windows=[['18:00','07:00']],home=false}={}){
    return {id,layer:1,title,participants:ids,participantSelector:'explicit',
      places:ids.map(personId=>({...byId.get(personId).home,...(anchor?{anchorId:anchor,floor:anchor==='coffee_counter'?'1f':'5f'}:{}),personId})),
      conditions:{days,timeWindows:windows,weekendTimeWindows:[['00:00','24:00']],weather:'미사용',triggerIds:[],description:'화면이 보이고 참여자가 218 재실 일정상 남아 있을 때'},
      durationSeconds:rest?[12,22]:[8,14],performance:{pose:anchor?'stand':'sit',prop:emoji,emoji,speech},
      actorOverrides:{...structuredClone(original.actions[0].actorOverrides),mir:{pose:'stand',prop:'작은 빛·가상 카드',emoji:'✨',speech:ids.length===1&&ids[0]==='mir'?speech:'이건 연결되네.'}},
      targetResolution:home?'presence_home':'explicit',personalNonWork:rest,
      frequencyFamilyId:id,releaseTarget:'221',manualPreviewOnlyIn216:false,automaticReady:true};
  }
  // Three variants share ONE floor budget; adding a character never multiplies it.
  const micro=[
    ['1f',['sua','taeo','yuna','minji'],[
      ['night-lobby-note','작은 메모 한 줄','📝','조용한 밤이라 메모가 잘 써지네요.'],
      ['night-lobby-story','오늘 이야기 한 줄','💬','오늘 웃겼던 장면, 하나만 얘기할까요?'],
      ['night-lobby-lights','오늘 장면 떠올리기','🌃','오늘 기억할 장면을 적어둘게요.']]],
    ['2f',['jieun','haru','naeun','hina','minji','sooyeon','daon','yoonseul'],[
      ['night-life-bookmark','책갈피에 한 줄','📖','이 페이지에 책갈피를 꽂아둘게요.'],
      ['night-life-note','느긋하게 메모 정리','📝','급한 건 없으니 한 줄씩 정리해요.'],
      ['night-life-idea','주말 아이디어 스케치','💡','이건 다음에 같이 해봐도 좋겠어요.']]],
    ['3f',['seoyun','dohyun','serin','yuri','arin'],[
      ['night-dev-code','모니터 앞 집중 코딩','💻','작게 고치고, 바로 확인할게요.'],
      ['night-dev-trace','조용한 실행 흐름 추적','🔎','이 연결부터 차근차근 따라가 볼게요.'],
      ['night-dev-note','키보드 옆 구현 메모','📝','이어 할 곳을 여기 적어둘게요.']]],
    ['4f',['hani','yuna','gaeun','mir','seongmin'],[
      ['night-exec-starlight','작은 별빛과 생각 정리','✨','밤의 메모를 차곡차곡 모으는 중.'],
      ['night-exec-page','조용히 다음 장 넘기기','📑','다음 장도 천천히 볼까요.'],
      ['night-exec-connection','생각 사이 연결 찾기','💭','이 생각은 어디로 이어질까요?']]]
  ];
  for(const [floor,ids,variants] of micro){
    const rows=variants.map(([id,title,emoji,speech])=>row(id,title,ids,emoji,speech,{home:true,windows:[['00:00','24:00']]}));
    for(const a of rows){
      a.frequencyFamilyId='ambient-'+floor;
      if(floor==='3f')a.actorOverrides={...a.actorOverrides,seoyun:{speech:'이 흐름이면 연결이 깔끔하겠네요.'},dohyun:{speech:a.performance.speech},serin:{speech:'자료 탭을 하나씩 맞춰볼게요.'},yuri:{speech:'바뀐 범위부터 다시 확인할게요.'},arin:{speech:'이 간격이면 읽기 편하겠어요.'}};
      if(floor==='4f'){a.actorOverrides.mir={pose:'stand',prop:'작은 빛·가상 카드',speech:a.id==='night-exec-starlight'?'별빛도 연결될까?':a.id==='night-exec-page'?'조금 더 볼게.':'이건 연결되네.'};a.actorOverrides.hani={speech:'지금 떠오른 건 메모만 해두자♡'};}
    }
    table.actions.push(...rows);
    table.families.push({id:'ambient-'+floor,sourceActionId:rows[0].id,memberActionIds:rows.map(a=>a.id),durationCeilingSeconds:14,
      limits:{scope:'floor',floor,cadenceSeconds:40,weekendCadenceSeconds:55,maxPerDay:2160,cooldownSeconds:30,probabilityPerDay:1,budget:'floor_microexpression'},parent:structuredClone(rows[0])});
  }
  const extras=[
    row('night-ramen','야식 라면 한 젓가락',['seoyun','dohyun','yuna','minji'],'🍜','국물은 뜨거우니까 천천히 먹어요.',{rest:true,anchor:'coffee_counter',windows:[['22:00','02:00']]}),
    row('night-store-bag','편의점 봉투 열기',['yuna','minji'],'🛍️','야식은 작은 걸로 골라왔어요.',{rest:true,home:true}),
    row('night-coffee-chat','커피 머신 앞 한마디',humans,'☕','머신 소리도 밤에는 크게 들리네요.',{rest:true,anchor:'coffee_counter'}),
    row('night-stretch-yawn','스트레칭하고 하품',humans,'🥱','기지개 한 번! 어깨도 풀어요.',{rest:true,home:true}),
    row('night-window-view','창밖 야경 보기',humans,'🌃','아직 켜진 창이 꽤 많네요.',{rest:true,home:true}),
    row('night-sofa-nap','잠깐 눈 붙이기',['yuna','minji'],'💤','눈만 잠깐 붙일게요…',{rest:true,home:true}),
    row('weekend-plant-water','주말 화분 물주기',['haru','naeun'],'🪴','흙부터 보고, 물은 조금만 줄게요.',{rest:true,anchor:'rooftop_garden',days:'주말',windows:[['00:00','24:00']]}),
    row('weekend-reading','주말 책 한 장',['hina','haru'],'📚','오늘은 마음에 드는 페이지부터 볼까요.',{rest:true,home:true,days:'주말',windows:[['00:00','24:00']]}),
    row('night-mir-stars','미르 별빛 데이터 정리',['mir'],'🌌','이 별과 저 별, 이어볼까?',{home:true}),
    row('weekend-route-doodle','수연의 주말 산책 지도',['sooyeon'],'🗺️','다음엔 이 길로 돌아가 봐요.',{rest:true,home:true,days:'주말',windows:[['00:00','24:00']]})
  ];
  for(const a of extras){
    if(a.id==='night-window-view'){
      a.targetResolution='explicit';a.performance.pose='stand';
      a.places=a.participants.map(personId=>{const floor=byId.get(personId).home.floor;return {personId,floor,anchorId:'window_'+floor+'_1'}});
    }
    table.actions.push(a);
    table.families.push({id:a.id,sourceActionId:a.id,memberActionIds:[a.id],durationCeilingSeconds:a.durationSeconds[1],
      limits:{scope:'person_action',maxPerDay:2,cooldownSeconds:14400,probabilityPerDay:.8,budget:'ambient'},parent:structuredClone(a)});
  }
  return table;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const original=JSON.parse(fs.readFileSync(new URL('../assets/data/office-actions-216.json',import.meta.url)));
  fs.writeFileSync(new URL('../assets/data/office-actions-221.json',import.meta.url),JSON.stringify(nightTable(original))+'\n');
}
