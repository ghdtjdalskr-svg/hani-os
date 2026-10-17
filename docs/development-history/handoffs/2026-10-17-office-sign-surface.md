# office-v2-215 · 2F 팀 협업실 간판 면 정렬

## 작업 식별

- 날짜(KST): 2026-10-17 / 담당: 도연(Codex), 단독 개발·자동 검사.
- 상태: 구현·targeted 검증 완료, Git index 권한 차단으로 미커밋. LIGHT, HTML 간판 배치 metadata만 최소 수정.
- 저장소 / branch: ghdtjdalskr-svg/hani-os / hani/office-v2-215 / 이 worktree.
- base HEAD: 2f536c819a5f31145cd16b543d48dce76b5db603.
- 시작 기준: Git CLI 원격 연결 실패 후 GitHub API main f03677f77ca33233330f250200351fb6f6891d6c 확인, local origin/main과 일치. merge/rebase 없음. source 표시/cache v2.9.214, 마지막 UI hani-ai-budget.js. 운영 실제 로딩은 이번 범위 N/A.
- 목표: 팀 협업실 글자를 원화 간판 면 안에 배치하고 기존 테스트 그대로 390/1440 light/dark 전 층 통과.
- 수정 범위: data/hani-building/art-map-v1.json의 2F team_meeting 간판 좌표·크기, 본 인수인계. 다른 담당의 기존 artifacts 변경 보존.
- 대표님 승인: 간판 수정·전 층 검사·commit 시도. 버전 증가·storage/Cloud·main merge·배포 승인 없음.
- Scoped discovery: CODEMAP living-office owner 확인. 개별 sign metadata anchor는 CODEMAP_MISS로 실제 plates 생성 → entry 좌표/nativeFont → 기존 CSS/native painted foreground 경로 확인. 새 DOM/event/renderer 없음.

## 결과와 증거

- 기존 명령 재현: hani-office-v2-215.test.mjs --browser <Playwright> <Edge> --final-polish → 17 PASS / 1 FAIL, 1440/2f 팀 협업실 painted surface. artifacts/office-v1art-215/sign-surface-before.log.
- 환경: 기존 dependencies Node24 / Playwright / 실제 Edge headless, 격리 clock·mock 외부 요청. 실제 생활 원본·계정 미사용.
- Notion HANI-66 fetch 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 최종 결과 포함 갱신 대기.

### 최종 변경·검증

- 변경은 art-map의 2F team_meeting 두 값뿐: nativeFont 25 → 22, y 44.58023379383634 → 44.63336875664187(원화 기준 아래 0.5px). 기존 x/width/skew/surface와 renderer/CSS/테스트 assertion은 그대로다. 다른 모든 JSON 바이트와 mixed EOL 동일.
- 최종 명령: `<deps>/node/bin/node.exe scripts/hani-office-v2-215.test.mjs --browser <deps>/node/node_modules/playwright/index.mjs <Edge.exe> --final-polish` → **18/18 PASS, fail0/skip0**. engine6 import 포함이므로 중복 합산하지 않는다.
- 390/1440 × light/dark × 5층 = 20개 화면, 표시 간판 46건이 기존 onSurface·대비·겹침·잘림 검사 모두 통과. 기존 숨김 정책을 변경하지 않았으며, 390의 작은 간판 글자는 숨겨지고 읽을 수 있는 방 목록은 유지된다. 숨겨진 글자에 대한 면 검사 PASS 주장은 하지 않는다.
- 팀 협업실 1440 light/dark 실제 잉크 native bounds: [1041.4505, 409.2302, 1133.2379, 430.1826], painted face [1017, 408, 1159, 431]. 위 1.2302px / 아래 0.8174px 여유로 테스트의 1px 허용 오차 없이도 완전히 내부. 대비 9.7456.
- 기존 decode 실패/빠른 층 전환/foreground 재사용/DOM persistent/좌석·모션/보호 원문·사무실 storage write0 경로도 같은 최종 실행에서 통과. 콘솔·page 오류0.
- 별도 evidence audit: `node artifacts/office-v1art-215/sign-surface-audit.mjs` PASS. 원본·patch 9개 및 JS/CSS/index/계약/테스트 총14파일을 기준 HEAD와 byte-identical 확인. 2F background 238832B, sign patch 45792B. 모든 원화·패치 240000B 이하이며 변경 밖뿐 아니라 이미지 전체가 동일하다.
- 실제 화면 확인: 최종 1440 light/dark 2F 및 390 light 2F PNG를 직접 열어 간판·방 목록 확인. 자동 검사 담당 도연의 시각 확인이며 독립 아린 리뷰로 부르지 않는다.
- 증거: artifacts/office-v1art-215/sign-surface-before.log, sign-surface-after.log, browser-status.json, sign-surface-audit.json 및 390/1440-light/dark-층별 PNG. artifacts는 기존 ignore 정책 유지.
- 최종 art-map SHA256: 838e0b5b4caa9a26a83a602cd3defb6519feab4c78dbe577143a4e7d31bbfc7b.
- `git -c core.whitespace=cr-at-eol diff --check -- <수정 파일>` PASS. scoped `git add`는 `.git/worktrees/ov215/index.lock: Permission denied`로 exit128. commit 단계도 아래 동일 경로로 시도하며 우회·권한 상승하지 않는다. 미커밋·미push·PR/main/배포 없음, HEAD 2f536c8 유지.
- storage/Cloud/auth/schema/서버 설정/Edge Function/버전/cache 변경0. 데이터 backup/migration 필요 없음. 실제 계정·Android·독립 아린/HINA·열차·운영 검증은 이번 범위 밖이며 PASS로 표시하지 않는다.
- Notion 결과 기록 대기: HANI-66에 위 수정·18/18·전 층46건·이미지 byte 불변·Git blocker·다음 Preview/열차 인계 요약을 append해야 한다. 착수에서 실제 자동 승인 검토가 거절한 동일 쓰기를 반복하지 않음.
- 실제 commit 시도 결과: 신규 인수인계 포함 `commit --only`는 앞선 add 실패로 untracked pathspec을 인식하지 못해 exit1. 추적 중인 art-map만 지정한 commit 재시도도 index.lock 권한 거부로 실패. 요청대로 두 파일 모두 미커밋으로 보존.

## 다음 담당에게

- 먼저 읽을 파일: 이 인수인계, art-map-v1.json의 team_meeting, sign-surface-audit.json.
- 다음 한 가지 행동: Git 메타데이터 쓰기가 가능한 환경에서 위 두 변경 파일만 commit 후 대표님 Preview·서윤 열차 인계. 서버 동반 배포 없음. 새 사용자 결정은 필요하지 않음.
- Preview·독립 아린/HINA·열차/Production은 별도 경계. 이번 자동 검사는 독립 리뷰가 아님.
- CURRENT/DECISIONS와 다른 담당 파일은 변경하지 않음.
