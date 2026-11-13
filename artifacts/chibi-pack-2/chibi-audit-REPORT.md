# HANI OS 치비툰 활용 디자인 점검

1. 성민 대표님, 주요 메뉴에는 이미 직원 그림 배너가 있어 **빈 화면·완료·대기·오류 안내**에 치비를 더하는 편이 효과적입니다.
2. 메뉴 37개·뷰 38개와 공통 상태를 조사하고, 직원 담당에 맞춘 활용 후보 **24개**를 정리했습니다.
3. **1탄은 기존 표정 시트를 재사용**하면 새 그림·새 배포 파일 없이 시작할 수 있습니다.
4. 2탄은 새 장면 4개를 시트 1장으로, 3탄은 생일·기념일과 월간 치비툰을 별도 기능으로 제안합니다.
5. 운영 파일·데이터는 바꾸지 않았습니다. **Edge 촬영은 Windows 접근 거부로 차단**, Notion 기록은 자동 승인 거절로 미반영입니다.

## 점검 범위와 읽는 방법

- 날짜·담당: 2026-11-12 KST / Codex. 점검과 제안만 수행했습니다.
- 작업 공간: `tl288`, 현재 branch `hani/tooling-288`, HEAD `3e1bc76e2457d01c6f44df88e679a127ce57b7fd`.
- 전달받은 운영 기준과 로컬 `origin/main` 참조: `7769fbe0fedd760f39493af3a97fe7b377977acb`, v2.9.289. 현재 HEAD와 운영 기준 SHA는 다릅니다. **이 보고서는 현재 작업 공간의 파일 감사**이며, 두 SHA의 전체 동일성이나 원격 최신성을 검증한 보고서는 아닙니다.
- Git 명령은 실행하지 않았습니다. branch·SHA는 `.git`의 연결 파일과 ref를 읽어 확인했습니다. 작업 중 branch 변경·merge·rebase도 없습니다.
- `index.html`의 표시·캐시 기준은 2.9.289입니다. 공통 UI 소유 파일은 `hani-ui-v02992.js?v=2.9.289`, HTML에서 마지막으로 선언된 스크립트는 `hani-launch-greeting.js`입니다. **실제 브라우저 로딩은 미검증**입니다.
- `ie290`의 이음 입사 작업은 조사·제안 대상에서 제외했습니다. 이 작업 공간의 직원 명부는 19명입니다.
- [과제](../../../chibi-audit-task.md), [AGENTS.md](../../AGENTS.md), [개발 허브](../../docs/development-history/START-HERE.md), [현황](../../docs/development-history/CURRENT.md), [CODEMAP](../../dev-center/codemap.json)을 먼저 확인했습니다. 과제 파일의 한글은 UTF-8로 정상입니다.
- CODEMAP의 대시보드·투자·뉴스룸·학습·여행·독서·본사·보고서 owner를 출발점으로 삼았습니다. 치비 도움말·미룬 일·일보·마일스톤·일부 신규 메뉴는 **CODEMAP_MISS**로 구분하고 실제 메뉴와 소스 검색으로 보완했습니다.

여기서 **치비**는 머리가 크고 몸이 작은 캐릭터 그림, **직원 그림**은 일반 비율의 웹툰 장면·프로필까지 포함합니다. 기존 그림이 있다는 말과 현재 화면에서 정상 표시된다는 말은 구분합니다. 아래 현황은 **소스 연결과 파일 실재 확인** 기준입니다.

## 1. 화면별 현황

### 대부분의 메뉴에 공통으로 있는 것

| 공통 요소 | 현재 구성과 파일 | 해석 |
| --- | --- | --- |
| 메뉴 상단 직원 그림 | [hani-ui-v02992.js](../../hani-ui-v02992.js)의 `mainCharacterSidebarMenuConfig` → `mainCharacterBannerConfig` → `mountSkeletons`가 메뉴별 장면을 붙임. 프로필은 [assets/profiles](../../assets/profiles) | 아래 표의 배너 파일이 실제 소유 경로. 일반 웹툰이 많으므로 전부 치비로 세지 않음 |
| 떠 있는 치비 도움말 | 같은 파일의 `HaniHelperBot`, [hani-style-08.css](../../hani-style-08.css)의 `#haniHelperBot`. 직원은 [낮 단체 치비](../../assets/launch/chibi-launch-v1-day.webp)를 기존 좌표·마스크로 보여줌. 동물 당번은 기존 sprite 경로 사용 | 특정 메뉴에 치비가 전혀 없다고 단정하면 안 됨. 로그인·모달 등에서는 숨김. 화면마다 새 도우미를 추가할 이유가 적음 |
| 직원 한마디·작은 얼굴 | [hani-main.js](../../hani-main.js)의 `setBanner`와 [hani-ui-v02992.js](../../hani-ui-v02992.js)의 캐릭터·배너 처리. [프로필 썸네일](../../assets/profiles/thumb) | 작은 프로필은 치비와 별개. 최신 메뉴 배너와 과거 `pageAgentImage`의 담당이 다른 곳은 최신 배너와 정식 명부를 함께 확인 |
| 입장 후 짧은 단체 인사 | [hani-launch-greeting.js](../../hani-launch-greeting.js), [CSS](../../hani-launch-greeting.css), [낮](../../assets/launch/chibi-launch-v1-day.webp)·[밤](../../assets/launch/chibi-launch-v1-night.webp) 그림. `index.html`의 `launchGreetingAssets`에서 연결 | 로그인 화면 자체와 별개. 기존 기능은 하루 표시 선호를 저장하므로, 장식 제안 때문에 이 저장 로직을 바꿀 필요 없음 |

아래 **배너 있음**은 위 공통 UI의 직원 장면입니다. **전용 치비 없음**은 목록·폼·상태 영역에 그 화면 전용 치비 표현을 찾지 못했다는 뜻입니다. 로그인 후에는 위 공통 도움말도 조건에 따라 표시됩니다.

| 화면 · 뷰 ID | 지금 그림이 있는지 | 배너/대표 그림 파일 | 본문·하위 화면의 치비/캐릭터 |
| --- | --- | --- | --- |
| 대시보드 · `home` | 직원 웹툰 배너 있음 | [hani-team-office-active-v2.jpg](../../assets/team/hani-team-office-active-v2.jpg) + [선택 계절 그림](../../assets/seasonal-collection) | 생활시장 그림·직원 대화/프로필 있음. 전용 빈 상태 치비 없음 |
| 투자 · `investment` | 직원 웹툰 배너 있음 | [investment-226w.webp](../../assets/heroes/investment-226w.webp) | 투자 상단 웹툰·관련 뉴스 그림. 전용 상태 치비 없음 |
| HANI 투자 리포트 · `investmentCommittee` | 직원 웹툰 배너 있음 | [investment-market-room-v1.webp](../../assets/banner-preview-v1/investment-market-room-v1.webp) | [스트리트 저널](../../hani-street-journal.js)의 하니·지은·민지·서윤 치비 시트 있음. 종목/월간 리포트의 상태별 치비는 없음 |
| 뉴스룸 · `newsroom` | 직원 웹툰 배너 있음 | [newsroom-226w.webp](../../assets/heroes/newsroom-226w.webp) | [주간 4컷](../../hani-newsroom-4cut.js) 001·002 및 확대/지난 호 있음 |
| 자산 · `asset` | 직원 웹툰 배너 있음 | [asset-226w.webp](../../assets/heroes/asset-226w.webp) | 전용 빈 상태·오류 치비 없음 |
| 자산 업데이트 · `investmentIntake` | 직원 웹툰 배너 있음 | [investmentIntake-226w.webp](../../assets/heroes/investmentIntake-226w.webp) | 검토·미리보기 중심. 전용 상태 치비 없음 |
| 가계부 · `ledger` | 직원 웹툰 배너 있음 | [ledger-226w.webp](../../assets/heroes/ledger-226w.webp) | 입력·월별 결산·소비 리뷰에는 전용 치비 없음 |
| 계체량 측정 · `diet` | 직원 웹툰 배너 있음 | [nutrition-tracking-v1.webp](../../assets/banner-preview-v1/nutrition-tracking-v1.webp) | 수치·기간 그래프 중심. 전용 상태 치비 없음 |
| 헬스클럽 · `exercise` | 직원 웹툰 배너 있음 | [exercise-226w.webp](../../assets/heroes/exercise-226w.webp) | 활동·운동 기록 중심. 전용 상태 치비 없음 |
| 미룬 일 · `procrastination` | 전용 치비툰 있음 | [pb-chibi-sheet-v1.webp](../../assets/procrastination/pb-chibi-sheet-v1.webp) | [미룬 일 owner](../../hani-procrastination-board.js)·[CSS](../../hani-procrastination-board.css)의 7업무/5직원/6표정 치비툰 |
| 할 일 · `tasks` | 직원 웹툰 배너 있음 | [tasks-218.webp](../../assets/heroes/tasks-218.webp) | 목록·입력·완료 효과는 있으나 전용 상태 치비 없음 |
| 캘린더 · `calendar` | 직원 웹툰 배너 있음 | [calendar-218.webp](../../assets/heroes/calendar-218.webp) | 기존 캘린더/연결 안내 중심. 전용 치비 없음 |
| 인포데스크 · `intake` | 직원 웹툰 배너 있음 | [infodesk-ai-desk-v1.webp](../../assets/banner-preview-v1/infodesk-ai-desk-v1.webp) | 유나 접수·입력 UI. 전용 대기·실패 치비 없음 |
| HANI GROUP · 본사 사무실 · `agentReview` | 직원 웹툰 배너 있음 | [ai-approval-boardroom-v1.webp](../../assets/banner-preview-v1/ai-approval-boardroom-v1.webp) | [본사 owner](../../hani-office-live.js)·[CSS](../../hani-office-live.css)의 배우/말풍선·v2/v3 sprite·남매/동물, [책상 피규어](../../hani-desk-mascots.js) 있음 |
| 컨퍼런스 룸 · 월간/분기/연간 · `monthlyReport` | 직원 웹툰 배너 있음 | [conference-room-reports-v1.webp](../../assets/banner-preview-v1/conference-room-reports-v1.webp) | 하니 프로필·발표/보고 UI 있음. 표지·월말 상태별 치비는 없음 |
| 테마 스튜디오 · `aura` | 직원 캠페인 그림 있음 | [테마 화면의 그림 연결](../../index.html) | [계절 캠페인](../../assets/seasonal-collection/aura-season-campaign-v1.webp), [계절4종](../../assets/seasonal-collection), [직원 캠페인](../../assets/design-system-v1/hani-galaxy-characters-v2.png) 있음. 전용 상태 치비 없음 |
| 회사 소개 · 개요/구성원/앨범/AI팀 · `organization` | 직원 웹툰 배너 있음 | [organization-226w.webp](../../assets/heroes/organization-226w.webp) | [조직도/팀 배너](../../hani-organization-hub.js)·[M9+MIR 앨범](../../hani-character-archive.js)·[서윤 특별 컷](../../assets/character-archive/seoyun-m9-special-cut.webp) 있음 |
| AI 업무 현황 · `aiWork` | 직원 웹툰 배너 있음 | [aiWork-218.webp](../../assets/heroes/aiWork-218.webp) | 개발 직원 프로필·업무 카드 있음. 전용 상태 치비 없음 |
| HANI 일보 · `ilbo` | 직원 웹툰 배너 있음 | [ilbo-226w.webp](../../assets/heroes/ilbo-226w.webp) | [일보 owner](../../hani-ilbo.js)·[만화5장/제호](../../assets/hani-ilbo), 직원 아바타 있음 |
| 마일스톤 · `milestones` | 직원 웹툰 배너 있음 | [milestones-226w-a3.webp](../../assets/heroes/milestones-226w-a3.webp) | [마일스톤 owner](../../hani-milestones.js)의 [v2 치비 카드 12장면](../../assets/milestone-cards/milestone-card-sheet-v2.webp)·직원 얼굴 있음 |
| HANI 라운지 · `board` | 직원 웹툰 배너 있음 | [company-board-community-v1.webp](../../assets/banner-preview-v1/company-board-community-v1.webp) | [라운지 owner](../../hani-board.js)의 작성자 얼굴·단체사진·퀸 포스터·관련 만화 링크 있음. 빈 상태 전용 치비 없음 |
| 설정·데이터 · 사내 규칙/목표 설정 · `settings` | 직원 웹툰 배너 있음 | [settings-data-vault-v1.webp](../../assets/banner-preview-v1/settings-data-vault-v1.webp) | 배너·사내 규칙 얼굴/목표 진행표 중심. 설정·백업·목표 빈 상태의 전용 치비 없음 |
| 성민의 서재 · `reading` | 직원 웹툰 배너 있음 | [reading-226w.webp](../../assets/heroes/reading-226w.webp) | 배너에 하루·윤슬. 독서 목록 빈 상태의 전용 치비 없음 |
| 공부 · 프로젝트/퀴즈/오답 · `study` | 직원 웹툰 배너 있음 | [study-226w.webp](../../assets/heroes/study-226w.webp) | 히나·윤슬 배너. 프로젝트/출제/오답·결과 전용 치비 없음 |
| 낭만 캠퍼스 라이프 · `university` | 직원 웹툰 배너 있음 | [university-226w.webp](../../assets/heroes/university-226w.webp) | 히나 배너. 학기/과목/강의 입력의 전용 치비 없음 |
| 자격증 · `certificate` | 직원 웹툰 배너 있음 | [certification-roadmap-v1.webp](../../assets/banner-preview-v1/certification-roadmap-v1.webp) | 히나 배너. 시험·목표 일정의 전용 치비 없음 |
| Wish-list · `wishlist` | 직원 웹툰 배너 있음 | [wishlist-planning-v1.webp](../../assets/banner-preview-v1/wishlist-planning-v1.webp) | 하루·수연 배너. 링크 입력·비교·빈 목록의 전용 치비 없음 |
| 여행 · 목록/일정/맛집·명소 · `travel` | 직원 웹툰 배너 있음 | [travel-route-planning-v1.webp](../../assets/banner-preview-v1/travel-route-planning-v1.webp) | 수연 배너. 여행 상세·일정·맛집/명소의 전용 치비 없음 |
| 시청 아카이브 · `movie` | 직원 웹툰 배너 있음 | [hina-cinema-canonical.webp](../../assets/design-system-v1/hina-cinema-canonical.webp) | 민지 담당 감상 장면. 파일명에 hina가 있으나 현행 설정의 담당은 민지. 목록 전용 치비 없음 |
| 스포츠 · 4개 팀 하위 화면 · `game` | 직원 웹툰 배너 있음 | [hani-sports-hero-v1.webp](../../assets/sports/hani-sports-hero-v1.webp) | 수연·동료들의 스포츠 장면과 팀 로고 있음. 결과 없음·비시즌 전용 치비 없음 |
| 일기 · `diary` | 직원 웹툰 배너 있음 | [diary-night-desk-v1.webp](../../assets/banner-preview-v1/diary-night-desk-v1.webp) | 하루의 밤 책상 장면. 일기 본문·빈 상태의 전용 치비 없음 |
| 업무 보조 · `work` | 직원 웹툰 배너 있음 | [tasks-kanban-v1.webp](../../assets/banner-preview-v1/tasks-kanban-v1.webp) | 수아 업무 보드 장면. 업무 입력·빈 목록의 전용 치비 없음 |
| Drive · `drive` | 직원 웹툰 배너 있음 | [drive-archive-v1.webp](../../assets/banner-preview-v1/drive-archive-v1.webp) | 유나·수아 문서 보관 장면. 연결·오류·빈 폴더의 전용 치비 없음 |
| 배포센터 · `deployment` | 직원 웹툰 배너 있음 | [deployment-218.webp](../../assets/heroes/deployment-218.webp) | 서윤·유리·아린 배너, 히나 QA 프로필 있음. 실패·승인 상태 전용 치비 없음 |
| AI 주간 예산 · `aiBudget` | 직원 웹툰 배너 있음 | [aiBudget-218.webp](../../assets/heroes/aiBudget-218.webp) | 서윤·도연 배너와 서비스 아이콘. 사용량·가져오기 상태의 전용 치비 없음 |
| 개발 보고서 · `geminiReports` | 직원 웹툰 배너 있음 | [geminiReports-218.webp](../../assets/heroes/geminiReports-218.webp) | 세린·도연 배너. 개발 보고서의 전용 치비 본문은 확인되지 않음 |
| 개발센터 · `dev` | 직원 웹툰 배너 있음 | [dev-218.webp](../../assets/heroes/dev-218.webp) | 개발팀 배너. 로드맵/개발 상태의 전용 치비 없음 |
| 쇼핑 · 구버전 호환 뷰(메뉴 없음) · `shopping` | 전용 그림 없음 | — | 호환용 generic 뷰. 전용 배너 설정·본문 치비 없음 |

회사 소개의 `organization/overview`, `people`, `archive`, `aiTeam`은 같은 `organization` 뷰의 탭입니다. `characterArchive`·`aiTeam` 구 경로도 `organizationRoute`에서 이곳으로 보냅니다. `policy`는 `settings/policy`로 연결됩니다. 별도의 메뉴가 더 있는 것으로 중복 집계하지 않았습니다. 투자 리포트의 종목·월간·스트리트 저널, 컨퍼런스 룸의 월간·분기·연간, 스포츠의 양키스·KIA·레알 마드리드·Dplus도 각 행 안에서 점검했습니다.

### 빈 상태·대기·알림 등 공통 화면

| 화면·상태 | 지금 그림이 있는지 / 실제 소유 경로 | 추가 기회와 경계 |
| --- | --- | --- |
| 로그인·비밀번호 재설정·로그인 실패 | **직원 프로필 있음. 치비 전용 로그인 아트는 연결 없음.** [index.html](../../index.html) `#loginGate`, [hani-main.js](../../hani-main.js) `randomizeLoginCharacter`가 `agentImages` 사용. 계절 그림도 연결 | 아래 후보 19. 로그인 전에는 공통 치비 도움말이 숨겨짐. 폼·상태문·비밀번호 복구 동작 보존 |
| 첫 기록 없음 / 조건에 맞는 결과 없음 | 주요 목록은 글 위주. [hani-main.js](../../hani-main.js)의 `renderTasks`, `renderLedgerPractical`, `renderReading`, `renderMovies`, 여행 renderer, [학습 owner](../../hani-study-v02984.js)의 `.study-main-empty`, `.study-empty` | 아래 1~9·21. **기록 없음·검색 결과 없음·불러오기 실패는 서로 다른 상태** |
| 목표 없음·실적 없음·원본 검증 대기 | [hani-goal-progress.js](../../hani-goal-progress.js)에서 설명문과 비교표를 표시. 전용 치비 없음 | 아래 10·11. 미기록을 실패로 해석하거나 진행 중인 목표를 조기 실패 처리하면 안 됨 |
| 목표·할 일 완료 순간 | [hani-ui-v02992.js](../../hani-ui-v02992.js)의 `completion`, `celebrate`에 기존 축하 문구·색종이 있음. 이 효과 자체에는 새 캐릭터 이미지 없음 | 아래 10·12. 이미 성공한 실행 경로에 그림만 보완. 별도 성공 판정·중복 이벤트를 만들지 않음 |
| 데이터·화면 로딩 / AI 응답·자료 분석 중 | 상태문·기존 대기 UI 중심. `mountSkeletons`라는 이름의 함수는 **메뉴 배너를 구성**하는 함수이므로 전용 로딩 치비로 세지 않음 | 아래 13. 진행률·완료 예상 시간을 그림만 보고 만들어내지 않음 |
| 저장 중·저장 성공 | [hani-main.js](../../hani-main.js)의 `#saveStateBadge`, `#lastSavedLabel`, `toast`, [index.html](../../index.html) `#toast`. 저장 알림 자체는 텍스트 | 아래 14. Local 저장과 Cloud 반영의 성공을 구분 |
| 오류·오프라인·동기화 충돌 | `#cloudStatePill`, `#cloudMessage`, 로그인·Cloud 상태 처리 등 글 위주. 별도 오류 치비 없음 | 아래 15. 원인·다음 행동·원본 보존 안내보다 그림을 크게 만들지 않음 |
| 월말 정산·보고서 표지 | 컨퍼런스 룸 배너와 하니 프로필은 있음. 월간 보고 본문·표지의 상태별 치비는 없음 | 아래 16·24. 확정되지 않은 숫자를 만화 대사로 확정하지 않음 |
| 직원 생일 | [hani-office-live.js](../../hani-office-live.js)의 `staffBirthdays`·`birthdayPerson`·`ownerEvents.birthday`·`eventLines.birthday` 있음. **해당일·출근 조건에 맞으면 대표님 이벤트의 생일 축하 버튼이 보이는 구조**. 기존 배우·말풍선·이모지 사용 | 생일 기능을 처음부터 새로 만드는 제안이 아님. 아래 17은 그림 보완, 23은 다른 화면까지 확장하는 별도 기능 |
| 기념일·삶의 중요한 변화 | [hani-milestones.js](../../hani-milestones.js)의 치비 카드 시트와 직원 얼굴 있음. 본사의 계절 장식은 `officeEventCalendar`의 크리스마스 항목과 [xmas.webp](../../assets/office-season/xmas.webp) | 마일스톤 카드와 시즌 장식이 이미 있는 점을 반영. 새 기념일 자동 저장·새 알림 시스템은 제안하지 않음 |
| 새 소식·알림 배너 | 기존 치비 도움말의 `news()`·점 표시, 저장 상태 배지, 화면별 알림문 있음 | 아래 20. 도움말 슬롯을 활용하고 새 떠 있는 버튼·알림층을 늘리지 않음 |
| 삭제·초기화·복원·권한 승인 | 텍스트·확인 UI 중심. 설정의 일반 배너는 별개 | 장난·축하 치비 우선 적용 대상에서 제외. 기존 확인 문구와 위험 설명을 가리지 않음 |

### 기존 치비 활용의 확정 목록

소스 검색으로 처음 안내받은 항목 외에 **공통 치비 도움말·입장 인사·마일스톤 치비 카드**를 추가 확인했습니다. 아래는 그림이 실제 연결된 주요 경로와, 자산만 있는 경로를 구분한 목록입니다.

| 종류 | 파일·소유자 | 확인한 내용 |
| --- | --- | --- |
| 미룬 일 치비툰 | [JS](../../hani-procrastination-board.js)·[CSS](../../hani-procrastination-board.css), [pb-chibi-sheet-v1.webp](../../assets/procrastination/pb-chibi-sheet-v1.webp) | 나은·히나·지은·하루·민지 5명 × 6칸. 0~4단계와 기록 미확인. 7개 업무 카드에서 재사용하며 오늘 기록에는 감사 문구 |
| 스트리트 저널 | [JS](../../hani-street-journal.js)·[CSS](../../hani-street-journal.css), [chibi-sheet-v1.webp](../../assets/street-journal/chibi-sheet-v1.webp) | **운영 CSS는 개별 16장을 직접 쓰는 대신 5×2 시트의 10포즈 사용**. 하니3·지은3·민지3·서윤1 |
| 뉴스룸 시장 4컷 | [hani-newsroom-4cut.js](../../hani-newsroom-4cut.js), [호수 목록](../../assets/data/newsroom-4cut/issues.json), [001](../../assets/newsroom-4cut/001.webp)·[002](../../assets/newsroom-4cut/002.webp) | 주간 만화 2장. 목록·본문·확대 화면 연결. 기사 대사·맥락이 있어 일반 알림용 얼굴로 떼어 쓰기에는 부적합 |
| 본사 직원·방문객·동물·남매 | [hani-office-live.js](../../hani-office-live.js)·[CSS](../../hani-office-live.css), [v2 manifest](../../assets/sprites-v2/manifest.json)·[v3 manifest](../../assets/sprites-v3/manifest-v3.json), [동행](../../assets/office-companions/companions-v1.webp)·[남매](../../assets/office-companions/kids-v2.webp) | v2 이미지 27개, v3 이미지 34개. v3 manifest도 34개 entry. 동행 폴더는 이전 kids-v1 포함 이미지 3개. 얼굴 한 장이 아닌 포즈 시트 |
| 책상 동물 피규어 | [JS](../../hani-desk-mascots.js)·[CSS](../../hani-desk-mascots.css), [배치표](../../assets/data/desk-mascots-v1.json), [그림 19장](../../assets/desk-mascots) | 직원별 책상 소품. **직원 본인의 치비 얼굴이 아니라 각자의 동물 마스코트**. 유나는 다람쥐 그림임을 직접 확인 |
| 조직도·캐릭터 앨범 | [hani-organization-hub.js](../../hani-organization-hub.js), [앨범 JS](../../hani-character-archive.js)·[데이터](../../hani-character-archive-data.js), [프로필](../../assets/profiles), [앨범 그림](../../assets/character-archive) | 일반 직원 프로필·단체 장면과 치비 특별 컷을 구분. 앨범 이미지 8개. [서윤 특별 컷](../../assets/character-archive/seoyun-m9-special-cut.webp)은 개구리 회장님과 하이파이브 |
| HANI 일보 만화·M9 호외 | [hani-ilbo.js](../../hani-ilbo.js), [일보 이미지](../../assets/hani-ilbo) | 정기 `001-comic.webp`~`004-comic.webp`·`extra-m9-comic.webp`의 만화 5장과 제호 1장. 원래 기사와 캡션을 유지해서 감상하는 자산 |
| 입장 인사·공통 도움말 | [입장 JS](../../hani-launch-greeting.js), [UI JS](../../hani-ui-v02992.js), [낮](../../assets/launch/chibi-launch-v1-day.webp)·[밤](../../assets/launch/chibi-launch-v1-night.webp) | 로그인 후 인사에는 단체 그림 전체, 도움말에는 직원 얼굴 일부를 기존 좌표로 사용 |
| 마일스톤 수집 카드 | [hani-milestones.js](../../hani-milestones.js), [현행 v2 시트](../../assets/milestone-cards/milestone-card-sheet-v2.webp) | 4×3의 12장면. 건강·재무·투자·학습·커리어·생활·여행·관계·프로젝트 등. 이전 v1도 저장소에 있으나 현재 owner는 v2 참조 |
| 계절·메뉴 웹툰·로그인 프로필 | [UI JS](../../hani-ui-v02992.js), [테마 화면](../../index.html), [시즌 그림](../../assets/seasonal-collection), [메뉴 그림](../../assets/heroes) | 주요 화면의 일반 직원 그림. 치비와 혼동하지 않도록 화면 표에 별도 표기 |
| 아직 운영 연결을 찾지 못한 치비 | [개별 표정 16장](../../assets/street-journal/chibi), [인사 그림 4장](../../assets/launch/greeters) | 파일은 존재. 운영 JS/CSS/HTML에서 개별 경로 참조를 찾지 못함. 재사용하면 배포 포함 경로도 함께 확인해야 함 |

검색은 `rg --no-ignore`로 운영 JS/CSS/HTML의 `chibi`, `치비`, `mascot`, `sprite`, `toon`, `만화`, 그림 경로를 교차 확인했습니다. `--no-ignore` 없이 하는 기본 검색은 이 작업 공간의 일부 운영 파일을 놓칠 수 있어 보완했습니다. 이어 그림 목록·CSS 좌표·manifest·HTML의 그림 보관 template를 대조했습니다. 이 과정에서 assets와 개발용 목업의 존재를 운영 화면 사용으로 잘못 세지 않았습니다.

## 2. 활용 후보 24개

**S**는 기존 그림과 기존 상태를 재사용하는 작은 표시 변경, **M**은 새 장면 1~4개, **L**은 화면 조립·화면 간 이벤트 연결 등 새 기능이 필요한 제안입니다. 새 그림 장수는 장면 수이며, 한 시트로 묶으면 파일 수는 줄어듭니다. 모두 **구현 전 제안**입니다.

아래의 **저장 변화 없음**은 `localStorage`·Cloud·schema·보호 저장소의 새 쓰기가 필요 없다는 설계 조건입니다. 기존 성공·실패·로딩 상태를 읽어 표시하고, 필요한 일회성 표시는 문서 메모리 안에서만 처리합니다. 영구 저장·새 필드를 요구하는 범위로 커지면 이 제안의 경계를 벗어납니다.

| 번호 | 화면·위치 | 직원·표정·소품 / 보여줄 장면 | 기대 효과 | 크기·새 그림 | 저장 변화 | 주요 위험·배포 파일 영향 |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | 할 일 `#taskList`의 기록 없는 자리 | 유나의 **기존 다람쥐 마스코트**가 작은 메모 옆에서 기다림. 직원 얼굴과 혼동하지 않게 이름 표기 | 첫 입력 부담을 줄이고 할 일 추가 위치 안내 | S · 0장 | 없음 | 기존 그림 72px이므로 32~48px로 사용. 독립 포함 시 파일 +1, 약 7.8KiB. 입력 버튼을 밀지 않음 |
| 02 | 가계부의 선택 월 기록 없음 | 지은의 기존 생각 포즈, 옆에는 기존 월 표제·가계부 안내. “선택한 달의 기록부터 확인해요” | 미입력을 잔액 0원으로 오해하지 않게 도움 | S · 0장 | 없음 | 기존 저널 시트 재사용이면 +0파일. 금액·입력 안내를 가리지 않음 |
| 03 | 자산·투자 내역 또는 월별 기준자료 없음 | 지은의 기존 생각 포즈 옆에 장부·자료 기준 텍스트. 자료 없음과 최신성 안내를 함께 표시 | 처음 쓰는 순서와 자료 기준을 이해 | S · 0장 | 없음 | 기존 저널 시트 +0파일. 수익을 보장하는 웃음·색상 연출은 피하고 “확인 필요” 문구 유지 |
| 04 | 계체량·헬스클럽의 첫 기록 안내 | 나은의 미룬 일 시트 **물음표 포즈**. 체중계·물병과 “한 번의 기록부터” | 낮은 부담으로 첫 기록 유도 | S · 0장 | 없음 | 시트는 1.33MiB. 작은 그림 하나 때문에 첫 로딩이 무거워질 수 있어 화면 진입 후 필요할 때 사용. 미기록을 0보·실패로 처리하지 않음 |
| 05 | 서재의 비어 있는 독서 목록 | 윤슬이 책갈피를 내미는 새 그림, 안경·옆땋은 머리·책. 기존 독서 담당 하루와 협업 표시 | 어떤 책부터 적을지 안내·독서 동기 | M · 1장 | 없음 | 목표 30~60KiB. 표지·책 제목보다 작게. 다른 신규 장면과 시트로 묶으면 파일 증가 축소 |
| 06 | 시청 아카이브의 빈 감상 목록 | 민지의 기존 생각 포즈, 옆에는 기존 감상 메모 제목. “기억나는 작품 한 편부터” | 첫 감상 기록의 문턱 완화 | S · 0장 | 없음 | 저널 시트 +0파일. 작품 평가를 캐릭터의 확정 평가처럼 표시하지 않음 |
| 07 | 공부·대학교·자격증의 프로젝트·과목 없음 | 히나가 토끼를 안고 손 흔드는 기존 인사 그림. 문제를 만들기 전 프로젝트 선택 안내 | 학습 시작 순서 이해 | S · 0장 | 없음 | 인사 그림 약 32.7KiB, 포함 경로 추가 시 +1파일. 연보라 배경 있는 정사각형이므로 투명 컷처럼 쓰지 않음 |
| 08 | 퀴즈 결과의 정답·오답 요약 옆 | 히나의 “잘했어요”·“다시 같이 봐요” 2표정, 노트·빨간 펜 | 오답을 혼내지 않는 복습 동기 | M · 2장 | 없음 | 합계 목표 60~120KiB. 정답·해설·점수보다 그림이 앞서지 않음. 점수와 정답 판정은 기존 owner 유지 |
| 09 | 여행 목록·일정이 없는 자리 | 수연이 접힌 지도와 티켓을 펼치며 손짓하는 새 그림 | 여행 계획을 시작할 위치 안내 | M · 1장 | 없음 | 목표 30~60KiB. 미정 날짜를 확정 일정처럼 보여주지 않음 |
| 10 | 검증된 목표 달성 요약·기존 축하 효과 옆 | 나은·히나가 각자의 건강·학습 목표를 축하하는 2장면 | 달성 경험을 기억하고 다음 행동으로 연결 | M · 2장 | 없음 | 60~120KiB 목표. 기존 `completion` 흐름에서만 보조 표시. 목표 없음·미검증 실적·단순 저장을 달성으로 판정하지 않음 |
| 11 | 기간 종료 후 목표 미달 요약 옆 | 하니의 기존 생각 포즈, 작은 계획 메모. “다음 기간에 조정할 지점부터” | 실패 부담을 줄이고 원인·다음 행동을 읽게 함 | S · 0장 | 없음 | 저널 시트 +0파일. 분모·목표 유효성·기간 종료가 확인된 **기존 요약**에서만 사용. 기분으로 미달 계산을 새로 만들지 않음 |
| 12 | 할 일 체크 완료 순간 | 유나가 클립보드를 닫고 안도하는 새 그림 | 작은 완료의 즐거움 | M · 1장 | 없음 | 30~60KiB 목표. 기존 성공 경로에서만 1회 표시. 체크박스 재바인딩·별도 타이머·성공 중복 알림 위험 |
| 13 | 인포데스크 분석·불러오는 중 표시 옆 | 유나가 서류를 정리하는 차분한 새 그림 | 대기 중임을 쉽게 이해 | M · 1장 | 없음 | 30~60KiB 목표. 정지 그림 우선, 취소·오류 전환을 가리지 않음. 가짜 진행률·새 polling 없음 |
| 14 | 기존 저장 성공 알림·저장 배지 옆 | 하니 또는 재무 화면의 지은 응원 포즈 | 저장 결과를 알아차리기 쉬움 | S · 0장 | 없음 | 저널 시트 +0파일. `toast` 전체를 만화 패널로 바꾸지 않고 작은 장식만. Local 저장을 Cloud 저장 완료로 표현하지 않음 |
| 15 | 오류·오프라인 상태문 옆 | 서윤의 기존 설명 포즈, 태블릿. “상태와 다음 행동을 확인해요” | 불안 완화·문제 해결 안내 읽기 | S · 0장 | 없음 | 저널 시트의 서윤 point 사용, +0파일. 복구 성공·데이터 안전을 근거 없이 단정하지 않음. 오류 코드·재시도 버튼 보존 |
| 16 | 월말 정산·월간 보고서 표지 모서리 | 지은 생각 포즈 + 하니 설명 포즈, 옆에 기존 장부·기간 표제 | 숫자를 읽을 동기·담당 구분 | S · 0장 | 없음 | 저널 시트 +0파일. 표·인쇄 영역 침범 금지. 이미지 안에 금액을 그리지 않고 실텍스트로 유지 |
| 17 | 기존 본사 생일 축하 이벤트 패널 | 케이크를 든 직원과 개구리 회장님의 새 **공용 축하 장면**, 주인공 이름은 옆 텍스트 | 이미 있는 이벤트의 축제감 강화 | M · 1장 | 없음 | 60~120KiB 목표. 기존 생일 날짜·출근 조건·event owner 유지. 특정 직원을 다른 사람으로 오인하지 않게 공용 구도 사용 |
| 18 | 설정·데이터의 도움말·백업 설명 앞 | 유나의 기존 마스코트 또는 기존 설정 배너의 작은 장면 | 설정 항목의 용도를 편하게 이해 | S · 0장 | 없음 | 마스코트면 +1파일, 기존 배너면 +0. 삭제·복원·초기화 확인 버튼에는 적용하지 않음. “백업됨” 표시는 실제 성공 전 금지 |
| 19 | 로그인 카드의 상단·옆 여백 | 하니 손 흔들기 기존 인사 그림 | 첫인상에 치비 취향 반영 | S · 0장 | 없음 | 기존 `hani-wave.webp` 약 37.1KiB, 포함 시 +1파일. 모바일 이메일·비밀번호·실패문을 아래로 밀지 않음. 인증 코드 수정 불필요 |
| 20 | 기존 새 소식·알림의 작은 그림 자리 | 기존 당번 도움말 또는 하니 설명 포즈를 그대로 활용 | 안내의 출처와 주목도 개선 | S · 0장 | 없음 | 기존 슬롯·시트 사용 시 +0파일. 도움말과 새 배너가 함께 뜨는 중복·우측 패널 겹침 주의. 새 알림 저장·발송 기능 없음 |
| 21 | 라운지의 빈 게시판·검색 결과 없음 | 민지의 기존 생각 포즈, 옆에 취재 메모를 연상시키는 문구 | 글쓰기와 둘러보기 안내 | S · 0장 | 없음 | 저널 시트 +0파일. 빈 검색을 “게시글이 전혀 없음”으로 표현하지 않음. 가짜 직원 게시글 자동 생성 없음 |
| 22 | 스포츠의 비시즌·다음 경기 미정 안내 | 수연이 응원 수건을 들고 쉬는 새 그림 | 결과가 없을 때도 화면의 즐거움 유지 | M · 1장 | 없음 | 30~60KiB 목표. 경기 일정·팀별 상태는 기존 데이터 그대로. 패배 조롱·확정되지 않은 경기 정보 금지 |
| 23 | 생일·기념일에 홈/라운지에서 여는 작은 축하 카드 | 민지의 기념사진 + 개구리 회장님 단체 축하 2장면. 본사 생일 이벤트·마일스톤으로 이동 | 회사의 특별한 날을 발견하는 즐거움 | L · 2장 | 없음 조건 | 새 화면 간 연결 필요. **기존 본사 생일 버튼과 구별되는 확장**. 날짜·주인공 연결 기준을 먼저 정하고 중복 팝업을 피함. UI 메모리만 사용, 영구 읽음 상태 추가는 별도 범위 |
| 24 | 월간 보고서의 “이번 달 4컷” 선택 펼침 | 하니 총괄·지은 재무·나은 건강·히나 학습 4컷, 숫자는 HTML 텍스트 | 월간 흐름을 쉽게 읽고 다시 볼 동기 | L · 4장 | 없음 조건 | 새 읽기 전용 조립 기능. 4칸 시트 1파일 목표 180~360KiB. 그림마다 별도 데이터 저장·AI 호출 없이 기존 확인 자료만 조립. 원본 미검증·실적 없음은 그대로 표시 |

직원 배치는 [정식 명부](../../hani-organization-hub.js)의 분야를 기준으로 했습니다. 하니는 총괄, 지은은 재무, 하루는 소비·취향·독서, 나은은 건강, 히나는 학습, 민지는 콘텐츠·기록, 수연은 여행·스포츠, 유나는 안내·분류, 수아는 B2B·업무입니다. 윤슬은 독서·학습 보조, 가은은 일정·회의 준비, 서윤은 개발 설계·통합, 도연은 구현·테스트, 유리는 QA, 아린은 사용성·디자인입니다. 기존 배너 중 일기는 하루, 미룬 일의 일기 안내는 민지라는 차이가 있으므로 한 장면에서 담당을 무심코 교체하지 않습니다. **성민 대표님 캐릭터는 개구리이며 별명을 붙이지 않습니다.**

## 3. 기존 자산 재사용 표

단위는 실제 파일의 KiB(1,024바이트), MiB(1,048,576바이트)입니다. 그림을 새로 복제·변환하지 않고 원본과 기존 셀 좌표를 사용하는 전제입니다.

| 자산 | 현재 장수·크기 | 그대로 재사용하기 좋은 곳 | 제한·200파일 한도와의 관계 |
| --- | --- | --- | --- |
| [스트리트 저널 시트](../../assets/street-journal/chibi-sheet-v1.webp) | 파일 1개, 10포즈, 1280×512, **164.8KiB** | 하니: 설명·응원·생각 / 지은: 걱정·응원·생각 / 민지: 걱정·응원·생각 / 서윤: 설명. 빈 상태·보고 표지·오류 안내 | **1순위**. 현재 정적 참조 목록에 포함. 기존 CSS는 `.hsj-sheet` 범위이므로 다른 화면에 클래스만 붙여도 자동 적용되지는 않음. 해당 owner의 스타일에서 원본·좌표를 재사용 |
| [개별 표정 그림](../../assets/street-journal/chibi) | 4명×4포즈=16파일, 총 833.8KiB. 각 43.0~61.3KiB | 시트에 없는 하니 걱정·지은 설명·민지 설명·서윤 생각/응원/걱정 등 | 현재 정적 목록에는 0개. 사용 파일만 명시적으로 포함해야 함. 16개를 한꺼번에 넣을 이유 없음 |
| [미룬 일 시트](../../assets/procrastination/pb-chibi-sheet-v1.webp) | 1파일, 30포즈, 1536×1280, **1.33MiB** | 나은·히나·지은·하루·민지의 반가움·기록 미확인. 건강·학습·소비 첫 기록 | 현재 정적 목록에 포함. 가장 무거운 재사용 시트. 삐짐·등 돌림·구석 앉기를 오류·첫 방문의 기본 표정으로 쓰지 않음 |
| [인사 그림 4개](../../assets/launch/greeters) | 하니 손 흔들기 37.1KiB / 히나+토끼 32.7 / 나은+강아지 34.4 / 서윤+태블릿 33.5. 총 137.7KiB | 로그인·학습·건강의 첫 안내 | 저장소에는 있으나 현재 운영 경로 참조와 정적 목록 포함은 확인되지 않음. 각 파일을 쓰면 최대 +4. 연한 배경이 있는 그림이며 투명 스티커로 가정하지 않음 |
| [책상 마스코트 19개](../../assets/desk-mascots) | 총 116.9KiB, 각 3.7~7.9KiB. 배치표의 기준 그림 크기 72×72 | 작은 빈 상태 아이콘·입력 안내. 직원 이름을 붙인 동물 동반자 표현 | 작은 용도에 가장 가벼움. 직원 얼굴로 대체하지 않음. 19개 모두 정적 목록 밖이므로 선택 포함 시 파일 수 증가 |
| [낮 단체](../../assets/launch/chibi-launch-v1-day.webp) / [밤 단체](../../assets/launch/chibi-launch-v1-night.webp) | 각 1600×1000, 316.7 / 277.6KiB | 회사 소개·로그인 주변의 단체 환영, 기존 도움말 아트 | 둘 다 정적 목록 포함. **일반 재사용은 전체 그림**이 적합. 얼굴 추출은 이미 검증된 도움말 좌표에 한정하는 편이 안전 |
| [마일스톤 v2](../../assets/milestone-cards/milestone-card-sheet-v2.webp) | 1파일, 12장면, 2048×2202, 971.6KiB | 목표·기념 기록의 카드, 기념일의 장식 | 그림은 치비임을 직접 확인. 현재 정적 목록에는 없음. 새 포함 시 +1, 약 0.95MiB. 카드 그림의 투자 상승 화살표를 실제 수익 확정 표시로 쓰지 않음 |
| [서윤 M9 특별 컷](../../assets/character-archive/seoyun-m9-special-cut.webp) | 1파일, 1024×1024, 179.3KiB | M9 특별 합류 소개·해당 기념 기록 | 개구리 회장님과 서윤의 특정 사건 그림. 일반 목표 달성·다른 직원 생일로 재해석하지 않음. 정적 목록 밖 |
| [본사 v2](../../assets/sprites-v2)·[v3](../../assets/sprites-v3), [동행·남매](../../assets/office-companions) | v2 이미지 27개/197.3KiB, v3 이미지 34개/약 1.12MiB. 동행 폴더 3개/568.7KiB | 사무실 안내·직원·동물의 작은 장식 | 한 파일에 여러 포즈·빈 셀·그림자 포함. manifest의 셀·피벗을 읽어야 하므로 빠른 재사용 묶음에서는 후순위. 동행의 현재 참조는 companions-v1·kids-v2 |
| [뉴스룸 4컷](../../assets/newsroom-4cut), [일보](../../assets/hani-ilbo) | 뉴스룸 2장/1.27MiB. 일보 만화 5장/약 1.61MiB + 제호 1장 | 라운지·보고서의 “관련 만화 읽기” 미리보기와 기존 화면 링크 | 텍스트가 들어간 완성 만화. 작은 알림에 통째로 넣거나 인물만 잘라 쓰지 않음. 호수·캡션·발행 맥락 보존 |

실제 이미지 9종을 파일로 열어 확인했습니다: 지은 생각, 저널 10포즈 전체 시트, 미룬 일 전체 시트, 히나 토끼 인사, 유나 책상 마스코트, 낮 단체 인사, 서윤 특별 컷, 개구리 회장님 v3 포즈 시트, 마일스톤 v2 전체 시트. 저널 시트의 지은·민지 생각 포즈에는 계산기·카메라가 없으므로, 재사용 후보는 옆의 기존 제목·설명과 조합하는 것으로 적었습니다. 이는 **이미지 자산 확인**이며 앱 화면 스크린샷 검증을 대신하지 않습니다.

## 4. 추천 묶음 3개

### 1탄 — 기존 표정으로 빈 화면과 안내를 친근하게

대상은 **02 가계부·03 자산·06 시청·15 오류 안내·16 정산 표지·20 새 소식**입니다. 기존 저널 시트의 하니·지은·민지·서윤을 재사용합니다. 화면마다 작은 인물 1명, 짧은 문구 1줄, 기존 버튼을 유지하는 구성이 좋습니다. 상단의 큰 직원 배너는 이미 있으므로 본문에 큰 만화 패널까지 추가할 필요가 적습니다.

- 새 장면 **0개**, 새 이미지 파일 **0개**, 배포 파일 순증 **0개**가 목표입니다. 기존 owner의 JS/CSS 수정은 파일 수 증가가 아닙니다.
- 수정 예상 파일은 기존 화면 renderer·공통 UI·화면 스타일 등 약 **3개**입니다. 구체적인 위치는 구현 전 선택 화면의 owner에서 확정합니다.
- 이미지 원본 증가 **0바이트**. 표시 스타일·기존 renderer의 작은 보완은 합계 약 **3~6KiB**를 예상합니다. 구현 전 견적입니다.
- 그 화면에서 처음 시트를 쓴다면 네트워크 요청 **164.8KiB**가 생길 수 있습니다. “배포 파일이 늘지 않음”을 “화면 첫 요청 비용도 0”으로 해석하면 안 됩니다.
- 14 저장 알림은 사용 빈도와 성공 상태 의미가 민감하므로, 1탄 화면 확인 뒤 작은 크기로 적용하는 후속이 적합합니다.

### 2탄 — 새 그림 4개로 독서·퀴즈·여행 시작하기

대상은 **05 윤슬 책갈피 1장·08 히나 정답/재도전 2장·09 수연 지도 1장**입니다. 기존 자산에 부족한 분야와 표정을 채웁니다.

- 새 장면 **4개**, 투명 WebP 시트 **1파일**로 묶는 구성. 512px 셀 4개면 1024×1024가 기준입니다.
- 수정 예상 범위는 기존 독서·여행 renderer, 학습 owner, 스타일 약 **3개 + 새 이미지 1개**입니다.
- 그림 **120~240KiB**, 기존 코드·스타일 보완 **6~12KiB**, 합계 **126~252KiB** 증가 예상. 별도의 런타임 모듈이나 JSON 파일은 추가하지 않는 가정입니다.
- 파일별로 따로 제공하면 +4지만 한 시트면 **+1파일**입니다. 작은 화면에도 필요한 장면을 64~96px 안팎으로 표시하는 시안부터 확인합니다.
- 기존 프로젝트 선택·퀴즈 판정·여행 입력을 유지합니다. 데이터 구조·새 저장·서버 함수 변경은 필요 없습니다.

### 3탄 — 특별한 날과 월간 이야기를 즐기는 기능

대상은 **23 생일·기념일의 작은 축하 카드 2장면·24 월간 4컷 4장면**입니다. 생일은 기존 본사 이벤트를 발견하고 이동하기 쉽게 연결하고, 월간 4컷은 보고서 안에서 선택해서 펼치는 읽기 기능으로 제안합니다.

- 새 장면 **6개**, 축하 시트 1개 + 월간 4컷 시트 1개 = **2파일**.
- 수정 예상 범위는 기존 본사·홈/라운지·월간 보고·스타일 약 **4~5개 + 새 이미지 2개**입니다. 새 JS·JSON 파일을 추가하면 위 파일 예산도 늘어납니다.
- 그림 **300~650KiB**, 기존 owner 안의 조립 코드·스타일 **10~25KiB**, 합계 **310~675KiB** 증가 예상입니다. AI 생성 API·새 기록 보관함·새 서버를 만들지 않는 가정입니다.
- 기존 날짜·대상 정보를 재사용할 수 있는지 먼저 설계해야 합니다. 본사의 `staffBirthdays`를 다른 화면이 임의 복제하면 서로 다른 생일표가 생길 수 있으므로, 날짜 소유 경로를 하나로 연결하는 검토가 필요합니다.
- 문서가 열려 있는 동안의 UI 메모리만 사용합니다. 영구 “축하했음”, 수집 점수, 새 생활 기록 필드, Cloud 저장은 이 묶음에 포함하지 않습니다.
- 본사·라운지·보고서를 연결하는 새 기능이므로 S/M 패치와 분리해 설계·검증합니다. 구현한다면 L 범위의 별도 요구사항이 필요합니다.

| 적용 범위 | 새 장면 수 | 새 이미지 파일 / 배포 순증 | 기준 정적 파일 164개에 단순 합산 | 예상 증가 용량 |
| --- | --- | --- | --- | --- |
| 1탄만 | 0 | 0 / +0 | 164/200 | 코드·스타일 3~6KiB |
| 2탄만 | 4 | 1 / +1 | 165/200 | 126~252KiB |
| 3탄만 | 6 | 2 / +2 | 166/200 | 310~675KiB |
| 1→2→3 모두 | 10 | 3 / +3 | **167/200**, 여유 33개 | **439~933KiB** |

위 표는 **이번 작업본만 기준으로 한 설계 예산**입니다. 실제 배포 승인을 위한 gate 결과가 아닙니다. 다른 작업·서버 파일·배포 담당의 묶음이 추가되면 다시 산정해야 합니다.

### 파일 수·성능에서 꼭 구분할 점

1. [배포 서버](../../supabase/functions/hani-deploy-bridge/index.ts)의 `MAX_RELEASE_FILES`는 **200**입니다. 저장소 전체 파일 수를 뜻하지 않습니다.
2. [기존 참조 수집기](../../scripts/hani-runtime-closure.mjs)를 로컬 파일의 읽기 콜백으로만 호출한 결과, 현재 `index.html`에서 수집되는 정적 참조는 **164파일 / 18,965,734바이트(약 18.09MiB) / 누락 0개**였습니다. package build·preflight·Git 호출 없이 목록만 계산했습니다.
3. 정적 수집기는 임의 JS 문자열과 모든 동적 경로를 수집하지 않습니다. 마스코트·개별 표정·인사 4장·마일스톤 카드·일부 본사 sprite 등은 파일이 있어도 이 목록에 빠집니다. 이는 **실제 사이트에 없다는 판정도, 전체 런타임이 164개뿐이라는 판정도 아닙니다**. 기존 별도 배포·선행 자산을 포함해 사용 경로를 확인해야 합니다.
4. 새로 재사용하는 자산이 목록 밖이면 기존 `index.html`의 그림 template나 현행 CSS 등 canonical 수집 경로로 포함해야 합니다. 경로 문자열만 JS에 넣고 배포된다고 가정하지 않습니다. 한도 때문에 수집기를 바꾸거나 gate를 낮추는 제안은 아닙니다.
5. 기존 시트를 화면마다 파일로 복사하지 않습니다. 공용 URL과 CSS 좌표를 재사용하고, 첫 화면에서 모든 치비를 미리 받지 않습니다. 표정은 정지 그림을 기본으로 하고, 기존 motion·reduced-motion 처리를 존중합니다.

## 5. 실제 화면 근거와 남은 확인

**이번 실행에서 새 스크린샷은 0장입니다.** 1440·390 모두 미검증입니다.

| 시도 | 실제 결과 |
| --- | --- |
| 브라우저 도구 확인 | 이 세션에는 화면 조작용 브라우저 연결 도구가 없었음 |
| 로컬 Playwright 확인 | 현재 작업 공간에서 `require.resolve('playwright')`가 `MODULE_NOT_FOUND` 반환 |
| 설치된 Edge 직접 실행 | `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`를 `Start-Process -WindowStyle Hidden`으로 실행. 새 임시 프로필·`--headless=new`·`--disable-gpu`·로컬 디버그 포트·`about:blank` 사용 |
| Edge 시작 결과 | stderr에 `FATAL:mojo\public\cpp\platform\platform_channel.cc:187` 및 **액세스가 거부되었습니다(0x5)**. 프로세스가 시작 단계에서 종료 |
| 디버그 포트 확인 | `127.0.0.1:9433/json/version` 연결 실패. 로그인 게이트 숨기기·`showView(...)` 실행 단계에 도달하지 못함 |
| 파일·데이터 경계 | 브라우저를 앱으로 이동시키지 못했음. 실제 로그인·생활 데이터·LocalStorage·Cloud에 접근하지 않았음. 임시 프로필·stderr·분석 스크립트는 worktree 밖의 `%TEMP%/hani-chibi-audit-20261112/`에만 생성 |

다음에 브라우저 실행이 가능한 환경에서는 **로그인·홈·미룬 일·뉴스룸·서재 빈 상태·설정**을 우선 1440×900과 390×900에서 촬영하면 됩니다. 실제 계정 대신 외부 요청·저장 쓰기를 차단한 새 프로필과 빈 fixture를 사용하고, 로그인 게이트를 UI에서만 숨긴 뒤 `showView(...)`를 호출합니다. 이는 화면 점검용이며 실제 인증 성공 증거로 사용하지 않습니다. 모바일 입력란 노출, 그림과 표의 겹침, 도움말 버튼·우측 패널 충돌, 알림의 읽기 시간, 다크 모드와 reduced-motion도 확인해야 합니다.

기존 다른 작업의 PNG를 이번 2.9.289 화면인 것처럼 복사하지 않았습니다. 위의 자산 미리보기 확인도 앱 화면 확인으로 표시하지 않았습니다.

## 6. 작업 인수인계

### 작업 식별

- 작업 ID / 제목: `chibi-audit` / HANI OS 전체 치비툰 활용 디자인 읽기 전용 감사.
- 갱신 시각·담당: 2026-11-12 KST / Codex. 추가 Agent 위임·독립 리뷰 주장 없음.
- 상태: **조사·제안 보고서 완료 / 화면 촬영 차단 / 구현 미착수**.
- 저장소·branch·worktree: PROJECT HANI / `hani/tooling-288` / `tl288`.
- 기준·작업 SHA: 로컬 origin/main `7769fbe0fedd760f39493af3a97fe7b377977acb`, HEAD `3e1bc76e2457d01c6f44df88e679a127ce57b7fd`. Candidate 없음. 원격 새 조회 없음.
- 승인 근거: 성민 대표님의 `../chibi-audit-task.md` 전체 수행 지시. 읽기 전용 조사·제안·보고서·가능한 화면 촬영까지만 허용.
- 수정 범위: **이 `artifacts/chibi-audit/REPORT.md` 하나**. 런타임·그림·데이터·시험·공통 현황·타 담당 파일 수정 없음. 요청의 “보고서 하나” 조건에 맞춰 별도 인수인계 파일 대신 여기에 기록.

### 결과와 증거

- 메뉴 37개·뷰 38개·탭 별칭·공통 상태 조사, 기존 활용 목록, 후보 24개, 재사용 표, 추천 3묶음 작성.
- 검증: 운영 파일 대상 `rg --no-ignore` 검색, 배너 설정·CSS 좌표·manifest의 실제 참조 대조, 이미지 9종 열람, 원본 바이트 크기·WebP 치수 확인, 기존 수집기의 읽기 전용 정적 목록 계산.
- 저장소 무변경 확인: 착수 전 보존한 운영·문서·시험 등 **1,624개 파일 모두 SHA-256 동일**, 삭제 0개. 같은 비교 경로의 새 파일 0개. 이 결과 폴더에는 `REPORT.md`만 있음. 과거 artifacts 전체의 해시를 보존한 검사는 아니며, 그 경로에 다른 결과물을 작성하지 않았음.
- 문서 확인: 현행 뷰 **38개 전부 표에 포함**, 후보 **24개**, 요약 **5줄**. 상대 링크 **140개 전부 실재**, UTF-8 대체 문자 없음. 실행한 정적 목록 산정과 차단된 화면 검증을 구분함.
- 미검증: 실제 Edge 화면·반응형 겹침·다크 화면·키보드 조작·로딩 성능·사용자 계정·Android·운영 동작. 화면·기능 PASS로 보고하지 않음.
- 데이터 영향: `hani_os_life_v23`·내부 기준 버전·기존 저장·Cloud/Supabase write·schema·migration 변경 없음. 실제 생활 데이터 저장·복원·삭제 실행 없음.
- 버전 증가·syntax·runtime regression·Candidate build·One-Pass·HINA: **N/A — 문서 전용 감사이고 운영 코드를 변경하지 않음**. 읽기 전용 목록 산정은 Release Gate 실행이 아님.
- PR·push·merge·Pages·Production read-back: **실행하지 않음**. 배포 완료 보고가 아님.

### 다음 담당에게

- 먼저 읽을 파일: 이 보고서의 후보·1탄, `hani-ui-v02992.js`의 배너/도움말·motion owner, `hani-street-journal.css`의 10포즈 좌표, 선택한 화면의 실제 renderer.
- 다음 행동: 브라우저가 가능한 환경에서 위 화면 1440·390 증거를 확보하고, 1탄 대상의 크기·문구를 구체화. 기능 구현은 별도 요청 범위로 진행.
- 디자인 원칙: 한 빈 상태에 치비 1명·짧은 문구·기존 버튼. 표·입력·저장 결과 의미를 우선. 추가 renderer/event layer·저장 키·서버 변경은 만들지 않는 방향.
- 타 작업: `ie290` 이음 입사 작업과 자산·명부·생일표를 함께 변경하지 않음. 구현 시 최신 배포 열차 기준으로 파일 여유 재확인.
- CURRENT / DECISIONS: 이번 감사에서 변경하지 않음. 구현 선택·승인으로 기록하지 않음.
- Notion: 기존 허브 읽기와 새 [HANI 통합 현황판](https://app.notion.com/p/415c527570748193b1a6f77084357ee6) 읽기는 성공. 새 현황판은 작업 기록을 개발 게시판 카드에 두도록 안내함. 착수 기록 추가 요청은 **자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절**하여 실제 저장·read-back이 없었음. 게시판 카드 생성·완료 갱신도 수행하지 않았으며, 갱신 완료로 보고하지 않음.
- **Notion 갱신 대기 전달문:** 2026-11-12 / Codex / chibi-audit / tl288·hani/tooling-288·HEAD3e1bc76·로컬main7769fbe / 읽기 전용 전체 치비 디자인 조사 완료 / 메뉴37·뷰38·후보24·추천3묶음 / 정적참조164/200·18,965,734바이트·누락0 / 런타임 변경0·Git0·구현/배포 없음 / Edge Windows 접근 거부로1440·390 PNG0 / 다음: 가능 환경 화면 검증과1탄 구체화 / 원문 artifacts/chibi-audit/REPORT.md / 추가 승인 필요 사항 없음(구현은 별도 요청).
