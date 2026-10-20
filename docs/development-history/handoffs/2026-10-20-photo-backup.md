# 사진 Google Drive 백업 · 작업 인수인계

## 작업 식별

- 날짜(KST): 2026-10-20 / 담당: 도연(Codex).
- 상태: 구현·targeted 검증 완료, Git 권한 차단으로 미커밋 보존/인계 대기. 운영 배포 완료 아님.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/photo-backup / photobak.
- base SHA: 3919a257abec42b4b6ea68ecc9b9d6e68431cf47 (GitHub main 조회 일치).
- 표시 버전 및 cache: 2.9.221 유지. 마지막 script hani-ai-budget.js?v=2.9.221. 운영 화면 재실행은 미수행.
- 범위: hani-drive-vault.js, hani-main.js의 읽기 전용 Drive adapter, hani-media-core.js의 무알림 getLocal 읽기, index.html의 Vault UI, 신규 테스트와 C 실행 문서.
- 승인: 대표님 2026-10-20 요청. 사진 폴더 백업 구현 및 C 실행 문서 준비. C 실행 승인 사실은 보존하되 이 작업에서는 실제 실행 금지.
- 보호 저장소 쓰기·Cloud 요청·schema 변경·버전 증가·main 병합·배포 없음.
- CODEMAP_MISS: Drive Vault/미디어 분리 소유 경로가 codemap에 없음. 지정 파일과 해당 adapter/핸들러를 좁혀 조사.

## 결과와 증거

- `hani-drive-vault.js`: `HANI_OS_photos/books|movies/<safe-title>__<파일 digest8>.<실제 확장자>` 및 manifest. 파일 바이트 SHA-256 기준 중복 제거, 모든 연결 기록 id/type/title/mediaRef 보존. 기존 manifest의 과거 이미지도 유지. 기존 파일이 다르면 suffix를 붙이며 덮어쓰기/삭제하지 않음. 손상·미확인 manifest는 중단. 기존 파일도 증분 skip 전 크기/해시 재검증.
- 한 장 10MB, 현재 실행의 고유 이미지 합계 100MB, manifest 10MB 한도. jpeg/png/webp/gif/avif MIME·signature 확인. 지원 밖 형식·본문/ref 불일치·없는 IDB 사본은 누락으로 기록. 이미지가 없는 일반 책/영화 기록은 사진 대상에서 제외.
- manifest의 `images[].digest`는 파일 바이트 SHA-256, `records[].mediaRef`는 기존 data URL UTF-8 SHA-256 참조. 사진·manifest 모두 close 후 크기·해시 재읽기 성공만 반영. 폴더 권한은 기존 계정별 Vault IDB/동일 Web Lock 재사용.
- `사진 백업` 수동 버튼, 백업/신규/누락 건수, Google Drive 폴더 자동 업로드 안내와 PC fallback. Cloud 준비 여부와 별도로 로컬 사진 준비 상태를 판정하므로 인증된 기존 계정은 Cloud 장애 중에도 수동 사진 백업 가능.
- 주간 트리거는 전체 JSON과 사진을 함께 처리. 사진 상태는 JSON 상태와 별도 보존. Vault의 JSON 재결합도 `localOnly:true`로 실행하여 이 경로가 Cloud를 요청하지 않음. 사진 누락이 있으면 0으로 숨기지 않음. 기존 전체 JSON은 완전 재결합에 실패하면 기존처럼 성공 처리하지 않음.
- `getLocal`은 계정별 IDB를 다시 읽어 MIME·bytes·ref digest를 검증하되 renderer cache 변경/알림을 만들지 않음. 일반 get/put/Cloud hydration 및 C 실행 로직 유지.
- `docs/media-separation-c-runbook.md`: 11/09 이후 실제 Cloud 복구, 모든 기기 ≥221, 완전 백업·Drive 누락0·Cloud 행 본문 검증, PC 단일 기기 클릭·양 기기 전체 이미지·크기·export 검증 및 다시 내장 복구. 옛 버전 문구·Drive/기기 자동 확인 없음·확인 후 state 교체 가능·복구 Cloud 조건 등 빈틈 기록. C·복구 미실행.

### 실행한 검증

명령의 Node/Playwright는 `C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies` 아래 `node/bin/node.exe`, `node/node_modules/playwright/index.mjs`. 브라우저는 `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`. 가상 데이터/폴더이며 실사용 계정·폴더에 접근하지 않음.

| 명령 | 결과 |
|---|---|
| `node scripts/hani-photo-backup-222.test.mjs <Playwright> <Edge>` | PASS. Node: inline/ref·중복2기록·증분 skip·누락/ref불일치·MIME/size·기존 파일/손상 manifest 보존·read-back hash·guard. Edge1440: 실제 adapter/Vault 버튼·실제 media IDB·수동/주간 사진·주간 JSON 로컬 재결합. Edge390: fallback. 생활 키 byte 동일/write0, Cloud 요청0, hydration 알림0, 가로 넘침0, pageerror0. |
| `node scripts/hani-drive-vault.test.mjs` | PASS |
| `node scripts/hani-drive-vault-precheck.test.mjs` | PASS |
| `node scripts/hani-media-core.test.mjs hani-main.js <6b18534a의 hani-main.js>` | A·B·C 회귀 PASS. Git subprocess EPERM을 피하려고 기존 테스트가 지정한 같은 baseline blob을 CLI로 추출해 명시 인자로 전달. baseline assertion 유지. |
| `node scripts/hani-media-c-controls.test.mjs` | PASS |
| `node scripts/hani-backup-history-runtime.test.mjs <Playwright> <Edge>` | 전체 runtime 백업 11건 PASS |
| `node scripts/hani-cloud-stability-runtime.test.mjs <Playwright> <Edge>` | 전체 runtime Cloud 모의34건 PASS |
| `node scripts/hani-cloud-egress-save-sim.test.mjs` | PASS. 의도한 revision 경합 거절 로그 포함 |
| `node artifacts/photo-backup-222/verify-safety.mjs` | syntax, 기존 보호 save/Cloud/C/export 함수 원문, storage write 표현, v221 유지 PASS. source hashes `safety.json`. |
| `git -c core.whitespace=cr-at-eol diff --check` | PASS |

- 증거: `artifacts/photo-backup-222/`의 로그, 1440/390 컴포넌트 PNG, 전체 백업 PNG, safety.json. 사진 UI 브라우저 테스트는 실제 HTML Vault 카드·CSS·adapter·Vault JS와 실제 media IDB를 사용. 디렉터리 handle 및 그 handle의 Vault IDB 보관만 fake(함수 handle은 native structured clone 불가). 외부 font import는 테스트에서 제외. 전체 앱 백업/Cloud 회귀는 별도 full-runtime 실행.
- 초기 신규 UI 테스트는 screenshot URL의 한글 percent encoding 및 외부 font import 로딩 실패를 수정한 뒤 전체 재실행 PASS. 초기 미디어 기본 명령은 Git subprocess EPERM, 백업 기본 명령은 필요한 브라우저 인자 누락으로 실패했고 위 최종 명령으로 통과.
- 최신 getLocal 무캐시 정리 후 신규 사진/미디어 회귀 및 safety 재실행 PASS. full-runtime 백업11/Cloud34는 직전 동일 로직에서 실행했으며 getLocal은 기존 회귀가 호출하지 않는 새 백업 전용 경로. 운영 C 실행 증거로 재사용하지 않음.
- 보호 키 `hani_os_life_v23`, 내부 버전, 기존 save/commit/writeProtectedState/cloudPushLocalRow, C runner/confirm/plan, 일반 export 경로 유지. Cloud/schema/서버 Edge Function 변경 없음.
- 미검증: 실제 Drive 데스크톱 권한 handle의 재실행 보존·원격 Drive 업로드, 실제 소유 계정/Android, 독립 아린·HINA, 최종 후보/package/열차 gate, 실제 C와 복구, main/Pages/운영 read-back. 사진 로컬 검증 성공은 Drive 원격 저장 완료를 뜻하지 않음.
- Notion 착수 요약 append 시도: 자동 승인 검토가 approval policy never로 거절. 저장/read-back 미완료, 갱신 대기.
- 기존 기록을 건드리지 않고 개발 게시판에 별도 카드 [HANI-70](https://app.notion.com/p/3ffc5275707481a0bf78e5237a33dc6f) 생성·fetch read-back 완료. 상태 검토 중, 구현/검증/미검증/다음 행동 보존. Git 최종 결과는 아래 추가.
- Git 최종: 명시한 runtime/test/doc/evidence 경로만 `git add` 시도 → worktree `index.lock` Permission denied, exit128. 이어 tracked runtime4파일만 `git commit --only -m 'feat: add verified Drive Vault photo backups and stage C runbook' -- ...` 시도 → 같은 권한 거절, exit128. 권한 우회 없이 사용자 요청대로 전부 미커밋 보존. 시작 HEAD `3919a257` 그대로, push/PR 없음.
- Notion 최종 갱신 대기: HANI-70 생성과 read-back은 완료했으나, Git 차단 결과를 요약/추천 property에 반영하는 `update_properties`도 자동 승인 검토의 `approval policy never` 거절. 카드에는 커밋 시도 예정이라는 직전 상태가 남아 있으며, 실제 결과는 이 문서가 원문. 다음 담당은 커밋 차단·미push 사실을 반영해야 함.

## 다음 담당에게

- C 실제 실행은 2026-11-09 이후 Cloud 복구와 runbook 전제조건을 모두 확인한 뒤 PC 한 기기에서만 진행.
- 배포 담당 Claude가 변경 파일을 열차에 통합하며 버전·최종 gate를 담당.
- PR 없음. 버전/cache 증가·merge/rebase·다른 worktree 변경 없음. 실행 요청 전에 코드/문서·증거를 확인하고 실제 Drive 백업은 대표님 PC에서 연결한 폴더로 검증. 동반 서버/설정 배포 항목 없음.
- CURRENT/DECISIONS의 타 작업 기록은 변경하지 않음. 공통 현황은 Notion HANI-70 및 이 인수인계가 원문.
