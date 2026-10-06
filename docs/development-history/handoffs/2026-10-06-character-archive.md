# M9 + MIR Character Archive

2026-10-06 KST / Codex / NORMAL read-only UI. 개발 및 Local Preview 승인만 있음. Production 자동 배포 금지.
Branch hani/character-archive-m9-mir / base 728b23402377edbe43cd06d8e52a39dce7da320b (코드 v2.9.190).
소유 경로: 기존 팀 renderTeam/renderTeamProfile 유지. 새 archive는 #characterArchive의 단일 renderer와 scoped click listener. 메뉴는 기존 showView/pageMeta/QUICK_JUMP_ITEMS 경로.
CODEMAP_MISS: Archive 항목 없음. 실제 앵커 확인. 기존 assets/profiles 9종 재사용. MIR image=null, 사람 fallback 없음.
첨부 Character Bible 원문을 static frozen Registry에 보존. 미정 연차/관계/성격 창작 없음. 수연 fullName은 Proposed 유지.
보호 storage/internal version/Cloud/schema/auth/기존 프로필 데이터 변경 없음. 표시 버전/cache tag 증가 없음.
완료: static/Canon/VM navigation, 격리 Chromium 1440/390, 실제 OS Archive↔AI 팀↔설정 targeted test PASS. 런타임 후보 45fac03.
증거: artifacts/character-archive/qa.json, integration-qa.json 및 PNG. 전체 로그인/Cloud/운영 데이터 회귀는 미검증.
보고서: docs/M9-MIR-CHARACTER-ARCHIVE-REPORT.md. Preview http://127.0.0.1:8806/.
최종 main 76d3bed: 검사 도구 2개만 변경. 운영 파일 겹침 없음. merge/rebase하지 않음. 탑승 시 최신 gate 재검증 필요.
상태: 대표 Preview 준비. 기능 브랜치 보존/탑승 대기이며 Production NOT DEPLOYED. 버전 증가는 Release Train 담당 범위.
후속: 퍼스널 컬러칩·담당 영역 그래픽·관계 프로필 조합 추가, MIR 고정 소개 중복 제거. data Registry/원문 변경 없음.
그래픽 v2: 원형 연결 맵, 성격 키워드 타일, Canon 대사 말풍선. 1440/390 및 기존 OS 메뉴 targeted regression 재검증 PASS. 변경은 동일 Preview 브랜치, 운영 배포 없음.
MIR 컴퓨터 디자인: 사람 이미지 없이 모니터 화면 속 빛 Core 및 AI ENTITY 표식. 대표님 요청 반영, 같은 targeted test 재검증 PASS. Release Train 탑승 대기 유지.
2026-10-07: 전체를 회사 아이돌 프로필 앨범으로 재디자인. 파스텔 Hero/아치형 프로필/포토카드/선택 상세 2단 그래픽/친근한 관계 소개/케미·직급 그래픽/말풍선 Gag. SUNGMIN 영문 표기 정정. Canon 원본 데이터 유지, UI 소개 카피만 명시 요청으로 개정.
기존 static + ui + integration 스크립트 1440/390 재검증 PASS. 별도 운영 PR/배포 없음. 최신 인계 후보는 동일 branch HEAD.
