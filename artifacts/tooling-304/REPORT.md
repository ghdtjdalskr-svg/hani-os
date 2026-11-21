# tooling-304 인수인계

- 도연 / Codex · 2026-11-21 KST · **시험 층 구현 완료, 서윤 재검증 인계**.
- `tool304` / `hani/tooling-304` / 고정 base·HEAD `cb1b9376aac575eb3f60a98f01afbe3855282798`.
- 승인 근거·범위: `../tooling304-task.md`. commit·push·merge·배포·Notion 갱신 없음.
- 원격 새 조회는 연결 실패. 로컬 origin/main은 작업 중 `8a46ac7`(v305, #531)로 진행했으며 merge/rebase하지 않음. 표시/cache304·최신 UI 참조 `hani-ui-v02992.js?v=2.9.304` 유지(소스 확인).

## 변경

- 새 `scripts/hani-release-304-{source,preload,reviewed-input}.cjs`, `scripts/hani-release-304.test.mjs`, `scripts/fixtures/release-304-layer.json`.
- 순서: **304 version/history → ui-polish-1 → 303 → queen-v3 → 302 이하**. UI source에서 304를 먼저 연결하고 새 UI fixture에 import 역변환 134행을 추가. 복사된 기존 33행·owners는 보존.
- 기존 시험 166개는 **import 한 줄만**(전달32 + 추가134), Git 객체 대조로 본문·단언 변경0. [전체 목록](IMPORTS.md).
- queen의 고정 HEAD/origin 단언은 새 304 층의 시험용 참조 투영으로 연결. 실제 refs·Git 객체는 raw 경로로 보존. 후속 tooling HEAD와 무관한 ancestry·파일 drift도 시뮬레이션 검증.

## 검증

| 항목 | 결과 |
|---|---|
| `scripts/*.test.mjs` 각 파일 단독, cwd=tool304 | **289개: 성공187 / 기존 실패28 / Git 미검증33 / 환경 미검증41** |
| 핵심 | 304 **7/7**, UI 층 **6/6**, UI 기능 **4/4**, queen-v3 **24/24**, syntax **9/9** |
| 기존 실패 | 28개 모두 UI 적용 전 `09ba997` 입력과 실패 이름·오류 동일. context-remote 예외 원문 유지 |
| 보리 산책 | 최초 실행기 180초 제한 → 226초 재실행 완료: 동작13 PASS / Git1 미검증. 최종 시간 제한0 |
| 사무실 성능 | 성능 단언 실패0, 2회 재시도 대상 없음. 기준 숫자 수정0 |
| 운영·보호 보존 | root runtime72·보호 경로32·기존 fixture129 바이트 동일. raw closure174 / 누락0, #529 여섯 파일 원문·런타임 미참조 확인 |
| 시험 부산물 | 지정 JSON5 원문 복원, 생성 결과17개와 로그·snapshot은 `local/`에만 보관·Git ignore 확인 |

검증한 범위에서 새 회귀0. [파일별 결과·Git 재실행33개](RESULTS.md), 상세 증거는 `local/`(커밋 제외).

## 다음 담당에게

- **서윤:** RESULTS의 Git33개와 환경41개 재실행 후 Git/후속 배포 업무 진행. Git EPERM이 기존 queen fallback의 URL cwd 오류로 가려진 경우도 미검증으로 분리함.
- 저장·Cloud·schema·운영 코드 변경0. 기존 시험/fixture/hash, context-remote, root `.gitignore`, 지정 OBR16/17/19·drama·M9 JSON 보존.
- 버전 증가·Preview UI·Candidate Build/One-Pass/HINA·main merge·Pages·실제 JS 로딩·Production read-back은 개발도구 전용 작업으로 N/A 또는 미실행. 실제 화면·Cloud·운영 완료로 보고하지 않음.
- CURRENT/DECISIONS/Notion은 이번 파일 범위·명시적 금지에 따라 수정하지 않음. 인수인계 원문은 이 보고서.
