# 디자인 다듬기 1차 · 브라우저 실패 정리

## 작업 식별

- 갱신 시각(KST): 2026-11-14 / 담당: 도연 역할 Codex 단독, 실제 Git·Edge 재검증: 서윤.
- 상태: 구현·Node targeted 검증 완료, 서윤 실제 Edge 재검증 대기. 미커밋 유지, Candidate/배포 완료 아님.
- 저장소 / branch / worktree: HANI OS / hani/design-polish-1 / design1 (기존 미커밋 작업 보존).
- base SHA / candidate SHA: cb119351ff7b0a01b77fdc04d6f0b1ba0c2b54dc / 없음.
- 착수 로컬 origin/main: 5396c9f281bc9be88dfb67301a12b1cbbbf8640b. 저장소 객체 읽기로만 확인, 원격 최신성 미확인. 기준 이후 치비2 그림 시트 1개만 추가되어 대상 CSS·main.js·UI JS·index는 동일. 자동 merge/rebase 없음.
- 목표 / 완료 조건: design1b-task.md의 대비96·도움봇2·검색 높이2 실패 원인 수정, 4.5 기준/기존 단언 유지, 관련 Node 회귀와 서윤 재실행 명령 준비.
- 수정 범위: 신규 브라우저 검사기·전용 보조/시험, hani-design-system.css의 기존 작업 suffix, design-polish-1 전용 delta/증거/보고서. 기존 하위 fixture·운영 JS·다른 담당 파일 보존.
- 사용자 승인 근거 / 경계: ../design1b-task.md 전체 지시. Git·Edge 금지, 새 저장/event/timer 경로 금지, Preview·배포 승인 없음.

## 결과와 증거

- CODEMAP: yuna-intake owner 확인. helper·drive·procrastination 상세 앵커는 CODEMAP_MISS, 실제 DOM/CSS/canonical owner로 fallback.
- 원인·수정: 대비96건은 gradient 미해결을 실제 clip PNG의 텍스트 제외 최악 픽셀 측정으로 대체(4.5 유지). intake2건은 로그인 gate .22초 visibility 전환 후 공개 HaniHelperBot.update()로 setup 보정, 실제 owner+기존 DOM fixture 재현. drive2건은 모바일 공통40px!important가 일반44px보다 우선하여 CSS 검색 min-height에 !important 한 곳 추가. 원래 FAIL100/PNG80 보존, 새 실행 증거는 browser-fixed/에 분리.
- 변경 파일: hani-design-system.css 검색 선언1곳, scripts/hani-design-polish-1.browser.mjs, 신규 contrast.mjs/contrast.test.mjs, 이 작업 전용 delta CSS suffix/after SHA 및 source fixture pin, patch.css·작업 보고/증거. 기존 hani-main.js·helper runtime·기존 시험·하위 fixture 미수정.
- 실행한 검증: run-tests.ps1 80파일77성공/기존실패3, Node852PASS/9FAIL/skip2·별도 출력5스크립트 성공. office 비Git46파일610PASS/0FAIL/skip1. THAW·294·층·save-guard·M9 성공, 신규 대비4/4·기존 디자인6/6. helper 관련 기존4/4 및 실제 owner의 login stale→public update/shown·모달 조건·저장0 재현 통과. JS 직접 syntax 통과, raw171→168→164/누락0.
- 남은 기존 실패: 전체 회귀 nav-groups/qa-210/qa-report-fixes 3파일은 최초 작업과 동일. 추가 광범위 helper 시험25PASS/4FAIL/skip1은 인원20vs19·procrastination help·ieum crop·legacy closure169vs159이며 미수정. 관련 가시성/배치4개는 별도4/4PASS, 실패를 숨기기 위한 전체검사 대체가 아님.
- 보존: 기존 시험306파일·하위 fixture111개·원래 browser FAIL100+PNG80 바이트 불변. 시험 합성JSON4개 정확한 착수 바이트 복원·신규4개 작업 증거로 이관, 범위 밖 변경/누락0. 운영 후속diff는 CSS의 !important1개뿐. 증거: artifacts/design-polish-1/test-summary.json 및 browser-fix/scope-audit.json·helper-setup.json·helper-focused.log·syntax.json.
- 미검증: Git27·브라우저 전용5개, 실제 Edge/clip PNG 디코드·6Finish×4계절 실측 대비/100건 해소 여부, 모바일 실기기 키보드·Preview·Candidate·HINA·Production. 실제 브라우저 PASS를 선언하지 않음. 실패가 남으면 해당 PNG/Finish/계절/viewport로 최소 범위 후속 수정.
- 데이터·저장소·Cloud·schema 영향: 변경 예정 없음.
- PR / Preview / 배포: 없음. 표시/cache2.9.294 유지, 실제 JS 로딩/운영 read-back 미검증.

## 다음 담당에게

- 먼저 읽을 파일: artifacts/design-polish-1/REPORT.md 끝의 후속 절, scripts/hani-design-polish-1.browser.mjs.
- 다음 행동: REPORT.md 끝의 명령으로 서윤 실제 브라우저 재실행, browser-fixed/browser-results.json의 failures·helperSetup·대비 clip 증거를 함께 확인. 기존 Git 검토/커밋·push·최신 main 통합은 서윤/배포 담당. 관련 서버 Edge Function·설정/배포 순서: 없음.
- blocker: Notion 착수 기록 insert_content를 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 현황판 읽기는 성공, 쓰기 미반영.
- Notion 갱신 대기: 2026-11-14 KST/도연 Codex/design-polish-1/기준cb11935·로컬main5396c9f/브라우저 실패100의 검사기·setup·검색 CSS 보정 완료, 회귀80파일77성공·기존실패3/office610PASS·별도helper 기존실패4 유지/보존감사PASS. 서윤 실제 Edge 재검증 대기, Git·Edge·버전 변경·배포 없음. 원문: 이 인수인계와 REPORT.md의 브라우저 실패 정리 절. Notion 저장/읽기 확인 완료 아님.
- CURRENT / DECISIONS: 확인된 후속 결과만 CURRENT 위에 추가, 과거/타 담당 기록 보존. 새 승인 결정 없음.
