# saveguard-287 · 저장 안전장치와 tooling-286 시험 연결

## 작업 식별

- 담당: Codex / KST 2026-11-11. 상태: 구현·지정 시험 실행 완료, Git 기반 검사와 커밋은 서윤 인계.
- worktree: audit-safe / branch: hani/audit-safety-284 / base·로컬 HEAD: 7a44b911adf4d06643f0cf315ff7285acb55b3f0. 미커밋.
- 로컬 origin/main: 752593ac0432b77e2b347e11597ac904ca028003. HEAD의 두 번째 parent와 같음을 참조·commit object 읽기로 확인. Git 금지로 원격 최신성 새 조회 없음.
- 승인 근거: ../saveguard-287-task.md 전체 UTF-8 정상 확인. 저장 안전장치 Preview·2.9.287 배포 승인 명시. 이 과제는 런타임 수정·Git 명령·commit·배포를 수행하지 않는 범위.
- CODEMAP_MISS: 저장 안전장치/286 시험 adapter anchor 없음. 기존 시험 owner·fixed fixture와 tooling-286 보고서로 좁게 fallback.

## 변경과 보존

- scripts/hani-save-guard-source.cjs: 기존 frozen 외층 edit 중 286 버전 edit 하나를 유지하는 exact inverse 추가. 입력 전체 SHA256·각 edit의 원문·출력의 독립 286 SHA256을 모두 검사한다. 기존 284/285 투영과 guard-patch-only 경로 유지.
- scripts/hani-release-version-layers.cjs: 저장 안전장치 외층 → 286 → 하위 버전/feature 순서로 연결. 미래 버전 inverse가 guarded 286 입력을 중간에 노출하는 경우도 같은 exact 경로로 처리.
- scripts/hani-office-kids-286-source.test.mjs, scripts/hani-office-kids-visit.test.mjs, scripts/hani-office-staff-chat.test.mjs, scripts/hani-release-version-layers.test.mjs: 해당 고정 경계의 입력만 연결. 기존 assertion 본문은 입력 plumbing을 역으로 제거하면 수정 전과 바이트 동일(4/4). 버전 시험에 Buffer·전체 SHA·EOL/drift·부분/중복/재역변환 거부·미래 버전 합성 회귀 1건 추가.
- 기존 fixture와 hash pin 변경 0. assertion 삭제·완화 0. 런타임 변경 0. 보호 키·내부 버전·storage/Cloud/schema/migration 변경 0.
- hani-main.js SHA256: 9e672c5d5926c5ea384ede9dab9f4c1e3e3e27a91b0eb2839e0e14b704bded4d. 착수 바이트 동일, CRLF 5,310개·단독 LF 3,624개 유지.

## 실행한 검증

환경: Windows PowerShell / Node v24.20.0. 자식 test worker의 spawn EPERM을 피하도록 --test-isolation=none 사용. 실제 Git 실행을 막는 외부 임시 no-git.cjs를 require했으며 Git 의존 assertion은 차단으로 별도 집계했다. 런타임·assertion 대체 없음. 파일별 독립 Node process, 독립 출력 파일의 office 시험만 최대 3개 병렬 실행, 400ms 성능 시험은 마지막에 단독 실행.

기본 명령: node --require <외부 임시>/no-git.cjs --test --test-isolation=none [--test-reporter=tap] scripts/<시험 파일>.

| 검사 | 결과 |
|---|---|
| 실패 대상 286-source / kids-visit / staff-chat / release-version-layers | 3/3 · 16/16 · 17/17 · 6/6 PASS |
| save-guard | 10/10 PASS: 실제 raw 안전 동작, 기존 inverse 포함 |
| 생활 묶음 / pb-chibitoon / procrastination | 5/5 · 5/5 · 6/6 PASS |
| study-retry / wishlist | 26/26 · 7/7 PASS |
| newsroom 285 / persona | 2/2 · 4/4 PASS |
| newsroom 4컷 (--node) | 7 PASS · 마지막 중복 id 기준본 비교 1건 Git 차단; 전체 PASS 아님 |
| dev-report | 앞 4그룹 실행 후 Git provenance에서 차단; 최종 10그룹 미완료 |
| 지정 seoyun M9 | 15/15 PASS |
| office 전체 73파일 | 828건: 790 PASS · 35 Git 차단 · 3 skip · Git 외 실패 0 |
| 추가 building 4파일 | 26 PASS · 1 skip · 아래 2건 미해결/미검증 |
| cafe-rest / lively-v2 성능 | 기존 400ms 제한 PASS. cafe absent/present 최소 약 268/318ms. 파일 내 별도 Git 검사는 차단으로 유지 |
| 변경한 JS 6파일 syntax | 6/6 PASS |

M9 정확한 명령: node --require <외부 임시>/no-git.cjs --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none --test-reporter=tap scripts/hani-seoyun-m9.test.mjs.

office 열거 범위는 scripts/hani-office*.test.mjs 전부다. 추가로 hani-building*.test.mjs 4개를 실행했다. 전체 77파일 857건의 assertion 결과는 816 PASS / 35 Git 차단 / 기타 2 / skip 4다. Windows Start-Process의 일부 종료코드 수집값이 null이어서 runner의 FAIL 문자열로 판정하지 않고, 완결 TAP/spec assertion 집계와 별도 exit 기록으로 정리했다.

추가 building 잔여:
- hani-building-206.test.mjs: 기존 3F 이미지 215 기대/218 실제 불일치 1건. tooling-286 기존 기록과 같고 관련 시험·art-map·런타임 바이트 변경 없음.
- hani-building-206-safety.test.mjs: 별도 baseline 폴더 인자/환경변수 누락으로 실행 전 차단 1건. 저장 안전성 PASS로 계산하지 않았다. 이 보조 시험은 baseline 지정과 Git 허용 환경에서 서윤 재검증 필요.
- 219는 원래 실패라고 전달됐으나 이 환경에서는 앞선 Git 기준본 조회에서 차단되어 해당 기존 assertion을 새로 재현하지 못했다.

## 부산물·인수인계

- 착수 파일 1,993개 전부 존재·해시 재확인. 변경은 위 시험/도구 6개뿐이며 새 저장소 보고서는 이 REPORT-287.md 하나다.
- 시험이 변경한 JSON 4개 원문 바이트 복원: artifacts/office-behavior/obr16-layout-node.json, obr17-layout-node.json, obr19-layout-node.json 및 artifacts/office-drama/reachability.json.
- artifacts/newsroom-4cut-230·기타 artifacts·qa-evidence 원본 해시 동일. 새 PNG 0, 삭제할 신규 시험 부산물 0. 임시 폴더·로그·백업은 worktree 밖: C:/Users/홍성민/AppData/Local/Temp/hani-saveguard-287-6qZqWh.
- Preview/화면·Android·실계정·Production read-back 미실행. UI/런타임을 바꾸지 않는 tooling 과제로 runtime build·버전 증가·배포 QA N/A. 파일 선언은 2.9.286 및 마지막 UI hani-ui-v02992.js?v=2.9.286 유지이며 실제 화면 확인으로 주장하지 않는다.
- main merge / Pages / 최신 JS 실제 로딩 / 운영 기능 read-back: 모두 이번 과제에서 미수행. Git·commit·push·merge·배포 0.
- 다음 담당(서윤): 이 보고서와 six-file 변경을 검토 → Git 의존 office/뉴스룸/개발보고서 및 baseline 지정 building safety 재검증 → 담당 범위에서 커밋 → 기존 승인 범위와 287 Candidate 절차로 진행. 알려진 3F 기대값 문제를 이 수정의 PASS로 덮지 않는다.
- Notion 갱신 대기: 현황판 fetch 성공, 착수 insert_content는 자동 승인 검토에서 “MCP tool call requires approval, but approval policy is never”로 거절. 저장·read-back 완료로 보고하지 않는다. 이 보고서의 branch/base·시험 결과·차단·다음 행동을 담당자가 현황판에 반영해야 한다. 별도 CURRENT/인수인계 파일은 ‘보고서 하나’ 지시에 따라 추가하지 않았다.
