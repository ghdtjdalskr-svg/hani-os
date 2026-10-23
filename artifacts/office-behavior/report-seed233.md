# obr5 B — 운영 2.9.232 + 233 시드 선행 검증

2026-10-23 KST / 도연(Codex), 브라우저·배포 담당 서윤.

## 식별과 결과

- worktree `seed233`, branch `hani/seed-233-office-data`, base·유지 HEAD `7a10595f2a0890e63cd04dbc95c057edbbd3d5b0`.
- GitHub 연결 도구의 원격 main 조회도 같은 SHA다. 셸 네트워크 실패 후 읽기 전용 연결 도구로 확인했다. merge/rebase 없음.
- **최종 main office/building 회귀: 99개 / 96 PASS / 0 FAIL / 브라우저 3 SKIP, 209.01초.** 실제232 런타임+새 데이터 VM도 PASS.
- (a) 운영232 정상 경로를 깨뜨리는 오류는 이번 검사에서 재현되지 않았다. (b) 옛 데이터 고정값과 wildcard CLI 입력 문제만 최소 수정했다. 실제 화면은 미검증이다.

## 데이터3 — 기존 staged 그대로, 수정0

| 파일 | obr·seed233 공통 SHA-256 |
|---|---|
| `data/hani-building/office-places.json` | `80bb9f7e69d9662306b87100bd35a2b2914a9a72d0b3a604ed26d1be6a5cccbd` |
| `data/hani-building/art-map-v1.json` | `910c96d135a92bc42ef1db05d9c9c8ad4461ffe88f3ffc860e538b5b9cfb0438` |
| `data/hani-building/spatial-contract.json` | `ed221b2405b2f41641b96055fc26f88a3a8d1a97b2fd1d4b40bf7d2e94e96e50` |

`git diff --exit-code -- data/hani-building` 성공으로 staged 이후 변경0, obr의 `obr5-identity.json`으로 두 worktree 전체 bytes 동일을 확인했다. anchor326·canonical 좌표·edge 불변이며, 명시된 두 사람 등록·좌석 owner·정책 설명만 delta로 허용한다.

`hani-office-live.js`, `hani-main.js`, `index.html`, `assets/data/`는 origin/main과 diff0. 실제 실행 live JS SHA-256은 `73fc0165516b0c7e78cd4b3639a900dd3363cafc111d3dd537af7edab4c256b8`이다. 표시 버전·cache 2.9.232 유지, 저장소·Cloud·schema·migration 변경0.

## 바꾼 테스트와 이유

각 수정 파일에 시드 등록 또는 wildcard 실행 이유를 한 줄 주석으로 남겼다. 한도·쿨다운·기간·좌표 허용 오차·수락 조건은 완화하지 않았다.

| 파일 | 최소 조정 |
|---|---|
| `scripts/hani-building-206.test.mjs` | fallback 등록 명부17→19·2F 두 사람을 정확히 기대. 이미 출고된232 조직도 원문과 비교하며 옛 join 정규화는 사용하지 않음 |
| `scripts/hani-building-206-engine.test.mjs` | fallback actor19·근무8, 기존 화면 cap6 유지로 overflow2를 정확히 검사 |
| `scripts/hani-building-206-safety.test.mjs` | 열차와 같은 HANI_BUILDING_SAFETY_BASELINE env 지원. 원본 보존 검사 유지 |
| `scripts/hani-building-206-ui.test.mjs` | wildcard에서 다른 테스트명을 Playwright로 해석하지 않고 서윤 담당 SKIP 명시. 명시 CLI 브라우저 본문 전체 보존 |
| `scripts/hani-office-219.test.mjs` | 새 art 전체 고정 SHA+모든 home pivot 불변, canon 명시 등록 delta+전체 고정 SHA 검사. index·sprite·행동 데이터·budget 보존 유지 |
| `scripts/hani-office-actions-216.test.mjs` | canon SHA 기대를 엄격한 등록 delta 비교로 갱신, scheduler actor21(등록19+회장+방문객)을 정확히 기대 |
| `scripts/hani-office-hd-224.test.mjs` | fallback에서 cap 밖 새2명은 숨김·sprite 미초기화를 정확히 검사. 기존17명 HD/fallback/좌표·로드 수·무쓰기 유지 |
| `scripts/hani-office-seats-215.test.mjs` | 등록 home19, 미초기화 persistent 슬롯15로 기대값 갱신 |
| `scripts/hani-office-v2-215.test.mjs` | canon을 명시 등록 delta로 검사, 두 사람 소유 좌석과 예정 문구가 제거된 정확한 책상 문구 검사 |
| `scripts/hani-office-seed-233-expectations.mjs` (새 보조) | immutable Git canon SHA 검증 후 등록2명·owner2개·정책 문구 외 전체 JSON deep equality. 현재 canon/art 고정 전체 SHA도 검사 |

개발 증거는 본 보고서, `seed233-vm.mjs/json`, 회귀 로그다. 인수인계는 `docs/development-history/handoffs/2026-10-23-seed233-office-data-codex.md`. 임시 조정 스크립트는 제품/테스트 소스가 아니다.

## 실행과 실패 분류

| 실행 | 결과 | 증거 |
|---|---|---|
| 최초 main 전체 명령 | 99개 / 68 PASS / 29 FAIL / 2 SKIP | `seed233-tests-initial.txt` |
| 기대값·wildcard env 1차 보수 | 99개 / 93 PASS / 3 FAIL / 3 SKIP | `seed233-tests-adjusted.txt` |
| 남은 lazy 슬롯·좌석·책상 문구 보수 후 targeted | 26개 / 24 PASS / 0 FAIL / 2 SKIP | `seed233-targeted-final.txt` |
| 최종 전체 명령 | 99개 / 96 PASS / 0 FAIL / 3 SKIP | `seed233-tests-final.txt` |
| 실제232 JS·metadata loader·DOM/mascot VM | PASS, write0 | `seed233-vm.json` |
| runtime diff0·staged 데이터 불변·diff check | PASS | Git 확인 |

전체 명령: `node --test --test-isolation=none scripts/hani-office-*.test.mjs scripts/hani-building-*.test.mjs`. OFFICE_SOFT=1, HANI_BUILDING_SAFETY_BASELINE와 HANI_OFFICE_TEST_BASELINE는 obr의 기존 run-tests.ps1이 export한 고정 원본 디렉터리로 지정했다.

Node→Git spawn EPERM으로 A와 같은 읽기 전용 Git export preload를 NODE_OPTIONS로 공급했다. 원문78개 모두 native Git 객체 ID 검증78/78 PASS, preload는 SHA-256을 확인한다. HANI_OBR5_GIT_EXPORTS는 obr의 `artifacts/office-behavior/obr5-git-exports`, preload는 `artifacts/office-behavior/obr5-git-preload.cjs`다. Git spawn 가능 환경에서는 preload 없이 같은 명령을 사용한다. 기대값을 현재 HEAD로 대체하거나 Git oracle를 정규화하지 않았다. 직접 Git 통합 성공과는 구분한다.

## 운영232에서 사용자 눈에 바뀌는 점

- 실제 fetch loader도 anchor326을 수락하고 V2 scene·221 scheduler를 오류 없이 생성했다.
- 복도·문·approach의 **화면 좌표**가 새 art-map을 따른다. canonical 좌표와 home foot pivot은 그대로이며 경로를 그리는 위치가 즉시 달라질 수 있다.
- 다온·윤슬의 `입사 예정` 행은0개가 된다. main의216/221 people은 그대로여서 두 사람은 정상 scheduler에 아직 나타나지 않는다. 캐릭터가 없는 두 책상 상태가 유지된다.
- 두 사람 마스코트는 `data-planned=false`, 기존 home 좌표+offset 유지. 예정 상태에 따른 외형이 선행 변경된다.
- 정상221 VM: 09:00/12:30/15:40/21:00/23:00 모두 기존17명·새2명0. 모든 seat 좌표 유효, 각 층 overflow0. 오전2F는6명, 늦은 시간은 기존 일정에 따라5명이다.
- DOM은19명 자리+회장+방문객으로21 persistent 슬롯이다. 새2명 슬롯은 숨김. 예정 행 제거를 캐릭터2명 착석 완료로 보고하지 않는다.
- 행동 데이터가 모두 실패한 fallback은 등록19명·2F 근무8로 집계되지만 **232의 기존 cap6**이 적용되어 2F overflow2다. 예외 없이 동작하며 이 값을 정확히 검사했다. 정상 scheduler와 구분해야 한다.
- 새 office-places 파일은232의 fetch 목록에 없다. 장소 기반233 동작은 runtime 출고 후 활성화된다.

## 위험·Git 상태·서윤 결정

- 브라우저3개는 명시 지시에 따라 미실행 SKIP. 실제1440/390 문구·좌표·동선·마스코트·이미지 decode·console은 서윤 확인 대기다. VM을 실화면 PASS로 취급하지 않는다.
- 데이터는 seed PR merge 즉시 운영232에도 적용된다. 예정 행/마스코트 선행 변화, 정상 경로 빈2자리, 장애 fallback overflow2를 확인하고 **시드 선행 반영 여부를 서윤이 결정**한다.
- 이 기대값은 **232+새 시드** 상태용이다. 233 merge 뒤 tooling PR에는 열차의19명 scheduler·새 projection 검사를 통합한다. 이 branch의 옛 runtime 기대값을 열차에 그대로 덮어쓰면 안 된다.
- git add가 `.git/worktrees/seed233/index.lock: Permission denied`로 차단됐다. 신규 commit 없음. 기존 데이터3만 staged, 테스트·보조·보고·인수인계는 미커밋. 본 보고서는 `git add -f` 대상이나 Git index 쓰기 차단으로 추가하지 못했다.
- push/PR/Notion·main/Pages/Production read-back 없음. Notion은 명시 금지로 미반영. 서버 Edge Function·설정 배포 없음.
