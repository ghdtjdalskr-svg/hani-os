# tc291b · 2.9.290 기준 시험 층 정리

2026-11-13 KST · 도연 Codex / Git·Edge 후속 담당 서윤

- 기준: `hani/theme-contrast`, HEAD `47b20fa8e6a702bc93c9adefcbb73634d84e3ea7`, 로컬 `origin/main` `46cb7a69c4beeff3cce3bbe788be6f952e7b99e9`(2.9.290). Git 명령 없이 ref 파일만 확인, 원격 최신성 미확인.
- 허용 범위: 시험 도구·문서만. 운영 파일·버전·localStorage·Cloud 수정 없음. Git·Edge·commit/push/PR/merge/배포 실행 없음.
- CODEMAP_MISS: 시험 층 owner가 없어 지정 파일과 실제 의존 체인으로 조사.

## 변경 파일과 층 구조

- `scripts/hani-release-version-layers.cjs`: 고정 theme CSS inverse를 main의 공통 projection 두 진입점 앞에 연결. 기존 `join-ieum-preload → M9/life` 체인이 그대로 재사용하며, CLI theme preload 없이 동작. 독립 raw reader와 strict inverse는 유지.
- `scripts/hani-theme-contrast.test.mjs`: main 290 버전·이음 inverse 후 기존 legacy-289 검증. main과 legacy의 owner·입력/출력 해시·편집 수·복원 바이트 동일성, 290 drift 거부를 추가 검증. 기존 단언 유지.
- `scripts/hani-theme-contrast-preload.cjs`: 명시적 옛 adapter도 main 290+이음 → 기존289 순서로 연결. 기본 시험에는 이 adapter를 지정하지 않음.
- `scripts/hani-theme-contrast-preload.test.mjs`: M9 기본 경로에서 path/URL·Buffer/UTF-8·callback/promise, 같은 basename 임시 파일 미개입, raw reader/opt-out 보존 4개 회귀.
- `scripts/hani-app-216-audit.test.cjs`, `scripts/hani-qa-easy-cleanup.test.mjs`: 기존 exact preload만 연결하여 frozen 스타일 순서·19명 단언 보존.
- `scripts/hani-history-226.test.mjs`: Node fixture 입력에만 기존 이음 projection 적용. HTTP/브라우저의 직접 파일 읽기는 보존.
- 이 보고서, `docs/development-history/handoffs/2026-11-13-theme-contrast-tooling.md`, `CURRENT.md`: 결과·인계 기록.

바깥→안: **theme CSS append inverse(해당 CSS만) → main 290 version/history inverse → frozen 이음 inverse → main289 inverse(legacy와 동일한288 바이트) → 기존288 newsroom → 이하 release/feature → life/M9**. 각 층은 정확한 입력 해시에만 적용한다. strict `restoreLegacy`·CSS inverse와 고정 fixture는 변경하지 않았다.

고정 fixture SHA256:

- legacy289: `5cff7afdbf1d5feb8f4d20c1e11ca0938ab89339a4a924220e2bb27dfbe51397`
- theme delta: `5d59f5eef1e0f76e79c2b54dc917e46a37409ffaf1fe81f2b36a4204bf7abafb`

## 검증

**97파일 · 961 PASS · Git 차단36 · skip4 · Git 외 실패0.** [파일별 명령·통과 수·차단 목록·코드 해시](TOOLING-291-results.json), [전체 TAP 근거](TOOLING-291-tests.txt). 수는 각 파일 실행의 TAP case 기준이며 의존 시험 중복을 포함한다. 자체 실행형의 세부 그룹은 로그에 기록한다.

Node 기본 process isolation은 sandbox `spawn EPERM`으로 시작할 수 없어 각 파일을 `--test-isolation=none`으로 독립 실행했다. Git 호출은 임시 process guard에서 실행 전에 차단했으며 단언·파일 시작 차단을 PASS로 세지 않았다. 외부 theme preload·Git 허용 환경변수 없이 실행했다. 운영 build·버전 증가·Production read-back은 도구 전용이라 N/A.

| 시험 | 최종 결과 |
|---|---|
| theme-contrast Node 3개 | 3/3 PASS; Edge 부모+48조합 미실행, 52/52 선언 불가 |
| M9 기본 preload 경로 회귀 | 4/4 PASS |
| release-version-layers | 10/10 PASS |
| save-guard | 10/10 PASS |
| join-ieum | 17/17 PASS, raw runtime closure 168/200·누락0 |
| newsroom285-source / newsroom4cut288 | 2/2 + 7/7 PASS, CSS pin 실패 해결 |
| app216 audit / qa-easy-cleanup / history226 | 7/7 + 12/12 + unit PASS; 원래 수치·순서 단언 보존 |
| office72파일(219 제외) | 790 PASS · Git 차단34 · skip3 · 기타 실패0 |
| seoyun-m9 | 15/15 PASS |
| CSS 직접 참조11파일 | 58 PASS · Git 차단1(newsroom230) · skip1(simplify218) |
| 간접 CSS pin4파일 | newsroom285 2 + newsroom288 7 + life-bundle5 PASS; settings225는 Git으로 시작 차단 |
| study-retry / procrastination / wishlist / egress-fix | 26 + 6 + 7 + 1 PASS |

표의 CSS 분류는 위 개별 행과 일부 겹친다. 직접 참조11파일과 간접 pin4파일을 모두 확인했다. 지시된 기존 실패20개는 직접 실행·수정하지 않았다. 400ms 성능 단언도 원래 기준으로 PASS(대표 부재 best273.02ms / 출근 best308.55ms).

문법 **7/7 PASS**, 명시적 옛 adapter의 4 owner 출력과 독립 raw reader 보존 PASS. 운영504파일은 착수 시와 바이트 동일(추가·삭제·변경0). 다른 작업 산출물 JSON4개(obr16/17/19 layout, drama reachability)는 원문 복원했고 새 시험 부산물2개(exam node-results, history unit)는 제거했다. 기존 Edge JSON·PNG는 보존했다.

## 서윤이 실행할 명령

```powershell
# 외부 theme preload 없이 전체 52/52와 실제 Edge 확인
node --test scripts/hani-theme-contrast.test.mjs

# 기본 Node 체인 전체. Git 가능 환경에서 실행
node --test scripts/hani-office*.test.mjs scripts/hani-seoyun-m9.test.mjs scripts/hani-release-version-layers.test.mjs scripts/hani-save-guard*.test.mjs scripts/hani-join-ieum.test.mjs

# 간접 CSS pin·추가 회귀
node --test scripts/hani-theme-contrast-preload.test.mjs scripts/hani-newsroom-285-source.test.mjs scripts/hani-newsroom-4cut-288.test.mjs scripts/hani-life-bundle-source.test.mjs scripts/hani-settings-225.test.mjs
node --test scripts/hani-newsroom-4cut-230.test.mjs --node
node scripts/hani-history-226.test.mjs --unit-only

# 이번에 Git이 차단된 29파일만 순서대로 재검증
$result = Get-Content -Raw -Encoding UTF8 artifacts/theme-contrast/TOOLING-291-results.json | ConvertFrom-Json
foreach ($file in $result.notRun.git) {
  if ($file -eq 'hani-newsroom-4cut-230.test.mjs') {
    node --test "scripts/$file" --node
  } else {
    node --test "scripts/$file"
  }
}
```

Git 차단29파일의 정확한 목록은 결과 JSON의 `notRun.git`, 36건의 각 단언은 `results[].failures`에 기록했다. `office-219` 등 지정된 기존 실패는 위 wildcard에서도 기존 실패로 구분한다. Edge 부모+48조합은 지시대로 미실행하여 52/52 미검증이다. 서버/Edge Function·설정·배포 순서 변경 없음. Git 검토·commit/push는 서윤 담당이며 이 작업에서 실행하지 않았다.

Notion HANI-87 착수 append는 자동 승인 `never` 정책으로 거절되어 미반영. 최종 결과 요약을 이 보고서·인수인계에 보존하고 Notion 갱신을 인계한다. 이전 REPORT.md의 Edge52/52는 과거 증거이며 현재290 기준 결과로 재사용하지 않는다.
