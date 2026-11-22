# 작업 인수인계 · 층 등록부 Phase 1

## 작업 식별

- 갱신 시각(KST): 2026-11-21
- 담당: 도연 / Codex, 단일 개발 Agent
- 상태: 진행 중
- 저장소 / branch: floor5 / hani/building-5f
- base SHA: 2db38f4834ba0f2b6c21c296b5c9a4e0732f2e0a
- 로컬 origin/main: 077df04dea15d27d530ba957ad544381cf45ae60 (2.9.306)
- 원격 최신성: git ls-remote 실패(네트워크 연결 차단). merge/rebase 없음.
- 범위: hani-office-live.js/css의 무저장 등록부, 신규 시험·최외곽 exact inverse·보고서.
- 승인: ../phase1-task.md 전체 수행 요청. 11/21 PT “추천대로”는 해당 문서 인용 근거. 이번 범위는 5층 그대로, 화면/결정적 스케줄 불변.
- 금지: commit/push/배포/Notion, 보호 경로, 버전/히스토리, 기존 시험 단언/fixture/hash 변경.

## 결과와 증거

- 변경 및 검증: 진행 후 artifacts/building-phase1/REPORT.md에 확정 기록.
- 데이터/저장소/Cloud/schema: 변경 대상 아님. 기존 친밀도/도우미 경로 보존.
- PR/Preview/main/Pages/운영 read-back: 수행하지 않음.
- 초기 소스·추적 파일 해시·QA JSON 사본: artifacts/building-phase1/local/ (Git 제외).

## 다음 담당에게

- 먼저 읽기: ../phase1-task.md 및 artifacts/building-phase1/REPORT.md.
- 다음 행동: 구현 및 targeted/full standalone 시험 후 서윤에게 인계.
- Notion: 이번 작업의 명시적 금지에 따라 서윤 담당, 미갱신.
- CURRENT/DECISIONS: 기존 타 담당 기록 보존. 공통 현황 변경 없음.

## 재개 확인 · 2026-11-21

- 담당: 도연 / Codex. 기존 작업을 이어서 진행, runtime에 등록부 연결을 유지하고 계단/승강기 왕복 무결성 검사를 보완함.
- 현재 로컬 origin/main은 cd916e28466a17dfe5723fbce41ab3d0930522ec(tooling-306). 공통 기준 077df04 이후의 시험 도구 변경만 확인했고, 원격 조회는 네트워크 차단으로 미확인. 자동 merge/rebase 없음.
- 새 시험 10/10 PASS: 351개 시각의 일정·좌표·대사·주민·동행인 일치, DOM 50조합 및 fallback 일치, fetch 로딩/손상 거절, 합성 6층, 독립 Git 원본 exact inverse 확인.
- 원문 runtime closure 174개/누락 0. 새 runtime 파일 0, 새 저장·타이머·이벤트 경로 0.
- 전체 292개 standalone 시험 진행 중. 실제 Edge spawn EPERM 및 CODEMAP browser 시험의 playwright 모듈 부재는 미검증으로 남김.
- 보고서: artifacts/building-phase1/REPORT.md. 최종 시험 집계·성능 재시도·생성 파일 정리 후 아래에 확정 인계함.

## 최종 인계 · 2026-11-21 KST

- 상태: Phase 1 구현 완료 / 기존 실패·환경 제한·cold 성능 gate와 실화면 검증은 대기. Candidate/배포 완료 아님.
- branch / base: hani/building-5f / 2db38f4834ba0f2b6c21c296b5c9a4e0732f2e0a. commit/push/PR/main 병합/배포/Notion 없음(요청상 서윤 담당).
- 기존 파일 변경: hani-office-live.js/css, scripts/hani-release-305-source.cjs의 최상단 require 1줄. 신규 시험·source/preload·fixture 및 artifacts/building-phase1의 보고/검증 자료 추가.
- 옥상: 안 A(id 5f 유지 + legacyIds/order 분리) 준비만. 현재 order 5·5층·기존 표기 유지. creative/order 6은 합성 시험에만 있음.
- 최종 신규 10/10 PASS. 351개 시각의 전체 snapshot 바이트, 50개 DOM 조합과 fallback 일치. 정상 fetch 수용/손상 거절, 326개 단일 앵커 제거 거절, 계단·승강기 왕복, 합성 6층 경로, 독립 Git 원문 경계 확인.
- 전체 292개 standalone 최신 결과: 191 PASS / 29 FAIL / 72 미검증. FAIL 29개는 독립 Git 입력에서 같은 첫 오류·실패 검사 이름 재현. 기존 단언·fixture·hash 수정 없음. 상세 파일별 결과: artifacts/building-phase1/TEST-RESULTS.md.
- 성능 재시도 2회: warm 1.25/1.22ms PASS(<3ms), cold best 464.4/469.9ms FAIL(<400ms). 기준 입력도 487.3ms FAIL. 기준 완화 없음. raw 교차 warm 평균 1.149→1.162ms는 참고값이며 실제 브라우저 100ms 틱·모바일 비용 동등성은 미검증.
- 실화면: 실제 Edge spawn EPERM. CODEMAP browser 시험은 playwright 모듈 부재. 390/1440px 픽셀·overflow·실제 Preview는 서윤의 실행 가능한 환경에서 확인 필요.
- 보존: 추적 파일 2,495개 초기 hash 대조. 기존 변경은 위 3파일뿐. 보호 경로·저장/Cloud/schema·아트·버전/히스토리 보존. 지정 QA JSON 5개 초기 바이트 복원, 생성 파일 16개 local/generated로 이동. 새 runtime 파일 0, closure 174/200·누락 0. 새 저장 접근·timer·event 경로 0. 기존 친밀도/도우미 경로 보존.
- 증거: artifacts/building-phase1/REPORT.md, TEST-RESULTS.md, VALIDATION.json. 전체 로그·초기 원본·Git 대조/복원 도구는 local/(Git 제외)에 보존.
- 다음 한 가지 행동: 서윤이 tooling-306의 canonical 306/helper 시험층과 이번 Phase 1→office-motion→306 층의 연결 순서 및 중복 역변환을 조정하고, 정상 환경에서 남은 성능/브라우저/Git 검증 수행. 이번 탭에서 다른 branch를 merge/rebase하지 않았음.
- 승인 경계: ../phase1-task.md의 Phase 1 수행 및 인용된 11/21 PT “추천대로” 범위. 버전 상승·데이터/Cloud 변경·main 병합·배포 승인으로 확대하지 않음. 서버 Edge Function/설정 변경 없음.
- CURRENT/DECISIONS/Notion: 원문/타 담당 기록 보존, 이번 금지에 따라 갱신하지 않음. Notion 반영과 commit/push는 서윤 담당.
