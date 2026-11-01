# 모찌 아트·조직도 후속 (qa-b11b)

## 작업 식별

- 갱신 시각(KST): 2026-11-02
- 담당 도구 / 검토 담당: Codex 단독 개발·자동 검사, 브라우저 사용 금지.
- 상태: 구현·지정 targeted test 완료, 로컬 아트·UI 검토 대기. 미커밋.
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/mascots-poster / qa-b11
- base SHA / candidate SHA: 현재 로컬 HEAD `39cb3c7c2b5b50d2b6ccf63307e2e938bb26ed5b` / 미커밋. 과거 치즈·크림 작업 base `1f03c98`은 기존 인수인계에 보존.
- 기준선: Git subprocess 금지. `.git` 포인터와 로컬 ref를 파일로 읽어 branch 확인. origin/main 캐시 `9eae97cce55169893e8b089071d08fed466ef2a4`는 HEAD와 다름. 원격 최신성·통합 영향 미검증, merge/rebase 없음. 표시 2.9.257 유지.
- 목표 / 완료 조건: 모찌 480×288 좌우 10포즈 atlas, 720/256/128 초상화, 치즈·크림 및 실제 로비 크기 비교, 기존 사내 마스코트 세 번째 카드, 직원19명 유지, 지정 Node 검사.
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: hani-organization-hub.js/.css, scripts/hani-mascots-poster.test.mjs, 모찌 프로필3개, artifacts/office-pets-npc/pet-rabbit.webp, artifacts/mascots-poster/mochi* 및 기록. hani-office-live.*와 manifest는 수정하지 않음.
- 사용자 승인 근거 / 승인되지 않은 경계: `../qa-b11b-task.md` 전체 UTF-8 정상 판독. 모찌 이름 승인·하니 전무 디자인 설정. commit/push/버전 변경 금지, browser/Git 차단. 배포·저장·Cloud·schema 변경 권한 없음.
- CODEMAP_MISS: codemap에 조직도 owner 없음. 실제 기존 #ogh-chart 안 정적 마스코트 markup·CSS image-set과 테스트 owner 확인. 기존 DOM/event/renderer 경로 사용.

## 결과와 증거

- 변경한 내용 / 파일:
  - `hani-organization-hub.js`: 기존 사내 마스코트 섹션에 비대화형 모찌 카드 추가. 이름·사내 토끼·성격 한 줄·대체 설명, 소개 문구를 「함께 지내는 친구들을 소개합니다.」로 변경. 직원·클릭·탭·renderer 로직 보존.
  - `hani-organization-hub.css`: 기존 responsive grid를 그대로 사용, 모찌의 720/256/128 image-set 규칙 한 줄만 추가.
  - 내장 image_gen 생성2건. 고양이·강아지 atlas, 실제 `floor-1f-217.webp`, `../qa-b7/artifacts/office-pets-npc/lineup.png`를 스프라이트 스타일 참고로 전달. 초상화는 생성된 모찌 원화와 치즈·크림 프로필을 참고. 하니 전무 디자인 설정·흰색/아이보리·회분홍 귀·작은 분홍 리본·조용한 관찰자 성격 반영.
  - 스프라이트를 **먼저** `artifacts/office-pets-npc/pet-rabbit.webp`에 저장. 5열×2행 / 96×144 셀 / 첫 행 왼쪽·둘째 행 오른쪽. 앉기·서기·홉A·홉B·잠자기, pivot(48,135), 생성된 반투명 그림자 보존. 오른쪽은 왼쪽 프레임을 반전해 일관성 유지. 홉A/B는 향후 walk-a/b 대응용. runtime atlas·manifest에 추가하지 않음.
  - Node/Sharp는 crop·축소·좌우 반전·인코딩·비교 합성에만 사용. 새 그림을 코드로 그리지 않음. 프롬프트 전문 `sprite-prompt.txt`, `portrait-prompt.txt`; 원화 `sprite-source.png`, `portrait-source.png`; 프레임·참고·크기·소스 SHA는 `sprite-evidence.json`.
  - 비교 PNG: 실제 로비 1200px / 셀82px, 휴대폰 로비390px / 최소 셀40px에 치즈·크림·모찌를 나란히 합성. 기존 `max(40px,6.8cqw)` 계산 사용. 별도로 128px 초상화3개와 96×144 원본 포즈5개 표시. 흰 토끼 윤곽·회분홍 귀·리본·그림자 육안 확인. 실제 앱 캡처가 아닌 정적 아트 합성.
  - `scripts/hani-mascots-poster.test.mjs` 확장: 세 카드 실제 owner 실행·모찌 집계/투표 제외, 아틀라스 실제 decode/alpha·10프레임 containment·좌우 alpha mirror·두 홉 차이·반투명 그림자, 로비 비교 픽셀과 CSS 크기 재현, profile/closure 검사.
- 실행한 검증: **지정 테스트2명령 성공 / 0실패, assertion 21통과 / 0실패 / 0skip. syntax 6통과 / 0실패, 보존15통과 / 0실패.** 작업 전 해시·owner 원문·closure와 모든 로그는 `artifacts/mascots-poster/mochi/`.
  - `node --check` 6파일 PASS: hub, 전용 test, capture-baseline, prepare-sprite, prepare-profile-compare, verify-preservation. `syntax-results.json`.
  - `node scripts/hani-mascots-poster.test.mjs`: **9/9 PASS**, `mascots-poster.log`.
  - `node scripts/hani-qa-easy-cleanup.test.mjs`: **12/12 PASS**, `hani-qa-easy-cleanup.log`. 기존 테스트 제목의 128은 오래된 문구이며 실제 코드는 현 gate 상한160을 검사, 제목 변경은 범위 밖.
  - `node artifacts/mascots-poster/mochi/verify-preservation.mjs`: **15/15 PASS**, `preservation.json`/`.log`. hub의 새 카드·문구를 제거하면 착수 원문과 byte 동일, CSS는 한 규칙만 추가. index/main/board/library/office-live 두 파일/manifest/cat·dog atlas/실제1F floor SHA256 전부 보존.
  - closure **142→145 / 160**, 누락0·제거0·추가3개(모찌 프로필만), 총16,339,773B. rabbit/검토 PNG는 closure 미포함. package build 증거가 아닌 정적 closure 검사.
- 실행하지 않은 검증 / 남은 위험: 실제 browser·모바일·운영·원격 main·최종 release gate 미검증.
- 데이터·저장소·Cloud·schema 영향: 없음. 기존 직원19명·roster·vote·집계·저장/Cloud·내부 baseline·버전/cache·index 보존. 새 DOM/event/renderer/write/fetch layer 없음.
- PR / Preview / 배포 원문 링크: 없음. 로컬 아트 검토본.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 실행하지 않음. index 마지막 runtime은 기존 hani-ai-budget.js?v=2.9.257.
- Notion: 기존 작업 페이지 읽기 성공. 착수 append는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절. 갱신 대기: 모찌 목적·범위·HEAD·지정21/21·syntax6/6·보존15/15·closure145/160·이미지5개 경로/크기·로컬 검토 대기·다음 행동. 저장·읽기 완료로 보고하지 않으며 같은 거절을 우회하지 않음.

### 이미지 경로·크기

| 경로 | 픽셀 | 바이트 |
|---|---:|---:|
| `artifacts/office-pets-npc/pet-rabbit.webp` | 480×288 | 32,442 |
| `assets/profiles/hani-profile-mochi.webp` | 720×720 | 77,758 |
| `assets/profiles/thumb/hani-profile-mochi-256.webp` | 256×256 | 13,992 |
| `assets/profiles/thumb/hani-profile-mochi-128.webp` | 128×128 | 4,424 |
| `artifacts/mascots-poster/mochi-compare.png` | 1200×1220 | 2,013,204 |

위 표는 `image-sizes.json`과 일치. 생성 원본도 workspace에 보존. 모찌 sprite를 assets/sprites-v3에 배치하거나 manifest에 연결하는 작업은 수행하지 않음.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: 위 조직도 owner와 전용 테스트, 이전 치즈·크림 인수인계.
- 다음 한 가지 행동: 허용 환경에서 조직도 PC/휴대폰 실화면과 비교판 검토. 대표님 후속 지시 전 commit/push/PR/열차 통합 없음. 모찌 runtime sprite 연결은 별도 manifest PR에서 담당.
- blocker / 필요한 사용자 결정: Git·브라우저 사용 금지, Notion 기록 대기. sprite 런타임 연결·manifest는 별도 PR.
- 다른 작업에 영향을 주는 사항: qa-b7 lineup은 읽기 전용 스타일 참고. 다른 worktree 파일 미수정.
- CURRENT / DECISIONS 갱신 내용: CURRENT에 모찌 구현·검사·closure·브라우저 미검증·Notion 대기 요약 추가. 이전 치즈·크림 인수인계에 후속 링크 추가. 새 승인·결정 없음, DECISIONS 미수정.
