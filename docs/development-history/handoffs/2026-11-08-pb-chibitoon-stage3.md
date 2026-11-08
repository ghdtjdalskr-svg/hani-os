# 미룬 일 치비툰 3단계

## 작업 식별

- 갱신: 2026-11-08 KST / Codex / 구현·지정 시험·부산물 복원 완료, 검토 인계.
- worktree `pb-toon`, branch `hani/procrastination-chibitoon`, HEAD `bc4934625fc89f79dea4bb7ac57a5766dd195bf9`, 로컬 origin/main `dca9ecf5ae3b49f94e94f3a5ba4072020905bfbf`. ref 파일 직접 읽기, Git 명령 및 원격 조회 없음.
- 승인: `../pb-toon3-task.md` 전체 UTF-8 정상 확인. 시험 두 실패 수정, 지정 시험, 부산물 복원, main 대비 런타임 확인만 허용. Git·런타임 수정·merge·배포 금지.
- 범위: 보드 synthetic DOM helper, 치비툰 시험의 legacy 원문 pin 및 시험 fixture, legacy preload의 중복 버전 역변환 제거, `artifacts/pb-toon/REPORT-3.md`와 작업 증거. 런타임·다른 담당 파일은 수정하지 않음.
- CODEMAP_MISS: 치비툰/미룬 일 시험 항목 없음. 실제 `runRenderCases`, legacy preload, main의 생활 묶음 reader 경로를 확인.

## 결과와 증거

- 계획: 부산물 보존 → 실패 재현 → 원문 pin/DOM 모형 수정 → 지정 기능·생활·office(219 제외) 시험 → 부산물 복원 → 런타임 바이트 비교.
- main의 raw reader와 구 preload가 충돌하는 추가 원인 확인: preload의 283→282 투영 제거, main의 canonical inverse에 맡김. legacy main/index 최종 출력은 전후 SHA 동일. 직접 raw reader를 쓰는 기능 시험·남매 방문을 재실행하며 직원 수다는 뒤 순서에서 최종 preload로 실행. 관련 assertion·fixture hash 완화 없음.
- 변경 파일: `scripts/hani-procrastination-cases.mjs`, `scripts/hani-pb-chibitoon.test.mjs`, `scripts/hani-pb-chibitoon-legacy-preload.mjs`. 새 main 원문 fixture·검증 도구·로그는 `artifacts/pb-toon/stage3/`, 짧은 결과는 `artifacts/pb-toon/REPORT-3.md`.
- 기능 최종 재실행: 치비툰5/5·보드6/6·생활 source5/5·학습26/26·위시7/7·개발보고서10그룹 PASS. 남매 방문16/16·최종 preload 직원 수다 PASS. 수정 JS syntax3/3 PASS.
- Office 최종: 219 제외68파일 모두 시도, 41파일 성공·27파일 Git 차단. 745통과·34건 Git 차단·기존3skip·기타실패0. 차단 목록은 `stage3/git-blocked-files.md`, 명령·최종 로그 연결은 `stage3/results.json`, 집계는 `stage3/summary.json`. 차단을 PASS로 계산하지 않음.
- 부산물: obr16/17/19 layout·drama reachability JSON4개 복원, 사전 보존454개 원문 SHA 모두 일치·작업 폴더 밖 신규0. 새 결과는 stage3/generated 보존. `stage3/artifact-restoration.json` 참조. 복원 후 런타임500파일 재대조도 이번 변경0·main 대비 JS/CSS2개·시트0 확인.
- main 객체·ref를 읽기 전용으로 직접 파싱하고 객체 SHA-1 무결성 확인: 런타임500개 중 main 차이 JS/CSS2개, 시트0. 착수 대비 런타임 변경0·새 런타임0·누락0. main 원문 fixture 바이트 일치·정규화 SHA-256 pin 추가. `stage3/runtime-audit.json`, `assertion-preservation.json`, `preload-reader-equivalence.json`에 근거.
- Notion 현황판·Markdown 규격 읽기 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 갱신 대기. 재승인 요청 없이 로컬 근거에 보존.
- 운영 데이터·보호 저장소·Cloud/schema·표시 버전 변경 없음. Candidate/PR/main/Pages/Production 검증은 범위 밖.

## 다음 담당에게

- `artifacts/pb-toon/REPORT-3.md`에 변경·명령·시험·미검증·부산물 복원·main 비교를 확정했다. Node 기본 격리는 spawn EPERM이라 `--test-isolation=none`으로 실행. 브라우저/Preview·원격 최신성·Candidate/PR/main/Pages/운영 로딩·Production read-back은 미검증 또는 범위 밖. 기능 개발·시험 완료를 배포 완료로 선언하지 않음.
- CURRENT/DECISIONS 및 과거 기록 보존. Notion 미반영 요약은 본 인수인계에 남긴다.
- 다음 담당은 서윤: 보고서·시험3파일·새 원문 fixture를 검토한 뒤 커밋 여부 판단. 이 작업에서는 Git·PR·push·merge·배포를 수행하지 않는다. 서버/Edge Function·설정 변경 및 배포 순서 추가 없음.
- Notion 갱신 대기 전달문: 2026-11-08 KST / Codex pb-toon3 / HEAD bc49346·main dca9ecf / main legacy 원문 pin·DOM setAttribute·preload 중복 버전 투영 수정 / 기능 전부 PASS·office68파일745통과34Git차단3skip기타실패0 / JSON4복원·454원문 일치 / 이번 런타임0·main 대비 JS/CSS2개·시트0 / Git·배포 없음 / 다음 서윤 시험변경 검토·커밋. 원문은 본 인수인계와 REPORT-3. Notion 쓰기 자동 승인 거절로 저장/read-back 미완료이며 갱신 완료로 보고하지 않는다.
