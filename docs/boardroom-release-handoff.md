# HANI BOARDROOM · 배포 직전 인계

## 현재 후보와 보류 조건

- 기존 검토 PR #132는 병합 없이 닫혔다. `hani/boardroom-live-meeting`을 새 main에 통합한 뒤 새 PR을 연다. 현재 표시 후보 버전은 `v2.9.150`이다.
- 2026-10-01 재확인 당시 `origin/main`은 `90b8508` (`v2.9.149`)이다. 배포 시 기준선이 다시 이동했는지 재확인한다.
- 운영 `hani-agent-orchestrator`는 v48 / 소스 v1.9.1이다. 현재 운영 소스는 `scripts/hani-boardroom-rebuild-edge.mjs --production-baseline`의 결과와 줄 끝 및 파일 끝 빈 줄을 정규화하면 일치한다. 정규화된 기준선 SHA-256은 `6ce3451f539c8e45f91e7a523acdec80a560e9cfcbe9c374976e17999a8022b1`이다.
- 신규 후보 Edge Function은 `scripts/hani-boardroom-rebuild-edge.mjs`로 재구성하며 소스 v1.9.2다. 현재 생성 파일 SHA-256은 `0d8adbac85d5cac9893f34a7b5b093989387efd436648ceaf351445e753026ec`이다. 운영 함수는 아직 교체하지 않았다.
- Runtime 파일 81개의 누락 검사, 패키지 무결성 검증, 커밋 기준 Yuri Pre-QA, 대상 회귀 테스트가 통과했다. 패키지는 현재 커밋과 main 기준선에 묶여 있으므로 두 값 중 하나라도 바뀌면 다시 생성한다.
- Arin의 독립 UI Review, HINA Final Gate, 실제 Case에서의 발언 품질·근거 검증, 대표님의 최종 Production 승인은 아직 완료되지 않았다. 로컬 Preview는 화면용 예시 데이터이며 서버·DB와 연결되지 않는다.

## 다른 배포 완료 후, 운영 반영 전

1. `origin/main`, 운영 표시 버전과 마지막 로드 UI JS, 운영 Edge Function 버전·소스를 새로 확인한다. main이 이동했으면 변경 범위와 충돌을 먼저 검토한 뒤 후보를 통합하고 표시 버전·캐시 태그를 다음 고유 버전으로 맞춘다. 운영 함수가 v48 기준선에서 달라졌으면 기존 패치를 그대로 적용하지 않고 새 기준선에 대해 재검토한다.
2. 최종 후보 SHA를 고정한 뒤 JS/Edge 구문, 대상 회귀, LocalStorage·Cloud 쓰기·schema 안전, 실제 Desktop/Mobile 화면, Runtime closure, 릴리스 패키지와 커밋 기준 Pre-QA를 다시 확인한다.
3. Arin UI Review와 HINA Final Gate를 **그 최종 SHA**로 완료한다. Preview를 대표님께 보여주고 승인받는다. 다른 커밋이나 다른 패키지의 검증 결과를 재사용하지 않는다.
4. 배포 전에 운영 Edge v48 소스를 백업하고 배포 설정을 기록한다. 기존 `verify_jwt` 설정과 Secrets는 변경하지 않는다. v1.9.2 후보 소스를 배포한 뒤 함수 버전·기존 action 회귀를 확인한다. 함수 반영이 실패하면 main 병합을 진행하지 않고 백업한 운영 소스로 복구한다.
5. 함수가 준비된 경우에만 승인된 PR을 main에 병합하고 GitHub Pages 반영을 기다린다. 표시 버전, 최신 `hani-main.js`·`hani-office-live.js`·CSS 로드, 회의 소집과 교차 검토·질문·결론 화면을 Production에서 read-back 한다. 실제 Case 검증은 기존 데이터 보존과 비용 상한을 지키며 진행한다.

## 남는 위험

- `run_cross_review`는 같은 Case·round의 **순차 재시도**에서 기존 Event를 재사용한다. DB 고유 제약이 없으므로 완전히 동시에 들어온 중복 호출까지 원자적으로 막지는 못한다.
- 교차 발언은 서버가 참조 식별자와 길이를 검사하지만, 사실·숫자의 의미 검증은 모델 지침 및 후속 Verification에 의존한다. 실제 Case의 근거 대조가 Release QA에 필요하다.
- 교차 발언은 해당 라운드의 Event 저장이 끝나면 한 번에 표시된다. 발언별 실시간 스트리밍은 이 후보에 포함되지 않는다.
- 다른 배포가 main의 파일·버전 또는 운영 함수를 변경하면 이 문서의 기준선, 후보 버전, 패키지·함수 해시를 갱신한 뒤 게이트를 다시 수행해야 한다.
