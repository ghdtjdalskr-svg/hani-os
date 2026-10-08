# M9 + MIR 앨범 B안 — 탑승 인수인계

## 작업 식별

- 2026-10-08 KST / Codex / NORMAL 읽기 전용 소개 UI.
- 대표님 승인: B안 미리보기 확인 후 “탑승대기까지 진행하자”. 운영 병합·배포 승인은 아님.
- 브랜치: `hani/character-archive-m9-mir`.
- 작업트리: `.worktrees/character-archive-m9-mir`.
- 원래 base: `728b23402377edbe43cd06d8e52a39dce7da320b`.
- 시작 시 확인 main: `691385cf11faa7906a0d27472d8e32884f2be1ea`.
- main 코드 표시 버전 v2.9.190, 마지막 script hani-goal-progress.js?v=2.9.190. 운영 HTTP/read-back을 의미하지 않음.
- main에는 PR218 초기 Archive 자료가 있고 이 브랜치의 후속 디자인 및 메뉴 연결은 아직 다름. 임의 merge/rebase 하지 않음.

## 통합 범위

- 실제 `hani-character-archive.js` / `.css` 소유 renderer에 승인 B안을 통합. 별도 JS/event layer 추가 없음.
- 9 M9 + MIR 10번째 동일 크기 카드, 회사 소개에서 승인한 미르 아바타 재사용. M9를 M10으로 바꾸지 않음.
- 큰 포토카드, 펼쳐 읽는 원문, 실제 공동 장면 유닛 화보 5개, 별도의 캐주얼 9인 엔딩 화보(비율 유지·잘림 없음).
- Boundary를 메모 카드로 표현. 기본 말버릇 유지하고 6명만 업무 관련 보조 메시지 추가. 역할 안내로 미정 연차 문구 대체, 연차 사실 창작 없음.
- 원본 frozen Registry/Canon 변경 없음. 원문 MIR의 역사적 시각 설정은 그대로이고 현재 아바타는 대표님의 후속 명시 요청에 따른 표시 변경.
- 원래 브랜치의 메뉴 연결: index.html의 nav/view/CSS+script 3개, hani-main.js의 pageMeta/QUICK_JUMP_ITEMS. 최신 main의 해당 파일 전체를 이 브랜치 파일로 교체하지 말고 이 연결만 적용.
- assets/character-archive의 기존 group portrait와 추가 PNG 7개 모두 함께 포함. 미리보기 artifacts의 variants-render.js/variants.css는 운영에서 사용하지 않음.
- 글씨체는 설치된 휴먼편지체/HCR Batang 우선, 미설치 환경은 기본 폰트. 폰트 파일 배포 없음.

## 검증

실제 통합 파일 대상으로 다음을 실행함:

1. `node --check hani-character-archive.js` — PASS.
2. `node scripts/hani-character-archive.test.cjs` — PASS. 원문/직급/고정 데이터/읽기 전용/기존 메뉴 VM 경로.
3. `node scripts/hani-character-archive-ui.test.cjs` — PASS. 격리 Chromium 1440/390, 10명 선택·포커스·펼침, 10개 프로필 로딩, 미르 10번 및 카드 크기, 유닛 4장+창립+엔딩 실제 decode/비율, 서로 다른 hero/ending, 6개 보조 대사, 메모10, 가로 넘침 없음.
4. `node scripts/hani-character-archive-integration.test.cjs` — PASS. 실제 OS의 빈 임시 브라우저에서 Archive↔AI팀↔설정, 기존 AI 팀9명 유지, state/localStorage 변화 없음, JS 오류 없음. 외부 요청 차단, 운영 로그인/데이터 사용 없음.
5. `git diff --check` — PASS.

증거: `artifacts/character-archive/qa.json`, `integration-qa.json`, `1440-grid.png`, `390-grid.png`, `1440-ending.png`. 개발자가 실제 스크린샷 확인했으며 별도 독립 Arin/HINA 검수로 표시하지 않음.

## 안전 및 미검증

- 보호 storage/internal version/Cloud write/schema/auth/release tooling 변경 없음. 서버 함수·설정 배포 불필요.
- 표시 버전/cache tag 올리지 않음. Release Train 담당이 후보에서 한 번 증가.
- 실제 인증 OS 전체 회귀, 최신 main 통합 후 QA, One-Pass, 독립 UI 검수, 서버 HINA, Production read-back은 미수행.
- 최신 main에서 구조 충돌 시 파일 전체 덮어쓰기 금지. 기능 충돌은 이 작업 담당에게 반환.
- 추가 PNG 원본으로 용량 증가. 최종 열차 package 용량 gate는 미검증이며 기존 제한 우회 금지.
- Notion HANI-27의 이전 PR219/v191 기록은 이번 완성본의 배포 근거 아님. 이전 외부 전송 차단을 우회하지 않고 요약·SHA·링크 공유 승인을 요청한 상태.

## 다음 담당

- 배포 담당은 최신 main 위에서 이 기능 범위만 통합하고 위 3개 targeted test 재실행 후 열차 후보 gate 수행.
- Production merge/Pages/표시 버전/최신 JS/기능 read-back: 모두 이번 요청 범위 밖, 미수행.
- 다른 작업의 기록/브랜치/PR은 수정하지 않음. 별도 운영 PR 생성하지 않음.
