> **남은 blocker:** 릴리스 이력 JSON의 기존 계약 불일치로 추가 회귀 4건이 실패합니다. 수정 전 원문에서도 동일 재현했으며 범위 밖이라 수정하지 않았습니다. Git 원본 검사 37건도 미검증입니다.
>
> **시간대 위험:** 회장 캐릭터가 부재하면 아이도 숨는 기존 정책입니다. 평일 18~22시 자동 재실을 보장하지 않습니다. 활성 재실은 유지하되 기존 10분 비활동/숨김 유예·잠금 처리를 바꾸지 않았습니다.

# kidsb-evening · 평일 방문 18~22시

2026-11-09~10 KST · Codex 단독 개발·자동 시험 · worktree kids-visit-b · 지정 branch hani/kids-visit-pose-b / HEAD 818db42. **구현·지정 시험 완료 / 배포 담당 검토 인계.** Git 명령·커밋·push·merge·배포 없음. 원격 최신성 새 조회 없음.

## 변경·승인 범위

../kidsb-evening-task.md를 UTF-8로 전체 읽었으며 한글이 정상이었습니다. 승인된 시간 변경만 hani-office-live.js:3207의 기존 owner에 적용했습니다.

`const surprise=!weekend&&seconds>=18*3600&&seconds<22*3600;`

운영 파일은 이 한 줄의 숫자 **3바이트만** 바뀌었습니다. 길이와 그 밖의 모든 바이트, 혼재된 CRLF 252개/총 LF 4,705개를 보존했습니다. 인접 주석에 15~19시 설명은 없어 주석은 수정하지 않았습니다. 배포 자산 503개 중 변경은 JS 1개뿐입니다. 표시/cache 2.9.285·저장/Cloud/schema·보호 키·내부 기준 버전·새 timer/listener 변경 0입니다.

시험/fixture 4파일은 daily exact inverse의 새 입력 해시와 유일 치환, 평일 [18:00,22:00) 상수 및 UI 표본을 갱신했습니다. 기존 41바이트 확률 조건 역변환·고정 weekday/B/main pin·변조/중복/부분/EOL/반복 inverse 거절은 유지했습니다. CODEMAP living-office owner는 확인했고 kids anchor 부재는 CODEMAP_MISS로 좁게 검색했습니다. 다른 기능·문서·현황판 원문은 수정하지 않았습니다.

## 지정 위험 확인

- **회장 재실:** 실제 scheduler에 chairmanPresent=true를 넣고 5개 평일의 18~22시 매분 1,200개를 실행했습니다. 회장 누락·아이 누락·불안전 위치 0, 아이 1명 유지입니다. 실제 표본은 4F였습니다. chairmanPresent=false 표본에서는 아이 0명으로 기존 부재 처리를 보존했습니다. 실제 사용자의 저녁 접속을 보장하는 기능을 추가하지 않았습니다.
- **22시 동물 밤 시간:** 21:59:59.999까지 아이 1명/night=false, 22:00:00부터 아이 0명/night=true입니다. 반개구간이므로 겹침이 없습니다. 날짜·수면·주민 day owner는 그대로입니다.
- **18:30 조명·옥상:** Edge 157.0.4341.42, PC1280/모바일390에서 18:00·18:30·19:00·21:59:59.999·22:00의 20장면을 실행했습니다. 18:30 실제 옥상 night-243 배경 전환·B 시트·아이 유지, 22시 숨김, 가로 넘침/JS 오류/저장 호출 0입니다. 캡처 4장을 Codex가 직접 보아 외형·배치·이름표·인사 표시를 확인했습니다. **옥상은 시험에서만 회장 위치를 5F로 주입한 표시 검사이며 실제 야간 옥상 일정의 증거가 아닙니다.** 독립 아린 리뷰·Android 실기기는 미검증입니다. PNG는 임시 폴더에서 검사했고 결과 JSON에 해시·관찰을 보존했습니다.

## 시험

평일 **19/19**: 평일 261일×240분=62,640개 방문 표본, 직전·시작·끝 직전·끝 밀리초 경계, 주말 104일 비교, 시드·인사·지속 슬롯·무저장 검사를 기존 강도로 통과했습니다. 동일한 코드/환경의 이 실행을 전체 집계에 재사용하고 반복 합산하지 않았습니다.

| 범위 | 통과 | Git 차단 | 그 외 실패 | skip |
|---|---:|---:|---:|---:|
| office 전체 72파일 | 787 | 35 | 0 | 3 |
| 추가 11파일 | 78 | 2 | 기존 4 | 0 |
| 전체 83파일 | 865 | 37 | 기존 4 | 3 |

| 지정 기능 | 통과 | Git 차단 | 그 외 실패 |
|---|---:|---:|---:|
| hani-office-kids-weekday.test.mjs | 19 | 0 | 0 |
| hani-office-kids-lively.test.mjs | 15 | 0 | 0 |
| hani-office-kids-merge.test.mjs | 10 | 0 | 0 |
| hani-office-kids-pose-b.test.mjs | 13 | 0 | 0 |
| hani-office-kids-visit.test.mjs | 16 | 0 | 0 |
| hani-pb-chibitoon.test.mjs | 4 | 0 | 1 |
| hani-procrastination-board.test.mjs | 6 | 0 | 0 |
| hani-life-bundle-source.test.mjs | 5 | 0 | 0 |
| hani-study-retry.test.mjs | 26 | 0 | 0 |
| hani-wishlist-quick-add.test.mjs | 7 | 0 | 0 |
| hani-dev-report-generate.test.mjs | 0 | 1 | 0 |
| hani-newsroom-4cut-230.test.mjs | 7 | 1 | 0 |
| hani-newsroom-persona.test.mjs | 4 | 0 | 0 |
| hani-newsroom-285-source.test.mjs | 1 | 0 | 1 |
| hani-release-version-layers.test.mjs | 3 | 0 | 2 |
| hani-seoyun-m9.test.mjs | 15 | 0 | 0 |

꼬마 행은 office 전체의 부분집합입니다. 각 시험이 등록하는 공통 fixture 항목은 해당 파일 통과 수에 포함합니다. 문법 4/4, raw closure 164/누락0, 저장·Cloud·timer/listener 호출 보존 검사도 통과했습니다. 명령·결과·미검증은 [결과 JSON](results-evening.json)에 있습니다. M9는 기존 polish/link 두 preload와 --test-isolation=none으로 **15/15**, 4컷은 --node로 실행했습니다.

### 400ms · 별도 단독 실행

나머지 전체 회귀가 종료된 뒤 두 파일을 순차 실행했고 기존 400ms/warm 3ms assertion을 바꾸지 않았습니다. 성능 항목은 모두 통과했습니다. 두 파일의 Git 원본 비교 각 1건은 위 차단 수에 포함됩니다.

- cafe-rest cold 부재: 273.014 / 276.057 / 274.223ms; 재실: 302.854 / 306.120 / 305.980ms.
- lively-v2 cold: 328.776 / 297.133 / 281.465ms; warm: 0.650ms.

### 기존 실패 4건 · 범위 밖 보존

assets/data/hani-history-releases-v1.json의 착수/현재 SHA256은 동일한 bad8ec62479c9f4d05322c76ec21299d33b7045ebacf0b73e138ee1036d512ff이며, 285 계약의 4859f874…efd01과 다릅니다.

- pb-chibitoon: 1건, 역변환 뒤 변경 목록에 위 이력 JSON이 추가로 남습니다.
- newsroom-285-source: 1건, 이력 JSON의 release-285 입력 해시 불일치.
- release-version-layers: 2건, 전체 바이트/변조 검사가 같은 이력 입력 해시에서 실패합니다.

수정한 5파일의 착수 사본을 **해당 검사 프로세스의 읽기에만** 공급해 세 시험을 재실행했습니다. 물리 worktree는 되돌리지 않았고 같은 8통과/4실패와 실패 이름을 확인했습니다. 원래 assertion·고정 pin·이력 원문은 변경하지 않았습니다. 따라서 이 4건은 PASS가 아니며 배포 담당의 별도 계약 정리가 필요합니다.

### Git 차단 파일 목록

모든 Git 호출은 임시 preload가 실행 전에 차단했습니다. 원본 assertion은 보존했으며 차단을 PASS로 표시하지 않습니다. 지정된 기존 219 실패도 Git 단계에서 먼저 차단되어 원래 assertion은 미재현입니다.

- hani-dev-report-generate.test.mjs
- hani-newsroom-4cut-230.test.mjs
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

## 바이트·복원·인계

- owner SHA256: 변경 전 4eb2dd2a1834b766c712e3aa9553a000191336a66aa02e2f0e50a5aaf5805f6b → 변경 후 1c1493de329fbc4a905dab7689a6d8833375699af5ebb9ca5e31ed94605db850.
- daily → weekday → main exact inverse의 최종 436,700바이트가 bbe71c0 기준 사본과 완전히 같습니다. 양쪽 SHA256: 3c64d0e91bea897d3ee59a3e406a710934b40c2299abb9d9c0e10cd3d6d1fe1d.
- 기존 artifacts 658파일을 확인하고 시험 부산물 JSON 4개를 착수 원문으로 복원했습니다. 새로운 시험 부산물은 0개입니다. 허용 5파일 이외 기존 파일은 모두 착수 바이트와 같습니다. 새 보고 산출물은 이 보고서와 results-evening.json뿐이며 임시 실행기·로그·캡처는 worktree 밖에서 사용 후 정리합니다.
- 서버 Edge Function·설정 변경이나 배포 순서 의존성은 없습니다. Candidate build/HINA·버전 증가·main·Pages·Production read-back은 이번 기능 패치 범위 밖이며 수행하지 않았습니다.

**다음 행동:** 배포 담당이 운영 JS 1개·시험/helper/fixture 4개와 보고서 2개를 검토하고, 기존 이력 계약 실패 4건 및 Git 차단 37건을 허용된 범위·환경에서 재검증한 뒤 공통 열차에 반영합니다. 이 패치를 위한 추가 승인 요청은 없습니다. Git 금지에 따라 커밋·push·PR은 하지 않았습니다. HANDOFF-TEMPLATE의 식별·검증·blocker·다음 행동은 이 문서에 통합했으며 CURRENT/DECISIONS는 보존했습니다.

**Notion 갱신 대기:** 현황판·문법 읽기는 성공했으나 착수 insert_content 쓰기가 자동 승인 검토에서 approval policy is never로 거절됐습니다. 저장/read-back 완료가 아닙니다. 11/10 KST 담당·branch/지정 SHA·변경·검증/기존 실패·Git 차단·다음 행동을 이 보고서 원문과 함께 반영해야 합니다.
