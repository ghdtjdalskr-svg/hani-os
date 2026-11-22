# 출석 도장판 화면 붙이기 (2안) 작업 보고서

> 작업 환경 제약(파일 읽기·쓰기 도구만 허용, 셸 실행 불가)으로 테스트·노드 검사는 아직 직접 실행하지 않았습니다. 아래 **서윤 실행 명령**으로 실제 검증을 진행해 주세요.

## 1. 변경 및 신규 파일

### 수정 파일
- [lines.json](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/artifacts/attendance-v1/lines.json): 빠져 있던 `ieum`(이음) `duty` 대사(`before` 2줄, `after` 2줄) 및 `secret7` 1줄 추가.
- [index.html](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/index.html): `<head>`에 `./hani-attendance-board.css` 링크 1줄, `</body>` 앞에 `./hani-attendance-core.js` → `./hani-attendance-board.js` 스크립트 2줄만 추가(버전 태그·나머지 줄·줄바꿈 유지).
- [hani-main.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/hani-main.js): `renderHome()` 내 `renderHomeBirthday();` 직후에 `window.HaniAttendanceBoard?.render();` 1줄 추가.

### 신규 파일
- [hani-attendance-board.css](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/hani-attendance-board.css): `#attendanceBoard` 범위로만 한정된 카드·7일 도장칸·다크모드(`data-theme="dark"`, `midnight-black`, `titanium-graphite`)·390px 모바일 무넘침·보상(3일 `.hop`, 14일 `.gold`, 30일 배지)·`prefers-reduced-motion: reduce` 스타일.
- [hani-attendance-board.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/hani-attendance-board.js): `HaniAttendance` 엔진(`hani_attendance_v1`) 기반 홈 출석 도장판 UI 및 24명 당번(직원 20 + 동물 4) 대사 내장(외부 JSON `fetch` 없음, `hani_os_life_v23`·Supabase·`setInterval`·`MutationObserver` 미사용).
- [hani-attendance-board.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-attendance-board.test.mjs): `node:test` 기반(jsdom 미사용) 정적 안전 검사·24명 대사 누락 검사·에셋 존재 확인·미니 DOM 동작(`broken`/`unavailable`/보상/자정 넘김) 테스트.
- `artifacts/attendance-v1/REPORT.md`: 본 보고서.

### 미수정 유지
- [hani-attendance-core.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/hani-attendance-core.js), 기존 테스트 파일 및 해시 픽스처 일체, 표시 버전.

## 2. 슬롯 위치와 선택 이유

- **위치**: `#home` 내부의 오늘의 한마디 카드(`.home-welcome-compact.home-dialogue-shell`) 아래, `#homeActions` 바로 앞(`homeActions.parentNode.insertBefore(section, homeActions)`).
- **이유**:
  - `renderHomeBirthday()`의 `#homeBirthdayChibiNote`와 동일하게 `#homeActions` 직전에 놓아 오늘의 한마디 카드 바로 아래에 출석판이 자연스럽게 이어지며, 상단 한마디와 하단 할일/대시보드 카드 사이에서 2안(홈 상단 배치) 의도를 지킵니다.
  - `#attendanceBoard`는 최초 마운트 시 1회만 생성하고, 내부 요소 참조(`_attRefs`)를 유지한 채 `render()` 호출마다 속성/텍스트/클래스만 제자리 갱신(Persistent Slot + Update)합니다.
- **초상화·반려동물 경로 정리**:
  - `./assets/profiles/thumb/hani-profile-pet-*-256.webp` 파일은 존재하지 않으므로, 실제 존재하는 `./assets/sprites-v3/pet-cat.webp`, `pet-dog.webp`, `pet-bori.webp`, `pet-rabbit.webp` 5×2 스프라이트 첫 칸(앉은 자세)을 사용했습니다.
  - 직원 20명은 `hani-office-live.js`의 `profile(id)` 규칙(`daon-v2`, `yoonseul-v2`, `sua-id`, 나머지 `-256.webp`)을 그대로 따릅니다.
  - 당번 ID도 `lines.json`·`hani-office-live.js`와 일치하는 `pet-cat`, `pet-dog`, `pet-bori`, `pet-rabbit`로 통일했습니다.

## 3. 호감도(`HaniOfficeAffinity`) 연동 질문

- [hani-office-live.js](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/hani-office-live.js#L3922)에서 `window.HaniOfficeAffinity`는 `Object.freeze({ get: affinity.get })` 형태로 **읽기 전용**만 공개되어 있고, 내부 가산 함수(`tap`·`flush`)는 클로저 비공개이며 `event.isTrusted === true` 및 1일 +2 제한 등 사무실 터치 이벤트 전용 조건을 가집니다.
- 지침에 따라 비공식 호출이나 `hani_office_affinity_v1` 직접 쓰기는 하지 않고, 7일 달성(`bonus === true`) 시 카드 안내 문구와 `secret7` 비밀 대사만 표시하도록 두었습니다.
- **질문**: 추후 7일 출석 보상 시 비반려동물 직원(`!duty.pet`)의 호감도를 +2 실제로 올리려면, `hani-office-live.js`가 공식 가산 메서드(예: `HaniOfficeAffinity.grantAttendanceBonus` 등)를 별도 PR에서 공개하도록 진행할지, 아니면 현재처럼 출석 보드 내 알림과 비밀 대사 해금으로만 둘지 확인 부탁드립니다.

## 4. 이번 변경으로 실패할 수 있는 기존 테스트

`index.html`(3줄)과 `hani-main.js`(1줄)를 수정했고 배포 열차 규칙에 따라 버전/해시 픽스처는 손대지 않았으므로, **v2.9.299 기준 바이트 SHA-256 해시를 고정 검사하는 역사적 레이어/번들 테스트**는 실패할 수 있습니다. (수정하지 말라는 지침에 따라 그대로 두었습니다.)

- [hani-procrastination-board.test.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-procrastination-board.test.mjs): [hani-life-bundle-source.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-life-bundle-source.mjs)를 통해 `index.html`·`hani-main.js`의 고정 SHA-256 해시를 대조함.
- [hani-release-version-layers.cjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-release-version-layers.cjs) / [hani-release-299-source.cjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-release-299-source.cjs) / [hani-release-283-source.cjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-release-283-source.cjs) / [hani-save-guard-source.cjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-save-guard-source.cjs)를 통해 `index.html` 또는 `hani-main.js`를 역투영하는 릴리스 레이어 테스트 일체.
- [hani-one-pass-release.mjs](file:///C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/attend2/scripts/hani-one-pass-release.mjs): 배포 열차 합류 전이므로 `version_forward` 미증가 상태(열차 탑승 시 버전 1회 증가로 정리).

## 5. 서윤이 실행할 검증 명령

```powershell
node --check hani-attendance-core.js
node --check hani-attendance-board.js
node --check hani-main.js
node --test scripts/hani-attendance-core.test.mjs scripts/hani-attendance-board.test.mjs
node scripts/hani-nav-groups.test.mjs
node scripts/hani-runtime-closure.mjs
```
