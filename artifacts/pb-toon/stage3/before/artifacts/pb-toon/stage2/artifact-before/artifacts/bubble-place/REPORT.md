# PC 자동 말풍선 배치 수정

- Codex · 2026-11-07 KST · `hani/office-companions` · base `0159d09`.
- 기존 owner에서 PC 말풍선을 sprite·최종 이름표/상태 박스 위에 배치하고, 공간이 부족하면 아래로 전환·좌우 경계 보정. 같은 프레임의 이름표 재배치와 이동도 기존 캐시로 반영.
- PC 폭을 위치와 무관하게 고정해 좌표 변경 시 줄바꿈이 달라지는 문제 보완. 폰 compact 좌표·순서는 기존과 동일. 새 runtime 파일·timer·listener·레이아웃 읽기·저장 경로 0.
- 전용 포함 floor-bubble **21/21**, labels/pins **22통과·Git EPERM 5차단**. 기존 278 assertion·이전 contract 값 유지, 이번 정확한 변경 3묶음만 확장.
- Edge 156 / 토요일 14시 / 4층 / PC1280×900: 가상480초·0.8초 간격, 말풍선 301표본·51대사, 본인 sprite/이름표 교차 **0/0**. PC PNG3장 직접 확인. 폰390의 413표본은 **원본과 말풍선·이름표 좌표/대사/시각 완전 일치**(기존 이름표 교차15표본 유지). 두 화면 단일bubble·저장0·page error0.
- 보호 파일 9개와 역변환 runtime을 HEAD 원본 Git blob과 대조, syntax4/4·closure161 불변·누락0. 표시·캐시 `2.9.277` 유지, 원격 main `b736774` 확인. Candidate/배포/운영 검증 N/A.
- 지정66파일: **717통과·Git31차단·기존 버전 fixture 비교2실패·성능1실패·skip5·미완료0**. 동일400ms 재검사는 통과(부재324ms/재실374ms), 최종 결과 **718통과·Git31차단·기존실패2**. 남매 방문/직원 수다의2.9.276 기준 파일 비교 실패는 수정 전 원본에서도 동일 재현, 기존 assertion/fixture 유지. 새 기능 실패0.
- 로컬 commit은 `git add` 시작부터 **Git EPERM 차단·미커밋**. push/merge/버전 변경 없음. Notion 쓰기는 자동 승인 검토가 `approval policy never`로 거절해 갱신 대기.
- 근거: `final-summary.json`, `browser-results.json`, `phone-comparison.json`, `regression/summary.json`, `cafe-recheck.log`, `baseline-visit.log`, `baseline-staff.log`, `validation.json`, `git-commit.json`. 초기 실패/중단본은 `preliminary-*`로 분리하며 최종 PASS 근거로 사용하지 않음.
