# office movement stage 2

## 작업 식별

- 담당: Codex / 검토·실제 브라우저: 대표님 지정 후속 담당
- 상태: 구현·targeted Node 검증 완료 / 미커밋 검토·실제 브라우저 대기 (2026-11-01 KST)
- worktree: `office-stage2`, branch `hani/office-motion-2`
- base HEAD / 로컬 origin/main: `39ce4a137a20c7531b96e6e539dfe53762223138`
- 원격 최신성: git ls-remote 실패(샌드박스 네트워크 연결 제한). merge/rebase 없음.
- 범위: live JS/CSS, 새 야간 WebP 하나, 전용 Node 테스트·비배포 비교 이미지·인수인계.
- 승인: 이번 요청의 owner 승인. commit/push/merge/version 변경/Notion/브라우저 및 우회 금지.

## 결과와 증거

- Scoped Discovery: CODEMAP living-office owner 유효. 시간 구간은 `tapBucket`(KST 00/07/11/18시); 배경은 `art-map-v1.json`이 FLOOR_ART를 덮음. 실제 5F는 `floor-5f-217.webp` 1672×941.
- 배경 owner: `setBackground` → floor-keyed cache → backgroundToken guard → plates/deskProps. 현재 foreground는 모두 숨김, mask none. 이 경로 보존.
- 동작 owner: 기존 100ms movement clock + sceneVisible/syncVisibility. 새 시계·이벤트 계층 없음.
- 기준 index: office JS/CSS `?v=2.9.242`. 실제 Production 표시·JS 로딩은 브라우저 금지로 미확인.
- 색조: 공통 koreaTime 사용, 대사용 tapBucket과 분리한 빛 시간표. KST 06:00 아침 / 11:00 낮 / 17:00 저녁 / 18:30 밤, 경계부터 10분 smoothstep opacity 전환. 아침 12%, 저녁 20%, 밤 20% 이하. day 투명. reduced motion은 즉시 정적 색조.
- 모니터: 기존 homeFurniture.deskBounds·rendererSeat.owner·현재 배우의 좌석/자세/근무 상태 사용. 모니터 중심 누락만 deskBounds 내부 비율 보정표. 다른 소유자·이동·회의·휴식·기립·대화·MIR pod·모니터 없는 자리 제외. 단일 영구 gradient 요소의 opacity만 12초 주기 0.125~0.195. 전체 새 요소는 영구 host 1 + tint 3 + glow 1. z-index 1 / pointer-events none.
- 5F: art-map의 nightBackground 추가. KST 18:30~05:59 야간. 캐시는 floor→variant promise로 구분. 기존 token + 현재 floor + 현재 KST source 검사. 교체 대기 중 이전 잘못된 배경은 숨김. 실패 시 day promise 재사용 후 기존 production fallback. 정상 night/day는 dataset.art=floor, plates/deskProps 유지, foreground 소유권·mask 경로 보존.
- 이미지: built-in imagegen으로 실제 217 원화 재조명, 3F/4F 현행 스타일 참조. 1672×941 / 235,596 bytes. 비교 파일 3344×941(왼쪽 day/오른쪽 night), 배포 제외. [제작 프롬프트·배포 주의](../../../artifacts/office-stage2/art-notes.md).
- 기존 단일 100ms 시계·syncVisibility 재사용. 화면 밖/hidden에서는 pulse 중단, 복귀 시 현재 phase/image 반영. 새 timer/event/renderer 없음.

### 검증

- `node --check hani-office-live.js`, `node --check scripts/hani-office-motion-2.test.mjs`, `git diff --check` PASS.
- `node scripts/hani-office-motion-2.test.mjs`: **24/24 PASS** (신규 18 + 공유 owner 6). 시간·색조 경계/연속성·왕복 지연 로딩·시간 재검사·fallback·명패/소품·모니터 소유/재실·저모션·hidden/offscreen·write 0·WebP 크기/용량 포함.
- 시작 HEAD blob과 비교: scheduler / placeStatusLabels / fitStatusLabels byte-identical. runtime에 Storage/Cloud 심볼 없음. [증거](../../../artifacts/office-stage2/safety-results.json).
- `HANI_GIT_PATH`를 설치된 git.exe로 설정하고 `scripts/hani-office-*.test.mjs` **30개 모두 실행 시도**. 파일 완전 통과16 / 실패·부분차단14. Node 요약이 나온 검사 합계 **242 PASS / 12 FAIL / 2 SKIP** (공유 owner 중복 포함). 6파일은 Git EPERM으로 테스트 요약 이전 중단되어 이 개수에 포함되지 않음.
- FAIL 12 중 Git 하위 프로세스 EPERM 10, 기존 baseline 실패 2. 모든 미완료14파일에 Git EPERM 포함. `219`는 요청대로 수정하지 않음.
- 기존 실패2: `obr21` 과거 source freeze hash 불일치, `v2-215` 정지된 fake clock에서 walk-b 기대. 정확한 시작 HEAD blob(hash 일치 확인)을 FS read overlay로 읽어 동일 실패 확인. workspace runtime 파일 교환 없음. 관련 baseline 로그는 artifacts/office-stage2 아래.
- v2-215는 실패 후 남은 기존 비동기 walk timer 때문에 plain Node 종료가 지연되어 해당 실행 중단, `node --test --test-isolation=none --test-force-exit scripts/hani-office-v2-215.test.mjs`로 재실행해 16 PASS / 2 FAIL / 2 SKIP 확인. 브라우저 flag 사용 없음.
- [30파일별 결과](../../../artifacts/office-stage2/test-results.json), [합계](../../../artifacts/office-stage2/test-summary.json), 상세 log/원화 비교는 같은 폴더. 일부 테스트가 만든 비배포 결과는 test-generated로 모음.
- 미검증: 실제 브라우저(실행·우회 안 함), Android FPS/터치/레이어/이름표 가독성, 원화와 runtime 좌석·명패/소품 overlay의 정확한 픽셀 정렬, Preview/Production. 5F 육안 비교는 완료했지만 픽셀 정렬 완전 일치 PASS로 보고하지 않음.
- Runtime 변경 파일: hani-office-live.js / hani-office-live.css / data/hani-building/art-map-v1.json / assets/building/floor-5f-night-243.webp. 추가: 전용 test, 본 handoff, artifacts/office-stage2 비배포 자료. assets 아래 다른 파일 추가 없음.
- 표시 버전·cache tag·내부 baseline·보호 저장·Cloud·schema 변경 없음. commit/push/PR/merge/배포 없음.

## 다음 담당에게

- 실제 브라우저·중간급 Android·아트 정렬·한국 시간 경계·탭 숨김/복귀 확인 필요.
- 09:00 따뜻한 아침 / 14:00 원화 / 18:00 주황빛 / 19:00 푸른 tint+야간 rooftop / 01:00 푸른 tint+야간 rooftop. 모든 시각에 실제 근무 중 착석 소유자의 모니터만 glow.
- 새 이미지와 art-map을 함께 배포. 기존 `dev-center/one-pass-gate-contract.json` assets WebP allowlist 수정은 불필요. `scripts/hani-release-package.mjs` 자동 closure가 동적 catalog 배열과 일반 JS 문자열을 수집하지 않으므로 기존 floor 자산 seed 경로에 새 WebP 포함을 확인해야 함. 배포 pipeline은 수정하지 않았음.
- 저장/Cloud/schema 영향 없음. 배포·버전·main·Pages·Production 검증은 이번 범위 밖.
- Notion은 이번 요청에 따라 수정하지 않음. CURRENT/DECISIONS는 타 작업 보존.
