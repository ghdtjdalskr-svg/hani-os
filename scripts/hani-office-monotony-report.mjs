import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {periods} from './hani-office-monotony.mjs';
import {loadScene} from './hani-office-lively-fixture.mjs';
const dir='artifacts/office-behavior/',read=n=>JSON.parse(fs.readFileSync(dir+n,'utf8'));
const sets=[read('obr7-monotony-230.json'),read('obr7-monotony-before.json'),read('obr7-monotony-after.json')];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(sets[2][0].sourceSha256,sha(fs.readFileSync('hani-office-live.js')));
assert.equal(sets[1][0].sourceSha256,sha(fs.readFileSync(dir+'obr7-before.js')));
for(const set of sets)for(const r of set){assert.equal(r.stepSeconds,1);assert.equal(r.storageWrites,0);assert.deepEqual(r.options,{chairmanPresent:true});assert.equal(r.windows.length,720);}
const n=(v,d=2)=>v==null?'—':Number(v).toFixed(d),pct=v=>n(v*100)+'%',per=(v,r)=>r.peopleMean?v/r.peopleMean:null;
const time=s=>[Math.floor(s/3600),Math.floor(s/60)%60,Math.floor(s)%60].map(v=>String(v).padStart(2,'0')).join(':');
const floors=['1f','2f','3f','4f','5f'];
const columns=[
 ['평균 변화 간격','avgGapSec',1],['최장 정지','longestStaticSec',1],
 ['동시 문구 종류','visibleUniqueMean',-1],['1인당 동시 문구','visibleUniquePerPerson',-1],['동시 문구 중복','duplicateRate',1],
 ['10분 문구 반복','lineRepeatsPer10m',1],['1인당 10분 문구 반복',r=>per(r.lineRepeatsPer10m,r),1],
 ['10분 장소 재도착','placeRepeatsPer10m',1],['1인당 10분 장소 재도착',r=>per(r.placeRepeatsPer10m,r),1],
 ['동일인 재등장 평균 간격','samePersonRepeatGapMean',-1],['동일인 재등장 최소 간격','samePersonRepeatGapMin',-1],['동일인 재등장 하위10% 간격','samePersonRepeatGapP10',-1],
 ['보행 비율',r=>r.shares.walking,-1],['무보행 1분 비율',r=>r.minutes?r.noWalkingMinutes/r.minutes:null,1],['화면 무변화 1분 비율',r=>r.minutes?r.noChangeMinutes/r.minutes:null,1]
 ];
const labelMap=Object.fromEntries(columns.map(([label])=>[label,label]));
const regressions=[];
// Release230 had short strolls, no place-card catalog. Keep its common physical
// slot proxy above and publish actual current card-id repeats separately.
const cardRows=[];
for(const [index,label]of [[1,'전'],[2,'후']])for(const day of ['2026-10-22','2026-10-24']){
 const {scene}=loadScene({transform:index===1?()=>fs.readFileSync(dir+'obr7-before.js','utf8'):s=>s}),s=scene.scheduler;
 const formal=s.plan(day,{chairmanPresent:true}),events=s.blockPlan(day,0,formal,{chairmanPresent:true}).filter(e=>!e.visitor);
 for(const floor of floors)for(let start=0;start<86400;start+=600){
  const arrivals=events.flatMap(e=>e.people.filter(t=>scene.anchors.get(t.seat.anchor).floor===floor).map(t=>({card:e.card.id,id:t.id,at:t.out.at(-1).end}))).filter(a=>start<=a.at&&a.at<start+600).sort((a,b)=>a.at-b.at);
  const seen=new Set();let repeats=0;for(const a of arrivals){if(seen.has(a.card))repeats++;seen.add(a.card)}
  cardRows.push({label,day,floor,start,end:start+600,arrivals:arrivals.length,repeats,distinctCards:seen.size});
 }
}
assert.deepEqual(cardRows.filter(r=>r.label==='전').map(({label,...r})=>r),cardRows.filter(r=>r.label==='후').map(({label,...r})=>r),'physical card histories unchanged');
fs.writeFileSync(dir+'obr7-place-card-repeats.json',JSON.stringify({release230:'N/A: placeId catalog did not exist; use common destination-slot proxy',rows:cardRows},null,2)+'\n');
for(let day=0;day<2;day++)for(const f of floors)for(const [period]of periods){
 const rs=sets.map(s=>s[day].records[f][period]);
 const flags=rs.slice(1).map(r=>columns.filter(([,key,direction])=>{const value=typeof key==='function'?key:r=>r[key],a=value(rs[0]),b=value(r);return a!=null&&b!=null&&direction*(b-a)>1e-9}).map(([label])=>labelMap[label]));
 if(flags.some(v=>v.length))regressions.push({day:sets[0][day].day,floor:f,period,before:flags[0],after:flags[1],transient:rs.some(r=>r.peopleMean<.5)});
}
const lines=[
 '# obr7 — 운영230 / 수정 전 obr6 / 수정 후 단조로움 비교',
 '',
 '2026-10-23 KST · 도연(Codex). 2026-10-22(평일), 2026-10-24(주말)를 각 00:00:00–23:59:59 KST 매초 실행했다. 총 **518,400 snapshot**(3개 구현×2일×86,400초).',
 '',
 '## 조건과 해석',
 '',
 '- 같은 loadScene fixture·KST clock·chairmanPresent=true·일반 모션·전체 명부. 운영230은 ad3c2f3의 runtime/행동표/공간/아트/manifest 원본을 사용했다(7개 Git blob 일치). 각 버전에 맞는 실제 공간 자산을 사용하므로 runtime 단독 A/B가 아니라 실제 배포 동작 비교다. 수정 전/후는 공간·catalog가 완전히 같다.',
 '- 명부는 230 **18명**, 현재 **20명**(다온·윤슬 추가). 재실 인원에는 회장님과 MIR을 포함하며 방문객은 제외한다. 화면 변화에는 방문객도 포함한다. 원본 report의 actor 19/21은 방문객 슬롯까지 포함한 수다.',
 '- 표의 인원은 평균/최대다. 1인당 값은 매초 재실 인원 또는 평균 재실 인원으로 나눈다. 재실이 0인 초의 동시 문구/인원은 0. 2F 심야·5F는 거의 비어 있고 잠깐 방문하므로 긴 빈 화면 정지가 포함됨을 주의한다.',
 '- 화면 변화는 기존 lively signature: id·line·pose·seat.anchor·walking 변화다. 매 프레임 XY 차이로 부풀리지 않는다. 실제 CSS/픽셀을 측정한 브라우저 결과는 아니다. 평균=전체 시간/변화 수, 최장 정지는 양끝 구간 포함. 기본 업무의 숨겨진 line도 기존 lively 방식대로 signature에 포함한다.',
 '- 보이는 문구는 !plain인 직원 말풍선만. 동시 중복은 문구가 하나라도 보인 초 중 같은 문구가 2명 이상인 초의 비율이다. 원본 JSON에는 2개 이상 문구가 보인 초만을 분모로 한 비율도 있다.',
 '- 10분은 자정에 정렬된 겹치지 않는 [start,end) 창. 연속 표시를 매초 반복으로 세지 않고, 사람이 문구를 새로 띄울 때 그 창·층에 이미 등장한 문구면 1회다. 장소는 이동 중 anchor를 제외한 실제 도착 슬롯(정식·외출 공통) 재도착이다. 230에는 placeId catalog가 없으므로 공통 비교 표는 실제 destination anchor로 비교했다. 현재의 실제 장소 카드 id별 도착·반복은 별도 JSON/아래 표에 보존한다. 그룹 두 사람이 같은 카드에 도착하면 각 도착을 센다.',
 '- 같은 사람 같은 문구 간격은 새 표시 시작→다음 표시 시작(초). 하루 전체 이력을 이어서 측정하며 각 시간대에는 재등장 시작이 들어간다. 평균/최소/하위10%를 함께 보존한다. 단순 평균 상승만으로 개선을 단정하지 않는다.',
 '- 움직임 5종 비율은 직원 person-seconds가 분모이며 서로 겹친다: standing(서 있는 자세), walking(보행), outing(장소 외출 전체), group(정식 또는 외출 동행), formal(정식 event 전체). 합이100%가 아니다. 230 stroll은 최대30초의 짧은 산책이고 현재 outing은 이동+최소 체류를 포함하므로 outing 비율 상승이 곧 보행 증가를 뜻하지 않는다.',
 '- 무보행 1분은 재실자가 있는 60초 정렬 창에 직원 walking이 단1초도 없는 경우. 미세 자세/말풍선 변화는 여기에 포함되지 않는다. 별도로 화면 변화도 없는 1분을 병기한다. 방문객 보행은 직원 비율에 넣지 않는다.',
 '- 출근09–10/오전10–12/점심11:30–13/오후13–15/졸린 오후15–17/저녁18–21/심야01–07. 오전·점심은 요구대로 일부 겹치므로 합산하지 않는다.',
 '',
 '## 비교 표',
 '',
 '각 표는 동일 조건의 **수정 전 / 수정 후 / 운영230** 3열이다. 모든 floor×period를 표시하며, 빈 층도 생략하지 않는다.',
 ];
const tables=[
 ['화면 변화·인원','평균/최대 재실명; 평균 변화간격/최장 정지(초); 변화/1인·분',r=>`${n(r.peopleMean)}/${r.peopleMax}명; ${n(r.avgGapSec)}/${r.longestStaticSec}s; ${n(r.changesPerPersonMinute)}`],
 ['동시 다양성','평균 서로 다른 문구 / 1인당; 동시 중복률',r=>`${n(r.visibleUniqueMean)}/${n(r.visibleUniquePerPerson)}; ${pct(r.duplicateRate)}`],
 ['10분 반복','문구 재등장/10분(1인당); 장소 재도착/10분(1인당); 같은 사람 같은 문구 간격 평균/최소/P10 초',r=>`${n(r.lineRepeatsPer10m)}(${n(per(r.lineRepeatsPer10m,r))}); ${n(r.placeRepeatsPer10m)}(${n(per(r.placeRepeatsPer10m,r))}); ${n(r.samePersonRepeatGapMean,0)}/${n(r.samePersonRepeatGapMin,0)}/${n(r.samePersonRepeatGapP10,0)}`],
 ['움직임 종류','서기 / 보행 / 외출 / 동행 / 정식, person-second 비율(%)',r=>Object.values(r.shares).map(v=>n(v*100)).join(' / ')],
 ['아무도 움직이지 않는 1분·방문객','직원 무보행분 / 화면 무변화분 / 재실분; 방문객 새 등장/표시 초',r=>`${r.noWalkingMinutes}/${r.noChangeMinutes}/${r.minutes}; ${r.visitorEpisodes}/${r.visitorSeconds}`]
 ];
for(let day=0;day<2;day++)for(const [title,unit,format]of tables){
 lines.push('',`### ${sets[0][day].day} · ${title}`,'',unit,'','|층 · 시간대|수정 전 obr6|수정 후 obr7|운영230|','|---|---:|---:|---:|');
 for(const f of floors)for(const [period]of periods){const rs=sets.map(s=>s[day].records[f][period]);lines.push(`|${f.toUpperCase()} ${period}|${format(rs[1])}|${format(rs[2])}|${format(rs[0])}|`)}
}
lines.push('','## 실제 장소 카드 반복 (10분 창 평균)','','230은 장소 카드 catalog가 없어 N/A. 공통 실제 장소 비교는 위 슬롯 재도착 표를 사용한다. 모든 10분 창의 원본은 [obr7-place-card-repeats.json](obr7-place-card-repeats.json).','',
 '|날짜·층·시간대|수정 전 카드반복/10분 (1인당)|수정 후 카드반복/10분 (1인당)|운영230|','|---|---:|---:|---|');
for(let day=0;day<2;day++)for(const floor of floors)for(const [period,a,b]of periods){
 const rs=sets.map(s=>s[day].records[floor][period]);
 const vals=['전','후'].map((label,i)=>{const rows=cardRows.filter(r=>r.label===label&&r.day===sets[0][day].day&&r.floor===floor&&r.start>=a*3600&&r.end<=b*3600),avg=rows.reduce((n,r)=>n+r.repeats,0)/rows.length;return n(avg)+' ('+n(per(avg,rs[i+1]))+')'});
 lines.push(`|${sets[0][day].day} ${floor} ${period}|${vals[0]}|${vals[1]}|N/A|`);
}
lines.push('','## 하루 사람별 다양성','','셀: 서로 다른 보이는 문구 / 실제 도착 슬롯 / 행동 종류. 행동 종류는 정식 actionId + 외출 + 책상 앉기/서기다. 등록만 있고 그날 재실하지 않으면0. 다온·윤슬의230은 미등록(—).','');
for(let day=0;day<2;day++){
 lines.push(`### ${sets[0][day].day}`,'','|사람|수정 전|수정 후|운영230|','|---|---:|---:|---:|');
 for(const p of sets[2][day].daily){const ps=sets.map(s=>s[day].daily.find(q=>q.id===p.id)),fmt=(p,mark)=>p?['lines','places','actions'].map(k=>p[k].length+(mark&&ps[0]&&p[k].length<ps[0][k].length?'↓':'')).join('/'):'—';lines.push(`|${p.name} (${p.home})|${fmt(ps[1],true)}|${fmt(ps[2],true)}|${fmt(ps[0],false)}|`)}
}
lines.push('','↓는230보다 줄어든 일별 문구/장소/행동 종류다. 장소·정식 행동의 일별 감소 역시 남은 차이이며, 현재의 실제 체류·예약·확률 채택과230의 짧은 산책 차이를 포함한다. 이번 문구 수정은 이 장부를 바꾸지 않는다.');
lines.push('','## 230보다 나빠진 지표 — 전·후 모두 표시','','수치가 미세하게라도 불리하면 아래 표시했다(임계 완화 없음). 보행·문구·빈 화면은 다른 지표이므로 하나의 점수로 상쇄하지 않았다. 서기·외출·동행·정식 비율은 유형의 구성비이므로 하락 자체를 모두 단조로움으로 판정하지 않고 원본 표를 보존했다.','',
 '|날짜·층·시간대|수정 전 열세|수정 후 남은 열세|원인·조치|','|---|---|---|---|');
for(const r of regressions){const reasons=[];
 if(r.transient)reasons.push('상주자 없는 시간의 일시 방문·빈 화면 포함');
 if(r.floor==='2f')reasons.push('6→8명으로 공용 풀 경쟁: 개인 voice+시간대 풀 확장');
 if(r.floor==='1f')reasons.push('230의 짧고 잦은 방문객→현재 긴 실제 체류·예약');
 if(r.floor==='3f'&&r.period==='저녁')reasons.push('주간·야근 풀 중복: 정식 우선 idle 문구 회피');
 if(r.floor==='4f'&&r.period==='심야')reasons.push('회장님·MIR 재실, idle 대상0: 정식 행동의 고정 빈도');
 if(r.after.includes('보행 비율')||r.after.includes('무보행 1분 비율'))reasons.push('물리 이동은 체류·쿨다운·근접 계약 보존, 열세 잔존');
 if(!reasons.length)reasons.push('같은 장부·자세 리듬 보존, 문구만 개선');
 lines.push(`|${r.day} ${r.floor} ${r.period}|${r.before.join(' · ')||'없음'}|${r.after.join(' · ')||'없음'}|${reasons.join('; ')}|`)
}
lines.push('','## 남은 한계와 녹화 추천','','**모든 지표가230 이상이라는 판정은 불가하다.** 물리 산책·방문객 전환 빈도·일부 층의 최장 정지 열세가 남는다. 기존 계약(최소 체류/직원10분 cooldown/예약·연속 근접)을 유지한 상태에서230의30초 산책을 그대로 되살리면 계약을 위반한다. 이 결과를 “단조로움 전체 해결”로 보고하지 않는다. 문구 수정은 기존 움직임의 손실을 더 만들지 않도록 경로·일정·자세를 그대로 유지했다.','',
 '2F 추천: **2026-10-22 09:40–09:50 KST**(수정 전 문구 반복 최다151회/10분), 주말은 **2026-10-24 13:40–13:50**(152회). 시간대 리듬 확인용 **2026-10-22 15:00–15:10**, **18:00–18:10**도 권장. 심야2F는 거의 빈 층이라 많은 사람이 있는 화면의 반복감 판단에 맞지 않는다.','',
 '브라우저 허용 환경에서 기존 녹화 명령: `node scripts/hani-office-lively-record.browser.mjs --floor 2f --minutes 10 --label obr7-after-0940 --start 2026-10-22T09:40:00+09:00` (기존 recorder의 --speed는 GIF 재생 속도이며 시계는 실제 경과시간). 수정 전은 `--ref ecc1384 --label obr7-before-0940`,230은 `--ref ad3c2f3 --label obr7-230-0940` 추가. 원격자산·기록 파일 준비는 브라우저 환경 담당이 수행. 이번에 녹화·실제 픽셀 검증을 수행한 것은 아니다.','',
 '## 재현·원본','','- `node scripts/hani-office-monotony.mjs --run 230 -o artifacts/office-behavior/obr7-monotony-230.json`','- 수정 전은 immutable ecc1384 원본을 obr7-before.js에 공급 후 `--run 前`, 수정 후는 `--run 後`. 날짜·presence·표본 간격은 같은 코드의 고정 조건이다.','- `node scripts/hani-office-monotony-report.mjs`','- 각10분 창 person-second5종 비율·재등장·정지·인원 원본: [CSV](monotony-windows.csv), `obr7-monotony-{230,before,after}.json`.','- snapshot 단어만 바뀐3일 계획/경로 동일성 및 감사·성능·전체 회귀는 [report-obr7.md](report-obr7.md).','');
fs.writeFileSync(dir+'monotony-compare.md',lines.join('\n')+'\n');
const fields=['day','floor','start','end','peopleMean','peopleMax','avgGapSec','longestStaticSec','visibleUniqueMean','visibleUniquePerPerson','duplicateRate','lineRepeats','placeRepeats','samePersonRepeatGapMean','samePersonRepeatGapMin','noWalkingMinutes','noChangeMinutes','minutes'];
const csv=['버전,'+fields.join(',')+',standing,walking,outing,group,formal'];
for(let i=0;i<3;i++)for(const d of sets[i])for(const w of d.windows)csv.push([['230','전','후'][i],...fields.map(k=>w[k]??''),...Object.values(w.shares)].join(','));
fs.writeFileSync(dir+'monotony-windows.csv','\uFEFF'+csv.join('\n')+'\n');
fs.writeFileSync(dir+'obr7-regressions.json',JSON.stringify(regressions,null,2)+'\n');
console.log('비교표·10분창CSV 생성:',regressions.length,'구간 열세 표시. 모든 지표230 이상 PASS 선언 없음.');
