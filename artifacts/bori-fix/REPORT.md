# 보리 산책 보정

## 작업 식별
- Codex / 2026-11-08 KST / NORMAL / 개발·검증 완료, 커밋 차단. 과제 UTF-8 한글 정상.
- `hani/bori-stroll` / worktree `bori-stroll` / base·HEAD `02468e1`. 원격 main `f1a457f` 일치(GitHub compare). 표시/cache **2.9.279 유지**, 로컬 마지막 UI `hani-ui-v02992.js?v=2.9.279`. [정확한 SHA](baseline.json).
- 승인 범위: 낮 리듬 보정·기존 시험/역변환 계약 갱신·로컬 새 커밋. **push·merge·버전 변경 없음**. runtime `6085c14f` / 계약 `c7e8675a`.

## 결과와 증거
- 기존 `residentSnapshot → petMotion → residentLife → updateResidents`에서 낮 15분 중 6분 낮잠, 앉기·서기·느린 짧은 이동 복원. 정기 산책은 기존 속도 유지. 변경은 office-live와 기존 산책 시험/source/fixture 4파일. CODEMAP에 보리 anchor가 없어 좁은 실제 검색으로 확인.
- **Edge 직접 실측**: 화요일 11/03 KST 10시, 연속40배속·1초마다90회·1F. 앞 두 행은 과제의 서윤 실측이며 이번에 재측정한 값은 마지막 행.

| 대상 | sleep | sitting | standing | walking |
|---|---:|---:|---:|---:|
| 기존 main (서윤) | 60 | 21 | 8 | 1 |
| 1차 02468e1 (서윤) | 86 | 3 | 1 | 0 |
| 이번 보정 (직접) | 34 (37.8%) | 33 | 12 | 11 (12.2%) |

- 앉기+서기 **50.0%**, 숨김0·오류0·저장0. 1F 실제 걷기 및 PC/390px 2F 산책 걷기 화면 확인. [Edge 원자료·PNG6장](browser.json).
- 5일×1,440분: 낮 수면 **36.1~37.1%**, 앉기/서기 **48.3~51.9%**, 걷기 **11.0~15.0%**. 산책18~21회/일·35~40분 간격·136~233초, 밤 산책0·전 시간 펫/동행/남매 겹침0. 평일·주말41회 산책×0.5초 검사도 통과. [매분](daily-evidence.json) · [정밀](tour-evidence.json) · [실제 DOM 90회](dom-40x.json).
- 전용 **14/14 PASS**, 기존 office 전체+helper-bot+fun-chat 포함 **68파일: 799 PASS·기존 실패1·skip5**. 실패는 이름표 대비 검사(219), 수정 전 기준선에서도 동일 재현. 신규 실패0. [전체 결과](final-validation.json) · [기준선 실패](baseline-219.log).
- cafe-rest/lively-v2 **단독 각3/3 PASS**. 기존 cold best-of-3<400ms·warm<3ms 유지. cold best268.2~310.9ms, warm0.737~0.765ms. syntax3파일·diff 검사 PASS. 환경: Windows/Node24.22.1/실제 Edge headless. [성능](performance-isolated.json).
- 278/companion-homes 하위 계약·assertion 원문 보존. 최종17쌍 exact inverse가 f1a457f 전체 바이트 복원, 부분·중복·무관 변경 거부 PASS. 1차의 하루수면85% 초과 기대값은 요청한 낮 목표로 수정하고, 산책 마지막1초 귀가·수면과 종료 후 기본 리듬 복귀 검증.
- index/main/CSS/manifest/일정/공간8파일 동일, closure161·누락0. `free/residentSafe/usedStops`, 2F 병아리 분리·단일 bubble 유지. 새 runtime파일·timer/listener·저장/Cloud/schema 변경0. 시험 생성 공통4파일은 근거 보관 후 원복. [보존](proof.json).
- 실행: `node --test scripts/hani-office-bori-stroll.test.mjs`; `node artifacts/bori-fix/run-tests.mjs`; `node artifacts/bori-fix/performance.mjs performance-isolated`; `node artifacts/bori-fix/browser.mjs`.

## 다음 담당에게
- 실제 `git add`가 공유 Git의 `index.lock: Permission denied`로 거절되어 **미커밋**. [오류](commit-attempt.log). 다음은 권한 있는 환경에서 diff·근거 확인 후 로컬 커밋. 실제 로그인/Android·독립 아린/HINA·Candidate·main/Pages/운영 read-back은 미수행, 이번 배포 승인 없음.
- Notion append는 **자동 승인 검토의 `approval policy never` 거절**로 미반영. 이 보고서의 목적·변경·검증·커밋 차단·다음 행동 및 링크를 현황판에 갱신 대기. CURRENT에는 확인된 결과만 추가.
