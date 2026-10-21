# remote224 병합 후 상단 픽셀 검사 조사

## 작업 식별

- 갱신 날짜(KST): 2026-10-21
- 담당: 도연(Codex), 실제 Edge 재검증 담당: 서윤
- 상태: sampler 보강 / Node 검증 완료, 실제 6실패 원인 및 조합 확인 대기. 해결 완료 판정 아님.
- 저장소 / branch: hani-os / `hani/office-hd`
- 시작 HEAD: `8a51c007659ad76d8e001a59aa8acef106035652`
- 로컬 origin/main: `331291eb29ec73b2cd5ca3f07eb2d02436e9d1ea` (main 2.9.223 포함). `git ls-remote origin refs/heads/main`은 네트워크 연결 실패. merge/rebase 없음.
- 목표: 사용자 보고 6개 view/theme/width 실패의 원인을 확인하고 상단 무감광 기준을 유지하여 수정. Node 검증 후 커밋 시도; 차단되면 미커밋 보존.
- 수정 범위: `scripts/hani-remote-card-224.test.mjs` 및 필요한 sampler 보조 코드/검증, 이 인수인계. 실제 source 결함 확인 시 canonical owner만 최소 수정.
- 승인 경계: 버전/cache·storage·Cloud 변경, main 병합/배포 없음. 다른 담당의 기존 산출물 변경 보존.

## 조사 근거

- CODEMAP_MISS: dev-center/codemap.json에 remote media owner 없음. 실제 owner `hani-context-remote.css`, `hani-context-remote-v1.js`의 persistent media DOM, updateBanner, 단일 click 경로를 확인.
- `09ef317` → `9ed9847` merge에서 remote CSS/JS 변경 없음. 높이 410/204px, filter:none, gradient 첫 stop 55% 그대로.
- 로컬 `artifacts/remote-card-224/after.json`은 현재 sourceHashes 4파일과 일치하는 132 PASS / errors 0 / upper maxDelta 0. `summary.json`의 index/main hash는 병합 전 것으로 서로 다른 identity. 이 기록만으로 사용자 보고 6실패를 부정하거나 새 실행 PASS로 간주하지 않음.
- 실제 Edge 재시도: `HANI_REMOTE_CARD_OUTPUT=artifacts/remote-card-224-sampling node scripts/hani-remote-card-224.test.mjs` → browserType.launch spawn EPERM / 0 cases. 기존 report/PNG는 덮어쓰지 않음.
- Notion 현황판 읽기 성공. 진행 요약 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never`로 거절되어 갱신 대기. 사용자에게 사유 보고함.

## 다음 담당에게

- 실패 원문/재현 근거와 실제 source 및 sampler를 대조. 실행하지 않은 browser 검사는 PASS로 기록하지 않음.

## 변경·검증 인계

- 변경 파일: `scripts/hani-remote-card-224.test.mjs`와 이 문서만. 운영 CSS/JS/index·버전/cache·저장·Cloud·schema 변경 없음.
- sampler가 칩/본문 부모뿐 아니라 **보이는 모든 자식의 실제 client rect**도 제외. 폰트 준비 후 좌표를 읽고 대조 캡처 전후 image src/currentSrc/natural size/complete·이미지 영역·overlay rect·gradient가 같은지 검증한다. 변경되면 통과시키지 않고 명시적 실패로 남긴다.
- 기존 고정 상단 범위(`12 <= y < floor(imageHeight*.54)`)와 `maxDelta <= 1`, 휘도비 `>= .98`, top/left/right 샘플 조건은 유지. gradient의 실제 시작을 따라 검사 범위를 줄이거나 차이 난 픽셀을 제외하지 않는다.
- 기본 브라우저 검사는 첫 실패에서 중단하지 않고 전체 조합을 검사하여 `failedCases`와 케이스별 failure를 남긴다. 최종 오류 검사는 그대로 FAIL/exit1이며 실패를 PASS로 바꾸지 않는다. test SHA도 report에 추가.
- Node 합성 이미지 회귀: 부모 위에 그려진 제목 받침을 부모 rect만 제외하면 delta71로 오탐; 자식 rect도 제외하면 delta0. 별도 상단·좌우 가장자리·gradient 직전의 실제 감광은 delta71로 계속 검출. **이 합성 fixture는 사용자 보고 6개 실제 조합의 재현 증거가 아니다.**
- 실행 PASS(exit0): `node scripts/hani-remote-card-224.test.mjs --node-only` (기존 palette/owner, focal/reset5경로, persistent25·write0 + sampler 회귀), `node scripts/hani-context-remote-ui.test.mjs --node-only`, `node --check scripts/hani-remote-card-224.test.mjs`, 관련 `git diff --check`.
- 미검증: 실제 Edge 수정 후 pixel/AA/layout/controls. 기존 Edge 시도는 spawn EPERM/0case이므로 새 browser PASS 없음. main 병합·Pages·Production read-back·Candidate build/One-Pass/HINA는 범위 밖 N/A.
- 정확한 실패 목록: 사용자 메시지로 확인 가능한 조합은 **1440/light/investmentIntake 1개뿐**이다. 나머지5개 및 각 실제 원인은 아직 확인 불가. 저장된 after.json에는132 PASS/최대delta0이고(수정 전 스크립트로 2026-10-21 15:00:07 KST 저장), 보고된6실패 원문이 없다. 사용자에게 원문 경로를 비동기 문의했으며 응답 대기. 추측한 view/theme/width를 실제 목록으로 쓰지 않는다.
- Git: 명시한 두 파일만 `git add -- ...` 시도 → 공용 gitdir index.lock Permission denied(exit128). `git commit --only ...` 시도도 tracked test에서 동일 index.lock 거절(exit128). **미커밋·미push**, 기존 타 담당 변경/산출물 stage·수정 없음. 신규 문서는 stage 실패로 commit pathspec에도 등록되지 않음.
- Notion 갱신 대기: 이 절의 변경·Node PASS·6실패 미확정·Edge/Git 차단·다음 실행 내용을 기존 현황판에 추가해야 함. append가 자동 승인 검토의 never 정책으로 거절되어 저장/read-back 미완료.

서윤의 다음 실행(기존 결과를 덮어쓰지 않는 별도 output):

```powershell
$env:HANI_REMOTE_CARD_OUTPUT='artifacts/remote-card-224-sampling-edge'
node scripts/hani-remote-card-224.test.mjs
```

`after.json.failedCases`에서 전체 width/theme/view 목록을 읽고, 각 실패의 `imagePixels.band`, `excludedRects`, `worst`, `source`, `imageRect`, `scrim`과 geometry를 대조한다. 기존6실패 원문이 있으면 함께 보존할 것. overlay 배제 후에도 동일 상단 픽셀이 어두우면 source의 실제 결함을 해결해야 하며 이 보강만으로 해결 완료를 선언하지 않는다.
