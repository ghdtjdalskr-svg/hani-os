# 보고 기능 · 배포 전 후보 준비

## 배포 열차 인수인계 (2026-10-05 KST)

- 상태: **탑승 대기 / 검증 미완료 — 즉시 운영 반영 불가**. 대표님 배포 열차 공지로 직접 PR/병합/배포 절차 중단. 배포 담당 Claude가 통합·버전 동결·운영 PR·배포센터를 담당.
- 인계 시 원격 main 읽기: `8ba5056f91e905bb4e7d1caf0d051e1869fc98f1`. 원격 조회만 수행했으며 현재 base로 merge/rebase하지 않음. 표시 버전 환원은 아직 미커밋이던 개발 증가분만 대상이며, 공개 commit/기존 운영 버전·역사는 수정하지 않음.
- branch: `hani/earnings-predeploy-v182` (이름의 v182는 과거 후보 이름일 뿐 배포 버전 아님). base a7bb9137083d83f8170ac103ad7603bc6d6ac603. 임의 merge/rebase 없음.
- 이번 후보의 표시 버전 및 main/CSS 캐시 태그 증가분을 base v2.9.181로 환원. 배포 담당이 최신 main 기준 버전을 결정해야 함.
- 변경 파일: `hani-main.js`, `hani-design-system.css`, `index.html`; `js/hani-pdf-core.js`, `js/hani-pdf-worker.js`; 보고 Preview/월간 smoke/연간 UI/PPT 검증·템플릿 스크립트 및 `scripts/vendor/pdf-viewer` 재현 도구; 이 인수인계와 기존 Preview 기록. 로컬 `artifacts/`는 commit에서 제외.
- 기능: 분기 10장 성과 발표·편집 가능한 PPT·Q&A 가독성·연간 업로드 PDF 뷰어·다음 분기 수정 가능한 목표 제안(DOM 초안, 기존 승인 저장 경로 유지).
- 테스트: 이전 base의 UI/보고 테스트 근거는 새 후보 PASS로 재사용하지 않음. 새 base JS syntax 및 diff 검사 통과 기록. 월간 smoke는 `#earningsGoalPeriod` 대기 timeout으로 실패; 목표 등록부/보호 상태와 격리 fixture 경로 조사 필요. 최신 후보의 실제 인증 AI 답변 포함 PPT, 연간 등록/read-back/이전 수정본 복구, 전체 최종 게이트는 미검증. 단순 탑승 대기 상태가 QA PASS를 뜻하지 않음.
- 함께 확인할 서버: `hani-earnings-dialogue` v1, `hani-annual-reports` v2 (이전 ACTIVE/JWT·401/CORS 증거가 있으나 이번 인계에서 재확인하지 않음). 서버 소스 변경/재배포 없음. Claude는 런타임 계약·최신 서버 동일성 확인 후 필요한 경우만 동시 배포 판단.
- 보호 경계: 보호 키/내부 버전·최신 보호/auth/backup·계약 2.0.8 유지. 실제 연간 QA 파일 등록은 운영 write이므로 별도 명시 승인 확인 필요. 개인 원본/인증정보를 인수인계에 포함하지 않음.
- 최신 main에는 이후 목표/배포 확인 UI 변경이 존재하므로 hani-main/index 충돌 조정 필요. 이 base 그대로 통합/배포 금지. 다른 branch·PR 수정 없음.
- 다음: Claude가 최신 main과 범위 diff 대조 → 충돌 조정 → 남은 기능 QA → 동일 후보 필수 gate → 배포 열차 절차. 개발 담당은 운영 PR을 열지 않음.

## 작업 식별

- 날짜: 2026-10-05 KST / 담당: Codex
- 상태: 진행 중 / freeze 전
- branch: `hani/earnings-predeploy-v182` / base `a7bb9137083d83f8170ac103ad7603bc6d6ac603` (v2.9.181)
- 기존 `hani/earnings-registry-integration-20261005`의 미커밋 Preview 및 이전 작업 공간 보존.
- 목적: 분기 성과발표·편집 가능한 PPT·연간 PDF 원본 뷰어·기존 목표 등록부 DOM 제안을 최신 보호 코드 위에 통합.
- 직접 사용자 지시를 전달받음: 나머지 배포 전 단계 수행. 기존 대기 해제. 실제 main 병합·운영 배포는 이번 요청으로 승인되지 않음.
- 범위: 보고 소유 runtime·검사·Preview와 작업 기록. 최신 보호 write/백업/auth/서버/게이트 및 다른 공부·뉴스 후보 보존. 임의 merge/rebase 없음.

## 결과와 증거

- 최신 main fetch 확인. 데이터 보호/백업/auth 및 게이트 계약 2.0.8을 보존하며 이전 2.0.6 계약/bridge 변경은 옮기지 않음.
- 기존 격리 검사는 이전 base의 증거. 이번 후보의 PASS로 재사용하지 않음.
- 실제 AI 답변 포함 PPT·실제 인증 연간 등록/read-back/복구는 미검증. 비밀정보 출력/복제 및 인증 우회 금지. 실제 파일/운영 데이터 write의 명시 승인 경계를 확인해야 함.
- Notion 해당 작업의 재개·최신 기준선·미검증·승인 경계 갱신 및 읽기 확인 완료. 상세 원문은 후보 공유 후 링크 추가.
- candidate SHA/package SHA/최종 One-Pass/HINA/Preview: 아직 없음. PR/main/Pages/Production 수행 없음.

## 다음 담당에게

- 먼저 이전 `2026-10-05-earnings-registry-integration.md`와 보고 Preview 기록을 읽되 최신 main의 보호 기능을 보존.
- 다음: scoped transplant, 새 base 격리 회귀 및 실사용 검증 접근 확인.
- 배포 전 준비 완료는 모든 미검증을 실제 완료 또는 명확한 blocker로 구분한 뒤 보고.
