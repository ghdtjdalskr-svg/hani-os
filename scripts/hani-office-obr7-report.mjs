// Final Korean -o evidence: read actual logs and source identities, never invent PASS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const dir='artifacts/office-behavior/';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceHash=hash(fs.readFileSync('hani-office-live.js'));
assert.equal(sourceHash,'cce544474a1bb90c6220127e4656f61e47d0b8b4fb9dec5a93fde6c40a6c6e6d');
const text=n=>{const b=fs.readFileSync(dir+n);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8').replace(/^\uFEFF/,'')};
const json=n=>JSON.parse(text(n));
const count=(log,key)=>Number(log.match(new RegExp('ℹ '+key+' (\\d+)'))?.[1]);
const check=(name,tests,pass,skipped=0)=>{const log=text(name);assert.equal(count(log,'tests'),tests);assert.equal(count(log,'pass'),pass);assert.equal(count(log,'fail'),0);assert.equal(count(log,'skipped'),skipped);return {전체:tests,통과:pass,실패:0,건너뜀:skipped}};
const suite=check('obr7-all-tests-final-v2.txt',126,123,3),baseline=check('obr7-baseline-final-v2.txt',8,8),targeted=check('obr7-targeted-final-v2.txt',6,6);
const audit=JSON.parse(text('obr7-audit-final-v2.txt').match(/SUMMARY (\{[^\n]+\})/)[1]);
assert.equal(audit.snapshots,54000);for(const k of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(audit[k],0,k);
const performance=[1,2,3].map(i=>{const file='obr7-performance-v2-'+i+'.txt';check(file,8,8);const log=text(file),[,first,warm]=log.match(/Node performance\s*\{\s*firstMs:\s*([\d.]+),\s*warmMs:\s*([\d.]+)/);assert.ok(+first<400);assert.ok(+warm<3);return {회차:i,첫_계획_ms:+first,웜_ms:+warm}});
const before=json('obr7-monotony-before.json'),after=json('obr7-monotony-after.json'),old=json('obr7-monotony-230.json'),preCache=json('obr7-monotony-before-perf-cache.json');
for(const a of after)assert.equal(a.sourceSha256,sourceHash);
const omitHash=rs=>rs.map(({sourceSha256,...r})=>r);assert.deepEqual(omitHash(after),omitHash(preCache),'cache optimization keeps EVERY measured result identical, 172800 snapshots');
assert.equal(after.length,2);assert.deepEqual(before.map(r=>r.day),after.map(r=>r.day));
const regressions=json('obr7-regressions.json'),left=regressions.filter(r=>r.after.length),git=json('obr7-git-exports-verified.json');assert.equal(git.length,78);
const n=v=>Number(v).toFixed(2),per=(a,day,floor,period)=>a[day].records[floor][period];
const examples=[['평일 2F 졸린 오후',0,'2f','졸린 오후'],['주말 2F 졸린 오후',1,'2f','졸린 오후'],['평일 3F 저녁',0,'3f','저녁'],['주말 3F 저녁',1,'3f','저녁']].map(([label,d,f,p])=>{const b=per(before,d,f,p),a=per(after,d,f,p),o=per(old,d,f,p);return {구간:label,문구반복_전:b.lineRepeatsPer10m,문구반복_후:a.lineRepeatsPer10m,문구반복_230:o.lineRepeatsPer10m,문구종류_전:b.distinctLines,문구종류_후:a.distinctLines,동시중복률_전:b.duplicateRate,동시중복률_후:a.duplicateRate}});
const local=json('obr7-local-git.json');
const result={작업:'obr7 승인 기록 갱신 + 단조로움 점검',상태:'승인 fixture·문구 개선·지정 검증 완료; 230 대비 모든 지표 개선 조건은 미달',기준_SHA:'ecc138414f0b1a01ea1747a51a85d976580419c4',브랜치:'hani/release-train-20261023',최종_runtime_SHA256:sourceHash,담당:'도연(Codex)',승인기록:baseline,전체_office_building_회귀:suite,계획_경로_동일성:targeted,단독_성능:performance,감사:audit,비교_snapshot:518400,최적화_전후_매초_측정_동일성:172800,주요_개선:examples,'230_대비_잔여_열세_구간':left.length,잔여_설명:'짧은 산책·방문객 전환 빈도·일부 정지/일별 장소·행동 다양성 차이. 체류·쿨다운·예약·근접 기준 보존. 모든 지표230 이상 PASS 선언 없음.',저장소쓰기:0,동일한_Git_원문객체:78,로컬_Git:local,추천녹화:['2026-10-22 09:40–09:50 KST','2026-10-24 13:40–13:50 KST'],미검증:['실제 Edge/폰/시각 녹화','package/One-Pass/독립 HINA','main/Pages/Production read-back'],금지범위:'버전·?v=·index·마스코트·data/·행동 JSON 변경0, push/PR/Notion 없음'};
const files=['hani-office-live.js','scripts/fixtures/office-redesign-233.json','scripts/fixtures/office-obr7-snapshot-lines.json','scripts/hani-office-obr6.test.mjs','scripts/hani-office-obr7.test.mjs','scripts/hani-office-monotony.mjs','scripts/hani-office-monotony-report.mjs','scripts/hani-office-obr7-freeze.mjs','scripts/hani-office-obr7-report.mjs'];
fs.writeFileSync(dir+'obr7-verified-files.json',JSON.stringify({base:result.기준_SHA,files:Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(f))]))},null,2)+'\n');
const lines=[
 '# obr7 — 승인 기록 갱신·단조로움 점검',
 '',
 '2026-10-23 KST · 도연(Codex). **승인 기록·문구 개선과 지정 검증은 완료했다. 230보다 모든 지표가 좋아졌다는 조건은 미달이며 보행·정지 등 잔여 차이를 명시한다.**',
 '',
 '## 기준·범위',
 '',
 '- worktree obr / hani/release-train-20261023 / 시작 HEAD ecc138414f0b1a01ea1747a51a85d976580419c4. GitHub 읽기 도구로 main d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf 확인, origin/main 캐시와 일치. 셸 네트워크는 프록시 연결 실패. merge/rebase 없음.',
 '- runtime은 hani-office-live.js 하나만 변경. 버전2.9.232·cache·index·마스코트·data/·행동 JSON 원문 보존. 기존 behavior-browser.json 수정과 untracked 산출물은 손대지 않았다. push/PR/Notion 금지 준수.',
 '- CODEMAP living-office owner 확인, 새 scheduler anchor는 CODEMAP_MISS로 실제 createScheduler→plan/reserve/blockPlan→snapshot→기존 persistent renderer를 추적했다. 새 DOM/event/timer/renderer 경로 없음.',
 `- 최종 runtime SHA256: \`${sourceHash}\`. 개별 파일 identity는 obr7-verified-files.json.`,
 '',
 '## A. 승인 기록',
 '',
 '- 현재3개 owner와 고정 base7a10595의 diff를 다시 읽어 JS15개 + JSON각1개 정확 hunk로 fixture를 재생성했다. before/after 각각1회 및 전체 역변환 byte 일치를 authoring 단계에서 확인했다.',
 '- hani-reviewed-release-baseline.mjs와 기존8개 assertion은 수정하지 않았다. 누락·중복·변조·fragment 이동·다른 파일 변경 거절을 모두 유지했다. 최신 최종 코드로8/8 PASS.',
 '- 재생성 도구 scripts/hani-office-obr7-freeze.mjs는 테스트 실행 중 기대값을 만들지 않는다. release225 이후 명시 승인 목록과 Git oracle는 그대로다.',
 '',
 '## B. 비교와 수정',
 '',
 '- [층별·시간대별 전/후/230 비교표](monotony-compare.md)에5층×7시간대×2날짜의 인원·화면 변화·동시 다양성·반복·5종 움직임·무보행1분·일별 개인 다양성을 모두 기록했다. 실제 장소 카드 반복과 공통 도착 슬롯 proxy를 구분했다.',
 '- 3개 구현×2일을00:00–24:00 KST 매초 실행한518,400 snapshot. 230 명부18명, 현재20명(다온·윤슬 추가); 회장님·MIR 포함, 방문객 별도. 평균 재실 인원으로 나눈 값도 병기했다.',
 '- 기존 day/evening/late/lounges 문구를 보존하며 공용 책상·시간대 문구72개와 개인 voice18명×4개를 추가했다. 책상에서 장소를 암시하는 단어는 넣지 않았다. 개인 문구는 기존 affinityEvidence의 hobbies/quirks/voice와232 archive 근거에 맞췄다.',
 '- 같은 층에서 정식·외출 문구를 먼저 확보한 뒤 idle 문구 충돌을 같은 사람의 voice/해당 시간대 풀로 회피한다. 정식 문구를 감추거나 사람 이름만 덧붙여 다양성 수치를 높이지 않는다. 정식끼리 남은 중복은 그대로 집계한다.',
 '- 원래 문구 풀의 자세 선택을 별도로 보존하여 서기·앉기·10.8초 표시·5.4초 자세 전환을 유지했다. 경로·근접20/24px·체류·10분 쿨다운·층 상한·그룹 조합·방문객 장부는 그대로다.',
 '',
 '|구간|10분 문구반복 전→후 (230)|서로 다른 문구 전→후|동시 동일 문구 비율 전→후|',
 '|---|---:|---:|---:|',
 ...examples.map(r=>`|${r.구간}|${n(r.문구반복_전)}→${n(r.문구반복_후)} (${n(r.문구반복_230)})|${r.문구종류_전}→${r.문구종류_후}|${n(r.동시중복률_전*100)}%→${n(r.동시중복률_후*100)}%|`),
 '',
 `**잔여 차이:** 단조로움 관련15개 지표 중 하나라도230에 불리한 구간은 ${left.length}개다(상주자가 거의 없는2F 심야·5F 포함). 숫자를 숨기거나 합산 점수로 상쇄하지 않았다. 1F 낮/4F 저녁의 화면 변화, 1F/3F/4F 등 보행 및 일별 장소·정식 행동 다양성에 열세가 남는다.`,
 '',
 '230의 최대30초 산책·짧은 방문객은 현재의 실제 이동·최소 체류·cooldown·연속 근접 계약과 다르다. 그대로 복원하면 기존 계약을 어기므로 복원하지 않았다. 더 느린 보행·새 외출·그룹 변경은 기존 움직임까지 바꾸므로 이번 결과를 그 범위의 개선으로 보고하지 않는다. **“어느 지표든230보다 나쁘지 않음”이라는 B2 전체 목표는 미완료**다. 개선된 문구를 검토하고, 남은 이동 체감은 별도 설계 판단이 필요하다.',
 '',
 '## 성능 실패와 보완',
 '',
 '- 첫 단독 측정은347.46ms PASS, 두 번째409.03ms FAIL이었다(obr7-performance-1/2.txt). 실패를 숨기거나 같은 source의 통과 표본만 골라 사용하지 않았다.',
 '- V8 profile에서 계획·외출 후보 계산과 반복되는 명부/인물 이력 검색을 확인했다. 동일01/07/18시 phase의 층별 명부를 재사용하고, 이미 수락된 외출을 사람별 메모리 index로 조회한다. 정렬 순서·후보·예약·cooldown 판정은 유지한다. 확장 문구의 deterministic 정렬도80개 이하 메모리 cache로 재사용한다.',
 '- 최적화 후 새 source identity로 기존8개 성능 테스트를 다른 검사와 동시 실행 없이 연속3회 수행했다. 모두8 PASS/0 FAIL. 첫 계획<400ms, warm<3ms 한도·측정 코드는 불변.',
 '',
 '|회차|첫 formal+outing(ms)|warm snapshot(ms)|',
 '|---|---:|---:|',
 ...performance.map(r=>`|${r.회차}|${n(r.첫_계획_ms)}|${r.웜_ms.toFixed(3)}|`),
 '',
 '## 최종 검증',
 '',
 '|검사|실제 결과|증거|',
 '|---|---|---|',
 '|승인 baseline|8 PASS/0 FAIL, 원래 부정 검사 유지|obr7-baseline-final-v2.txt|',
 '|전체 office/building 회귀|126개,123 PASS/0 FAIL/기존 browser3 SKIP|obr7-all-tests-final-v2.txt|',
 '|감사|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 전부0, shared engine6 PASS|obr7-audit-final-v2.txt|',
 '|obr6 동일성+obr7 회귀|6 PASS; 평일·주말·심야 계획 byte/deepEqual,109,561개 route·tie order 보존; query order·소집·취소·reduced motion·쓰기0|obr7-targeted-final-v2.txt|',
 '|성능 후 매초 read-back|최종 source로2일172,800 snapshot 재실행. source hash 외 모든 지표·창·사람별 결과가 최적화 전과 정확히 같음|obr7-monotony-after.json 및 report generator deepEqual|',
 '|Git baseline 공급|sandbox Node Git spawn용 기존 read-only 공급기 사용. native Git78/78 blob 재검증;230원본7/7 별도 검증|obr7-git-exports-verified.json,obr7-baseline-verified.json|',
 '|문법·보호 범위|Node 실행 파싱·git diff --check, 금지 파일 HEAD 대비 변경0|로컬 검증|',
 '',
 'obr6 원본 gzip/hash 및 route fixture는 불변이다. 의도된 단어 변경만 별도 office-obr7-snapshot-lines.json에8개 id/before/after로 고정했다(평일4/주말4/심야0). 원래 snapshot 비교는 이8개 line만 적용한 뒤 전체 JSON byte+deepEqual을 유지한다. 모든 pose·좌표·plain·event·plan 필드도 원래대로 검사한다. 새 테스트는3일(총2,673개 시각 표본)에서 line 외 필드 전체 동일성, idle/정식 충돌 회피와 장소 단어 금지를 검증한다.',
 '',
 '재현: `node scripts/hani-office-obr7-report.mjs -o artifacts/office-behavior/obr7-results.json`. 전체 회귀는 기존 `powershell -NoProfile -File scripts/hani-office-behavior-run-tests.ps1`. Node Git spawn이 막힌 환경은 기존 obr5 read-only export 공급기(NODE_OPTIONS/HANI_OBR5_GIT_EXPORTS) 사용, native Git 환경은 불필요. 새 obr7 테스트의 source oracle는 immutable ecc1384이며 local export의SHA256도 고정 검사한다.',
 '',
 '## 로컬 Git·미검증·다음 행동',
 '',
 `- 로컬 Git: ${local.상태}. ${local.사유||''}`,
 '- 실제 Edge/폰·2F 녹화·픽셀·시각 UX는 미검증이며 기존 browser3 SKIP을PASS로 세지 않았다. package/One-Pass/독립HINA/main/Pages/Production은 수행하지 않았다. 운영 배포 완료 아님. 버전 증가는 사용자 금지·기능 담당 규칙에 따라N/A.',
 '- storage/Cloud/schema/migration/write path 변경0. Edge Function·서버 설정 동반 배포 없음. Notion은 사용자 명시 금지로 미반영.',
 '- 서윤 추천 녹화: **2026-10-22 09:40–09:50 KST**, 주말 **2026-10-24 13:40–13:50**. 수정 전2F 반복151/152회인 최다 구간이다. 졸린 오후15:00 및 저녁18:00도 비교표와 함께 확인한다. 기존 recorder의 정확한 명령은 monotony-compare.md에 있다.',
 '- 다음 담당: 먼저 비교표의 잔여 열세를 검토하고, 새 문구의 실시간2F 체감과 아직 줄어든 보행/방문객 전환을 확인한다. Candidate Freeze·승인·배포 절차는 별도이며 이번 작업을 전체 단조로움 해결 또는 배포 승인으로 해석하지 않는다.',
 ''
 ];
fs.writeFileSync(dir+'report-obr7.md',lines.join('\n')+'\n');
const args=process.argv.slice(2),output=args.includes('-o')?args[args.indexOf('-o')+1]:null;assert.ok(output,'-o output required');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log('obr7: 승인 기록8/8, 전체126개 중123 통과·실패0·브라우저3 SKIP.');
console.log('첫 계획(ms) '+performance.map(r=>n(r.첫_계획_ms)).join(' / ')+'; warm 모두3ms 미만. 감사54,000개 전 지표0.');
console.log('비교518,400 snapshot, 최종172,800 snapshot 동일. 230 대비 모든 지표 개선 조건은 미달: 잔여 '+left.length+'구간.');
console.log('보고서 '+dir+'report-obr7.md; 한국어 결과 '+output+'; 로컬 Git '+local.상태);
