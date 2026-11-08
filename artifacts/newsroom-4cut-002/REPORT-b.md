# 뉴스룸 4컷 2호 · 구도 개선 결과

- **완료:** [002.webp](../../assets/newsroom-4cut/002.webp)를 같은 캐스트·그림체·사실·숫자, **1200×2000 세로 4단**으로 다시 제작했다. 클로즈업(하니·서킷브레이커) → 전신 액션(지은·급락 미끄럼틀·난간) → 부감(민지·한국/미국 지도) → 어깨 너머 회의(고용 지표·다음 주 준비). 놀람·진땀·결의·미소, 말풍선 **1/2/1/2개**. 회장님 등장 없음.
- built-in **image_gen**, **001·기존002·chibi-sheet-v1 세 참조 동시 사용**. [최종 프롬프트](imagegen-prompt-b.txt). 생성897×1752 → Lanczos1200×2000·WebP quality96 변환만 수행했으며 그림·글자를 별도로 덧칠하지 않았다. [변환·SHA 근거](revision-b/asset-metadata-b.json).
- [비교 이미지](compare-001-002.png)는 **1호 / 2호 첫 시안 / 2호 새 시안** 3열, 3680×2080. 첫 시안은 [002-first.webp](revision-b/002-first.webp)에 원본 바이트로 보존.
- [issues.json](../../assets/data/newsroom-4cut/issues.json)은 **2호 alt의 장면 설명만 변경**. 모든 기존 숫자·사실 문장·출처·제목·발행일·1호 원문 보존. 새 장면 설명을 역치환하면 변경 전 파일 전체와 바이트 일치. JS·DOM·Event·CSS·저장·Cloud·schema·표시버전/cache 변경 없음. 기존 보호7파일 SHA256 일치.
- 매주 쓸 [구도 가이드](../../docs/drafts/newsroom-4cut-composition-guide.md): 급등·급락·횡보·이벤트 주간 레퍼토리와 **같은 구도를 2주 연속 쓰지 않기** 규칙.

## 직접 확대 검수

최종 WebP를 1200px 원본 폭의 [1컷](revision-b/qa-panel-1.png)·[2컷](revision-b/qa-panel-2.png)·[3컷](revision-b/qa-panel-3.png)·[4컷](revision-b/qa-panel-4.png)으로 나누어 육안 대조했다. 제목·대사·경고등·난간·지도 국가명·고용보고서·아래 숫자 자막에서 깨진 한글이나 틀린 필수 숫자를 발견하지 못했다. 숫자는 아래 자막에 모두 수록되어 있다.

| 필수 자막 | 최종 WebP 대조 |
|---|---|
| 코스피 5,059.69 (-11.71%) | 일치 |
| 코스닥 644.27 (-11.06%) | 일치 |
| S&P500 7,376.86 (-2.68%) | 일치 |
| 나스닥 24,579.42 (-3.37%) | 일치 |
| 원/달러 1,356.6원 | 일치 · 서울15:30 병기 |
| 미 고용 +16.5만, 실업률 4.1% | 일치 |
| ※ 정보 정리용이며 투자 권유가 아닙니다. | 그대로 유지 |

주간 등락·11/6 종가 표기, 이틀 연속 급락·장중 서킷브레이커·5,000선 방어 연출도 확인했다. 이번 작업은 제공된 확정 수치를 그대로 사용하는 그림 수정이며 기사·시장 사실을 새로 조사하거나 변경하지 않았다.

## 재실행 검증

Node **24.22.1**, Edge **157.0.4341.42**, 로컬 격리 화면. Node 실행 파일: `C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`.

| 실행 명령 | 결과·근거 |
|---|---|
| `node scripts/hani-newsroom-4cut-230.test.mjs --node` | **7/7 PASS**, 최종 alt 반영 후 실행. `HANI_MAIN_BASELINE=artifacts/newsroom-4cut-002/baseline`으로 Git 호출 방지. 로컬 비교이며 원격 main 증거 아님. [로그](revision-b/test-4cut-node.log) |
| `node scripts/hani-newsroom-4cut-230.test.mjs --browser` | **1/1 PASS**, 날짜·보관함·모달·명암·390/884/1440·저장 검사. 이 시험은 합성 그림 fixture 사용이며 실제 새 그림 검수는 다음 행. [로그](revision-b/test-4cut-browser.log) |
| `node artifacts/newsroom-4cut-002/verify-issue.mjs` | **PASS**, 실제2호·1호 복귀·발행 경계·alt11개 수치·보호7파일·쓰기0. [로그](revision-b/test-issue002.log) |
| `node artifacts/newsroom-4cut-002/revision-b/verify-edge-b.mjs` | **PC1280×1000 / 폰390×844 PASS**, 실제 catalog·새 WebP, 원본 모달·1호 복귀·최신호 복귀·출처10·보조표4. 각 화면 가로넘침0·페이지오류0·검사 중 저장쓰기0·catalog fetch1. [로그](revision-b/test-edge.log)·[실측](revision-b/edge-verification.json) |

Edge runner는 기존 verify-edge.mjs의 **출력 폴더만 revision-b로 변경**, assertion·실행 경로 보존. [검증 파일·입력 해시](revision-b/evidence-identity.json).

- 새 그림 PC: [컴포넌트](revision-b/edge-1280-issue002-component.png) · [화면](revision-b/edge-1280-issue002-viewport.png) · [모달](revision-b/edge-1280-issue002-modal.png)
- 새 그림 폰: [컴포넌트](revision-b/edge-390-issue002-component.png) · [화면](revision-b/edge-390-issue002-viewport.png) · [모달](revision-b/edge-390-issue002-modal.png)
- 위 컴포넌트·폰 모달·3열 비교를 직접 열어 네 컷·하단 자막·화면 배치를 확인했다. 폰 축소 화면의 작은 자막은 원본 확대 검수와 구분한다. 기존 보조표 미국 종가 `미수록` 표시는 그대로이며, 그림·alt에는 정확한 종가가 있다. 해당 parser는 수정하지 않았다.
- 미실행/N/A: Full Candidate·독립 아린/HINA·실제 로그인 계정·Cloud·Production 검증·버전 증가. LIGHT 콘텐츠 변경의 targeted QA이며 배포 완료 아님. 기존 브라우저 시험 부산물은 `artifacts/newsroom-4cut-230/`에 재생성됨.

**인계:** Git 명령·commit·push·merge·배포 없음. 사용자 지정 `hani/newsroom-4cut-002` / `news4cut2`, 앞선 기록상 기준 v2.9.284. Git 금지로 SHA·원격 최신성 새 확인 없음. 서윤이 결과 검토·커밋 후 기존 배포 열차 절차를 진행한다. [인수인계](../../docs/development-history/handoffs/2026-11-08-newsroom-4cut-002-b.md).

**Notion 미반영:** 현황판 읽기는 성공했으나 추가 쓰기는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. [갱신 대기 원고](revision-b/NOTION-PENDING-b.md)를 보존했으며 저장/read-back 완료로 보고하지 않는다.
