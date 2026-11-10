# kidsb-285 · 285 시험 기준 연결

2026-11-09 KST · Codex 단독 개발·자동 시험 · worktree kids-visit-b · branch hani/kids-visit-pose-b. HEAD **f296f6a75a10b90a15ad0578bb74c52a76d425d7**, 로컬 origin/main **9543fbdab0fd1ee3f30cc058c47249b5af5cdb76**(v2.9.285 + tooling #478). Git 명령·커밋·push·merge·배포 없음. 원격 최신성 새 조회 없음.

과제 ../kidsb-285-task.md 전체를 UTF-8로 정상 확인했습니다. HANDOFF-TEMPLATE의 식별·증거·인계를 이 보고서와 [결과 JSON](results-285.json)에 통합했고 다른 현황·보고서는 수정하지 않았습니다. CODEMAP living-office owner 확인, kids/affinity anchor 부재는 CODEMAP_MISS로 처리해 해당 시험·inverse만 좁게 확인했습니다.

## 변경

- hani-release-284-source.cjs: 기존 exact 284 assertion 바깥에서 공통 release-version-layers의 285 버전·뉴스룸 층을 먼저 통과합니다. 공통 모듈·manifest·newsroom-285 모듈 및 모든 기존 fixture pin은 변경하지 않았습니다.
- kids-merge: 기존 284 변조 검사를 해당 경계에 유지하고, 실제 285 입력의 직접 역변환·부분/중복/EOL 거절도 확인합니다.
- kids-weekday / 새 hani-office-kids-main-source.cjs: weekday 역변환 뒤 main의 승인된 affinity v2 owner·마스코트 변경만 정확하게 되돌려 기존 기준 사본과 비교합니다. 전체 입력·출력 SHA256, 완전한 유일 치환, Buffer·drift·중복·반복 역변환 검사를 유지/추가했습니다. 실제 runtime affinity v2는 보존됩니다.
- pb-chibitoon: 공통 285 → 284 기능 경계 → 꼬마 B/weekday 층으로 closure와 원문을 비교합니다. 바이너리 Buffer를 보존하며 기존 추가 목록 [치비툰 시트 1개]·변경 JS/CSS 2개·200개 상한 assertion은 그대로입니다.

## 시험 결과

| 범위 | 결과 |
|---|---|
| office 전체 72파일 | 785 통과 / 35 Git 차단 / 0 기타 실패 / 3 skip |
| office-kids-lively.test.mjs | 15 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| office-kids-merge.test.mjs | 10 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| office-kids-pose-b.test.mjs | 13 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| office-kids-visit.test.mjs | 16 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| office-kids-weekday.test.mjs | 17 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| dev-report-generate.test.mjs | 1 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip (내부 10그룹) |
| life-bundle-source.test.mjs | 5 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| newsroom-285-source.test.mjs | 2 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| newsroom-4cut-230.test.mjs | 8 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| newsroom-persona.test.mjs | 4 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| pb-chibitoon.test.mjs | 5 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| procrastination-board.test.mjs | 6 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| release-version-layers.test.mjs | 5 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| seoyun-m9.test.mjs | 15 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| study-retry.test.mjs | 26 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| wishlist-quick-add.test.mjs | 7 통과 / 0 Git 차단 / 0 기타 실패 / 0 skip |
| 수정 5파일 syntax | 5/5 PASS |
| runtime/정적 자산 HEAD 원문 비교 | 504/504 바이트 일치 |
| raw runtime closure | 164파일 / 누락 0 / kids-v2 포함 |

파일별 명령·집계는 JSON에 있습니다. office 수에는 각 파일이 import한 공통 fixture 시험이 포함되고, 꼬마 하위 표는 전체 결과를 재참조합니다. 합산 중복은 하지 않았습니다. 모든 Git 호출은 임시 preload에서 실행 전에 차단했고 차단 검사는 PASS로 표시하지 않았습니다. JSON의 command는 재실행용 본래 명령이며 이번 실행에는 Git 차단 preload가 추가되었습니다.

M9 지정 명령: node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none scripts/hani-seoyun-m9.test.mjs — **15/15**.

### 400ms 시험 · 기존 한도 유지

| 시험 | 원래 full-suite 측정 | 결과 |
|---|---|---|
| cafe-rest | 부재 291.5888 / 350.4724 / 426.5701ms, 재실 352.7127 / 367.3224 / 379.7045ms | best-of-3 <400ms PASS |
| lively-v2 | cold 355.6639 / 318.1995 / 311.7280ms, warm 0.5776406ms | cold <400ms / warm <3ms PASS |

부하에 민감한 기존 시험의 이번 실측입니다. 성능 재실행이나 한도 완화는 하지 않았습니다.

### Git 차단 파일 목록

- hani-office-219.test.mjs
- hani-office-actions-216.test.mjs
- hani-office-affinity-274-pins.test.mjs
- hani-office-barista-night-273-pins.test.mjs
- hani-office-bori-stroll.test.mjs
- hani-office-cafe-rest.test.mjs
- hani-office-chairman-patrol-278-pins.test.mjs
- hani-office-companion-homes.test.mjs
- hani-office-companions-276-pins.test.mjs
- hani-office-consult.test.mjs
- hani-office-icons.test.mjs
- hani-office-lively-v2.test.mjs
- hani-office-mascot-label.test.mjs
- hani-office-obr12.test.mjs
- hani-office-obr14.test.mjs
- hani-office-obr15.test.mjs
- hani-office-obr21.test.mjs
- hani-office-obr4.test.mjs
- hani-office-obr6.test.mjs
- hani-office-obr7.test.mjs
- hani-office-obr8.test.mjs
- hani-office-obr9.test.mjs
- hani-office-pet-bori-272-pins.test.mjs
- hani-office-pets-268-pins.test.mjs
- hani-office-pets-bubble.test.mjs
- hani-office-v2-215.test.mjs
- hani-office-xmas-269-pins.test.mjs
- hani-office-xmas.test.mjs

219는 과제에서 명시한 원래 실패이며 이번에는 Git 확인이 먼저 차단되어 해당 원래 assertion까지 재현하지 못했습니다. 나머지 Git 원문 검증도 미검증입니다.

## 보존·복원·인계

런타임 504파일을 무결성 확인한 f296f6a의 commit/tree/blob에서 직접 읽어 Buffer.equals로 비교했고 차이 0입니다. root JS/CSS/HTML/JSON·manifest와 assets/data/js를 포함하며 raw closure 164/누락0입니다. 수정한 시험 4파일 외 기존 tracked 파일도 HEAD와 모두 일치합니다. 저장·Cloud/schema·내부 기준 버전·표시/cache v2.9.285 변경 0입니다.

시험 부산물 1개 원문 복원, 신규 부산물 0개 제거, 기존 artifacts 654파일 원문 SHA256 일치 확인. 상세 경로는 JSON에 있습니다. 새 보고 산출물은 REPORT-285.md와 results-285.json만 남깁니다. 임시 실행기·로그·원문 사본은 정리합니다.

상태: 시험 도구 보정 완료 / 서윤 검토·커밋 인계. 다음 행동은 서윤이 위 Git 차단 파일을 허용 환경에서 재검증한 뒤 5개 scripts 변경과 이 보고 산출물을 커밋하는 것입니다. 추가 대표님 승인 요청은 없습니다. 실제 UI·Android·원격/Production read-back은 미검증이며 runtime 변경 없는 시험 전용 작업으로 build/version/Candidate/HINA/배포 QA는 N/A입니다.

Notion 현황판·규격 읽기는 성공했지만 착수 insert_content가 자동 승인 검토에서 approval policy is never로 거절되어 미반영·저장 read-back 없음입니다. 갱신 대기: 날짜·담당·branch/HEAD·main, 위 변경·검증/미검증·504파일 보존·부산물 복원, 서윤 Git 재검증·커밋 인계를 이 저장소 원문 링크와 함께 반영해야 합니다.
