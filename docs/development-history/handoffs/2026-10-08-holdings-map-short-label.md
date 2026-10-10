# Holdings map short ETF labels

- Date: 2026-10-08 KST. User requested removing ETF brand names from cramped map boxes.
- Branch: `hani/holdings-map-short-label-20261008`. Base and remote main confirmed at `691385cf11faa7906a0d27472d8e32884f2be1ea`.
- Baseline display version: `2.9.190`; final UI script: `hani-goal-progress.js?v=2.9.190`. Market view script: `hani-asset-market-view.js?v=2.9.174`.
- Only treemap visible labels remove recognized leading ETF brands with a whitespace boundary, case-insensitively. Unknown prefixes, brand-only names and ordinary stocks retain their names. Tooltip, holdings table, mobile bars, allocation, source names and calculations remain unchanged.
- Changed runtime owner: Phase B in `hani-asset-market-view.js`. No renderer/event layer added, no write/storage/auth/Cloud/schema changes. No version or cache bump: train preparation only.
- Preview: `docs/preview/hani-holdings-map-labels.html`, synthetic records only; opens directly as a local HTML file.
- Validation: `node --check hani-asset-market-view.js`, `git diff --check`, and browser test `scripts/hani-holdings-map-label-test.cjs` PASS. Desktop 1280x1000 and mobile 390x844 screenshots inspected; map label/tooltip/table/mobile checks, prefix boundary, source unchanged, no storage writes/network fetches, mobile overflow and page errors checked.
- Browser test uses bundled Playwright via NODE_PATH and installed Chrome. Screenshots under `artifacts/holdings-map-labels/` are local evidence, excluded from commit.
- Runtime release QA/version increment: deferred to the approved release train candidate. No production PR, main merge or deployment.
