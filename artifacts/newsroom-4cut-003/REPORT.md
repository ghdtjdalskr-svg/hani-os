# 뉴스룸 4컷 3호 보고서

## 작업 식별
- 갱신: 2026-11-21 KST / 담당 Codex / 상태: 자료·그림·데이터 초안 완료, 서윤 검토·Git 인계 대기. NORMAL 콘텐츠 작업.
- worktree `news4cut3` / branch `hani/newsroom-4cut-003` / 로컬 base `09ba997070b6262dd9194db4a4430d5a91225c7d` (표시·cache v2.9.303 유지). Git 명령 없이 ref 파일만 확인. 원격 최신성·운영 화면·실제 로딩 JS 미확인.
- 승인 근거: `../news4cut3-task.md` 전체를 UTF-8로 읽었고 한글 정상. 지정 4개 경로만 쓰기, 기존 1·2호 보존, Git·Edge·커밋·배포는 서윤 담당.
- CODEMAP_MISS: codemap의 newsroom 항목에 4cut owner 없음. 실제 `hani-newsroom-4cut.js`의 published → render → renderIssuePanels / issuePanels와 단일 persistent slot 확인. 운영 JS/CSS 수정 없음.

## 숫자표

대상 주간 2026-11-16~11-20, 발행일 2026-11-22. 조사시각 2026-11-21 02:28 KST(시계 도구 11/20 17:28 UTC). 주간 등락은 **11/13 금요일 종가 대비 11/20 금요일 종가**다.

| 항목 | 채택 값 | 출처·기준 시점 |
| --- | --- | --- |
| 코스피 | 4,869.96 / 주간 -7.95% | 11/20 15:30 종가: [아시아경제](https://view.asiae.co.kr/article/2026112015594961221)·[컨슈머타임스](https://www.cstimes.com/news/articleView.html?idxno=728813). 11/13 5,290.53 → 11/20 4,869.96 및 주간 -7.95%: [esi](https://esi-trade.vercel.app/reports/2026-W47)·[Fundratings](https://www.fundratings.co.kr/financial/board/market_state) 일치. |
| 코스닥 | 645.68 / 주간 -7.72% | 종가 위 두 기사 일치. 11/13 699.66 → 11/20 645.68 및 주간 -7.72%: 위 두 주간 보고 일치, [오늘의 종목기록](https://todaywhyup.blogspot.com/2026/11/2026-11-1620-795-772.html) 추가 대조. |
| S&P500 | 미확인 → 그림·카탈로그 수치 제외 | 조사시각은 11/20 미국 정규장 마감(11/21 06:00 KST) 전. [AP 금요일 기사](https://apnews.com/article/c4c3f4878b12989347f8a930ed813dad)는 장중, esi 미국 값은 11/19 기준. 두 기사에서 확정 종가·완료 주간 등락 일치 근거 없음. |
| 나스닥 종합 | 미확인 → 그림·카탈로그 수치 제외 | 같은 이유. [Zacks 11/20 기사](https://www.zacks.com/stock/news/3032970/stock-market-news-for-nov-20-2026)도 11/19 마감을 전달. 나스닥100·선물·장중 값을 대신 넣지 않음. |
| 원/달러 | 1,336.2원 | 11/20 서울 **15:30 주간거래 종가**: [조선비즈 15:36·수정15:38](https://biz.chosun.com/policy/policy_sub/2026/11/20/KPN2KONFS5F2LE323S7ENAX4IM/)·[뉴스1 15:32](https://www.news1.kr/finance/market-exr/6361102)·[뉴시스 15:53:59](https://nwww.newsis.com/view/NISX20261120_0003877064) 일치. |

주간 수익률은 두 금요일 종가로 검산하여 -7.95%·-7.72% 확인. 금요일 하루 -5.21%·-5.71%와 구분했다. 환율 전일 대비 +6.2원은 초안에만 두고 그림에 불필요한 수치를 늘리지 않았다. 645.67로 다른 대시보드·11/20 장중 미국 시세는 채택하지 않았다. 일부 원문 직접 열기는 오류가 있어 **웹 검색 도구가 반환한 기사·보고서 발췌**로 대조했으며 전문 열람으로 보고하지 않는다. Fundratings 루트 직접 열기는 과거 주차가 반환되어 해당 루트는 근거에서 제외하고 11/20 게시판 발췌만 사용했다.

핵심 이슈 한 가지: 앤스로픽 상장 흥행 이후에도 남은 AI 투자 수익성 우려. [YTN 11/20 16:49](https://www.ytn.co.kr/_ln/0102_202611201649308641)·컨슈머타임스 위 기사 및 [아시아경제 뉴욕증시 11/20 06:41](https://view.asiae.co.kr/article/2026112006413956771) 대조. 상장은 완료 사건, 투자 불안은 시장 해석이다. 예정 지표를 발표 완료로 쓰거나 새 금리·규제가 확정됐다고 쓰지 않았다.

## 컷 구도·글자 대조

1. 민지 1명·달력/시계 접사·생각하는 표정·말풍선 1개. 2호의 하니 경고등 클로즈업과 중심 소품·인물이 다르다.
2. 지은·하니 2명·무대 전신·접힌 종이 차트·말풍선 2개. 2호 난간 액션 대신 정적인 브리핑이며 차트는 주간 하락 비유다.
3. 민지 1명·곡면 창/서울 야경을 보는 뒷모습·말풍선 1개. 2호의 지도 부감과 다르다.
4. 세 기자·밝은 원형 출처 확인대 수직 부감·말풍선 3개. 2호의 어깨 너머 라운지 회의와 시점·배치·조명이 다르다.

내장 `image_gen`에 001·002·chibi-sheet 세 참조를 함께 전달했다. [최종 프롬프트](image-prompt.txt), [생성 원본](generated.png), [최종 WebP](../../assets/newsroom-4cut/003.webp), [2호·3호 비교](compare-002-003.png). 생성 원본 971×1619를 1200×2000으로 맞춰 lossless WebP로 저장했다(1·2호와 크기 일치). 회장님 없이 동일 캐스트 세 명만 등장한다.

생성 원본과 최종 WebP의 자막·말풍선을 직접 읽어 대조했다. 최종 실제 픽셀을 2배 확대 추출한 `caption-check-2x.png` 및 `text-check-panel1~4-2x.png`에서 **4,869.96 / -7.95% / 645.68 / -7.72% / 1,336.2원 / 15:30 / 2026.11.16~11.20 / 11/13·11/20**과 한글·쉼표·소수점·부호 일치. 제목·말풍선 7개·하단 `※ 정보 정리용이며 투자 권유가 아닙니다.`도 일치. 글자 보정·재생성 불필요. 비교 이미지에서 접사·전신·뒷모습·부감 4종과 보라 테두리 확인. 실제 PC1280·폰390 앱 화면 검증은 미실행(서윤 담당).

## 시험·보존 결과

| 실행 | 실제 결과 |
| --- | --- |
| `node --require ./artifacts/newsroom-4cut-003/no-git-no-browser.cjs --test scripts/hani-newsroom-4cut-288.test.mjs scripts/hani-newsroom-4cut-230.test.mjs` | 워커 생성 `spawn EPERM`으로 파일 2개 시작 차단. `4cut-tests.log`. |
| 위 두 suite에 `--test-isolation=none --test-reporter=tap` 추가 | 16개 중 **13 PASS, 2 고정 입력 검사 FAIL, 1 작업 범위 차단**. `4cut-no-isolation.log`. Git 실행 없음. |
| 원본 입력 비교: 위 명령에 `--require ./artifacts/newsroom-4cut-003/original-catalog.cjs` 및 `--test-name-pattern='^(?!actual browser:).*'` 추가 | 작업 시작 카탈로그를 메모리에서만 읽혀 **15 PASS, 1 동일 브라우저 범위 차단**. 패턴으로 브라우저 검사가 제외되지 않았지만 guard가 디렉터리 생성 전에 차단. 원본 및 기존 시험·단언 수정 없음. `4cut-original-baseline.log`. |
| `node --test --test-isolation=none --test-reporter=tap artifacts/newsroom-4cut-003/verify-003.test.mjs` | **6/6 PASS**: 원문 바이트 보존, 메타데이터, 발행 KST 경계, 실제 owner JS 렌더링, 3→2→1→3 이동·원본 모달·fetch 1회·저장 접근 0, 주간 검산·이미지 hash. `verify-003.log`. |
| Python `audit_scope.py` / Pillow decode | 2,452개 기존 파일 hash 대조: 허용 외 변경·신규·삭제 0. 기존 변경은 issues.json 하나이며 삽입분 제거 시 **기존 파일 전체 바이트 원상 일치**, 1·2호 객체·001/002 원문 보존. JSON parse·2호와 초안 최상위 형식 일치·UTF-8·WebP 1200×2000 PASS. `scope-audit.json`. |

고정 입력 실패 2건: 288의 issues.json 전체 SHA가 2호 시점으로 고정되어 3호 추가를 거부한다. 이 때문에 230의 288 역투영도 적용되지 않아 `only the index panel` 기대 1개와 원문 2호의 실제 3개 패널이 불일치한다. 원본 입력 비교에서 두 건 모두 PASS로 돌아온다. 사용자 허용 범위 밖인 시험·fixture·hash는 변경하지 않았다. 서윤이 3호 추가를 허용하는 정식 검증 층을 준비해야 하며 **전체 시험 PASS로 보고하지 않는다**.

범위 차단 1건: 230 브라우저 검사가 `artifacts/newsroom-4cut-230/`에 쓰려 하므로 task-local guard가 먼저 차단했다. Edge 실행 없음. Git 호출도 guard로 금지했으며 Git 때문에 차단된 개별 검사는 이번 결과에 없다.

## 다음 담당에게
- 변경: `docs/drafts/newsroom-4cut-003-draft.json`, `assets/newsroom-4cut/003.webp`, `assets/data/newsroom-4cut/issues.json` 3호 삽입, 이 artifacts 폴더. 저장·Cloud·schema·서버·버전·cache 영향 없음. 빌드·Candidate·HINA·PR/main·Pages·운영 read-back은 미실행, 기능 담당 범위 밖.
- 미검증·위험: 미국 마감값은 미확인으로 제외한 상태이며 장 마감 후 자동 보완하지 않는다. 원문 전문 접근 일부 실패. 고정 카탈로그 검증 층 미갱신. 기존 renderer는 001/002만 안내문을 숨기므로 003에서는 이미지 외 안내문도 표시한다. 실제 앱 UI는 서윤 확인 대상.
- 다음 한 가지 행동: 서윤이 보고서·비교 이미지·초안을 확인하고 정식 고정 입력 검증 층 및 Edge 검증을 수행한 뒤 커밋·열차 탑승 여부 판단. 현재 최종 Preview 승인·배포 승인을 받은 상태로 기록하지 않는다.
- Notion: [작업 카드](https://app.notion.com/p/41ec52757074818cb5c4e73acd920938) 착수 생성·읽기 확인 완료. **종료 결과 append 및 상태 ‘검토 중’ 갱신은 두 동작 모두 자동 승인 정책 `never`에 거절되어 미반영**(`MCP tool call requires approval, but approval policy is never`). 완료 갱신으로 보고하지 않는다. 재반영할 요약은 [NOTION-PENDING.md](NOTION-PENDING.md)에 보존. CURRENT·DECISIONS는 쓰기 허용 밖이므로 변경하지 않음.
