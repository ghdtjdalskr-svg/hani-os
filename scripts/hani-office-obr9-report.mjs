// Consume executed evidence only. No test, fixture, or expectation regeneration.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
const args=process.argv.slice(2),out=args[args.indexOf('-o')+1];assert.ok(args.includes('-o')&&out,'-o required');
const dir='artifacts/office-behavior/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=name=>{const b=fs.readFileSync(dir+name);return b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8').replace(/^\uFEFF/,'')};
const json=name=>JSON.parse(read(name));
const counts=(name,skipped=0)=>{
 const t=read(name),value=k=>Number(t.match(new RegExp('ℹ '+k+' (\\d+)'))?.[1]);
 assert.ok(value('tests')>0,name);assert.ok(value('pass')>0,name);assert.equal(value('fail'),0,name);assert.equal(value('skipped'),skipped,name);
 return {전체:value('tests'),통과:value('pass'),실패:value('fail'),건너뜀:skipped};
};
const runtime=sha(fs.readFileSync('hani-office-live.js'));
const before=json('obr9-before.json'),after=json('obr9-after.json');assert.equal(after.sourceSha256,runtime);
function profileSummary(name){
 const p=json(name),nodes=new Map(p.nodes.map(n=>[n.id,n])),parent=new Map(),own=new Map(),total=new Map();
 for(const n of p.nodes)for(const id of n.children||[])parent.set(id,n.id);
 for(let i=0;i<p.samples.length;i++){
  const id=p.samples[i],delta=p.timeDeltas[i];own.set(id,(own.get(id)||0)+delta);
  for(let n=id;n;n=parent.get(n))total.set(n,(total.get(n)||0)+delta);
 }
 return [...total].map(([id,us])=>({함수:nodes.get(id).callFrame.functionName,행:nodes.get(id).callFrame.lineNumber+1,자체_ms:(own.get(id)||0)/1000,하위포함_ms:us/1000})).sort((a,b)=>b.하위포함_ms-a.하위포함_ms).slice(0,25);
}
fs.writeFileSync(dir+'obr9-profile-summary.json',JSON.stringify({변경전:profileSummary('obr9-before.json.cpuprofile'),변경후:profileSummary('obr9-after.json.cpuprofile')},null,2)+'\n');
const oracle=gunzipSync(fs.readFileSync('scripts/fixtures/office-obr8-plans.json.gz'));
assert.equal(sha(oracle),'b759894f164a271fa7273557fec41cee78b0db4dcb48de015435ffec313bed7f');
const suite=counts('obr9-all-tests-final.txt',3),approval=counts('obr9-baseline-final.txt');
const equivalence=counts('obr9-equivalence-final.txt');
const performance=[1,2,3].map(i=>{
 const name='obr9-performance-final-'+i+'.txt';counts(name);
 const [,first,warm]=read(name).match(/Node performance\s*\{\s*firstMs:\s*([\d.]+),\s*warmMs:\s*([\d.]+)/);
 assert.ok(+first<400&&+warm<3,name+' unchanged limits');return {회차:i,첫계획_ms:+first,웜_snapshot_ms:+warm,판정:'PASS'};
});
const audit=JSON.parse(read('obr9-audit-final.txt').match(/SUMMARY (\{[^\n]+\})/)[1]);assert.equal(audit.snapshots,54000);
for(const key of ['frozen','mismatch','stuckSeconds','near30','near24'])assert.equal(audit[key],0,key);
const pending=JSON.parse(fs.readFileSync('scripts/fixtures/office-redesign-233.json','utf8'));
assert.equal(pending.changes.find(c=>c.file==='hani-office-live.js').afterSha256,runtime);
const safety=json('obr9-safety.json');assert.equal(safety.runtimeSha256,runtime);assert.ok(safety.protectedFilesUnchanged);assert.ok(safety.fixtureUnchanged);assert.ok(safety.gitExports.every(r=>r.verified));
const result={
 작업:'obr9 · 동작 보존 성능 회복',날짜_KST:'2026-10-23',담당:'도연(Codex)',branch:'hani/release-train-20261023',baseSHA:'0b7bedde2583387a626a898f00dcb7a3ef4fecae',runtimeSHA256:runtime,
 상태:'구현·로컬 검증 완료. Git index.lock 권한 거절로 로컬 커밋 차단',
 전체회귀:suite,승인기록:approval,원본대조:equivalence,감사:audit,단독성능3회:performance,
 고정계획:{압축해제_SHA256:sha(oracle),사례:JSON.parse(oracle).records.length,검증:'원본 formal/outing/snapshot JSON bytes·deepEqual 및 109,561 route/tie oracle 유지. 별도 obr8 원본 Git 대조 8조합 통과'},
 프로파일:{변경전:before,변경후:after,주의:'CPU profile 계측에는 오버헤드가 포함되며 합격 판정은 위 단독 성능 테스트3회로만 수행'},
 보호범위:safety,기준:'첫 계획 <400ms, 웜 snapshot <3ms. 문구·체류·근접·결정성·저장소0 및 원본 assertion 유지',
 제한:['원격 main 최신 조회 연결 실패, 지정 obr8 기준 유지','기존 browser3 SKIP, 실제 Edge/폰 화면은 미검증','Candidate/package/One-Pass/HINA/main/Pages/Production read-back 미수행','push/PR/Notion 금지 준수','git add: .git/worktrees/obr/index.lock Permission denied; stage/commit0, 권한 우회 없음']
};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
const lines=[
 '# obr9 — 동작 보존 성능 회복','','2026-10-23 KST · 도연(Codex) 단독. **성능·byte 보존·전체 회귀 검증 통과. 로컬 커밋은 Git index.lock 권한 거절로 차단되어 미완료.**','',
 '## 기준과 변경','',
 '- branch `hani/release-train-20261023`, base `0b7bedde2583387a626a898f00dcb7a3ef4fecae`(obr8). 원격 main 조회는 네트워크 연결 실패로 최신성 미확인. 지정 기준에서 작업했으며 merge/rebase 없음.',
 '- CODEMAP living-office owner 확인, scheduler anchor CODEMAP_MISS 후 실제 createScheduler → plan/blockPlan → reserve → snapshot 경로 확인. 운영 변경은 hani-office-live.js 계산 경로 하나다. DOM/event/renderer/timer 추가 없음.',
 '- cpuprofile에서 반복 target resources 구성, static home/path 검사, group attempt와 reserve의 임시 객체 할당을 확인했다. 시간순 actor/층 점유 종료 인덱스, 원래 경로·홈 기하 판정의 메모리 cache, 이미 불가능한 시점/경로의 조기 종료, 자리를 떠나지 않는 동작의 빈 이동 배열 및 기존 안전 판정 재사용으로 계산을 줄였다.',
 '- 후보 카드 순위·상위3개 제한을 보존한다. 기하 조기 종료는 선택된 후보 안에서만 적용하며, 시간대 경계가 없는 구간에서 원래 동일 home/segment 계산을 재사용한다. 20.01/24.01px·정식/휴식/errand 체류·seed/재시도·취소 규칙은 유지한다.',
 '- 자택 동작의 빠른 예약은 available()의 동일 actor/층 자격 검사와 기존 staticSafe proof를 함께 사용한다. 다른 외출이 모든 allowed home을 연속 보호하므로 그 자리에서 움직이지 않는 동작에는 추가 이동 충돌이 생기지 않는다. 이동 후보의 resource/capacity/continuous sweep은 기존 경로에서 계속 검사한다.',
 '- resources cache를 public event로 내보낼 때 배열을 복사해 서로 다른 event의 resources alias를 추가하지 않는다. 캐시는 메모리에만 있으며 저장소/Cloud/schema/migration/write 변경0.',
 `- 최종 runtime SHA256: \`${runtime}\`. 버전/cache/index/마스코트/data/·행동 catalog·obr8 gzip 원문 불변. 기존 behavior-browser.json 및 타 untracked 작업 보존.`,'',
 '## 단독 성능3회','',
 '최종 runtime으로 기존 lively-v2 성능 테스트를 다른 검증과 겹치지 않게 새 Node 프로세스3개에서 순차 실행했다. 최초 formal+outing 계산을 포함하며 파일 읽기/JS 파싱은 기존 검사와 동일하게 제외한다. 400ms/3ms 기준과 기존 assertion은 변경하지 않았다. 최적화 도중 실패 표본은 PASS로 재사용하지 않았다.','',
 '|회차|하루 첫 계획 ms|웜 snapshot ms|판정|','|---|---:|---:|---|',
 ...performance.map(r=>`|${r.회차}|${r.첫계획_ms.toFixed(3)}|${r.웜_snapshot_ms.toFixed(3)}|PASS|`),'',
 `원인 측정용 CPU profile 전/후: 첫 계획 ${before.firstMs.toFixed(2)}→${after.firstMs.toFixed(2)}ms, formal ${before.formalMs.toFixed(2)}→${after.formalMs.toFixed(2)}ms, outing ${before.outingMs.toFixed(2)}→${after.outingMs.toFixed(2)}ms. 이 값은 계측 오버헤드가 포함된 참고치이며 위 단독 판정을 대체하지 않는다. obr9-before/after.json.cpuprofile 및 profile-summary.json에 근거 보존.`,'',
 '## 검증','',
 '|검사|결과|근거|','|---|---|---|',
 `|전체 office/building|${suite.전체}개: ${suite.통과} PASS / 0 FAIL / 기존 browser3 SKIP|obr9-all-tests-final.txt|`,
 `|233 pending 승인 기록|${approval.통과} PASS / 0 FAIL, 누락·중복·변조·이동·타파일 거절 유지|obr9-baseline-final.txt|`,
 '|obr8 frozen 계획|원본 gzip/hash 보존. 기존 formal/outing/snapshot byte 및 deepEqual 통과, 모든 route/tie order 보존|기존 obr6/obr8 tests|',
 '|추가 원본 대조|고정 obr8 Git source와 날짜·재실8조합, cache eviction/revisit, 시간대/그룹 경계 × 일반/reduced/summoned/cancel snapshot 일치, storage writes0|obr9-equivalence-final.txt|',
 '|감사|54,000 snapshot, frozen/mismatch/stuckSeconds/near30/near24 전부0|obr9-audit-final.txt|',
 '|syntax·diff·보호범위|syntax 및 diff check 통과. 금지 파일/고정 gzip HEAD 대비 byte 불변, Git export 원본 재검증|obr9-safety.json|','',
 '233 fixture는 기존7a10595 고정 Git 원본에서3 owner의 exact hunk로 명시적으로 재생성했다. before/after fragment 각각1회 및 완전 역변환 byte 검사 통과. 검증기와 기존 부정 assertion은 그대로다. 테스트 중 기대값 생성 없음. obr8 고정 source identity와 최적화된 obr9 runtime identity를 별도로 정확히 pin했으며 frozen 계획 hash/byte 비교는 변경하지 않았다.','',
 'Node Git subprocess는 EPERM으로 차단되어 기존 read-only obr5 공급기의 native Git blob export를 사용했다. 공급기는 각 원본 SHA256을 확인하며 현재 runtime을 Git oracle로 대체하지 않는다. 기본 스크립트 최초 실행의 환경 실패 로그는 obr9-all-tests-initial.txt에 별도 보존하며 최종 PASS로 인용하지 않는다.','',
 '## 인수인계와 남은 경계','',
 '- `git add -- hani-office-live.js`가 `.git/worktrees/obr/index.lock: Permission denied`(exit128)로 거절됐다. stage0·commit0, HEAD obr8 유지. 별도 index/권한 우회 없음. 아래 파일은 로컬 변경으로 보존했다.',
 '- 실제 Edge/폰 실화면·Candidate/package/One-Pass/독립HINA·main/Pages/Production read-back은 미수행. 기존 browser3 SKIP은 PASS가 아니다. 기능 담당의 버전 증가는 사용자 금지로 N/A, 표시 버전 보존은 별도 검사했다.',
 '- push/PR/Notion 없음(사용자 명시 금지). 서버 Edge Function/설정 동반 변경 없음. 다음 담당은 권한이 있는 환경에서 명시된 파일만 로컬 커밋한다. 배포 여부는 별도 승인 범위다.','',
 `한국어 결과 재현: \`node scripts/hani-office-obr9-report.mjs -o ${out}\`. 상세 명령과 파일 목록: docs/development-history/handoffs/2026-10-23-office-obr9.md.`,''
];
fs.writeFileSync(dir+'report-obr9.md',lines.join('\n'));
console.log('obr9 전체 회귀 '+suite.통과+' PASS/0 FAIL/3 SKIP, 승인 '+approval.통과+' PASS, 감사0, 단독 성능3회 PASS.');
console.log('보고서 '+dir+'report-obr9.md / 한국어 결과 '+out+' / 로컬 커밋: index.lock 권한 차단');
