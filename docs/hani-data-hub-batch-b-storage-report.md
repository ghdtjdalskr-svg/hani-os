# HANI DATA HUB · Batch B Storage Report

2026-10-03 · Risk CRITICAL · **READY FOR BATCH C (개발 진행 기준, Production 승인이 아님)**

## Baseline

- origin/main SHA: fe07619e488cc00d7c009a4ce2e8bc8b07df7f1f.
- 표시 버전: 저장소 v2.9.157, 마지막 UI layer hani-ui-v02992.js?v=2.9.157. 이번 세션에서 Production 화면의 실제 표시/read-back은 재검증하지 않았다.
- branch: hani/data-hub-batch-b.
- 최신 main에서 새 worktree를 만들고 승인된 Batch A 59c1697만 cherry-pick했다(로컬 9940724). 다른 작업을 병합/rebase하지 않았다. 종료 시 fetch에서도 main SHA는 동일하다.
- Batch B 변경: metrics-store.mjs, storage-contract.md, storage-report.md, batch-b.test.mjs 4개. Batch A core/runtime/HTML 변경 없음.

## IndexedDB Contract

구현 전 작성한 별도 계약: hani-data-hub-batch-b-storage-contract.md.

- database: hani_data_hub_v1, version: 1.
- generations keyPath=[dataset_scope,generation_id], index by_scope(dataset_scope).
- metrics keyPath=[dataset_scope,generation_id,metric_id,month,definition_version], index by_generation([dataset_scope,generation_id]).
- pointers keyPath=dataset_scope, index 없음.
- repository 기존 runtime 검색에서 동일 namespace/IndexedDB 경로를 찾지 못했다. 실제 origin에서는 databases() 사전 열거+version/schema 검사 후만 사용한다. 열거 불가/기존 불명 schema/version 충돌 시 warning으로 중단하며 업그레이드/삭제하지 않는다.
- DB 생성은 ephemeral localhost 브라우저의 synthetic QA에서만 수행했다. Production origin/사용자 DB는 생성·조회하지 않았다.

## Dataset Scope

기존 소유자 anchor는 cloudUser.id와 hani_state 조회의 eq(user_id,cloudUser.id)다. Local state와 cloud metadata에 소유자 ID가 없으므로 로그인 marker나 표시명만으로 Local source 소유자를 추정할 수 없다.

입력 binding: projectRef/userId/sourceOwnerId/sourceOwnerVerified/datasetId/sessionEpoch. sourceOwnerId=userId 및 verified=true가 필수. dataset_scope는 projectRef/userId/datasetId의 domain-separated SHA-256이며 원 ID/이메일/표시명을 저장하지 않는다. 해시는 가명화이며 익명성 또는 보안 권한 증명을 보장하지 않는다.

getBinding을 매 접근/비동기 완료 시 재확인한다. invalidate는 진행 중 transaction과 active view를 취소한다. 다른 소유자의 prepared snapshot은 저장뿐 아니라 memory fallback도 차단한다. reset은 현재 scope만 대상으로 한다.

Batch C의 필수 gate: 원본이 현재 사용자에 속함을 기존 세션에서 확인하는 binding adapter를 만들고 logout/owner/Cloud-owner 변경에 invalidate를 연결한다. 검증 불가 상태에서는 persistent cache 사용 금지; unsigned/offline owner 미확인도 fail closed. 기존 원본/Cloud 계약을 바꿔 owner 필드를 추가하지 않는다.

## Generation Model

- generation_id: owner별 증가 sequence + content hash prefix.
- READY generation과 모든 rows, pointer를 하나의 transaction에 게시한다. 이전 세대는 SUPERSEDED.
- BUILDING은 memory에서만 존재하고 FAILED는 결과 warning으로 반환한다. 실패 세대를 정상 pointer로 노출하지 않는다.
- 현재+직전 세대만 유지한다. 다른 owner 세대는 보존한다.
- expectedGeneration 조건부 게시로 다른 탭의 최신 pointer를 이전 계산이 덮지 못한다.
- content hash가 같으면 UNCHANGED, write/새 generation 없음. read/render는 write하지 않는다.

## Key Contract

논리 identity는 dataset_scope+metric_id+month+definition_version이며 generation_id로 coherent snapshot을 구분한다. 고정 6개 열이나 domain별 column은 없다. synthetic 100개 지표를 동일 schema에서 게시·읽는 테스트를 통과했다. Portfolio의 period×account×instrument 데이터는 허용하지 않으며 별도 dimensional 계약이 필요하다.

## Source Fingerprint

- 알고리즘: native Web Crypto SHA-256. unsupported 시 persistent 사용 중단, 약한 hash로 자동 fallback하지 않는다.
- 입력: 선택된 canonical raw fields의 월/결산기간 projection, source coverage, definition/engine/period, canonical owner version.
- weight/steps: date, 해당 수치, stable id와 수정시각. books: 완독 상태/날짜. quiz: 완료시각/total/correct. ledger: 결산기간과 item date/category/amount/reimbursement. broker: 확정 snapshot 식별·시각과 enabled account의 canonical total에 필요한 값.
- title/note/photo/profile 등 비관련 원본은 제외한다. projection은 memory에서 hash하고 DB에는 원본을 저장하지 않는다. custom adapter에는 명시적 projector가 필수다.
- 객체 key와 의미상 무관한 row 순서에 안정적이며 추가/수정/삭제를 감지한다. 날짜가 불명확한 source는 영향 월을 특정할 수 없어 보수적으로 해당 source 품질에 포함한다.
- SHA는 캐시 일치·우발 손상 검사다. 같은 origin의 악성 코드/공격자를 막는 인증·위변조 증명은 아니다. Batch A FNV metadata는 그대로 두되 저장 재사용 판단은 SHA를 사용한다.

## Definition Invalidation

manifest에 지표/월/definition_version/unit/period 계약을 저장한다. engine/definition/월별 fingerprint/goal reference/품질 결과가 달라지면 readActive(expectedSnapshot)는 영향 rows를 STALE로 표시한다. 새 지표·기간 추가도 새 coherent generation이 필요하다. 기존 row를 새 정의로 라벨만 바꾸지 않는다.

## Atomicity

원본 읽기 → memory calculate → target row/manifest 전체 검증 → hash 준비 → 3-store readwrite transaction → 모든 row/meta → 이전 supersede → pointer → commit.

transaction 안에 async hash/network await 없음. pointer와 rows/meta는 같은 readonly transaction으로 읽고 manifest/row hash/source hash/content hash를 검증한다. after_rows/after_pointer 실패와 세션 변경 abort에서 이전 pointer/값 유지가 확인됐다. raw payload 주입·incomplete manifest·prepared owner mismatch는 거부한다.

## Failure Recovery

- quota: 주입한 QuotaExceededError를 warning으로 처리, 이전 세대 유지 및 동일 owner의 memory 결과만 fallback. 실제 디스크 quota 소진은 수행하지 않았다.
- transaction: rows/pointer 직후 abort/예외 rollback 확인. 이전 generation 유지.
- corruption/version: active row 변조를 INVALID_CACHE로 차단. scope cache reset→원본 rebuild로 정상 회복. DB version mismatch는 open/upgrade하지 않고 warning. 알 수 없는 namespace는 reset하지 않는다.
- cache miss: CACHE_MISS, 지표값 0으로 위장하지 않음. rebuild는 source→core→prepare→atomic publish.
- 계산 실패: Batch A previousRows의 마지막 정상값을 STALE로 보존. legitimate deletion의 NO_DATA/0과 구별.
- reset: 현재 scope 파생 rows/meta/pointer와 해당 scope orphan만 제거. 전체 DB delete/reset UI 없음. 원본·목표·Cloud·backup·Drive는 접근하지 않음.

## Goal Boundary

goal_id/goal_revision 참조만 허용한다. 전체 Goal Registry/raw 목표 객체는 row allowlist 밖이며 저장하지 않는다. durable Goal History 작성/등록/복구 없음. 목표 reference가 달라지면 generation 재사용 불가. 목표 저장 구조는 별도 후속 승인이다.

## Protected Data

- hani_os_life_v23: 기존 의미·키·쓰기 계약 변경 없음. synthetic source JSON/hash 및 sentinel 전후 동일.
- 내부 2.9.15-safe-baseline-bootstrap: 변경 없음.
- Cloud/Supabase schema/secrets: 기존 코드 계약 조사만 수행; 원격 조회/변경/배포 없음.
- Asset/Toss/Ledger/Health/Study/Backup/Import: 기존 business write 및 runtime 파일 변경 없음.
- 실제 운영 source hash는 읽지 않았다. 안전 증거는 기존 runtime 불변 diff와 synthetic source 불변 검사다.
- Supabase 안전 지침에 따라 로그인 세션과 원본 소유권을 구분하고 추정 ownership을 금지했다. Supabase 기능/API 구현은 하지 않았다.

## Tests

실제 Chrome 154.0.8037.95의 headless ephemeral context, 랜덤 localhost origin, synthetic source만 사용했다. 기존 로그인 프로필은 사용하지 않았다.

- Batch B browser/storage groups: **20/20 PASS**. 요청 A~Q를 그룹별로 포함.
- new/cache miss, complete publish/active read, atomic rollback/previous preservation: PASS.
- metric addition(100), definition change, source change/deletion, explicit 0/NO_DATA: PASS.
- owner/logout isolation, transaction 중 context change, old-owner fallback 차단: PASS.
- quota injection/open failure/version mismatch, reconstruction, corruption: PASS.
- STALE 값 보존/repeated render no write, source 및 goal sentinel 불변: PASS.
- incomplete generation/concurrent-writer expected-pointer guard, metadata/raw injection, SHA/namespace 미지원 차단: PASS.
- Batch A synthetic core tests: **27/27 PASS**.
- 기존 monthly-report aggregation regression: PASS.
- syntax: core/store/test 확인. 운영 화면/배포/실제 quota·사용자 backfill은 미검증 또는 N/A.

초기 corruption fixture는 active가 아닌 superseded row를 변조해 기대 검사가 실패했다. active generation을 정확히 지정하도록 수정 후 재실행해 정상 손상 탐지와 복구를 확인했다. localhost 접근 제한은 격리된 테스트 실행 권한으로 해결했으며 Production 접근은 하지 않았다.

## Runtime Integration

- loaded: 격리된 테스트 page에서만 core/store import.
- not loaded: Production/index.html/Dashboard/Monthly Report/Life Market/Data Hub route.
- runtime version 증가/배포 package/HINA/Production QA: N/A. 현재 제품에서 자동 cache 기능이 동작한다고 주장하지 않는다.
- Drive code/Portfolio snapshot storage/실사용자 전체 history backfill 없음.

## Known Limitations

1. 검증된 owner-source binding을 공급하는 운영 연결은 Batch C에서 구현해야 한다. 기존 meta만으로 true를 만들 수 없다. 불명확하면 캐시 연결을 중단한다.
2. indexedDB.databases/Web Crypto 지원 환경만 persistent cache 사용. 다른 환경은 warning/memory fallback.
3. 동시탭 context 변화는 caller의 getBinding/invalidate 연결을 필요로 한다. 브라우저 origin 자체는 보안 격리 경계이며 같은 origin의 악성 script에 대한 별도 암호화/권한 제어는 없다.
4. readActive는 활성 generation 전체를 읽는다. 무제한 사용자 history backfill/실데이터 장기 성능은 이번 테스트 범위가 아니며 Batch F 전에 측정해야 한다. 반복 UI paint에서 source scan/open/calculate를 실행하지 않는 consumer 설계가 필요하다.
5. 손상 generation은 warning 후 명시적 derived reset/rebuild; unknown schema 자동 삭제/업그레이드 없음. goal durability와 dimensional Portfolio는 별도 설계.

## Recommendation

**READY FOR BATCH C**. Batch B의 격리 저장/원본 기반 복구/owner 경계/atomic publish/failure independence 검증을 완료했다. 다음은 현재 owner-source binding을 검증하는 read-only consumer와 Dashboard migration 설계다. 원본 ownership 검증이 불가능하면 Batch C에서 STOP한다.

이번 보고가 main merge/Production 배포 또는 후속 Hotfix 보호 데이터 변경 승인은 아니다. 다른 대화에서 전달된 Post-Audit 작업은 후보에 포함하지 않았으며 직접 승인 범위와 충돌을 확인한 뒤 별도 진행해야 한다.
