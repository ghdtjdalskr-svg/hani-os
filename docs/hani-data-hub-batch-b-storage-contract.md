# HANI DATA HUB · Batch B Storage Contract

구현 전 계약 · 2026-10-03 · source authoritative / derived cache disposable.

## Namespace / schema

repository의 기존 runtime 경로에서 IndexedDB 또는 hani_data_hub_v1 이름을 찾지 못했다. 실제 Production 브라우저 DB는 이번에 열지 않는다. adapter는 각 origin에서 indexedDB.databases()로 이름/version을 확인한 후만 open한다. 열거 불가·타 namespace/version/schema 충돌이면 persistent cache를 사용하지 않고 경고한다. 기존 불명 DB를 upgrade/delete하지 않는다.

DB=hani_data_hub_v1, version=1. 모든 key는 scalar row identity이며 fixed-six columns 없음.

| Store | keyPath | Index |
|---|---|---|
| generations | [dataset_scope,generation_id] | by_scope(dataset_scope) |
| metrics | [dataset_scope,generation_id,metric_id,month,definition_version] | by_generation([dataset_scope,generation_id]) |
| pointers | dataset_scope | 없음 |

Generation은 generation_id/dataset_scope/created_at/engine_version/definition_versions/source_fingerprint/content_hash/status/sequence/manifest/fingerprints/goal_references를 보관한다. raw source/목표 registry는 저장하지 않는다. pointer와 동일 generation의 rows/meta를 한 readonly transaction으로 읽는다.

## Owner binding

기존 owner anchor는 cloudUser.id와 hani_state 조회의 eq(user_id,cloudUser.id)다. Cloud metadata 및 login gate marker만으로 Local source owner를 증명할 수 없다.

caller는 현재 검증된 binding {projectRef,userId,sourceOwnerId,sourceOwnerVerified,datasetId,sessionEpoch}를 제공한다. sourceOwnerId=userId, verified=true, sessionEpoch 필수. sourceOwnerVerified는 현재 세션에서 해당 owner의 원본과 Local baseline을 실제 검증했다는 caller의 증거이며 cached meta만으로 true를 만들 수 없다. unsigned/offline owner 미확인은 fail closed. 표시 이름/이메일은 사용하지 않는다.

dataset_scope=SHA-256(domain separator+projectRef+userId+datasetId), sessionEpoch는 persistent scope에 포함하지 않고 작업 취소/현재 세션 확인에만 사용한다. 해시는 pseudonymous이며 익명성/인증을 보증하지 않는다. 원 ID는 저장/로그하지 않는다. getBinding으로 매 접근 시 현재 binding을 재확인하고 invalidate()는 진행 중 transaction/메모리 view를 취소한다. Batch C에서 logout/owner/cloud-owner 이벤트 연결이 필요하다. 원본 삭제/Cloud 변경 없음.

## Fingerprint / definition / periods

Web Crypto SHA-256을 사용한다. 미지원이면 persistent 저장을 비활성화한다. 별도 강한 보안 증명으로 홍보하지 않는다.

선택 필드: body(date,weight,id,수정시각), exercise(date,steps,id,수정시각), books(status,read/completedDate,id,수정시각), quiz(status,completedAt,total,correctCount,id,수정시각), ledger(month,periodStart/End,items의 date/category/amount/reimbursement/id), broker(mode/status/recordType/period/snapshotDate/revision/id, enabled account의 estimatedAssets 또는 totalEvaluation 또는 canonical evaluation fallback 필드). 메모/제목/사진/profile/보호 state 전체를 hash하거나 저장하지 않는다. custom adapter에는 명시적 projection이 필요하다.

월/결산기간별 원본 projection을 memory에서만 만든다. 알 수 없는 날짜는 보수적으로 해당 source 품질에 포함한다. canonical owner 버전과 지표별 strong fingerprint를 기록한다. engine/definition/period/goal refs mismatch는 해당 row STALE; 추가 지표/월은 manifest 불일치로 새 coherent generation 필요. FNV64는 Batch A metadata로만 남고 저장 재사용 여부는 SHA-256으로 판정한다.

## Atomic publish / failure

source read → memory calculate → 전체 target manifest/rows 검증 → SHA 준비 → transaction 생성 → new rows+READY generation → 이전 generation SUPERSEDED → pointer 변경 → commit. transaction 도중 await/hash/network 없음.

publish에는 expectedGeneration을 요구한다. 다른 탭이 pointer를 먼저 변경하면 CONFLICT로 중단, 오래된 계산이 최신 캐시를 덮지 않는다. 동일 content_hash이면 write 없음. 렌더/read는 write 없음. 세대는 owner별 최신 2개만 transaction 안에서 유지한다.

실패 시 pointer/이전 정상 generation 유지. cache 없음은 CACHE_MISS이며 NO_DATA가 아니다. storage 오류는 STORAGE_WARNING이며 metric status와 분리한다. failed computation의 이전 값 STALE는 Batch A 계약 유지. 원본 삭제에 따른 정상 NO_DATA는 저장 가능하다.

reset API는 검증된 활성 scope의 세 store 파생 cache만 지운다. DB 전체 삭제/자동 schema upgrade/reset UI 없음. corruption은 INVALID_CACHE로 반환하고 원본에서 rebuild, 불명 namespace는 reset하지 않는다. rebuild는 같은 source→core calculate→prepare→atomic publish이며 source로 write-back하지 않는다.

## Scope

isolated Chromium origin에서 synthetic fixtures로만 DB를 생성/테스트한다. Production/실사용자 history backfill 없음. metrics-core purity 유지, runtime/route/Dashboard/Cloud/Goal history/Portfolio/Drive 변경 없음.
