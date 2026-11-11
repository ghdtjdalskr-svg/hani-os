# 테마별 글자색 안 보임 수정 (2.9.291 예정)

1. 회장님이 보신 퀴즈 보기·「이의제기 / 재채점」 글자가 안 보이던 원인은 **어두운 마감(티타늄 그래파이트·미드나이트 블랙)**이에요. 글자는 밝게 바뀌는데 보기 칸 배경은 밝은색으로 남아 대비가 **1.05:1**이었어요.
2. 퀴즈 칸 배경·글자가 테마 토큰을 함께 따라가도록 고쳐서, 마감 6 × 계절 4 × PC·폰 48조합 전부 **4.5:1 이상**이 됐어요(시험 52/52).
3. 어두운 마감으로 앱 전체 화면을 자동 측정해 대비 2:1 미만을 찾았고, 실제 문제는 3곳이었어요: 미룬 일 제목, 배포센터 「Release Queue」 제목, 본사 빌딩 층 안내 문구.
4. 나머지 측정 항목은 그림 배경 위 흰 카드·밝은 알약 칸 안 글자·이모지 등으로 실제 화면에서 잘 보임을 확인했어요(위시리스트 숫자, 회사 소개 문구).
5. 밝은 테마와 저장 데이터는 건드리지 않았어요. CSS 한 파일 끝에 규칙 묶음만 추가했어요.

## 원인
- `hani-design-system.css`의 퀴즈 시트(`.study-exam-sheet .study-choice`)가 고정 밝은 배경을 쓰는데, 어두운 마감에서 상속 글자색(`--text-primary`)은 밝은색이 된다. 채점 후 보기는 `input:disabled`이라 흐림까지 겹친다.
- 재현: 원래 CSS(7769fbe)로 같은 Edge 시험을 돌리면 titanium-graphite·midnight-black 16조합이 실패(예: 정답 보기 글자 rgb(241,240,237) / 배경 rgb(237,249,242), 1.05:1).

## 수정 (hani-design-system.css 끝)
- 퀴즈: `.study-exam-sheet`·`.study-question`·`.study-choice`(정답/오답/disabled)·`.study-dispute`·오답노트·재도전 카드에 `--text-primary/--text-secondary/--surface-*` 토큰 적용. 정답 초록·오답 빨강은 색을 섞어 유지.
- 어두운 마감 한정(`:root:is([data-finish="midnight-black"],[data-finish="titanium-graphite"])`): `#procrastinationTitle`, `#deployTechnicalDetails .deploy-hero-top h4`, `#haniOfficeLive .hani-building-rooms p`.

## 시험
- `scripts/hani-theme-contrast.test.mjs` (preload 없이): 52/52 PASS — exact inverse, legacy-289 층, 토큰 모델, 실제 Edge 48조합.
- `scripts/hani-theme-contrast-preload.cjs`를 붙여 기존 시험 실행: office 72/73(219 원래 실패), M9 15/15, save-guard, release-version-layers, newsroom-4cut-288/230/285-source, study-retry, procrastination-board, wishlist-quick-add, history-226, server-owner-guard, life-bundle-source, board, egress-fix 통과.
- 원래부터 실패(main 7769fbe에서도 실패): pb-chibitoon, brand-heroes-218, dash-218, fun-top3, hero-restore, ilbo-213, invest-split-ui, investment-research-ui, mascots-poster, nav-groups, owner-verification-ui, qa-210, qa-design-b4, qa-report-fixes, remote-media-219, reviewed-release-baseline, simplify-225, theme-white-215, ui-203b.
- 어두운 마감 전체 화면 측정: 서윤 scratchpad `darkaudit.cjs` (반투명 배경 합성, 이모지 제외, 대비 2:1 미만).

## 미검증
- 밝은 마감에서 2~3:1 수준의 흐린 장식 글씨(입력칸 안내, 작은 영문 라벨 등)는 「안 보임」이 아니라 이번 범위에서 제외 — 전체 점검 탭 결과와 함께 다음에 다듬기.
- 실제 휴대폰 화면은 회장님 미리보기로 확인 필요.
