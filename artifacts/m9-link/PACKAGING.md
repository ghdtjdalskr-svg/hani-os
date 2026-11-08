# 패키징 조사 · 2026-11-08

- 현재 원본 resolver(수정 없음)의 작업 트리 closure: **161개·missing 0**, 그러나 이번 필수 참조 **4개가 목록 밖**이다. [실측](closure.json). `missing=[]`을 완전성 PASS로 해석하지 않는다.
- 목록 밖: 변경한 `data/hani-ilbo/issues.json`, 새 `data/hani-ilbo/extra-m9.json`, `assets/hani-ilbo/extra-m9-comic.webp`, `assets/character-archive/seoyun-m9-special-cut.webp`.
- 원인: `hani-ilbo.js`의 `json(...)` wrapper와 두 owner의 HTML 문자열 `src`는 resolver 수집 대상이 아니다. manifest를 별도 entrypoint로 추가해도 기존 root 상대 `file`을 manifest 디렉터리에 중복 연결한다. 새 JSON의 root 상대 `image`도 같은 문제다. 단순 파일 추가만으로 계약을 만족한다고 볼 수 없다.

## 기존 1~4호의 경로

Git 원문에서 별도 정적 파일 선반영 이력을 확인했다. 변경 후 seed를 실제 운영에서 다시 조회한 증거는 이번 환경에 없으며, 과거 Git 병합만으로 Pages 검증 완료를 주장하지 않는다.

| 정기호 | 선반영 commit / PR | 변경 범위 |
|---|---|---|
| 1호 | `d3f3721` / #272 | 001 JSON·만화·목록, 제목에 unreferenced 명시 |
| 2호 | `f03677f` / #281 | 002 JSON·만화·목록 |
| 제호 배너 | `48c8f27` / #282 | masthead, 제목에 seed/unreferenced 명시 |
| 3호 | `fec6918` / #330 | 003 JSON·만화·목록 |
| 4호 | `5643d28` / #449 | 004 JSON·만화·목록 |
| 이번 그림 | `2bc9368` / #463 | 호외 만화·기념 컷만 선반영, 런타임 미참조 |

`scripts/hani-release-package.mjs`는 resolver가 수집한 파일만 package에 넣는다. `supabase/functions/hani-deploy-bridge/index.ts`의 기존 모듈 업로드는 main에서 branch를 만들고 supplied files만 갱신한다(1137~1153 부근). 따라서 선반영된 정적 파일은 main에 남지만, **이번 새 JSON과 목록 변경이 자동으로 package에 들어가지는 않는다**. 기존 `scripts/hani-runtime-closure-ilbo.test.mjs`의 3개 검사는 resolver parity/기존 수집 결과를 검증하며, 정기호 JSON·그림 전체의 package 포함 증거는 아니다.

## 인수 조건

배포 담당은 기존 정적 seed 경로로 새 JSON·목록을 반영하고 실제 파일을 확인할지, 별도 승인된 CRITICAL 작업으로 Node/서버 resolver·계약을 보완할지 결정해야 한다. 이번에는 **gate·서버·resolver·package builder를 수정하지 않았다**. 호외 UI만 합쳐 배포하면 새 JSON/목록이 빠질 수 있어 패키지 포함 시험은 실패 상태로 유지했다. Candidate/Production PASS 없음.
