# tooling-299 · 2.9.299 배포 후속 시험 층

2026-11-14 KST · 도연/Codex · 전달 branch `hani/tooling-299`, 고정 base `1881888a2ca970ab86adda9b193a90256027be1c`(#515). Git·원격 새 조회·Edge 실행 없음. 고정 저장소 object는 기존 읽기 전용 evidence reader로 identity 검증.

- **층:** 299 version/history → 디자인2 → 298 → 도우미 끄기 → 297 → 치비3 → 296 → 디자인1 → 295 이하. 299 행은 index.html 60토큰·hani-main.js 1토큰·history 완전 메타데이터 1편집만 exact inverse. CSS는 299의 frozen feature이며 원래 delta/source 무변경.
- **변경 파일:** `scripts/fixtures/release-version-layers.json`, `scripts/hani-release-version-layers.cjs`; 새 `scripts/hani-release-299-{source,preload}.cjs`, `scripts/hani-release-299.test.mjs`; 새 `scripts/hani-design-polish-2-main299-input.cjs`/`scripts/fixtures/design-polish-2-main299-input.json`/`scripts/hani-release-298-input.cjs`; 기존 design2 preload·main297/main298 input의 바깥 입력 연결, release298 시험의 import 2곳만. `artifacts/design-polish-2/tooling299-{prepare.cjs,plan.mjs,run.ps1,output.cjs,git-tests.json}`, 본 보고서와 작업 인수인계·CURRENT.
- **검증 완료:** 지정 비Git **96파일 / 968PASS / 기존7FAIL / skip4**, 새 회귀0(누락·중복0). 도우미 2파일을 뺀 본 회귀 **94파일 / 940PASS / 기존 exam 오류1 / skip2**; 도우미 기존 **25PASS·4FAIL + 3PASS·2FAIL**은 기준 입력과 실패 이름·통계·종료 코드 동일. exam은 기준·현재 모두 `ReferenceError: renderChibiNote is not defined`. 사무실 **46파일·610PASS**, tooling297 범위 **81파일·868PASS**, 새299 **7/7**. [집계](tooling299-local/test-summary.json)·[보존 감사](tooling299-local/preservation-audit.json). 원래 실패 목록은 수정·완화하지 않음.
- **보존:** 기존 fixture 118개·하위 manifest 전체 바이트·기존 시험 319개 단언/숫자/hash·운영 파일 513개·`.gitignore` 보존. 새299 7/7 및 독립 main299 원문/전체 runtime closure 173파일 검증, 각 하위 closure `173→173→173→172→172→171→168→164`, 누락0. JS/PowerShell syntax 14개 통과.
- **인계:** Git27개는 [목록](tooling299-git-tests.json)만, Edge/화면·Preview·commit/push·main/Pages/Production read-back 미실행. 버전 증가 N/A(시험·개발도구·문서 전용), 서버 동반 배포 없음. Notion 쓰기는 자동 승인 검토의 `approval policy is never`로 거절되어 [인수인계](../../docs/development-history/handoffs/2026-11-14-tooling-299.md)에 갱신 대기 보존.
- **출력:** 로그·snapshot·생성 JSON은 전부 `tooling299-local/` 안에 저장. 서윤은 이 폴더 전체를 commit에서 제외(`.gitignore` 변경 없음).

서윤 실행 명령(개별 시험은 실행기가 매번 별도 Node process로 수행):

```powershell
& artifacts/design-polish-2/tooling299-run.ps1
& artifacts/design-polish-2/tooling299-run.ps1 -Phase baseline
node artifacts/design-polish-2/tooling299-plan.mjs --collect
node artifacts/design-polish-2/tooling299-prepare.cjs --audit
# 이 담당이 실행하지 않은 Git 시험 27개
& artifacts/design-polish-2/tooling299-run.ps1 -GitOnly -AllowProcesses
```

4분할 재실행 시 `-Shard 0 -Shards 4`부터 `-Shard 3 -Shards 4`까지 모두 실행한 뒤 collect. 실행기가 분할 수를 기록하며 collect는 누락·중복을 검사합니다.
