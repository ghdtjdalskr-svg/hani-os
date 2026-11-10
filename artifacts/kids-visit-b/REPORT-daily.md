# kidsb-daily · 꼬마 평일 매일 방문

2026-11-09 13:15:31 KST · Codex 단독 · hani/kids-visit-pose-b / kids-visit-b · 지정 HEAD 3f40a06. **구현·지정 시험 완료 / 서윤 검토·커밋 인계.** Git 명령·커밋·버전 증가·배포 없음. 원격 최신성 새 조회 없음.

## 변경·승인 범위

../kidsb-daily-task.md 전체를 UTF-8로 정상 확인했다. 11/9 결정대로 hani-office-live.js의 날짜 확률 조건 **41바이트만 삭제**해 평일 매일 KST **[15:00, 19:00)** 아이 1명이 방문한다. 인물·인사 시드, 동물 자리 대체, 회장 부재 처리, 주말 남매, 기존 시간대·저장/Cloud/timer/listener·v2.9.285는 그대로다. 확률을 설명하는 별도 주석은 없어서 주석은 수정하지 않았다.

Buffer 앞뒤 연결과 exact inverse로 다른 바이트가 전부 같음을 확인했다. CRLF 252개와 LF 혼합을 보존했다. runtime SHA256: 변경 전 7e941be508a5efea0c309c8c689cd32bf976d3122a49ac34c7579e33acf67f36, 변경 후 4eb2dd2a1834b766c712e3aa9553a000191336a66aa02e2f0e50a5aaf5805f6b. runtime/정적 자산 503개 중 JS 1개만 다르다. closure 164개 / 누락 0.

새 scripts/hani-office-kids-daily-source.cjs와 fixtures/office-kids-daily-delta.json을 **daily → weekday → B → main**의 바깥 층으로 연결했다. 기존 weekday/B/main fixture pin과 assertion을 보존하고 부분·중복·EOL·무관 변경·다른 파일·반복 inverse 거절, Buffer 왕복을 추가했다. 기존 ~25% 시험만 승인된 새 사양으로 대체했다. CODEMAP의 living-office owner는 유효하지만 kids anchor는 없어 CODEMAP_MISS 후 해당 함수·시험만 좁게 확인했다.

## 시험

평일 시험 **19/19**: 2026년 365일 중 평일 261일의 방문 시간대 **62,640분 전부 아이 1명**, 각 평일의 15시 전·19시 이후 0명 및 밀리초 경계, 두 아이 등장·같은 입력 같은 결과·fresh scene/ISO·Math.random 금지, 주말 104일 표본이 변경 전과 완전히 동일함을 확인했다. 기존 주말 분 단위·말풍선/인사/지속 슬롯·무저장 검증도 유지했다.

| 검사 | 결과 |
|---|---|
| office 전체 72파일 | 787 통과 / 35 Git 차단 / 0 기타 실패 / 3 skip |
| 추가 11파일 합계 | 82 통과 / 2 Git 차단 / 0 기타 실패 / 0 skip |
| hani-office-kids-weekday.test.mjs | 19 통과 / 0 실패 / 0 skip |
| hani-office-kids-lively.test.mjs | 15 통과 / 0 실패 / 0 skip |
| hani-office-kids-merge.test.mjs | 10 통과 / 0 실패 / 0 skip |
| hani-office-kids-pose-b.test.mjs | 13 통과 / 0 실패 / 0 skip |
| hani-office-kids-visit.test.mjs | 16 통과 / 0 실패 / 0 skip |
| hani-pb-chibitoon.test.mjs | 5 통과 / 0 실패 / 0 skip |
| hani-procrastination-board.test.mjs | 6 통과 / 0 실패 / 0 skip |
| hani-life-bundle-source.test.mjs | 5 통과 / 0 실패 / 0 skip |
| hani-study-retry.test.mjs | 26 통과 / 0 실패 / 0 skip |
| hani-wishlist-quick-add.test.mjs | 7 통과 / 0 실패 / 0 skip |
| hani-dev-report-generate.test.mjs | 0 통과 / 1 Git 차단 / 기타 실패 0 |
| hani-newsroom-4cut-230.test.mjs | 7 통과 / 1 Git 차단 / 기타 실패 0 |
| hani-newsroom-persona.test.mjs | 4 통과 / 0 실패 / 0 skip |
| hani-newsroom-285-source.test.mjs | 2 통과 / 0 실패 / 0 skip |
| hani-release-version-layers.test.mjs | 5 통과 / 0 실패 / 0 skip |
| hani-seoyun-m9.test.mjs | 15 통과 / 0 실패 / 0 skip |
| 변경 JS/시험/helper syntax | 4/4 PASS |
| raw runtime closure | 164파일 / 누락 0 |

파일별 정확한 명령·결과는 [결과 JSON](results-daily.json)에 있다. M9는 지정된 두 preload와 --test-isolation=none으로 실행했다. 뉴스룸 4컷은 --node로 실행했으며 실브라우저 검증은 포함하지 않는다. 공통 fixture 시험이 각 파일 통과 수에 포함되므로 꼬마 행을 office 전체에 중복 합산하지 않는다. weekday 19개는 같은 코드·환경의 앞선 실행을 재사용했고 반복 실행하지 않았다.

### 400ms · 한도 보존

부하 의존인 cafe-rest/lively-v2를 별도로 기록한다. 기존 400ms·warm 3ms assertion을 변경하지 않았다.

- hani-office-cafe-rest.test.mjs: 400ms 성능 assertion 통과

```text
cafe cold plan {
  chairmanPresent: false,
  samples: [ 268.03560000000016, 285.2375000000002, 271.33410000000003 ]
}
cafe cold plan {
  chairmanPresent: true,
  samples: [ 313.9141999999997, 306.8053, 337.953 ]
}
```

- hani-office-lively-v2.test.mjs: 400ms 성능 assertion 통과

```text
obr2 Node performance {
  firstMs: [ 325.8626, 379.2894000000015, 372.42559999999867 ],
  warmMs: 0.5933709999999992
}
```

신규·기타 실패 없음.

### Git 차단 파일 목록

모든 Git 호출은 scratch preload에서 **실행 전에 차단**했다. 원래 assertion은 변경하지 않았으며 차단을 PASS로 표시하지 않는다.

- hani-office-219.test.mjs
- hani-office-actions-216.test.mjs
- hani-office-affinity-274-pins.test.mjs
- hani-office-barista-night-273-pins.test.mjs
- hani-office-bori-stroll.test.mjs
- hani-office-cafe-rest.test.mjs
- hani-office-chairman-patrol-278-pins.test.mjs
- hani-office-companion-homes.test.mjs
- hani-office-companions-276-pins.test.mjs
- hani-office-consult.test.mjs
- hani-office-icons.test.mjs
- hani-office-lively-v2.test.mjs
- hani-office-mascot-label.test.mjs
- hani-office-obr12.test.mjs
- hani-office-obr14.test.mjs
- hani-office-obr15.test.mjs
- hani-office-obr21.test.mjs
- hani-office-obr4.test.mjs
- hani-office-obr6.test.mjs
- hani-office-obr7.test.mjs
- hani-office-obr8.test.mjs
- hani-office-obr9.test.mjs
- hani-office-pet-bori-272-pins.test.mjs
- hani-office-pets-268-pins.test.mjs
- hani-office-pets-bubble.test.mjs
- hani-office-v2-215.test.mjs
- hani-office-xmas-269-pins.test.mjs
- hani-office-xmas.test.mjs
- hani-dev-report-generate.test.mjs
- hani-newsroom-4cut-230.test.mjs

219는 과제에 명시된 기존 실패다. 이번 실행에서는 Git 단계에서 차단돼 그 뒤 기존 실패 assertion은 재현하지 못했다.

## 보존·인계

기존 artifacts 656파일을 착수 바이트로 확인했고, 시험 부산물 4개를 복원·신규 0개를 제거했다. 새 보고 산출물은 이 보고서와 results-daily.json뿐이다. 임시 실행기·로그·원문 사본은 scratch에만 두었고 최종 확인 뒤 삭제했다. runtime 원문·storage/Cloud 및 호출 수 보존 근거는 JSON에 있다. 서버 Edge Function·설정 변경과 배포 순서 의존성은 없다.

실행 경로/DOM fixture(기존 PC1280·390 포함)는 검증했으며 **실브라우저 화면·Android는 미검증**이다. 로컬 표시/cache 2.9.285, UI entry hani-ui-v02992.js?v=2.9.285, 마지막 script hani-launch-greeting.js를 확인했다. 실제 브라우저 JS 로딩·원격/main merge·Pages·Production read-back은 확인하지 않았다. 기능 개발 단계여서 Candidate Freeze/build/HINA/배포 QA는 수행하지 않았다. 새 Candidate의 버전 증가는 배포 담당 서윤 범위다.

서윤의 다음 행동: 위 Git 차단 검사를 허용 환경에서 재검증하고, runtime 1파일·시험/helper 3파일·delta fixture 1개와 보고 산출물을 검토 후 커밋한다. 저장/Cloud/schema/보호 키·내부 버전 변경 승인 요청은 없다. CURRENT/DECISIONS와 별도 인수인계 파일은 과제의 보고서 1개 제한에 따라 수정하지 않고 이 문서에 식별·검증·미검증·다음 행동을 통합했다.

**Notion 미반영:** 현황판·규격 읽기는 성공했으나 insert_content 쓰기가 자동 승인 검토에서 approval policy is never로 거절됐다. 저장/read-back 완료가 아니다. 날짜·담당·지정 branch/HEAD·위 변경과 검증/차단·서윤 인계를 이 원문 링크와 함께 갱신 대기로 남긴다.
