# IC 적정가 빈칸 수정 · 2026-11-07 KST

- 담당 Codex / `hani/ic-fairvalue-range` / 기준 `143c3e5f1901f9cbcfc59dc867bb9e4fc3ac5984`. 작업 시작 시 GitHub main·로컬 HEAD·origin/main 캐시 일치. 과제 원문 UTF-8 한글 정상 확인.
- **수정·회귀 시험 작성 완료, 실행 검증·커밋은 환경 차단으로 미완료.** push·merge·버전 변경 없음.

## 변경 diff

`hani-investment-committee.js:303` 한 줄만 변경:

```diff
-    if (mid === undefined && out.fairValueLow > 0 && out.fairValueHigh > 0) {
+    if (out.fairValue == null && out.fairValueLow > 0 && out.fairValueHigh > 0) {
```

파싱된 Mid가 null인 경우까지 기존 `(Low + High) / 2` 계산을 재사용한다. null·빈 문자열·누락이 해당하며 추가 반올림은 없다. 기존 메모 `입력된 적정가 구간의 중간값`도 그대로 사용한다. 세 값이 모두 비었을 때 기존 값을 유지하는 `reviewReport`의 `preservedFairValue` 및 화면 안내는 이미 있어 변경하지 않았다. Low/High 한쪽만 있으면 계산하지 않으며 역전 범위 오류도 기존 검증에 맡긴다.

## 검증·미검증

- 신규 `scripts/hani-ic-fairvalue-range.test.cjs` 7개 시험 작성: null/빈/누락 Mid·범위, 기존 값 보존, Low/High 단독, 역전 범위의 기존 오류, 객체 불변, 기존 별칭/범위 입력·명시적 Mid, 기존 applyBatch 저장 성공·실패 복원.
- 기존 IC 5파일·신규 1파일·관련 Research/안전/2차·최종 검토 등 총 12파일 실행 및 변경 JS 2파일 syntax 검사를 시도했으나 **Node 실행 자체가 `Access is denied`로 차단**됐다. 실행된 시험 0개, PASS 판정 없음. 명령과 오류: [test-attempts.log](test-attempts.log). 기존 시험은 수정하지 않았다.
- 바이트 검사 통과: 조건문을 되돌린 원문의 SHA-256이 작업 전과 동일. 나머지 코드·혼합 개행(CRLF 556개) 보존. `hani-main.js`·`index.html` SHA-256 불변. 원문 diff: [runtime.diff](runtime.diff).
- 새 키·새 쓰기 경로·기존 commit/save·스키마·Supabase·migration 변경 없음. 운영 데이터 접근/저장 없음. 실제 UI·전체 안전 검사·운영 read-back은 미검증. 표시/캐시 `2.9.273` 유지, 배포 미실행.

## 차단·다음 행동

Git 실행도 `Access is denied`여서 요청한 로컬 commit을 만들지 못했다. Git 메타데이터는 worktree 밖에 있으며 수동 수정으로 우회하지 않았다. 허용된 환경에서 위 시험·syntax·관련 안전/UI 검사를 실행하고 결과를 확인한 뒤 승인된 파일만 로컬 commit해야 한다. push·merge·버전 변경 금지는 유지한다.

Notion 현황판 읽기는 성공했으나 착수 기록 추가는 자동 승인 검토의 `approval policy is never`로 거절되어 미반영이다. 최종 요약도 갱신 대기로 [작업 인수인계](../../docs/development-history/handoffs/2026-11-07-ic-fairvalue.md)에 보존했다.
