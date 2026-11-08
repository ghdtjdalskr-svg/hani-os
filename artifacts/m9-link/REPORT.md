# 서윤 M9 2단계 연결 · 2026-11-08

Codex 단독 · `hani/m9-stage2-link` · base/HEAD `2bc93683182728877a6b8e543badb330a3312756`. 과제 파일 UTF-8 한글 정상. **UI 구현, 패키징 차단, Edge 차단, 미커밋**. push/merge/버전 변경 없음(표시/cache 2.9.280 유지, 2.9.282는 후속 후보).

- 별도 `extras/seoyun-m9`·`extra-m9.json`, 보관함 호외 구획, 기존 일보 renderer/위임 click/cache 연결. 제목·부제·민지 기자·가상 뉴스·Q&A 3개·보이는 캡션 6개. 아이는 **꼬마 수연·꼬마 수현**, 찬성하는 성인 직원 수연은 기존 표기 유지. 호외에는 생활 집계·라운지·마켓·할 일을 투영하지 않음.
- 기존 특별 카드 이미지에 기념 컷 전체를 `contain/center`로 표시. 기존 archive 위임 click → `HaniOrganizationHub.openPerson('seoyun')` → 기존 상세 dialog 큰 컷. 숨겨진 hub는 기존 회사 소개 경로로 전환 후 열림. 그림 원본은 **개구리 회장님과 서윤의 하이파이브**로 확인해 alt도 일치시킴.
- 정기 1~4호 JSON·그림 바이트와 전체 렌더 HTML 동일. 정기 수·홈·최신호는 정기 목록만 사용. 11/9 00:00 KST에 4호·발행 수4, 다음 정기 번호5 유지. 호외 cache/읽음 분리, 새 저장/Cloud/timer/listener 없음.

| 검증 | 결과 / 근거 |
|---|---|
| 새 전용 시험 | **기능·보존 9 PASS, package 포함 1 FAIL(차단)** · `node --test --test-isolation=none scripts/hani-m9-link.test.mjs` · [로그](targeted.log) |
| 기존 일보 | 실제 수정 소스의 11 검증 그룹 PASS · `node scripts/hani-ilbo-213.test.mjs --unit` |
| 회사 소개 / archive | 실제 수정 소스의 history unit·archive unit PASS. 고정 계약은 exact inverse 외부 preload로도 PASS |
| M9 1단계 / 기존 closure | 외부 exact inverse에서 15/15·3/3 PASS. 기존 assertion 삭제·완화 없음 |
| nav/login | 45개 + base 보호 표면·5개 write/backup 함수 동일 PASS |
| 사무실 | **67파일·717 PASS·Git EPERM 34차단·skip3·그 외 실패0**. 고정 시험 exact inverse 외부 레이어 사용, office runtime 원문 불변. [분석](office-analysis.json)·[명령별 요약](office-summary.json), `office-logs/` |
| syntax / diff | owner/검사/요약 JS/CJS/MJS 8개 `node --check`, `git -c core.whitespace=cr-at-eol diff --check` PASS |
| Edge PC1280×900 / 폰390 | **spawn EPERM**. 호외·카드·상세 PNG 0개, 크롭·가로넘침·실화면·전체 브라우저 저장0은 미검증. [실행 결과](browser.json), 재실행 `node scripts/hani-m9-link.browser.mjs` |

**패키징 미완료:** resolver 161개/missing0이나 목록·새 JSON·그림2개 총4개가 closure 밖. 기존 1~4호도 별도 정적 선반영(#272/#281/#330/#449) 이력이며, 그림2개는 이미 #463에 있음. **새 JSON·목록의 package 포함은 PASS가 아니다.** 게이트·서버·resolver·builder는 변경하지 않고 포함 시험 실패를 유지했다. [경로·과거 근거·다음 담당 결정](PACKAGING.md).

Git staging은 `.git/worktrees/m9-link/index.lock: Permission denied`로 차단되어 새 commit 없음. 원격 GitHub 연결 실패로 최신 main은 미확인. Candidate build/One-Pass/HINA·Production 확인은 미수행. 별도 Edge Function 배포 없음.

Notion은 읽기만 성공했고 저장은 자동 승인 정책 `never`로 거절됐다. 착수·최종 요약 갱신 대기. [작업별 인수인계](../../docs/development-history/handoffs/2026-11-08-m9-link.md).

사무실 재실행 명령: `scripts/hani-office-*.test.mjs` 각 파일에 `node --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none --test-timeout=30000 <파일>` 실행. 중간 fixture 갱신과 겹쳤던 barista-night 1건은 최종 파일로 재실행해 13/13 PASS로 교체했다. 임시 원문 사본 `base/`, `base.zip`은 이 폴더 .gitignore로 commit 대상에서 제외했다.
