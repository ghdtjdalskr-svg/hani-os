# tooling-301 · 출시 후 시험 층

- 담당·기준: 도연 / Codex, `hani/tooling-301` @ `0558dc3`; 독립 Git 객체 복사본 `ad95b84`와 대조. 원격 조회는 네트워크 연결 실패.
- 새 층: `scripts/hani-release-301-{source,preload,reviewed-input}.cjs`, `hani-release-301.test.mjs`, `fixtures/release-301-layer.json`. 순서 **301 version/history → ieum-seat → 300 → audit-1 → 299 이하**.
- 301 표시·캐시 60+1개와 history 새 항목/300 provenance만 exact inverse. 자리 교체 소유6파일은 기존 fixture와 실제301 Git 원문 일치, fixture 수정0.
- 복사된 ieum-seat 3파일은 source/preload 및 history 진입 import만 변경. 기존 시험·단언·숫자/hash·fixture 및 release300 연결 원문 보존.

- 기준 276파일: 종료0 168 / 실패 105 / 시간초과 3; Node 1522 PASS·66 FAIL·10 SKIP.
- 현재 280파일: 종료0 178 / 실패 99 / 시간초과 3; Node 1556 PASS·56 FAIL·10 SKIP.
- 비교: 새 회귀 후보 0, 누락 0. script PASS 표식 147→149.
- 전체 시험별 숫자·종료 상태: [TEST-RESULTS.md](TEST-RESULTS.md), [comparison.json](comparison.json). 단언 요약 미출력 시험은 파일 종료 결과로 구분.

| 핵심 시험 | PASS / FAIL / SKIP |
|---|---|
| hani-audit-1.test.mjs | 14 / 0 / 0 |
| hani-ieum-seat.test.mjs | 5 / 0 / 0 |
| hani-ieum-seat-history.test.mjs | 2 / 0 / 0 |
| hani-ieum-seat-layer.test.mjs | 4 / 0 / 0 |
| hani-release-300.test.mjs | 10 / 0 / 0 |
| hani-release-301.test.mjs | 7 / 0 / 0 |

- 보존: 최초 2347파일 감사, 허용 import 변경3곳 외 변경·누락 0; 기존시험 305·fixture 123 보존, 보호·운영·저장·Cloud 변경0. 지정 JSON4개 원문 복원. 기준 복사본 2335파일도 생성4개 외 원문 drift0. [preservation.json](preservation.json).
- 검증 환경: Windows PowerShell / Node v24.20.0; `& artifacts/tooling-301/run.ps1 -Phase baseline`, `-Phase current`로 각각 cwd에서 `node scripts/<파일>` 순차 실행(파일당90초 제한). JS 16파일 syntax·PowerShell 2파일 parser·whitespace PASS.
- 성능 재실행 숫자: [PERFORMANCE.md](PERFORMANCE.md), [performance.json](performance.json). 지정5개 중 실패한 시험은 2회 추가 실행. 최초/재실행 로그를 모두 보존.
- 성능 재실행: cafe-rest·companion-homes·lively-v2 각 2회, 모두 기준과 동일한 Git EPERM 1건만 실패. 카페·lively-v2의 400ms 성능 단언은 두 차례 모두 PASS. residents 49/49·staff-chat 17/17은 전체 실행에서 PASS.
- 기준/현재 공통 90초 미완료: bori-stroll·kids-weekday·obr14. 이 3건은 PASS가 아닌 미검증으로 유지.
- 시험 생성 미추적 16파일은 hash 검증 후 local/generated/로 보존 이관. local/generated-relocation.json에 원래 위치와 hash 기록. 착수 파일 이동·덮어쓰기 없음.
- 남은 위험: 기존 실패·Git/브라우저 subprocess EPERM·의존성 부재와 90초 내 미완료 시험은 미해결/미검증. 실브라우저·Preview·Candidate·Production 검증 미실행. 버전 증가 N/A(도구 전용).
  - 기준에서 성공한 시험의 새 실패 없음. 전체 PASS 선언은 하지 않음.
- commit·push·merge·배포·Notion 작업 없음(명시 금지, 서윤 담당). 기존 staged 복사본과 다른 담당 문서 보존. `local/` 전체 로그·원본·독립복사본은 커밋 제외.
