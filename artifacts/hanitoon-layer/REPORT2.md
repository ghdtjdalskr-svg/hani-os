# 하니툰 시험 층 재캡처 완료

## 작업 식별

- 2026-11-23 22:20 KST / 도연·Codex / 로컬 검증 완료·서윤 인계.
- branch `hani/hanitoon`, base `6868fa386218e1eecc1f93b376974e3e7d30a7e2`, HEAD `b65b4b0c03cad8ee76d4721fde02a4877a1d8855`.
- 승인: `../toonlayer2-task.md` UTF-8 전체 정상 확인. 시험 층·bootstrap·outerFiles만 작업. CODEMAP_MISS로 실제 source/preload/capture 경로 확인.

## 결과와 증거

- 독립 Git 원문으로 toon-313의 source/preload/fixture 재생성·대조, 시험 head/base 고정값과 outerFiles 5개 지문 갱신. 실제 capture 순서 `toon-313 → 312 → procrast-312 → 311 → light-311`, 정·역재생·혼합 EOL·변조 거부·FS 계약 검증 PASS.
- 지정 **7파일 42/42 PASS**: toon-313 **6/6**, procrast-312 **8/8**, release-312 **9/9**, menu-badges **7/7**, toons **8/8**, runtime-closure-ilbo **3/3**, street-journal-closure **1/1**.
- `scripts/*.test.mjs` **320개 전부 단독 실행: 정상 219 / 비정상 101**. 이전 정상 **216개 전부 유지**, closure 2파일·toons 추가 정상. **새 비정상 종료 0 / 새 실패 단언 0 / 시작 오류 변경 0**. TAP 집계 1,892 PASS·59 FAIL·10 SKIP(이전 1,887·64·10). 잔여 101개는 기존 실패·환경 제약이며, Git EPERM 10파일·기타 EPERM 11파일은 **미검증**. 사무실 성능 새 실패 없어 재시도 N/A.
- 명령: PowerShell `& artifacts/hanitoon-layer/local/run-tests.ps1 -Phase after2` → 파일마다 `node --test-reporter=tap <file>`. [전체 비교·미검증 목록](local/comparison2.json), [개별 결과](local/after2/results.json). 지정 7파일은 `-Phase targeted2 -Names @(...)`로도 별도 실행.
- JS syntax 5파일·`git diff --check` PASS. 원문 runtime closure **186파일·누락 0**, 22편·실제 그림 46개 확인. [원문 근거](local/runtime-evidence2.json).
- HEAD 대비 기존 파일 차이는 `hani-release-312-source.cjs` bootstrap **1줄**과 `hani-menu-badges-historical-input.cjs` outerFiles **5개 등록(7줄)**뿐. 기존 시험 **319개**·fixture **148개** 및 서윤의 `hani-toons.test.mjs` 원문 보존, 기존 시험 import 추가 **0**. 운영·보호 경로·`.gitignore`·버전·히스토리·저장·Cloud·schema 추가 변경 **0**.
- 지정 JSON 5개 포함 기존 부산물 **799개 원문 해시 일치**. 변경 9개 복원·신규 출력 3개 `local/generated2/` 이관. tracked 2,714개·scripts 900개 착수 해시 비교 및 bootstrap/등록 역변환 검증 PASS. [보존 증거](local/preservation2.json), [복원 목록](local/restoration2.json).
- 원격 main 최신성은 네트워크 연결 실패로 미검증. 표시/cache **2.9.312 유지**, 버전 증가 N/A(시험 도구만 변경). 실제 브라우저·Preview·최신 JS 로딩·Production read-back 미검증.

## 다음 담당에게

- 서윤: Git/Edge 가능한 환경에서 미검증 항목 재실행, Git·Notion 후속 담당. 인계 범위는 toon-313 4파일·기존 허용 2파일·본 보고서이며 하니툰 기능 시험은 전달 원문 유지. 큰 로그·snapshot·임시 자료는 모두 `local/`이며 커밋 제외.
- commit·push·PR·main merge·배포·Notion 미실행. CURRENT/DECISIONS 및 다른 작업 파일 보존.
