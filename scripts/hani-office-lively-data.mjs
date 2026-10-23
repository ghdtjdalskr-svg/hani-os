// Scene metadata only. Runtime reads these weights/words; it has no person-specific preference code.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const seed=read('data/hani-relationship-seed-v1.json');
// 232 onboarded these people before their relationship seed was authored.
// Use only existing archive areas/personality/tagline; do not invent hobbies.
const archive=createRequire(import.meta.url)('../hani-character-archive-data.js');
const onboardingEvidence=Object.fromEntries(['daon','yoonseul'].filter(id=>!seed.people.some(p=>p.id===id)).map(id=>{
 const p=archive.characters.find(p=>p.id===id);
 return [id,{source:'character-archive-232',interests:p.areas,quirks:p.sections.find(s=>s.label==='PERSONALITY').text.split('\n').map(s=>s.replace(/^-\s*/,'')),voice:p.tagline}];
}));
const profiles={
 seongmin:{prefer:{meeting:4,sofa:3,window:2},topic:'새 아이디어 떠올리는 중'},
 hani:{prefer:{meeting:4,sofa:3,window:2},topic:'다음 기획 범위 정리 중'},
 yuna:{prefer:{meeting:3,lobby:4,coffee:2},topic:'담당자 연결 순서 메모 중'},
 gaeun:{prefer:{meeting:5,window:2,coffee:2},topic:'다음 회의 준비사항 확인 중'},
 mir:{prefer:{window:3,meeting:3},topic:'사람들의 선택을 관찰 중'},
 seoyun:{prefer:{server:5,board:5,sofa:3},topic:'설계 영향 범위 짚어보는 중'},
 dohyun:{prefer:{server:5,board:4,sofa:3},topic:'재현한 버그 해결책 메모 중'},
 serin:{prefer:{server:4,board:5,sofa:3},topic:'반복 작업 자동화 아이디어 정리 중'},
 yuri:{prefer:{server:4,board:4,sofa:3},topic:'엣지 케이스 체크 중'},
 arin:{prefer:{window:4,sofa:4,board:2},topic:'모바일 사용 흐름 스케치 중'},
 jieun:{prefer:{coffee:4,meeting:3,window:2},topic:'쉬면서 구독 비용 비교 중'},
 haru:{prefer:{coffee:5,garden:4,window:3},topic:'간식 가격 비교 중'},
 naeun:{prefer:{garden:5,terrace:4,coffee:3},topic:'건강한 식단 이야기 생각 중'},
 hina:{prefer:{window:4,coffee:3,sofa:3},topic:'일본어 단어 복습 중'},
 minji:{prefer:{lobby:5,window:4,coffee:3},topic:'다음 콘텐츠 제목 생각 중'},
 sooyeon:{prefer:{window:5,terrace:4,garden:3},topic:'다음 여행 코스 구상 중'},
 sua:{prefer:{meeting:4,coffee:3,lobby:2},topic:'고객 후속 조치 확인 중'},
 taeo:{prefer:{meeting:4,coffee:3,window:2},topic:'고객 요구를 항목별로 정리 중'},
 daon:{prefer:{window:4,board:4,coffee:3},topic:'좋은 전망의 반대 근거도 살펴보는 중'},
 yoonseul:{prefer:{sofa:5,window:4,coffee:3},topic:'궁금한 주제의 읽을거리 정리 중'}
};
export function enrichPlaces(table){
 table.affinityEvidence={...Object.fromEntries(seed.people.map(p=>[p.id,{hobbies:p.hobbies,quirks:p.quirks,voice:p.voice}])),...onboardingEvidence};
 table.rhythm={morning:{hours:[9,10],weights:{coffee:3}},lunch:{hours:[11.5,13],weights:{coffee:9,terrace:15,garden:3}},sleepy:{hours:[15,16],weights:{window:3,coffee:3}},evening:{hours:[18,21],weights:{sofa:6}}};
 table.outingRules={cooldownSeconds:600,intervalSeconds:[1500,3000],intervalByPerson:{sua:[1200,2100],taeo:[1200,2100]},groupStayScale:1.2,workHours:[9,18]};
 table.companions=seed.relations.filter(r=>r.score>=74&&![r.a,r.b].some(id=>id==='mir'||id==='seongmin')).map(r=>({people:[r.a,r.b],score:r.score,type:r.type,evidence:r.story,topic:r.type==='멘토-멘티'?'멘토링 이야기':r.a==='seoyun'?'코드 리뷰 팁':'잠깐 수다'}));
 const staff=read('assets/data/office-actions-221.json').people.filter(p=>!['mir','seongmin'].includes(p.id));
 for(let i=0;i<staff.length;i++)for(let j=i+1;j<staff.length;j++)for(let k=j+1;k<staff.length;k++){
  const trio=[staff[i],staff[j],staff[k]];if(!trio.every(p=>p.home.floor===trio[0].home.floor))continue;
  const links=table.companions.filter(r=>r.people.every(id=>trio.some(p=>p.id===id)));
  if(links.length===3)table.companions.push({people:trio.map(p=>p.id),score:Math.min(...links.map(r=>r.score)),type:'친한 동료 셋',evidence:links.map(r=>r.evidence).join(' / '),topic:'함께 아이디어 나누는'});
 }
 const stays={coffee:[60,180],window:[40,120],sofa:[120,300],board:[60,180],server:[45,120],garden:[90,240],terrace:[90,240],lobby:[30,90],meeting:[90,240]};
 for(const p of table.places){
  if(p.id==='terrace-5f')p.kind='terrace';
  p.stay=stays[p.kind];p.affinity={};p.atByPerson={};
  const location=p.at[0].split('에서')[0];
  for(const [id,profile]of Object.entries(profiles)){
   p.affinity[id]=profile.prefer[p.kind]||1;
   const interests=seed.people.find(p=>p.id===id)?.hobbies||onboardingEvidence[id].interests;
   p.atByPerson[id]=[location+'에서 '+profile.topic,location+'에서 '+interests[0]+' 이야기 메모 중'];
  }
  if(p.id==='lobby-board')p.atByPerson.minji=['로비 게시판에서 하니일보 1면 다시 읽는 중','로비 게시판에서 다음 기사 제목 구상 중'];
  if(p.id==='pantry-2f'||p.id==='pantry-seats-2f')p.atByPerson.haru=['팬트리에서 간식 가격 비교 중','팬트리에서 신상 간식 가성비 확인 중'];
  if(p.kind==='server'){
   for(const id of ['seoyun','dohyun','serin','yuri'])p.atByPerson[id]=['서버 콘솔에서 '+profiles[id].topic];
  }
  if(p.kind==='window')p.at.push(location+'에서 창밖 멍때리는 중',location+'에서 창밖 구경 중');
  if(p.kind==='board')p.at.push('개발실 화이트보드에서 낙서 중');
  if(p.kind==='coffee')p.at.push(location+'에서 커피 한 잔 더 고민 중');
  p.at=[...new Set(p.at)];
  for(const list of Object.values(p.atByPerson)){
   if(p.kind==='window')list.push(location+'에서 창밖 멍때리는 중',location+'에서 창밖 구경 중');
   if(p.kind==='board')list.push('개발실 화이트보드에 낙서 중');
   if(p.kind==='coffee')list.push(location+'에서 커피 한 잔 더…');
  }
 }
 return table;
}
if(process.argv[1]?.endsWith('hani-office-lively-data.mjs')){
 const url=new URL('../data/hani-building/office-places.json',import.meta.url),raw=fs.readFileSync(url,'utf8'),eol=raw.includes('\r\n')?'\r\n':'\n';
 fs.writeFileSync(url,(JSON.stringify(enrichPlaces(JSON.parse(raw)),null,2)+'\n').replaceAll('\n',eol));
}
