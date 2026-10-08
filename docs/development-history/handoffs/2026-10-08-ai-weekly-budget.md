# AI 주간 예산

## 작업 식별
- 날짜: 2026-10-08 KST / 담당 Codex
- branch: hani/ai-weekly-budget-20261008
- base: 691385cf11faa7906a0d27472d8e32884f2be1ea, 표시 버전 v2.9.190 / 마지막 UI hani-goal-progress.js
- 상태: 1차 기능 탑승 대기 / 전체 자동 연동 미완료
- 승인: 성민 대표님이 Codex 2계정, Claude 1계정, Gemini 1계정 사용 현황 메뉴 구현 요청.
- 범위: 별도 메뉴, 독립 사용량 요약 저장, 읽기 전용 로컬 연결, 계정별 출처·조회시각·회복시각 표시. 기존 생활 저장/Cloud/auth/schema 변경 없음.
- 경계: 다른 계정 로그인은 사용자 직접 수행. 개인 한도 요약을 공개 Git/사이트에 포함하지 않음. 모바일 자동 동기화를 위한 비공개 서버 저장은 별도 설계·승인 필요. 사용량 조회를 위해 모델 질문/결제/한도 리셋 실행하지 않음.

## 다음 담당에게
- 기능 개발·검증 후 버전·캐시 태그 변경 없이 branch push 및 탑승 대기. 운영 PR/main 병합/배포는 Claude 담당.

## 결과와 증거
- 메뉴와 4계정 카드, 조회 출처/시각/회복 예정/오래됨/확인 불가, 수동 기록·allowlist 가져오기/내보내기, 독립 키 저장 구현.
- Codex app-server 공식 읽기 전용 수집 및 같은 PC 계정 전환 해시 식별 구현. 현재 로그인된 CLI 1계정 실제 조회·로컬 비공개 저장 성공. desktop 계정과 동일하다는 추가 대조는 미검증.
- Claude statusline 어댑터 구현, 실제 후크 연결 미검증. Gemini 자동 수집 미구현, 파일 요약 및 직접 기록 지원. 두 번째 Codex 실제 로그인 전환·모바일 자동 공유는 미검증/미구현.
- `node scripts/hani-ai-budget.test.mjs`: PASS (allowlist/null·zero/회복·오래됨/계정중복/옛값보존/출처/CORS·Host·GET·헤더/실패보존/5분 제한).
- `node scripts/hani-ai-budget-browser.test.mjs <playwright/index.mjs> <chrome.exe>`: 390/1440 실제 앱 가상 화면 PASS (4칸/직접기록/새로고침/실패·잘못된파일 보존/생활키불변/넘침·JS오류 없음). 로그인 gate는 synthetic 화면에서만 해제. qa-evidence/ai-budget-390.png 및 1440.png는 가상 데이터.
- 관련 JS syntax 및 diff check PASS. 최종 버전·캐시 태그 증가는 열차 담당 경계. 보호 키/internal version/write·Cloud/auth/schema 변경 없음.
- privateDir `.ai-budget-private/` Git 제외 확인. 이메일/쿠키/토큰/개인한도값은 commit/Notion에 포함하지 않음.
- Independent Arin/HINA, 실제 인증 UI, Production HTTPS→localhost 권한, main/Pages/read-back 미검증. 개인 실제 사용량 요약은 공개 사이트 패키지에 포함 금지.
- 함께 배포할 Edge Function 없음. 로컬 Node 도우미 실행 필요. 기기 간 자동 공유는 비공개 저장 설계/승인 필요.
- 현재는 기능 일부가 준비된 1차 후보이며 네 서비스의 완전 자동 연동 완료가 아님.
- 대표님 지정 표시: Codex 주력/보조, 두 카드 상품명 GPT · Plus. Claude · Pro, Gemini · Pro. 상품명은 사용자 제공 정보이며 자동 구독 조회·검증 완료로 해석하지 않음. 계정 ID/수집·저장 경로 불변.
- 후속 사용자 요청: 관리 담당을 서윤으로 지정하고 임시 문자 아이콘 대신 실제 로고 적용. 기존 서윤 v7 프로필과 공식 사이트의 OpenAI/Claude/Gemini 원본 자산을 로컬 번들로 반영. Codex는 공급자 OpenAI 로고와 Codex 이름을 함께 표시. 출처 assets/ai-budget/SOURCES.md. PC1440/모바일390 화면·담당명·4개 로고 및 이미지 로딩 검사 PASS. 데이터/수집 기능은 변경 없음.
