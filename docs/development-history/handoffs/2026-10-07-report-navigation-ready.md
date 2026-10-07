# 목표·보고·발표·모바일 기능 결합 — 최종 탑승본

- Codex / 2026-10-07 KST. 대표님 가능한 남은 항목을 탑승 준비까지 수행 지시. 운영 배포 승인 아님.
- branch `hani/report-navigation-ready-20261007`, runtime base `c43ba2f1ce24c05e2cb16338e920fcf73731de0a`. 같은 담당의 HANI-28/31 결합, HANI-33, HANI-7 고유 기능을 별도 기능 branch에 합침. 이전 branch와 타 담당 원본 worktree 보존. 운영 main/release branch 아님.
- index의 quarterGoalReport/annualGoalReport 공통 9지표 슬롯을 유지하며 earningsQuarterly/earningsAnnual 추가. canonical monthlyReportRenderBoard 하나에서 발표 렌더·공통 목표 재조회·UI navigationPersist 보존. 이벤트 layer 추가 없음.
- 분기 발표/PPT의 주요 실적(투자 최근값·지출·정답률·완독·시청)을 공통 기간 API에서 조회. 최근 관측값을 기간 말 확정값으로 과장하지 않는 표시, 미확인 완료 기록은 null 문자/0 대신 미확인. 월별 원본 근거·일수·신체 변화 서술은 기존 월간 스냅샷 조회를 유지하므로 모든 발표 요소를 9지표와 동일하다고 선언하지 않음.
- 원본 검증 전 분기 발표/다운로드 차단. 연간 파일은 기존 private archive owner/epoch/hash 보호 경로. 계정 변경 UI invalidation 한 줄 유지, 인증 권한/로그인 실행 변경 없음.
- 버전/cache v2.9.190 유지. 보호 key/internal VERSION·기존 save/goal Preview·삭제·Cloud Sync write/schema·사용자 운영 원본 변경 없음. 별도 UI key에는 위치/board만 저장.

## 결합 코드 검사

- 단위31/31, generator parity/syntax/diff PASS.
- 공통 보고 UI 1440/390 × 밝음/어두움4 PASS: 원본 gate/9지표/다음 목표 DOM 전달/보호 원본 불변/overflow. UI navigation key 변경만 허용, 다른 storage·state 불변 검증.
- 목표 예산/시청 UI4 PASS, 기존 Preview 저장0/승인 저장1·중복 차단·rollback·readback·다른 필드 보존.
- 모바일 navigation PC/모바일 PASS: last view/scroll/annual·quarterly board 복원, explicit hash/invalid board/fallback·저장 실패·보호 원본 보존.
- 월간 보고 PC/모바일 PASS: 생성/보관/reload/명시적 재생성/누적/저장 실패 복구·원본 보존, 공통9지표/탭 전환. 월간 저장 검사는 전용 monthly smoke로 유지하고 earnings smoke의 중복 월간 검사를 제거해 역할 구분.
- 발표/대화/PPT PC·모바일 PASS, gate 미검증 시 export 버튼 없음, 주요 실적 공통 API 연결, 원본 보호 key 불변, 문단/긴 답변·XSS 문자열 escape·계정 대화 분리.
- 연간 PDF mock PC·모바일 PASS: canvas/넘김/zoom, validate mock write0, 명시적 등록/readback/download, 실패 입력 보존, 이전 수정본 복구 원본2개 유지, owner변경 파일/뷰어 제거.
- PPT 분기14장(발표10+근거/답변부록), 긴 연간28장: integrity/layout/native table/import 및 전체 PNG 렌더 검사 PASS. 합성 내용/모의AI, 실제 PowerPoint·실제AI 미검증. 최종 출력 title/unknown 표시 수정 후 PPT 검사 재실행. artifacts는 commit 제외.
- 독립 아린/HINA가 아니라 개발자 및 자동 검사. 실제 auth/Cloud/Android/운영 파일 등록·복구/Production readback 미검증.

## Claude 탑승 지침

- HANI-7/28/31/33은 이 branch의 최종 결합 runtime으로 함께 탑승. 이전 개별 branch 및 goal-report-ready branch를 다시 중복 적용하지 말 것. 기존 main691385cf는 source/tooling 반영 상태라 최신 main 위 runtime+source의 변경만 대조해야 함. 이 branch는 main merge/rebase하지 않았고 최신 main/열차 QA 근거로 검사 재사용 금지.
- 기능 충돌 해결은 담당이 이 결합본에서 완료. Claude는 최신 열차 후보에서 targeted 검사 재실행, 후보 freeze/버전1회/package/OnePass/독립HINA/Preview·대표승인·canonical 배포/readback 수행.
- 기존 hani-earnings-dialogue v1, hani-annual-reports v2 및 private archive 계약은 배포 담당이 실제 상태 확인. 이번 서버/DB/schema 배포 없음. 실제 운영 register/activate QA는 명시적 운영 write 승인을 확인할 것.
- HANI-35 Drive 사전검사 개발도구는 별도 `hani/drive-precheck-complete-20261007@05c9bcf` 준비. 실제 Drive OAuth/업로드/복원 미구현. HANI-34 입력 초안은 계정 lifecycle 무효화 계약이 없어 조사/설계 보류. HANI-30 디자인 승인·실제Cloud 검증은 담당 경계.
- 이전 개별 인수인계의 충돌/공통화 미완료 문구는 해당 당시 상태. 현재 최종 적용 범위는 이 문서 우선.
