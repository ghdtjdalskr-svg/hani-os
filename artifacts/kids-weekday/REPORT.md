# 평일 꼬마 깜짝 방문 · 2026-11-08 · Codex

- **구현·검증 완료, Git 권한 차단으로 미커밋.** `hani/kids-visit-pose-b` / base·HEAD `bbe71c0ea53d6f65740a4ac0f2ee598d4b2c280f`. 이전 미커밋 변경을 이어 완성. 착수 시 GitHub main·로컬 origin/main `70c5d5d` 일치 확인.
- 기존 `companionSnapshot → companionActivity → updateResidents → showBubble` 및 100ms tick만 사용. CODEMAP living-office owner 확인, kids 세부 anchor는 없어 실제 symbol로 확인(CODEMAP_MISS).
- 평일 KST 달력 날짜 시드 `%4===0`, **15:00 이상~19:00 미만**에 수현 또는 수연 1명 방문. 기존 동물 동행 1자리를 대신하므로 동행은 계속 1명. 동물 5종은 기존 부서·안전 공간 판정으로 복귀하며 혼잡 시 기존 숨김 규칙 유지. 주말 남매 2명·이동/직원 방문/포즈는 보존하고 요청받은 대사만 확장.
- 첫 인사는 날짜별 선택, 실제 보이는 말풍선에 표시한 날만 메모리 Set에 기록. 새로고침하면 메모리가 초기화되는 의도된 동작. 새 저장·timer/listener·Math.random 0, 보호 저장소·Cloud·schema 변경 0. 표시/cache **2.9.280 유지**, push/merge/배포 없음.

## 검증

- 2026년 평일 **261일 중 58일(22.22%)**, 수현28·수연30. 각 첫 인사3종 실제 도달. 동일 날짜 재생·UTC 표현 일치, 시간 경계 밀리초·주말 양일·부재/비활성·reduced motion·안전 위치 검증.
- 기존 대사 순서 보존·각6줄 추가, 남매3세트 및 실제 mounted bubble의 수현→수연 발화 확인. 하루 인사1회·탭·층 전환·persistent slot·저장 쓰기0 검증.
- exact-inverse는 바깥 레이어에서 **고정 bbe71c0 전체 바이트 복원**, 미완성/중복/무관 변경 거절. 기존 B 및 하위 계약 assertion 보존. runtime closure **161개·누락0**, scheduler 원문 동일·syntax/diff check 통과.
- **전체 office 69파일: 796통과·기존 실패1·skip3, 신규 미해결 실패0** ([집계](test-summary.json)). 219의 `.hani-office-name AA text contrast`는 고정 HEAD 재생에서도 동일 실패. skip은 기존 v2-215 2건·zoom 1건이며 해당 전체 브라우저 시나리오는 미검증.
- 평일 전용 **16/16**, 기존 B **13/13**, 기존 kids-lively **15/15**, 별도 M9 **15/15**, syntax **12/12**. 최초 전용 시험의 fixture/closure 비교 오류2건은 수정·재검사 통과. 과거 대사 fixture와 새 목록 혼용1건은 기존 assertion을 유지하고 바깥 weekday 복원 레이어를 적용해 재검사15/15. 최초 실패 로그 보존. 전체 시험이 생성한 타 작업 증거16경로는 실행 전 바이트로 복원하고 이번 출력은 `test-generated/`에 보존.
- Edge **157.0.4341.42**, 평일 **16:00 PC1280/폰390 × 두 아이 = PNG4장**. 실제 office DOM/JS/asset, 격리 환경에서 아빠 인사 각1회·층 재방문 중복0·가로넘침0·오류0·저장0. 화면 직접 확인(독립 Arin/HINA 검토 아님).
- 실행: `powershell -NoProfile -ExecutionPolicy Bypass -File artifacts/kids-weekday/run-office-tests.ps1`; `node artifacts/kids-weekday/validate.mjs`; `node artifacts/kids-weekday/capture-office.mjs`. 상세 TAP/JSON은 같은 폴더. 생산 계정·Pages·release candidate/package/HINA는 범위 밖이며 미검증.
- identity: runtime `bf0b7139b7486750977719729355a643520da68109a9050ddbe1fd9fa9bb705c` / weekday contract `660c6eb5501c16f71899f0535173ca4ad47611b6f42f4c470ff98cdd088c2211`.

|16:00 방문|PC 1280|폰 390|
|---|---|---|
|수현 · 01-02|[화면](office-1280-2026-01-02-kid-suhyeon-1600.png)|[화면](office-390-2026-01-02-kid-suhyeon-1600.png)|
|수연 · 01-06|[화면](office-1280-2026-01-06-kid-suyeon-1600.png)|[화면](office-390-2026-01-06-kid-suyeon-1600.png)|

## 추가 문구 목록 (기존 대사 유지)

|구분|수현|수연|
|---|---|---|
|일반1|아빠, 물 여기 뒀어. 그냥 보이길래.|아빠! 오늘 학교에서 별 스티커 받았어!|
|일반2|…아빠 기다린 건 아니야. 책이 덜 끝나서.|아빠 보고 싶어서 발이 먼저 왔어!|
|일반3|아빠, 난 한 걸음 뒤에 있을게.|아빠, 오늘도 내 옆자리 비워 뒀지?|
|일반4|수연아, 뛰지 마. 가방은 내가 들게.|하니 이모! 나 인사하러 왔어!|
|일반5|하니 이모한테 인사는 하고 가야지.|서윤 언니, 나도 축하 하트 줄게!|
|일반6|보리야, 여기 조용히 앉아 있어도 돼.|보리야! 아빠랑 같이 천천히 가자!|
|평일 인사1|…지나가다 들른 거야, 아빠.|아빠! 학교 끝나고 왔어!|
|평일 인사2|아빠, 학교 끝났어. 잠깐만 있다 갈게.|아빠아! 오늘은 내가 깜짝 선물이야!|
|평일 인사3|…아빠, 책 읽을 데가 필요해서 온 거야.|아빠! 하교하자마자 보고 싶어서 왔어!|
|주고받기1 (수현→수연)|…아빠 기다리는 동안만 같이 있어 줄게.|오빠, 아빠 보고 싶어서 온 거 다 알아!|
|주고받기2 (수현→수연)|수연아, 아빠 일할 땐 천천히 걸어.|응! 아빠 손 잡고 살금살금 갈게!|
|주고받기3 (수현→수연)|…네 가방은 내가 들게. 아빠한텐 비밀이야.|아빠! 오빠가 또 나 챙겨 줬어!|

주고받기는 두 아이가 같은 층 가까이에 있고 아빠가 정지한 기존 활동 구간에서만, 기존 자동 말풍선 순서로 표시. 직원 방문·순찰 우선순위 유지.

## 인계 / 차단

- **미커밋**: 소유 runtime/test/source/contract에 `git add` 실제 시도, 공유 `HANI_OS_DEV/.git/worktrees/kids-visit-b/index.lock` 생성 Permission denied(exit128). 요청에 따라 차단 상태로 인계. push/merge/버전 변경 없음. 서버 Edge Function·설정 변경 없음.
- Notion: 착수 조회 성공, 기록 쓰기는 자동 승인 검토가 `approval policy is never`로 거절. 저장/read-back 미완료. 이 보고서·검증 결과·branch/base·커밋 결과를 갱신 대기로 보존.
- **종료 시 main drift**: GitHub와 공유 origin/main이 `43eda9e2e3f69115c3569f585506904965c26c18`(v2.9.281, #465)로 진행됨. 친밀도 하루2점과 부서 마스코트 이름표, main/index/이력 및 같은 office 파일의 `companionPeople`·`fitStatusLabels`·`updateResidents` 변경. 자동 merge/rebase하지 않음. 이번 증거는 bbe71c0 기반 변경에 한정되며 최신 main 결합은 미검증. 결합 담당은 표시·동행 갱신 충돌 검토와 exact-inverse 계약 재고정·재검사를 해야 함. 이 작업에서 친밀도 저장 로직을 수정하지 않음.
- 다음: 허용 환경에서 이 작업 소유 파일만 로컬 커밋 → 배포 담당에게 위 drift와 함께 인계. push/merge/버전 변경 금지 유지. 배포는 별도 담당·승인 경계.
