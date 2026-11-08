# 보리 본사 합류

2026-11-07 KST · Codex · `hani/pet-bori-live` · base `5f13d8d794184b35b29fb45e6539fd0d68c08b76`

보리를 네 번째 주민으로 구현했습니다. **미커밋·미push·미merge·미배포**, 표시 버전 **2.9.271 유지**입니다. Notion·`data/`는 편집하지 않았습니다. 자리는 기존 방식대로 office JS 안에 정의했습니다.

- 승인 원본 스프라이트·128/256 썸네일 **3개 byte-exact 복사**. 런타임 closure **155 → 158/160, 누락 0**. 전체 프로필은 추가하지 않았고, 소개 카드의 3x 경로도 256 썸네일을 사용합니다.
- 1F 07–13시·15–다음 07시, 2F 13–15시. 02–07시 공통 수면 외에 15분 중 10분 낮잠, 25–45초 산책 주기·10–14초 출발 휴식·기준 속도 12px/s입니다. 직원 동행 방문 대신 자기 통로의 짧은 산책을 사용하며, 쓰다듬기·하트·세 동물 대화에는 참여합니다.
- 11/2·6·7, 07–22시 2,700회 표본: 보리 노출 **2,699회**, 1F **2,340회(86.7%)**, 수면 **1,800회(66.7%)**. 기존 세 펫의 같은 표본 수면은 0회입니다. 이동 줄이기·화면 밖 정지·혼잡 시 양보·기존 단일 말풍선과 닫기 수정은 유지했습니다.
- 도움봇 **직원 19 + 펫 4 = 23일**, 펫 사이 간격 5·6·6·6일. 제목은 **보리 · 로비 지킴이 리트리버**, 얼굴은 256 썸네일입니다. 직원 명단에는 추가하지 않았습니다.

## 자리

좌표는 지도 가로·세로 대비 %입니다. 논리 좌표는 기존 통로 `(500,330)`을 사용합니다.

| spot id | 층 | 좌표 |
|---|---|---|
| `resident_bori_lobby_a/b` | 1F | (79.5,72) / (81,72) |
| `resident_bori_night_a/b` | 1F | (79.5,72) / (81,72) |
| `resident_bori_lounge_a/b` | 2F | (51,57) / (51,59) |

1F는 라운지 아래·카페 왼쪽 빈 통로입니다. 가구·직원 좌석·다른 펫의 자리·퀸 액자·바리스타·트리/선물 제외와 전체 이동 경로를 검사했습니다. PC 1440/모바일 390의 1F·2F 화면, 12/24 장식 화면, 이름·탭·바깥 탭 닫기를 Edge에서 확인했습니다. 가로 넘침 0, page error 0입니다.

## 탭 대사 10개

1. 어서 와요. 큰 꼬리로 인사할게요.
2. 로비는 제가 느긋하게 지킬게요.
3. 옆에 기대도 괜찮아요, 멍.
4. 햇살이 따뜻해서 눈이 감겨요.
5. 천천히 걸어요. 같이 갈게요.
6. 쓰다듬어 주면 꼬리가 살랑해요.
7. 잠깐 누워서 기다릴게요.
8. 오늘도 무사히 와 줘서 고마워요.
9. 제 옆에서 한숨 돌려요.
10. 졸려도 반가운 건 알아요, 멍.

## 검사

명령: `node scripts/<아래 이름>.test.mjs`. Node v24.22.1. 전체 로그와 개별 실패명은 [test-results.json](test-results.json)에 있습니다. 실패 assertion은 삭제하거나 완화하지 않았습니다. 네 펫 수·프레임 수를 정확히 늘렸고, 기존 세 펫의 야간/동행 조건은 그대로 검사하며 보리 낮잠은 별도 검사합니다. 도움봇 fixture에는 실제 MutationRecord를 전달했습니다.

| 검사 | 결과 |
|---|---|
| `hani-office-pet-bori` | **14 PASS / 0 실패** (기존 loader 검사 6 포함) |
| `hani-helper-bot` | 15 PASS / 기존 배치 조건 4 실패 / 브라우저 옵션 1 skip |
| `hani-office-pets-bubble` | 21 PASS / Git 차단 1 |
| `hani-office-pet-bori-272-pins` | 3 PASS / Git 차단 1 |
| `hani-office-pets-268-pins` | Git 차단 1 (그 앞 exact-pair assertion 실행) |
| `hani-office-xmas-269-pins` | 1 PASS / Git 차단 1 |
| `hani-office-residents` | 42 PASS / G source hash 재핀 대기 7 |
| `hani-office-tlayout` | 11 PASS / source·입력 hash 재핀 대기 2 |
| `hani-office-219` | 시작 시 `spawnSync git EPERM` 차단. main의 기존 contrast 실패는 이번에 재검증하지 못함 |
| runtime JS syntax / closure | 3 PASS / 158개·누락 0 |
| 실제 Edge | PC·폰 1F/2F·대사·닫기·소개 카드·보리 당번 PASS, page error 0 |

도움봇은 수정 전 9 PASS/10 실패/1 skip이었고, 그중 4개 배치 assertion이 최종에도 남습니다(폰 1개, PC 1280/1440/1920 각 1개). 현재 v271 동작과 과거 fixture의 일반 컨트롤 회피/숨김 기대 차이이며, 운영 코드를 바꾸거나 assertion을 완화하지 않았습니다. [baseline-helper.log](baseline-helper.log), [hani-helper-bot.log](hani-helper-bot.log).

272 계층은 **고정 v271 커밋의 JS/CSS SHA-256**을 pin하고 JS 20쌍·CSS 1쌍으로 전체 차이를 재현합니다. 복원은 **272 → 269 → 268** 순서이고, 미등록/중복/누락 편집 거절도 검사했습니다. GitHub connector의 고정 Git blob SHA-1과 로컬 원본이 일치함을 확인했습니다. index/main은 원문 SHA-256 보존, 향후 허용은 정확한 `2.9.272` → `2.9.271` 치환뿐입니다. fixture hash: `f1d60f89f1be17a128a9236e8473d7946feea655f99d9fbe2f09ebb4de68fb1b`.

## 변경 파일·남은 일

- runtime: `hani-office-live.js/.css`, `hani-ui-v02992.js`, `hani-style-08.css`, `hani-organization-hub.js/.css`, `assets/sprites-v3/manifest-v3.json`, `assets/sprites-v3/pet-bori.webp`, `assets/profiles/thumb/hani-profile-bori-{128,256}.webp`.
- 검사: 신규 `scripts/hani-office-pet-bori.test.mjs`, `hani-office-pet-bori-272-source.mjs`, `hani-office-pet-bori-272-pins.test.mjs`, `fixtures/office-pet-bori-272-delta.json`; 수정 `hani-helper-bot.test.mjs`, `hani-office-pets-bubble.test.mjs`, `hani-office-residents.test.mjs`, `hani-office-xmas-269-source.mjs`, `hani-office-xmas-269-pins.test.mjs` (모두 scripts 아래).
- 기록: 이 디렉터리의 baseline·해시·로그·화면·검증 스크립트, `docs/development-history/handoffs/2026-11-07-pet-bori-live.md`.

**서윤 다음 작업:** G/tlayout 2건과 residents-source 연계 7건의 exact hash/소스 계층을 정식 재핀하고 기존 보호 검사를 재실행해야 합니다. pins/말풍선 Git 검사 4건 및 office-219는 Git subprocess 허용 환경에서 재실행해야 합니다. 상세 실패명은 JSON에 보존했습니다.

원격 main은 착수 시 `dab68f3d46da1b7350b8293d18d034eed7c8eb75`(v271 도움봇 후속 시험·보고서)로 기준보다 앞섰습니다. merge/rebase 없이 지정 base를 유지했습니다. 전체 package·Candidate/HINA·Arin 독립 리뷰·Production read-back은 수행하지 않았습니다. 배포 승인을 요청하는 상태가 아닙니다.
