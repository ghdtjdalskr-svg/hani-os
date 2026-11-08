# 동행 동물 부서 상주 · 2026-11-07

- Codex / `hani/companion-homes` / base `c590f8a`. 과제 UTF-8 정상. 로컬 표시·cache **2.9.277 유지**(과제명 279 후보와 구분). push/merge/배포 없음.
- 비동행 개구리4F·펭귄3F·병아리/여우2F·수달1F. 병아리는 라이프 쪽 기존 bori 정류장, 여우는 재무 쪽 dog 정류장 우선, 막히면 같은 층 안전 정류장. 2F 이동 양끝 예약 분리. 동행 먼저 배치해 평일1마리·주말남매 우선 유지(회장님 부재 시 당일 동행종 숨김도 기존대로). petMotion/free/residentSafe 및 히든 방문·순찰·대사 owner 보존.
- **7일×1,440분** 실제 일정: 지정 층·동행·펫 간 거리 PASS. 동행+기존 펫 포함 층별 최대: **1F 6 / 2F 5 / 3F 4 / 4F 3 / 5F 3**. 새 5종만 집계하면 2/3/2/2/1. 상세 [daily-maxima.json](daily-maxima.json).
- 혼잡 시 기존 free 규칙 때문에 펭귄4표본·여우99표본이 잠시 숨음(각 동물 총10,080분 표본). 안전 자리를 강제하거나 층을 바꾸지 않음. 기존 크림·모찌 등 주민 snapshot/대사 원문 불변. 새5종의 재회 대사는 지정 층에서만 가능하며 **5F에서는 더 이상 새5종을 만나는 대사가 나오지 않음**. 실제 모든 대사의 일일 발생 횟수는 미검증.
- 전용 시험 16개 중 **15 PASS·Git subprocess EPERM 1차단**(공통 DOM6 포함). 실제 DOM 재사용/저장0, 기존 runtime 등록 횟수 setInterval2/setTimeout4/listener15 불변, closure161/누락0. strict 역변환5쌍으로 원래 278 계약 전체 보존. 복원 Git blob `d57be02b`는 직접 `git rev-parse c590f8a:hani-office-live.js`와 일치.
- 전체 **67파일·736 PASS·Git EPERM 33차단·기존 skip5·그 외 실패0**. 기존 펫4마리 시험의 새 수달 중복 집계3건은 exact inverse 입력으로 원래 assertion을 유지해 재검사(21 PASS·Git1차단); 원래 실패 로그 보존. [regression.json](regression.json)·[final-proof.json](final-proof.json). runtime `84b448af` / contract `a096d64a`.
- 성능 **최종 코드에서3/3 PASS**, 원래 `<400ms`/warm`<3ms` 그대로: cafe 부재 best291.4/281.7/302.3ms, 재실316.7/311.8/306.2ms; lively282.5/288.4/282.2ms·warm0.755~0.767ms. 개별 cold 최대344.5ms. 초기/수정 중 측정은 보존하되 최종 판정에는 재사용하지 않음. [실측](final-performance/measurements.json).
- Edge1280×900 토요일14시 4F/2F PNG: launch EPERM 및 별도 임시 프로필 CDP 연결 종료로 **미생성·화면 미검증**. [재실행](preview.ps1). 실제 auth/Cloud/Android·release build/One-Pass/HINA·운영 read-back은 이번 범위 밖.
- 원격 main `882e6c6`(2.9.278)의 수정 전 JS blob이 base와 같음 확인, 자동 merge/rebase 없음. main 실제 화면/로딩은 이번 환경에서 미검증. 저장/Cloud/schema·버전/cache 변경0, 새 runtime 파일0.
- 로컬 `git add` 실제 시도는 worktree `index.lock` Permission denied(exit128), staged0으로 **새 commit 차단·미커밋**. Notion 착수 저장/read-back 완료, 진행 갱신은 자동 승인 검토 `approval policy never` 거절로 대기. [인수인계](../../docs/development-history/handoffs/2026-11-07-companion-homes.md).
