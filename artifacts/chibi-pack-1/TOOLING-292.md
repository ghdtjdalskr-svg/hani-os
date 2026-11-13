# 치비 1탄 시험 층 정리 · 2026-11-13 · 도연 / Codex

**시험 도구 정리 완료, Git·Edge 검증은 서윤 인계.** 운영 504파일 이번 작업 변경 0, 기존 frozen fixture 106개 변경 0, 기존 단언·수치·핀 보존. Git 명령·Edge·버전 변경·commit/push/merge·배포 없음.

## 기준과 변경 파일

- branch `hani/chibi-pack-1`, 착수 HEAD `4a281931d8b658e91749a0590bd08ba7ed6b8ce6`, 로컬 origin/main `a8b1a096f1c6ffae9fcbe2e799958da75b1af1ae`. Git 명령 없이 ref와 검증된 로컬 객체만 읽음. 원격 최신성 미확인.
- 전달문에는 291로 적혀 있으나 **실제 a8b1a09에는 이미 292 버전/연혁과 사무실 탭 말풍선 수정이 포함**되어 있음. 로컬 표시·cache `2.9.292`, UI 선언 `hani-ui-v02992.js?v=2.9.292` 보존. 실제 운영 로딩 확인은 미실행.
- 수정: `scripts/hani-chibi-pack-1-{source,preload}.cjs`, `.test.mjs`, `scripts/fixtures/release-version-layers.json`의 **292 행 추가만**.
- 기본 실행 연결만 추가: `scripts/hani-{release-version-layers,save-guard,join-ieum,newsroom-285-source,life-bundle-source,qa-easy-cleanup}.test.mjs` 6개. 기존 assertion 수정 없음.
- 추가: `scripts/hani-release-292-source.cjs`, `scripts/hani-chibi-pack-1-layers.test.mjs`, `scripts/fixtures/chibi-pack-1-main{291,292}-delta.json`, `scripts/fixtures/release-292-delta.json`.
- 기록: 이 보고서·[시험별 결과 JSON](TOOLING-292-EVIDENCE.json)·[인수인계](../../docs/development-history/handoffs/2026-11-13-chibi-tooling-292.md)·CURRENT 요약.

## 바깥 → 안

`현재 292 + 치비 → exact 치비 inverse → main 292 → 중앙 292 버전/연혁 + 사무실 inverse → main 291 → 중앙 291 + contrast → 중앙 290 + 이음 → 기존 289/288 이하 층`

- **291 + 치비 → 291**와 **현재 292 + 치비 → a8b1a09**를 각각 독립 원문 객체로 증명. 현재 치비 inverse 뒤에는 운영 504파일 모두 a8b1a09 원문과 일치함.
- 292 중앙 행은 기존 291 이하 행을 바이트 그대로 보존해 앞에 추가. 새 292 fixture는 22,378바이트의 유일한 편집 조각이며 전체 입력/출력 SHA256을 검사. 운영 파일에 적용하지 않음.
- 기존 치비 289 fixture/hash 그대로 유지. 기존 289 구현은 동등성 oracle로 보존하고, 입력·출력 핀/편집 수/Buffer/변조 거부 결과가 중앙 289와 같음을 증명한 뒤 중앙 층에 위임. 참고한 theme-contrast legacy 시험은 로컬 `050fc06` 객체에서 읽음.
- `hani-m9-polish-preload.cjs`는 **치비 → 이음** 순서가 맞아 수정하지 않음.
- 실제 raw closure **168/누락0**. exact projection으로 이음 자산 참조 4개를 벗기면 기존 **164/누락0**, 기존 `chibi-sheet-v1.webp` 포함. 파일을 직접 필터링하거나 164 단언을 바꾸지 않음.

## 검증

| 시험 | 최종 결과 |
| --- | --- |
| chibi-pack-1 | 10 PASS |
| 새 chibi-pack-1-layers | 6 PASS: 291/292 원문, drift·부분·중복·EOL·재역변환 거부, 289/292 중앙 동등성 |
| release-version-layers / save-guard | 11 / 10 PASS |
| seoyun-m9 / join-ieum | 15 / 17 PASS |
| app-216-audit / qa-easy-cleanup | 7 / 12 PASS |
| newsroom-285-source / newsroom-4cut-288 / life-bundle-source | 2 / 7 / 5 PASS |
| street-journal / street-journal-closure | 10 / 1 PASS |
| office-219 | 6 PASS + source/model PASS |
| history-226 --unit-only | unit PASS, 자체 세부 개수 미출력 |
| **최종 핵심 재실행** | **15파일, Node 119 PASS / 0 FAIL + history unit PASS** |
| **office 전체** | **73파일, 797 PASS / 33 Git 차단 / 3 skip; Git 외 실패0** |
| 수정·추가 스크립트 syntax | 11/11 PASS |

- 확장 회귀: **168파일, exit0 124파일, Node 1,241 PASS / 50 FAIL / 6 skip**. FAIL 구성은 Git 차단39 + 아래 main 재현8 + 실행 입력/의존성 부재3. 별도 PWA 파일은 Node 1 PASS 뒤 Playwright 부재로 exit1. 전체 PASS로 보고하지 않음.
- 위 확장 집계는 새 layers 시험이 5개였을 때의 결과. fixture를 축소한 뒤 입출력 핀 동일성과 중앙 동등성을 확인하고 핵심 15파일을 재실행하여 새 layers 6개 포함 119 PASS. 두 실행의 통과 수를 합산하지 않음. office의 운영 입력 바이트와 핀은 동일함.
- Git 외 실패 **5파일/8건은 a8b1a09 원문 두 owner를 별도로 공급하는 control 실행에서도 같은 결과**: character-archive 13/12, history-unify 4건(292 catalog 대비 175 fallback), ic-polish-205 기존 reminder, m9-link package 참조4개 누락, newstaff-215 20/19. 수정하지 않음.
- 실행 불가: annual-report-ui·PWA의 Playwright 부재, deploy-package-intake의 package 인자 부재, investment-research-safety의 baseline 인자 부재. 이 추가 검색 대상에 대한 build/브라우저 실행은 하지 않음.
- 지정된 기존 실패 20종은 실행·수정하지 않음. 전체 파일별 결과/skip/차단은 JSON에 보존.
- 기존 시험 부산물 4개 원문 복원, 새 부산물 9개 제거. 원본 치비 REPORT 및 다른 담당 산출물 보존. 저장/Cloud/schema 변경 없음. 운영 변경 없는 도구 작업이므로 버전 증가·Candidate/Build/One-Pass/HINA·Production read-back은 N/A.

## Git 때문에 남긴 시험 목록

아래 35파일의 Git 구간은 별도 deny guard에서 중단되었으며 실제 Git은 실행하지 않음. 통과한 비 Git 구간과 구분함.

```text
hani-dev-report-generate.test.mjs
hani-ilbo-banner-215.test.mjs
hani-media-core.test.mjs
hani-meeting-engine-v2-batch1.test.mjs
hani-newsroom-4cut-230.test.mjs
hani-office-actions-216.test.mjs
hani-office-affinity-274-pins.test.mjs
hani-office-barista-night-273-pins.test.mjs
hani-office-bori-stroll.test.mjs
hani-office-cafe-rest.test.mjs
hani-office-chairman-patrol-278-pins.test.mjs
hani-office-companion-homes.test.mjs
hani-office-companions-276-pins.test.mjs
hani-office-consult.test.mjs
hani-office-icons.test.mjs
hani-office-lively-v2.test.mjs
hani-office-mascot-label.test.mjs
hani-office-obr12.test.mjs
hani-office-obr14.test.mjs
hani-office-obr15.test.mjs
hani-office-obr21.test.mjs
hani-office-obr4.test.mjs
hani-office-obr6.test.mjs
hani-office-obr7.test.mjs
hani-office-obr8.test.mjs
hani-office-obr9.test.mjs
hani-office-pet-bori-272-pins.test.mjs
hani-office-pets-268-pins.test.mjs
hani-office-pets-bubble.test.mjs
hani-office-v2-215.test.mjs
hani-office-xmas-269-pins.test.mjs
hani-offline-transport-223.test.mjs
hani-polish-215.test.mjs
hani-proactive-204.test.mjs
hani-remote-card-224.test.mjs
```

## 서윤 재실행 명령

Git·Edge 실행 가능한 환경에서 실행. Codex 환경에서는 Node 내부 spawn도 EPERM이므로 파일별 PowerShell 직접 실행과 `--test-isolation=none`을 사용했음.

```powershell
git diff --check
$e = Get-Content -Raw -Encoding UTF8 artifacts/chibi-pack-1/TOOLING-292-EVIDENCE.json | ConvertFrom-Json
foreach ($t in $e.finalTargeted) {
  if ($t.file -eq 'hani-history-226.test.mjs') {
    node scripts/hani-history-226.test.mjs --unit-only
  } elseif ($t.file -eq 'hani-office-219.test.mjs') {
    node --require ./scripts/hani-chibi-pack-1-preload.cjs --test "scripts/$($t.file)"
  } else {
    node --test "scripts/$($t.file)"
  }
}
foreach ($file in $e.gitBlockedFiles) {
  node --require ./scripts/hani-chibi-pack-1-preload.cjs --test "scripts/$file"
}
node scripts/hani-chibi-pack-1.browser.mjs
```

Notion 현황판 읽기는 성공했지만 착수 `insert_content`는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 **미반영**. 서윤이 날짜/담당·branch/base·위 결과·Git/Edge 미검증·이 보고서 링크를 기록하고 읽어 확인해야 함. commit/push와 실제 화면 확인도 서윤 인계이며 완료로 표시하지 않음.
