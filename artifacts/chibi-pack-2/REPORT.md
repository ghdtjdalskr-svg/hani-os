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
