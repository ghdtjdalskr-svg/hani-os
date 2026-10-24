import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {periods} from './hani-office-monotony.mjs';
import {readAt} from './hani-office-lively-fixture.mjs';
const dir='artifacts/office-behavior/',read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const sets=[read('obr8-monotony-230.json'),read('obr8-monotony-before.json'),read('obr8-monotony-after.json')];
for(const [i,ref]of [[0,'ad3c2f3'],[1,'84cadbd'],[2,null]])for(const r of sets[i]){
 assert.equal(r.sourceSha256,sha(readAt('hani-office-live.js',ref)));assert.equal(r.stepSeconds,1);assert.equal(r.storageWrites,0);assert.deepEqual(r.options,{chairmanPresent:true});assert.equal(r.windows.length,720);
}
const n=(v,d=2)=>v==null?'—':Number(v).toFixed(d),pct=v=>n(v*100)+'%',floors=['1f','2f','3f','4f','5f'];
const columns=[['평균 변화 간격',r=>r.avgGapSec,1],['최장 정지',r=>r.longestStaticSec,1],['동시 문구 종류',r=>r.visibleUniqueMean,-1],['1인당 동시 문구',r=>r.visibleUniquePerPerson,-1],['동시 문구 중복',r=>r.duplicateRate,1],['10분 문구 반복',r=>r.lineRepeatsPer10m,1],['1인당 10분 문구 반복',r=>r.peopleMean?r.lineRepeatsPer10m/r.peopleMean:null,1],['10분 장소 재도착',r=>r.placeRepeatsPer10m,1],['1인당 10분 장소 재도착',r=>r.peopleMean?r.placeRepeatsPer10m/r.peopleMean:null,1],['동일인 재등장 평균 간격',r=>r.samePersonRepeatGapMean,-1],['동일인 재등장 최소 간격',r=>r.samePersonRepeatGapMin,-1],['동일인 재등장 하위10% 간격',r=>r.samePersonRepeatGapP10,-1],['보행 비율',r=>r.shares.walking,-1],['무보행 1분 비율',r=>r.minutes?r.noWalkingMinutes/r.minutes:null,1],['화면 무변화 1분 비율',r=>r.minutes?r.noChangeMinutes/r.minutes:null,1]];
const regressions=[];
for(let day=0;day<2;day++)for(const floor of floors)for(const [period]of periods){
 const rs=sets.map(s=>s[day].records[floor][period]),flags=rs.slice(1).map(r=>columns.filter(([,get,d])=>get(rs[0])!=null&&get(r)!=null&&d*(get(r)-get(rs[0]))>1e-9).map(([label])=>label));
 regressions.push({day:sets[0][day].day,floor,period,transient:floor==='5f'||floor==='2f'&&period==='심야',obr7:flags[0],obr8:flags[1]});
}
fs.writeFileSync(dir+'obr8-regressions.json',JSON.stringify(regressions,null,2)+'\n');
const lines=['# obr8 — 운영230 / obr7 / obr8 단조로움 비교','','2026-10-23 KST · 도연(Codex). 평일 2026-10-22 및 주말 2026-10-24, 각 00:00–24:00 KST 매초. 3개 구현 × 2일 = **518,400 snapshot**.','','같은 fixture·chairmanPresent=true·일반 모션, 버전별 실제 공간 자산. 230은18명, obr7/obr8은20명(다온·윤슬 추가); 방문객 별도. 230/obr7 결과는 동일 source SHA·환경·sampler의 obr7 실측을 재사용했고, obr8은 새 source로 172,800 snapshot을 실행했다.','','화면 변화 signature는 id·line·pose·seat.anchor·walking이며 XY 매 프레임 차이로 부풀리지 않는다. CSS/픽셀 브라우저 검증은 별도다. 문구 반복은 새 표시 시작마다 집계하며 연속 표시를 매초 중복으로 세지 않는다. 장소는 실제 도착 anchor 재방문(230에 카드 catalog 없음); 무보행 1분은 재실 직원이 있고 walking이 단1초도 없는 정렬 60초 창이다. 방문객 보행은 직원 보행 비율에 포함하지 않는다. 비율은 person-seconds, 5종 구성은 겹치므로 합이100%가 아니다. 오전·점심 일부 중첩.','','errand는 별도 kind이며 8–25초 체류·왕복60초 이하. 기존 휴식 카드·정식 외출 체류 하한은 그대로다. 일별 행동에는 errand-colleague/delivery/notice를 실제 발생 때만 추가했다. 기존 정식 actionId 수 증가를 의미하지 않는다.','','**2F 심야·5F는 상주자가 거의 없으므로 별도 구간**이다. 빈 화면 정지를 근무층의 움직임과 동일하게 해석하지 않는다.','','## 층별·시간대별 실측'];
const tables=[
 ['화면 변화·인원','평균/최대 재실명; 평균 변화간격/최장 정지 초; 변화/1인·분',r=>`${n(r.peopleMean)}/${r.peopleMax}; ${n(r.avgGapSec)}/${r.longestStaticSec}s; ${n(r.changesPerPersonMinute)}`],
 ['동시 다양성','평균 서로 다른 문구/1인당; 동시 중복률',r=>`${n(r.visibleUniqueMean)}/${n(r.visibleUniquePerPerson)}; ${pct(r.duplicateRate)}`],
 ['10분 반복','문구 반복/10분(1인당); 장소 재도착/10분(1인당); 동일인 문구 간격 평균/최소/P10 초',r=>`${n(r.lineRepeatsPer10m)}(${n(r.peopleMean?r.lineRepeatsPer10m/r.peopleMean:null)}); ${n(r.placeRepeatsPer10m)}(${n(r.peopleMean?r.placeRepeatsPer10m/r.peopleMean:null)}); ${n(r.samePersonRepeatGapMean,0)}/${n(r.samePersonRepeatGapMin,0)}/${n(r.samePersonRepeatGapP10,0)}`],
 ['움직임 5종','서기 / 보행 / 외출(errand 포함) / 동행 / 정식 (%)',r=>Object.values(r.shares).map(v=>n(v*100)).join(' / ')],
 ['무보행 1분·방문객','직원 무보행분 / 화면 무변화분 / 재실분; 방문객 새 등장/표시 초',r=>`${r.noWalkingMinutes}/${r.noChangeMinutes}/${r.minutes}; ${r.visitorEpisodes}/${r.visitorSeconds}`]
];
for(const transient of [false,true]){
 lines.push('',transient?'## 희소 재실: 2F 심야·5F':'## 근무층');
 for(let day=0;day<2;day++)for(const [title,unit,fmt]of tables){
  lines.push('',`### ${sets[0][day].day} · ${title}`,'',unit,'','|층 · 시간대|230|obr7|obr8|','|---|---:|---:|---:|');
  for(const f of floors)for(const [period]of periods)if((f==='5f'||f==='2f'&&period==='심야')===transient)lines.push(`|${f.toUpperCase()} ${period}|${sets.map(s=>fmt(s[day].records[f][period])).join('|')}|`);
 }
}
lines.push('','## 하루 사람별 다양성','','문구 / 도착 anchor / 행동 종류. ↓는230보다 적은 값. 230 다온·윤슬은 미등록(—).');
for(let day=0;day<2;day++){
 lines.push('',`### ${sets[0][day].day}`,'','|사람|230|obr7|obr8|','|---|---:|---:|---:|');
 for(const p of sets[2][day].daily){const ps=sets.map(s=>s[day].daily.find(q=>q.id===p.id)),fmt=(r,i)=>r?['lines','places','actions'].map(k=>r[k].length+(i&&ps[0]&&r[k].length<ps[0][k].length?'↓':'')).join('/'):'—';lines.push(`|${p.name} (${p.home})|${ps.map(fmt).join('|')}|`)}
}
lines.push('','## 230 대비 열세를 숨기지 않는 표','','15개 지표에 이전과 동일한 방향·임계0을 적용. 근무층과 희소 재실을 구분하고 여러 지표를 한 점수로 상쇄하지 않는다. 새 용무가 같은 anchor로 자주 돌아오면 장소 재도착 지표는 올라갈 수 있다.','','|날짜 · 층 · 시간대|구분|obr7 열세|obr8 열세|','|---|---|---|---|');
for(const r of regressions.filter(r=>r.obr7.length||r.obr8.length))lines.push(`|${r.day} ${r.floor} ${r.period}|${r.transient?'희소 재실':'근무층'}|${r.obr7.join(' · ')||'없음'}|${r.obr8.join(' · ')||'없음'}|`);
lines.push('','## 녹화 추천','','2026-10-22 1F 10:00–10:10(손님/업무 용무), 3F 15:00–15:10(협업 방문), 4F 18:00–18:10(야간 자리 변경 후 문 앞 전달). 주말은 2026-10-24 3F 13:40–13:50.','','`node scripts/hani-office-lively-record.browser.mjs --floor 3f --minutes 10 --label obr8-after-1500 --start 2026-10-22T15:00:00+09:00`','수정 전은 `--ref 84cadbd --label obr8-before-1500`, 운영230은 `--ref ad3c2f3 --label obr8-230-1500`. 실제 녹화·픽셀 검증은 이번 Node 실측에 포함하지 않았다.','','재현: `node scripts/hani-office-monotony.mjs --run obr8 -o artifacts/office-behavior/obr8-monotony-after.json` → `node scripts/hani-office-obr8-compare.mjs`. obr7 재실행은 `--run obr7` 사용. 상세 10분 창은 각 JSON의 windows에 보존.');
fs.writeFileSync(dir+'monotony-compare.md',lines.join('\n')+'\n');
const summary={전체구간:regressions.length,obr7_열세구간:regressions.filter(r=>r.obr7.length).length,obr8_열세구간:regressions.filter(r=>r.obr8.length).length,근무층:regressions.filter(r=>!r.transient).map(r=>({...r})),희소재실:regressions.filter(r=>r.transient)};
fs.writeFileSync(dir+'obr8-compare-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log('230 대비 열세 구간',summary.obr7_열세구간,'→',summary.obr8_열세구간);
