# 작업 인수인계

## 작업 식별

- 작업 ID / 제목: building-phase3b / 카페 바리스타 이슬·은하 5포즈.
- 갱신 시각(KST): 2026-11-24.
- 담당 도구 / 검토 담당: Codex, 내장 image_gen / 서윤 연결 담당.
- 상태: 이미지 구현 및 targeted 검증 완료, 연결 대기.
- 저장소 / branch / worktree: HANI_OS_DEV_CLAUDE / `hani/building-phase3b` (작업 지시 기준, 직접 확인 안 함) / p3.
- base SHA / candidate SHA: Git 사용 금지로 미확인, Candidate 생성 없음.
- 목표 / 완료 조건: 기존 인물 정체성을 반영한 5포즈, 규격/용량/투명도 준수 및 검수 파일.
- 수정 범위: 신규 `assets/sprites-v3/npc-barista-v1.webp` 및 `artifacts/building-phase3b/barista/` 내부만. 기존 아트·manifest·운영 JSON/JS/CSS 변경 없음.
- 승인 근거 / 경계: `../barista-task.md`에 기록된 회장님 11/24 3단계 승인과 이번 사용자 실행 요청. Git·Edge 금지, 배포/연결 권한 없음.

## 결과와 증거

- 변경: 768×768 WebP 한 장, 두 항목의 frames.json, 비교·합성 이미지, 생성 원본·참조 크롭·재현 스크립트·프롬프트·검증 결과.
- 검증 명령: 로컬 CPython 3.14.7로 `python.exe -B artifacts/building-phase3b/barista/assemble.py`. Pillow 13.0.0은 인접 kidstoon/tmp/pylibs에서 읽기 전용 참조. 검증 대상은 SHA `5482f2b28a8f634aca867883938adfcc3c171434fd6dfa9df278eea3dc800610`.
- 실제 디코딩 결과: 26,420 bytes, 5포즈, 셀 경계 내 배치, standing 높이 120px, pivot (48,135), 미사용 영역 완전 투명. `validation.json`, `compare.png`, `overlay.png`.
- 미검증 / 위험: 런타임 연결 및 계산대 전경 레이어 미검증. 전경 마스크 없이 단순 렌더하면 하반신이 계산대를 덮음. 추천 위치 (1552,748), 배경 원본 크기 1:1, 검수 합성은 y=704에서 전경 가림.
- 데이터·저장소·Cloud·schema 영향: 없음. 앱 실행·사용자 데이터 접근 없음.
- PR / Preview / 배포: 없음. 정적 비교·합성 파일로 검토.
- main / Pages / 표시 버전 / 실제 JS / 운영 read-back: 미수행, 이미지 제작 범위 밖. 버전·캐시 태그 유지.

## 다음 담당에게

- 먼저 읽을 파일: REPORT.md 및 frames.json. contentRect는 각 셀 내부 좌표이며 rect는 아틀라스 좌표.
- 다음 행동: 서윤이 두 항목과 계산대 전경 가림을 canonical 렌더 경로에 연결하고 실제 화면에서 확인.
- blocker / 사용자 결정: 이미지 생성 자체 blocker 없음. 최종 외관 판단은 성민 대표님 정적 검수 대상.
- 다른 작업 영향: 같은 신규 스프라이트를 두 항목이 공유. 앱 설정·manifest는 미변경.
- CURRENT / DECISIONS / Notion: 쓰기 범위 밖이므로 미갱신. 연결 담당이 기존 기록을 보존하며 요약 반영 필요. Notion 갱신 완료로 보고하지 않음.
