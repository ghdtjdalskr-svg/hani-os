# 치비 2탄 · 독서·퀴즈·여행

2026-11-13 KST · 도연 / Codex · `hani/chibi-pack-2` · base `e1f3ac7e944484b09fe102464b22ef6e66204d9a`.

구현·지정 회귀검사 완료, 서윤 Git·Edge 검증 대기. Git·Edge·배포는 지시대로 실행하지 않았습니다. 표시/캐시 `2.9.293` 유지.

- 그림: [chibi-sheet-v2.webp](../../assets/street-journal/chibi-sheet-v2.webp), 1024×1024 / 512px 네 칸 / 투명 WebP / **209,358 bytes · 204.45KiB**.
- 비교: [compare.png](compare.png). v1·개별 치비·pb를 image_gen 스타일 참조로 사용하고 프로필로 인물을 맞춤. 갈색 선화·눈/볼 표현·머리 광택·정장 전신 구성 대조. 최종 취향 일치와 실제 화면은 대표님 Preview 판단 대기. [생성 프롬프트](IMAGEGEN.md).
- 운영 변경: `hani-main.js` 독서·여행/일정, `hani-study-v02984.js` 퀴즈 결과, `hani-street-journal.css`, 새 시트 1개. 코드/CSS 순증 2,325 bytes. 기존 renderer에서 `renderChibiNote` 재사용, 퀴즈 결과 DOM 교체 시 노드를 보존해 다시 배치.
- 시험 변경: 신규 `scripts/hani-chibi-pack-2-source.cjs`, `hani-chibi-pack-2-preload.cjs`, `fixtures/chibi-pack-2-delta.json`, `hani-chibi-pack-2.test.mjs`, `hani-chibi-pack-2.browser.mjs`. 기존 chibi-pack-1-source / release-version-layers / study-retry-source 및 quiz-autogen-216 / quiz-client-209 시험에는 preload 1줄씩만 추가. 기존 단언·fixture 110개·숫자·해시 보존.
- **99파일 / 1,009개 테스트 PASS / Git 차단 29항목 + 시작 전 5파일 / skip 3**. TAP 계수가 없는 history unit·quiz-v04도 명령 성공. 추가 study-news-material 1명령은 수정 전 원문에서도 `cloudReadFetch is not defined`로 실패, 미수정. 신규 기능의 미해결 실패 0. [시험별 통과 수](TEST-RESULTS.md) · [실패 사유/명령/집계](regression-results.json).
- 원문 기준 1,664개 파일 범위 밖 변경/삭제 0. JS syntax 11/11, 추가 CSS 괄호 균형 확인. 실제 참조 168→169/200, 누락 0. 저장·Cloud·schema·migration·새 timer/listener/polling 0. 기존 쓰기·채점 owner 원문 exact inverse 일치. [감사 결과](audit-results.json).

| 범위 | 파일 | 통과 테스트 | 미통과 구분 |
| --- | ---: | ---: | --- |
| 신규 2탄 | 1 | 7 | 없음 |
| 기존 1탄 | 3 | 19 | 없음 |
| office 전체 | 73 | 791 | Git 29항목·시작 5파일 차단, skip 3 |
| study / quiz | 9 | 83 | 위 기존 의존성 오류 1명령 |
| 나머지 지정·관련 시험 | 13 | 109 | 없음 |

시험 부산물은 기존 base와 같은 11개를 확인하고, 달라진 공통 QA JSON 4개는 새 결과를 이 폴더에 보존한 뒤 전달 base 원문으로 복원했습니다. 독립 base가 없는 unit JSON 2개는 임의 복원/삭제하지 않았습니다. [상세 목록](test-output-restoration.json).

## 서윤 실행 명령

```powershell
node scripts/hani-chibi-pack-2.test.mjs
& ./artifacts/chibi-pack-2/run-regression.ps1 -Phase seoyun -AllowProcesses
node scripts/hani-chibi-pack-2.browser.mjs 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

브라우저 스크립트는 원문 앱·격리 프로필·합성 메모리 자료만 사용. 외부 네트워크 차단, 새 치비 슬롯 동일성·렌더링 저장 0·문구·72/56px·화면 넘침·정답/해설 보존과 print/reduced-motion을 검사합니다. 독서 빈/퀴즈 정답/퀴즈 오답/여행 빈 필수 8장과 여행 Wish/빈 일정 4장, 합계 12장 PNG 및 `browser-results.json` 저장 예정. **이번 실행 PNG 0, 실제 UI·이벤트·배포/Production 미검증**.

THAW 2.9.294 결합은 서윤 담당. 이후 main 내용/버전이 달라지면 현재 정확한 입력 해시를 임의로 완화하지 말고 새 바깥 시험 층과 해당 검증을 준비해야 합니다. 기능 영역은 THAW 수정 위치와 분리했습니다. 버전 증가·Candidate/HINA·merge·Pages·운영 read-back은 배포 열차 단계에서 별도 승인 후 수행합니다.

Notion: [HANI-90 착수 카드](https://app.notion.com/p/417c5275707481c89af1f5a566b97c4c) 생성·읽기 확인 완료. 진행 기록 추가는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절하여 미반영. 최종 결과 갱신도 대기하며, 상세 인수인계에 전달문 보존.

## main cb11935 재정비

2026-11-14 KST · 도연 / Codex · ch2 / `hani/chibi-pack-2`. 착수 HEAD `ab5204afa4f0f0d8ef949f63980fcb559b9a3ea9`, 지정·로컬 origin/main `cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc` (#505, 2.9.294 + tooling-294). 기존 read-only 객체 helper로만 확인했으며 원격 새 조회·Git 명령·merge index 처리는 하지 않았습니다. 아래 내용은 앞의 293 기준 검증과 구분하는 후속 기록입니다.

- 충돌: `hani-chibi-pack-1-source.cjs`의 치비2 preload와 main의 THAW 연결을 모두 보존했습니다. `CURRENT.md`는 main 쪽 tooling-294·THAW 기록 전체를 먼저 두고 기존 치비2 기록 전체를 뒤에 보존했습니다. 전체 검색에서 남은 충돌 표시 0건을 확인했습니다.
- 시험 입력: 치비2 전용 `chibi-pack-2-delta.json`의 base와 hani-main.js before/after 해시를 294 바이트로 재고정했습니다. 치비2 편집 내용은 그대로이며 역변환 결과를 독립 cb11935 객체 원문과 대조했습니다. 전용 source의 fixture 해시도 함께 고정했습니다. 기존 fixture·단언·숫자·hash는 변경하지 않았습니다.
- 순서: **치비2 inverse → 294 version/history → frozen THAW → 293 version/history → 치비1 → 292 version/office → 291 → 290/이음 → 289 이하**. THAW source에도 치비2 preload 1줄을 연결해 단독 import 때 raw reader가 치비2를 먼저 벗기도록 했습니다. 기존 294·THAW·치비1 inverse의 exact input/output 검사는 그대로입니다.
- 새 층 시험 `hani-chibi-pack-2-layers.test.mjs`: 중간 pin·원문 동일성·변조 입력 거절과 **172→171→168→164 / 누락0**을 실제 closure resolver로 검증해 2PASS. 2탄 기능 시험은 기존 7PASS입니다.
- 운영 보존: hani-main.js·hani-study-v02984.js·hani-street-journal.css·시트 등 착수 런타임 원문을 유지했습니다. 기존 fixture 111개와 모든 기존 시험 파일도 착수 바이트 그대로입니다. 표시/cache `2.9.294`, 마지막 UI 태그 `hani-ui-v02992.js?v=2.9.294`, 마지막 script `hani-launch-greeting.js`; 실제 LIVE 로딩은 미확인입니다. 보호 키·내부 버전·저장/write·Cloud·schema·migration 변경 없음. 버전 증가 검사는 운영/배포 파일을 수정하지 않은 이번 시험 도구 정비에서 N/A입니다.
- 브라우저: `hani-chibi-pack-2.browser.mjs` 원문 유지·syntax 확인. 스크립트의 실제 합성 setup을 현재 study owner의 VM에서 실행해 정답5/5·오답4/5, 문제5개·기존 해설 markup을 확인했습니다. 6상태×1440/390=12PNG 계획이며 실제 Edge·화면·이벤트·PNG는 미실행입니다. 문자열 존재만으로 실제 UI PASS를 선언하지 않습니다.
- 지정 회귀검사와 추가 층 시험: **총98파일 중 비Git71파일 명령 성공 / 824PASS / 0FAIL / skip1, Git27파일 목록만**. office73파일 중 비Git46파일 610PASS·0FAIL·skip1, 치비2 9PASS, 치비1 19PASS, THAW·294·version layer 30PASS, study/quiz 84PASS입니다. history `--unit-only`도 명령 성공이며 TAP 개수 없는 자체 검증은 위 숫자와 구분합니다. 사용자 지정 기존 실패 22종(학습자료 포함)은 수정·실행하지 않았습니다. [파일별 결과](TEST-RESULTS-main294.md) · [최종 집계/명령/로그](main294/final-results.json) · [Git 필요 목록](main294/GIT-TESTS.md). 최초97파일 일괄 실행 후 새 층 시험 1파일을 별도로 실행해 합쳤습니다.
- 보존·syntax: [감사](main294/audit.json)에서 착수2,085파일 중 범위 밖 변경/삭제0, 기존시험287개·운영9파일·기존fixture111개·치비2 편집·main adapter 최소 연결·CURRENT 양쪽 원문 보존을 확인했습니다. syntax9파일 및 runtime JS2개 VM 컴파일과 PowerShell 실행기 syntax PASS. 공통 QA 생성JSON4개는 이번 결과를 별도 이관한 뒤 **착수 원문**으로 복원했고, 착수 때 없던 시험 출력JSON3개도 이번 증거 폴더로 옮겼습니다([내역](main294/restoration.json)). 기존 시험 단언 변경0.

서윤 실행 명령(첫 줄은 비Git 재검사, 둘째 줄만 Git 필요 파일, 셋째 줄은 실제 Edge):

```powershell
& ./artifacts/chibi-pack-2/rebase294-run.ps1
& ./artifacts/chibi-pack-2/rebase294-run.ps1 -GitOnly -AllowProcesses
node scripts/hani-chibi-pack-2.browser.mjs 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

Git의 충돌 해결 표시·merge 완료·commit/push는 서윤에게 인계합니다. Candidate/One-Pass/HINA·merge·Pages·Production read-back은 이번 범위 밖입니다. 별도 서버 함수·설정 변경이나 배포 순서 의존성은 없습니다.

Notion HANI-90 읽기 성공, 이번 재정비 기록 insert_content는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절됐습니다. 갱신 대기 내용은 [인수인계](../../docs/development-history/handoffs/2026-11-14-chibi-pack-2-main294.md)에 보존했습니다.
