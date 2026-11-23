# 안내 데스크 NPC · 서윤 인수인계

## 작업 식별

- 작업 ID / 제목: npc-guide / 대공사 3단계, 2.9.315 안내 데스크 신규 NPC.
- 갱신 시각(KST): 2026-11-24. 정확한 종료 시각은 파일 수정 시각 참고.
- 담당 도구 / 검토 담당: 도연 / Codex 단일 담당, built-in image_gen 생성. 독립 Agent 검증은 수행하지 않음.
- 상태: 신규 그림 제작 및 targeted 파일 검증 완료 / 서윤 runtime 연결·Preview 확인 대기.
- 저장소 / branch / worktree: PROJECT HANI, 사용자 전달 `hani/building-phase3b`, `p3`.
- base SHA / candidate SHA: Git 사용 금지로 미확인. 원격 main·운영 표시 버전·최신 JS도 새 조회하지 않음.
- 목표 / 완료 조건: `../npcguide-task.md`를 UTF-8로 전체 읽고 한글 정상 확인. 요구된 신규 아틀라스·비교 PNG·프레임 정보·짧은 한국어 보고서 제작.
- 수정 범위: 새 `assets/sprites-v3/npc-guide-v1.webp` 1개와 `artifacts/building-phase3b/npc-guide/` 내부만. 기존 그림·manifest·JS·CSS·운영 JSON 수정 없음.
- 사용자 승인 근거: 이번 요청에서 작업 문서의 모든 지시 수행, 문서에 기재된 11/23 결정 및 11/24 3단계 승인. Git·Edge 금지. main·배포 승인은 포함되지 않음.

## 결과와 증거

- 신규 그림: 768×768 RGBA / 셀96×144 / front / 0행0~3열 standing·sitting·walk-a·walk-b. pivot48,135, 실제 높이120/105/111/111. `frames.json`의 contentRect는 cleaner와 동일하게 셀 내부 좌표.
- 크기: 39,246바이트, SHA-256 `cac14abe886813a2032d69ecde8fce16419da93ebdb5692658ddd6916c3fc882`.
- 두 필수 참조: `npc-pack-v2.webp`, `npc-cleaner.webp`를 확인 후 image_gen의 `referenced_image_paths`에 모두 직접 전달. `PROMPT.txt`에 최종 프롬프트 원문 보존. `source.png`는 생성 원본이며 기존 이미지를 편집하지 않음.
- 인물 시각 확인: 자주빛 낮은 묶음머리, 청남색 재킷, 흰 블라우스, 작은 살구색 스카프, 목줄·빈 사원증, 친절한 미소. 글자·숫자·로고 없음. 기존 갈색 머리 NPC와 구분, 경비의 회색 남색보다 푸른 재킷. 네 포즈를 새 동일 인물로 확인.
- 조립: 생성 원본의 각 사분면에서 alpha>8인 실체의 외곽을 찾아 crop. crop 내부 원본 알파는 보존하고 축소·중앙 정렬. 매우 낮은 알파의 바깥 생성 잡티를 아틀라스에 포함하지 않음. FFmpeg libwebp lossless=1 / compression_level=6 사용.
- 실행 검증 명령: `& 'C:\Users\홍성민\AppData\Roaming\uv\python\cpython-3.14-windows-x86_64-none\python.exe' -B artifacts/building-phase3b/npc-guide/pack-and-verify.py`.
- 환경: Python3.14.7 표준 라이브러리 + 설치된 `C:\Program Files\TheDeepDarkVideoManager_Falcon_v3\ffmpeg-lgpl-builds-x64\ffmpeg.exe`. 스크립트는 기존 최종 이미지가 있으면 중단하므로 재실행으로 덮어쓰지 않음.
- 검증 결과: WebP 재디코딩 후 실제 네 contentRect·높이·알파 보존·서로 다른4프레임·허용 셀 밖 alpha0·50,000바이트 이하 확인. `VALIDATION.txt`에 수치 보존. 기존 스프라이트 폴더38파일 해시 일치, manifest 및 두 참조의 해시도 기록.
- 실제 파일 시각 검토: 최종 WebP와 `compare.png`를 view_image로 열어 확인. 비교 PNG는 1104×176, 왼쪽 기존7명 standing / 오른쪽 새4포즈, 소스 셀을 확대·축소 없이1:1 합성. 배경 합성만 적용.
- 초기 도구 제약: 기본 Python의 Pillow 부재, 다운로드는 네트워크 제한으로 실패. Chrome 변환 시도도 OS 실행 권한 실패. 이 실패를 PASS로 세지 않았으며, FFmpeg로 최종 변환·검증 완료. Edge는 실행하지 않음.
- Risk Tier: LIGHT 이미지 에셋. JS syntax·DOM·이벤트·저장·Cloud·schema·캐시 검사는 코드 변경 없음으로 N/A. 버전 증가는 기능 담당 열차 규칙에 따라 수행하지 않음.
- 미검증: manifest 연결 이후 실제 건물 UI·애니메이션·Preview·독립 HINA·Candidate gate·운영 화면. 이미지 제작 완료와 runtime 반영 완료를 구분함.
- 데이터·저장소·Cloud·schema 영향: 없음. 보호 키 및 저장 경로를 건드리지 않음.
- PR / Preview / 배포: 생성하지 않음. main merge / Pages / 표시 버전 / 최신 JS / 운영 read-back 모두 이번 작업 미실행.

## 다음 담당에게

- 먼저 읽을 파일: `REPORT.md`, `frames.json`, `compare.png`, `VALIDATION.txt`.
- 다음 한 가지 행동: 서윤이 `frames.json` 기준으로 manifest·기존 canonical renderer에 연결하고 안내데스크 네 포즈를 Preview에서 확인.
- 서버 Edge Function·설정·배포 순서: 이 그림 작업에 필요한 서버 변경 없음. runtime 연결이 끝난 후 배포 담당 열차 절차 적용.
- blocker / 필요한 사용자 결정: 이미지 자체의 규격 blocker 없음. 실제 UI 시각 승인 및 배포 승인 별도.
- 타 작업 영향: 기존 NPC7명·cleaner 및 모든 기존 스프라이트 유지. 본 인수인계는 구현 연결을 완료했다고 주장하지 않음.
- CURRENT / DECISIONS / Notion: 이번 사용자 지정 쓰기 범위에 포함되지 않아 갱신하지 않음. 서윤이 공통 허브에 제작 완료·미연결·실제 UI 미검증·Git/배포 미실행·SHA 미확인을 요약하고 Notion 저장 후 read-back할 것. 현재 Notion 미반영이며 자동 동기화나 연결 완료로 보고하지 않음.
