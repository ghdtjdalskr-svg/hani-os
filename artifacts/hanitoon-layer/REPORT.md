# 하니툰 메뉴 시험 층 · 구현·검증 종료 (미통과·미검증 포함)

## 작업 식별

- 2026-11-23 20:50 KST / 도연·Codex / `hani/hanitoon`.
- 착수 HEAD `726b99d36b222e02e87f4d35014224d68d107fca`, 로컬 main `f77f5da2c099ef0b88ef7037467f2dc825ba1122`.
- 승인 근거: `../toonlayer-task.md` UTF-8 전체 정상 확인. 시험 층·기능 시험·등록만 변경. 운영·버전·히스토리·저장·Cloud 변경 및 commit/push/배포/Notion 금지.
- 범위: `hani-toon-313-{source,preload}.cjs`, 신규 시험 2개·fixture, 312 source bootstrap 1줄, historical outerFiles 등록. CODEMAP에 하니툰 anchor가 없어 실제 owner `hani-toons.js`로 fallback(`CODEMAP_MISS`).
- 원격 최신성: `git ls-remote origin refs/heads/main` 네트워크 연결 실패. merge/rebase 없음. 표시/cache 2.9.312 유지, 운영 화면·JS 로딩 미확인.

## 결과와 증거

- `toon-313 → 312 → procrast-312 → 311 → light-311` 실제 capture·독립 Git blob·역변환/정변환·혼합 EOL·변조 거부·FS 계약 시험 **6/6 PASS**. 294~312 개별 릴리스 시험도 모두 정상 종료.
- 하니툰 기능 시험 **7 PASS / 1 FAIL**. 실패 후 재진입은 운영 원문에서 fetch **2회**이며 요구값은 1회다. 정상 로드의 동시/재진입 1회, 실패 안내·경로/id 필터·이스케이프·저장소 접근 0·22편의 실제 이미지 46개는 PASS. 운영 수정·단언 완화·skip 처리 없음.
- `scripts/*.test.mjs` **320개 전부 단독 실행: 정상 종료 216 / 비정상 종료 104**. 집계된 TAP는 1,887 PASS / 64 FAIL / 10 SKIP이며, TAP 시작 전 실패도 있어 파일 결과를 함께 봐야 한다. Git EPERM 10파일 및 기타 EPERM 11파일은 **미검증**이다. 전체 PASS 아님.
- 전달 `REG.txt` 89파일 중 **79파일 정상 종료**. 잔여 10파일은 closure 2개, Git EPERM 2개, Edge EPERM 2개, 기존 하위 어댑터의 URL 인자 오류 4개다. 보관된 착수 전 211파일과의 부분 비교에서 새 비정상 종료 0개(전체 비교 판정은 아님).
- 명령: `powershell -NoProfile -ExecutionPolicy Bypass -File artifacts/hanitoon-layer/local/run-tests.ps1 -Phase after` → 파일마다 `node --test-reporter=tap <file>`. [전체 집계·실패 목록](local/summary.json), [개별 로그](local/after/results.json).
- 사무실 성능: 카페 cold <400ms, lively cold <400ms·warm <3ms PASS(lively 약 275ms / 0.543ms). 성능 흔들림 실패가 없어 2회 재시도는 N/A. 기존 URL/Git 오류를 성능 실패로 처리하지 않았다.
- 기존 시험 import 추가 **0개**, 기존 시험 318개·fixture 148개·hash·단언 원문 보존. 기존 파일 변경은 `scripts/hani-release-312-source.cjs` 첫 줄 bootstrap 1개와 `scripts/hani-menu-badges-historical-input.cjs` outerFiles 등록 5개뿐이다. syntax 6파일 PASS.
- 지정 JSON 5개 포함 기존 부산물 원문 복원 완료(변경 9개 복원, 새 출력 3개 `local/generated/after-313/` 이관). 2,714개 tracked 파일의 착수 전 해시 비교에서 위 승인된 2파일만 변경. 운영·버전·히스토리·보호 경로·`.gitignore`·저장·Cloud 추가 변경 0. [보존 검증](local/preservation.json), [복원 기록](local/restore-after-313.json).

## closure 차단 원인 (층으로 덮지 않음)

- 현재 작업트리 원문 closure는 **186파일 / 21,101,705 bytes / 누락 46개**. JSON의 `assets/toons/...`를 resolver가 JSON 디렉터리에 상대 해석하여 `assets/data/assets/toons/...`를 찾는다. 실제 이미지 46개는 존재한다.
- 이미지 경로가 모두 포함된다고 가정하면 **232파일 / 31,032,253 bytes**로 계약 **200파일 / 25,000,000 bytes**도 초과한다. 두 closure 시험의 import·resolver·계약 변경 0. [원문 근거](local/runtime-evidence.json).

## 다음 담당에게

- 서윤: 실패 후 fetch 정책과 closure 경로·파일 수·용량 대응 판단, Git/Edge 가능한 환경에서 미검증 항목 재실행. Preview/실제 JS 로딩/Production read-back은 미실행이며 릴리스 준비 완료 판정 아님.
- 신규 5파일과 승인된 기존 2파일·본 보고서가 인계 대상. `local/`은 큰 임시 자료·스냅샷·로그이므로 **커밋 제외**. 기존 다른 작업 파일 보존.
- commit·push·PR·main merge·배포·Notion 갱신 미실행. Git·Notion 후속은 지시대로 서윤 담당이며 배포 승인으로 확대하지 않음. 개발 히스토리/CURRENT/DECISIONS도 수정하지 않음.
