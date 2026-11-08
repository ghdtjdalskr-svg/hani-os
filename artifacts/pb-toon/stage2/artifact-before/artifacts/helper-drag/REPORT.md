# 도움봇 확대·드래그·위치 기억 인수인계

## 작업 식별
- 2026-11-07 KST / Codex / 구현·검증 완료, commit 환경 차단.
- worktree `helper-drag`, branch `hani/helper-drag`, base `430d254eff90e04a21b6205fed69a2df44a67ac9` (fun-chat-fortune 위).
- 승인 근거: `../helper-drag-task.md` 전체 UTF-8 정상 확인. 위치 키 저장 승인, commit 요청. push·merge·버전 변경 금지 유지.
- 원격 main은 GitHub 조회 `143c3e5f1901f9cbcfc59dc867bb9e4fc3ac5984`로 로컬 캐시와 일치. 지정 base와 다른 main을 합치거나 rebase하지 않음. CODEMAP_MISS(도움봇 항목 없음) 후 실제 owner 확인.

## 결과와 증거
- 런타임 변경: `hani-ui-v02992.js` 도움봇 블록·`hani-style-08.css` 해당 스타일만. PC 90px(기존 56px의 1.61배), 폰 78px(1.39배), PC 도움말 16px.
- 기존 단일 pointer 경로에서 6px 기준 드래그·마우스/터치 capture·클릭 중복 차단·화면 clamp·resize 재배치. 사용자가 정한 위치 우선, 패널은 안쪽 위/아래 공간에 열림.
- `hani_helper_pos_v1`만 getItem/setItem+try/catch. 드래그 완료 때 1회 저장, 잘못된 값 무시. “제자리로”는 `{x:1,y:1,v:1}` 기본 슬롯 표식으로 덮어씀. remove/clear 없음.
- 기존 이미지 해상도: ensemble 1600×1000, 두 직원 atlas 1152×1536, 펫 256×256. 확대 얼굴 23개 비교 PNG와 PC/폰 패널 직접 시각 확인. [해상도](image-resolution.json).
- 기존 전용 시험 2파일 보강. 상위 작업의 누락된 closure 기준은 `../fun-chat/artifacts/fun-chat-fortune/baseline-runtime-files.json` 원본을 이 폴더에 복사했고 실제 Git base와 독립 대조.
- Node: `node --check hani-ui-v02992.js`; `node --test --test-reporter=tap scripts/hani-helper-bot.test.mjs scripts/hani-fun-chat-fortune.test.mjs` → **32 PASS / 0 FAIL / 2 SKIP**. SKIP은 기존 선택 실행 브라우저 묶음. [로그](targeted.log).
- Edge: 지정 Playwright 모듈로 `node artifacts/helper-drag/browser-check.mjs <playwright/index.mjs> <msedge.exe>` → **1280×900 마우스·390×844 실제 touch 모두 PASS**, 기본 크기·이동 후 재로드·탭 열기·clamp·320×500 resize·기본 복귀 재로드·패널 화면 경계, pageerror 0. 요청한 body class 제거·loginGate 숨김으로 로컬 우회. [결과](browser-results.json), `1280/390-default.png`, `*-dragged.png`, `*-reloaded-open.png`, `*-all-faces.png`.
- `node artifacts/helper-drag/verify-scope.mjs` → **PASS**. 실제 base Git object와 비교: 도움봇 밖 JS·다른 CSS·index/main/office/조직도 원문 보존, 보호 저장·Cloud·schema 경로 미변경, 버전/cache **2.9.272 유지**, runtime closure **158→158/160, 누락 0**. main의 159개와 지정 branch의 158개를 구분함. [근거](scope-results.json).

## 다음 담당에게
- **commit 미실행**: Git이 PATH에 없고 GitHubDesktop 경로 접근 거부. 이 worktree의 Git metadata는 쓰기 허용 범위 밖 `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/helper-drag`에 있으며 읽기만 허용됨. 경계를 우회하지 않고 모든 변경·증거를 현재 worktree에 보존.
- 다음 행동: Git 쓰기가 허용된 환경의 담당자가 위 2개 런타임·기존 시험 2파일·`artifacts/helper-drag/`를 검토해 `feat: enlarge and drag helper with remembered position`로 로컬 commit. push·merge·버전 변경 없음.
- Notion 읽기는 성공했으나 착수 append는 자동 승인 검토가 `approval policy is never`로 거절. 최종 요약도 **갱신 대기**: 이 보고서의 구현·32 PASS·Edge 2조건·commit 차단·배포 미실행 내용을 현황판에 반영해야 함. CURRENT/DECISIONS 변경 없음.
- 최종 열차 Candidate/HINA·독립 Arin·실제 로그인/Android·Production read-back은 미실행. main/Pages/운영 완료 아님. 다음 배포 담당 검증·대표님 승인 경계 유지.
