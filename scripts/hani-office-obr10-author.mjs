// Explicit data authoring. Never called by tests or the runtime.
import fs from 'node:fs';
const file='data/hani-building/office-places.json',p=JSON.parse(fs.readFileSync(file,'utf8'));
const source=fs.readFileSync('hani-office-live.js','utf8');
const old=Object.fromEntries([...source.slice(source.indexOf('const legacyDeskVoice=')>=0?source.indexOf('const legacyDeskVoice='):source.indexOf('const deskVoice='),source.indexOf('const extraIdle=')).matchAll(/(\w+):\[([^\n]+)\]/g)].map(m=>[m[1],[...m[2].matchAll(/'([^']+)'/g)].map(x=>x[1])]));
const extra={
 hani:['아이디어 별명 붙이며 웃는 중','칭찬 캡처 다시 펼쳐보는 중','기획 제목 세 개 중 고르는 중','AI 팀 이름 상상하는 중','투자 책 접어 둔 문장 읽는 중','장난 섞인 응원 한 줄 쓰는 중'],
 yuna:['제가요?! 메모에 느낌표 그리는 중','알림 색깔별로 접어 보는 중','받은 부탁 포스트잇 접는 중','오늘 배운 줄임말 외우는 중','선배 농담 이제 이해한 중','정리 잘된 목록 보고 뿌듯한 중'],
 gaeun:['달력 빈칸에 작은 별 그리는 중','펜 색깔 요일별로 맞추는 중','준비물 체크 리듬 타는 중','한 번에 끝낼 순서 퍼즐 푸는 중','알람 이름 짧게 바꾸는 중','일정 겹침 없는지 혼자 퀴즈 중'],
 mir:['왜 웃었을까 질문 적는 중','농담과 사실 구분 연습 중','같은 말 다른 뜻 비교 중','새로 배운 감정 이름 붙이는 중','관찰과 추측 색깔 나누는 중','왜라는 질문 하나 남기는 중'],
 seongmin:['AI 아이디어 열 번째 적는 중','읽던 투자 책 밑줄 긋는 중','다음 영화 예고편 고르는 중','일본어 발음 작게 따라하는 중','스포츠 하이라이트 다시 보는 중','직접 해볼 실험 하나 고르는 중'],
 seoyun:['화살표 모양 낙서하는 중','설계 퍼즐 한 조각 맞추는 중','AI 실험 이름 지어 보는 중','복잡한 그림 접어 보는 중','설명 연습하다 작게 웃는 중','아이디어 연결선 색 고르는 중'],
 dohyun:['버그 별명 붙이는 중','단축키 손가락으로 연습 중','초록 테스트 보고 혼자 웃는 중','자동화 장난감 구상하는 중','괄호 짝 맞추기 퀴즈 중','재현 성공 기념 낙서 중'],
 serin:['숫자 패턴 빙고 만드는 중','그래프 색 조합 고르는 중','주사위 확률 혼자 맞히는 중','실험 이름에 말장난 넣는 중','반복 횟수 세다 웃는 중','자동화할 사소한 습관 적는 중'],
 yuri:['체크박스 똑같이 그리는 중','틀린 그림 찾듯 다시 보는 중','예외 퀴즈 혼자 출제 중','확인 도장 모양 낙서 중','통과 소식 보고 살짝 웃는 중','아직 모르는 것 따로 접는 중'],
 arin:['아이콘 표정 낙서하는 중','작은 글씨 눈 가늘게 보는 중','예쁜 색 세 가지 고르는 중','버튼 이름 소리 없이 읽는 중','손가락으로 사용 순서 그리는 중','좋아하는 화면 캡처 넘기는 중'],
 jieun:['영수증 합계 암산 놀이 중','절약한 금액 동그라미 치는 중','예산 숫자 끝자리 맞추는 중','구독 하나 줄일까 고민 중','계산기 리듬 타는 중','작은 흑자 보고 웃는 중'],
 haru:['장바구니 찜 순서 바꾸는 중','전자기기 후기 별점 세는 중','쿠폰 만료 날짜 확인 중','읽던 소설 주인공 떠올리는 중','생활용품 색깔 고르는 중','사고 싶은 것 하루 더 참는 중'],
 naeun:['발목 천천히 돌리는 중','호흡 네 번 세는 중','운동 기록 작은 하트 그리는 중','단백질 식단 사진 넘기는 중','물 마실 시간 손짓하는 중','어깨 올렸다 힘 빼는 중'],
 hina:['헷갈린 일본어 발음 따라하는 중','한자 획순 손가락으로 쓰는 중','JLPT 오답에 별 그리는 중','맞힌 단어 자랑 참는 중','짧은 일본어 인사 흥얼거리는 중','학습 스티커 한 장 고르는 중'],
 minji:['영화 엔딩 떠올리며 웃는 중','리뷰 별점 반 개 고민 중','드라마 명대사 작게 따라하는 중','촬영 구도 손으로 그리는 중','기사 제목 말장난 고르는 중','다음 OTT 볼거리 찜하는 중'],
 sooyeon:['여행 지도 별 스티커 붙이는 중','자전거 코스 거리 재는 중','경기 득점 장면 다시 보는 중','여권 커버 색 고르는 중','다음 여행 사진 순서 바꾸는 중','응원 구호 소리 없이 따라하는 중'],
 sua:['고객 감사 인사 다시 읽는 중','문서 제목 말끔히 줄이는 중','잘 끝난 후속 조치 별표 중','칭찬 답장 썼다 지우는 중','메모 묶음 모서리 맞추는 중','웃는 이모티콘 하나 고르는 중'],
 taeo:['요구사항 퍼즐 맞추는 중','어려운 용어 쉬운 말 퀴즈 중','기획 이름 후보 적는 중','고객 표현 말풍선 그리는 중','설명 세 문장으로 줄이는 중','해결한 요청에 별 그리는 중'],
 daon:['지표 반대 해석 낙서하는 중','하락 가정 숫자 암산 중','좋은 전망에 물음표 붙이는 중','위험 신호 색연필 고르는 중','투자 메모 제목 바꾸는 중','틀릴 가능성 하나 더 적는 중'],
 yoonseul:['러닝 기록 초 단위 비교 중','책 속 질문 책갈피 접는 중','배운 개념 연결 그림 그리는 중','다음 달리기 음악 고르는 중','독서 메모 별표 세는 중','궁금한 낱말 뜻 찾아보는 중']
};
const roster=JSON.parse(fs.readFileSync('assets/data/office-actions-221.json','utf8')).people;
const seed=JSON.parse(fs.readFileSync('data/hani-relationship-seed-v1.json','utf8'));
p.behavior={deskVoice:{},deskPairs:[],moments:[
 {id:'arrival',hours:[9,9.5],lines:['좋은 아침 인사하는 중','아침 물 한 모금 마시는 중','아침 할 일 펼쳐 보는 중']},
 {id:'lunch',hours:[11.5,13],lines:['점심 알림 보고 메뉴 묻는 중','같이 먹을 사람 손 들어 보는 중','점심 약속 시간 확인 중']},
 {id:'sleepy',hours:[15,16],lines:['졸음 깨려고 팔 쭉 펴는 중','어깨 천천히 돌리는 중','눈 감고 열까지 세는 중']},
 {id:'leaving',hours:[17.5,19],lines:['가방 지퍼 챙기는 중','내일 보자 손 흔드는 중','오늘 수고했다고 인사하는 중']},
 {id:'night-snack',hours:[21,24],lines:['야근 간식 봉지 여는 중','야식 나눌 사람 묻는 중','따뜻한 차 한 모금 마시는 중']}
],signatures:{},travelVoice:{},pairDailyMax:2,gathering:{kinds:['terrace','garden','coffee','sofa'],joinWeight:24,sameFloorWeight:2,maxScale:1.5,trioMaxSeconds:480,phrases:['수다 중','이야기 나누는 중','웃으며 대화 중']},visitorHosts:['yuna','taeo'],visitorReply:'안내 감사합니다',visitorHostLine:'방문객 요청 확인 중'};
const themes={};
for(const person of roster){
 const id=person.id,profile=seed.people.find(q=>q.id===id),lines=[...(old[id]||[]),...extra[id]];
 const hobbies=(profile?.hobbies|| (id==='daon'?['지표','투자 메모','위험 가정']:['독서','러닝 기록','배운 개념'])).map(s=>s.replace('산책','건강 루틴'));
 p.behavior.deskVoice[id]=[...new Set([...lines,...hobbies.flatMap(h=>[h+' 퀴즈 혼자 풀어 보는 중',h+' 메모에 작은 별 그리는 중',h+' 다음 아이디어 세 개 적는 중',h+' 기록 순서 바꿔 보는 중'])])];
 const cards=[p.places.find(c=>c.id==='window-'+person.home.floor),p.places.find(c=>c.floor===person.home.floor&&['sofa','coffee'].includes(c.kind))].filter(Boolean);
 themes[id]=profile?.hobbies|| (id==='daon'?['지표 메모','반대 근거']:['러닝 기록','독서 질문']);
 p.behavior.travelVoice[id]=[themes[id][0].replace('산책','건강 루틴')+' 메모 챙겨 자리로 돌아가는 중',person.name+' 노트 접고 자리로 돌아가는 중',person.name+' 다음 할 일 떠올리며 자리로 돌아가는 중'];
 p.behavior.signatures[id]=cards.map((c,i)=>({id:'signature-'+id+'-'+i,place:c.id,task:themes[id][i%themes[id].length]+' 메모 펼쳐 보는 중',evidence:profile?{voice:profile.voice,hobbies:profile.hobbies}:{voice:lines[0],hobbies:themes[id]}}));
}
// Personal sentences are owned by one person. Shared hobby templates must not
// make the deduplication pass replace half of a ten-second desk episode.
const claimedDeskLines=new Set();
for(const id of Object.keys(p.behavior.deskVoice))p.behavior.deskVoice[id]=p.behavior.deskVoice[id].filter(line=>{if(claimedDeskLines.has(line))return false;claimedDeskLines.add(line);return true});
// Explicit, complementary desk conversations; only physically adjacent home pairs qualify at runtime.
for(const [people,lines]of [
 [['jieun','daon'],['다온이랑 숫자 맞춰 보는 중','지은 언니 계산 확인 중']],
 [['seoyun','dohyun'],['도연이랑 설계 질문 나누는 중','서윤 선배 설명 듣는 중']],
 [['yuri','arin'],['아린이랑 확인 순서 맞추는 중','유리랑 작은 화면 이야기 중']],
 [['hina','naeun'],['나은이랑 일본어 인사 연습 중','히나 발음 따라 해보는 중']],
 [['sua','taeo'],['채원이랑 고객 메모 맞추는 중','수아 선배 조언 듣는 중']]
])p.behavior.deskPairs.push({people,lines});
for(const pair of p.companions)if(pair.people.includes('seoyun')&&pair.people.some(id=>['dohyun','yuri'].includes(id)))pair.topic='설계 멘토링 이야기';
if(!p.companions.some(r=>r.people.join('|')==='jieun|daon'))p.companions.push({people:['jieun','daon'],score:86,type:'멘토링',topic:'지표 확인 멘토링 이야기',evidence:'지은의 비용 검토와 다온의 반대 근거 확인을 연결한 대표님 obr10 지정 멘토링'});
p.companions=p.companions.filter((r,i,all)=>all.findIndex(q=>q.people.join('|')===r.people.join('|'))===i);
p.errands=[
 {id:'reservation-2f',floor:'2f',room:'team_meeting',slots:['door_team_meeting'],go:'회의실 예약 확인하러 가는 중',at:['회의실 문 앞에서 예약 확인 중','회의실 문 앞에서 다음 일정 확인 중']},
 {id:'reservation-3f',floor:'3f',room:'release',slots:['door_release'],go:'회의실 예약 확인하러 가는 중',at:['회의실 문 앞에서 예약 확인 중','회의실 문 앞에서 다음 일정 확인 중']},
 {id:'reservation-4f',floor:'4f',room:'exec',slots:['door_exec'],go:'회의실 예약 확인하러 가는 중',at:['회의실 문 앞에서 예약 확인 중','회의실 문 앞에서 다음 일정 확인 중']},
 {id:'whiteboard-3f',floor:'3f',room:'standup',slots:['standup_room'],go:'화이트보드 메모 남기러 가는 중',at:['화이트보드 앞에서 전달 메모 남기는 중','화이트보드 앞에서 결정 사항 적는 중']},
 {id:'parcel-1f',floor:'1f',room:'lobby',slots:['parcel_box'],go:'택배 받으러 가는 중',at:['택배함 앞에서 수령인 확인 중','택배함 앞에서 물품 받는 중']},
 {id:'server-3f',floor:'3f',room:'server',slots:['server-console'],go:'서버실 잠깐 확인하러 가는 중',at:['서버실에서 로그 확인 중','서버실에서 상태 표시 확인 중']}
].map(c=>({...c,id:'task-'+c.id,kind:'errand',errandKind:'task',pose:'stand',stay:[8,25]}));
const canon=JSON.parse(fs.readFileSync('data/hani-building/spatial-contract.json','utf8')),art=JSON.parse(fs.readFileSync('data/hani-building/art-map-v1.json','utf8'));
for(const a of canon.anchors)if(a.floor==='1f'&&a.type==='junction'&&['parcel_box','reception','coffee_counter','client_booth_slot_2','client_booth_slot_4'].some(id=>{
 const b=canon.anchors.find(b=>b.id===id),x=art.anchors[a.id],y=art.anchors[id];return b?.room===a.room&&x&&y&&Math.hypot((x.x-y.x)*16.72,(x.y-y.y)*9.41)>=40&&Math.hypot((x.x-y.x)*16.72,(x.y-y.y)*9.41)<=160;
}))p.errands.push({id:'visitor-host-'+a.id,hostOnly:true,kind:'errand',errandKind:'task',floor:'1f',room:a.room,slots:[a.id],pose:'stand',stay:[8,25],go:'방문객 안내하러 가는 중',at:[p.behavior.visitorHostLine]});
// Signature tasks keep the already mapped location prefix and rest minimums.
for(const [id,sigs]of Object.entries(p.behavior.signatures))for(const s of sigs){const c=p.places.find(c=>c.id===s.place);c.atByPerson[id].push(c.at[0].split('에서')[0]+'에서 '+s.task)}
for(const c of p.places)for(const id of Object.keys(c.atByPerson||{}))c.atByPerson[id]=[...new Set(c.atByPerson[id])];
for(const c of p.places)if(c.slots.length>=2&&p.behavior.gathering.kinds.includes(c.kind))c.gatheringPhrases=p.behavior.gathering.phrases;
fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
console.log('obr10 data: desk people',Object.keys(p.behavior.deskVoice).length,'signatures',Object.values(p.behavior.signatures).flat().length,'errands',p.errands.length);
