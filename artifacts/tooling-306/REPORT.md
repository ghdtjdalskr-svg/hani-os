# tooling-306 · 서윤 인계

## 작업 식별

- 2026-11-21 KST · 도연(Codex) 단독 + 자동 검사 · **시험 층 구현·검증 완료**.
- `tool306 / hani/tooling-306`, base·HEAD `077df04dea15d27d530ba957ad544381cf45ae60`, 로컬 origin/main `077df04dea15d27d530ba957ad544381cf45ae60`. 원격 조회는 연결 실패로 최신성 미확인.
- 승인 근거: `../tooling306-task.md`. commit·push·main 병합·배포·Notion 금지(서윤 담당), 모두 미실행.

## 변경

- 새 `scripts/hani-release-306-{source,preload,reviewed-input}.cjs`, `scripts/hani-release-306.test.mjs`, `scripts/fixtures/release-306-layer.json`.
- **306 version/history → helper-bubble → 305 → 304 → ui-polish-1 → 303 → queen-v3 → 302 이하**. 306 항목과 305 provenance만 역변환하며 출시 Git 원본과 바이트 대조. helper 런타임·하위 fixture/hash는 보존.
- 전달된 helper 파일 중 `hani-helper-bubble-source.cjs`에 306 require 한 줄 추가(이 연결문도 역변환), `hani-helper-bubble-layer.test.mjs`에 새 306 fixture/test만 보존 검사에서 구분.
- 기존 파일 차이는 전달된 `scripts/hani-release-305-source.cjs`의 `require('./hani-helper-bubble-preload.cjs');` 한 줄뿐이며 그대로 유지. 기존 시험 import 추가0·단언 수정0. CODEMAP에 해당 층 anchor가 없어 기존305 owner로 좁혀 확인(CODEMAP_MISS).

## 결과와 증거

| 검증 | 결과 |
|---|---|
| `node scripts/<파일>.test.mjs` 전부 단독 | **293개: PASS 191 / 기존 FAIL 28 / Git 미검증 33 / 환경 미검증 41 / 시간 제한0**, 347회 실행 |
| 핵심 | release-306 8/8 · helper-bubble-layer 7/7 · helper-bubble 7/7 · release-305 8/8 · release-304 7/7 · ui-polish-1-layer 6/6 · ui-polish-1 4/4 · lounge-queen-v3 24/24 |
| 실패 대조 | 독립 main305 `ca76e21` Git 사본으로 기존 실패28개 재실행, 경로·실행 시간만 정규화한 전체 로그 **28/28 동일**. context-remote는 지정 예외로 원문 보존 |
| 경계·안전 | closure174/누락0, 모든 층 Git 바이트·raw refs 보존·전체 owner drift 거부·손상 fixture·sync/callback/promise/URL/Buffer/fd/오류 전달 검증. syntax9/9·diff check PASS |
| 원문 보존 | 착수 2489개 중 허용된 helper2개 외 모두 동일. 기존 시험290·fixture132·보호32경로 보존. 지정 JSON5 원복·바이트 일치 |

- 최종 사무실 perf 기준 실패 없음. 사무실 추가 재시도 4회(파일당 최대2회), 최종 분류는 위 집계와 local 로그 참조. Git EPERM 및 이를 가린 기존 URL cwd 오류는 PASS로 보지 않음. 환경 제약은 브라우저·Node 자식 프로세스·필수 인자 미제공 등.
- 초기50개는 306 fixture 최종 정리 후 다시 단독 실행. 최종 입력11개 SHA-256 불변 확인.
- 시험 생성 tracked 출력5개 원복, 신규 출력16개 `local/generated/` 이관. 모든 대형 사본·로그·실행기·상세 집계는 `artifacts/tooling-306/local/`에만 보존하고 `.gitignore` 확인.
- 상세: `local/summary.json`(전체 목록·분류), `local/comparison.json`, `local/audit.json`, `local/cleanup.json`. Git33·환경41 목록은 [기존 결과](../tooling-304/RESULTS.md)와 동일.

## 다음 담당에게

- **서윤:** Git·환경 미검증 재실행, 기존 실패28개 잔여 위험 확인 후 후속 Git/Notion 업무. 이 보고서와 local 증거부터 확인.
- 운영·저장·Cloud·schema 변경0, 표시/cache **2.9.306 유지**. 개발도구 전용이므로 버전 증가·Candidate/Build/One-Pass/HINA·UI Preview·Production read-back은 N/A/미실행. 운영 완료 보고 아님.
- CURRENT·DECISIONS 수정 없음. Notion은 명시적 금지에 따라 서윤 인계. 추가 승인 대기 없음.
