# HANI-7 분기 PPT · 연간 PDF 뷰어 — 탑승 대기

## 작업 식별

- Codex / 2026-10-07. 대표님 가능한 남은 항목을 탑승 준비까지 지시. 다른 담당 탭의 사용량 제한으로 staged 파일을 별도 worktree에 복사해 이어받음. 원래 작업 공간 보존.
- branch `hani/earnings-ready-followup-20261007`, base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a`. 오래된 v181 branch 전체 merge 없이 고유 PPT/PDF 범위 이식. 최신 main691385cf는 개발 소스/검사 반영이며 runtime 세 파일은 그대로인 것을 확인. 임의 merge/rebase 없음.
- 파일: hani-main.js/index.html/hani-design-system.css, js/hani-pdf-core.js 및 worker, annual/report UI와 PPT 검증·템플릿 스크립트, vendor 재현 도구, 이 문서. 버전/cache v2.9.190 유지. 운영 PR/main/배포 없음.

## 구현과 검사

- 분기 10장 발표무대 및 편집 가능한 PPT, 대화 문단 표시, 다음 방향 참고. PPT는 10장 발표 + 실제 필요 시 문맥/답변/근거 부록. 정식 목표 승인 원장은 이 기능 범위 아님.
- 연간 원본 PDF canvas viewer/페이지/zoom, 기존 private archive 서버 validate→명시적 register→readback/hash, 이전 revision 활성화 및 원본 보존. 생활 state/save/goalRegistry와 분리. 새 localStorage write나 기존 insert/update/delete/upsert/Cloud Sync 구조 변경 없음.
- 기존 auth callback에 연간 UI memory invalidate 한 줄 추가: SIGNED_OUT/owner 변경 때 PDF/파일선택/조회결과 제거. 인증 실행·권한·세션 저장·로그인 방식 변경 없음. async owner/epoch guard 유지.
- 격리 Chrome PC1440/모바일390 실제 앱 earnings UI PASS: 기존 월간 생성/보관/reload/재생성/누적/실패 rollback/source 보존, 발표/편집 PPT/Q&A 문단/overflow. `scripts/hani-earnings-report-ui-test.mjs`.
- 연간 고유 UI 격리 PC/모바일 PASS: 합성 PDF 3페이지 canvas, 넘김/125%확대, 검증 시 모의DB쓰기0, quota 실패 입력 보존, 명시적 등록/readback/다운로드/이전 수정본 복구(2개 원본 보존), owner 바뀌면 파일/뷰어/목록 제거. `scripts/hani-annual-report-ui-test.mjs`. 서버 전체를 mock한 기능 검사이며 실제 인증/DB/RLS 증거가 아님.
- `scripts/hani-earnings-ppt-verify.mjs` 실제 산출물: 모의 AI 답변 포함 분기14장 및 긴 문맥 연간28장. 패키지 integrity/layout·편집 표2개·발표자 순서·artifact import PASS, 전체 렌더 montage 눈으로 확인. 내용 자동 잘림/겹침 발견 없음. 실제 AI 호출/PowerPoint 네이티브 실행 미검증.
- 6개 변경 JS syntax 및 diff PASS. 캡처/PPT/검사 receipts는 로컬 artifacts에만 보존, commit 제외. 독립 아린/HINA가 아니라 개발자 실행 검사.

## 탑승 경계

- HANI-28/31 결합 `hani/goal-report-ready-20261007`와 HANI-33 `hani/navigation-state-20261007@9aa7e38`와 index/board handler 기능 충돌 있음. 이 branch의 monthlyReportRenderBoard에 earningsRender 추가와 navigationPersist 호출 둘 다 필요. index quarterGoalReport/annualGoalReport 슬롯을 유지하면서 earningsQuarterly/earningsAnnual를 추가해야 함. 공통 계산·목표 삭제/등록·generator 소스를 덮어쓰지 말 것. 기능 충돌은 담당에게 반환, 열차에서 임의 해결 금지.
- 발표용 실적의 기존 monthlyReportSnapshot 기반 계산과 HANI-31 공통 지표 슬롯은 별도 조회 구조. 완전히 단일 계산으로 연결된 최종 발표 계약은 미완성; 두 경로가 단일 계산이라고 선언 금지. 기간/실적이 충돌하는 상황은 다음 통합 담당 검증 필요.
- 함께 확인할 기존 서버: hani-earnings-dialogue v1, hani-annual-reports v2, private bucket/table/owner 및 JWT 계약. 소스/schema/서버 재배포 수행 없음. 실제 현재 service 상태 확인 안 함. 실제 운영 연간 등록·복구 QA는 명시적 운영 write 승인을 확인한 뒤 수행.
- 최종 열차에서 통합 targeted checks/package/OnePass/독립HINA/Preview·대표 승인 후 배포/readback. 실제 auth/Cloud/Android/실제 AI 답변·운영 미검증. 개발 탑승 준비와 최종 배포 가능 판정은 구분.