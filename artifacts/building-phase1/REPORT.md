# 층 등록부 Phase 1

- 담당: 도연 / Codex, 단일 Agent. `hani/building-5f`, base `2db38f4834ba0f2b6c21c296b5c9a4e0732f2e0a`.
- 범위: 기존 층·일정·화면을 유지하는 NORMAL 리팩터. 신규 runtime 파일 0개. 소스상 표시/cache `2.9.306` 유지.
- 원격 조회 실패(네트워크 차단). 로컬 `origin/main`은 `cd916e2`(후속 tooling-306), 작업 기준의 공통 조상은 `077df04`. 자동 merge/rebase 없음. 배포 담당이 시험층 연결 충돌을 확인해야 함.

| 바꾼 곳 | 전 | 후 |
| --- | --- | --- |
| `hani-office-live.js` 등록부 | 층 배열·기본 아트·순서·수용 인원 분산 | 기존 owner의 `buildFloorRegistry`, `Map` 인덱스; 층 목록·이름·아트·전경·표지판·엘리베이터·maxVisible 조회 통합 |
| 메타데이터 검사 | `anchors.length===326` | 층별 기대 합계, 중복·좌표·아트 전단사, 이동 가능 앵커 도달, 엘리베이터/계단 왕복·인접층 연결 검사 |
| 층 판정 | 숫자 ID 정규식·옥상/전경 직접 분기 | `hasFloor`, `order`, `category`, `nightBackground`, `foregroundMasks` |
| `hani-office-live.css` | 데스크톱 5열, 모바일 마지막 버튼 항상 전체 폭 | 등록부 개수 CSS 변수, 홀수 마지막 버튼만 전체 폭. 현재 5탭 모양 보존, 6탭은 2열×3행 |
| 신규 시험층 3파일 | 움직임 1·2단계/306까지 새 시험층 없음 | `hani-building-phase1-{source,preload}.cjs` + `fixtures/building-phase1-layer.json`: Phase 1 → office-motion → 306 → 기존 305 이하 |
| 기존 시험 연결 | 기존 파일 원문 | `scripts/hani-release-305-source.cjs` 맨 앞 `require` 1줄만 추가. 기존 단언·fixture·hash 변경 없음 |
| 신규 시험 | 없음 | `scripts/hani-building-phase1.test.mjs`: 현재 원문·비동기 fetch·합성 6층·동일 시각 비교·저장/타이머·독립 Git 경계 검증 |

옥상 ID는 **안 A**로 준비했다. `id:'5f'`, `legacyIds:['5f']`를 유지하고 순서·표시는 별도 필드로 둔다. 기존 장소·드라마·야간 아트·남매/순찰 참조를 이관할 필요가 없어 안 B보다 회귀 면적이 작다. 현재 `order:5`와 `5F` 표기를 그대로 유지하며, `order:6`과 새 `creative`는 합성 시험에만 있다. 저장 데이터 변경은 없다.

화면 동일 증거: 3일의 전체 일정/외출 원장과 **351개 같은 시각 스냅샷**에서 직원 위치·좌석·대사, 주민, 동행인 JSON 바이트가 일치했다. 실제 DOM owner의 2일×5시간×5층 비교에서 탭·배우 좌표/포즈·배경/전경·표지판·방 설명이 일치했고, 메타데이터 실패 fallback도 일치했다. CSS는 지정한 세 치환 외 바이트가 같다. 실제 Edge 실행은 `EPERM`으로 차단되어 **390/1440px 픽셀 비교는 미검증**이다.

시험 진행: 신규 **10/10 PASS**. 326개 앵커를 각각 하나씩 제거한 326개 입력을 모두 거절하고, 아트 누락/여분·중복·단절·계단 누락/편도도 거절했다. 비동기 로딩에서 정상 5층 수용·손상 데이터 fallback을 확인했다. 등록부/비교 경로 저장 접근 0, 새 타이머/이벤트 등록 0. 기존 친밀도·도우미·보호 키·Cloud·schema 경로는 변경하지 않았다.

전체 `scripts/*.test.mjs` **292개를 각각 별도 Node 프로세스로 실행**했다. 최신 재실행 반영 결과는 **191 PASS / 29 FAIL / 72 미검증**이다. FAIL 29개는 독립 pre306 Git 입력으로도 첫 오류와 실패한 검사 이름이 모두 같았다(새 기능 회귀는 확인되지 않음). 미검증은 Git EPERM 및 기존 URL 경로 어댑터 오류, 브라우저 의존성/CLI 경로 부재 등이다. 신규 시험은 최종 재실행도 **10/10 PASS**, 이음 연동 **17/17 PASS**, 릴리스 305 **8/8 PASS**. [파일별 결과](TEST-RESULTS.md) · [수치·소스 해시](VALIDATION.json).

성능은 전체 PASS가 아니다. 기존 lively-v2 성능 검사를 `--test-name-pattern="warm snapshot"`으로 **2회 재시도**했다. warm은 **1.25/1.22ms < 3ms**, 첫날 계획 best-of-three는 **464.4/469.9ms > 400ms**였다. 독립 기준 입력도 **487.3ms**로 같은 cold gate를 넘었다. 기준을 바꾸지 않았다. 현재 원문의 교차 warm 측정 평균은 전 **1.149ms**, 후 **1.162ms**(참고값)이며 새 타이머·틱 내부의 전체 층 선형 탐색은 추가하지 않았다. 실제 브라우저의 100ms 틱 비용·모바일 성능 동일성은 Edge EPERM으로 미검증이다.

안전·정리: 추적 파일 **2,495개**의 초기 해시와 대조했다. 변경된 기존 파일은 JS·CSS와 시험 연결 1줄의 **3개뿐**이며, 보호 경로·기존 단언/fixture/hash·데이터·아트·버전·히스토리 원문은 보존됐다. 지정 QA JSON **5개를 초기 바이트로 복원**했고 생성 파일 **16개를 `local/generated/`로 이동**했다. 관련 JS/CJS syntax와 `git diff --check`도 통과했다. 원문 runtime closure는 **174/200, 누락 0**이다. 상세 로그·원본·대조 도구는 `.gitignore`의 `local/`에 보존했다.

남은 경계: 실제 390/1440px 픽셀/overflow 검증, cold 성능 gate, Git/브라우저 제한으로 미검증인 항목의 정상 환경 재실행. Candidate build·One-Pass·독립 HINA·Preview·운영 read-back은 이번 기능 개발 범위에서 수행하지 않았다.

Phase 2에서 할 일:

- `creative`의 방·좌석·앵커 기대 개수·order·연결 간선·아트/표지판을 한 묶음으로 등록하고 옥상 표시만 6F로 올리기.
- 기존 순찰·주민/남매 방문·소품·로비/회의 특례는 기존 일정 보존을 위해 유지했다. 새 층 방문 규칙과 필요한 속성 이관을 해당 단계에서 함께 검증하기.
- Room 메뉴 연결·새 아트와 주민 안전 경계, 모바일 6탭 실화면·픽셀·overflow·원문 성능을 실제 Edge에서 검증하기.
- `lowfi-216.mjs` 등 역사적 검사에 남은 `parseInt(floor)`/5층 단언은 이번에 보존했다. 실제 확장용 동적 검사와 역사적 핀 검사를 분리하기.
- 후속 tooling-306의 canonical 306/helper 층과 이번 최외곽 층의 연결 순서·중복 306 역변환을 정리한 뒤, 배포 담당이 버전 1회 상승·Candidate/열차 절차 수행하기. 다른 branch를 이번 작업에 merge/rebase하지 않았음.

commit·push·PR·main 병합·배포·Notion 갱신은 요청대로 수행하지 않았다. 서윤 인계 대상이며 운영 완료가 아니다.
