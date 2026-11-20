# tooling-303 · 출시 후 시험 층

## 작업 식별

- 2026-11-20 KST · 도연 / Codex 단일 Agent · 구현·허용 검증 완료, 서윤 인계. `hani/tooling-303` / base·HEAD·로컬 origin/main `af76a87f9456a0b0b25676fda5178aec75f91afc`.
- 승인: `../tooling303-task.md` 전체 UTF-8 정상 판독. 새303 시험 층과 queen-v3 보정만. 복사된 미커밋 파일 보존, commit·push·배포·Notion 금지(서윤 담당).
- CODEMAP_MISS: 해당 시험 층 항목 없음. 302/queen-v3 source·preload·reviewed-input과 실제 Git 객체로 소유 경로 확인. 원격 main 조회는 연결 실패로 최신성 미확인.
- 새303 5파일과 queen-v3 source/test 2파일만 추가 보정. **303 version/history → queen-v3 → 302 → dark-bundle → 301 → ieum-seat → 300 이하**. 기존 복사본은 그대로 보존.
- 실제303 메타데이터(버전60개·상수1개·새 히스토리/302 commit 보완)만 exact inverse. 실제 Git `af76a87 → 5073125 → d748920`은 메타데이터와 queen owner40개가 모두 정확할 때만 투영하며, 실제 refs·Git 객체 원문은 보존. 출시된 board JS/CSS와 queen fixture의 바이트 일치 확인.

## 결과와 증거

- **303 8/8·queen-v3 24/24·302 8/8·301 7/7·300 10/10·dark 9/9·공통 release baseline18/18 PASS.** JS7파일 syntax PASS. raw closure174/누락0, 하위8경계173→173→173→172→172→171→168→164/누락0.

| 전체 단독 실행(cwd=tool303) | 결과 |
|---|---|
| `scripts/*.test.mjs` 전부 | 286명령: 종료0 **185**, 실패 **100**, 180초 미완료 **1** |
| Native Git EPERM | **35명령 미검증**(종료0인2개 포함, 위 집계와 중복) |
| 완료된 TAP 집계 | 1639 PASS / 56 FAIL / 10 SKIP |

- 실행: `& artifacts/tooling-303/local/run.ps1` / Windows PowerShell·Node v24.20.0. 각 파일을 새 Node 프로세스에서 실행. 관찰 preload는 Git EPERM만 기록하며 결과를 대체하지 않음. [전체 명령·분류](local/TEST-RESULTS.md), [Git 미검증 재실행 목록](local/GIT-UNVERIFIED.md), [실패 제목·원본 로그 연결용 집계](local/summary.json).
- 알려진 **context-remote 단독 예외는 실패 그대로**, 파일 수정0. 그 외 실패·제약67명령에는 `syncThemeCollections`/`renderChibiNote` VM 누락, 과거 인원수·버전 기대값, package 포함 검사, 브라우저/실행 인자 누락 등이 남음. 전체 PASS 판정은 하지 않음.
- **보리 산책은180초 미완료**이며 Git EPERM도 관찰됨. Git 가능한 환경 재실행 필요. stdout 부분 결과를 PASS로 집계하지 않음.
- 카페·lively 성능 편차를 **각각2회 재시도**. 최초2개·재시도4개 성능 단언 모두PASS(400ms / warm3ms 기준 유지). 재시도4명령의 Git 비교는 모두 미검증. [측정값·성능 결과](local/performance.json), `local/perf-retry-{1,2}-logs/`.
- **착수2441파일 감사: 허용 범위 밖 변경·누락0.** queen 시험을 제외한 기존 시험311·fixture128·보호 경로·런타임 원문 보존. 지정 OBR16/17/19·drama JSON4개 원본 복원 및 SHA-256 확인, 새 산출물16개는 `local/generated/`로 이관. [보존 증거](local/preservation.json). 기존 local/·ignored 캐시는 감사 제외.
- 큰 로그·원문 백업·생성물은 `local/`에만 보관하고 `.gitignore`로 제외. 기존 복사 문서의 staged whitespace7곳은 원문 유지. 운영 코드·표시/cache303·저장·Cloud·schema 변경0, 버전 증가 N/A(개발도구 전용).
- 실제 브라우저·실계정 Cloud·Build/Candidate/One-Pass/HINA·main/Pages/Production read-back은 미실행. 이 보고서는 배포 완료 근거가 아님.

## 다음 담당에게

- 다음 한 가지 행동: 서윤이 이 보고서·실제 diff·Git 미검증 목록을 확인하고 Git 사용 가능 환경에서 재실행. 남은 범위 밖 실패도 목록대로 검토.
- 대표님 승인 범위는 시험 층 구현·검증뿐. **commit·push·main merge·배포·Notion 실행0**, 모두 서윤 인계. 서버 동반 배포 없음. CURRENT·DECISIONS·타 담당 문서 보존.
