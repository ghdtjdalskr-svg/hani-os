# 표지·포스터 분리 보관 설계 (Design only)

- 작성: 서윤(Claude Code) · 코드 조사: 도연(Codex, read-only) · 2026-10-10 KST
- 승인 범위: **설계만** (대표님 "설계 승인"). 데이터·저장 구조·Cloud schema 변경은 아래 단계별로 따로 승인받는다.
- 기준: main 24ab742 (v2.9.194)

## 1. 왜 하는가 (운영 측정, 읽기 전용)

| 항목 | 값 |
|---|---|
| 전체 기록(state JSON) | 약 2.16 MB |
| 그중 이미지 | **약 1.91 MB (88%)**, 36장 |
| 책 표지 `books[].cover` | 16장 · 0.92 MB · 최대 91 KB |
| 영화 포스터 `movies[].poster` | 20장 · 0.99 MB · 최대 92 KB |
| 분리 후 예상 기록 크기 | **약 0.25 MB** |

효과: 브라우저 저장 5MB 한도 여유 확보, Cloud 전체 읽기 1회당 전송량 약 1/9, 저장·해시·비교 속도 향상.

## 2. 핵심 원칙

1. **이미지 내용은 SHA-256 digest로 식별**한다(`media:sha256:<hex>`). 같은 이미지는 inline이든 참조든 같은 것으로 본다.
2. **동기화 비교·해시는 이미지 "내용"을 비교**한다. inline → 참조로 바꾸는 것만으로는 "변경"이 아니게 만든다(가짜 충돌 방지).
3. **정상 inline을 절대 먼저 지우지 않는다.** 참조 이미지가 확인되기 전까지 inline이 원본.
4. **백업은 항상 완전본**: 내보낼 때 참조를 inline으로 다시 채워 넣는다. 이미지가 하나라도 없으면 "완전 백업 성공"으로 표시하지 않는다.
5. 기존 보호 키 `hani_os_life_v23`, 내부 버전, revision 잠금, Data Hub 소유 검증은 유지한다.

## 3. 데이터 형태

```text
books[i] = { ..., cover: "data:image/jpeg;base64,..."  // 지금
           , coverRef: "media:sha256:ab12..." }       // 2단계부터 추가
movies[i] = { ..., poster: "...", posterRef: "media:sha256:..." }
```
- 3단계(inline 제거) 후: `cover: ""` + `coverRef`. 렌더러는 `coverRef`를 우선 해석.
- 로컬 이미지 저장소: IndexedDB `hani_media_v1` (계정별 namespace, digest·MIME·크기·read-back 검증).
- 기기 간 전달(추천): Supabase 새 표 `hani_media(user_id, media_id, mime, bytes, data, created_at)` + `hani_state`와 같은 RLS(본인만). 기기에 없는 이미지 id만 한 번 받아 IndexedDB에 캐시.
  - 대안: Supabase Storage 비공개 bucket. 서명 URL 관리가 추가되어 1차는 표 방식을 추천.

## 4. 단계별 진행과 승인

| 단계 | 내용 | 데이터 변화 | 필요한 승인 |
|---|---|---|---|
| **A. 호환 읽기 배포** | inline·참조 둘 다 읽는 코드: 렌더 resolver, IndexedDB 미디어 저장소, 백업 시 재결합(async), import 두 형식 수용, `cloudMergeProtectedMedia`·비교/해시/소유검증/월 지표 fingerprint를 **이미지 digest 기준**으로 변경, 설정에 "분리 미리보기(dry-run)" | 없음 (기존 inline 그대로) | 동기화 해시 계약 변경 = 보호 영역 코드 → **A단계 실행 승인** |
| **B. 참조 추가(이중 보관)** | 이미지별 digest 계산 → IndexedDB 저장·검증 → `hani_media` 업로드 → `coverRef/posterRef` 추가. inline은 유지 | 참조 필드 추가, Cloud 표 신설 | **Cloud schema(표+RLS) + 데이터 쓰기 승인** |
| **C. inline 제거** | PC·휴대폰 모두 A 이상 버전에서 B 확인 후 inline 비우기. "다시 내장" 도구로 되돌리기 가능 | 기록 2.16→0.25 MB | **migration 실행 승인** |

## 5. 안전장치

- 각 단계 전 **완전 백업 파일** 생성·검증(이미지 재결합 포함).
- B·C는 한 기기에서만 실행, 끝나면 다른 기기는 받기만.
- 혼합 버전: 구버전 탭은 참조를 이모지 placeholder로 보여 주고, 구버전 media guard가 inline을 재삽입할 수 있음 → C단계는 **모든 기기가 A 이상 버전으로 새로고침된 것을 `hani_state.device`/앱 버전 기록으로 확인한 뒤**에만 진행. A단계에 `meta.minMediaWriterVersion` 확인을 넣어 이후 버전이 지키게 함.
- inline과 참조 digest가 다르면 둘 다 보존하고 충돌로 표시(자동 삭제 금지).
- 이미지 누락을 이유로 정상 inline을 지우지 않음.
- IndexedDB 실패·quota·권한 문제 시 기존 inline 경로 유지.
- 기록 삭제 시 안전 백업이 참조하는 이미지 본문은 즉시 지우지 않음(보관 정리 규칙 별도).

## 6. 검증 계획

- 단위: digest 계산, resolver, 재결합 export, import(inline / inline+ref / ref+manifest / ref만→중단), media guard, 해시 계약(inline↔ref 동일 판정, 실제 이미지 변경은 변경 판정).
- 동기화 시뮬레이션: PC 신버전 + 폰 구버전, B 중단·재시도, digest 불일치, Cloud 표 누락.
- 화면: 서재·시청 아카이브 PC/모바일, 이미지 lazy 로딩·재렌더 경합.
- 회귀: `hani-backup-history-runtime`, `hani-cloud-stability-runtime`, egress save sim, quality data, monthly report, Data Hub 소유 검증, 월 core/생성기 parity.
- 운영 read-back: 단계마다 36장 전부 표시 확인, 기록 크기·Cloud 전송량 카드로 효과 확인.

## 7. 코드 접점 (요약, 상세는 도연 조사 부록)

렌더 `bookCard`/`movieWorkCard`/`movieCard`/`renderReading`/`renderMovies` · 업로드 `compressImage`/`saveBook`/`saveMovie` · Cloud `cloudCanonical`/`cloudComparableState`/`cloudSyncFingerprintState`/`cloudStateHash`/`cloudMergeProtectedMedia`/`cloudMediaSignature`/apply·push·first copy·restore·compare · 백업 `exportData`/안전 이력/긴급 보호본(호출부 async 전환) · import `validateBackup`/`validateStoredRecords` · Data Hub 소유 검증·월 core fingerprint(생성기 재생성) · 테스트 `hani-backup-history-runtime` 등.
