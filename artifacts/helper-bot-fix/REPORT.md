# 도움봇 미표시 수정 · 2026-11-07 KST

성민 대표님, 기존 코드에서 **폰의 일반 버튼 과밀 → slot() 실패 → root.hidden=true**를 재현했습니다. PC 1280×900·1920×1080도 mini 레일 조작부가 세로 슬롯을 모두 점유하면 같은 숨김이 발생했습니다. 실제 운영 계정·생활 데이터에는 접속하지 않았습니다.

- 폰·PC 모두 일반 스크롤 버튼/카드는 장애물에서 제외하고, fixed/sticky UI와 포커스 입력만 회피합니다. PC 펼친 레일의 본문 경계, mini 레일 조작부 회피는 유지했습니다.
- 빈 슬롯이 없어도 기본 우하단에 표시하며, 폰 fallback은 고정 하단바 위로 올립니다.
- 로그인 잠금/로그인 화면·외부 모달/다이얼로그·당번 없음은 숨기고, root의 data-helper-reason에 shown/login/modal/no-duty를 기록합니다.
- 기존 observer에서 로그인·다이얼로그 상태 변경을 감지합니다. 리스너 9개 유지, 새 이벤트/렌더러 층 없음.

| 검사 | 결과 |
|---|---|
| 수정 전 숨김 재현 | 폰 일반 버튼80개·PC mini 레일 과밀 재현 |
| node scripts/hani-helper-bot.test.mjs | **23 통과 / 0 실패 / 브라우저 1 skip** |
| 혼잡 화면 모의 검사 | 390×844·1280×900·1920×1080, 레일 open/mini/숨김, 빈 슬롯 fallback 통과 |
| 고정 UI·포커스·이유 속성·기존 기능 | 회피·로그인/모달 복귀·당번 없음·기존 회귀 통과 |
| node scripts/hani-nav-groups.test.mjs | **통과**. 기본 실행은 git EPERM; 아래 정확한 main 원문으로 재실행 |
| node scripts/hani-design-system-qa.mjs | **통과** |
| syntax·보존·런타임 참조 | 문법 통과, helper 배치/update/observer 외 UI 원문 동일, 런타임155/160·누락0 |
| 실제 브라우저·로그인·운영 화면 | **미검증**. 선택적 브라우저 검사 인자 없음; Playwright 모듈 로딩도 export 오류 |

기준: hani/helper-bot-fix / HEAD·원격 main e936f8af0b71ab1cb18ca9120bfe04bfaa526d72 일치(GitHub compare). v2.9.270·캐시 유지. 내비게이션 기준 원문68파일은 main 트리 Git blob 해시와 전부 일치하며, HANI_MAIN_BASELINE으로 제공했습니다. 기준 사본은 임시 폴더 hani-helper-bot-fix-main-e936f8a에 보관했습니다.

변경 파일: hani-ui-v02992.js, scripts/hani-helper-bot.test.mjs, docs/development-history/handoffs/2026-11-07-helper-bot-fix.md, 이 REPORT.md 및 같은 폴더의 검사 로그·verification.json·baseline-verification.json. CODEMAP에 helper 항목이 없어 기존 owner/전용 테스트로 확인했습니다.

저장·Cloud·schema·버전 변경 및 commit/push/merge/배포 없음. 다음: 브라우저 실행 가능한 환경에서 실제 로그인 Preview 확인. Notion 착수 갱신은 자동 승인 검토가 approval policy never로 거절하여 미반영·인수인계에 갱신 대기 기록.
