# 도우미 3차 · 얼굴 크롭

성민 대표님, **미르의 개구리 오연결을 실제 미르 얼굴로 교체**했습니다. 19명 모두 기존 프로필과 대조했습니다. 새 이미지 없이 기존 CSS 크롭만 수정했으며, 1·2차 JS·배치·이벤트는 바이트 그대로 보존했습니다.

- 미르: 검은 단발·푸른 눈·흰 재킷. `sprites-v3/manifest-v3.json`의 `identityReference`와 실제 프로필·스프라이트·런치 그림을 대조했습니다. 기존 chibi가 있어 M 배지 대체는 불필요합니다.
- 가은: 작은 스프라이트 대신 런치 그림의 갈색 머리·와인색 스카프 얼굴 사용. 하루 포함 전체 얼굴의 배율·위치를 조정하고 머리 여백 확보.
- 윤슬·다온: 더 선명한 기존 chibi는 찾지 못했습니다. v2보다 해상도가 높은 v3 유지, 배율 60%→48%, 정수리·턱 여백 확보. **원본 자체의 선명도 한계는 남습니다.** 일반 프로필을 chibi 대신 사용하지 않았습니다.
- 원형 버튼 안에서 옆 직원·윗줄 소품을 제외하도록 CSS 마스크·크롭 경계 조정. 알 수 없는 ID는 얼굴 배경을 상속하지 않습니다. 캔버스 확대 재현으로 확인했으며 실제 브라우저 결과와 구분합니다.

아래 신원 확신은 프로필 대조 결과입니다. D=`assets/launch/chibi-launch-v1-day.webp`, V=`assets/sprites-v3/`. 비교 기준은 각 ID의 기존 `assets/profiles/thumb/hani-profile-*-256.webp`이며 다온·윤슬은 `-v2`, 채원 ID는 `taeo`, 도연 ID는 `dohyun`입니다.

| 이름 | 사용 원본 / 영역 | 대조 특징 | 신원 확신 |
|---|---|---|---|
| 하니 | D / 아랫줄 3 | 긴 짙은 갈색 머리·보라 정장 | yes |
| 유나 | D / 아랫줄 6 | 갈색 묶음 머리·연보라 재킷 | yes |
| 미르 | D / 윗줄 6 | 검은 단발·푸른 눈·흰 재킷 | yes |
| 서윤 | D / 윗줄 1 | 검은 긴 생머리·앞머리·회색 니트 | yes |
| 도연 | D / 윗줄 2 | 적갈색 머리·검은 안경·후드 | yes |
| 세린 | D / 윗줄 3 | 밝은 갈색 긴 머리·흰 가운 | yes |
| 유리 | D / 윗줄 4 | 짙은 갈색 단발·흰 셔츠 | yes |
| 아린 | D / 윗줄 5 | 적갈색 땋은 머리·분홍 재킷 | yes |
| 뮤즈·가은 | D / 가운데 2 | 갈색 머리·와인색 스카프 | yes |
| 지은 | D / 가운데 1 | 갈색 올림머리·둥근 안경 | yes |
| 하루 | D / 아랫줄 1 | 긴 갈색 머리·하늘색 재킷 | yes |
| 나은 | D / 아랫줄 2 | 갈색 단발·연두 재킷 | yes |
| 히나 | D / 아랫줄 5 | 검은 올림머리·꽃 장식·분홍 옷 | yes |
| 민지 | D / 가운데 3 | 갈색 포니테일·코랄 재킷 | yes |
| 수연 | D / 가운데 4 | 금발·푸른 눈·짙은 녹색 옷 | yes |
| 수아 | D / 가운데 5 | 검은 단발·파란 스카프 | yes |
| 채원 | D / 가운데 6 | 긴 갈색 머리·청록 재킷 | yes |
| 다온 | V`daon.webp` / 첫 standing | 검은 단발·앞머리·남색 정장 | yes |
| 윤슬 | V`yoonseul.webp` / 첫 standing | 갈색 머리·둥근 안경·책 | yes |

| 검사 | 결과 |
|---|---|
| `node scripts/hani-helper-bot.test.mjs` | 17 통과 / 0 실패 / 브라우저 1 생략 |
| 새 크롭 검사 | 실제 CSS 변수 해석, 19명 명시적 항목·원본 존재·신원 영역·개구리 영역 배제·중복·비율·sprite 여백 확인 |
| `node scripts/hani-nav-groups.test.mjs` | 통과 (`HANI_MAIN_BASELINE`에 기존 검증된 원문 디렉터리 제공) |
| `node scripts/hani-design-system-qa.mjs` | 통과 |
| JS syntax 2파일 / `git diff --check` | 통과 |
| 2차 보존 / 파일 수 | JS 전체·크롭 앞뒤 CSS 일치. 156→155/160, 누락 0, 새 이미지 0 |
| 실제 브라우저 | 실행 시도 실패: `spawn EPERM`. 수정 후 실화면·CSS mask 브라우저 합성 미검증 |

변경: `hani-style-08.css` 기존 helper 크롭, `scripts/hani-helper-bot.test.mjs`, 이 보고서·3차 인수인계·`round3-*` 검사 기록. CSS 전용 파서는 없어 별도 CSS syntax PASS로 표기하지 않았습니다. 캔버스 확인은 메모리에서만 수행해 PNG를 추가하지 않았습니다.

`hani/helper-bot`, base·원격 main `1bb98046973098959b7feaf906578710cdf3fe73` 일치(GitHub connector). 표시 버전 2.9.269·공통 UI `hani-ui-v02992.js`·마지막 script `hani-launch-greeting.js` 유지. 저장·Cloud·schema·data 수정, commit/push/merge/버전 증가·배포 없음. Candidate/Production 검증 N/A. Notion은 같은 작업의 1차 수정 금지 지시를 유지해 미반영했습니다.

다음: 실행 가능한 브라우저에서 19일 당번을 순회해 머리 여백·원 안 혼입·윤슬/다온의 실제 56px 선명도를 확인합니다. 서버 설정 변경은 없습니다.
