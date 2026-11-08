# 서윤 M9 표시 다듬기

## 작업 식별

- 2026-11-08 KST · Codex 단독 · LIGHT · 구현/단위 검증 완료, Edge/Git 차단으로 화면 검증·커밋 대기.
- worktree `m9-link` / branch `hani/m9-stage2-link` / 시작·종료 HEAD `4bdfa54063463a5863503eb7622d069bd4786b8b`.
- 승인: `../m9-polish-task.md` 전체 UTF-8 정상 확인. 표시 2건·시험·PC/폰 캡처·새 로컬 커밋 범위. push/merge/버전 변경 금지.
- 수정 범위는 착수 시 이 보고서에 기록한 archive JS/CSS·hub JS·시험 전용 exact inverse·증거. 기존 untracked 산출물 보존.
- CODEMAP_MISS: 조직/아카이브 owner 없음. 실제 `specialListingCard` → 기존 위임 click → `openPerson` → `showDetail` 확인.
- origin/main 캐시·merge-base `2bc93683182728877a6b8e543badb330a3312756`. `git ls-remote origin refs/heads/main`은 연결 실패로 최신성 미확인. merge/rebase 없음. 표시/cache `2.9.280`, UI owner 참조 `hani-ui-v02992.js?v=2.9.280` 유지. Production 실제 표시·로딩 미확인.

## 결과와 증거

- `hani-organization-hub.js`: 공통 제안 안내가 다른 AI 직원에게도 쓰임을 확인. 기존 상세 renderer에서 서윤만 `M9 특별 합류 · Platform Architect (하니 전무 승인)`으로 교체. 다른 18명 상세 HTML은 변경 전과 정확히 일치, MIR 제안 안내 유지.
- `hani-character-archive.js/css`: 특별 카드 배지 `M9 특별 합류`로 축약. PC(601px 이상) 서윤 특별 카드 제목/직함만 keep-all, 직함 span inline-block. 폰용 CSS·grid·event owner 보존. 폰 실제 배치·PC 줄바꿈은 브라우저 차단으로 미검증.
- 운영 diff는 위 3파일, 4줄 추가·2줄 삭제. 데이터·보호 저장소·Cloud/schema·timer/listener·그림·버전/cache 경로 변경 없음.
- 기존 assertion 삭제·완화 0. 새 `scripts/hani-m9-polish-source.cjs`, `-preload.cjs`, `fixtures/m9-polish-delta.json`은 변경 3파일의 정확한 전후 SHA와 고유 치환을 검증하는 시험 전용 바깥 레이어. runtime 연결 없음.

| 실행 명령 | 실제 결과 / 이 폴더 증거 |
|---|---|
| `node --test --test-isolation=none scripts/hani-m9-polish.test.mjs` | 실제 card/detail owner·18명 보존·역변환 변조 거부 2/2 PASS · `polish-unit.log` |
| `node --require ./scripts/hani-m9-polish-preload.cjs --test --test-isolation=none scripts/hani-m9-link.test.mjs` | 기능·보존 9 PASS / 기존 패키징 1 FAIL · `m9-link.log` |
| `node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs` | 15/15 PASS · `seoyun-m9.log` |
| `node --require ./scripts/hani-m9-polish-preload.cjs scripts/hani-character-archive.test.cjs` | PASS · `archive-unit.log` |
| `node scripts/hani-history-226.test.mjs --unit-only` | 실제 hub 포함 unit PASS · `organization-unit.log` |
| `node scripts/hani-m9-polish.browser.mjs` | Edge `spawn EPERM`, PC1280×900·폰390 캡처 0 · `browser.json/log` |
| archive UI/integration, `check-organization-hub.mjs` (Edge 지정) | 모두 시작 시 `spawn EPERM` · `archive-ui.log`, `archive-integration.log`, `organization-ui.log` |
| `node --check` (운영 JS2·새 CJS2/MJS2), `git -c core.whitespace=cr-at-eol diff --check` | PASS |

- 패키징 실패는 기존 4개 참조(`issues.json`, `extra-m9.json`, 호외 만화, 기념 컷)가 resolver 수집 밖인 동일 문제. 이번 표시 변경으로 gate/resolver를 수정하지 않음. 이전 근거 `artifacts/m9-link/PACKAGING.md` 참조.
- 브라우저 스크립트는 기존 `hani-m9-link.browser.mjs` 재사용. 변경 전/후 격리 실행, PC 배지·직함 한 줄 및 폰 CSS/열/사진 크기 비교, 카드·기존 상세/확정 안내 캡처, Escape·overflow·저장0 검사를 준비했으나 실행 차단으로 PASS 아님. 이전 PNG를 새 결과로 복사하지 않음.
- **미커밋:** 명시한 파일의 `git add -- ...`가 `.git/worktrees/m9-link/index.lock: Permission denied`로 실패. push/PR/merge/배포 없음. Candidate/build/One-Pass/HINA·Production read-back은 기능 담당 범위 밖으로 N/A.
- **Notion 갱신 대기:** 현황판 읽기 성공. 착수 저장은 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 완료 아님.

## 다음 담당에게

- Edge 실행 가능한 환경에서 `node scripts/hani-m9-polish.browser.mjs`로 PC1280×900·폰390 카드/상세 PNG와 줄바꿈·폰 배치를 확인한 뒤, 위 변경 및 이 폴더 증거를 새 로컬 커밋. 사용자 지시대로 push/merge/버전 변경은 하지 않음.
- 남은 위험: 실제 화면 미검증, 기존 패키징 누락, 원격 main 최신성 미확인. 함께 배포할 서버 변경 없음. 이 기록은 배포 승인이 아님.
- Notion 대기 요약: 서윤 확정 안내·짧은 배지·PC 직함 보정, 전용2/M9 15/archive/organization unit PASS, link9 PASS·기존 package1 FAIL, Edge EPERM·PNG0, Git 권한 차단·미커밋. 위 branch/base/보고서 링크와 함께 기록 필요.
- CURRENT/DECISIONS의 다른 담당·과거 기록 보존.
