# 본사 반려동물·NPC 아트

## qa-b7d 최종 결과 · 2026-11-01 23:10 KST

### 작업 식별

- 담당 Codex 단독 / `hani/office-pets-npc-art` / qa-b7 / base·HEAD `333b0358960d9b60def7eb014670346bf3ffe351` 유지.
- 상태: **주민 최종 수정·targeted 검증 완료 / 미커밋 / 서윤 실화면 검토 대기**. 승인 원문은 `../qa-b7d-task.md` 전체 UTF-8 실행 지시이며 한글 정상.
- 범위: 기존 JS/CSS의 residentSnapshot·updateResidents·기존 라벨/bubble/reaction 경로, 주민 test·exact-line fixture/helper, 기존 freeze 도구가 재생성한 obr8/15/21·consult 연결, artifact 증거와 이 인수인계. 기존 미커밋 manifest·7WebP·display fixture·HD test는 보존했다.
- 금지 유지: 직원 계획 동결, 저장·데이터·Cloud·schema·migration 변경 없음, 표시2.9.252·cache 유지, commit/push/merge/rebase/배포 없음.

### 결과와 증거

- 치즈·크림으로 이름 변경, 나머지 이름 유지. 치즈의 무심함·느긋함·결국 곁에 있는 성격과 크림의 밝고 사람을 반기는 성격을 대사로 보완했다. 외모·몸매 묘사와 회장님 별명은 추가하지 않았다.
- 세린 Part 2 대사 **56추가·0제외**. 공백·문장부호 포함 Unicode 문자 수22 이하를 확인했다. `츄르` 대사 유지. 개별 문자 수는 `final-lines.json`.
- 세린1~7은 코드 경로를 모두 확인하고 보완했다. reduced는 목적지로 즉시 이동 후 좌표 고정, 주민 점유 공유, 좌표/포즈/방향/보행/anchor 변화만 DOM 갱신, 숨김 시 기존 bubble 닫기, tick에 실제 walking 전달, 전체 주민 회전0과 stableSpriteBox 일치, dot fallback 이름 숨김.
- 기각0. 단2번 보고의 공용좌표 중첩 상황은 현재 전용18지점에서 재현되지 않는다. 점유 누락은 실제라 방어 수정했고, 테스트에서 동일 후보를 주입해 충돌 회피/숨김 분기를 검증했다. 3번의 매 프레임 fit 제안은 layout 읽기 금지에 맞춰 채택하지 않았다. 보행 시작·종료·anchor/가시성 경계에만 라벨 재배치, 이동 중은 actor 자손 라벨·캐시한 bubble geometry 사용. 새 timer/event/renderer 없음.
- `node --check <8파일>` **8통과·0실패**. 최종9묶음 **111통과·5실패**, 명령 **5성공·4실패**. residents23/0, labels-qa14/0, top-labels7/0, crowded-labels19/0, obr8 2/1, obr15 13/1, obr21 4/2, hd-224 10/0, consult19/1. 명령은 `node --test --test-isolation=none --test-force-exit --test-timeout=60000 scripts/hani-office-<suite>.test.mjs`.
- 실패5개는 이전 review 로그와 같은 검사명·`spawnSync git EPERM` 원인이다. **새 실패0**, 실패를 PASS로 바꾸지 않았다. 과거 source 조회·oracle·시간 한도는 보존했다.
- 신규7검사: 이름/대사 규칙, 실제 시간 진행 reduced 좌표 고정, 7일간 전 주민 간격과 같은 후보 주입, 정지 중 시간 진행 DOM 쓰기0, 실제 보행 tick/tap 지연·도착 라벨 재배치·NPC upright, 열린 bubble 이동 프레임 layout 읽기0·주민 숨김 시 종료, 모바일 dot 강제 fallback에서 이름 미표시. 기존 주민/직원 plan·보행·가구·포즈·데이터 write0 검사도 통과.
- 정확한 기존 line/LCS freeze 방식 재사용. 최종 JS SHA256 `8172149daa1184ff121f1c3d1fc836014f7464780685db541a77bca278f0fbe4`, 주민 fixture SHA256 `3ef335ef5e33198429ce04962039d7d697aa9af63ba7f8a1067dd74beff89424`. 전체 source 역변환 SHA256 `4f03c015fe3996d546afe1710a41c19a44d3a4d63c621ef132fb8ac255e06c6f`와 실제 base blob 대조 유지. 새 줄의 CRLF 혼용을 원문 LF로 맞춘 후 fixture·전체9묶음을 최종 재실행했고 diff check 통과.
- 보존: frozen19파일 byte 동일, 실제 base 대조 가능10파일·기존 manifest25항목·승인7WebP 동일, CSS는 이번에 기존 resident rotate selector 한 곳만 pets→전체 주민으로 변경. 과거 packed object8개 raw 추가 대조는 기존대로 미검증이다.
- 원격 `ls-remote` 연결 실패. 작업 중 로컬 origin/main이012dfbc에서`66fee62664cda2abac9ad4985d47009dd3194b1f`로 전진했다. HEAD 대비 office JS/CSS·manifest diff0, index와 타 기능 변화는 통합하지 않았다. merge/rebase 없이 현재 base를 유지했으며 실제 최신 원격 확인은 다음 담당의 경계다.
- 원문: [FINAL-RESIDENTS.md](../../../artifacts/office-pets-npc/FINAL-RESIDENTS.md), `final-comparison.json`, `final-tests.json`, `final-syntax.json`, `final-preservation.json`, `final-<suite>.log`. 앞 라운드 로그는 보존했으며 이번 final 결과가 최신이다.

### 미검증·다음 담당에게

- 다음 한 가지 행동: 서윤이 실제 앱에서 치즈·크림 이름/대사, reduced 이동, 낮/밤 분리·모바일 혼잡 이름표, 열린 bubble 이동/퇴장, NPC 기울기·가림을 확인한다. 브라우저 제한을 유지해 앱 screenshot0이며 Node DOM/geometry를 실화면 PASS로 보고하지 않는다.
- main merge·Pages·운영 표시·최신 JS 실제 로딩·기능 read-back 미수행. 기능 패치이므로 full package/One-Pass/HINA/버전 증가 N/A. 서버 설정·Edge Function 없음. 기존 commit 금지에 따라 탑승 push도 수행하지 않았다.
- CURRENT/DECISIONS와 타 담당 파일은 보존. 배포 담당이 실제 최신 main과 승인 범위·targeted 결과를 확인한 뒤 열차로 통합한다.
- Notion 읽기 성공, 착수 append는 자동 승인 검토의 `MCP tool call requires approval, but approval policy is never` 거절. 저장/read-back 미완료이며 다음 원문은 반영 대기다.

### Notion 갱신 대기 원문

2026-11-01 23:10 KST / Codex / 본사 주민 최종 수정 qa-b7d / hani/office-pets-npc-art / base333b035. 대표님 UTF-8 작업파일 실행 승인. 치즈·크림 이름·성격 대사 및 세린56줄 추가(22자 초과0, 츄르 유지). 리뷰1~7 owner 수정, 기각0; 과거 공용좌표 중첩은 현재 전용지점에서 미재현하나 점유 누락 방어 수정·주입 검증. reduced 목적지 즉시 이동, 주민 점유 공유, 변한 DOM만 갱신, bubble 캐시추적·숨김종료, 실제walking tick, NPC 회전0, dot 이름숨김. 최종 syntax8/0·지정9묶음111통과5실패(명령5성공4실패); 실패는 기존Git EPERM5개 동일·새실패0. exact-line 전체역변환·직원계획·frozen19파일·기존25atlas·승인7WebP 보존, 정지주민DOM쓰기0·이동bubble frame layout읽기0. JS8172149d·fixture3ef335ef. 실제브라우저/휴대폰·운영 미검증. 원격최신 조회 실패, 로컬main66fee62의 office JS/CSS·manifest 차이0, 자동 merge/rebase없음. 저장/Cloud/schema·표시2.9.252/cache·commit/push/merge/배포없음. 다음 서윤 실화면 검토. 원문 이 인수인계 및 artifacts/office-pets-npc/FINAL-RESIDENTS.md·final-comparison.json. Notion 자동승인 never 거절로 저장/read-back 미완료.

## qa-b7d 최종 주민 수정 · 착수

- 담당 Codex 단독 / branch `hani/office-pets-npc-art` / base·HEAD `333b0358960d9b60def7eb014670346bf3ffe351` / 기존 미커밋 작업 보존.
- 승인: `../qa-b7d-task.md` UTF-8 전체 실행, 한글 정상. 세린 1~7 코드 검증·실제 결함 수정, 치즈·크림 이름/성격·추가 대사, exact-line fixture 및 지정 targeted test.
- 범위: 기존 주민·라벨·말풍선·리액션 owner JS/CSS, 주민 회귀 검사·fixture/helper·증거·이 인수인계. 직원 plans·저장·버전/cache 동결, commit/push/merge/배포 금지.
- 원격 main 조회 연결 실패. 로컬 origin/main `012dfbc27e347416e63b72b7757cc1f110680463`는 HEAD보다 2 commit 앞섬. 임의 merge/rebase 없음. 영향은 종료 시 diff 근거로 기록.
- Notion 읽기 성공. 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장/read-back 미완료, 갱신 대기 원문을 종료 시 보존.

## 작업 식별

- 작업 ID / 제목: office-pets-npc-art / 아트 전용 7종
- 갱신 시각(KST): 2026-11-01 21:53
- 담당 도구 / 검토 담당: Codex 단독 / 대표님 시각 검토 대기
- 상태: 아트 제작·Node 검증 완료 / 대표님 시각 검토 대기 / 미커밋
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / hani/office-pets-npc-art / qa-b7
- base SHA: cf175d6091dd5d3d7e8bbd6a925c9ca0a98008fb (시작 HEAD 및 로컬 origin/main 동일)
- 원격 최신성: git ls-remote 연결 실패. merge/rebase 없음.
- 목표: 7종 투명 WebP, 실제 크기 비교 7장, 기존 직원 3명 포함 lineup, manifest 초안, Node 검증.
- 범위: artifacts/office-pets-npc/** 및 이 인수인계만. 다른 탭 office 코드 작업과 겹치지 않음.
- 사용자 승인: ../qa-b7-task.md 전체 UTF-8 읽기 및 실행 지시. commit/push/merge, 버전/cache, 런타임·일정·데이터 변경 금지.

## 결과와 증거

- Scoped Discovery: codemap living-office 확인. 아트 export anchor는 CODEMAP_MISS, manifest-v3와 renderer pose/loadSprite 및 CSS 크기 선언만 읽기 조사.
- 기존 방문객: atlas 768×768, cell 96×144, front 4포즈, pivot (48,135), scale 3. 사람은 동일 규격; 동물은 같은 셀의 별도 소형 atlas.
- 로컬 표시: 2.9.251. index 마지막 제품 JS hani-ai-budget.js?v=2.9.251. 실제 Production 로딩 미검증.
- 데이터·저장소·Cloud·schema 영향: 없음. 아트 전용이며 runtime 미연결.
- 변경한 내용 / 파일: `artifacts/office-pets-npc/` 안 WebP7종·비교PNG7장·lineup.png·poses.png·직원19명 대조판, manifest-draft.json, 원화8장, 제작 프롬프트·검증/미리보기 JSON·재현 Node 도구·한국어 README. 요구된 예외 경로인 이 handoff 외에는 폴더 밖 출력 없음.
- 용량: pet-cat26,012 / pet-dog30,484 / cleaner21,372 / gardener21,506 / temp-a20,120 / temp-b20,330 / temp-c19,560 bytes. 합계159,384 bytes, 각각50,000 bytes 미만.
- 참조: 방문객 visitor-generic + hani/taeo/yuri 원본4장 및 현재 1F floor-1f-217 배경을 매 생성에 전달. 고양이 보정은 cat 원화+방문객/hani/yuri 3장+같은 배경. image_gen 성공8건, 원화 alpha 유지. Node/Sharp는 packing/resize/flop/encode/합성만 수행.
- 실행 검증: `node --check artifacts/office-pets-npc/{prepare,build,validate}.cjs` 각각 PASS. `node artifacts/office-pets-npc/build.cjs` 최종 export 성공. `node artifacts/office-pets-npc/validate.cjs` PASS: 7atlas/40포즈, 실제 디코딩 크기·셀·alpha·baseline·그림자·예약 영역·좌우 실루엣·50KB 미만·hash·비교7장/단체1장 검사. 환경 Node24.20.0, 기존 로컬 Sharp. 증거 `artifacts/office-pets-npc/validation.json`.
- 소스 보존: fingerprint7파일 byte 동일. 최종 git status는 이 artifact 폴더와 이 handoff만 untracked, 기존 tracked diff0. `index.html`, office JS/CSS, data/hani-building, assets 원문 변경 없음. Git 쓰기 명령 실행 없음.
- Preview: `artifacts/office-pets-npc/lineup.png`는 실제 현재 로비 배경에 새7종과 기존 하니/태오/유리3명을 모두 서기 포즈로 합성. `compare-*.png`는 실제 CSS 계산40/68px 셀 높이 비교이며 앱 실행 캡처가 아님. `poses.png`에 모든 방향40포즈 표시.
- 시각 검토: 비교7장·전체 포즈·단체 확인, 큰 스타일 이탈 없음. temp-A는 중성적 짧은 머리 인상. 노년 얼굴 주름은 치비 스타일에 맞게 절제. 고양이 걷기는 보정 후 반대 보폭이 보이지만 작은 크기에서는 차이가 작음.
- 실행하지 않은 검증 / 남은 위험: 실제 런타임 연결·보행 애니메이션·가림·휴대폰 실기기·대표님 시각 승인 미검증. 동물10프레임은 기존4프레임 loader 필터와 다르므로 향후 담당의 명시적 frame/direction 연결 필요. 사람은 방문객4프레임 규격 일치. 그림자 중복 적용 금지.
- PR / 배포: 없음. LIGHT 아트 전용, 운영 파일 및 버전/cache 불변. Full package/One-Pass/HINA/버전 증가/Production read-back N/A. main merge·Pages·운영 표시 버전·최신 JS 실제 로딩·기능 read-back 모두 이번 작업에서 미수행.
- Notion: 현황판 읽기 성공, 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절. 저장·read-back 미완료, 최종 결과 포함 갱신 대기.

## 다음 담당에게

- 먼저 읽기: artifacts/office-pets-npc/README.md, manifest-draft.json, validation.json, lineup.png, compare-*.png, prompts.json.
- 다음 한 가지 행동: 대표님이 정적 비교/단체 이미지에서 외형을 검토. 승인된 아트만 별도 runtime 담당이 연결하고 실제 이동·가림 검증. 이번 지시의 commit/push 금지를 유지하며 자동 탑승/배포하지 않음.
- blocker / 필요한 사용자 결정: Notion 쓰기 불가. 시각 승인 및 runtime 통합은 이번 아트 제작과 별도.
- 함께 배포할 Edge Function·서버 설정: 없음. 아트 원본은 아직 assets로 옮기지 않음.
- CURRENT / DECISIONS: 작업별 인수인계만 기록. 공통 파일 수정하지 않음.

## Notion 갱신 대기 원문

2026-11-01 KST / Codex / 본사 반려동물·NPC 아트7종 / hani/office-pets-npc-art / base cf175d6091dd5d3d7e8bbd6a925c9ca0a98008fb. 기존 스프라이트4장+현행 로비 배경을 image_gen 참조로 전달해 제작, 고양이 보행1회 보정. WebP7종159,384B·개별50KB 미만, 사람 방문객 규격 그대로·동물5포즈×좌우. Node 디코딩 atlas/cell/alpha/측정baseline/용량/hash/보호파일·비교7장·단체10인 검증 PASS. 실제 크기 정적 비교와 실제 floor 단체 시트 준비, 큰 스타일 이탈 없음; 작은 동물 보폭·실제 이동/가림·휴대폰·시각 승인 미검증. 아트만 제작, 런타임/일정/assets/저장/Cloud/버전/cache·commit/push/merge/배포 없음. 원격 main 네트워크 실패로 최신성 미확인. 다음 대표님 외형 검토 후 별도 통합 담당에게 전달. 원문 로컬 artifacts/office-pets-npc/README.md 및 이 handoff, PR 없음. 자동 승인 never 거절로 Notion 저장/read-back 실패.

## 후속 런타임 연결 · 2026-11-01 KST · 검증 중

- 승인: 대표님의 `../qa-b7b-task.md` 전체 UTF-8 읽기·실행 지시. 원문 한글 정상. 아트 승인 완료 및 runtime 통합 허용. 위 아트 전용 작업의 시각 승인 대기는 이번 후속 지시로 해소됐으며 실제 앱 화면 검증과는 구분함.
- 담당: Codex 단독 / `hani/office-pets-npc-art` / qa-b7. 시작·유지 HEAD `333b0358960d9b60def7eb014670346bf3ffe351`. Git subprocess 없이 gitdir HEAD/ref 읽기 확인. 로컬 표시 `2.9.252`, index 마지막 script `hani-launch-greeting.js`. 실제 Production JS 로딩은 미확인.
- 금지 유지: commit/push/merge/rebase/배포, 표시 버전·캐시 태그 변경, 데이터·Cloud·schema·building 데이터 변경 없음. NORMAL / 읽기 전용 UI 패치.
- 범위: 기존 office JS/CSS, 기존 v3 manifest와 승인 WebP7개, residents Node 테스트·정확한 source delta/helper, obr8/15/21·consult guard 연결 및 HD 기존25종 검사 구분. 직원 people·visitorKinds·scheduler seeds/plans/seats/routes/travel·org chart 원문 불변.
- Scoped Discovery: codemap living-office 확인 후 현재 actor/pose/labels/tap/mascot/floor-count owner 조사. 최신 세부 anchor 누락은 CODEMAP_MISS로 실제 symbol 검색. START-HERE/CURRENT·이 인수인계·아트 README 및 최신 display source delta/reader를 읽음.
- 현재 구현: 새 이름 표 한 곳, 주민7종 자체 date seed·시간/층/spot·독립 경로 cache. walkable/noWalk·가구·직원 의자 검사. 기존 actor factory·100ms 시계·delegated tap·bubble 재사용, 생성 후 floor 전환에도 동일 node 유지. NPC neutral name tag, pets name only. 주민은 직원 roster·층 근무/휴식 수·org에 불포함. 저장·AI 호출 없음.
- 중간 검증: residents+HD owner 16/16 PASS, syntax8/8 PASS. 원문 대비 staff/visitor plan·outing·snapshot와 다른 모든 source byte 동일, 주민 on/off 직원 좌표·층 건수 동일. 전체 office/building 원문·수정본 회귀 대조 진행 중.
- closure128→135 / 한도160 / missing0. 추가 runtime 파일은 승인 WebP7개(159,384B)뿐. 기존 v3 manifest는 별도 seed되는 기존 경로 유지. CSS의 literal URL7개가 runtime closure에 포함되며, 오래된 v3 manifest에도 작동하도록 기존 owner 안에 동일 규격의 주민 atlas fallback을 둠. manifest 원본25 entry는 그대로, 새7 entry 및 총용량만 추가/갱신. 원화 PNG 경로는 runtime 의존성이 아니므로 복사 entry에서 제외하고 source hash는 유지.
- 기준선 차이: 로컬 origin/main 캐시 `2c0064f0d627cbea28e8b8705d6e1c25f1e32ad4`가 `333b035`의 직접 자식. 원격 최신성은 미검증. loose Git 객체를 읽어 JS/CSS 동일, docs/scripts6파일만 변경 확인. 그중 labels source delta와 obr8/15/21 hash pin이 겹침. 최신 display fixture가 현재 기준 source를 정확히 역변환함을 검증하고 그 fixture 및 세 literal hash pin만 반영한 뒤 주민 역변환을 앞에 연결. 이는 branch merge/rebase가 아니며 기능·일정·과거 plan oracle은 도입/재작성하지 않음. 상세 `artifacts/office-pets-npc/main-drift.json`.
- Notion 현황판 읽기 성공. 착수 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never` 거절. 저장/read-back 완료 아님. 최종 요약도 갱신 대기.
- 다음: 전체 회귀 실패명을 원문과 대조하고 최종 수치·미검증·다음 담당 행동을 아래에 추가. 브라우저·휴대폰 실화면·운영·배포는 미수행.

## 후속 최종 결과 · 2026-11-01 22:34 KST

- 상태: 구현·targeted Node 검증 완료 / 미커밋 검토 대기 / 실화면 미검증. 담당 Codex 단독. 사용자 지정 branch·HEAD 유지, candidate freeze·PR·배포 없음.
- 변경: 고양이·강아지(각5포즈×좌우)와 청소 담당·옥상 정원사·임시직3명. 이름은 `residentNames` 한 곳에서 변경. 주민 일정·경로는 직원 배치 뒤 독립 계산하며, 직원·방문객 seed/plan/seat/route/travel/visitor pipeline은 원문 그대로. 기존 factory·100ms clock·delegated tap/bubble만 사용. 주민은 persistent7 actor, 별도 staff roster/층 건수/org 제외, memory-only 짧은 대사와 pet hop. 좌석·벽·가구 검사, night에는 pets만 남고 NPC5명은 퇴장. hidden/reduced motion 검사 통과.
- 추가 assets: 승인 `pet-cat.webp`, `pet-dog.webp`, `npc-cleaner.webp`, `npc-gardener.webp`, `npc-temp-a.webp`, `npc-temp-b.webp`, `npc-temp-c.webp`의 byte 동일 복사. 합계159,384B. 기존 manifest25 entry는 동일하고 새7종 및 합계1,101,348B를 반영. manifest version 필드·표시2.9.252·cache 태그는 유지.
- closure: 128→**135/160**, missing0, 증가 목록이 위 WebP7개와 정확히 같음. runtime JS 파일 추가 없음. catalog는 기존 별도 seed 경로이고 CSS literal URL7개 및 owner 내 atlas fallback으로 이전 v3 manifest에도 주민 표시 가능. 서버/Edge Function/설정 추가 없음.

### 명령·PASS/FAIL

- `node --check <파일>`: office JS, residents test/helper, obr8/15/21, consult, HD test **8/8 PASS**. `artifacts/office-pets-npc/syntax-commands.json`.
- 주민 전용 `scripts/hani-office-residents.test.mjs`: **12/12 PASS**(신규 주민6 + 실제 기존 owner6). 7asset 실제 decode/hash/manifest/Image load, stable date, 모든 spot/이동 좌표 안전, pets5pose·좌우, staff/visitor full plan/outing/snapshot 동일, 층 카드·직원 좌표·org 불변, node 영속, 7종 tap/keyboard write0·pet hop, hidden/reduced motion.
- 기존 HD와 주민을 한 process로 실행한 targeted 묶음 **16/16 PASS**(공유 owner test는 중복 실행하지 않음). 별도 전체 회귀에서 HD **10/10 PASS**.
- 수정 전 실제 원문: `node --import ./artifacts/office-pets-npc/runtime-baseline.mjs --test --test-isolation=none --test-timeout=60000 scripts/<test>` **40명령:24성공/16실패**, 세부350통과/22실패. 원문 소스·CSS·manifest·test를 보관한 read-only loader 사용. 다른 실행 환경으로 검사를 바꾸거나 Git 제한을 우회한 것이 아님.
- 수정본: `node --test --test-isolation=none --test-force-exit --test-timeout=60000 scripts/<test>`로 모든 `hani-office*.test.mjs`·`hani-building*.test.mjs` **41명령:25성공/16실패**, 세부364통과/20실패. 새 실패 명령0·새 실패 항목0. `baseline-commands.json`, `final-commands.json`, `runtime-comparison.json` 및 파일별 log에 전체 근거. sync 전수 검사는 실제 완료까지 기다림.
- 원문에도 실패: cafe-rest(2/2)와 lively-v2(6/2)의 400ms 계획 시간 제한, 과거 Git source 조회 EPERM, building206-safety의 필수 raw baseline directory 인자 누락. 이 입력/환경 오류를 PASS로 처리하지 않음. 시간 제한은 올리지 않았고 scheduler를 고치지 않음.
- 새 주민 exact-line source delta→최신 display exact-line delta→기존 motion/source hash guard 순으로 복원. 주민 fixture pin `426383fb2726eb7728d022635a040c94d4494f7463a14e403181669d8dedb8e7`, runtime source SHA256 `55faca1217d1eec78367c4fad2e903bf1ae15865b6157b76a663f1a36cee2e9c`. 수정 전 source SHA256 `4f03c015fe3996d546afe1710a41c19a44d3a4d63c621ef132fb8ac255e06c6f`로 전체 바이트 역변환하며 변조도 거부.
- 검사 변경 이유: obr8/15/21·consult은 새 주민 행만 되돌린 뒤 기존 source/plan guard를 그대로 실행. 최신 main의 기존 표시 fixture 정정과 literal pin3개를 사용해 원래 실패하던 consult/obr21 source guard2개도 해소. HD는 기존25종·100프레임 검사를 유지하고 주민7종만 새 전용 검사로 분리. 과거 gzip plan/snapshot oracle·시간 한도·허용 함수 범위는 재작성/확장하지 않음.
- 추가 `node artifacts/office-pets-npc/verify-preservation.mjs`: 실제333b035 Git blob으로 source 전체 역변환 확인. 읽을 수 있는10파일(공간 데이터·조직·피규어·index/main·일부 고정 fixture) byte 동일. CSS 원문 prefix·manifest25 entry·승인 WebP7 byte 복사 동일. 과거 packed object8개는 추가 raw Git 비교에서 미검증으로 기록했으며, 모든 기존 pinned fixture 검사를 PASS로 바꾸지 않음. `runtime-preservation.json`.

### 미검증·다음 행동

- 실제 브라우저·휴대폰의 이동/가림/라벨·터치·줄바꿈 미검증, 앱 screenshot0. 정적 art lineup을 실행 화면으로 보고하지 않음. Production·Pages·최신 실제 JS 로딩/read-back 미수행. package/One-Pass/HINA는 기능 개발 단계이므로 미실행.
- 현재 원격 main 최신성 미확인. 캐시2c0064f는 runtime JS/CSS 동일이고 이미 반영된 정확한 display fixture만 작업에 재사용. 변경 source는 user 지정333b035 기준이며 임의 merge/rebase 없음. 배포 담당은 실제 최신 main과 diff를 확인해야 함.
- 다음 한 가지 행동: 검토 담당이 [RUNTIME-REPORT.md](../../../artifacts/office-pets-npc/RUNTIME-REPORT.md)·diff를 확인하고 허용된 browser 환경에서 주민7종과 기존 직원 화면을 확인. 그 뒤 대표님 승인 범위·배포 열차를 따름. 이번 지시는 commit/push/merge를 금지하므로 탑승용 push도 하지 않음.
- CURRENT/DECISIONS는 타 담당 기록을 보존했고 이 작업별 인수인계만 갱신. 구현 완료와 운영 반영을 구분. 보호 저장소·Cloud·schema·migration·AI 호출 변경 없음.

### Notion 최종 갱신 대기 원문

2026-11-01 22:34 KST / Codex / 본사 반려동물·NPC 런타임 연결 / hani/office-pets-npc-art / base333b035. 대표님 qa-b7b-task의 아트 승인·runtime 개발 허용, commit/push/merge/version/cache 금지 유지. 승인 WebP7종159384B·manifest32종·closure135/160/missing0. 주민 독립 seed·안전 spot/경로·persistent actors·기존 tap/bubble/clock, NPC neutral 이름표·pets 이름만, 밤엔 pets만. 직원/방문객 scheduler·plans·좌표·층 건수·org 및 데이터/Cloud 불변. syntax8/8, 주민12/12, HD10/10; 전체41명령25성공16실패(원문40명령24성공16실패), 새 실패0. 기존 timing·Git EPERM·baseline 입력 누락은 미해결/미통과로 구분. 최신 cached main2c0064f는 JS/CSS 동일, 기존 표시 fixture 정정만 재사용하고 merge/rebase 없음. 실제 browser/휴대폰·원격 최신성·운영 미검증. 상태 미커밋 검토 대기, 다음 diff·실화면 검토. 원문 이 인수인계 및 artifacts/office-pets-npc/RUNTIME-REPORT.md. Notion append는 자동 승인 검토의 approval policy never 거절로 저장/read-back 실패, 반영 대기.

## 실화면 검토 후속 수정 · qa-b7c · 착수

- 담당 Codex 단독 / branch `hani/office-pets-npc-art` / base·HEAD `333b0358960d9b60def7eb014670346bf3ffe351` / qa-b7의 기존 미커밋 작업 위 수정.
- 승인: `../qa-b7c-task.md` UTF-8 전체 실행, 원문 한글 정상. 가구·포즈 라벨·hidden 링크·야간 분리 및 exact-line fixture·지정 Node 검사·인수인계. 직원 plans 동결, 저장·버전/cache·commit/push/merge/배포 금지 유지.
- 수정 범위: 기존 office JS/CSS 주민 owner, 주민 test·exact-line fixture/helper, artifacts 검증·이 handoff. building 데이터·직원 schedule 원문 보존.
- 원격 main: `git ls-remote` 연결 실패. merge/rebase 없음. 브라우저 차단, 서윤 실화면 확인.
- Notion 읽기 성공. 착수 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never` 거절로 저장/read-back 실패.
- 기록 보정: 위 착수 메모를 PowerShell→Node 파이프로 처음 추가할 때 한글이 `?`로 바뀐 문제를 확인해, 이 UTF-8 원문으로 교체했다. 기존 인수인계·원본 작업 지시·코드는 정상이고 추정 복원하지 않았다.

## 실화면 검토 후속 최종 결과 · 2026-11-01 23:05 KST

### 작업 식별

- 담당 Codex 단독 / 검토 담당 서윤. **요청4건 구현·Node 검증 완료 / 미커밋 / 실화면 확인 대기**.
- branch·base는 위와 동일. 승인 범위는 qa-b7c, NORMAL / 읽기 전용 UI 패치. 저장·버전/cache·commit/push/merge/배포 금지 유지.
- 실제 수정: `hani-office-live.js`, `hani-office-live.css`, 주민 test·fixture/helper. 기존 freeze 도구로 obr8/15/21·consult의 주민 역변환 연결을 그대로 재생성. 이전 미커밋 manifest/assets·display fixture·HD test는 이번에 새로 수정하지 않음. 다른 담당 파일·CURRENT/DECISIONS 보존.

### 결과와 증거

- 현행 배경5장·art-map 직접 대조. 전용18지점을 1F 리셉션 앞 빈 로비, 2~5F 가구 없는 통로에 배치. NPC 좁은 층은 지점1개. 직원 공유 anchors/edges 불변. `residentSafe`가 카운터·소파·테이블·캐비닛·화분·칸막이 등 시각 가구 전체와 기존 homeFurniture/freeDesks·직원 의자·몸통 clearance 검사.
- 밤 고양이 `(43%,55%)`·강아지 `(57%,55%)`로 분리·고정, 점유 대체도 sleep 유지. 실제 WebP40프레임 그림 윗선에 기존 포즈·이름표 flow 연결. 말풍선 자손 hidden CSS 한 곳으로 주민·방문객 프로필 숨김, 직원 링크 표시 유지.
- `node --check <파일>` **8통과/0실패**. 대상·명령 `review-syntax.json`.
- `node --test --test-isolation=none --test-force-exit --test-timeout=60000 scripts/hani-office-<이름>.test.mjs`: residents **16/0**, labels-qa **14/0**, top-labels **7/0**, crowded-labels **19/0**, obr8 **2/1**, obr15 **13/1**, obr21 **4/2**, hd-224 **10/0**, consult **19/1**. 합계 **104통과/5실패**(공통 owner 중복 포함), 명령 **5성공/4실패**. 명령·로그 `review-tests.json`·`review-*.log`.
- 실패5개는 모두 과거 source 조회 `spawnSync git EPERM`. 이전 완료 로그의 동일 실패명·원인과 대조해 **새 실패0**. 이전 로그 UTF-16LE BOM을 디코딩해 비교. 과거 oracle·시간 한도·허용 범위를 바꾸어 PASS 처리하지 않음. `review-comparison.json`.
- 신규 검사: 지점18·전체 보행8구간의 독립 segment/AABB 교차, 모든 층 가구 거부·빈 책상, 하루 보행/포즈·야간 분리·대체, alpha40프레임, 360/390/1440px 모의 라벨, 상태 경계 없는 이동 구간 총90 frame 레이아웃 읽기0, 실제 delegated tap과 CSS 선언 우선순위, 데이터 write0.
- Node child spawn 최초 실행 도구는 EPERM으로 시작 실패. PowerShell에서 실제 Node 명령을 순차 실행. 최초 실패는 `review-tests-spawn-blocked.json`에 구분 보존.
- `node artifacts/office-pets-npc/verify-preservation.mjs` PASS: JS 전체 실제 base blob 역변환, 추가 base 대조 가능10파일 동일, 이번 frozen19파일 동일, 기존 manifest25 entry·승인7WebP byte 동일, CSS는 승인 hidden 규칙 한 곳 외 원문 보존. 과거 packed object8개 추가 raw 대조는 기존처럼 미검증. `review-preservation.json`.
- `git diff --check` PASS. closure **135/160·missing0**(기존128+승인7WebP). 직원/방문객 plan·outing·snapshot, index/main·공간 데이터·org·저장/Cloud/schema 불변. 표시 **2.9.252**, 로컬 마지막 script `./hani-launch-greeting.js` 유지.
- 기존 exact-line/LCS 방식으로 fixture 재생성. 현재 JS SHA256 `21f80699db5b965130f575380ecb2cfaff6dadac6434bc25892b5e0d48c402e1`, 주민 fixture SHA256 `3ae59b1051677cbfbe7072cdc690154e91b1165c6fb33e9ef5ce76a9ee22463f`. 역변환 source SHA256 `4f03c015fe3996d546afe1710a41c19a44d3a4d63c621ef132fb8ac255e06c6f`. display fixture·과거 plan hash 유지.

### 미검증·다음 담당에게

- 먼저 읽기: [REVIEW-FIXES.md](../../../artifacts/office-pets-npc/REVIEW-FIXES.md), `review-comparison.json`, `review-preservation.json`. 이번 후속 결과가 이전 좌표·검증 수치보다 최신이며 이전 근거는 보존함.
- 다음 행동: **서윤 실화면 확인**. 1F 밤 바닥·분리 위치, 전층 낮 이동/가림·가구, pet 모든 포즈·NPC 머리 이름표, 주민·방문객 링크 숨김, 모바일 확인. 브라우저 차단 지시 준수, 앱 screenshot0. 모의 geometry·CSS 선언 검사는 실제 화면/computed style PASS가 아님.
- 외부 담당 `.serin-residents-result.md`는 수정하지 않음. 추가 reduced-motion 좌표 보간·말풍선 lifecycle·reaction 검토는 이번4건 범위 밖의 후속 확인. 기존 reduced-motion PASS는 애니메이션/포즈 정지이며 좌표 정지 보증은 아님.
- 원격 main 최신성 연결 실패, 임의 merge/rebase 없음. main 병합·Pages·운영 표시·최신 JS 실제 로딩·기능 read-back 미수행. Full package/One-Pass/HINA/버전 증가 N/A. PR·배포·서버 설정/Edge Function 추가 없음.
- 다른 담당 파일·CURRENT/DECISIONS 보존. 사용자 금지에 따라 commit·탑승용 push도 하지 않음. Notion 쓰기 자동 승인 거절로 아래 최종 원문 반영 대기, 저장/read-back 완료 아님.

### Notion 후속 갱신 대기 원문

2026-11-01 23:05 KST / Codex / 본사 주민 실화면 수정4건 / hani/office-pets-npc-art / base333b035 / qa-b7. qa-b7c 승인으로 배경5층·art-map 대조, 전용18지점·안전 보행8구간을 빈 바닥으로 이전·가구 전체와 몸통 검사 강화. 밤 cat43%,55%·dog57%,55% 별도 usual 영역 sleep. alpha40포즈 머리 위 기존 라벨 flow, hidden CSS로 주민·방문객 프로필 숨김. syntax8/8, 지정9명령104통과5실패(5성공4실패), 실패5는 기존 Git EPERM 동일·새 실패0. exact-line 전체 역변환·직원/방문객 plan/데이터 보존, frozen19파일 동일, closure135/160 missing0. 표시2.9.252·cache·저장/Cloud/schema·직원 계획 불변, commit/push/merge/배포 없음. 실제 browser 차단으로 미검증, 다음 서윤 실화면·모바일 확인. 추가 세린 reduced-motion 좌표/말풍선/reaction 리뷰는 후속 확인. 원격main 연결 실패·운영 미검증. 원문 이 handoff와 artifacts/office-pets-npc/REVIEW-FIXES.md. Notion append는 자동 승인 never 거절, 저장/read-back 미완료.
