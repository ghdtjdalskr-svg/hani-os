# tooling-286 · 2.9.286 시험 기준 갱신

2026-11-10 KST · Codex · `hani/tooling-286` / `tool286` / base `5f40eb405cc057a16dc8f30ebc195ff5aed8d77c`. **미커밋·Git 명령 0·런타임 변경 0**. 커밋은 서윤 담당입니다. 원격 새 조회 없이 로컬 origin/main ref와 검증된 object를 사용했습니다. 전원 종료 전 결과를 참고하고 지정 시험은 재개 후 최종 상태에서 다시 실행했습니다.

286 버전(index60/main1)·이력(286 항목/285 commit) exact inverse를 공통 JSON에 추가하고, **daily/evening → weekday → B → 285 → newsroom → 284/치비툰 → 283/생활/M9** 체인을 연결했습니다. 285 시험은 import만 바꿔 바깥 입력을 285로 투영하며 기존 assertion 본문은 바이트 동일합니다. 기존 manifest 행·꼬마 고정 pin·공통 실행 모듈을 보존했습니다. 새 부정 시험은 Buffer/전체 SHA/중복/부분/EOL/반복 inverse·baseline 이름 격리를 검사합니다.

**전체 변경 파일 75개: 추가 56 / 수정 19 / main 파일 삭제 0.** 착수 391개(전달된 389개 + baseline 갱신2)에서 신규 중간 파일 324개를 정리했습니다. 꼬마 증거 358개 → 34개: 실제 읽는 baseline3·최종 REPORT·결과 JSON·대표 PNG5. retained 원문은 그대로이며 보관/제거 전체 목록은 SUMMARY에 있습니다.

| 검증 | 결과 |
|---|---|
| office 전체 77파일 (속도2파일 별도 순차) | 816통과 / 36 Git차단 / 1 기타실패 / 4 skip |
| 꼬마 관련 전부 | 286-source 3/3 · lively 15/15 · merge 10/10 · pose-b 13/13 · visit 16/16 · weekday 19/19 |
| pb-chibitoon / procrastination / 생활·study·wishlist / dev-report | 전부 PASS (69건은 뉴스룸·버전 포함 feature 합계) |
| newsroom 4컷·persona·285 / release-version-layers | 8/8 · 4/4 · 2/2 · 5/5 PASS |
| 지정 M9 (polish+link preload) | 15/15 PASS |
| nav/navlogin/dashboard 정적 + PC/폰 UI / design-system-qa | 모두 PASS |
| 변경 JS syntax | 4/4 PASS |

400ms 한도는 변경하지 않았습니다: hani-office-cafe-rest.test.mjs PASS · hani-office-lively-v2.test.mjs PASS. 실측은 SUMMARY에 기록했습니다. 219는 Git 비교가 먼저 차단되어 지정된 기존 실패 assertion까지 재현하지 못했습니다. Git 차단은 목록만 기록하며 PASS로 세지 않습니다.

남은 기존 항목: **3F 이미지 215 기대/218 실제 불일치1**, 추가 M9-link packaging 누락4경로(9/10), 이전 실행의 추가 phase1 디자인 QA 로그인 잠금 fixture 첫 클릭 차단(이번 재개에서 재실행하지 않음). 해당 main 시험/art-map 바이트 동일을 확인했고 assertion·gate/server를 고치지 않았습니다. 실계정·Android·Production 검사는 수행하지 않았습니다.

**런타임 503파일 origin/main 바이트 동일**, 표시2.9.286·내부2.9.15-safe-baseline-bootstrap·보호 저장소/Cloud/schema 보존. 시험 부산물 4개 원문 복원·신규 2개 제거. 새 보고서는 이 REPORT와 SUMMARY 두 파일뿐이며 로그·임시 폴더는 worktree 밖입니다. tooling-only이므로 runtime build/version/Production QA N/A.

인수인계: 승인 범위는 지정 과제의 시험층/증거 정리입니다. CURRENT와 타 담당 원문은 착수 상태로 보존했습니다. 다음은 **서윤 검토 → Git 차단 목록 재검증 → 커밋**이며 PR/main 병합·배포는 하지 않았습니다. 승인된 runtime read-back 완료 사실은 과제 전달 근거이며 이번에 재실행한 결과가 아닙니다.

Notion은 읽기만 성공했습니다. 쓰기는 자동 승인 검토가 `approval policy is never` 사유로 거절하여 저장/read-back 없이 갱신 대기입니다. 현황판 반영할 요약은 SUMMARY의 notion.pending에 남겼습니다.
