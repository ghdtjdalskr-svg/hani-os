# Cloud Sync 저장 시 Egress 절감 (탑승 대기)

- 날짜: 2026-10-07 KST
- 담당: 유림(Claude Code). 서린(Gemini CLI)이 독립 검토. 도연(Codex)은 쓰기 권한이 안전장치에 막혀 이번 작업에 참여하지 않음
- branch: `hani/hub-cloud-egress-save`
- base: origin/main 76d3bed (PR217)
- 위험 등급: CRITICAL (Cloud Sync)
- 대표님 승인: 2026-10-06 "2 진행". 범위는 저장 시 전체 state 재다운로드 제거와 저장 응답 echo 제거

## 배경

Supabase Free 조직이 Egress 13.444 / 5 GB(269%)를 써서 모든 서비스가 제한됐다(402). 무료 한도는 2026-10-09 결제 주기에 초기화된다. 대표님은 유료 전환 대신 기다리기를 선택했다.

`hani_state.state`는 약 2.1MB다. 9/27 PR120 이후 poll/focus/visible은 metadata만 받는다. 남은 낭비는 저장 1회마다 전체 state를 두 번 내려받는 것이었다.

- `cloudReadRow`로 한 번 읽는다.
- `update().select("state,...")`의 echo로 또 한 번 받는다.

합계는 저장 1회당 약 4MB다.

## 변경 (hani-main.js)

- `cloudVerifiedRemote`: 마지막으로 검증된 Cloud row를 **메모리에만** 보관한다. 저장소에는 쓰지 않는다.
  - establish, pull, push가 성공한 뒤에만 설정한다.
  - `cloudStopAutoSync`(중지·충돌·오류 경로 전부)에서 비운다.
  - userId를 함께 저장한다.
- `cloudCanUseVerifiedRemote`: `local-save`와 `queued`일 때만 metadata를 확인한다. 다음 조건을 모두 만족할 때만 메모리 row를 사용하고, 아니면 기존처럼 전체를 읽는다.
  - revision이 appliedRevision과 같다.
  - 검증된 baseline이 있다.
  - 메모리 row의 revision과 hash가 baseline과 일치한다.
  - 같은 계정이다.
- `cloudPushLocalRow`:
  - update 응답에서 `state`를 제외했다.
  - 다음 장치는 유지했다: `.eq("revision",expected)` 낙관적 잠금, revision +1 검증.
  - 반환 state 해시 비교는 제거했다. state가 반환되지 않기 때문이다.
  - 반환값은 `{...written,state:outgoing}`이다. 긴급 복구와 import 호출부의 호환성을 위해서다.
  - 충돌 메시지용 최신 revision은 metadata 조회로 바꿨다.
- `cloudSyncSelfTest`에 새 helper 사례 7개를 추가했다.
- 변경하지 않은 것:
  - `hani_os_life_v23`, `VERSION`, localStorage 쓰기 경로
  - 안전 스냅샷, `cloudMergeProtectedMedia`, `cloudSyncDecision`
  - insert 경로, Supabase schema

## 검증

- `node --check hani-main.js`: 통과
- `node scripts/hani-cloud-egress-sync.test.mjs`: PASS
  - helper 11개 사례와 push select, 잠금 유지, 메모리 미저장을 정적으로 확인한다.
  - 오래된 2.9.141 버전 고정 assertion은 버전 존재 확인으로 바꿨다.
- 앱 내부 `cloudSyncSelfTest()`: true
- `node scripts/hani-cloud-egress-save-sim.test.mjs`: PASS
  - 실제 sync 함수를 가짜 Supabase 테이블 위에서 실행한다.
  - state 200KB 기준으로 저장 3회의 응답량은 다음과 같다.

    | 코드 | 응답량 | 전체 읽기 |
    |---|---|---|
    | 기존 main | 1,201,334 B | 3회 |
    | 수정본 | 412 B | 0회 |

  - 시나리오별 결과:
    - 다른 기기 변경 후 로컬 저장: 자동 동기화 중지, 다른 기기 데이터 보존, 로컬 편집 보존
    - metadata 확인과 update 사이 경합: revision 잠금으로 중지, 경합 데이터 보존
    - 계정 전환: 전체 읽기로 fallback
  - 기존 main으로 같은 안전 시나리오를 돌려도 PASS다. 안전 동작은 동등하다.
- 서린(Gemini) 독립 검토: PASS. 데이터 유실이나 race 위험은 발견되지 않았다.

## 미검증·위험

- 실제 Supabase와 실제 기기에서 read-back을 하지 못했다. 서비스가 제한된 상태라서다. 10/9 복구 후 열차 Preview에서 저장 → 다른 기기 반영 → 충돌 중지를 확인해야 한다.
- 저장 직후 Cloud 내용을 해시로 재확인하던 단계가 빠졌다. revision 잠금과 +1 검증이 쓰기 성공을 보장하고, 다음 pull/poll에서 hash 불일치가 감지되면 중지된다.
- 메모리 row는 탭을 새로고침하면 사라진다. 첫 저장 1회는 기존처럼 전체를 읽는다.

## 열차 탑승 정보

- runtime: `hani-main.js`
- test: `scripts/hani-cloud-egress-sync.test.mjs`, `scripts/hani-cloud-egress-save-sim.test.mjs`
- 함께 배포할 서버 함수나 설정: 없음
- 버전과 `?v=` 태그는 올리지 않았다. 열차에서 올린다.
- 열차는 Supabase가 복구된 뒤(10/9 이후)에 출발할 수 있다. 히나 검사에 로그인이 필요하다.
