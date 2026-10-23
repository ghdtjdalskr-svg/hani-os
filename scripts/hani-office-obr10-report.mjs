// Korean report from completed, identity-matched evidence. No tests or freezes run here.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
const dir='artifacts/office-behavior/',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const text=name=>{const b=fs.readFileSync(dir+name);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8').replace(/^\uFEFF/,'')};
const read=name=>JSON.parse(text(name)),runtime=hash(fs.readFileSync('hani-office-live.js')),places=JSON.parse(fs.readFileSync('data/hani-building/office-places.json','utf8')),placesHash=hash(fs.readFileSync('data/hani-building/office-places.json'));
const people=JSON.parse(fs.readFileSync('assets/data/office-actions-221.json','utf8')).people,names=Object.fromEntries(people.map(p=>[p.id,p.name]));
const suite=name=>{const t=text(name),n=k=>Number(t.match(new RegExp('ℹ '+k+' (\\d+)'))?.[1]);assert.ok(n('tests')>0,name+' completed');assert.equal(n('fail'),0,name);return {전체:n('tests'),통과:n('pass'),실패:n('fail'),건너뜀:n('skipped')}};
const regression=suite('obr10-all-tests-final.txt'),approval=suite('obr10-baseline-final.txt');assert.equal(regression.건너뜀,3);
const performance=[1,2,3].map(i=>{const name='obr10-performance-final-'+i+'.txt';suite(name);const [,first,warm]=text(name).match(/Node performance\s*\{\s*firstMs:\s*([\d.]+),\s*warmMs:\s*([\d.]+)/);assert.ok(+first<400&&+warm<3);return {회차:i,첫계획_ms:+first,웜_ms:+warm}});
const audit=JSON.parse(text('obr10-audit-final.txt').match(/SUMMARY (\{[^\n]+\})/)[1]);assert.equal(audit.snapshots,54000);for(const k of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(audit[k],0,k);
const metrics=read('obr10-monotony-after.json'),before=read('obr8-monotony-after.json'),summary=read('obr10-compare-summary.json'),regressions=read('obr10-regressions.json'),activity=read('obr10-activity-stats.json');
for(const r of metrics){assert.equal(r.sourceSha256,runtime);assert.equal(r.placesSha256,placesHash);assert.equal(r.storageWrites,0)}
assert.equal(activity.runtimeSha256,runtime);assert.equal(activity.placesSha256,placesHash);assert.equal(activity.storageWrites,0);
for(const d of activity.days){assert.equal(d.restRepeats,0);assert.equal(d.errandRepeats,0);assert.ok(d.pairMaximum<=2);assert.equal(d.samples.deskConsecutive,0);assert.equal(d.samples.shortDeskRuns.length,0)}
const frozen=gunzipSync(fs.readFileSync('scripts/fixtures/office-obr10-plans-v5.json.gz')),oracle=JSON.parse(frozen);assert.equal(oracle.sourceSha256,runtime);assert.equal(oracle.placesSha256,placesHash);
const clock=t=>[Math.floor(t/3600),Math.floor(t/60)%60,Math.floor(t)%60].map(x=>String(x).padStart(2,'0')).join(':');
const flagCounts=key=>{const counts={};for(const r of regressions)for(const flag of r[key])counts[flag]=(counts[flag]||0)+1;return counts};
const oldFlags=flagCounts('obr8'),newFlags=flagCounts('obr10');
const diversity=metrics.flatMap((r,i)=>r.daily.map(p=>({날짜:r.day,사람:p.name,id:p.id,기존_행동종류:before[i].daily.find(q=>q.id===p.id).actions.length,현재_기존분류_행동종류:p.actions.length,현재_세부행동종류:p.behaviorKinds.length,기존_문구수:before[i].daily.find(q=>q.id===p.id).lines.length,현재_문구수:p.lines.length,실제_시그니처종류:p.behaviorKinds.filter(k=>k.startsWith('signature-')).length})));
const result={작업:'obr10 행동 종류 확장',날짜_KST:'2026-10-24',담당:'도연(Codex) 단독',branch:'hani/release-train-20261023',기준SHA:'246f1c0',runtimeSHA256:runtime,장소데이터SHA256:placesHash,상태:'로컬 구현·검증. Git index.lock 권한 거절로 로컬 커밋 미완료',전체회귀:regression,승인기록:approval,감사:audit,단독성능3회:performance,고정계획:{SHA256:hash(frozen),사례:oracle.records.length,이유:oracle.reason},단조로움:{기존열세구간:summary.obr8_열세구간,현재열세구간:summary.obr10_열세구간,기존지표별열세:oldFlags,현재지표별열세:newFlags,주의:'15개 지표 중 하나라도 열세면 해당 구간을 열세로 센다. 이 기준을 바꾸거나 서로 상쇄하지 않았다.'},사람별하루다양성:diversity,행동실측:activity,제한:['원격 main 조회 연결 실패로 최신성 미확인; merge/rebase 없음','기존 명단 20명 중 회장과 가상 MIR의 자동 휴식 초대 제외 유지. 21번째 인물은 추가하지 않음','회의 전 2–5분 모임은 시도 경로만 구현, 실제 승인된 예약 0회. 기존 정식 예약과 90초 체류 하한을 지키면 공간 부족','세부 행동 종류는 개인 자리 행동·용무 카드·시그니처를 구분하며 기존 actions 3분류 지표와 별개','실제 Edge/폰 화면과 녹화 미검증, 기존 browser3 SKIP','Candidate/package/One-Pass/HINA/main/Pages/Production 미수행','버전/cache/index/마스코트/공간 canon/art-map 및 Storage/Cloud 변경 없음','push/PR/Notion 사용자 명시 금지 준수','git add: .git/worktrees/obr/index.lock Permission denied. 권한 우회 없음']};
result.제한[3]='세부 행동 종류는 개인 자리 행동·용무 카드·시그니처를 구분하며 기존 actions 집계와 별개';
const args=process.argv.slice(2),out=args.includes('-o')?args[args.indexOf('-o')+1]:dir+'obr10-results.json';fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
const lines=['# obr10 — 행동 종류 확장','','2026-10-24 KST · 도연(Codex) 단독. 구현·검증 결과이며 배포 완료가 아니다. 로컬 커밋은 Git index.lock 권한 거절로 미완료.','','## 구현과 경계','',
 '- 기존 createScheduler → plan/blockPlan → reserve → snapshot 경로를 확장했다. 신규 런타임 파일·DOM/event/renderer/timer layer는 추가하지 않았다. 기존 data의 anchors/edges/art와 공간 canon/art-map도 그대로다.',
 '- 개인 문구·시그니처·업무 용무·시간대·동행 상한·모임 문구는 office-places 데이터가 소유한다. 각 인물의 기존 voice/취미와 관계 근거를 함께 기록했다. 같은 개인 문구는 한 사람이 소유해 10초 표시 도중 중복 회피가 문구를 바꾸지 않게 했다.',
 '- 같은 지점 재도착을 줄이기 위해 용무 후보의 실제 도착 시각이 속한 10분 창에서 이미 사용한 anchor는 피한다. 기존 장소/시간대의 경로·슬롯·20/24px·개인 간격·층별 상한 검사는 그대로 적용한다.',
 '- 외출 중인 두 직원이 동시에 걸을 때는 추가30px 여유를 확인한다. 29.6px 접근 사례를 기존 감사에서 발견해 해소했으며, 최종 감사 near30도0이다. 연장 상한은 개인별 도착부터 귀환 시작까지 FIFO 대기를 포함해 검사한다. 업무 task ID도 휴식 카드와 분리해 말-위치 검증이 정확한 카드를 참조한다.',
 '- 합류는 이미 머무는 곳에 친구·같은 층 가중을 주며 결정적 seed로 선택한다. 먼저 온 사람의 연장은 2인 시 종류 최대의 1.5배, 3인 이상 시 480초까지다. 원본 event를 수정하지 않고 새 귀환 경로를 scratch ledger에서 전부 예약한 뒤 한 번에 교체한다. 하나라도 거절되면 연장 없음. 실제 같은 장소의 AT_PLACE 인물 이름만 표시하고 각자 돌아간다.',
 '- 1F 응대는 채원(code id taeo)과 저녁에 1F에 재실하는 유나만 초대한다. 손님과 40–160px 떨어진 기존 접근 지점을 사용한다. 기존 6분 용무 간격과 연속 카드 제한을 지키고 손님 취소 시 연결된 직원 응대도 취소한다.',
 '- 명단은 기존 20명이다. 회장·가상 MIR의 자동 외출 금지는 보존했다. 사용자 문구의 21명을 맞추려고 인물·마스코트·공간을 추가하지 않았다.','','## 새 행동 목록','','|범주|사람·장소|실제 문구/조건 예|','|---|---|---|',
 '|자리 행동|아래 전체 인물; 이동 없음|개인별 5개 이상, 10.8초 문구 유지 중 앉기/서기 변경|',
 '|짝 대화|지은↔다온, 서윤↔도연, 유리↔아린, 히나↔나은, 수아↔채원|다온이랑 숫자 맞춰 보는 중 / 지은 언니 계산 확인 중. 양쪽 재실·실제 home 거리와 일정 확인|',
 '|업무 용무|2/3/4F 회의실 문, 3F 화이트보드·서버 콘솔, 1F 택배함|예약 확인, 전달 메모, 로그 확인, 수령인 확인. 8–25초·왕복60초 이하|',
 '|동행·멘토링|기존 관계 seed + 지은→다온 지정 관계|같은 두 사람 조합 하루 최대2회, 서윤→도연·유리 설계 멘토링|',
 '|시간대|출근·점심·15시·퇴근·야근|인사, 점심 손들기, 어깨 풀기, 가방 챙기기, 간식 나누기. 실제 휴식 외출의 시간대 가중도 유지|',
 '|방문객|1F 실제 직원과 손님|방문객 요청 확인 중 / 안내 감사합니다|',
 '|우연한 모임|슬롯2+인 카페·팬트리·소파·테라스|현재 구성원이 바뀔 때만 모임 표현 변경. 실제 이름·장소·AT_PLACE 일치|',
 '|회의 전 모임|정식 회의 2–5분 전 같은 회의실 2인 초대 시도|실제 수락0회. 기존 정식 예약과 원래 체류 하한을 건너뛰지 않았다|','',
 '|사람|개인 자리 문구 수·예|시그니처 외출 2개 (데이터 정의)|','|---|---|---|'];
for(const p of people){const voice=places.behavior.deskVoice[p.id];lines.push(`|${p.name}|${voice.length} · ${voice.at(-1)}|${places.behavior.signatures[p.id].map(s=>places.places.find(c=>c.id===s.place).at[0].split('에서')[0]+': '+s.task).join(' / ')}|`)}
lines.push('','## 단조로움과 사람별 하루 다양성','',`기존과 같은 70개 구간·15개 방향/임계로 측정했다. 230 대비 열세 구간은 **61 → ${summary.obr10_열세구간}**이다. 전체 구간 수의 큰 폭 감소 목표에는 미달하며, 남은 원인은 아래 지표별 표에 그대로 보인다. 자세한 4개 구현 비교는 monotony-compare에 보존했다.`,'','|230 대비 열세인 지표·구간 수|obr8|obr10|','|---|---:|---:|');
for(const k of new Set([...Object.keys(oldFlags),...Object.keys(newFlags)]))lines.push(`|${k}|${oldFlags[k]||0}|${newFlags[k]||0}|`);
lines.push('','새 세부 행동 종류는 실제 표시된 행동만 센다. 같은 분류를 세분한 값이므로 obr8의 기존 actionId 분류와 동등한 숫자로 비교하지 않는다. 문구 수는 같은 기존 sampler의 하루 고유 문자열 수다. MIR/회장의 자동 동작 예외를 유지했다.','','|날짜|사람|obr8→obr10 기존 행동 분류 수|obr10 세부 행동 종류|obr8→obr10 문구 수|실제 시그니처 종류|','|---|---|---:|---:|---:|---:|');
for(const p of diversity)lines.push(`|${p.날짜}|${p.사람}|${p.기존_행동종류}→${p.현재_기존분류_행동종류}|${p.현재_세부행동종류}|${p.기존_문구수}→${p.현재_문구수}|${p.실제_시그니처종류}|`);
lines.push('','## 모임과 연속 반복','', '모임은 같은 장소에 2명 이상 있는 연속 구간 1회를 한 세션으로 센다. 인원 교체마다 횟수를 늘리지 않는다. 우연한 모임은 서로 다른 외출 event 2개 이상이 겹친 경우이며, 계획된 단일 동행 event만 있는 모임과 구분한다.','','|날짜|전체 세션|우연한 세션|우연한 3인 이상|최대인원 2/3/4명 세션|연장 event|응대 짝|','|---|---:|---:|---:|---|---:|---:|');
for(const d of activity.days)lines.push(`|${d.day}|${d.gatherings}|${d.spontaneous}|${d.trios}|${[2,3,4].map(k=>d.sizeDistribution[k]).join('/')}|${d.extensions}|${d.hostPairs.length}|`);
lines.push('', '평일 3인 이상 2회 목표는 10월22일·23일 각각 확인했다. 휴식/용무 카드의 하루 연속 반복은 각각0, 동행 동일 두 사람 조합은 최대2회다. 별도 시간대 표본은 3일×6,600 snapshot이며 자리 행동 연속 반복과 10초 미만 문구 표시를 함께 확인했다. 이 표본을 전 날짜·전 시각 검증이라고 확대하지 않는다.','','|날짜|자리 행동 표본 연속 반복|완료 문구 episode|10초 미만|관측 짝 대화 episode|관측 시간대|','|---|---:|---:|---:|---:|---|');
for(const d of activity.days)lines.push(`|${d.day}|${d.samples.deskConsecutive}|${d.samples.deskRuns}|${d.samples.shortDeskRuns.length}|${d.samples.pairs.length}|${Object.keys(d.samples.moments).join(' / ')}|`);
lines.push('','## 성능·회귀·감사','','다른 시뮬레이션과 겹치지 않게 새 Node 프로세스에서 기존 성능 테스트를 순차3회 실행했다. 첫 계획은 formal과 하루 outings 전체 계산이며 기존 검사와 같이 파일 읽기·JS 파싱은 제외한다. 웜은 1,000회 snapshot 평균이다. Node 계산 지표이며 브라우저 첫 화면 시간은 아니다. 400ms/3ms assertion은 그대로다.','','|회차|첫 계획 ms|웜 ms|','|---|---:|---:|');
for(const p of performance)lines.push(`|${p.회차}|${p.첫계획_ms.toFixed(3)}|${p.웜_ms.toFixed(3)}|`);
lines.push('',`전체 office/building: ${regression.통과} PASS / 0 FAIL / ${regression.건너뜀} 기존 browser SKIP. 233 pending: ${approval.통과} PASS / 0 FAIL. 감사: ${audit.snapshots} snapshot, frozen/mismatch/stuckSeconds/near30/near24 전부0.`, '',
 '원본 obr6 formal·route, obr8 gzip/hash, 실제 obr8→obr9 역사 source/data byte 대조는 보존했다. 새 행동 때문에 바뀐 optional outings/snapshot은 별도 obr10 v5 fixture를 테스트 밖에서 명시적으로 Freeze했다. runtime·data SHA와 압축 해제 SHA를 검사한다. 233은 고정7a10595 원본에서 exact hunk·각 fragment1회·완전 역변환을 확인했고, 검증기와 누락/중복/변조/다른 owner/이동 거절 assertion은 보존했다.', '',
 '추가 검사: 거절된 연장에 부분 예약 없음, 확장된 전체 경로의 슬롯/연속 sweep/층 상한/actor overlap/개인 cooldown, 실제 모임 이름과 위치, 손님 취소와 응대 취소, 일반/reduced motion/query order, 저장소 write0. 모임 연장 검사만 사용자 명세의 별도 상한을 적용하며 원래 비연장 체류 최대와 모든 하한을 계속 검사한다.','','## 미검증·남은 위험·인수인계','',...result.제한.map(s=>'- '+s),'',
 '- 위 큰 폭 감소 목표 미달 외에, 일부 인물의 두 시그니처가 두 날짜 안에 모두 발생하지 않을 수 있다. 데이터 정의와 실제 발생을 위 표에서 구분했다. 공간 예약을 통과하지 못한 행동을 강제로 표시하지 않았다.',
 '- Git source/data export는 native Git object hash와 파일 SHA로 검증했다. Node child process 제한은 기존 읽기 전용 Git 공급기로 처리했다. 현재 소스를 역사 oracle로 대체하지 않았다.',
 '- 기존 behavior-browser와 다른 미추적 산출물은 변경·stage하지 않았다. 커밋 대상은 obr10-stage-files 목록에 보존한다. 서버 Edge Function·schema·배포 순서 변경 없음.','','## 서윤 녹화 추천','');
for(const d of activity.days.slice(0,2)){for(const r of d.runs.filter(r=>r.spontaneousPeak>=3).slice(0,2)){const card=places.places.find(c=>c.id===r.place),peak=r.transitions.reduce((a,b)=>a.people.length>=b.people.length?a:b);lines.push(`- ${d.day} ${card.floor.toUpperCase()} ${clock(Math.max(0,r.start-15))}–${clock(r.end+15)}: ${card.at[0].split('에서')[0]}, ${peak.people.map(id=>names[id]).join('·')} 실제 합류/각자 복귀.`)}}
const host=activity.days[0].hostPairs[0];if(host)lines.push(`- 2026-10-22 1F ${clock(host.start-15)}–${clock(host.end+15)}: ${names[host.person]} 방문객 짝 응대.`);
lines.push('- 2026-10-22 2F 14:00–14:10: 자리 짝 대화와 개인 딴짓. 15:00–15:10: 졸린 오후 순간.','','녹화 도구: `node scripts/hani-office-lively-record.browser.mjs --floor 5f --minutes 10 --label obr10 --start <위 추천 시각의 KST ISO>` — 실제 녹화는 미수행.','','재현: node scripts/hani-office-obr10-report.mjs -o '+out, '', '최종 runtime SHA256: '+runtime+'; 장소 데이터 SHA256: '+placesHash+'. 고정 계획 SHA256: '+hash(frozen)+'.', '');
fs.writeFileSync(dir+'report-obr10.md',lines.join('\n'));console.log('obr10 한국어 보고서와 결과 생성:',out);
