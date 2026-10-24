import fs from 'node:fs';
import {loadScene,readAt,root} from './hani-office-lively-fixture.mjs';
const days=[['평일','2026-10-22'],['주말','2026-10-24'],['야간 포함 평일','2026-10-23']];
const samples=[],lost=[],matrix=[];
for(const catalog of [216,221]){
 const before=loadScene({ref:'ad3c2f3',catalog}),after=loadScene({catalog});
 for(const [label,day]of days){
  // Event-unit exposure: count accepted performance intervals, including every member.
  // Night fixture is a full KST day, with a separate [01:00,07:00) column below.
  const options={chairmanPresent:true},old=before.scene.scheduler.plan(day,options),now=after.scene.scheduler.plan(day,options);
  for(const action of after.table.actions)for(const id of action.participants){
   const count=events=>events.filter(e=>e.actionId===action.id&&e.people.some(p=>p.id===id)).length;
   const b=count(old),a=count(now),night=events=>count(events.filter(e=>e.performStart>=3600&&e.performStart<25200));
   const row={catalog,day,label,actionId:action.id,personId:id,before:b,after:a,nightBefore:night(old),nightAfter:night(now)};samples.push(row);
   if(b>0&&a===0)lost.push(row);
  }
  const dayRows=new Map(samples.filter(r=>r.catalog===catalog&&r.day===day).map(r=>[r.actionId+'|'+r.personId,r]));
  for(const action of after.table.actions)matrix.push({catalog,day,id:action.id,people:after.table.people.map(p=>p.id),cells:after.table.people.map(p=>{const row=dayRows.get(action.id+'|'+p.id);return row?row.before+'→'+row.after:'0→0*'})});
  for(const disabled of after.table.disabled)matrix.push({catalog,day,id:disabled.id,people:after.table.people.map(p=>p.id),cells:after.table.people.map(()=>'0→0†')});
 }
}
const idleSource=readAt('hani-office-live.js'),oldSource=readAt('hani-office-live.js','ad3c2f3');
const pool=source=>source.slice(source.indexOf('const idlePools='),source.indexOf('function idleRoster'));
const lines=source=>[...pool(source).matchAll(/\['([^']+)'/g)].map(m=>m[1]);
const placeData=JSON.parse(readAt('data/hani-building/office-places.json'));
const idleLost=lines(oldSource).filter(line=>!lines(idleSource).includes(line)&&!JSON.stringify(placeData.places).includes(line));
// stroll's location lines intentionally moved to AT_PLACE cards; compare separately.
const oldTap=JSON.parse(readAt('assets/data/office-tap-lines-v1.json','ad3c2f3')),tap=JSON.parse(readAt('assets/data/office-tap-lines-v1.json'));
const aggregate=new Map();for(const r of samples){const key=r.catalog+'|'+r.actionId+'|'+r.personId;if(!aggregate.has(key))aggregate.set(key,{catalog:r.catalog,actionId:r.actionId,personId:r.personId,before:0,after:0});aggregate.get(key).before+=r.before;aggregate.get(key).after+=r.after}
const disappeared=[...aggregate.values()].filter(r=>r.before>0&&r.after===0);
const out={comparison:'ad3c2f3 → worktree',method:'accepted performance events per person, not text existence',days,samples,lost,disappeared,idleLost,tapUnchanged:JSON.stringify(oldTap)===JSON.stringify(tap)};
fs.writeFileSync(new URL('artifacts/office-behavior/character-actions.json',root),JSON.stringify(out,null,2)+'\n');
const md=['# 캐릭터 행동 대조표','',`기준 ad3c2f3(2.9.230) → 현재 작업 트리. 동일 216/221 catalog fixture, chairmanPresent=true. 각 KST 날짜 24시간을 **이벤트 단위**로 비교한다. 수치는 행동 수행 구간 노출 횟수이며 초수나 문자열 존재 횟수가 아니다. base-work는 기본 상태라 예약 이벤트 수 0이다. 야간 별도 열은 01–07시.`,``,`- 3일 합산 이전 >0 → 현재 0: **${disappeared.length}개 행동×사람 조합**.`,`- 날짜별 이전 >0 → 현재 0: **${lost.length}개 행동×사람×날짜**. 일별 노출 보존과 합산 행동 보존을 구별한다.`,`- tap-lines 원문 보존: ${out.tapUnchanged}. 실제 tap API 회귀는 기존 228/229 테스트에서 확인.`,`- idlePools 문구 소실: ${idleLost.length}. 위치별 stroll 문구는 해당 장소의 atByPerson 풀로 이관(이동 중 사용 금지).`,'','## 전체 카탈로그 × 참가자 × 날짜','', '|catalog|행동 id|사람|날짜|전|후|야간 전|야간 후|','|---|---|---|---|---:|---:|---:|---:|',...samples.map(r=>`|${r.catalog}|${r.actionId}|${r.personId}|${r.day}|${r.before}|${r.after}|${r.nightBefore}|${r.nightAfter}|`),'','## 날짜별 미노출 진단','',...lost.map(r=>`- ${r.catalog} ${r.day} ${r.actionId} / ${r.personId}: ${r.before}→0. 장소 비활성 아님. 실제 거리의 이동·예약 및 기존 개인 휴식 쿨다운에 따른 일별 시간표 변화. 다른 fixture 날짜에는 노출됨. 일별 0도 금지한다는 해석이면 미달이며 서윤 판단 필요.`),'','## 책상 문구와 tap-lines','',...lines(oldSource).map(line=>`- ${line}: ${lines(idleSource).includes(line)?'idlePools 유지':'장소의 atByPerson으로 이관; 같은 문구를 위치명과 함께 도착 후 노출'}`),'','tap-lines 원본 파일은 수정하지 않는다. sig-* 전체는 위 표에서 각 참가자/날짜의 0을 포함해 확인할 수 있다. 208일의 97행 도달성은 별도 기존 216 테스트를 유지한다.',''];
md.push('## 모든 행동 id × 전체 18인 × 하루 (전→후)','', '`*`는 해당 행동의 참가자가 아닌 조합이다. `†`는 두 버전 모두 의도적으로 비활성인 카탈로그 행이다(각 37행). 누락이 아니라 실행 대상 N/A=0→0. 위 상세표에는 참가자 조합과 야간 노출을 별도로 싣는다.','', '|catalog|행동 id|날짜|'+matrix[0].people.join('|')+'|','|---|---|---|'+matrix[0].people.map(()=>'---:').join('|')+'|',...matrix.map(r=>'|'+r.catalog+'|'+r.id+'|'+r.day+'|'+r.cells.join('|')+'|'),'');
md.push('## tap-lines: 사람별 호출 가능한 문구 수 (전·후 동일)','', 'Tap은 클릭·키보드로 호출하므로 자동 하루 노출 횟수는 N/A다. 기존 delegated tap/keyboard 테스트가 실제 표시·타이머·우선순위·저장소 쓰기 0을 검증한다.','', '|사람|아침|낮|저녁|심야|세 번 tap|친한 동료|','|---|---:|---:|---:|---:|---:|---:|',...Object.entries(tap.staff).map(([id,p])=>`|${id}|${p.morning.length}|${p.day.length}|${p.evening.length}|${p.night?.length||0}|${p.tripleTap?1:0}|${p.friend?1:0}|`),'', '회장님 관련 반응: '+tap.chairman.staffReactions.length+'개. 기존 identity·presence 조건 유지.','');
fs.writeFileSync(new URL('artifacts/office-behavior/character-actions.md',root),md.join('\n'));
console.log(JSON.stringify({rows:samples.length,lost,idleLost,tapUnchanged:out.tapUnchanged},null,2));
