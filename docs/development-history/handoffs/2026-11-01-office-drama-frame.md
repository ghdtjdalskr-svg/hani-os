# 작업 인수인계 · 주간 본사 미니 드라마

## 작업 식별

- 갱신 시각(KST): 2026-11-01, 담당 Codex / 검토·실제 브라우저: 다음 담당
- 상태: 구현 완료, 미커밋 검토·실제 브라우저 검증 대기 (NORMAL UI interaction)
- branch: `hani/office-drama-frame`, 현재 worktree만 사용
- base HEAD: `1ce39458457599dcb6313c7c812f4972bf66eb97`
- 로컬 origin/main: `de5bf09747a050c24c79949537f047162fc06942`; 원격 최신성 조회는 네트워크 연결 차단으로 실패. 자동 merge/rebase 없음.
- 표시 버전/마지막 UI JS: index의 `2.9.242` / `hani-ui-v02992.js?v=2.9.242` (실제 브라우저 로딩 미확인)
- 승인: 이번 사용자 요청의 승인된 대본 4개를 변환하고 기존 탭/말풍선/층 캡션 owner에 연결. commit/push/merge/version/Notion/browser 실행 금지.
- 범위: runtime `hani-office-live.js`, `hani-office-live.css`, `assets/data/office-drama-v1.json`; Node 테스트 및 이 작업 인수인계.
- 기존 미추적 원본 `docs/drafts/office-drama-week1.md`~`week4.md` 보존.

## 결과와 증거

- CODEMAP living-office owner는 맞으나 tap/캡션/scheduler 상세 anchor는 없음(CODEMAP_MISS); 실제 코드로 추적.
- canonical 경로: `createTapLines.load` literal GET → `openBubble` → `showBubble`/`bubbleText`; 위임 click/keydown 및 roster가 같은 openBubble 사용. 층 캡션은 기존 caption 생성 + updateBuilding의 floorLabel 갱신.
- 구현: 공통 `koreaTime`으로 주/요일 선택, 검증된 JSON만 메모리 사용, 첫 유효 floor 탭 우선 대사, persistent 캡션 슬롯. scheduler 및 placeStatusLabels 원문 보존을 base의 SHA-256으로 확인했다.
- 데이터: `assets/data/office-drama-v1.json` 29,484 bytes. 승인된 4주/20일/100줄을 제목·요약·층·숨은 단서 여부와 함께 원문 그대로 변환했다. 모든 대사 40 Unicode codepoint 이하, 명부 ID 대조. 채원은 명부의 `taeo`, 회장님은 `seongmin`; 새 별명 없음.
- 화면: 월~금만 기존 층 캡션 높이 안에 제목/요약을 각각 한 줄 말줄임으로 표시, 주말/파일 실패는 숨김. 해당 층 첫 탭은 행동 중에도 드라마 대사, 이후 탭은 기존 일반 대사/행동 대기 경로. 숨은 단서도 같은 규칙. 회장님은 실제 actor 재실과 `chairmanPresent`를 함께 확인한다.
- 성능: 페이지당 catalog별 GET 1회, JSON 검증 1회, 단일 기존 말풍선/이벤트 경로, 기존 갱신 주기 사용, 현재 날짜 최대 5명 드라마 탭 이력만 메모리에 보유. 별도 timer/renderer/AI 요청 없음. 실기기 성능 미측정.
- 테스트 파일: 신규 `scripts/hani-office-drama.test.mjs`; 기존 `scripts/hani-office-tap-lines.test.mjs`는 추가 GET을 URL별로 분리하는 fixture 3곳만 보정. 기존 assertion과 219/obr21 테스트는 유지.
- 신규 최종 20/20 PASS (드라마 전용 14 + 공통 fixture 6). 월 전체/연말/타 시간대/주말/원문 일치/모든 행 validation/누락·깨진 JSON/첫·다음 탭/잘못된 층/회장님/느린 로딩 중 층 변경/쓰기 0/실제 DOM 경로 검사 포함. 실제 브라우저 검증은 아니다.
- 전체 `scripts/hani-office-*.test.mjs` 32개 실행: 파일 전체 통과 18, 실패·환경 차단 14. 등록 검사 292: 통과279, 실패11, SKIP2; 등록 전 Git 차단6파일 별도. 실패11은 Git subprocess EPERM10 + 기존 obr21 소스 동결1. `HANI_GIT_PATH`를 설정했으나 일부 fixture는 하드코딩 git을 사용한다. `219`는 사용자 고지의 기존 main 실패를 수정하지 않았으며 여기서는 Git EPERM으로 시작 전 중단했다.
- obr21 baseline(수정 전)도 3/6, 최종도 3/6: 고정 행 위치 기반 source freeze 1 + Git EPERM 2. 스케줄러 변경으로 해결하거나 gate를 완화하지 않았다. 신규 검사의 scheduler/label 함수 원문 보존은 PASS.
- 첫 4주(2026-11-02~27), 09:00~18:00 표준 이동 모드: 회장님 계속 재실 93/100줄, 계속 부재88/100줄. 층별·일별 및 witness는 아래 보고서. 날짜 seed에 따라 이후 반복 주기의 결과는 달라질 수 있다. 금요일 도달 불가 대사를 위해 scheduler/actor 배치를 변경하지 않았다.
- 문법 검사 `node --check hani-office-live.js`, `node --check scripts/hani-office-drama.test.mjs` 및 `git diff --check` PASS.
- 최종 캡션 표현 수정 전에 시작된 219/actions-216/actions-221/behavior 4개는 최종 소스로 재실행 완료, 결과 분류·집계 변화 없음. 신규 slow-load 회귀 추가 후 drama 최종20개도 재실행 PASS.
- 실제 화면/폰 overflow·가독성·사무실 높이 불변·중급 Android 성능·운영 GET·package/One-Pass/배포/Production은 미검증. 브라우저는 요청대로 실행하지 않았고 차단을 우회하지 않았다.
- 배포 파일 목록: literal fetch를 `scripts/hani-runtime-closure.mjs`가 자동 수집하는 것을 검사. 별도 수동 목록 수정은 필요 없다. 실제 열차 후보에 `assets/data/office-drama-v1.json`이 포함되어야 하며 package 파일 수/크기 상한은 배포 담당이 검증해야 한다.
- 증거: [한국어 상세 보고](../../../artifacts/office-drama/report.md), [32개 최종 실행표](../../../artifacts/office-drama/test-results.json), [날짜·층·재실별 도달 가능성](../../../artifacts/office-drama/reachability.json). 테스트가 생성한 추가 artifacts도 미커밋으로 보존.
- 저장소/Cloud/schema/AI 영향: 새 쓰기 없음. 배포/PR/Preview/Production 단계 없음.
- Notion: 사용자 명시 지시로 수정하지 않음.

## 다음 담당에게

- 먼저 읽을 곳: 이 문서, `createTapLines`, `openBubble`, `updateBuilding`, 신규 테스트.
- 다음 행동: 변경 diff 검토 후 허용된 환경에서 실제 브라우저·폰 Preview 확인. 특히 360/390/416px의 제목/요약과 overflow chip 간섭, 캡션 높이, 첫/후속 탭, 회장님 부재, 주말 숨김, 누락 JSON fallback 확인.
- blocker: Git EPERM 관련 fixture 검증과 기존 obr21 source freeze는 허용 환경/기준 정리가 필요하다. 최종 gate PASS 또는 Production 완료로 해석하면 안 된다.
- CURRENT/DECISIONS: 다른 작업 기록 보존, 공통 파일 수정 없음.

서윤 수정: 줄거리가 휴대폰에서 잘려서 absolute 한 줄 대신 지도 아래 층 설명 줄에서 줄바꿈해 전체를 보여 줌. 지도 위치는 그대로. 2.9.243 배포 뒤 assets/data/office-drama-v1.json을 먼저 선반영해야 함.
