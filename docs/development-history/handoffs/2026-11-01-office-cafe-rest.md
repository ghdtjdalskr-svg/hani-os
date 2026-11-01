# 1F HANI Coffee와 휴식 인원 조정

## 작업 식별

- 갱신: 2026-11-01 KST / 담당: Codex 단독 / 검토 및 실제 브라우저: 요청문에서 지정한 후속 검토자.
- 상태: 미커밋 변경 검토 대기. 최종 수치와 전체 검사 목록은 `artifacts/office-cafe/REPORT.md` 참조.
- worktree: `C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/office-cafe`
- branch: `.git/HEAD` 직접 읽기로 `hani/office-cafe-rest` 확인. base: `c7b2c202eb9eed0d2ebc7449525c1d913ddf8ebf`.
- 승인 근거: 성민 대표님 이번 요청의 카페 배경·동선·휴식 스케줄 변경 범위. Git subprocess와 브라우저 금지, commit/push/merge/버전/Notion/저장소·Cloud 변경 금지.
- 기준선: 로컬 index 2.9.245. 원격 main 최신성과 운영 실제 JS 로딩은 요청 제한으로 미확인. Git·브라우저 우회 없음.
- CODEMAP living-office owner 확인. 세부 카페/스케줄러 anchor는 CODEMAP_MISS이므로 실제 loader → art/canon/places → plan/blockPlan → reserve/stateAt/snapshot → persistent renderer 경로 조사.

## 결과와 증거

- runtime 변경: `hani-office-live.js`, `assets/building/floor-1f-217.webp`, `data/hani-building/art-map-v1.json`, `data/hani-building/office-places.json`, `data/hani-building/spatial-contract.json`.
- 개발 검사: `scripts/hani-office-cafe-measure.mjs`, `scripts/hani-office-cafe-audit.mjs`, `scripts/hani-office-cafe-rest.test.mjs`.
- 이미지: 내장 image_gen 1회, 요청한 4개 층 아트와 실제 승인 chibi 시트를 전달. 최종 1672×941, 기존 파일명 유지. 생성한 카페 부분만 지정 영역에 합성하고 lossless WebP로 저장. 영역 밖 decoded RGB 변경 0. `compare.png`, `art-evidence.json`, `prepare-art.cjs` 및 생성 프롬프트를 근거로 보존.
- 1F 별도 HD 배경 없음. HD는 sprites-v3의 캐릭터 atlas 분기이며, 배경은 art map의 floor-1f-217.webp를 실제 loader가 사용.
- 기존 소파 좌석·door_cafe·junction_cafe·모든 label plate 원문 유지. 커피 주문/픽업 좌석과 별도 빈 바닥 접근 경로, 정문에서 안내대 안으로 향하던 경유점 교정. canonical edge 변경 2개, places 확장 anchor 2개. 보호 저장소 migration이나 Cloud schema 변경이 아님.
- 데이터만으로 먼저 실측했으나 평일 평균이 약 0.8~0.9명에 머물러 추가 조정 필요. 09–18시 ambient 업무 동작 기회만 300초 간격으로 낮춰 실제 휴식 예약 공간을 확보. 야간 cadence와 signature/group 원래 기회는 유지. 정식 카탈로그의 체류 상한은 기존 고정 범위를 우선해 보존.
- 정확한 소스 수정 행과 전후 내용: `artifacts/office-cafe/source-delta.json`. `placeStatusLabels` 전체 원문 byte 동일. 새 timer/renderer/DOM layer 없음.
- `office-obr21-plans.json.gz`, movement delta 등 frozen fixture는 재생성/수정하지 않음. 고정 소스/plan/snapshot 관련 실패와 Git 차단을 `tests.json` 및 REPORT에 구분.
- 저장소·Cloud·schema·version/cache·Notion 변경 없음. runtime closure는 128개, missing 0, 새 runtime 파일 0.
- 최종 office 32파일: assertion 244 PASS / 29 FAIL / 2 SKIP, 완전 통과 10파일 / assertion 실패 16파일 / 선행 Git 제한으로 요약 없이 중단 6파일. 실패에는 고정 소스·계획·좌표 계약과 변경 전 휴식 정책뿐 아니라 behavior 대기 대사와 221의 90초 동작 기대 등 비동결 실패도 포함됩니다. 전체 PASS가 아니므로 REPORT의 각 assertion을 검토해야 합니다. 기존 219는 미수정이며 이 환경에서는 선행 Git에서 차단됐습니다.
- 평일 점심 외 평균 0.867/0.842 → 3.531/3.644명, 점심 평균 1.678/1.667 → 6.556/6.744명. 하루 전체 드라마 도달성 대표님 있음 100/100·없음 95/100(요청 기준 93/88), 실제 자원·배우 예약 199,178쌍 위반 0. 카페 신규 3검사 PASS, obr21 전체 1F stationary/보고/desk gesture 검사도 PASS.
- 성능 단독 측정: cold best 없음 641ms·있음 831ms, warm max 0.83/1.59ms. 기존 cold 400ms 기준에는 미달합니다. 새 루프는 없지만 모바일 초기 계획 비용과 lossless 이미지 초기 로딩은 남은 위험으로 보고합니다. 중급 Android 경량 성능 PASS로 간주하지 않습니다.

## 다음 담당에게

- 먼저 `artifacts/office-cafe/REPORT.md`, `compare.png`, `breaks-before.json`, `breaks-after.json`, `audit.json`, `tests.json`과 `source-delta.json` 검토.
- 요청 제한에 맞춰 모든 변경은 미커밋. 실제 1F 화면/걷기/소파 사용/두 손님/label plate와 중급 Android 성능은 후속 검토자 실제 브라우저 확인 대기.
- 승인 후 frozen 소스·plans를 재생성할 담당은 후속 검토자. 이번 작업에서 기존 oracle/검사 강도를 변경하지 않음. 남아 있는 비동결 검사 실패도 REPORT에 명시하며 자동 PASS 처리하지 않음.
- 배포 blocker: runtime closure는 `data/` JSON을 수집하지 않으며 배포 브리지 `isAllowedReleasePath`도 `data/`를 허용하지 않는다. art-map, office-places, spatial-contract 세 파일을 일반 128개 package에 포함했다고 간주하면 안 된다. 배포 담당이 승인된 별도 데이터 반영 경로 또는 기존 runtime 파일 안에 정확한 데이터를 포함하는 방안을 먼저 결정·검증해야 한다. 정책/배포 스크립트는 이번 범위에서 변경하지 않았다.
- 이미지 용량 증가 약 222KB → 1.26MB는 픽셀 보존을 위한 lossless 인코딩 결과. 실제 모바일 초기 로딩은 미검증.
- main/Pages/Production read-back 모두 미실행. CURRENT/DECISIONS와 타 담당 인수인계 미수정. Notion은 이번 요청의 명시적 금지에 따라 미갱신.
