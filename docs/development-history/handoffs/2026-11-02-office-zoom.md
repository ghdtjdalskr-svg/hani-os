# 캐릭터 말풍선 확대 · 작업 인수인계

## 작업 식별
- 작업 ID / 제목: office-zoom / 탭한 캐릭터 확대와 대기 방문객 상태 표시
- 갱신 시각(KST): 2026-11-02
- 담당 도구 / 검토 담당: Codex 단독 개발 / 후속 UI 검토 미정
- 상태: 구현 완료 / 실행·화면 검증 차단
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/office-zoom / office-zoom
- base SHA / candidate SHA: e2cd3fd322f3575f882b10c23ced336599761e6e / 미커밋
- 목표 / 완료 조건: 기존 말풍선의 persistent 확대 슬롯, 자동 말풍선 크기 유지, 방문객 대기 상태, 지정 테스트와 한국어 보고서
- 수정할 파일·범위: hani-office-live.js의 말풍선·라벨 owner, hani-office-live.css의 확대 슬롯, scripts/hani-office-zoom.test.mjs, 작업별 artifacts·인수인계
- 승인 근거 / 경계: ../office-zoom-task.md 전체 UTF-8 정상 확인. commit/push/merge·버전 증가·Notion·assets/data 수정 금지.

## 결과와 증거
- 기준선: worktree HEAD ref와 branch ref, origin/main 로컬 캐시 및 GitHub connector로 조회한 원격 main이 지정 e2cd3fd와 일치. 수정 전 JS blob 5957499bd25d544a8ff6504afc2a2afa67f7a936 / CSS blob f4350396bd86744140f690f9df98aa7bdd1b213f도 원격 기준 파일과 일치. index cache·표시 2.9.256 유지, 마지막 script는 hani-launch-greeting.js. 운영 화면·실제 로딩 미확인.
- CODEMAP: living-office owner는 유효하나 말풍선·라벨 최신 anchor가 없어 좁은 소스 검색으로 보완.
- 변경: 기존 bubble에 decorative persistent sprite 슬롯 하나, 현재 atlas/frame 복사, 96/120px 확대 전용 CSS, 지도 높이 제한. 자동·미로딩은 기존 작은 UI, 방문객 waiting 상태 및 휴대폰 상담/면접 대기 라벨. 기존 event·renderer·timer 경로 재사용.
- 검증: artifacts/office-zoom/verify.ps1 실행 성공. scheduler 전체·공개 snapshot·screenHomeClear/placeStatusLabels/fitStatusLabels 5구간 원본 바이트 동일. 기존 CSS 줄 변경·삭제 0, 확대 전용5줄 추가. timer/fetch 호출 수 동일, 저장/Cloud 토큰 없음.
- 환경: Git·Node 기본 PATH 검색 실패. 지정 설치 경로의 두 exe 직접 실행도 Access is denied. 최종 office 전체40파일 및 node --check2파일 실행 시도 전부 환경 차단. assertion·실행 출력·실화면·PNG 검증 없음. 새 테스트는 실행 가능한 환경에서 재검증 필요.
- 예상 기존 pin: obr8/15/21·consult·residents-source·office-labels-qa-source-delta(서윤 담당). 219 main 실패는 작업 지시에서 전달된 사실이며 이번 환경에서는 재현 못함. assertion·기존 테스트·fixture 수정0.
- 근거: artifacts/office-zoom/REPORT.md, test-results.json, syntax-results.json, preservation-results.json, file-hashes.json. 신규 테스트는 실제 CSS 브라우저 검사를 --browser 인자로 지원.
- 데이터·저장소·Cloud·schema 영향: 표시 계층만 변경. 보호 저장·계획·snapshot·라벨 geometry owner 보존.
- PR / Preview / 배포: 없음. main / Pages / 운영 read-back 미수행.

## 다음 담당에게
- 먼저 읽을 파일: artifacts/office-zoom/REPORT.md 및 신규 zoom 테스트.
- 다음 행동: Node 실행 가능한 환경에서 신규 및 office 전체40파일·구문 검사, 360/390/416/1280px 실제 브라우저 검사 수행. 기존 pin은 담당자가 재기준화. 추가 서버 설정·배포 순서 없음.
- blocker: Node/Git 실행 거부, 실제 브라우저 QA 미확인.
- CURRENT / DECISIONS / Notion: 다른 작업 기록 보존. 이번 작업의 명시적 Notion 수정 금지 준수.
