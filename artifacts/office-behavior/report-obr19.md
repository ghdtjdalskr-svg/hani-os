# obr19 — 원래 크기 캐릭터 + 뜻이 보이는 한 줄 알약

2026-10-30 KST · 도연/Codex 단독 · branch `hani/office-235-lively-labels` · base `2ddc0ceb7dfb0cd6027043b78b7b3099920cd5b5`.

**필수 배치 FAIL / 위치 조정 범위 답변 대기.** 캐릭터/문구 수정은 반영했으나 필수 배치를 완료했다고 보고하지 않는다. browser 실행0·신규PNG0. 로컬 commit 미완료: 공유 Git index.lock Permission denied(128), staged0·HEAD2ddc0ce 유지. push/PR/Notion/main/배포 시도0.

## 변경

- phone20px override 제거. 원래 `max(40px,6.8cqw)`·atlas 비율·pivot·40px hit 영역 복원/보존. 219의 source/browser 기대값도 원래40px 기준으로 복원했다.
- 원문을 읽어 행동 규칙으로 생성: 보고서작성·커피내리기·예산검산·창밖구경·기사구상·배포보고. 행동2–6자(공백 포함), 이름9자 이내 + 구분자3자 + 행동6자 = 현재 전체 최대18자. 문자 절단/줄임표 없음. 기존 shortLine의 정보 손실을 피하고, 보고 응답/도착 인사는 기존 원문 분류를 사용한다.
- 같은 층의 기존 renderer 순서에서 Set으로 의미 있는 대체 표현을 고른다. 원문/title/roster/tap은 보존한다. 2,920 snapshot·59,599명에서 길이/금지 단어 위반0·동시 중복0. 금지 목록은 `hani-office-obr19.test.mjs`에 있다.
- 기존 persistent name/status/compact span·단일 event path만 사용한다. 새 runtime 파일/renderer/handler/timer 없음. CODEMAP living-office owner를 확인했으나 최신 label symbol은 미등록(CODEMAP_MISS)이므로 실제 `fitStatusLabels → labels.place → offset commit`을 확인했다.
- 폰은 대화/인사/발화를 먼저 보존하고 전체 알약 수를 최대화하도록 기존 제한 탐색을 사용한다. 모두 보이지 않으면 beam 탐색을 시도한다. global 최적해를 증명한 것은 아니다. label-label/자기포함sprite/mascot/경계0·머리 중심반경28px·대화두줄·점누락0 검사는 그대로 강제한다. 390의 고정70% 검사는 대표님 결정에 따라 층·시간별 수치 보고로 바꾸었고, 1440의 기존100% 검사는 유지했다.

## 필수 조건 차단과 다음 선택

- 390 fixture의 지도342px·기존1672/941 비율에서 알약 최소 **12.5%**. label-label/sprite/자기얼굴/mascot/경계/거리 위반은 {"sprite":0,"face":0,"label":0,"mascot":0,"outside":0,"distant":0,"dialogue":14}. 모든 사람의 알약/점은 머리28px 안에 있으나 **대화 알약 14건이 점으로 바뀌어 FAIL**이다. 점 누락 0건. 이 결과는 Node 모형이며 실제 화면 PASS가 아니다.
- 2F 점 누락은 기존3px 탐색이 좁은 틈을 놓친 문제도 있었다. 최종 수정은 장애물 경계와 머리 투영을 후보로 사용하여 요청342px에서 점 누락0을 확보했다. 위치나 거리 기준은 바꾸지 않았다.
- 4F 첫 보고자는 고정 sprite/mascot만 놓고 다른 모든 라벨을 제외해도 알약 중심까지 최소29.674px가 필요하다. 필수28px와 충돌하므로 우선순위만으로 해결되지 않는다. [별도 직사각 cell 분석](obr19-fixed-head-space.json), 재현: `node scripts/hani-office-obr19-space.mjs`. 이는 Node 근사 atlas box의 증명이며 실제 브라우저 rect/픽셀은 서윤 확인이 필요하다. 회장/보고자 sprite box 자체도 겹치는 구간이 있어 browser15의 기존 해당 검사도 유지했다.
- 데이터·지도·표시 위치를 임의 수정하지 않았다. **휴대폰 표시 위치 최소 보정 / 지도 확대·스크롤 / 현재 위치 유지·실패 인계** 중 대표님 선택을 요청한 상태다. 임시 정사각 지도 진단도 필수 대화를 해결하지 못했고 최종 runtime/검사에 반영하지 않았다.
- 실제390 실측은 서윤 실행 전이므로 미검증. 아래 표는 폰트폭·rotation을 근사한 Node 모형이다. 실제 폰트/idle/브라우저 layout 결과로 해석하지 않는다. [장면별 원본](obr19-layout-node.json)에 실패 시각·id·머리 rect와 전체 spritePairs를 남겼다.

## 층·시간대별 Node 실측

각 층 74시점(09:00–19:00 10분 간격 +09:15 +보고 시작/끝), 전체370장면. 표의 시점은 전체/사람이 있는 시점이다. 합산 비율은 사람·시점 합계가 분모이며, 빈 층 비율은 N/A·점은 알약 보임에 포함하지 않는다. 점 누락은 점 비율과 별도로 기록한다.

|층|전체/재실 시점|알약 최소|알약 합산|점 합산|점 최대|점 누락 건|
|---|---|---|---|---|---|---|
|1F|74/74|50.0%|85.1%|14.9%|50.0%|0|
|2F|74/74|12.5%|40.0%|60.0%|87.5%|0|
|3F|74/74|40.0%|60.7%|39.3%|60.0%|0|
|4F|74/74|40.0%|58.1%|41.9%|60.0%|0|
|5F|74/6|50.0%|85.7%|14.3%|50.0%|0|

|KST|층|알약 / 전체|점 / 전체|누락|
|---|---|---|---|---|
|09:15|1F|3/3 (100.0%)|0/3 (0.0%)|0|
|09:15|2F|3/8 (37.5%)|5/8 (62.5%)|0|
|09:15|3F|3/5 (60.0%)|2/5 (40.0%)|0|
|09:15|4F|3/5 (60.0%)|2/5 (40.0%)|0|
|09:15|5F|0/0 (N/A 빈 층)|0/0 (N/A 빈 층)|0|
|12:10|1F|3/5 (60.0%)|2/5 (40.0%)|0|
|12:10|2F|4/7 (57.1%)|3/7 (42.9%)|0|
|12:10|3F|3/4 (75.0%)|1/4 (25.0%)|0|
|12:10|4F|3/5 (60.0%)|2/5 (40.0%)|0|
|12:10|5F|1/1 (100.0%)|0/1 (0.0%)|0|
|15:40|1F|2/3 (66.7%)|1/3 (33.3%)|0|
|15:40|2F|4/9 (44.4%)|5/9 (55.6%)|0|
|15:40|3F|3/5 (60.0%)|2/5 (40.0%)|0|
|15:40|4F|2/4 (50.0%)|2/4 (50.0%)|0|
|15:40|5F|0/0 (N/A 빈 층)|0/0 (N/A 빈 층)|0|

- 1440 fixture 지도1348px 알약/라벨 최소100.0%, 필수 위반{"sprite":0,"face":0,"label":0,"mascot":0,"outside":0,"distant":0,"dialogue":0}·점 누락0. desktop는 기존 이름/status 두 슬롯이다.
- 추가300px 진단 최소0.0%·대화누락27·점누락45. 요청390 결과와 분리했다.
- solver 평균/최대:342px 4.414/16.854ms, 1348px 1.066/5.847ms. DOM/layout 비용 제외.

## 검증

- office/building 30파일 최종 파일별 합산 **258 PASS / 1 FAIL / 3 SKIP / 262 executions**. 공통 owner import 중복 포함. [회귀](obr19-regression.log), [최종 기하](obr19-targeted-final.log), [최종 문구](obr19-vocabulary-final.log), [최종219](obr19-219-final.log). FAIL을 PASS로 대체하지 않았다. 일부 회귀 뒤 변경된 UI 문구 경로는219/obr18/obr19 및 baseline을 최종 재실행했다. planner/저장 경로 변경 없음.
- 235 pending exact after/설명만 갱신, fixed234 before·과거 chain·immutable235 oracle 유지. 승인 baseline **14 PASS / 0 FAIL**. [로그](obr19-approved-final.log).
- 원본 감사 회장님 있음/없음 각각54,000 snapshot: frozen/mismatch/stuckSeconds/near30/near24 모두0. [없음](obr19-audit-absent.log), [있음](obr19-audit-present.log). 이는 모델 검사이며 화면 겹침 검사가 아니다.
- syntax·diff --check 확인. base 대비 보호 파일387개 Git blob 원문 일치(index·버전 owner·마스코트·data/·assets/·immutable235 oracle). Storage/Supabase 경로0·기존 trap 회귀 결과는 각 로그에 기록했다. Cloud/schema/migration/Edge Function 동반 작업 없음.
- 아래 성능은 Node v24.20.0, presence별 독립 새 프로세스3회. 기존 best-of-3<400ms·warm<3ms 기준 유지. [원본](obr19-metrics.json). browser frame/DOM 성능은 미검증이다.

|회장님|cold3회 ms|best ms|warm 최대 ms|판정|
|---|---|---|---|---|
|없음|353.995 / 354.650 / 334.845|334.845|1.011|PASS|
|있음|349.444 / 350.017 / 343.629|343.629|1.552|PASS|

## 서윤 browser 인계

**작성만, 실행0·신규PNG0.** 실제 층·시간별 알약/점 비율·28px100%·겹침0·점누락0·보고/짝대화/도착인사 두 줄·tap/idle/reduce/pause·실제 frame/DOM 비용·Android·아린 UI 검토는 서윤 실행 대기다. 기존PNG를 재사용하지 않았다. 현재 알려진 기하 문제로390 필수 검사는 실패할 가능성이 크다.

```powershell
$env:HANI_OFFICE_BROWSER_TAG='obr19-labels'
node scripts/hani-office-obr14.browser.mjs
$env:HANI_OFFICE_BROWSER_TAG='obr19-dialogue'
node scripts/hani-office-obr15.browser.mjs
```

필요 시 각 명령 뒤 Playwright index.mjs·msedge.exe 경로 지정. 14는90장면/30PNG·실제click·층별 coverage와 점비율/누락 JSON, 15는4조건/8PNG·보고/도착/새 짝대화 검사를 작성했다. 실제 원문·노드 identity·무쓰기·facing·sprite collision 기준 유지. 실행이 첫 실패에서 중단되면 그 이후 장면은 미검증이다.

## 경계와 인계

- 로컬 commit: 로컬 commit 미완료: 공유 Git index.lock Permission denied(128), staged0·HEAD2ddc0ce 유지. Git 권한 우회/다른 worktree 변경 없음. 상세 identity는 [결과](obr19-results.json).
- 원격 main 연결 실패, origin/main 캐시 d6a88bc. 최신성·운영 화면/최신 JS 로딩 미확인. 로컬 index 표시는2.9.234·마지막 JS hani-launch-greeting.js. merge/rebase0.
- push/PR/Notion은 명시적 금지로0. CURRENT/DECISIONS 변경0. Candidate/build/One-Pass/HINA/main/Pages/Production은 기능 개발 범위 밖 N/A·미실행.
- [작업 인수인계](../../docs/development-history/handoffs/2026-10-30-office-obr19.md). 대표님 선택 후 같은 owner에서 표시 공간 문제를 해결하고 영향 검사만 다시 실행한다.
