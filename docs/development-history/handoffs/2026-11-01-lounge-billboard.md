# QA-20 · 라운지 전광판 / 월간 퀸 투표 중단

## 작업 식별

- 갱신: 2026-11-01 13:09 KST / 담당 Codex / 검토·브라우저 확인: 지정 검토 담당.
- 상태: 전광판 구현·Node 검사 완료, 퀸 투표는 명시된 중단 조건 적용. 미커밋 검토 대기.
- 저장소 ghdtjdalskr-svg/hani-os / qa-b4 / branch hani/lounge-billboard.
- base·로컬 branch ref·로컬 origin/main: 583cc97960d0e41e975d633b27b1e60d322bcfc4.
- 원격 최신성·Production 2.9.246은 직접 확인하지 않음. Git subprocess·브라우저는 사용자 지시대로 실행하지 않음.
- 승인: 2026-11-01 QA-20 요청의 이 worktree 미커밋 수정·targeted 검사. commit/push/merge/배포·버전/cache 변경 권한 없음.
- 범위: hani-board.js, hani-board.css, index.html의 .board-promo, 기존 라이브러리와 빌더, 신규 전광판 검사, 기존 QA 배너 검사, 작업 기록.

## 결과와 증거

### 전광판

- persistent slot을 이미지 전광판으로 변경. desktop 200px / 480px 이하 168px. kicker·큰 제목·한 줄 copy·점 선택·작은 pause. 넓은 텍스트 버튼 두 개 제거.
- 이미지 cover, 흰색 글자 뒤 검정 gradient 최소 불투명도 .72: 흰 이미지에서도 계산상 AA 4.5:1 이상. 실화면·실측은 미검증.
- 단일 6000ms timer, 화면 이탈/문서 숨김/pagehide 중지, focus 중 전환 유예 유지. reduced motion에서 자동 전환 없음, 점 수동 선택 가능, pause는 disabled로 유지.
- 현재 순서: 이달의 직원 → 최신 발행 일보 → 실제 weeklyBest 첫 글 → 최신 발행 시장 4컷 → 날짜별 가상 광고 2개. 데이터 없는 항목 생략.
- 일보는 data/hani-ilbo/issues.json 및 해당 issue 원본, 4컷은 assets/data/newsroom-4cut/issues.json에서 빌드 시 제목·호수·날짜만 기존 hani-board-library.js에 투영. 런타임 KST 발행일·초안 필터. 새 fetch·AI 호출 없음. 발행 원본 변경 시 기존 라이브러리 빌더 재실행 필요.
- 요청 광고 문구 6종 유지, KST 날짜로 서로 다른 2개 선택. 광고만 가상 광고 chip. 실제 agentReview/dev/investmentCommittee로 이동. 베스트는 기존 openPost UI 경로.
- 연속극은 생략: 원본 JSON은 있지만 허용 범위에서 실제 주차와 synopsis를 연결하는 공개 경로를 확인하지 못함. 새 fetch·추정 주차를 만들지 않음. 금지된 office-live/building 파일 미수정.

### 퀸 투표: 중단 / 미구현

일반 투표의 post.poll.options/votes, 생성 댓글 voteChoice, applyStaffVotes, votePoll은 존재한다. 그러나 아래 연결이 없다.

1. generateDaily가 라이브러리 글의 poll을 생성 글에 전달하지 않는다.
2. publicationReplies가 원본 댓글의 voteChoice를 예약 댓글에 전달하지 않는다.
3. votePoll은 옵션·쓰기 준비만 검사하며 월말 마감·투표 시각을 검사/기록하지 않는다. applyStaffVotes에도 월말 확정 경계가 없다. 버튼만 막아서는 공개 투표 함수의 마감 후 변경과 다음 달 결과 고정을 보장할 수 없다.

실제 생성 함수에 synthetic poll/comment를 넣어 1·2를 Node로 재현했다. 기존 함수 변경 없이 월말 확정까지 보장할 수 없어, 요청의 “기존 poll 경로로 불가능하면 그 부분 중단”을 적용했다. 필드 전달만 추가한 불완전한 기능은 넣지 않았다.

- votePoll·applyStaffVotes·글/댓글 생성·저장 함수 원문 유지.
- 11월 3일 월간 투표글·직원 표 생성·동률/회장님 선택 집계·월말 마감·다음 달 발표·10월 수상자 고정표/슬라이드 모두 미추가.
- 동률·회장님 표로 결과 변경·자기 투표 금지·다음 달만 발표 검사는 미구현/N/A. PASS로 계산하지 않음. 신규 검사는 중단 원인의 실제 생성 재현만 포함.
- 후속 결정: 라이브러리 필드 전달과 canonical poll 마감 경계에 허용할 변경 범위를 정해야 함. 이번 작업에서는 수행하지 않음.

### 사용 이미지 / 패키지

추가 이미지 0, 추가 runtime 파일 0. 아래 12개는 모두 작업 전 closure에 존재한다.

- assets/team/hani-team-office.webp
- assets/heroes/newsroom-218.webp
- assets/heroes/investment-218.webp
- assets/profiles/hani-profile-hani.webp
- assets/profiles/hani-profile-haru.webp
- assets/profiles/hani-profile-hina.webp
- assets/profiles/hani-profile-jieun.webp
- assets/profiles/hani-profile-minji.webp
- assets/profiles/hani-profile-naeun.webp
- assets/profiles/hani-profile-sooyeon.webp
- assets/profiles/hani-profile-yuna.webp
- assets/profiles/hani-profile-sua-id.webp

closure 내 초상이 있는 직원만 해당 초상 사용, 다른 직원은 office 이미지. closure 128 → 128 / missing 0 / 전후 목록 동일. 기존 library threads 220개 내용 동일.

### 검증

지정 테스트 8명령 통과 / 실패 0. case 수를 출력하지 않는 기존 스크립트는 명령 통과로만 표시.

| 명령 | 최종 결과 |
| --- | --- |
| node scripts/hani-lounge-billboard.test.mjs | 9 PASS / 0 FAIL |
| node scripts/hani-board.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-living.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-community.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-203a.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-board-views-211.test.mjs | 7 PASS / 0 FAIL |
| node scripts/hani-board-library.test.mjs | 명령 PASS / exit 0 |
| node scripts/hani-qa-easy-cleanup.test.mjs | 12 PASS / 0 FAIL |

- node --check: hani-board.js, hani-board-library.js, scripts/hani-board-library-build.mjs, scripts/hani-lounge-billboard.test.mjs, scripts/hani-qa-easy-cleanup.test.mjs → 5 PASS / 0 FAIL.
- node scripts/hani-board-library-build.mjs --check → PASS, 3 source files / 220 threads.
- 첫 개발 실행의 builder 괄호 오타와 새 fixture의 DOM/lexical mock 오류 수정 후 위 결과. 최종 미해결 실패 0.
- 신규 검사: 실제 slide/weeklyBest/employee·광고·발행 원본·chip·점/링크·focus/visibility/page lifecycle/reduced motion·write/network 거부 환경·closure·최소 contrast·퀸 중단 원인.
- 기존 테스트 수정: scripts/hani-qa-easy-cleanup.test.mjs의 QA-7 배너만. 실제 함수 공용 fixture, 발행호 kicker, 삭제된 next 대신 dot, reduced-motion pause hidden 대신 disabled. 다른 검사·기대값 유지.
- byte audit: hani-board.js의 배너/배너 이벤트 분기 밖 원문 동일, index.html의 promo 밖 원문 동일. 개행 형식 유지. version/cache/HANI_DISPLAY_VERSION·save/state shape/보호 키·Cloud/Supabase/schema 변경 없음.
- 베스트 열기의 기존 조회 기록은 유지. 전광판 paint/선택/timer 자체는 저장하지 않음.
- browser·360px/desktop 실화면·키보드/overflow·이미지 실제 로딩·Production·최종 Candidate/package/HINA 미실행. runtime release 완료 아님.

## 다음 담당에게

- 먼저 볼 곳: hani-board.js의 loungeBannerItems/paintLoungeBanner/syncBanner/click 분기, 빌더 publicationBulletins.
- 다음 행동: 미커밋 diff 검토 후 허용 브라우저에서 360px/desktop 높이·넘침·문구/초상·44px 점·pause·링크·숨김 timer 확인.
- 퀸 기능은 별도 범위 결정 필요. 완료 기능으로 취급하지 않음.
- CURRENT에는 검증 결과·중단만 요약. DECISIONS에 대표님 결정을 새로 만들지 않음.
- Notion 갱신 대기: 이 작업의 계획/결과·branch/base·8명령/문법5개·전광판 완료/퀸 중단·브라우저 대기 요약. 현황판 fetch 성공, append는 도구가 승인을 요구하고 승인 정책 never여서 자동 승인 검토 거절. 쓰기/read-back 미완료.
- commit/push/merge/배포 없음. 기존 2.9.246·cache tags 유지. 검토 완료를 배포 승인으로 추정하지 않음.
