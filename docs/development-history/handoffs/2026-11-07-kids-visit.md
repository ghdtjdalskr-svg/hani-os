# 남매 직원 방문 히든 대사

## 작업 식별
- 갱신(KST): 2026-11-07 / Codex 단일 개발자 / 구현·가능한 검증 완료, 5층 인원 제약·Git·Notion 차단
- 저장소·branch·worktree: ghdtjdalskr-svg/hani-os / hani/office-companions / companion-live
- base SHA: 59db3651296c394d17766af7c89933642ada8712. 최신 main 조회 b7367744898b79ce1c6efc572b1ddf94b64cc7c7 및 origin/main 캐시 일치, merge/rebase 없음. candidate N/A, 미커밋.
- 승인: ../kids-visit-task.md 전체 구현·검증·새 로컬 commit. push·merge·버전 변경 금지. 저장/Cloud/schema/migration 변경 승인 없음·수행 없음.
- 범위: hani-office-live.js 기존 companion·tick·bubble, scripts/hani-office-kids-visit.test.mjs, 278 strict helper/pins/delta, 기존 순찰·활발 fixture 연결 및 labels-qa의 방문 bubble 장애물 정확 assertion 확장, artifacts/kids-visit, 본 인수인계·CURRENT 상단. 다른 담당 파일 보존.

## 결과와 증거
- CODEMAP_MISS: living-office의 오래된 symbol 대신 실제 companionSnapshot/updateResidents/showBubble owner 확인. 새 runtime 파일·저장·timer loop·전역 listener 없음. 내장 대사와 일일 메모리 controller를 기존 resident tick에서 사용, 말풍선 timer 하나를 줄당2.2초로 재사용.
- 25세트 원문 보존. suyeon_staff→sooyeon, yunseul→yoonseul, chaewon→taeo, isle→iseul, cheese/cream/mochi/bori→pet-cat/dog/rabbit/bori; dohyun=도연. 은하는 이슬과 같은 기존 카페 슬롯의 야간 ID. 미매핑0. 자동 순번은 날짜+ID 시드와 일일 방문 횟수, 순찰별 미방문 대상·3층 서윤 일일 최초 우선.
- [짧은 보고서](../../artifacts/kids-visit/REPORT.md): 전용10/10(공통 포함16/16), 순찰15/15, 활발15/15, 전체65파일 698통과·Git EPERM29차단·skip5·그 외 실패0·중단0. 원래 assertion·400ms/3ms 임계값 유지. 새 278 visitExtension의 정확한 before/after와 변조 거부를 검증.
- strict 과거 fixture의 transform 인자가 원래 함수의 6번째 자리에 전달되도록 수정(잘못된 7번째 인자 무시 문제). 과거 assertion 그대로 보존, 최신 raw owner는 전용 시험에서 직접 실행. 초기 신규 탭 시험의 대상 없는 시각을 실제 근접 방문 시각으로 수정하고 전체 전용 재실행. 병렬 Edge 부하 중 lively-v2 성능1건 실패는 동일 runtime/contract 별도 전체 재검사에서 통과(first best398.9ms·warm0.891ms). 최초 로그·initial-results 보존.
- 실제10분13회·5명. 순찰 첫220초 1F5회/4명·3F5회/4명·5F4회/1명·2F5회/3명. **5F 가용한 25세트 대상은 치즈1명이라 서로 다른2~3명 요구는 미충족**. 이 제약을 해소하려면 별도 직원/주민 일정 변경 결정 필요. 현재 일정·scheduler bytes 보존.
- Edge156 실제 로컬 index/JS, 토요일3F 서윤·1F 은하 PC1280/폰390 총4PNG. 은하는 브라우저 응답에서만 chairman snapshot을1F로 배치한 합성 검증이며 운영 코드/데이터 변경 없음. 폰 name/name 및 bubble/name 교차0·오류/overflow0, PC 서윤 bubble/name2건 남음. PNG 직접 확인. browser-results.json 참조.
- runtime SHA256 bbaceed5e8ac8ea5f33b67d8568a88b111d484c186f79d14d562bd3df77f8cae; 278 contract 00933b6c6fda7914041124a91601711c4ae8a16013b0194a7cfd215b5f1d75ce. closure161 불변·missing0. interval/timeout/listener/storage/Cloud 참조수 불변, scheduler bytes 불변, index/main/CSS/atlas2/manifest Git 원본7항목 일치(git-base-read.json). 표시·cache2.9.276 유지(과제의2.9.277 표기와 실제checkout 차이). syntax runtime·신규test·278 helper/pins·과거fixture2파일6/6.
- Git: executable 미제공·기존 subprocess EPERM. git add 시도 차단, 공유 .git index는 writable root 밖. commit 불가 미커밋, push/merge/배포 없음. Notion 착수 읽기 성공, insert_content는 자동 승인 검토가 approval policy never로 거절. 실제 저장/read-back 못했으므로 미반영.
- 실제 로그인·Cloud·운영 화면/최신 JS 로딩·production read-back, 독립 Arin/HINA·candidate build N/A/미실행(기능 개발 범위). 서버 Edge Function·설정 변경/배포 순서 N/A.

## 다음 담당에게
- 먼저 읽기: artifacts/kids-visit/REPORT.md, targeted-final.log, final-regression/summary.json, browser-results.json, git-base-read.json.
- 실행 명령: bundled node --test --test-isolation=none scripts/hani-office-kids-visit.test.mjs; 같은 옵션의 chairman-patrol/kids-lively/278-pins; node artifacts/kids-visit/final-regression.mjs. 최종 재검사는 targeted-final/lively-v2-final/patrol-final/lively-final 로그에 별도 보존. node 경로 C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe.
- 다음 행동: 허용된 Git 환경에서 본 작업 소유 파일만 새 로컬 commit. push·merge·버전 변경 금지 유지. 5층 서로 다른2~3명 보장은 추가 일정 변경 결정이 필요하므로 임의 구현 금지.
- Notion 갱신 대기: 2026-11-07 KST / Codex / 남매 직원 방문 대화 / 위 branch·base·검증·5층 제약·Git 차단·운영 미반영 / 원문은 본 인수인계와 REPORT. 실제 저장 후 읽어 확인 필요. 자동 동기화 구현/승인으로 해석하지 않음.
- CURRENT에는 확인된 요약만 추가하고 과거 기록 보존. DECISIONS 변경 없음.
