# 보리의 가끔 산책

- Codex / `hani/bori-stroll` / base `f1a457f`. 과제 파일 UTF-8 한글 정상. 로컬 표시·cache **2.9.279 유지**. push·merge·배포 없음.
- 날짜 시드만으로 KST 09~21시 약 30~45분 간격의 2~4분 외출. 기존 일어남·걷기·앉기·수면 pose, base18 속도, 같은 층 1~2개 정류장 후 복귀. 산책에는 짧은 냄새 맡기·쉼이 포함되며 실제 걷기만 2~4분은 아님. 기존 10줄 대사·단일 bubble/tick 재사용. 나머지 시간·22시 이후 수면.
- 평일 11/02·11/06, 주말 11/07·11/08 **각1,440분: 20/18/21/19회**, 간격35~40분·외출136~233초(4일 전체), 밤 산책0·산책 중 펫/동행/남매 겹침0. 하루 수면 약95~97%. [매분 근거](daily-evidence.json).
- 기존 `free`·`residentSafe` 유지, 산책 양끝/경로 예약으로 2F 병아리와 분리. 남매 후속 이동도 보리96px 간격 유지. **평일·주말41회×0.5초** 걷기/정류장/복귀·겹침0 확인. 직원 통과로44표본(22초 합계) 잠시 숨음은 기존 안전 규칙 유지. [정밀 근거](tour-evidence.json).
- 원래 278 계약 전체 불변, strict exact inverse 14쌍 추가. 기존 assertion 삭제·완화 없음. **신규7항목 완료**(공통6 포함, reduced-motion fixture 층 선택 오류 수정 후 해당 DOM만 재검사). 기존 **67파일785 PASS·기존 실패1·skip5**, 신규 회귀 실패0. [최종 집계](final-validation.json).
- 성능 cafe-rest/lively-v2 **각3/3 PASS**, 원래 best-of-3<400ms·warm<3ms 그대로. cafe 부재 best295.3/288.9/280.2ms·재실298.9/300.4/308.5ms, lively280.4/286.2/281.0ms·warm0.731~0.761ms. 앞선 동시 실행 1회실패(best409.2ms)도 로그 보존 후 단독3회 재측정. [최종 성능](performance-isolated.json)·[초기 실행](performance.json).
- 실제 Edge 격리 화면 PC1440/폰390 · 1F/2F · 기상/걷기/휴식/복귀/수면 **20검사 PASS**, PNG20장·수동 탭 bubble·오류0·저장0. [화면 근거](browser.json). 실제 로그인·Android·아린/HINA·운영 검증은 미수행.
- index/main/CSS/manifest/공간·일정 데이터 8파일 원문 보존. closure161·누락0, 새 runtime파일/저장/timer/listener0(등록2/4/15 유지). [보존 근거](proof.json). runtime `9301104e` / contract `f75f5f3f`.
- 기존 이름표 대비 시험(219) 실패는 변경 전 기준선에서도 동일 재현. [기준선 실행](baseline-219.log). Notion 착수 기록은 자동 승인 검토가 `approval policy never`로 거절해 미반영·갱신 대기.
- 실제 `git add`가 worktree `index.lock` 쓰기 권한 거절로 실패해 **미커밋**. 다음: 권한 있는 배포 담당 Claude가 변경 파일·증거를 검토하고 로컬 commit/열차 포함, 대표님 Preview/최종 승인 후 정식 Candidate 검증. 이번 과제는 push 금지이므로 자동 탑승 처리하지 않음.
