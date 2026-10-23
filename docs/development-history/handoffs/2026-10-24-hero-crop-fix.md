# 작업 인수인계 — PC hero 배너 그림 잘림 수정

## 작업 식별

- 작업 ID / 제목: hero-crop-fix / PC 메뉴 hero 배너 3:1 그림 위아래 잘림 수정
- 갱신 시각(KST): 2026-10-24
- 담당 도구 / 검토 담당: Claude Code(서윤) / 배포 열차 담당
- 상태: 탑승 대기 (배포 열차)
- 저장소 / branch / worktree: hani-os / `hani/hero-crop-fix` / `.worktrees/hero-crop-fix`
- base SHA / candidate SHA: `d19aa0b` (origin/main, 표시 v2.9.232) / `ba6f2c4` (CSS 수정 commit)
- 목표 / 완료 조건: PC에서 인포데스크·HANI 본사·라이프 리포트 등 메뉴 배너 그림이 위아래 잘리지 않고 전체 장면이 보임. 모바일 배너 동작은 그대로.
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: `hani-design-system.css`의 Main Character Banner shell 3곳(336·340·343행 부근). 다른 열린 작업과 겹치는지 열차 출발 시 확인 필요.
- 사용자 승인 근거 / 승인되지 않은 경계: 성민 대표님 2026-10-24 "push하고 배포 열차 탑승 대기로 올려줘". main merge·배포 승인은 아님.

## 결과와 증거

- 원인: 배너 그림은 모두 3:1(약 2172×724)인데, PC 배너는 약 1300×232~1880×255(5.6:1~7.4:1)라 `width:100%`+`object-fit:cover`로 위아래가 47~59% 잘렸다.
- 변경한 내용 / 파일 (`hani-design-system.css`만):
  - 기본 `--mcb-scene-width`와 `--group` 변형의 `100%` → `auto`, 그림에 `max-width:100%` 추가 → PC에서 그림이 원래 3:1 비율로 오른쪽 정렬, 좁은 배너에서는 기존 cover로 채움.
  - PC(min-width:701px)에서 대시보드 외 배너의 `::after` overlay를 `background-size:64% 100%`로 글자 영역 쪽에 압축 → 그림이 뿌옇게 바래지 않음.
  - 대시보드(`#home`)는 inline `sceneWidth`와 overlay를 그대로 사용. 모바일(≤700px) `!important` 규칙은 그대로.
- 실행한 검증 (로컬 정적 서버 localhost:8737, base d19aa0b + 수정):
  - HANI 본사 배너 1297×232에서 그림 690×230(3:1), 세 인물 얼굴 전체 노출 확인.
  - 라이프 리포트·인포데스크 화면 확대 캡처로 전체 장면 노출 확인.
  - 모바일 375px: 배너 343×236, 그림 341×234 cover, overlay `auto` → 기존과 동일.
- 실행하지 않은 검증 / 남은 위험:
  - 배너 폭 약 1900px(대표님 모니터) 실측 미확인. 계산상 그림 약 765px이 오른쪽에 들어가고 가운데 여백이 넓어짐.
  - 나머지 메뉴 배너 전수 확인, 701~900px 태블릿 폭, 다크/계절 테마별 확인 미실행.
  - 기존 배너 테스트(`hani-banners-203-ui` 등)가 `width:100%`를 기대하면 열차에서 실패할 수 있음 — 미실행.
- 데이터·저장소·Cloud·schema 영향: 없음 (CSS만 변경, storage write·Supabase 변경 0).
- 버전: 열차 규칙에 따라 표시 버전·`?v=`·`HANI_DISPLAY_VERSION` 미변경.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 모두 미진행.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: `hani-design-system.css` 336~345행, `hani-ui-v02992.js` 1197행(`--mcb-scene-*` inline 설정).
- 다음 한 가지 행동: 열차 후보에 합친 뒤 배너 관련 targeted test 실행, PC 넓은 화면 캡처로 Preview.
- blocker / 필요한 사용자 결정: 없음. 넓은 화면에서 가운데 여백이 마음에 드는지는 Preview에서 대표님 확인.
- 다른 작업에 영향을 주는 사항: hero/배너 CSS를 만지는 다른 작업과 충돌 가능.
- CURRENT / DECISIONS 갱신 내용: 없음.
