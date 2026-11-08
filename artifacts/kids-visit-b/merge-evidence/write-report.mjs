import fs from 'node:fs';
const out='artifacts/kids-visit-b/merge-evidence';
const json=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const summary=json(out+'/final-summary.json'),audit=json(out+'/audit.json'),restored=json(out+'/artifact-restoration.json');
const result=file=>summary.results.find(r=>r.file===file);
const show=r=>`${r.pass} 통과 / ${r.gitFailures||0} Git 차단 / ${r.otherFailures||0} 기타 실패 / ${r.skipped} skip`;
const rows=[['office 전체',`${summary.files}파일 · ${summary.pass}통과 · ${summary.gitBlockedAssertions} Git 차단 · ${summary.otherFailures} 기타 실패 · ${summary.skipped} skip`],
 ...[['kids weekday','hani-office-kids-weekday.test.mjs'],['kids B','hani-office-kids-pose-b.test.mjs'],['kids lively','hani-office-kids-lively.test.mjs'],['kids visit','hani-office-kids-visit.test.mjs'],['결합 runtime','hani-office-kids-merge.test.mjs'],['main 친밀도 cap','hani-office-affinity-cap.test.mjs'],['main 마스코트','hani-office-mascot-label.test.mjs']].map(([label,file])=>[label,show(result(file))]),['M9',`${summary.m9.pass} 통과 / ${summary.m9.fail} 실패`],['문법·안전','11파일 문법 통과 · 저장/Cloud/새 timer/listener 추가 0 · 원문 closure164/누락0'],['Edge1280/390','미완료: spawn EPERM, 직접 실행 Windows 접근 거부 · PNG 0장']];
const report=`# 꼬마 남매 B + 평일 방문 · main 284 병합 정리

2026-11-08 KST · Codex · \`hani/kids-visit-pose-b\` · 지정 main \`5c375d9\`(v2.9.284). **파일 충돌 4개 정리, Git index 처리·커밋은 서윤 인계.** Git 명령·버전 증가·배포 없음.

- 런타임은 main의 친밀도 하루 2점·마스코트 이름표와 B 시트·평일 방문·아빠/이모 대사를 모두 보존했다. 아이들 변경을 모두 역변환하면 main 고정 SHA256 \`8d2db079…cd54e\`와 바이트 일치한다. CURRENT 양쪽 기록 보존.
- 시험 체인: **weekday → pose B → main mascot/cap → M9 → 기존 office**. 공통 \`hani-release-version-layers\`는 이 worktree와 지정 tooling-284 경로에서 찾지 못해 기존 283 방식에 정확한 284→283 버전 inverse를 연결했다. 283 고정 pin·생활 묶음 inverse·치비툰 및 기존 assertion 보존. raw index/main 기준 사본은 독립 283 pin에서 버전60/1개만 284로 변환했다.

| 검사 | 결과 |
|---|---|
${rows.map(([name,value])=>`| ${name} | ${value} |`).join('\n')}

전체 파일별 결과와 **Git 차단 파일 목록만** [전체 표](merge-evidence/results.md)에 정리했다. 219는 지정된 기존 실패이며 이번 실행은 Git에서 차단되어 기존 assertion 재현은 미검증이다. 통과 수에는 공통 fixture 시험이 포함되며 재검사는 중복 합산하지 않았다.

**잔여 성능 실패 1건:** cafe-rest의 400ms 제한이 결합본 단독 재검사(최소496ms)와 **고정 main 단독 실행(최소460ms)**에서 모두 실패했다. scheduler·400ms assertion은 보존했고 PASS로 바꾸지 않았다. [순차 측정값·main identity](merge-evidence/performance.json). 병렬 진단값은 근거에서 제외했다.

**런타임 변경 목록(main 대비):** \`hani-office-live.js\`, \`hani-office-live.css\`, \`assets/office-companions/kids-v2.webp\`. 이번 충돌 정리에서 직접 바꾼 런타임은 JS 1개다. main의 친밀도 owner 전체·저장 키·저장 호출과 Cloud 경로 보존, 보호 키 신규 write/remove/clear 0, 새 timer/listener 0. 기존 저장 시험은 격리 VM만 사용했다.

**화면 미검증:** 평일 \`2026-01-02 16:00 KST\`, 날짜 seed \`${audit.screenshotSample.dateSeed} % 4 = 0\`, PC1280/폰390 각 1장 실행기를 준비했다. Edge 실행 권한 차단으로 새 캡처는 없으며 예전 그림을 재사용하지 않았다. [실행기](capture-merge.mjs) · [실패 근거](merge-shots/browser-results.json). 허용된 환경에서 \`node artifacts/kids-visit-b/capture-merge.mjs\` 재실행이 남았다.

자동 생성 JSON ${restored.changed.length}개를 착수 바이트로 복원하고 신규 출력 ${restored.added.length}개는 별도 근거로 보존했다. [안전·identity](merge-evidence/audit.json) · [집계/명령](merge-evidence/final-summary.json). 현재 runtime SHA256 \`${audit.runtimeSha256}\`.

**인계:** 서윤이 실제 Git 차단 검사·index 상태 확인 후 커밋. Edge 실화면, 원격 최신성, 최종 Candidate/HINA/운영 read-back은 미검증 또는 개발 범위 밖이다. Notion 현황판은 읽었으나 착수 쓰기가 자동 승인 검토에서 \`approval policy is never\`로 거절되어 완료 요약도 갱신 대기다. 임시 Edge 프로필 정리 명령도 실행 정책에서 거절되어 해당 임시 폴더는 근거 폴더에 남아 있다.
`;
fs.writeFileSync('artifacts/kids-visit-b/REPORT-merge.md',report.replaceAll('\`','`'));
const handoff=`# 꼬마 남매 B + 평일 방문 · main 284 병합 인수인계

## 작업 식별

- 작업 ID / 제목: kids-b-merge / 진행 중 병합 파일 충돌 정리
- 갱신 시각(KST): 2026-11-08
- 담당 도구 / 검토 담당: Codex 단독 / 서윤 후속 커밋
- 상태: 코드·실행 가능한 시험 완료 / Edge·Notion 차단 / Git 최종 처리 대기
- 저장소 / branch / worktree: hani-os / hani/kids-visit-pose-b / kids-visit-b (대표님 지정, Git 조회 없음)
- base SHA / candidate SHA: 지정 main 5c375d9(v2.9.284), 기존 branch 기준 bbe71c0 / Candidate 아님
- 목표 / 완료 조건: 충돌4개 정리·양쪽 기능 보존·office/kids 시험은 완료, Edge 새 PNG는 미완료
- 수정 범위: 기존 office JS 충돌, M9·mascot 시험 연결, kids exact inverse/기준 사본, 284→283 시험 inverse, CURRENT 양쪽 보존 및 작업 기록
- 사용자 승인 근거 / 승인되지 않은 경계: ../kids-b-merge-task.md 전체 수행. Git 명령·커밋·push·새 merge·배포·버전 증가 없음. 저장/Cloud/schema 변경 없음.

## 결과와 증거

- 상세 변경·표·명령: artifacts/kids-visit-b/REPORT-merge.md 및 merge-evidence/final-summary.json
- 검증: office ${summary.files}파일 ${summary.pass}통과·${summary.gitBlockedAssertions}Git 차단·${summary.otherFailures}기타 실패·${summary.skipped}skip, M9 ${summary.m9.pass}/${summary.m9.pass+summary.m9.fail}. 기타1건은 cafe-rest 400ms 제한으로 고정main 단독에서도 최소460ms로 재현. 제한·scheduler 보존, PASS 처리 없음. 문법11/11, main 전체 해시 복원·기존 assertion 보존·저장/Cloud/새timer/listener0. 원문 closure164/누락0.
- 데이터·저장소·Cloud·schema 영향: 없음. 기존 cap owner 전체 바이트 보존. 운영 데이터 접근 없음.
- 미검증: Edge spawn EPERM/Windows 접근 거부로 PC1280/폰390 PNG0. 올바른 평일·16시 실행기 준비. Git 검사 차단 뒤 assertion은 미검증, 219 기존 실패는 이번에 Git에서 차단.
- CODEMAP: living-office owner 확인, kids anchor 없음(CODEMAP_MISS). 기존 companionPeople/companionSnapshot/updateResidents 경로 사용.
- 기준선 / identity: main office ${audit.mainOfficeSha256}; 결합 runtime ${audit.runtimeSha256}. 284 version inverse는 기존 283 pin과 정확히 일치하며, 공통 version-layers 파일 부재로 기존283방식을 따름.
- main / Pages / 표시 버전 / 최신 JS / 기능 read-back: main 병합 진행 중·커밋 없음. 로컬 표시/cache2.9.284, hani-ui-v02992.js?v=2.9.284, 마지막 hani-launch-greeting.js. Pages·Production·원격 최신성 새 확인 없음. Candidate/HINA 미수행.
- PR / 배포: 없음. 서버 Edge Function·설정 변경 없음.
- 부산물: JSON ${restored.changed.length}개 착수 바이트 복원, 신규 출력 ${restored.added.length}개 별도 보존. 임시 프로필 정리 명령은 정책 거절, 작은 임시 폴더 잔여.
- Notion: 현황판 읽기 완료. 착수 append가 자동 승인 검토에서 approval policy is never로 거절되어 저장/read-back 없음. 위 완료·차단 요약 갱신 대기.

## 다음 담당에게

- 먼저 읽을 파일·함수: REPORT-merge.md, merge-evidence/results.md, 기존 companionSnapshot/updateResidents
- 다음 한 가지 행동: 허용 환경에서 Edge 캡처·Git 차단 검사·기존 main 성능 잔여 확인 후 서윤이 index 처리·커밋
- blocker / 필요한 사용자 결정: 환경의 Edge 실행 권한과 Notion 쓰기 정책. 추가 데이터/배포 승인 요청 없음.
- 다른 작업 영향: 타 worktree 수정 없음. main의 cap·mascot·생활 묶음·284치비툰 보존. 수정된 시험 fixture/기준 사본도 함께 검토·커밋 필요.
- CURRENT / DECISIONS: 양쪽 CURRENT 기록 보존 후 이 결과 요약 추가. 새 결정 없음.
`;
fs.writeFileSync('docs/development-history/handoffs/2026-11-08-kids-b-merge.md',handoff);
const current='docs/development-history/CURRENT.md',before=fs.readFileSync(current,'utf8');
if(!before.startsWith('# 2026-11-08 · kids B + 평일 방문 main284 충돌 정리'))fs.writeFileSync(current,`# 2026-11-08 · kids B + 평일 방문 main284 충돌 정리 (Codex)

hani/kids-visit-pose-b / 지정 main5c375d9(v2.9.284), Git 명령0. **파일 충돌4개 정리·양쪽 기능 보존, office${summary.files}파일${summary.pass}통과·${summary.gitBlockedAssertions}Git 차단·${summary.otherFailures}기타 실패·${summary.skipped}skip, M9${summary.m9.pass}통과, 문법11/11·원문closure164/누락0·저장/Cloud/새timer/listener0.** 기타1건은400ms성능으로 고정main 단독에서도460ms로 재현·제한 유지. 283pin·기존assertion 보존, weekday→B→main체인 연결. **Edge spawn EPERM/Windows 접근 거부로 새PNG0**, 실제Git검사·index처리·커밋은 서윤 인계. 표시/cache284유지·배포 없음. Notion 착수 쓰기 자동 승인 never 거절로 갱신 대기. [짧은 보고서](../../artifacts/kids-visit-b/REPORT-merge.md) · [인수인계](handoffs/2026-11-08-kids-b-merge.md). 아래 양쪽·과거 기록 보존.

`+before);
console.log(JSON.stringify({report:'artifacts/kids-visit-b/REPORT-merge.md',handoff:'docs/development-history/handoffs/2026-11-08-kids-b-merge.md'}));
