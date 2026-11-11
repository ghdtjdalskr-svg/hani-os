# 서버 함수 3개 소유자 검사 — 시험 연결 (owner-288)

## 작업 식별

- 날짜(KST): 2026-11-11. 담당: Codex 단독. 커밋·push 담당: 서윤.
- 상태: 시험 연결 완료 / Git 필요 회귀 4개 재검증·서윤 검토 대기. 운영 배포 완료 아님.
- 저장소 / branch / worktree: PROJECT HANI / `hani/server-owner-guard` / `owner288` (과제 전달값).
- 기준 origin/main: `89db739` (과제 전달값). Git 명령 금지로 원격 최신성·현재 HEAD·staged 상태를 새로 조회하지 않았다. candidate/package SHA 없음.
- 승인 근거: `../owner-288-task.md`의 진행 승인 및 시험 연결 지시. UTF-8 전체 읽기에서 한글 정상 확인.
- 수정 범위: 아래 시험 코드 4개와 이 보고서 1개. staged 서버 함수 3개, 클라이언트 런타임, DB schema/migration, 표시 버전/cache 보존. Git·커밋·push·merge·배포·원격 설정 변경 없음.
- 계획: CODEMAP → 실제 owner 확인 → exact inverse 연결 → 실제 함수/handler 실행·지정 회귀 → 부산물 제거·인수인계. `CODEMAP_MISS`: codemap에 해당 서버 owner guard anchor가 없어 명시된 함수 경로와 symbol로 조사했다.

## 결과와 증거

### 변경 파일

| 파일 | 변경 |
|---|---|
| `scripts/hani-server-owner-guard-source.cjs` | Calendar의 소유자 helper와 인증 직후 검사 추가분만 정확한 문맥·문자열로 되돌리는 시험 전용 함수. 각 블록은 정확히 1회 있어야 하며 누락·중복·변조 시 실패. 전역 reader 변경 없음. |
| `scripts/fixtures/server-owner-guard/calendar-owner-additions.json` | 허용한 2개 추가 블록의 before/after 고정 fixture. |
| `scripts/hani-google-drive-212.test.mjs` | helper import와 core 해시 입력의 inverse 호출만 추가. 기존 assertion·고정 해시·callback 정규화 유지. 실제 callback 시험은 raw Calendar 소스를 계속 실행. |
| `scripts/hani-server-owner-guard.test.mjs` | 실제 TypeScript의 ownerAccess 추출·실행 및 raw 전체 handler를 합성 인증/DB/fetch로 실행하는 13개 시험. |
| `artifacts/server-owner-guard/REPORT.md` | 이 작업의 유일한 보고서·인수인계. |

Calendar 기존 core SHA-256 `2a6fb8aec3afa3a876781e8af4a06e1065db6897d8e935622039099003aaaf84` 유지. exact inverse 후 원래 해시에 도달했다. helper·차단문·설정 키 변조/누락/중복은 inverse가 거부하고, 허용한 추가분 밖 AES·DB 필터 변조는 기존 해시에 도달하지 못하는 부정 시험도 통과했다.

### 새 시험의 실행 범위

- 세 함수 각각 인증 직후 단일 ownerAccess 호출과 차단 반환 위치를 확인했다. 실제 helper에서 미설정/빈 문자열/공백만 503, 다른 ID/없는 ID/metadata 위장 403, 같은 ID 200, 설정값 trim을 확인했다. 사용자 ID 자체의 공백은 허용하지 않는다.
- raw handler 각각에서 설정 누락 503·다른 계정 403·잘못된 인증 401일 때 DB/fetch 0회. 같은 소유자는 기존 health/status 성공 경로까지 진입했다. 인증·본문 파싱·DB 접근 횟수도 확인했다.
- **기존 구조 예외:** Newsroom은 `scheduled_publish` 라우팅을 위해 본문을 인증 전에 1회 읽고 admin client를 생성한다. 따라서 세 함수 모두 “본문 파싱 전 검사”라고 보고하지 않는다. 일반 Newsroom 요청은 인증 직후·DB 접근/아카이브 업무 처리 전에 소유자 검사로 차단된다. Calendar GET OAuth callback도 기존 state 검증 경로를 유지한다. 이 두 기존 경로를 변경하지 않았다.
- Newsroom cron: 예약 분기는 인증/ownerAccess 앞에 유지된다. secret 누락·빈 값·불일치는 401이며 인증/DB/fetch 0회. 맞는 secret은 소유자 설정 없이 예약 경로에 진입하며 빈 합성 대상에서 `hani_state` 읽기 1회·외부 요청 0회를 확인했다.
- Newsroom tone: 실제 생성 schema의 15개 enum과 allowlist 일치, 소문자/공백 정규화, enum 외 입력은 빈 문자열. 실제 `archiveInterest`를 실행해 잘못된 tone은 빈 문자열, 유효한 tone은 `QUESTION`으로 mock upsert에 전달됨을 확인했다. 운영 DB write 없음.
- root 클라이언트 JS/HTML의 서버 secret 식별자·secret 형태·service-role JWT 부재 확인. 기존 브라우저 키 거부 함수와 HTML 경고는 정확한 구간만 구분했고 실제 거부 함수를 실행해 service-role/secret 입력 차단도 확인했다. 실제 비밀값을 기록하지 않았다.

### 지정 회귀 결과

환경: Windows PowerShell / Node `v24.20.0`. 아래 파일은 `scripts/hani-<이름>.test.mjs`이다.

| 이름 | 결과 | 통과 / 실패 | 비고 |
|---|---|---|---|
| server-owner-guard | PASS | 13 / 0 | 새 시험 |
| boardroom-voice-contract | BLOCKED | 미실행 | 기존 Git show/apply 의존, 첫 호출 전에 차단 |
| fixes-213-oauth | PASS | 7 / 0 | 기존 callback 유지 |
| google-drive-212 | PASS | 11 / 0 | 기존 Calendar core 해시 포함 |
| hana-intake-224 | PASS | 15 / 0 | 기존 입력 회귀 |
| meeting-character-voice | BLOCKED | 미실행 | 기존 Git show/apply 의존, 첫 호출 전에 차단 |
| meeting-engine-v2-batch1 | BLOCKED | 미실행 | 기존 Git show/apply 의존, 첫 호출 전에 차단 |
| newsroom-persona | PASS | 4 / 0 | 양쪽 실제 서버 생성 경로 |
| offline-transport-223 | BLOCKED | 미실행 | 기존 Git show 의존, 첫 호출 전에 차단 |
| toss-intake-224 | PASS | 10 / 0 | 기존 입력 회귀 |
| ocr-accuracy-224 | 기존 실패 유지 | 13 / 1 | 아래 설명 |
| learning-quiz-quality | PASS | 13 / 0 | 기존 출제 회귀 |

합계: 12개 파일 모두 호출, 7개 파일 PASS·4개 Git 의존 차단·1개 기존 실패. 실행된 세부 시험은 **86 통과 / 1 실패 / skip 0**. 차단된 4개는 PASS로 간주하지 않는다.

실행 명령은 각 파일에 대해 `node --require <임시경로>/no-child-process.cjs scripts/hani-<이름>.test.mjs`였다. 임시 preload는 `node:child_process`의 exec/execSync/execFile/execFileSync/spawn/spawnSync/fork 호출에서 `HANI_GIT_FORBIDDEN` 오류를 던지고 `syncBuiltinESMExports()`로 ESM에도 적용했다. 실제 자식 프로세스/Git 명령은 실행되지 않았다. 기존 시험의 assertion이나 Git 의존 코드는 수정하지 않았다. 새 시험과 google-drive-212는 일반 `node scripts/hani-<이름>.test.mjs`로도 통과했다.

OCR 실패: `protected write/delete/rollback paths, primary runtime and non-Vision Edge region retain baseline bytes`의 `mergeWithExistingHoldings exact immutable origin after reversing registered 233 integrations including approved f2df938/7471e5a numeric fixes` assertion. 과제에서 main 기존 실패로 명시한 항목이며 그대로 두었다. 이번 환경에서 main을 별도 조회·실행한 것은 아니다. 이 assertion에서 먼저 실패하므로 뒤의 non-Vision Edge 해시 검증은 미도달이다.

문법 검사 3/3 PASS: `node --check scripts/hani-server-owner-guard-source.cjs`, `node --check scripts/hani-server-owner-guard.test.mjs`, `node --check scripts/hani-google-drive-212.test.mjs`. 세 서버 TypeScript는 strip 후 실제 VM handler 로드/실행 성공. Deno 배포 환경 typecheck·실제 UI/원격 인증·Google OAuth·운영 cron·LLM·운영 DB는 미검증이다.

### 보존·정리

작업 시작 시 저장한 저장소 파일 1,962개의 SHA-256을 종료 상태와 대조했다. 기존 파일 중 변경은 `scripts/hani-google-drive-212.test.mjs` 하나뿐이다. 다른 기존 파일은 바이트 동일하고 신규 파일은 위 목록의 4개뿐이다. 기존 staged 함수 3개도 시작 시점 바이트 그대로이다.

| staged 함수 | 보존 SHA-256 |
|---|---|
| hani-agent-orchestrator/index.ts | `58686bcfe8cfb5067c99d2569f8af5bfdeea6847c468c0216247aa3440ef4f7b` |
| hani-google-calendar/index.ts | `bb6b208bf4ec6097f7222dca8dea554bcedff9b8eb261aa2bad21e00c9be6c08` |
| hani-newsroom-publisher/index.ts | `39857c42922071d9567cf3851f88360dfc43b0b9554710d42f3fa0f15345410e` |

이번 생성분인 `artifacts/ocr-accuracy-224/metrics.json` 제거, 기존 artifacts 보존. 전체 로그·파일 대조 자료·Git 차단 preload는 저장소 밖 임시 폴더에만 있다. 최종 저장소 보고서는 이 파일 하나다.

데이터·저장소·Cloud·schema 영향: 런타임·storage write·DB write 구조·schema·migration 변경 없음. 실제 외부 서비스 요청·운영 데이터 작업 없음. 로컬 index의 `hani-main.js?v=2.9.287` 및 마지막 script `./hani-launch-greeting.js` 유지. 이는 소스 확인이며 실제 화면 표시/로딩 증거가 아니다. 개발도구 전용 변경으로 버전 증가·DOM/UI QA N/A. staged 서버 변경의 Release Gate·HINA는 이번에 수행하지 않았다.

## 다음 담당에게 — 배포 순서

1. **서윤:** 기존 staged 서버 3개와 시험 변경을 함께 검토·커밋·push한다. Git 허용 환경에서 차단된 4개 시험을 원래 명령으로 재실행한다. 원격 main drift·기준 SHA와 실제 배포 source identity를 확인한다.
2. **성민 대표님 / 배포 담당:** 운영 프로젝트가 맞는지 확인한다. Supabase Dashboard → 해당 프로젝트 → Edge Functions → Secrets 목록에서 **`HANI_OWNER_USER_ID`라는 이름의 항목이 이미 있는지만 확인**한다. 값은 채팅·보고서·로그·스크린샷에 남기지 않는다. 항목 존재만으로 올바른 소유자 ID라고 단정하지 않는다. 현재 실제 설정은 미검증이다. 없거나 정확성이 불명확하면 배포를 보류하고 대표님이 안전한 관리 화면에서 확인·설정한다. 이 작업에서는 설정을 변경하지 않았다.
3. 승인된 동일 소스로 **`hani-agent-orchestrator` → `hani-google-calendar` → `hani-newsroom-publisher`**를 기존 Edge Function 배포 절차로 각각 deploy한다. 새 schema 의존은 없으며 이 순서는 검증/추적 편의를 위한 인계 순서다. 기존 인증/gateway 설정을 유지한다. Orchestrator와 Publisher의 `comment-persona.mjs` 및 그 의존 파일이 번들에 포함되는 상대 import 구조를 보존한다. index.ts만 복사해 의존 파일을 누락하지 않는다.
4. 배포 성공·배포 소스 일치 후 read-back: Orchestrator 소유자 health, Calendar 소유자 status, Publisher 소유자 health 성공과 다른 정상 인증 계정 403을 확인한다. 설정 누락 503은 합성 시험으로 확인했으므로 운영 secret을 지워 재현하지 않는다. Calendar 기존 OAuth callback과 Publisher cron secret 보호/예약 동작도 확인한다. 비소유자·오류 응답에서 데이터 작업이 없는지 확인하며 계정 ID·token·secret 값은 기록하지 않는다.
5. 실제 결과를 단계별 기록한다. 이번 작업은 미커밋·미push·미배포이며 main/Pages/운영 read-back 완료를 선언하지 않는다. 웹 배포는 이번 시험 연결의 대상이 아니며 필요한 열차 gate는 배포 담당이 별도 수행한다.

설정 확인 안내는 [Supabase 공식 환경변수 문서](https://supabase.com/docs/guides/functions/secrets)를 참고했다. [2026-11-04 CLI v3 변경 안내](https://supabase.com/changelog/supabase-cli-v3)에 따라 CLI를 사용한다면 설치 버전의 `--help`로 원격 대상 선택·deploy/secrets 명령을 먼저 확인한다. 이 환경에는 supabase CLI가 확인되지 않았다. 위 절차는 실제 원격 검증 결과가 아니다.

## blocker / 기록 공유

- 기존 회귀 4개 Git 차단·OCR 기존 실패 1개·실제 Edge 배포/원격 설정/read-back 미검증을 인계한다. 새 구현의 자동 시험 실패는 0개다.
- Notion 현황판 읽기 성공. 착수 계획 `insert_content`는 자동 승인 검토에서 **`MCP tool call requires approval, but approval policy is never`**로 거절되었다. 우회하거나 승인 요청을 반복하지 않았다. 저장·읽기 확인이 없어 Notion 갱신 완료로 보고하지 않는다.
- Notion 갱신 대기: “2026-11-11 KST / Codex / owner-288 / branch hani/server-owner-guard, base 89db739 전달값 / 기존 staged 서버3개 보존, Calendar exact inverse·신규13개 / 전체12파일 호출: 7 PASS·4 Git 차단·OCR 기존1실패, 세부86통과·1실패 / 부산물 제거 / 서윤 커밋·push·차단 회귀 및 대표님 설정 확인·함수3개 배포 대기 / 원문 artifacts/server-owner-guard/REPORT.md”.
- CURRENT/DECISIONS는 이번 한 파일 보고서 범위를 지키기 위해 수정하지 않았다. 다른 담당 기록·과거 근거 보존. PR/Preview/배포 링크 없음. 다음 한 가지 행동: 서윤이 이 보고서와 시험 diff를 검토하고 Git 허용 환경에서 차단 회귀 4개를 실행한다.
