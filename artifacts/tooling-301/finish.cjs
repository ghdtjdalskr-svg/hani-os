const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,local=path.join(dir,'local'),read=f=>JSON.parse(fs.readFileSync(path.join(dir,f)));
const comparison=read('comparison.json'),preservation=read('preservation.json');
const current=read('local/current-results.json'),baseline=read('local/baseline-results.json');
const extra=fs.readdirSync(local).filter(f=>/^perf-.*-results\.json$/.test(f)).map(file=>({run:file.replace('-results.json',''),results:read('local/'+file)}));
const perf={initial:{baseline:baseline.filter(r=>/office-(cafe-rest|residents|companion-homes|staff-chat|lively-v2)\.test/.test(r.file)),current:current.filter(r=>/office-(cafe-rest|residents|companion-homes|staff-chat|lively-v2)\.test/.test(r.file))},reruns:extra};
fs.writeFileSync(path.join(dir,'performance.json'),JSON.stringify(perf,null,2)+'\n');
const metric=r=>`${r.files}파일: 종료0 ${r.exit0} / 실패 ${r.failed} / 시간초과 ${r.timeout}; Node ${r.pass} PASS·${r.fail} FAIL·${r.skip} SKIP`;
const testRows=current.filter(r=>/hani-(release-30[01]|audit-1|ieum-seat(?:-layer|-history)?)\.test/.test(r.file));
const lines=['# tooling-301 · 출시 후 시험 층','','- 담당·기준: 도연 / Codex, `hani/tooling-301` @ `0558dc3`; 독립 Git 객체 복사본 `ad95b84`와 대조. 원격 조회는 네트워크 연결 실패.','- 새 층: `scripts/hani-release-301-{source,preload,reviewed-input}.cjs`, `hani-release-301.test.mjs`, `fixtures/release-301-layer.json`. 순서 **301 version/history → ieum-seat → 300 → audit-1 → 299 이하**.','- 301 표시·캐시 60+1개와 history 새 항목/300 provenance만 exact inverse. 자리 교체 소유6파일은 기존 fixture와 실제301 Git 원문 일치, fixture 수정0.','- 복사된 ieum-seat 3파일은 source/preload 및 history 진입 import만 변경. 기존 시험·단언·숫자/hash·fixture 및 release300 연결 원문 보존.','',`- 기준 ${metric(comparison.baseline)}.`,`- 현재 ${metric(comparison.current)}.`,`- 비교: 새 회귀 후보 ${comparison.regressions.length}, 누락 ${comparison.missing.length}. script PASS 표식 ${comparison.baseline.scriptPass}→${comparison.current.scriptPass}.`, '- 전체 시험별 숫자·종료 상태: [TEST-RESULTS.md](TEST-RESULTS.md), [comparison.json](comparison.json). 단언 요약 미출력 시험은 파일 종료 결과로 구분.','','| 핵심 시험 | PASS / FAIL / SKIP |','|---|---|'];
for(const r of testRows)lines.push(`| ${r.file} | ${r.pass} / ${r.fail} / ${r.skip} |`);
lines.push('',`- 보존: 최초 ${preservation.snapshot}파일 감사, 허용 import 변경3곳 외 변경·누락 ${preservation.unexpected.length+preservation.missing.length}; 기존시험 ${preservation.existingTestsPreserved}·fixture ${preservation.fixturesPreserved} 보존, 보호·운영·저장·Cloud 변경0. 지정 JSON4개 원문 복원. 기준 복사본 ${preservation.baselineFiles}파일도 생성4개 외 원문 drift0. [preservation.json](preservation.json).`,'- 검증 환경: Windows PowerShell / Node '+process.version+'; `& artifacts/tooling-301/run.ps1 -Phase baseline`, `-Phase current`로 각각 cwd에서 `node scripts/<파일>` 순차 실행(파일당90초 제한). JS syntax·PowerShell parser·whitespace 확인.','- 성능 재실행 숫자: [PERFORMANCE.md](PERFORMANCE.md), [performance.json](performance.json). 지정5개 중 실패한 시험은 2회 추가 실행. 최초/재실행 로그를 모두 보존.','- 남은 위험: 기존 실패·Git/브라우저 subprocess EPERM·의존성 부재와 90초 내 미완료 시험은 미해결/미검증. 실브라우저·Preview·Candidate·Production 검증 미실행. 버전 증가 N/A(도구 전용).',comparison.regressions.length?'  - 새 회귀 후보: '+comparison.regressions.join(', ')+'. 성능 재실행/개별 원인 대조를 함께 확인.':'  - 기준에서 성공한 시험의 새 실패 없음. 전체 PASS 선언은 하지 않음.','- commit·push·merge·배포·Notion 작업 없음(명시 금지, 서윤 담당). 기존 staged 복사본과 다른 담당 문서 보존. `local/` 전체 로그·원본·독립복사본은 커밋 제외.','');
const validationLine=lines.findIndex(s=>s.startsWith('- 검증 환경:'));
lines[validationLine]=lines[validationLine].replace('JS syntax·PowerShell parser·whitespace 확인.','JS 16파일 syntax·PowerShell 2파일 parser·whitespace PASS.');
lines.splice(lines.findIndex(s=>s.startsWith('- 남은 위험:')),0,
 '- 성능 재실행: cafe-rest·companion-homes·lively-v2 각 2회, 모두 기준과 동일한 Git EPERM 1건만 실패. 카페·lively-v2의 400ms 성능 단언은 두 차례 모두 PASS. residents 49/49·staff-chat 17/17은 전체 실행에서 PASS.',
 '- 기준/현재 공통 90초 미완료: bori-stroll·kids-weekday·obr14. 이 3건은 PASS가 아닌 미검증으로 유지.',
 '- 시험 생성 미추적 16파일은 hash 검증 후 local/generated/로 보존 이관. local/generated-relocation.json에 원래 위치와 hash 기록. 착수 파일 이동·덮어쓰기 없음.');
fs.writeFileSync(path.join(dir,'REPORT.md'),lines.join('\n'));
const perfLines=['# tooling-301 · 성능 재실행','','숫자: 종료 코드 / Node PASS·FAIL·SKIP. timeout은90초 미완료. 최초 로그도 보존.','','| 실행 | 시험 | 종료 / PASS·FAIL·SKIP | 초 |','|---|---|---|---|'];
for(const [label,rows]of [['baseline',perf.initial.baseline],['current',perf.initial.current],...extra.map(r=>[r.run,r.results])])for(const r of rows)perfLines.push(`| ${label} | ${r.file} | ${r.timeout?'timeout':r.exit} / ${r.pass}·${r.fail}·${r.skip} | ${r.seconds} |`);
perfLines.splice(4,0,'작업본에서 실패한 cafe-rest·companion-homes·lively-v2를 각각 2회 추가 실행했다. 6회 모두 Git 원문 조회의 spawnSync git EPERM 1건만 실패했다. 카페·lively-v2의 400ms 성능 단언은 2회 모두 통과했다. residents·staff-chat은 전체 실행에서 기준/현재 모두 통과했다.','');
fs.writeFileSync(path.join(dir,'PERFORMANCE.md'),perfLines.join('\n')+'\n');
const handoff=path.resolve(dir,'../../docs/development-history/handoffs/2026-11-20-tooling-301.md');
const original=fs.readFileSync(handoff,'utf8').split('\n## 최종 결과와 인계')[0];
fs.writeFileSync(handoff,original+'\n## 최종 결과와 인계\n\n'+[
 '- 상태: 로컬 구현·전체 실행 비교 완료. 기존/환경 실패와 시간초과가 남아 전체 PASS로 선언하지 않음.',
 '- 변경: 새301 metadata/history exact inverse와 고정 history 선택기, 부정·fs동작·closure·Git증거 시험7개. 새 ieum-seat 3파일의 import 연결만 변경, 기존 release300 source/reviewed 연결은 전달 상태 그대로.',
 '- 환경·검증: '+metric(comparison.baseline)+'(기준), '+metric(comparison.current)+'(현재). 새 회귀 후보 '+comparison.regressions.length+' / 누락 '+comparison.missing.length+'. 핵심6파일 '+testRows.reduce((s,r)=>s+r.pass,0)+' PASS / '+testRows.reduce((s,r)=>s+r.fail,0)+' FAIL. syntax 및 PowerShell parser, git diff --check 확인.',
 '- 원문 보존: 초기 '+preservation.snapshot+'파일·기준 '+preservation.baselineFiles+'파일 감사, 허용 import3곳/생성4개 외 drift0. 보호 경로·운영·데이터·저장·Cloud·schema 변경0. 지정JSON4개 복원. 버전 증가 N/A.',
 '- 증거: artifacts/tooling-301/REPORT.md, TEST-RESULTS.md, comparison.json, PERFORMANCE.md, performance.json, preservation.json. local/의 원본·baseline·전체 로그는 커밋 제외. 시험 생성16파일은 hash 보존 검증 후 local/generated/로 이관, generated-relocation.json에 원래 위치·hash 보존.',
 '- 성능: cafe-rest·companion-homes·lively-v2 각2회 추가 실행, 6회 모두 기준과 동일한 Git EPERM 1건만 실패. 카페/lively 400ms 단언은 두 차례 모두 PASS. residents49/49·staff-chat17/17 PASS. 공통 timeout3건(bori-stroll/kids-weekday/obr14)은 미검증 유지.',
 '- 미검증·위험: 기존 실패·환경 EPERM/의존성 부재·시간초과를 PASS로 표시하지 않음. 새 회귀 후보가 있으면 comparison과 성능 재실행 결과를 함께 확인. 원격 최신성·실제 UI/Preview·Candidate/Build/One-Pass/HINA·main/Pages/Production 미실행.',
 '- 승인 범위: 시험 층 개발·검증만. commit·push·merge·배포·Notion 명시 금지로 미실행, 서버 동반 배포 없음. CURRENT·DECISIONS 보존.',
 '- 다음 한 가지 행동: 서윤이 보고서·실제 diff 및 남은 실패를 검토하고 local/ 제외 후 commit·push·Notion 담당. 배포/merge 승인을 추정하지 않음.'
 ].join('\n')+'\n');
console.log(JSON.stringify({report:'artifacts/tooling-301/REPORT.md',baseline:comparison.baseline,current:comparison.current,regressions:comparison.regressions,rerunGroups:extra.length}));
