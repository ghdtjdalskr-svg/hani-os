# 미룬 일 치비툰 앱 반영

- 2026-11-08 KST / Codex / `hani/procrastination-chibitoon` / base `a28918df50ba5fef3e7dab498eaa5eec4a27a103`(v2.9.283). **구현·기능 시험 완료, 브라우저 화면 검증 차단.** 승인 근거: `../pb-toon2-task.md`와 11/8 시안 승인. Git 명령·커밋·push·merge·버전/캐시 변경·배포 없음. 원격 최신성 미확인, 커밋은 서윤 담당.
- **런타임 변경은 정확히 3개:** `hani-procrastination-board.js`, `hani-procrastination-board.css`, `assets/procrastination/pb-chibi-sheet-v1.webp`. 시트 1,393,906바이트·원본 SHA-256 일치. 기존 93개 보존 대상 중 두 owner 외 **91개 동일**. [파일·해시 감사](stage2/final-audit.json).
- 직원·제목 → 직원별 배경의 테두리 패널·꼬리 말풍선·치비 → 기존 단계/기간/기준/버튼. 6×5 시트를 CSS literal URL과 background-position으로 사용하고 unknown은 물음표 열. 다크 색상·직원명+단계 aria-label 추가. 기존 대사·계산·버튼·persistent slot·진입/refresh owner 유지. 새 timer/listener/저장/Cloud 경로 없음.
- **closure 168→164(-4), 누락0:** 사용하지 않는 thumb3·chibi2 참조 제거, 시트1 추가. 실제 그림 파일 삭제 없음. 기존 160개 한도는 **4개 초과(FAIL)**이며 검사/한도를 바꾸지 않았다. [정확한 추가·제외 목록](stage2/closure.json).

| 시험 기준 변경 | 처리·보존 근거 |
|---|---|
| 치비툰 → 기존 사진 카드 | pinned exact inverse 바깥 preload에서 JS/CSS 원문 전체 복원. 기존 시험 assertion은 그대로. raw 치비툰에도 기존 기능·렌더 assertion 별도 실행. mock에는 setAttribute만 추가. |
| v283 → 생활 묶음 v282 | 버전 바이트만 정확히 역변환하고 전후 hash·출현 수·drift 거부 확인. 생활 묶음의 네 역변환·기존 pin은 변경 없음. 운영 버전은 v283 유지. |
| 미seed 시험·개발 문서 | `../life-bundle`의 시험/helper/fixture를 복사. 개발보고서13편·목록은 pinned 시험 fixture에서만 제공, 실제 문서/런타임을 덮어쓰지 않음. 공개 Git 근거는 기존 cache이며 이번 독립 Git 검증 아님. |

| 검증 | 결과 |
|---|---|
| 생활 묶음 / study-retry / 기존 보드 / wishlist | 4/4 · 26/26 · 6/6 · 7/7 PASS |
| dev-report / raw 치비툰 | 10그룹 / 5/5 PASS |
| JS syntax | owner·갱신 browser·inverse/preload PASS |
| office 전체69파일 | **41파일 성공·28파일 Git 차단 / 745통과·35차단·3skip / 그 외 실패0.** 219는 사용자 지정 기존 실패, 이번에는 Git 차단이 먼저 발생. [집계](stage2/office-summary.json) · [Git 차단 파일 목록](stage2/git-blocked-files.md). |
| PC1280 / 폰390 / 다크·실제 화면 | **BLOCKED, PNG 0장.** Edge Playwright `spawn EPERM`, 별도 실행 CDP 연결 거부, 실행과 검증을 묶은 명령은 자동 실행 정책 거절. 브라우저 시험은 기존 assertion 유지 + 패널 경계/대사/30칸/대비/클릭/재사용/부작용 검사로 갱신했으나 실행 결과 PASS 아님. [차단 근거](shots/browser-blocked.json). |

재실행: `./artifacts/pb-toon/stage2/run-features.ps1`, `./artifacts/pb-toon/stage2/run-office.ps1`. 브라우저는 기존 NODE_PATH(`%USERPROFILE%/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`)와 지정 Edge로 `node scripts/hani-procrastination-board.browser.mjs <playwright/index.mjs> <msedge.exe>`. 합성 데이터만 사용하며 PNG는 `shots/`에 저장한다. [바로 열 수 있는 합성 미리보기](preview-2.html)는 실제 owner JS/CSS를 사용하며 `?theme=dark`도 지원한다. 이 파일 생성은 브라우저 PASS 근거가 아니다. PC/폰 넘침·다크 실화면·Android·Production 미검증. Candidate/build/One-Pass/HINA는 이번 기능 단계 N/A, 배포 승인 없음.

시험이 변경한 기존 산출물4개(obr16/17/19·drama reachability)는 실행 전 원문으로 복원했고, 이번 결과는 `stage2/generated-office/`에 보존했다. 기존137개 snapshot 대조, 작업 폴더 밖 신규 산출물0. [복원 근거](stage2/artifact-restoration.json). [기능 시험 명령·결과](stage2/features-results.json). 마지막 raw 감사도 위 세 런타임 파일만 변경됨을 확인했다.

**다음:** 서윤이 변경·차단 항목을 확인하고 실행 가능한 Edge 환경에서 세 화면과 실제 렌더 검증 후 커밋·열차 인계. 함께 배포할 서버/Edge Function·설정 변경 없음. 임시 Edge 프로필(`stage2/edge-profile/`) 정리 명령도 실행 정책이 거절하여 남아 있으며 커밋 대상에서 제외한다.

**Notion 갱신 대기:** 읽기는 성공했으나 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료. 전달 요약: 위 branch/base의 치비툰 3파일 구현, 기능·생활 시험 PASS, office69파일745통과·Git35차단·skip3·그 외 실패0, 원문 산출물4개 복원, closure164/누락0·한도4초과, Edge 화면/PNG 차단, Git·배포 없음, 다음 서윤 화면검증·커밋. [작업 인수인계](../../docs/development-history/handoffs/2026-11-08-pb-chibitoon-stage2.md).
