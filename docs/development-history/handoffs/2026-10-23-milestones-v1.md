# 2026-10-23 · Milestones v1 (마일스톤) 인수인계

## 작업 식별

- 작업 ID / 제목: milestones-v1 · Life Milestone Archive 첫 버전
- 갱신 시각(KST): 2026-10-23
- 담당 도구 / 검토 담당: 서윤(Claude Code) / 배포 열차 담당 서윤 팀장
- 상태: 구현·targeted test 완료, **회장님 Preview 확인 대기**, 열차 탑승 대기(PR 없음)
- 저장소 / branch / worktree: `hani/milestones-v1` (Claude worktree `optimistic-goldwasser-67c3c9`)
- base SHA: `7a10595f2a0890e63cd04dbc95c057edbbd3d5b0` (origin/main, v2.9.232, 작업 시작 시 fetch로 확인)
- 목표: 대시보드 바로 아래 독립 메뉴 「마일스톤」, Timeline + Archive, 상세, 새 마일스톤 작성 폼, 대시보드 카드 1장, 첫 공식 기록(건강혁명) seed
- 수정 범위: 새 파일 `hani-milestones.js`, `hani-milestones.css`, `scripts/hani-milestones-v1.test.mjs`, `scripts/fixtures/milestones-v1.json`; 기존 파일 연결만 `index.html`(5곳), `hani-main.js`(3줄: pageMeta·showView hook·빠른 이동), `hani-ui-v02992.js`(공식 배너 1개·담당 대사 1줄), `scripts/hani-reviewed-release-baseline.mjs`(승인 fixture 목록에 추가)
- 다른 담당과 겹침: 본사 행동 재설계(hani-office-live.js·data/hani-building/*·office-actions) 파일은 건드리지 않음. `index.html`·`hani-main.js`·`hani-ui-v02992.js`·baseline helper는 열차에서 합칠 때 확인 필요
- 사용자 승인 근거: 2026-10-23 회장님 지시(하니 전무 Spec) "Milestones v1 구현·Targeted Test·Preview 준비" + 같은 대화의 추가 요청 "난이도에 따라 Epic 같은 등급"
- 승인되지 않은 경계: `hani_os_life_v23` 구조, 내부 baseline, migration, Supabase/Cloud schema·write, main merge, 배포

## Scoped Discovery 결과

1. 상위 Navigation canonical owner: `index.html` `#sidebar` 의 `.nav-btn[data-view]` (대시보드는 `nav.nav-home`). CODEMAP에는 navigation feature 없음 → `CODEMAP_MISS`, 코드 검색으로 확인
2. View 전환 owner: `hani-main.js` `showView(id)` (`pageMeta`, 기능별 `enter()` hook)
3. Dashboard card owner: `#home` 섹션. 일보가 쓰는 `[data-ilbo-home]` 슬롯 방식 재사용 → `[data-milestone-home]`
4. 사용자 데이터 read/write owner: `hani-main.js` state / `hani_os_life_v23` + Cloud sync (CRITICAL)
5. 마일스톤을 영구 저장할 **기존 승인 경로: 없음**. 기존 state·Cloud를 넓히거나 새 localStorage 키를 만들어야 해서 승인 필요 → v1은 seed + 화면 안 미리보기(메모리)만
6. 이미지 media owner: `hani-media-core.js`는 books.cover·movies.poster 전용(state·Cloud 연동) → 재사용 불가, `images: []` slot·검증만 준비
7. 반응형/컴포넌트: 기존 토큰 `--text/--panel/--line`, 다크는 `data-finish="midnight-black|titanium-graphite"`, 메뉴마다 공식 배너(`mainCharacterSidebarMenuConfig`)와 담당 대사(`TAB_CHARACTER_LINES`) 필수
8. Risk Tier: NORMAL (새 화면·일반 UI interaction). 저장 기능을 붙이는 다음 단계는 CRITICAL
9. 수정 파일: 위 "수정 범위"
10. 보호 데이터 영향: 없음 (아래 검증)

## MILESTONES V1 PLAN (실제 구현)

- Navigation: `data-view="milestones"`, 대시보드 버튼과 같은 `dashboard-nav` 모양, 부제 「삶의 중요한 변화 기록」
- Data owner: `hani-milestones.js` (`window.HaniMilestones`) — Category/Importance/Grade/Sort config, seed, validate, sorted/filtered, homePick
- Persistence: 없음(seed 고정 + 새 기록은 메모리 미리보기, 새로고침 시 사라짐을 화면에 표시)
- Dashboard: 최신 HISTORIC → 없으면 최신 MAJOR 1장, 대표 지표 3개, 「전체 마일스톤 보기」
- Media: 없음(`images: []`, 경로 메타데이터만 허용, data URI 거부)
- 배너: 기존 공식 배너(`mainCharacterSidebarMenuConfig.milestones`, 하니 전무) — eyebrow "MILESTONES · LIFE ARCHIVE", 제목 "삶에 남은 변화들", 부제 "더 나은 삶을 살기 위해"(배너 부제 26자 규칙), quote·첫 대사 "더 완벽해지기 위해서가 아니라, 더 나은 삶을 살기 위해." 목록 위에 같은 문장을 조용한 글귀(`.ms-motto`)로 고정 표시. **그림은 새 파일 없이 `assets/heroes/organization-226w.webp` 재사용** (배포 파일 한도 때문)

## 난이도 등급 (회장님 추가 요청)

- 중요도(NORMAL/MAJOR/HISTORIC)와 별개인 **선택 항목** `grade`: RARE(레어·꾸준히 쌓아 올린 변화) / EPIC(에픽·큰 노력과 시간이 필요했던 변화) / LEGENDARY(레전더리·삶의 방향을 바꾼 변화)
- Spec의 "게임 Badge 금지"와 맞추려고 글자 라벨로만 조용히 표시(색·빛·애니메이션 없음). 건강혁명 seed = LEGENDARY

## 결과와 증거

- `node scripts/hani-milestones-v1.test.mjs <playwright/index.mjs> <msedge.exe>`
  - Node 11 PASS: seed 원문 값(단위·변화 임의 추가 없음), enum, 중복 ID, before null, 배열 검증, 관련 view 실재(`diet`,`exercise`), 이미지 data URI 거부, 정렬·필터·대시보드 선택, 카드 2~4지표/상세 전체, HTML escape, 빈 상태 문구, 금지 문구 없음, 저장·네트워크·Cloud 코드 없음, baseline 문자열 유지, 중복 static id 없음
  - 실제 Edge 8조건 PASS: 390/412/884/1440 × 밝은(Porcelain)/어두운(Midnight Black), reduced motion. 공식 배너 1개, 대시보드 카드→목록, 필터·정렬, 상세 열기/Escape 닫기·focus 복귀, 관련 탭 이동(diet), 폼 오류 표시·지표 추가/삭제·미리보기 저장, 긴 제목, 가로 넘침 0, 상세 글자 잘림 0, 터치 높이 36px 이상, 중복 DOM id 0, page error 0, `hani_os_life_v23` 값 불변, 마일스톤 코드의 storage write 0(앱의 기존 navigation UI 키만 허용)
- 기존 안전 테스트: `hani-simplify-225`, `hani-nav-groups`, `hani-brand-heroes-218`, `hani-hero-restore`, `hani-theme-white-215`, `hani-reviewed-release-baseline`, `hani-runtime-closure-ilbo`, `hani-ilbo-213` PASS. 마일스톤 연결은 `scripts/fixtures/milestones-v1.json` 승인 fixture로 등록(되돌리면 HEAD 바이트와 정확히 일치함을 생성 시 확인)
- 기존 테스트 3곳 한 줄 수정(검사 완화 아님, 승인 fixture 경유로 통일): `hani-theme-white-215` cache 비교를 `readReviewedCurrentSource('index.html')`로, `hani-hero-restore` delta 검사의 source를 `readReviewedCurrentSource`로(배너 config 전체가 한 hunk라 새 메뉴 추가 시 항상 drift), `hani-reviewed-release-baseline.test` pending 파일 목록에 milestones 3개 추가
- 회귀 비교: index/main/ui를 읽는 Node 테스트를 main worktree와 나란히 실행 — 결과는 아래 "회귀 비교" 절
- Preview 사진: `artifacts/milestones-v1/` (archive·detail·form·dashboard × 390/412/884/1440, archive·detail dark)
- 데이터·저장소·Cloud·schema 영향: 없음. 새 localStorage 키·setItem 없음, fetch 없음
- 표시 버전·`?v=`: 올리지 않음(2.9.232 그대로, §11 열차 규칙). 새 태그 2개는 현재 버전 `?v=2.9.232`
- main / Pages / Production: 해당 없음(미병합)

## 남은 위험 / 미검증

- **배포 파일 수 128/128**: runtime closure가 126 → 128(새 js·css). One-Pass 한도(128)와 같아 **여유 0**. 같은 열차에 새 runtime 파일이 하나라도 더 타면 BLOCK. 열차에서 먼저 확인 필요
- 마일스톤 전용 배너 그림 없음(회사 소개 그림 재사용). 전용 그림은 후속(기존 아트 style ref 필수, 파일 한도 고려)
- 사이드바에서 선택된 대시보드형 버튼의 부제가 흰 글자로 거의 안 보이는 것은 기존 대시보드 버튼과 같은 동작(변경 안 함)
- 실제 회장님 계정·Android 폰·열차 One-Pass/HINA 미검증
- 새로 작성한 마일스톤은 저장되지 않음(의도). 저장은 아래 제안 승인 후

## Milestones Persistence Proposal (승인 필요, 코드 없음)

- storage owner 후보 A: 기존 state 안 `milestones[]` 배열 + 기존 Cloud row 동기화 — `hani_os_life_v23` 구조 확장이라 **CRITICAL·승인 필요**, 백업/복원·Cloud 충돌 규칙 그대로 적용 가능(가장 안전한 장기안)
- 후보 B: 별도 localStorage 키 `hani_milestones_v1` (Street Journal 방식) — 기기 한 곳에만 남고 Cloud 백업 안 됨, 새 setItem이라 승인 필요
- write path: 「미리보기로 남기기」 → validate → (승인된 owner) save. read path: seed + 저장 기록 합치기(같은 ID면 저장 기록 우선은 금지, seed ID는 예약)
- backup/export: A는 기존 백업에 자동 포함, B는 백업 범위 추가 필요
- failure: 저장 실패 시 화면 기록 유지 + 실패 안내, 기존 데이터 rollback 없음
- quota: 이미지 제외 텍스트만 → 기록 1건 수 KB
- migration: A는 빈 배열 기본값만(데이터 변환 없음), B는 없음
- 사진: 별도 media owner 설계 후(원본은 state 밖)

## 회귀 비교

- 방법: `index.html`·`hani-main.js`·`hani-ui-v02992.js`·baseline helper·closure를 읽는 Node 테스트 117개를 이 branch와 base(`7a10595`, 별도 worktree)에서 각각 실행(브라우저 테스트 제외, 각 120초 제한)
- 결과: **117개 모두 base와 같은 결과**(이 branch PASS 82 / base PASS 82, 나머지 35개는 base에서도 동일하게 실패·환경 의존). 1회차에서 `hani-remote-media-219`가 base 시간 초과·branch 실패로 달랐으나 단독 재실행 시 양쪽 모두 PASS(부하로 인한 일시 현상), `hani-staff-floors-214`(본사 방문객 sprite)는 base에서도 간헐 실패

## 2026-10-23 후속 · A안 저장 연결 (회장님 승인)

- 승인 원문(대화): "좋아, 이 계획대로 A안 저장 기능을 만들어줘. 추천한 대로 Cloud 연결됨 상태에서만 저장, 건강혁명 기록에도 코멘트 추가 가능하게." — 범위: `hani_os_life_v23` 안 선택 목록 `milestones` 추가, 추가·수정·삭제, Cloud ON일 때만 저장. **Cloud schema·서버·동기화 규칙·내부 baseline·저장 키 변경 없음**
- 저장 구조: `state.milestones` (기록 그대로 보관). **처음 저장할 때만 생김** — freshState/normalizeState에 기본값을 넣지 않아 업그레이드만으로 저장 바이트·Cloud hash가 바뀌지 않음(기기 간 불필요한 업로드·충돌 방지). 기존 `normalizeState`의 `...(d||{})` 가 목록을 그대로 보존
- `hani-main.js` 4줄: `validateStoredRecords` 목록과 백업 검증에 `milestones` 추가(망가지면 기존 규칙대로 원본 보호), 복원 미리보기 개수, `renderHome`에서 `HaniMilestones.refresh()`(Cloud 수신 후 화면 갱신)
- 쓰기 경로: `hani-milestones.js` `persist()` 하나 → 기존 `save()`(read-back 검증·Cloud 큐). 실패 시 이전 state 객체로 되돌림. 저장 조건은 라운지 게시판과 같은 fail-closed(로그인·원본 보호·복원 보류·Cloud 복구·`cloudRuntime.sync==='ON'`·Local 기준)
- 건강혁명(seed): 코드 기본값 유지, 수정·코멘트 시 같은 ID의 저장본(source `seed`)이 우선 표시. 삭제 불가. 지표 id·featuredMetrics 유지
- 직접 쓴 마일스톤: 수정 시 id·createdAt·images·기존 필드 유지, 삭제는 공통 `confirmRecordDelete` 확인창
- 형식이 맞지 않는 저장 행: 목록에서만 숨기고 원본은 지우지 않음(숨긴 개수 안내)
- 검증(`node scripts/hani-milestones-v1.test.mjs <playwright> <msedge>`): Node 14 PASS(차단 7조건에서 save 호출 0·state 불변, 성공 시 milestones만 교체, 실패·예외 시 같은 객체로 복구, seed override/숨김 보존), 화면 8조건 PASS(실제 save로 저장, 다른 기록 불변, 쓰기는 save 경로의 `hani_os_life_v23`만, Cloud 큐 호출 확인), 저장 시나리오 7개 PASS: 업그레이드 무변경·hash 동일 / Cloud OFF 차단 / 저장→새로고침 read-back·수정 id 유지·seed 코멘트·삭제 / 저장공간 부족 시 복구 / 백업 생성·검증·복원·Cloud fingerprint 반영 / 망가진 목록 원본 보호 / 운영 2.9.232 normalizeState가 목록 보존
- 미검증: 실제 Supabase 왕복(가짜 Cloud로만 확인), 회장님 실제 기록·폰. CRITICAL 등급이라 열차에서 One-Pass·HINA와 배포 후 회장님 폰 저장→다른 기기 read-back 필요

## 2026-10-24 · 배포 열차 탑승 (회장님 지시: "다음 배포 열차에 태워줘. 128 한도는 열차에서 먼저 확인")

- 탑승 branch: `hani/milestones-v1` (base `7a10595` = v2.9.232 main, PR 없음·버전/캐시 태그 미변경, 새 태그는 `?v=2.9.232`)
- 대상 열차: `origin/hani/release-train-20261023` (`d5642fc`, 2.9.233 본사 재설계). 확인 시점 origin/main `d19aa0b`(#339 seed, 본사 데이터·테스트만)
- **배포 파일 수(runtime closure)**: 열차 단독 127 → 마일스톤(js+css 2개) 합치면 129로 **한도 초과**. 그래서 마일스톤 CSS를 `hani-design-system.css` 끝으로 옮겨 새 파일을 `hani-milestones.js` 1개로 줄임(`e1fce31`). **열차+마일스톤 = 128/128, 누락 0, 15,458,086 bytes** (임시 detached worktree에서 실제 merge 후 계산)
- 여유 0: 이 열차에 새 runtime 파일이 하나라도 더 타면 BLOCK
- merge 충돌(기능 코드 없음, 도구 2개만): `scripts/hani-reviewed-release-baseline.mjs`, `scripts/hani-reviewed-release-baseline.test.mjs`. 열차 쪽(ours)을 기준으로 아래 두 곳만 바꾸면 됨(임시 worktree에서 검증 완료)
  - helper: `const milestones=JSON.parse(fs.readFileSync(new URL('./fixtures/milestones-v1.json',import.meta.url),'utf8'));` 추가 후 `pendingApprovedConnections=[...office.changes,...milestones.changes].map(`
  - test: pending 파일 목록 기대값을 `['assets/data/office-actions-216.json','assets/data/office-actions-221.json','hani-design-system.css','hani-main.js','hani-office-live.js','hani-ui-v02992.js','index.html']`로
  - 열차 release 후에는 `milestones-v1.json`을 approvedReleases(해당 release SHA)로 옮기는 기존 절차
- 해결본에서 실행한 테스트: reviewed-release-baseline·theme-white-215·hero-restore·simplify-225·nav-groups·runtime-closure-ilbo·milestones-v1(Node 14 + 화면 8조건 + 저장 시나리오 7) PASS. `brand-heroes-218`은 `data/hani-building/art-map-v1.json` 차이로 FAIL이나 **열차 단독에서도 같은 FAIL**(본사 재설계 쪽, 마일스톤 무관)
- 서버 Edge Function·설정 동반 배포: 없음. Cloud schema 변경 없음
- 위험 등급: CRITICAL(`hani_os_life_v23`에 선택 목록 추가) → 열차 One-Pass·HINA 필수, 배포 후 회장님 폰에서 마일스톤 저장 → 다른 기기 read-back 필요
- 승인 범위: Milestones v1 구현(10/23), A안 저장·Cloud ON 전용·건강혁명 코멘트(10/23), 열차 탑승(10/24). main merge·배포 실행은 열차 Preview 후 회장님 승인 필요

## 다음 담당에게

- 먼저 읽을 파일: `hani-milestones.js`, 이 문서, `scripts/fixtures/milestones-v1.json`
- 다음 한 가지 행동: 회장님 Preview 확인 → 열차 탑승 시 closure 128 한도 먼저 확인
- 필요한 회장님 결정: 전용 배너 그림 제작 여부 (저장 방식은 2026-10-23 A안 승인·구현 완료)
- 열차 담당 참고: release 후 `hani-reviewed-release-baseline.mjs`의 pending 목록에서 `milestones-v1.json`을 approvedReleases로 옮기는 것은 기존 join fixture와 같은 절차
