# Board v4 콘텐츠 라이브러리 인수인계

## 작업 식별

- 작업 ID / 제목: Board v4 콘텐츠 라이브러리 엔진
- 갱신 시각(KST): 2026-10-11
- 담당 도구 / 검토 담당: Codex 단독 개발·자동 검사
- 상태: 엔진 개발·지정 회귀 검증 완료 / 콘텐츠 도착 및 실제 화면 검증 대기
- 저장소 / branch / worktree: hani-os / hani/board4-20261011 / board4
- base SHA / candidate SHA: 9f48074202b972f36dab3f15274227b261224b57 / 미동결·커밋 금지
- 목표 / 완료 조건: 템플릿 제거, 라이브러리 게시·댓글 시간 도착, 짧은 대표님 반응, 구형 생성물 한 번 정리, 이름·직급·팀 표시 및 지정 회귀 검사
- 수정할 파일·범위: hani-board.js/css, index.html, 신규 라이브러리 빌더·runtime·fixture 및 관련 tests. 별도 담당 part-a.json, part-b.json 수정 없음.
- 사용자 승인 근거: 이번 작업 요청 §2의 generated:true AND missing libraryId AND 구형 body marker 항목만 1회 정리. 대표님 작성·라이브러리 항목 보존. commit/version bump 금지. main merge·배포 승인 없음.

## 결과와 증거

- 기준 확인: Git HEAD/로컬 origin/main/원격 API main 모두 9f48074. index 표시 v2.9.201, 최신 UI hani-ui-v02992.js?v=2.9.201.
- CODEMAP_MISS: 게시판 feature owner 항목 없음. 실제 hani-board.js/roster/보드 tests fallback 분석.
- 백업·복구: 운영 원본 접근·변경 없음. 기존 backup export/normalize/Cloud round-trip test로 보존 검증 예정. persist는 save 실패 시 기존 state 복구.
- 환경 재확인: PowerShell과 지정 Node v24.20.0 실행 가능. git ls-remote는 네트워크 제한으로 실패했으나 GitHub connector main read-back은 9f48074202b972f36dab3f15274227b261224b57로 기준과 일치. merge/rebase 없음.
- 변경: 기존 sentence-template 생성 경로 제거. libraryId로 사용 이력 보존, KST 하루 2~4개 시간 분산 예약, season/weekday 제한, 전체 소진 후 90일 경과 항목만 재사용. 댓글은 원문과 replyTo를 보존하고 afterMin 예약 시각에 기존 materialize로 도착. 강제 도착도 라이브러리 예약을 앞당기지 않음.
- 대표님 반응: 인물별 6 intent phrase bank, 명시적 호출 우선·seed relevance/affinity로 1~3명 선택. 본문/제목 13자 연속 echo 충돌 시 짧은 대체 문구. staff-to-staff 자동 생성·수동 재생성 차단.
- 정리: 기존 boardMeta 설정 행의 templateCleanupV4 flag. generated:true, libraryId 없음, 정확한 구형 body marker 조건으로만 1회 제거. 대표님 작성·library·수동 항목과 연결된 원본 댓글 보존. 실패 시 원본 및 flag 복구. 첫 ready render와 같은 기존 save 한 번으로 처리.
- UI: 목록/본문/댓글의 avatar·이름·직급·팀. 성민 한국어 이름, MIR AI ENTITY 및 roster 팀. 목록 작은 muted metadata, 모바일 팀 숨김/포커스·title 확인. 구형 label·series marker는 읽기 전용 상태에서도 렌더링 제거. escaping, persistent slots, 단일 delegated event owner 유지.
- 기록 글: KST 하루 최대 1건. 유효한 신체 kg/걸음 수만 실제 숫자로 사용하며, 완료 날짜 충돌·빈 값·0 걸음·미달성 목표에서 수치/달성 주장 생성하지 않음.
- 신규 runtime: hani-board-library.js. index.html에서 hani-board.js보다 먼저 로드. 현재 data/board-library/*.json 없음 → 0파일/0스레드이며 템플릿 fallback 없음. 별도 콘텐츠 담당 파일을 생성/수정하지 않았음.
- 신규 파일 전체: hani-board-library.js, scripts/hani-board-library-build.mjs, scripts/hani-board-library-fixture.mjs, scripts/hani-board-library.test.mjs, scripts/fixtures/hani-board-library.json, 본 인수인계. fixture는 3스레드이며 운영 빌드에 포함되지 않음.
- 실행 검증 환경: 지정 Node v24.20.0 / base 9f48074 + 현재 미커밋 board4 변경. board 6개 테스트(community/guard/library/living/relationship/base) 모두 PASS. 명령: 지정 node로 scripts/hani-board*.test.mjs 실행. community에서 living을 추가 import하는 기존 연결 유지.
- 검사 범위: 라이브러리 merge/check·seed ids·잘못된 schema·reply link·freeze·빈 입력, 하루 한도/예약 분산/90일/season/weekday, afterMin 경계/다음날/중복 예약, 원문 echo·persona·호칭, 정확한 정리 필터/1회/1 save/rollback, escaped HTML·작성자 정보·readiness 12조건/빈 Local/미활성 보드, unknown fields·normalize·backup round-trip·Cloud count/hash/conflict 보존.
- 회의실 와일드카드 5개 검사: live-meeting/recovery 직접 PASS, routing은 임시 재구성 Edge 소스 인자를 넣어 PASS. cross-review/voice-contract 원본 명령은 child_process spawnSync EPERM. PowerShell에서 기존 git baseline 및 기존 patch를 임시 폴더에 적용한 후, 두 검사에서 subprocess 재구성 부분만 해당 실제 소스 읽기로 대체한 임시 V8 wrapper로 기능 assertion PASS. 저장소 회의실 tests/서버 코드 수정 없음. 증거 임시 경로: C:/Users/홍성민/AppData/Local/Temp/hani-board4-edge-qa/.
- scripts/hani-cloud-egress-save-sim.test.mjs PASS(3 saves egress 412 bytes, full reads 0). 실패 주입 시나리오의 의도된 오류 로그 포함. hani-main.js 변경 없음.
- node --check hani-board.js / hani-board-library.js, library builder build 및 --check, git diff --check PASS. 보호 키·내부 version·표시 v2.9.201·기존 cache tag 변경 없음. main/seed 데이터/roster/Cloud/Auth/write contract 변경 없음.
- 보드 자동 검사 로그: C:/Users/홍성민/AppData/Local/Temp/hani-board4-qa/board-tests.log. 실제 사용자 데이터 접근/저장 없음.
- 미검증: Chrome headless screenshot은 sandbox IPC 권한(Access denied)으로 실행 실패. PC/모바일 실제 렌더 화면·Android·콘텐츠 완성본·운영 로그인 및 read-back 미검증. HTML renderer와 delegated events는 synthetic VM 검사만 PASS. Arin 독립 화면 리뷰 미실시.
- Candidate freeze/package/One-Pass/HINA/main/Pages/Production: 이번 기능 담당 작업 범위 밖, 미실시. commit/push/PR/버전 증가/배포 없음.
- Notion: 재조회 성공. 이번 진행 요약 insert_content도 자동 승인 검토가 approval policy never로 거절. 갱신 완료 아님. 계획·검증 완료·아래 다음 행동 요약 갱신 대기. 자동 승인 정책 거절이며 사용자 기록 지시를 배포 승인으로 바꾸지 않음.

## 다음 담당에게

- 다음 행동: 별도 담당의 part-a.json/part-b.json 도착 후 지정 Node로 scripts/hani-board-library-build.mjs, --check 및 board tests를 재실행하고 PC/모바일 화면 확인. 신규 runtime 파일을 열차에 포함하도록 배포 담당에게 전달.
- blocker: 실제 콘텐츠 없음, 실제 화면 캡처/Notion 기록 권한 제한. 대표님에게 새 migration 승인 요청은 필요하지 않음(이번 정확한 구형 생성물 정리는 원 요청으로 승인됨). release 승인·HINA는 배포 담당 경계에서 필요.
- Notion 갱신 대기 요약: 2026-10-11 KST / Codex Board v4 / hani/board4-20261011 / base9f48074 / 엔진 및 지정 검사 완료·콘텐츠/화면 대기 / commit·배포 없음 / 콘텐츠 도착→build/check/tests→화면 확인→열차 인계.
- CURRENT / DECISIONS: 공통 파일 변경 없음.
