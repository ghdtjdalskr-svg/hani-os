# 꼬마 남매 B + 평일 방문 · main 284 병합 인수인계

## 작업 식별

- 작업 ID / 제목: kids-b-merge / 진행 중 병합 파일 충돌 정리
- 갱신 시각(KST): 2026-11-08
- 담당 도구 / 검토 담당: Codex 단독 / 서윤 후속 커밋
- 상태: 코드·실행 가능한 시험 완료 / Edge·Notion 차단 / Git 최종 처리 대기
- 저장소 / branch / worktree: hani-os / hani/kids-visit-pose-b / kids-visit-b (대표님 지정, Git 조회 없음)
- base SHA / candidate SHA: 지정 main 5c375d9(v2.9.284), 기존 branch 기준 bbe71c0 / Candidate 아님
- 목표 / 완료 조건: 충돌4개 정리·양쪽 기능 보존·office/kids 시험은 완료, Edge 새 PNG는 미완료
- 수정 범위: 기존 office JS 충돌, M9·mascot 시험 연결, kids exact inverse/기준 사본, 284→283 시험 inverse, CURRENT 양쪽 보존 및 작업 기록
- 사용자 승인 근거 / 승인되지 않은 경계: ../kids-b-merge-task.md 전체 수행. Git 명령·커밋·push·새 merge·배포·버전 증가 없음. 저장/Cloud/schema 변경 없음.

## 결과와 증거

- 상세 변경·표·명령: artifacts/kids-visit-b/REPORT-merge.md 및 merge-evidence/final-summary.json
- 검증: office 72파일 783통과·35Git 차단·1기타 실패·3skip, M9 15/15. 기타1건은 cafe-rest 400ms 제한으로 고정main 단독에서도 최소460ms로 재현. 제한·scheduler 보존, PASS 처리 없음. 문법11/11, main 전체 해시 복원·기존 assertion 보존·저장/Cloud/새timer/listener0. 원문 closure164/누락0.
- 데이터·저장소·Cloud·schema 영향: 없음. 기존 cap owner 전체 바이트 보존. 운영 데이터 접근 없음.
- 미검증: Edge spawn EPERM/Windows 접근 거부로 PC1280/폰390 PNG0. 올바른 평일·16시 실행기 준비. Git 검사 차단 뒤 assertion은 미검증, 219 기존 실패는 이번에 Git에서 차단.
- CODEMAP: living-office owner 확인, kids anchor 없음(CODEMAP_MISS). 기존 companionPeople/companionSnapshot/updateResidents 경로 사용.
- 기준선 / identity: main office 8d2db07921446cca8a234acfff4f026a2d44f0fdb2dedcea241dba6f462cd54e; 결합 runtime 7e941be508a5efea0c309c8c689cd32bf976d3122a49ac34c7579e33acf67f36. 284 version inverse는 기존 283 pin과 정확히 일치하며, 공통 version-layers 파일 부재로 기존283방식을 따름.
- main / Pages / 표시 버전 / 최신 JS / 기능 read-back: main 병합 진행 중·커밋 없음. 로컬 표시/cache2.9.284, hani-ui-v02992.js?v=2.9.284, 마지막 hani-launch-greeting.js. Pages·Production·원격 최신성 새 확인 없음. Candidate/HINA 미수행.
- PR / 배포: 없음. 서버 Edge Function·설정 변경 없음.
- 부산물: JSON 4개 착수 바이트 복원, 신규 출력 0개 별도 보존. 임시 프로필 정리 명령은 정책 거절, 작은 임시 폴더 잔여.
- Notion: 현황판 읽기 완료. 착수 append가 자동 승인 검토에서 approval policy is never로 거절되어 저장/read-back 없음. 위 완료·차단 요약 갱신 대기.

## 다음 담당에게

- 먼저 읽을 파일·함수: REPORT-merge.md, merge-evidence/results.md, 기존 companionSnapshot/updateResidents
- 다음 한 가지 행동: 허용 환경에서 Edge 캡처·Git 차단 검사·기존 main 성능 잔여 확인 후 서윤이 index 처리·커밋
- blocker / 필요한 사용자 결정: 환경의 Edge 실행 권한과 Notion 쓰기 정책. 추가 데이터/배포 승인 요청 없음.
- 다른 작업 영향: 타 worktree 수정 없음. main의 cap·mascot·생활 묶음·284치비툰 보존. 수정된 시험 fixture/기준 사본도 함께 검토·커밋 필요.
- CURRENT / DECISIONS: 양쪽 CURRENT 기록 보존 후 이 결과 요약 추가. 새 결정 없음.
