# tooling-304 + 305 인수인계

- 2026-11-21 KST · 도연 / Codex 단독 + 자동 검사 · **구현·검증 완료, 서윤 인계**.
- `tool304` / `hani/tooling-304` / 착수·종료 HEAD `1062879952a9ca4a3ecce08bc013c8bc7c76f4e2`, 로컬 `origin/main` `8a46ac79705ac515da41d0dccf9ef72283bfad50`. 원격 조회는 연결 실패로 최신성 미확인.
- 승인 근거: `../tooling305-task.md`. commit·push·merge·배포·Notion 갱신 없음.

## 변경

- 새 `scripts/hani-release-305-{source,preload,reviewed-input}.cjs`, `scripts/hani-release-305.test.mjs`, `scripts/fixtures/release-305-layer.json`.
- **305 version/history·뉴스룸3호 inverse → 304 → ui-polish-1 → 303 이하**. 304 source에는 require 한 줄만 추가하고, 이 bootstrap도 305 fixture에서 정확히 역변환해 기존 source 검사를 보존.
- 3호만 제거한 `issues.json`은 304 Git 원본과 바이트 동일. 1·2호, 기존 289개 시험·단언·숫자, fixture131개·hash, context-remote 원문 모두 보존. queen HEAD/merge-base는 새 층의 전체 owner gate를 거쳐 기존304 투영으로 연결하며 실제 refs·객체는 raw로 유지.

## 검증

| 항목 | 결과 |
|---|---|
| `node scripts/<파일>.test.mjs` 전부 개별 실행 | **290개: 성공188 / 기존 실패28 / Git 미검증33 / 환경 미검증41 / 시간 제한0** |
| 핵심 | 305 **8/8**, 304 **7/7**, UI 층 **6/6**, UI 기능 **4/4**, queen **24/24**, 뉴스룸288 **7/7**, 변경 JS syntax **5/5** |
| 기존 실패 대조 | 같은 환경의 별도 사본에서 304 원본 입력으로 28개 재실행. 실패 이름·오류·JSON 오류 내용 모두 동일, 검증 가능 범위 새 회귀0 |
| 입력·closure | 각 경계 Git 원본 대조, drift·EOL·중복·손상 fixture 거부, callback/promise 검사 통과. static closure174 / 누락0, 동적 카탈로그 이미지1·2·3호는 별도 바이너리 Git 대조 |
| 보존·정리 | 원본2569파일 중 304 source 한 줄 외 모두 바이트 동일. 보호32경로·운영·데이터 보존. 지정 JSON5 포함 생성 출력11개 원문 복원, 신규 출력2개 local 이관 |

로그·snapshot·실행기·상세 집계·복원 근거는 `local/305/`와 `local/run-305.ps1`에만 보관(커밋 제외). Git33 재실행 목록은 기존 [RESULTS.md](RESULTS.md)와 동일. Git EPERM 및 이를 가린 기존 queen URL cwd 오류는 PASS가 아닌 미검증으로 분류.

## 다음 담당에게

- **서윤:** Git33·환경41 재검증 및 Git/후속 업무 진행. 기존 실패28도 별도 잔여 위험이며 이번 범위에서 수정하지 않음.
- 저장·Cloud·schema·운영 코드 변경0, 표시/cache305 유지. 개발도구 전용이므로 버전 증가·Candidate/Build/One-Pass/HINA·Preview·Production 검증은 N/A 또는 미실행. 실제 브라우저·운영 완료로 보고하지 않음.
- CURRENT/DECISIONS는 변경하지 않음. Notion은 명시적 금지에 따라 서윤 담당으로 남김. 추가 승인 요청 없음.
