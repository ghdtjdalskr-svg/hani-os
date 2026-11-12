# 사무실 직원 탭 말풍선 누락 수정 · 서윤 / Claude Code

## 작업 식별

- 작업 ID / 제목: office-tap-bubble / 직원을 눌러도 말풍선이 가끔 안 뜨는 문제
- 갱신 시각(KST): 2026-11-12
- 담당 도구 / 검토 담당: Claude Code(서윤)
- 상태: 승인 대기(미리보기) · 배포 열차 탑승 대기
- 저장소 / branch / worktree: ghdtjdalskr-svg/hani-os / `hani/office-tap-bubble` / `.claude/worktrees/bold-bell-72a3b1`
- base SHA: origin/main `49096deb9ca99790c48106bbff7ec275273b1b52` (재현은 `7769fbe`, 두 SHA 사이 runtime 변경 없음)
- 목표 / 완료 조건: 사용자가 직원을 누르면 항상 그 직원 말풍선이 열린다.
- 수정 파일·범위: `hani-office-live.js` 1줄(IntersectionObserver 콜백). 표시 버전·`?v=`·`HANI_DISPLAY_VERSION` 미변경(§11).
- 승인 근거: 회장님 지시(2026-11-12) “hani/office-tap-bubble 브랜치에서 수정, 배포·머지는 승인 전 금지”.

## 원인

- 탭 경로(`activateActor → tapActor → openBubble → showBubble`)는 정상이고 토글 닫기 경로는 없다. `tapActor`가 `sceneVisible()`(=`mapOnScreen && viewVisible()`)이 false면 조용히 return한다.
- `mapOnScreen`은 `new IntersectionObserver(entries=>{mapOnScreen=entries[0].isIntersecting;...})`로 갱신된다. 화면 전환 직후 브라우저가 기록 2개를 한 번에 전달(`[false, true]`)하면 **가장 오래된 기록(false)** 을 읽어, 사무실이 화면에 보이는데도 “화면 밖”으로 남는다. 다음 교차 변화가 올 때까지 탭·자동 말풍선이 모두 무시된다.
- 추적 결과: 실패 회차는 `IO 2 false@1337,true@1463` 후 지도 top 554/1000(화면 안)인데 `mapOnScreen=false`. `openBubble` 호출 0회. 친밀도 +1도 실제로 오르지 않았다(innerText의 “+1 ♡”는 숨겨진 고정 문구).
- `data-speaking` 토글 가설은 원인이 아님(토글 닫기 코드 없음).
- 실제 기기: 같은 묶음 전달은 화면 전환·빠른 스크롤에서 생길 수 있어 실제 폰/PC에서도 가능하다고 판단(실기기 미확인).

## 변경

- `hani-office-live.js`: `entries[0]` → `entries[entries.length-1]`(가장 최신 기록 사용). 새 event/renderer 층 없음, 저장소·친밀도 저장 경로 무변경. 파일의 혼합 CRLF/LF 바이트는 그대로 보존.
- 시험 전용 바깥 되돌리기 층: `scripts/hani-office-tap-bubble-source.cjs`, `scripts/fixtures/office-tap-bubble-delta.json`(전후 SHA256 고정, 정확히 1쌍). 연결: `hani-office-kids-daily-source.cjs`(기존 최상위 office 층) 앞, `hani-release-version-layers.cjs`의 `projectPreRelease289Source`·`project` 앞. `hani-office-kids-weekday.test.mjs`의 daily 층 자체 검사 입력만 이 층을 벗겨 넣음(assertion 무변경).
- 새 시험 `scripts/hani-office-tap-bubble.test.mjs`: 묶음 기록 [false,true]→탭 열림, [true,false]→계속 화면 밖(기존 보호 유지), 실제 Edge 10회×4개 층 직원.

## 검증

- 새 시험(수정 후): 9/9. 실제 Edge 1440×1000, 11:00 KST 고정, 회장 부재: 4F 하니·가은·미르, 3F 아린·도현, 2F 다온·하루, 5F 서윤·유리 **각 10/10**, pageerror 0, `hani_os_life*` 쓰기 0.
- 같은 시험을 수정 전 main에 적용: 단위 2건 실패, 브라우저 **각 8/10**(10번 중 2번은 그 화면 전체에서 탭 무시) → 원인 재현 확인.
- 이음(`origin/hani/join-ieum` f933794 + 같은 1줄): 4F 하니·이음·가은·미르 등 **각 10/10**. 그 브랜치의 기존 206-engine “19 actors” 2건 실패는 이음 추가로 인원이 바뀐 그 브랜치 쪽 사항.
- 최종 집계(`node --test` 파일별, office 전체 + M9 + release/newsroom/budget 층 78파일): **876통과·실패11·skip3, 신규 실패0**. 실패 11건은 수정 전 main `49096de`에서 같은 이름으로 동일 재현: `hani-office-219`(기존), `hani-seoyun-m9` 11/15(4실패), `hani-m9-link` 6/10(4실패), `hani-office-barista-night` 1, `hani-office-pet-bori` 1. 즉 **M9 15/15는 main에서도 미달**(이번 작업 전부터). 첫 실행에서 사무실 파일 해시 핀에 걸린 실패는 위 되돌리기 층으로 모두 해소.
- 시험이 다시 쓴 기존 증거 5파일(`artifacts/m9-link/closure.json`, `artifacts/office-behavior/obr16·17·19-layout-node.json`, `artifacts/office-drama/reachability.json`)은 원래 바이트로 복원, 커밋에 미포함.

## 미검증 / 남은 위험

- 실제 Android·회장님 PC 실기기 확인 없음. 미리보기에서 확인 필요.
- 배포 담당: 열차 버전을 올릴 때 이 층 위에 릴리스 버전 층을 추가한다.

## 다음 담당에게

- 다음 행동: 회장님 미리보기 승인 → 배포 열차 탑승.
- 다른 작업 영향: `hani/join-ieum`도 같은 줄(`entries[0]`)을 갖고 있어 열차에서 합칠 때 이 수정이 함께 적용되는지 확인.
