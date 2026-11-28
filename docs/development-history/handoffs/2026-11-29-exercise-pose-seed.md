# 승인된 운동 포즈 21장 앱 반영 인수인계

## 작업 식별

- 작업 ID / 제목: exercise-pose-seed / 승인된 21장 스프라이트 반영
- 갱신 시각(KST): 2026-11-29
- 담당 도구 / 검토 담당: Codex 단일 Agent / Git·커밋은 서윤
- 상태: 로컬 반영·대상 검증 완료 / 서윤 커밋 대기
- 저장소 / branch / worktree: PROJECT HANI / hani/exercise-pose / exercisepose (작업 지시 기준)
- base SHA / candidate SHA: 기존 HANDOFF-2.md 기록 ef5e5d4c4c84b09bd9295ac1e467f1eb6590ba43 / 후보 없음. Git 금지 지시로 원격 최신성·현 HEAD 미확인.
- 목표 / 완료 조건: 승인된 sheets-lossy 21장을 assets에 복사, manifest 해당 항목·전체 용량·layout만 갱신, 미대상 15개 항목 원문 보존 검증.
- 수정할 파일·범위 / 다른 담당과 겹치는 범위: assets/sprites-v3/<21 id>.webp, manifest-v3.json, artifacts/exercise-pose/SEED-REPORT.md, 본 인수인계. 기존 생성 산출물·타 담당 기록 보존.
- 사용자 승인 근거 / 승인되지 않은 경계: ../exerciseseed-task.md UTF-8 전체 정상 확인. 11/29 “그림 맘에 들어 앱에 넣어줘”. Git·JS·CSS·HTML 변경 금지, 배포 승인 없음.

## 결과와 증거

- 변경 전 검증: spriteBytes는 전체 36개 sizeBytes 합계 1,241,356과 일치. 기존 seongmin alpha를 A=0 / 1..254 / 255 히스토그램으로 정확히 재현. hani·gaeun standing contentRect를 alpha>0 bbox의 셀 상대 [x,y,w,h]로 재현.
- CODEMAP: living-office owner·dependency·DOM/event·targeted test 확인. 이미지 seed 전용 anchor는 CODEMAP_MISS이며 기존 manifest·생성 검증 기록으로 fallback. 코드 owner 변경 없음.
- 변경 결과: sheets-lossy 21장 원문 복사, 해당 manifest 21개 항목의 sizeBytes·sha256·alpha·quality 및 exercise/exercise-b 42개 프레임 추가. quality 20명88·아린94. 기존 84개 프레임과 키 순서 보존(혜진의 기존 sourceRect/contentRect 순서도 보존).
- 용량: spriteBytes 1,241,356 → 1,629,878 bytes. maxSpriteBytes 1,475,000 → 1,650,000 bytes(50,000 단위 올림). 전체 36개 합계 및 21장 각각100,000bytes 이하 확인.
- 실행한 검증: PowerShell UTF-8 Python stdin 실행, Python3.14.7/Pillow13.0.0. 복사 전 file 경로·기존 전체36장 metadata·기존 bbox/alpha 규칙 확인 → in-memory manifest 변경·원문 비교 → 복사·저장 → 실제 파일 재디코딩 및 manifest read-back. 최종 PASS. 실행 Python은 C:/Users/홍성민/AppData/Roaming/uv/python/cpython-3.14.7-windows-x86_64-none/python.exe, Pillow는 ../kidstoon/tmp/pylibs를 읽기 전용 사용.
- 보존 증거: 미대상 manifest 15개 JSON 원문 각각 바이트 동일·15개 WebP 동일·비대상 보호 파일145개 SHA-256 보존. 원문15블록을 원래 순서로 LF 하나로 연결한 SHA-256 전후 동일: 2d3d0c7447c8fa27060e915813db95969cebfa6241d00ed13e6b5236e41e4fe5.
- manifest SHA-256: 전 2b4b7dd0d6f0e3a565cea8535ca80bba7c07cec64056fae9a0601253501fe5bc → 후 14534dcc5bf6ea21ce905e08df29946c28d640d056106f691e0775387d9f781d. UTF-8 BOM 없음·2칸·LF·마지막 개행 유지.
- 최종 읽기 검증: 변경된21개 블록과 최상위3값을 baseline-2.json의 기존 원문 값으로 역치환하면 변경 전 manifest 전체 SHA-256과 정확히 일치. 나머지 항목·키 순서·형식의 바이트 보존을 재확인. 보고서·인수인계 UTF-8 한글 정상 및 깨진 문자 없음 확인(초기 Python stdin 보고서 인코딩 손실은 직접 UTF-8 패치로 교정).
- contentRect는 최종 WebP 셀의 alpha>0 bbox를 셀 상대 [x,y,w,h]로 계산. sourceRect는 파일럿6명 validation.json·나머지15명 validation-2-lossless.json의 생성 transform 값 사용, column-0 복사 대체 없음.
- 검사 도중 프레임 키 순서·Windows 경로 구분자를 고려하지 않은 검사 조건을 수정했다. 보호파일 비교 실패 시 원본 메모리 백업으로 복구 후 경로 정규화하여 최종 검증 완료. 초기 임시 백업 경로 쓰기는 권한 거절로 미사용, 저장소 밖 추가 쓰기 재시도 없음.
- 실행하지 않은 검증 / 남은 위험: 실제 renderer·브라우저·Production 미검증. 데이터 전용 LIGHT 범위로 Build/One-Pass/HINA 미실행.
- 데이터·저장소·Cloud·schema 영향: 사용자 데이터·저장·Cloud·schema 경로 변경 없음.
- PR / Preview / 배포 원문 링크: PR·배포 없음. 기존 compare.png·compare-2.png 및 최종 sheets-lossy가 승인 미술 근거.
- main / Pages / 표시 버전 / 실제 JS 로딩 / 기능 read-back: 모두 미실행. 기능 담당 규칙에 따라 표시 버전·cache 유지.

## 다음 담당에게

- 먼저 읽을 파일·관련 함수: artifacts/exercise-pose/SEED-REPORT.md, HANDOFF-2.md, validation-2.json, validation.json, validation-2-lossless.json.
- 다음 한 가지 행동: 서윤이 21장·manifest·보고서·본 인수인계의 diff 확인 및 커밋 처리. 이번 Git·commit/push·PR·merge·배포 수행 없음.
- blocker / 필요한 사용자 결정: 로컬 반영 blocker 없음. Notion 착수 insert_content는 자동 승인 검토에서 `MCP tool call requires approval, but approval policy is never`로 거절되어 미반영. 동일 쓰기 우회·재시도 없음.
- CURRENT / DECISIONS 갱신 내용: 다른 담당·과거 기록 보존, 공통 파일 수정 없음.
- Notion 갱신 대기: 기존 HANI-100 카드 https://app.notion.com/p/426c5275707481b78b59fafc39f81745 에 2026-11-29 KST / Codex / 승인된21장 앱반영·manifest42프레임·bbox/alpha/해시/용량 검증PASS / 합계1,629,878·한도1,650,000 / 미대상15항목 원문·145파일 보존 / 서윤 커밋 대기 / renderer·브라우저·운영 미검증 / 서버변경없음 / 승인근거 ../exerciseseed-task.md / base ef5e5d4(이전기록·최신성미확인) / 원문 artifacts/exercise-pose/SEED-REPORT.md 및 본 인수인계를 추가할 것. 저장 후 읽기 확인 전 갱신 완료로 보고하지 않음.
