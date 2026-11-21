// Refuse to declare completion while inventory, regression or preservation
// evidence is incomplete. Generated reports contain no application data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8').replace(/^\uFEFF/,''));
const s=read('test-summary.json'),p=read('preservation.json'),syntax=read('local/syntax-results.json');
assert.deepEqual(s.missing,[]);assert.deepEqual(s.baselineMissing,[]);assert.deepEqual(s.duplicates,[]);assert.deepEqual(s.regressions,[]);
assert.equal(s.baseline.files,274);assert.equal(s.current.files,276);
assert.deepEqual(p.unexpected,[]);assert.deepEqual(p.missing,[]);assert.ok(p.restored.every(r=>r.sameAsStart));
assert.equal(syntax.length,18);assert.ok(syntax.every(r=>r.exit===0));
for(const [file,count]of [['hani-audit-1.test.mjs',14],['hani-release-300.test.mjs',10]]){const r=s.added.find(r=>r.file===file);assert.equal(r.exit,0);assert.equal(r.pass,count);assert.equal(r.fail,0);}
const fmt=r=>`${r.files} (${r.success}/${r.nonzero}) | ${r.pass}/${r.fail}/${r.skip}`;
const report=`# tooling-300 · 300 출시 후 시험 층

2026-11-19 KST · 도연/Codex · \`hani/tooling-300\` / base \`9f49286\` · 구현·비교 완료, 서윤 인계(미커밋).

- **가져옴:** \`git show origin/hani/queen-last-month:<path>\`로 확인한 \`1af6992\`의 audit-1 source/preload/direct-input/test·delta 5파일과 기존 도구 6곳의 연결 1줄. \`hani-board-library-build.mjs\`는 보존.
- **새 층:** \`scripts/hani-release-300-{source,preload,reviewed-input}.cjs\`, \`hani-release-300-direct-input.mjs\`, \`hani-release-300.test.mjs\`, \`fixtures/release-300-layer.json\`. 순서 **300 version/history → audit-1 → 299 → 디자인2 → 이하**. 표시·캐시 60/1토큰과 연혁 맨 위 ‘점검 반영 1차’·299 commit 1881888 보완만 역변환. 기존 manifest·fixture는 무변경.
- **입력 연결:** 고정 300 원문일 때만 역사 비교를 고정 2220b61 범위로 맞춤. regression baseline import·legacy 시험 전용 연결·Node/서버 원문 일치 및 Ieum 최초 읽기 경계 보완. 운영 build/gate 진입은 이 legacy 어댑터 대상이 아님.

각 시험을 cwd=해당 폴더에서 \`node scripts/<파일>\`로 별도 순차 실행. Node ${s.node}, Windows PowerShell. 종료 0/비0과 Node 단언 누적은 별도 집계(단언 수 미출력 스크립트는 종료 코드만 기록).

| 대상 | 파일 수 (종료0/비0) | Node PASS/FAIL/SKIP |
|---|---|---|
| 출시 전 2220b61 | ${fmt(s.baseline)} |
| 작업본 | ${fmt(s.current)} |

**새 회귀 0, 누락·중복 0, script PASS 표식 ${s.baseline.positiveMarkers}→${s.current.positiveMarkers} 유지. audit-1 14/14 · 새300 10/10 · JS syntax 18/18 · diff whitespace PASS.** [시험별 숫자](TEST-RESULTS.md) · [집계](test-summary.json) · [보존 증거](preservation.json).

기존 시험 ${p.existingTestsPreserved}개·fixture ${p.existingFixturesPreserved}개와 운영 파일 보존, 저장·Cloud write 경로 변경 0. raw runtime 174파일이 독립 배포300 Git 원문과 일치하고 하위 closure 173→173→173→172→172→171→168→164·누락0. 지정 JSON 4개는 시작 바이트로 복구. 버전 증가 N/A(시험 도구 전용).

**남은 위험:** 기존 실패·Git child-process EPERM·브라우저/필수 인자 제약은 남아 있음(전부 PASS 아님). 실제 브라우저·Preview·Production 미검증. 원격 최신성 조회는 네트워크 차단으로 실패하여 전달 기준 SHA에 한정. baseline의 외부 원본 이미지 참조는 동일 파일 복사로 환경을 맞춘 뒤 재검증. commit·push·배포·Notion 미실행(요청대로 서윤 담당). \`local/\`는 로그·기준선·생성 자료이므로 통째로 commit 제외.
`;
fs.writeFileSync(path.join(__dirname,'REPORT.md'),report);
const handoff=path.resolve(__dirname,'../../docs/development-history/handoffs/2026-11-19-tooling-300.md');
let text=fs.readFileSync(handoff,'utf8').replace('도연 / Codex · 진행 중.','도연 / Codex · 구현·전체 비교 완료, 서윤 인계(미커밋).');
const marker='\n## 최종 결과와 인계\n';if(text.includes(marker))text=text.slice(0,text.indexOf(marker));
text+=`${marker}
- 변경: audit-1 5파일·연결6곳, 별도300 fixture/source/preload/test·고정299 역사 비교 어댑터, regression baseline import·legacy 시험 전용 runtime closure 연결 및 Node/서버 원문 일치 입력·Ieum 최초 읽기 경계. 기존 시험 본문/단언·hash·fixture·하위 dispatcher·board-library-build 보존.
- 최종 보정 검증: 전체 실행 뒤 영향 항목만 7개 및 5개 targeted 재실행. history226은 Node 단위 PASS 후 동일 browser EPERM, resolver parity3/3·Ieum17/17·release layers11/11 유지. script PASS 표식 ${s.baseline.positiveMarkers}→${s.current.positiveMarkers}도 대조.
- 환경/명령: Node ${s.node} / Windows PowerShell, \`& artifacts/tooling-300/run.ps1 -Phase baseline\`, \`& artifacts/tooling-300/run.ps1 -Phase current\`; 모든 mjs 시험을 각 cwd에서 별도 Node process로 순차 실행.
- 검증: 기준 ${s.baseline.files}파일 (${s.baseline.success} 종료0 / ${s.baseline.nonzero} 비0), 작업본 ${s.current.files}파일 (${s.current.success} 종료0 / ${s.current.nonzero} 비0). Node 단언 ${s.current.pass}PASS/${s.current.fail}기존FAIL/${s.current.skip}SKIP, 새 회귀0·누락/중복/수동 PASS 표식 손실0. audit-1 14/14·300 10/10·syntax18/18·whitespace PASS.
- 재실행 집계: PowerShell 배열 중첩을 보완하고 보존된 274개 baseline 행을 복구·원본 개별 로그와 대조. 최종 flat 행·누락/중복 검증 적용. 최초 실패 로그도 local/first-run/ 보존.
- 보존: 추적 ${p.tracked}파일 기준 허용 도구9곳 외 변경/누락0. 기존 시험${p.existingTestsPreserved}·fixture${p.existingFixturesPreserved} 보존. 운영/저장/Cloud write/schema 변경0. 지정 JSON4개 원문 복구.
- 증거: [REPORT](../../../artifacts/tooling-300/REPORT.md), [시험별 숫자](../../../artifacts/tooling-300/TEST-RESULTS.md), test-summary.json·preservation.json. local/의 전체 로그·최초 실패 로그·기준선 복사·생성 출력은 commit 제외.
- 미검증/위험: 기존 실패 및 환경 EPERM·브라우저 제약 유지. 원격 최신성 조회 실패. 실제 UI/Preview·Candidate·main/Pages/Production read-back 미실행. 버전 증가 N/A, 서버 동반 배포 없음.
- 다음 행동: 서윤이 보고서와 실제 diff를 확인하고 local/ 제외 후 commit·push·Notion을 담당. 이 작업은 배포/merge 승인이 아님. CURRENT·DECISIONS는 변경하지 않음.
`;
fs.writeFileSync(handoff,text);
console.log(JSON.stringify({report:'artifacts/tooling-300/REPORT.md',baseline:s.baseline,current:s.current,regressions:0,preserved:p.tracked,restored:4}));
