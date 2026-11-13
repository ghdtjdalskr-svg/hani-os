# THAW · 해빙의 정원 구현

2026-11-08 KST · Codex · `hani/theme-thaw` · base/HEAD `70c5d5d8e1ddc1262314f412934b3a450974599c`.
GitHub connector로 원격 main 동일 SHA 확인. **구현 완료·미커밋**, push/merge/배포 없음. 표시·cache `2.9.280` 유지.

- 최신 추가 결정 우선: **티저 2027-01-08 09:00 KST(D-31)** → 발표 02-08 09:00 → 홈 홍보 종료 02-15 09:00. 갱신된 과제 파일 전체를 UTF-8로 재확인했다. 기획안의 02-01 및 과제 1번의 이전 날짜보다 추가 결정을 우선했다.
- 단일 정의는 owner 바로 옆 [hani-theme-collections.json](../../hani-theme-collections.json). 다음 분기는 배열에 항목 하나 추가. 기존 resolver의 `fetch → JSON → 이미지` 수집 경로를 사용해 release 도구 수정 없이 자산을 포함한다. 읽기 실패는 테마 선택에 영향 없이 캠페인을 보류한다.
- 기존 `SEASON_THEMES`는 사계절 ID만 허용하고, 알 수 없는 값은 spring으로 해석한다. 따라서 새 edition ID를 저장하지 않고 **직접 적용 때만 기존 applySignatureFinish / applySeasonTheme로 Alpine Blue × Spring**을 기록한다. 기존 두 키·함수 원문·저장 호출 전체 보존. 에디션 그림은 캠페인에 표시하며 영구 전역 그림 선택을 저장하지 않는다.
- `renderHome`·기존 view 진입에서 persistent 홈 슬롯과 스튜디오 행을 갱신한다. 출시 전 Coming soon 잠금, 발표 dialog·팔레트·기존 SEASON 탭 이동·다시보기, 종료 뒤 정식 목록 유지. 닫기는 세션 메모리만. 새 polling/timer/listener 없음. 자동 테마 전환 없음.
- 승인 B안을 image_gen에 참조로 전달해 가로 1536×1024·폰 정사각 1024×1024 WebP 제작: [자산](../../assets/theme-collections/thaw-2027q1/) · [실제 프롬프트](imagegen-prompts.md).

검증 결과:

- **전용 10/10 PASS**: 4시점·정확한 경계/KST/D-31·실패한 데이터 읽기·persistent 재사용·세션 닫기·기존 선택 복원·6×4 조합·보호 데이터/기존 owner 보존. [시험](../../scripts/hani-theme-thaw.test.mjs) · [로그](unit.log)
- **실제 Edge 1280×900/390×900 × 4시점 PASS**, 스크린샷 **20장**, 오류 0. 실제 24조합 computed surface 토큰·명시 적용·ESC/포커스 복귀·가로 넘침·보호 데이터/메모리 원본 보존 확인. [결과/파일 목록](browser-status.json) · [PC 티저](1280-teaser-home.png) · [폰 티저](390-teaser-home.png) · [발표](390-launch-dialog.png) · [스튜디오](1280-launch-studio.png)
- 티저·날짜 갱신·발표 열기 storage write **0**, 직접 적용은 기존 Finish/Season 키 2개만. 화면 이동·스크린샷 스크롤 때 기존 `hani_os_navigation_v1` 저장은 유지하며 별도 기록했다. `hani_os_life_v23`와 내부 버전·Cloud/schema/migration 변경 없음.
- 기존 **13묶음 중 9통과 / 기존 실패 4 / 신규 실패 0**. design-system 계산, dashboard 단위/UI, nav groups·login 단위/UI·위치복원 및 안전 검사 통과. 안전 검사: runtime JS 7개·저장/Cloud 호출·버전/cache·수정 밖 **17,318줄/EOL** 보존. [전체 집계/명령](regression.json) · [안전 검사](safety.log)
- 실패 4개는 **변경 전 HEAD 소스로 같은 시험을 그대로 실행해 동일 원인 재현**: theme-white의 기존 `settings hunk present` exact-inverse 오류, qa-1st 단위 fixture의 `investmentMoveClass` 누락, qa-1st UI의 기존 ‘미확인 금액’ 대비 1.904, design-system-phase1의 기존 홈 nav 클릭 timeout. assertion·기존 시험/보존 oracle 변경 없음. [baseline 실행기](baseline-probe.cjs), `baseline-*.log` 참고. 기존 실패는 PASS로 간주하지 않는다.
- closure **161→164(+3)**: 새 JS/CSS/HTML **0**, JSON **1**, WebP **2**. 삭제/누락 **0**, 전체 원문 용량 **+291,697B**, WebP 합 **276,064B**. gate/상한/패키지 생성 도구 수정 없음. [정확한 SHA·목록](closure.json)

남은 사항:

- `git add`가 외부 worktree gitdir의 `index.lock` 생성 권한 거절(exit128) → 요청하신 예외대로 **미커밋 보고**. 사용자 추가 메모 `.hani-note-teaser.md`는 보존했다.
- Notion [착수 기록](https://app.notion.com/p/412c52757074819f874be81f1520ea5a) 저장/read-back 성공. 후속 갱신은 자동 승인 검토가 `approval policy: never`로 거절해 결과 요약 갱신 대기.
- 장시간 홈을 그대로 열어 둔 경우 다음 기존 render/view 진입 때 날짜 표시를 갱신한다. 별도 자정 timer 없음. 실제 Android·오프라인 JSON 캐시·독립 아린 검토는 미검증. 이번은 branch 작업으로 Candidate Freeze/package/One-Pass/HINA/Production read-back **N/A**.
- 다음 담당: Git 쓰기 가능한 환경에서 이 변경만 commit. 기존 실패 4건은 별도 작업으로 전달. 대표님 추가 승인 전 push/merge/버전 변경/배포 금지. [인수인계](../../docs/development-history/handoffs/2026-11-08-theme-thaw.md)
