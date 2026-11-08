# tooling-283 후속 · office 8개 시험

2026-11-08 KST · Codex · `hani/tooling-283` · base `a28918d`(기존 인수인계, Git 금지로 새 조회 없음).

8개 Git 실행 로그를 전체 읽고, 해당 시험에 `hani-life-bundle-preload.mjs`를 직접 연결했다. 이제 별도 CLI preload 없이 **283 → dev-report → wishlist → procrastination → study-retry 직전**의 index/main을 기존 office 체인·버전 투영과 비교한다. 역사적 Git blob·baseline 복사본은 투영하지 않는다. kids-visit/staff-chat의 raw reader 예외도 그대로다.

- 변경: barista-night-273-pins, barista-night, bori-stroll, companion-homes, pet-bori-272-pins, residents, xmas-269-pins, xmas 시험의 import만 추가. 추가 import·주석을 제거하면 기존 시험 본문과 바이트 동일(assertion·Git 호출·고정 pin·EOL 보존).
- 바이트 확인: 273 normalized pin·272 raw pin·268 raw pin의 index/main 전체 SHA256 6개, Bori stroll·companion homes 역변환 전체 SHA256 2개 일치. 원문 closure168/투영161·누락0, 차이7개는 생활 묶음 의존성. Git 응답 mock 없음.
- inverse 전용5/5·변경 시험 syntax8/8 PASS.

| 대상 시험 | 기존 비교 바이트·조건 보존 | 로컬 통과 / Git 차단 |
|---|---|---:|
| barista-night-273-pins | index/main fixed-272 normalized 전체 해시·Git equality | 4 / 1 |
| barista-night | atlas 전체 해시·closure 158→159 | 13 / 0 |
| bori-stroll | office JS fixed f1a457f 역변환·closure161 | 13 / 1 |
| companion-homes | office JS fixed c590f8a 역변환·closure161 | 15 / 1 |
| pet-bori-272-pins | index/main fixed-271 전체 해시·Git equality | 3 / 1 |
| residents | atlas·기존 closure138·승인 추가 목록 | 49 / 0 |
| xmas-269-pins | office JS/CSS 역변환·fixed-268 index/main Git equality | 1 / 1 |
| xmas | 보호 구간·fixed-268 index/main·closure152→153 | 12 / 1 |

대상8개 합계 **110통과·6 Git 차단**. office 전체는 **69파일 실행, 기존 성공41파일 전부 유지·28파일 Git 차단**, **745통과·35 Git 차단·3 skip·기타 실패0**. 실패35건의 전체 로그를 확인해 모두 `USER_GIT_DISABLED`로 분류했다. 차단된 검사 안의 나머지 assertion은 미검증이다.

부산물 JSON4개(OBR16·17·19 layout, drama reachability)를 착수 원문 SHA256으로 복원했다. 나머지 원래 파일·새 부산물 유입0, 런타임497파일은 착수 및 기존 283 증거와 바이트 동일, 범위 밖 변경0. 기존 미커밋 작업 보존.

근거: [실행기](b/run-tests.mjs), [바이트 대조](b/byte-comparison.json), [전체 집계](b/summary.json), [보존·복원](b/final-audit.json), [인수인계](../../docs/development-history/handoffs/2026-11-08-tooling-283-b.md). Git 차단은 `NODE_OPTIONS=--require ./artifacts/life-bundle/no-git-283.cjs`, 명령은 `node artifacts/tooling-283/b/run-tests.mjs office`. 대상8개에는 외부 `--import`를 사용하지 않는다. Node24.22.1, 기존 실행기와 같은 NODE_PATH·baseline 환경 사용.

다음: **서윤이 diff 검토·실제 Git으로 8개 재실행·커밋**. 실제 Git 원문 대조는 미검증이며 PASS로 선언하지 않는다. Git 명령·commit·push·merge·버전 변경·배포 없음. runtime 버전/운영 QA N/A. Notion 읽기 성공, 착수 쓰기는 자동 승인 검토가 `approval policy is never`로 거절하여 완료 요약도 갱신 대기.
