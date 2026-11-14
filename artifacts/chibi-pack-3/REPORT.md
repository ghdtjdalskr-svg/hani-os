# 치비 3탄 · 생일 카드와 빈 화면

2026-11-14 KST · 도연 / Codex · `hani/chibi-pack-3` · base `7a91982de08a54452f6b9057f906d651f63a65ca`.

구현·지정 Node 회귀 완료, 서윤 Git·Edge 검증 대기. Git·Edge·버전 증가·main merge·배포는 실행하지 않았습니다.

- 그림: [투명 v3 시트](../../assets/street-journal/chibi-sheet-v3.webp), **1024×1024 / 512px 네 칸 / 228,068 bytes · 222.72KiB**. [그림체 비교](tooling297-local/imported/compare.png)는 v1 → v2 → 신규 순서. 기존 갈색 선화·눈/볼·머리 질감·정장 전신 비율을 맞췄으며 최종 취향은 Preview 확인 대기. 기본 image_gen 사용, [참조·프롬프트](IMAGEGEN.md).
- 운영 변경: `hani-main.js`, `hani-street-journal.css`, 새 시트 1장. 홈은 KST 월/일·확정 20명 생일표와 기존 직원 이름/직급·기존 프로필을 사용. 일기는 전체 기록 없음일 때만, 시청은 기존 슬롯을 하루로, 월간보고는 기존 슬롯을 지은으로 갱신. 월간 빈 제목 span 구조 유지.
- 시험 변경: 신규 `hani-chibi-pack-3-source.cjs`, `hani-chibi-pack-3-preload.cjs`, `fixtures/chibi-pack-3-delta.json`, 기능/층 시험 2개와 브라우저 실행기 1개. 기존 `hani-release-296-source.cjs`, `hani-design-polish-1-source.cjs`, `hani-design-polish-1-main295-source.cjs`에는 preload 1줄씩만 추가. **기존 fixture 114개·시험 파일 312개·단언·숫자·hash 원문 보존**.
- **비Git 79파일·860PASS·0FAIL·skip1**, 그중 사무실46파일·610PASS, 신규 기능9 + 층3 = **12PASS**. [시험별 결과](TEST-RESULTS.md) · [최종 집계](regression-results.json). 실제 renderer에서 생일/비생일·KST 자정·동시2명·프로필/이니셜·빈/검색/기록/실패/생성 상태·슬롯 동일성·저장0 검증. 실제 참조 **173→172→172→172→172→171→168→164 / 누락0**.
- 저장·Cloud·schema·migration·새 timer/listener/polling 0. `hani-design-system.css`, 표시/cache `2.9.296`, 보호 키·내부 버전 보존. JS syntax16·CSS 괄호·PowerShell syntax·브라우저 합성 setup PASS. 별도 Edge Function·서버 설정 의존성 없음. [보존 감사](audit.json).
- **실제 Edge·UI PNG·Preview·Git 미실행**. 브라우저 합성 setup·syntax만 확인했으며 5상태×1440/390=PNG10장 예정. 월간 smoke 최초 시도는 Playwright 미설치로 시작 실패(브라우저 실행0), 전용 브라우저 항목으로 인계.

## 서윤 실행 명령

```powershell
node scripts/hani-chibi-pack-3.test.mjs
node scripts/hani-chibi-pack-3-layers.test.mjs
& ./artifacts/chibi-pack-3/run.ps1
& ./artifacts/chibi-pack-3/run.ps1 -GitOnly -AllowProcesses
node scripts/hani-chibi-pack-3.browser.mjs 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
```

Git 필요 27파일은 [목록](GIT-TESTS.md)만 작성. 브라우저 전용 4파일도 TEST-RESULTS.md에 인계했습니다. 지정 기존 실패는 미실행·미수정. Git 검증·commit/push·Preview 이후 배포 열차에 인계하며, 승인·Candidate/HINA·merge·Pages·Production read-back은 후속 단계입니다.

Notion 착수 추가는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했습니다. [작업별 인수인계](../../docs/development-history/handoffs/2026-11-14-chibi-pack-3.md)에 갱신 대기 내용을 보존합니다.
