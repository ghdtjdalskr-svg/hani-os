# 도우미 말풍선 시험 층 · 서윤 인계

- 2026-11-21 KST · 도연 / Codex 단독 + 자동 검사 · **시험 층 구현·검증 완료**. `hani/helper-bubble`, 착수·인계 HEAD `9ec0733b45958807523d905738bbe4f4da594c00`, 기준 main `ca76e21ee71359e83e2c278f683d6b3066184a96`. 원격 조회는 연결 실패로 최신성 미확인.
- 새 `scripts/hani-helper-bubble-{source,preload,reviewed-input}.cjs`, `scripts/hani-helper-bubble-layer.test.mjs`, `scripts/fixtures/helper-bubble-layer.json`. **helper-bubble → 305 → 304 → ui-polish-1 → 303 이하**, 독립 Git blob 기준 owner192개와 역변환 경계를 검사하며 실제 refs·객체 읽기는 보존.
- 기존 파일 변경 목록은 **`scripts/hani-release-305-source.cjs` 맨 앞 `require('./hani-helper-bubble-preload.cjs');` 한 줄뿐**. 기존 시험 import 추가0, 단언·fixture·hash 변경0. 연결문 자체도 역변환해 기존 source 검사에 원문 전달.

| 검증 | 결과 |
|---|---|
| `node scripts/<파일>.test.mjs` 전부 개별 실행 | **292개: PASS190 / 기존 일반 실패28 / Git 미검증33 / 환경 미검증41 / 남은 시간 제한0** |
| 핵심 | 새 층7/7·말풍선 기능7/7·305 8/8·304 7/7·UI 층6/6·UI 기능4/4·queen24/24 |
| 실패 대조 | 별도 사본의 main305 Git 원본 입력으로 기존 실패28개 재실행, 경로·시간만 정규화한 전체 로그28/28 일치. 검증 가능한 범위 새 회귀0 |
| 입력·실행 경로 | drift/EOL/중복/손상 fixture 거부, sync/callback/promise·URL·Buffer·fd·오류 전달, 하위 capture 순서·raw refs 보존. static closure174 / 누락0 |
| 원문 보존 | 착수 tracked2485개 중 위 연결문 외2484개 바이트 동일. 기존 시험291·fixture132·보호32경로·context-remote 원문 보존. 지정 JSON5 원복·바이트 일치 |
| 마무리 | syntax5/5·`git diff --check` PASS, 신규 생성 출력17개 local 이관, local ignore 확인 |

- 변경 전291개도 단독 실행해 불일치를 재현(성공123 / 실패 종료160 / 60초 제한8). 변경 후 `bori-stroll`만 180초 제한 뒤 재실행해 약223초에 종료: 하위13 PASS, Git 비교1개 EPERM. 최초 시간 제한은 PASS로 사용하지 않음.
- Git33·환경41 목록은 [기존 tooling 보고서](../tooling-304/RESULTS.md)와 동일. EPERM 뒤 기존 `deniedGitRead`의 URL/cwd 오류도 Git 미검증이며, 전체 skip인 브라우저 시험1개도 환경 미검증으로 분류. 기존 실패28도 별도 잔여 위험.
- 상세 로그·독립 기준 입력·실행기·집계·복원 근거는 `.gitignore`된 `local/`에만 보관: `final-summary.json`, `comparison.json`, `audit.json`, `after/preserved.json`.
- 이번 작업의 운영·저장·Cloud·schema·표시/cache `2.9.305`·릴리스 히스토리 변경0. 도구 전용이므로 runtime 버전 증가·Candidate/Build/One-Pass/HINA·UI Preview·Production 검증 N/A 또는 미실행. 실제 운영 완료로 보고하지 않음.
- commit·push·main merge·배포·Notion 갱신 없음. **서윤: Git33·환경41 재검증 및 후속 Git/306 준비**. [작업 인수인계](../../docs/development-history/handoffs/2026-11-21-helper-bubble-layer.md).
