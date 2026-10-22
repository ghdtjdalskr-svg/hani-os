# 작업 인수인계 — 본사 직원 행동·이동 재설계

## 작업 식별

- 작업 ID / 제목: office-behavior-redesign / 본사 직원 행동·이동 설계 새로 하기
- 갱신 시각(KST): 2026-10-23 02:20
- 담당 도구 / 검토 담당: Claude Code(본사 행동·이동 담당 세션) / 2차 의견 GPT gpt-6-astra(읽기 전용, 서윤 팀장님 전달)
- 상태: 승인 대기 (설계 초안)
- 저장소 / branch / worktree: HANI_OS_DEV / `hani/office-behavior-redesign` / `.claude/worktrees/eloquent-einstein-794f03`
- base SHA / candidate SHA: `ad3c2f3` / 없음
- 목표 / 완료 조건: 행동 문구·실제 위치·이동 경로가 항상 맞고, 좌석·지점이 겹치지 않는 단일 상태기계. 설계 승인 → 구현 → 기존+새 테스트 → 열차 탑승.
- 수정할 파일·범위: (구현 시) `hani-office-live.js`, `hani-office-live.css`(필요 시), `data/hani-building/art-map-v1.json`(복도 좌표·창가 슬롯), 새 `data/hani-building/office-places.json`, `assets/data/office-actions-221.json`(장소 없는 밤 행동 정리), 새 테스트. 겹치는 범위: 이전 세션 "본사 직원 움직임·딴짓 상태 다시 활발하게"는 담당을 넘겼고 진행 중 작업 없음. 참고 브랜치 `hani/office-lively-4-20261022`(cf94c08).
- 사용자 승인 근거 / 승인되지 않은 경계: 회장님 지시로 설계·재현까지. 구현·배포·main 병합은 승인 전. `hani_os_life_v23`/Cloud 변경 없음.

## 결과와 증거

- 변경한 내용 / 파일: `docs/drafts/office-behavior-redesign.md`, `docs/drafts/office-behavior-redesign/`(운영 증거 사진 2장, 감사 스크립트)
- 실행한 검증: 운영 2.9.230 표시 버전·JS 로딩 확인(내장 브라우저), 운영 화면에서 도현 01:57:24 복도 정지+"창밖 구경 중", 01:57:31 회의 의자+"창밖 구경 중" 캡처. 모델 감사(2026-10-22 08–23시 1초 간격): 0px 보행 구간 26, 장소 문구 불일치 268조합, 30px 이내 근접 12쌍(최소 8px).
- 실행하지 않은 검증 / 남은 위험: 낮 시간 실제 픽셀 겹침 캡처 미실행. Edge 확인 미실행(내장 브라우저로 확인).
- 데이터·저장소·Cloud·schema 영향: 없음.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 해당 없음(문서만).

## 다음 담당에게

- 먼저 읽을 파일: 설계 문서 2·3장, `hani-office-live.js` 352–514줄(산책·방문객·snapshot).
- 다음 한 가지 행동: 회장님 승인(방향, 창가 방식, 방문객 포함 여부) 받기.
- blocker: 회장님 결정 3가지.
- 다른 작업 영향: 책상 마스코트(서윤 2.9.231)가 읽는 API·DOM 유지. 이 작업 버전은 2.9.232 이후.
