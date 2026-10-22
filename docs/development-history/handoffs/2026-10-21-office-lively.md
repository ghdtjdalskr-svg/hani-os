# 작업 인수인계 — 본사 사무실 다시 활기차게 (office-lively)

## 작업 식별

- 작업 ID / 제목: office-lively / 본사 직원 상태·포즈·짧은 산책이 자주 바뀌도록
- 갱신 시각(KST): 2026-10-21 저녁
- 담당 도구 / 검토 담당: Claude Code(서윤 팀장 세션에서 분리된 작업 세션) / 배포 담당 열차 검토
- 상태: 탑승 대기 (push 완료, PR 없음)
- 저장소 / branch / worktree: HANI_OS_DEV / `hani/office-lively-20261021` / `.claude/worktrees/gifted-rhodes-460471`
- base SHA: `925d9e1` (origin/main)
- 목표 / 완료 조건: 보이는 층에서 2~2.5초마다 눈에 띄는 변화, 저녁·밤에도 장난 상태(간식·인스타·수다) 섞기, 가끔 같은 층 짧은 산책. 버전 증가·merge 없음.
- 수정 범위: `hani-office-live.js`(scheduler snapshot 안의 idle 표현 층 + renderer layout key), 테스트 3개 조정, 측정/회귀 테스트 2개 추가
- 사용자 승인 근거: 대표님 10/21 저녁 피드백(“예전처럼 자주 바뀌고 돌아다니던 재미”). 배포 승인은 아님.

## 원인

- `setInterval(changeOne,4200)`은 scheduler가 있으면 실질 효과가 없다. 화면은 100ms tick이 `scheduler.snapshot()`을 그대로 그린다.
- 정적으로 느껴진 진짜 이유: 일정(event)이 없는 직원은 하루 종일 같은 문구(`자료 확인 중`, 저녁 `퇴근 준비 중`, 밤 `야근 중`)로 고정. 예전 `statusPools`(인스타 순찰·간식 서랍 등)는 216 scheduler 전환 때 사라졌다.
- 또 renderer의 layout key에 `line`이 없어 문구만 바뀌면 다시 그려지지 않았다.
- 그래서 4200ms 타이머는 그대로 두고(기존 테스트가 이 타이머를 사용), 변화는 scheduler 쪽 idle 층에서 만든다.

## 변경 내용

- idle 표현 층(일정 없는 직원만, event가 항상 우선):
  - 층마다 2.4초 박자(beat)로 그 층 직원 1명을 결정적으로 골라 시간대 문구로 바꾼다(최근 12박자 안에 뽑힌 문구 유지).
  - 문구 풀: 낮 / 저녁(퇴근 준비 중 포함) / 밤(야근 중 포함) / 라운지(유나·민지) / 심야 라운지. 각 풀 절반가량이 장난 상태(몰래 인스타 순찰 중, 간식 서랍 점검 중, 고양이 영상 1분만…, 옆자리랑 수다 중 등). 일부는 같은 자리에서 서기(기지개·커피 리필).
  - 5박자(12초)마다 1/3 확률로 뽑힌 직원이 같은 층의 빈 anchor까지 짧게 걸어갔다가(머무름 4초) 돌아온다. canon `route()` 경로만 사용, 왕복+머무름 ≤ 11.5초, 다른 층 경유 금지, 소유/점유 seat 금지, 그 시간대 event 인원·경로 자원과 겹치면 취소, 화면상 같은 자리와 겹치면 집 자리로 복귀.
- 유지: reduced-motion(산책·서기 없음, 문구만 변함), 숨김 화면 guard, 결정적 로컬 시계, AI 호출 없음, 저장소 write 없음, spatial-216-v1 anchor·action table(216/221 JSON) 변경 없음.

## 보이는 변화 빈도 (실제 scheduler, 1초 샘플, 221 catalog)

| 구간 | 이전 평균 간격 / 최장 정지 | 이후 평균 간격 / 최장 정지 | 1시간 문구 종류(층별) |
|---|---|---|---|
| 평일 낮 14–15시 | 17–19초 / 32–34초 | 1.9–2.3초 / 7–10초 | 5–12 → 22–29 |
| 평일 저녁 19–20시 | 18–19초 / 31–32초 | 1.9–2.3초 / 7–8초 | 6–13 → 23–35 |
| 평일 밤 23–24시 | 17–18초 / 31–32초 | 1.9–2.3초 / 7–10초 | 5–13 → 22–32 |
| 주말 낮 14–15시 | 24–28초 / 46–48초 | 1.9–2.2초 / 6–8초 | 6–10 → 23–27 |

- 재현: `node scripts/hani-office-lively-measure.mjs`
- 산책: 층마다 시간당 약 20회(약 3분에 1번).

## 검증

- `node --test` office 묶음(206-engine, 206, newstaff-215, actions-216, actions-221, fix-218, hd-224, seats-215, tap-lines, v2-215, staff-floors-214, lively 신규): PASS
- `hani-building-206-safety` / `206-ui`: origin/main에서도 동일하게 실패(기존 문제, 이번 변경과 무관)
- 브라우저(Playwright + Edge, codex runtime playwright): `hani-office-219.test.mjs --browser` PASS(240 checks, 16 screenshots), `hani-office-217.browser.mjs` PASS, `hani-office-actions-216.browser.mjs` PASS
- `hani-office-actions-221.browser.mjs`(scheduler 로드 대기 30초 timeout), `hani-office-fix-218.browser.mjs`(`/sprites-v2/` 기대인데 224 HD v3 로딩): origin/main 원본 파일로도 같은 이유로 실패. 기존 문제이며 이번 변경과 무관. 열차 전에 별도 정리 필요
- 조정한 기존 테스트(의도된 동작 변경):
  - `hani-office-fix-218.test.mjs`: 저녁/밤 문구를 고정 문자열 대신 “시간대 어휘(낮 문구가 새지 않음)”로 검사, 산책 중 직원은 같은 층 anchor 허용
  - `hani-office-219.test.mjs`: 10:00/15:40 baseline 비교를 event 인원 전체 + idle 인원의 id/층/action/activity로 한정

## 다음 담당에게

- 먼저 읽을 곳: `hani-office-live.js`의 `idlePools` / `idleFlavour` / `idleStroll`, snapshot의 lounge 루프 뒤 충돌 정리
- 다음 행동: 다음 배포 열차에 탑승. 열차에서 버전·캐시 태그만 올리면 된다. Edge Function·서버 설정 없음.
- 남은 위험: 실제 폰 화면에서 산책 빈도·문구 길이 체감은 Preview로 대표님 확인 필요. 상태 칩은 장난 문구여도 `근무 중`으로 표시됨(의도).
- 데이터·Cloud·schema 영향: 없음.
