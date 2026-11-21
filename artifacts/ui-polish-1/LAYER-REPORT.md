# 화면 다듬기 1차 · 시험 입력 층

- 2026-11-21 KST · 도연 / Codex 단일 Agent. `hani/ui-polish-1`, base `09ba997070b6262dd9194db4a4430d5a91225c7d`, 착수 HEAD `ed0881c31e948678c75541e15941274f41e4f3a6`.
- 승인 근거: `../uilayer-task.md` 전체 UTF-8 정상 판독. 시험 층·기존 시험 import 1줄만 허용. 운영·기존 fixture/hash/단언·버전·히스토리·저장·Cloud 수정 금지, commit·push·배포·Notion은 서윤 담당.
- CODEMAP_MISS: 이 시험 층 항목 없음. 303/queen-v3 source·preload·reviewed-input과 실제 Git 객체로 경계 확인. 원격 조회는 네트워크 연결 실패로 최신성 미확인, 로컬 origin/main은 전달 base와 일치.
- 복원 순서: **UI Polish 1 → 303 version/history → queen-v3 → 302 → 기존 하위 층**. CSS 기존 340,851바이트를 보존한 LF 추가 블록 16,003바이트만 정확히 제거. 시험 import도 역변환하여 기존 owner pin을 유지. 모든 입력·출력 전체 SHA-256과 추가 원문을 새 fixture에 고정.
- 정확한 입력과 owner가 모두 일치할 때만 시험용 merge-base를 `09ba997 → af76a87`로 연결한다. 실제 refs·Git 객체 원문과 다른 Git 질의는 보존한다.

## 새 파일

- `scripts/hani-ui-polish-1-source.cjs`
- `scripts/hani-ui-polish-1-preload.cjs`
- `scripts/hani-ui-polish-1-reviewed-input.cjs`
- `scripts/hani-ui-polish-1-layer.test.mjs`
- `scripts/fixtures/ui-polish-1-layer.json`
- 이 보고서와 `artifacts/ui-polish-1/.gitignore` (`local/` 제외).

## import 1줄 추가한 기존 시험

모두 `scripts/` 아래이며 나머지 바이트는 착수 원문을 보존한다.

1. `hani-audit-1.test.mjs`
2. `hani-chibi-pack-3.test.mjs`
3. `hani-design-polish-1.test.mjs`
4. `hani-design-polish-1-main295.test.mjs`
5. `hani-design-polish-2.test.mjs`
6. `hani-design-polish-2-main297.test.mjs`
7. `hani-hero-restore.test.mjs`
8. `hani-lounge-queen-v3.test.mjs`
9. `hani-newsroom-285-source.test.mjs`
10. `hani-newsroom-4cut-288.test.mjs`
11. `hani-pb-chibitoon.test.mjs`
12. `hani-stale39-source.test.mjs`
13. `hani-theme-thaw-source.test.mjs`
14. `hani-release-294.test.mjs`
15. `hani-release-295.test.mjs`
16. `hani-release-296.test.mjs`
17. `hani-release-297.test.mjs`
18. `hani-release-298.test.mjs`
19. `hani-release-299.test.mjs`
20. `hani-release-300.test.mjs`
21. `hani-release-301.test.mjs`
22. `hani-release-302.test.mjs`
23. `hani-release-303.test.mjs`
24. `hani-release-version-layers.test.mjs`
25. `hani-dark-bundle-layer.test.mjs`
26. `hani-brand-heroes-218.test.mjs`
27. `hani-ieum-seat-history.test.mjs`
28. `hani-login-a-204.test.mjs`
29. `hani-ocr-accuracy-224.test.mjs`
30. `hani-office-219.test.mjs`
31. `hani-proactive-204.test.mjs`
32. `hani-reviewed-release-baseline.test.mjs`

## 검증·미검증

Windows PowerShell / Node v24.20.0, cwd=`uipolish1`. 각 파일을 별도 Node 프로세스로 실행했다. 권한 관찰기는 오류를 기록한 뒤 원래 결과·오류를 그대로 반환한다.

| 항목 | 결과 |
|---|---|
| `scripts/*.test.mjs` 전부 | **288파일: 종료0 186 / 실패 101 / 180초 미완료 1** |
| 완료된 TAP 집계(재시도 중복 제외) | **1,646 PASS / 59 FAIL / 10 SKIP** |
| 새 층 / 기존 UI Polish 1 / 새 JS syntax | **6/6 / 4/4 / 4/4 PASS** |
| import 연결한 32파일 | **31개 종료0**, queen-v3 **23/24** |
| 기존 294~303 / 공통 baseline / version-layers | 모두 종료0 |
| 카페·lively-v2 성능 | 각각 최초+2회 재시도 **6회 모두 PASS**, 기존 400ms·3ms 기준 유지 |

- 전체 실행 292회(office-icons·lively-v2 자동 재시도 각2회 포함)와 카페 추가2회. 카페 best 270.14~349.89ms, lively cold best 298.48~308.92ms / warm 0.617~0.647ms. 해당 파일의 Git 비교는 아래 미검증과 별개다. [성능 원문](local/performance.json)
- **queen-v3 잔여1건**: 실제 HEAD를 과거 `af76a87`로 고정한 단언이 현재 `ed0881c`와 불일치한다. merge-base는 연결됐으며 기존 단언과 실제 refs를 바꾸지 않았다. 303 원문 입력 비교에서는 queen 21/24 → 현재23/24, 도우미·운세 기존6실패는 동일했다.
- **context-remote 단독 예외는 실패 그대로**, 수정0. 그 외 VM 누락·과거 기대값·인자/브라우저 환경 등 실패·제약도 전부 보존했다. 전체 PASS 판정은 하지 않는다. [전체 명령·실패 제목·로그](local/TEST-RESULTS.md), [집계](local/summary.json)
- **보존**: 착수 tracked **2,457파일** 감사, 허용 import32개 외 변경·누락0. 기존 fixture129·시험 나머지 바이트·운영/보호 경로·표시/cache303·히스토리·저장·Cloud·schema 보존. 필수 OBR16/17/19 및 drama JSON4개와 `artifacts/m9-link/closure.json` 원문 복원. 생성 결과8개는 `local/generated/`로 이관. [SHA-256 보존 근거](local/preservation.json)
- 실행: `& artifacts/ui-polish-1/local/run-tests.ps1 -Label verified` (완료된 최초 실행 기록; 동일 label 재실행 시 로그 덮어쓰기 주의). 초기 종료코드 수집 실패로 중단한 `local/final/`은 최종 근거에서 제외했다. 큰 로그·백업·실행기는 모두 ignored `local/` 안에만 보관한다. 개발도구 전용으로 버전 증가 N/A.

### 미검증 목록

모두 `scripts/hani-<아래 이름>.test.mjs`. 권한 오류48개는 위 종료 결과와 중복이며, 종료0인 `dev-report-generate`, `proactive-204`, `staff-floors-214`도 해당 권한 검사는 미검증이다.

- **Git EPERM 35개**: `boardroom-voice-contract`, `dev-report-generate`, `media-core`, `meeting-character-voice`, `meeting-engine-v2-batch1`, `office-actions-216`, `office-affinity-274-pins`.
- `office-barista-night-273-pins`, `office-bori-stroll`, `office-cafe-rest`, `office-chairman-234`, `office-chairman-patrol-278-pins`, `office-companion-homes`, `office-companions-276-pins`.
- `office-consult`, `office-icons`, `office-lively-v2`, `office-mascot-label`, `office-obr12`, `office-obr14`, `office-obr15`.
- `office-obr21`, `office-obr4`, `office-obr6`, `office-obr7`, `office-obr8`, `office-obr9`, `office-pet-bori-272-pins`.
- `office-pets-268-pins`, `office-pets-bubble`, `office-v2-215`, `office-xmas-269-pins`, `offline-transport-223`, `proactive-204`, `protected-gate-integration`.
- **기타 프로세스 EPERM 13개**: `banners-203-ui`, `boardroom-cross-review`, `drive-vault-precheck`, `history-226`, `ilbo-213`, `ilbo-banner-215`, `launch-greeting-221`, `newsroom-4cut-230`, `polish-215`, `remote-card-224`, `remote-media-219`, `staff-floors-214`, `ui-203b-ui`.
- **시간 제한**: `office-bori-stroll`은 Git EPERM과 함께 180초 미완료. 부분 결과를 PASS로 집계하지 않았다.
- 실제 브라우저·실계정 Cloud·Candidate/One-Pass/HINA·운영 read-back은 미실행. 원격 main 최신성도 네트워크 제한으로 미확인.

## 인수인계

- 다음 담당: 서윤. 실제 diff·위 미검증 목록을 권한 가능한 환경에서 재검증하고 queen의 실제 HEAD 고정 단언을 별도 판단. 구현·허용 검증 완료, 잔여 실패·제약을 포함해 인계한다.
- 실제 브라우저·실계정 Cloud·Candidate/One-Pass/HINA·main/Pages/Production read-back은 이 작업 범위 밖. 서버 동반 배포 없음.
- CURRENT·DECISIONS·타 담당 기록 보존. Notion은 명시적 금지에 따라 실행하지 않았으며 서윤 기록 대기. commit·push·merge·배포 없음.
