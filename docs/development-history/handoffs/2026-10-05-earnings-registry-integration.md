# 분기 어닝콜 · 기존 목표 등록부 연결

## 작업 식별

- 담당: Codex / 기본 단일 개발 Agent + 격리 자동 검사
- 상태: 통합 Preview 준비 / 검증 대기 (배포 후보 freeze 전)
- branch: `hani/earnings-registry-integration-20261005`
- worktree: `.worktrees/earnings-registry-integration-20261005`
- base: `c544592e427b44fd7c7c530213a790f50e92bce8` / 코드 v2.9.178
- 기존 Preview: `.worktrees/earnings-annual-viewer-20261005` / base `69ea05d8523b9f6b148f987692c213992f3ba34c` / v2.9.175. 미커밋 파일과 8776 미리보기 보존.
- 범위: 승인된 보고 UI/PPT/연간 뷰어를 최신 기준선에 적용하고, 별도 목표 카드를 없애 기존 Goal Registry 입력으로만 어닝콜 제안 연결.
- 승인 근거: 대표님의 현재 성과 강조·수정 가능한 어닝콜 기반 목표 요청, 배포 진행 요청, 가독성 Preview 승인, 이어서 진행 요청. 기존 저장 승인 절차 및 모든 최종 release gate 유지.
- 승인되지 않은 경계: 새 protected write/저장구조/schema/migration, 추가 gate 확대, 임의 merge/rebase/main 직접 변경.

## 결과와 증거

- 통합 Preview 코드 v2.9.179, 별도 `http://127.0.0.1:8777/index.html#settings` (127.0.0.1 전용, PID 34460). 기존 8776 Preview 보존. 브라우저 로그인 정보 복제/우회 없음.
- 기존 Goal Registry 폼에 어닝콜 제안 가져오기 연결. 완료 분기의 다음 분기·연도·오늘 이후 적용일을 DOM에 채움. 투자 자산은 확인된 기간 말 유지 기준, 완독은 확인된 분기 기록 수를 다음 분기의 제안으로 사용. 추가 감량·연간 실적 환산·미확인 수치 자동 목표 없음. 지난 목표 기간은 거부.
- 가져오기/입력 수정 시 오래된 승인 Preview를 무효화. 기존 목표값 검증, 승인 저장, 실패 복원 handler는 그대로 유지. 별도 legacy 목표 초안 카드·모달 prefill 경로는 적용하지 않음.
- desktop/mobile 격리 보고 회귀 PASS: 제안 입력·수정·Preview·취소·원본 goals/registry 및 보호 storage 동일성·연도 전환·지난/빈 분기 거부·가로 넘침·Q&A 문단 원문 동일성·월간 회귀·native PPT 생성. 실제 사용자 목표 저장 실행 없음.
- 최신 기준선 연간 뷰어 desktop/mobile MOCK Cloud 회귀 PASS: 실제 PDF 엔진 pagination/zoom, 검증 단계 write 없음, quota 실패 입력 보존, register/read-back/download, 계정 분리. 실제 인증 Cloud 증거가 아님.
- JS syntax/diff check PASS. Desktop/mobile 목표 등록부 screenshot 시각 확인, 밝은 카드의 기준 분기 label 대비 보정. 실제 사용자 탭 자동 변경 없음.
- runtime closure 94파일 / 18,087,297바이트 / 최대 단일 2,517,599바이트 / missing=[] (현 단계 확인). 기존 승인 계약 2.0.6의 canonical hash `6dd5eebf9969626d1c21d2b717c045a10630fe15d4a6e9ee45bc94e291fcfb77` 일치. 승인된 계약/bridge 상수만 기존 작업에서 이어 적용하며 서버 재배포·추가 제한 확대 없음.

- 현재 base는 원격 main fetch 확인. 기존 목표 등록부 canonical owner는 `renderGoalRegistry` / `goalRegistryBuildDraft`, DOM `goalRegistryPanel` / `goalRegistryContent` / `goalRegistryForm`.
- CODEMAP은 최신 목표 등록부와 보고 기능 owner를 완전히 포함하지 않아 좁은 코드 검색으로 확인.
- 기존 저장 handler는 수정하지 않음. 제안은 DOM 입력 및 설명만 변경할 계획. 미리보기/확정 저장 전에 데이터 write 없음.
- 실제 운영 표시 버전·JS·기능 read-back 미검증. PR/main merge/Pages 배포 없음.
- Supabase 서버·인증·schema 변경 없음. 기존 연간 뷰어/Q&A 계약을 보존하며 실제 인증 검증을 모의 검사로 대체하지 않음.

## 다음 담당에게

- 기존 Preview의 상세 근거: `docs/development-history/2026-10-05-annual-report-viewer-preview.md`.
- 다음 행동: 대표님 통합 Preview 확인 후 남은 실제 인증 Q&A/PPT·연간 파일 read-back 범위를 확인하고 최종 동일 후보 freeze/게이트 진행. 실제 사용자 파일·목표를 임의 생성/저장하지 않음.
- 최종 release는 최신 버전·동일 후보 identity·One-Pass/HINA/Preview 승인·Production read-back 검증 전 완료로 표시하지 않음.
- CURRENT는 실제 검증된 보고 Preview 상태만 후속 갱신.
