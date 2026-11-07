# 은하 야간 바리스타 Preview

2026-11-07 KST · Codex · **구현·실화면 검증 완료 / 아트·Preview 승인 대기**

- branch `hani/barista-night-live` · base/HEAD·조회 main `03b639bd9d7f9a460c7b2555bb795f41fabde565`. 고정 v272 pin base `c338bdab8589676979f85e1a5626fca2af5b86d8`.
- 이슬 07–19시 / 은하 19–07시 KST. 미소(19–02)·졸음(02–07)·탭 시 3초 커피, 야간 8대사·깨우기 첫 대사 구현. 주간 원문·폰 말풍선 5초·v268 닫기 유지.
- `hani-office-live.js/.css`의 기존 owner 사용. prop layer 바로 앞 persistent span 1개, (1500,610) 120×110, 배우·라벨·말풍선 아래, pointer-events:none, 정적 프레임.
- 유일한 새 runtime 파일: `assets/office-season/barista-night.webp`. 아트 원본 byte-exact **34,896B**, closure **158→159/160·누락0**. 도움봇은 바리스타 언급이 없어 미수정.
- **273→272→269→268** literal-pair/full-hash pin 추가(JS 5쌍·CSS 1쌍). [고정 Git blob 증명](fixed-release-evidence.json). 273은 pin 계층 이름이며 표시·cache는 **2.9.272 유지**.

## 검증

명령: `node scripts/hani-office-<각 파일>.test.mjs`, Node v24.22.1. **54파일 전부 실행, 27명령 성공·27 비정상 종료**. 최종 유효 집계 **551 PASS / 32 FAIL / 3 SKIP**, 별도 시작 차단 6건. [전체 명령·실패명](test-summary.json), [원래 로그](tests/).

- 전용 night **13/13**, 기존 barista **10/10**, bubble-close **17/17**, 보리 **14/14**, props **11/11** PASS. 273 pins **4 PASS·Git 차단1**.
- 남은 미완료 38건: **spawnSync git EPERM 차단24**(시작 차단6 포함) + **G/tlayout·residents-source 재핀14**. 서윤 후속 담당. 219의 알려진 contrast 실패는 앞선 Git 차단으로 이번 재현 불가. assertion 삭제·완화 없음.
- 기존 생성 횟수 검사는 strict273 복원 후 원래 assertion 유지. pets 보존 2항목만 수정 후 targeted 재실행 **2/2 PASS**; pin 최종 재실행은 [로그](273-final-pins.log), [보존 재실행](pets-preservation-final.log).
- syntax **10/10**. 직원·펫 모델 원문 동일, data/14개 포함 보호 **26파일 바이트 동일**. storage/Cloud/schema write·새 timer loop·listener 없음. [보존·환경 근거](verification.json).
- Edge 실제 office owner/CSS/art 격리 Preview **6조건 PASS**, 깨우기·프레임 복귀·바깥 탭 닫기 확인. page error·가로 넘침·저장 쓰기 **0**. 전체 앱 로그인/운영 검증과 구분. [브라우저 결과](browser-results.json), [재현 스크립트](browser-check.mjs).

| KST | 1280×900 | 390×844 |
|---|---|---|
| 12:00 | [낮](1f-1200-1280x900.png) | [낮](1f-1200-390x844.png) |
| 21:00 | [미소](1f-2100-1280x900.png) | [미소](1f-2100-390x844.png) |
| 03:00 | [졸음](1f-0300-1280x900.png) | [졸음](1f-0300-390x844.png) |

[깨우기 PC](wake-1280x900.png) · [깨우기 폰](wake-390x844.png)

**미커밋·미push·미merge·미배포**, 버전/Notion/data 편집 없음. package/Candidate/HINA·독립 Arin·Production read-back 미실행. 다음은 서윤 재핀·Git 허용 환경 재검사와 성민 대표님 아트·Preview 확인이며, 배포 승인을 요청하는 단계는 아닙니다. [인수인계](../../docs/development-history/handoffs/2026-11-07-barista-night-live.md).
