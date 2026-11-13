# 2.9.290 이음 후속 tooling

2026-11-13 KST · 도연(Codex) · `hani/tooling-290` · 로컬 HEAD `5ab007bf36d25d54d55675b5f623b1c25e72b8a0`. HEAD/ref 파일 읽기로 확인했고 Git 명령·원격 조회·Edge는 실행하지 않았습니다.

## 바꾼 파일과 층

아래는 모두 `scripts/` 아래 파일입니다. 전체 경로·SHA256은 [검증 원문](TOOLING-290-results.json)의 `identity.files`에 있습니다.

- `fixtures/release-version-layers.json`, `hani-release-version-layers.cjs`, `hani-release-version-layers.test.mjs`: 290 표시·캐시 토큰(60/1개)과 연혁(290 추가, 289 commit/subject 채움)의 정확한 역변환 추가. 기존 283~289 행·핀 보존.
- `hani-join-ieum-source.cjs`, `hani-join-ieum-preload.cjs`, `hani-join-ieum.test.mjs`: 290 버전을 먼저 벗기고 frozen 이음 delta 적용. 중복 `hani-join-ieum-release289.cjs` 삭제. 기존 289 fixture와 그 해시·288 독립 핀 단언은 참조 시험으로 보존.
- `hani-office-v2-fixture.mjs`, `hani-office-lively-fixture.mjs`, `hani-office-kids-daily-source.cjs`, `hani-helper-275-source.mjs`: 기존 office/275 owner 경로에 이음 외층 연결.
- `hani-m9-polish-preload.cjs`, `hani-seoyun-m9.test.mjs`: 기존 polish/link 체인 자체 연결.
- `hani-office-kids-merge.test.mjs`, `hani-office-fix-218.test.mjs`: 별도 raw closure/HTTP bootstrap에도 같은 exact inverse 적용. 기존 164·19 단언 보존.

바깥→안: **290 버전·연혁 → 이음 → 공통 289 버전/예산 → 288 버전/뉴스룸 → 기존 287 이하 층 → 283/생활 묶음 → 필요한 M9 polish/link**. 건물 JSON 3개와 manifest-v3는 기존 이음 delta에 이미 포함됐고 main 바이트와 핀이 일치했습니다. delta 수정 없음.

명령줄 `--require`·`NODE_OPTIONS`·`HANI_IEUM_ALLOW_GIT` 없이 기본 실행됩니다. 기존 메모리 projection 모듈은 legacy fixture 내부에서 재사용합니다. 이음 통합 시험은 그 fixture를 import하지 않아 실제 290 명단·이미지·closure를 계속 검증합니다. Git 차단은 시험 runner의 별도 임시 가드로 분리했습니다.

## 검증

| 시험 | PASS | 기타 |
| --- | ---: | --- |
| join-ieum | 17 | 외부 preload 없이 직접 실행 |
| release-version-layers | 10 | 기존 9건 + 290 1건 |
| office-hd-224 | 10 | 지정 실패 2건 해결, 시험 파일 자체 바이트 동일 |
| seoyun-m9 | 15 | 외부 preload 없이 직접 실행 |
| save-guard | 10 | 외부 preload 없이 직접 실행 |
| office 전체 73개 파일 | 783 | Git 단언 30건 차단, 시작 전 Git 차단 6개 파일, 성능 실패 1건, skip 3건 |

지정 **77개 파일: 835 PASS / Git 단언 차단 30 / Git 시작 차단 6개 파일 / 성능 FAIL 1 / skip 3**. [파일별 통과 수](TOOLING-290-tests.md) · [명령·실패·소스 핀 JSON](TOOLING-290-results.json). Git 차단은 PASS로 처리하지 않았습니다.

성능 미해결: `hani-office-cafe-rest.test.mjs`의 400ms 기준. 모든 다른 시험 종료 후 단독 실행에서도 출근 상태 최선 426.3453ms(434.3423/429.2966/426.3453), 부재 최선 370.8792ms. 실제 사용 JS·건물 JSON·221 catalog가 이음 이전 289의 독립 핀과 일치함을 확인했습니다. 기준·단언을 바꾸지 않았으며 290 기능 회귀와 구분해 서윤 재측정으로 인계합니다.

변경 스크립트 syntax **13/13**, 운영 파일 **504개 바이트 불변**, 지정 원래 실패 시험 **22개 파일 불변**, 기존 HD 숫자·해시와 frozen 이음/289 fixture 보존. HD 보존층 실제 closure 161, raw 290 closure 168/200·누락 0. 시험 부산물 JSON 4개 원문 복원, 신규 시험 부산물 없음. 운영·storage·Cloud·버전·캐시 태그 변경 없음. runtime build/버전 증가/Candidate/HINA/Production은 도구 전용 작업으로 N/A입니다.

## 서윤 실행

Git이 허용된 환경에서 다음 명령으로 차단 파일만 기본 실행합니다. cafe-rest는 Git 검증과 성능 실패가 함께 있어 목록에 포함됩니다.

```powershell
$result = Get-Content -Raw -Encoding UTF8 artifacts/join-ieum/TOOLING-290-results.json | ConvertFrom-Json
foreach ($case in $result.files | Where-Object { $_.gitBlocked -gt 0 -or $_.startupGitBlocked }) {
    node --test-reporter=tap $case.file
}
```

Edge 확인은 `node scripts/hani-join-ieum.browser.mjs`로 별도 수행합니다. 기존 `REPORT.md`의 외부 preload/env 명령은 289 작업 당시 기록이며 이번 tooling 명령을 우선합니다. 원격 최신성·실제 Git 원본 대조·브라우저·commit/push/PR/배포는 미수행입니다.

Notion HANI-86 착수 기록 추가는 자동 승인 검토에서 정책 `never`로 거절됐습니다. 읽기는 성공했지만 갱신은 미반영이며, 서윤의 최종 검증·기록 갱신을 기다립니다. [작업 인수인계](../../docs/development-history/handoffs/2026-11-13-tooling-290.md).

## 추가 수정

2026-11-13 KST · `../tool290b-task.md` 후속. `hani-office-onboarding-232-assertions.mjs`의 현재 spatial JSON과 `hani-office-obr6.test.mjs`의 현재 places JSON 읽기에만 기존 `hani-join-ieum-source.cjs`의 `project`를 적용했습니다. 원래 단언·해시·숫자·historical reader·frozen fixture와 운영 파일은 보존했습니다. 추가한 import와 입력 wrapper만 되돌리면 두 파일 모두 착수 전 소스 바이트와 정확히 일치합니다.

입력 7개(건물 JSON 3개, actions 216/221, tap-lines, manifest-v3)의 raw/역변환 SHA가 frozen delta의 after/before 핀과 일치합니다. spatial은 326 anchors 유지, obr6의 기존 `f6cbc09d…` 단언은 raw `b97e49e3…`에서 실패하고 수정 입력에서 통과합니다. Git이 필요한 지정 두 시험 전체는 실행하지 않았으며 서윤 재검증 대기입니다.

비 Git targeted 시험은 `node --test-reporter=tap scripts/<파일>`로 **join-ieum 17, office-lively 13, office-obr3 5, office-obr10 4, office-tap-lines 15 = 54 PASS / 0 FAIL**, 수정 파일 `node --check` 2/2 PASS입니다. 검색한 56개 시험과 helper 경로에서 추가 누락은 발견하지 못했습니다. 같은 places 해시를 고정하는 chairman-234·consult·obr15는 이미 v2 fixture → 이음 preload 경로를 사용하며, 별도 Node 입력 검사에서 기존 핀 통과를 확인해 수정하지 않았습니다. 전체 시험 통과로 간주하지 않습니다. [검색·검증 상세](TOOLING-290b-results.json).

검색 범위의 **Git 필요 시험 목록**(이번에는 실행하지 않음; `scripts/` 아래):

```text
hani-office-lively-v2.test.mjs
hani-office-obr6.test.mjs
hani-office-actions-216.test.mjs
hani-office-v2-215.test.mjs
hani-office-obr4.test.mjs
hani-office-chairman-234.test.mjs
hani-office-consult.test.mjs
hani-office-obr15.test.mjs
hani-office-bori-stroll.test.mjs
hani-office-cafe-rest.test.mjs
hani-office-companion-homes.test.mjs
hani-office-mascot-label.test.mjs
hani-office-pets-bubble.test.mjs
hani-brand-heroes-218.test.mjs
hani-reviewed-release-baseline.test.mjs
hani-office-219.test.mjs (사용자 확인상 기존 실패; 수정 제외)
```

Git·Edge·버전 변경·배포 없음. Notion HANI-86 추가 기록은 자동 승인 검토에서 정책 `never`로 거절되어 갱신 대기이며, 후속 결과와 목록은 이 보고서·인수인계에 보존합니다.
