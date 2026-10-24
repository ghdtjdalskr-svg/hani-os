# Asset A/B preview-fixture 출처와 생성 방법

- Git 추적 원본이 아니다. 현재 HEAD와 `origin/hani/asset-intake-v2`(`3409eb1d86d839fda6ba4a2f09d63294724ecb96`)의 `git ls-tree`, 해당 경로의 `git log --all`, 원본 worktree의 `git ls-files --stage`에 파일이 없다. 따라서 **파일 commit/blob SHA 없음**.
- 실제 로컬 원본: `C:/Users/홍성민/Documents/HANI_OS_DEV_CLAUDE/intake-v2/artifacts/asset-intake-v2/preview-fixture.html`.
- 파일 크기 5,305 bytes / SHA-256 `c21c46d8f45dde5b0a2a52f169da435542982e4da6f403e99640e8793ad5c7ad`.
- `git -C ../intake-v2 status --short --untracked-files=all -- artifacts/asset-intake-v2/preview-fixture.html` 결과 `??`. 다른 worktree는 읽기만 했다.
- 근거: 원본 worktree의 `artifacts/asset-intake-v2/README.md`, Git 추적 인수인계 `docs/development-history/handoffs/2026-10-24-asset-intake-v2-AB.md`(위 branch SHA). 두 문서가 합성 fixture 준비를 기록한다.
- 확인한 branch의 scripts/관련 문서에는 생성 스크립트가 없으며, `git grep preview-fixture`는 browser runner와 인수인계만 가리킨다. `git show ...:artifacts/.../preview-fixture.html`로 복원할 수 없다.

원본은 합성 state·throw하는 save·가짜 agentApi/catalog를 정의하고, 실제 `hani-asset-update-v1.js`의 run → normalize → merge → resolve → render/edit를 실행한다. `?case=normal|ambiguous`, `body[data-ready=true]`, `writes`, `before`를 browser runner에 제공한다. 이 조사에서는 생성·서버 시작·브라우저 실행을 하지 않았다.

**현재 열차에서 준비하는 방법**(배포 담당 실행용): 로컬 원본을 열차의 같은 상대 경로에 복사한 뒤, 현재 asset 모듈이 요구하는 `parseKoreanNumber`를 그 모듈보다 먼저 주입한다. 원본에는 이 함수가 없어 복사만 하면 `ReferenceError`가 날 수 있다. 전체 `hani-main.js`를 실행할 필요는 없다.

저장소 루트 PowerShell에서:

```powershell
New-Item -ItemType Directory -Force artifacts/asset-intake-v2 | Out-Null
Copy-Item -LiteralPath ../intake-v2/artifacts/asset-intake-v2/preview-fixture.html -Destination artifacts/asset-intake-v2/preview-fixture.html
@'
const fs=require('node:fs');
const support=require('./scripts/qa-1st-test-support.cjs');
const file='artifacts/asset-intake-v2/preview-fixture.html';
const marker='<script src="/hani-asset-update-v1.js"></script>';
const html=fs.readFileSync(file,'utf8');
if(html.split(marker).length!==2)throw Error('Expected one asset script');
const helper=support.functionCode('parseKoreanNumber');
fs.writeFileSync(file,html.replace(marker,()=>'<script>'+helper+'</script>'+marker));
'@ | node
```

그 후 저장소 루트의 정적 서버를 `127.0.0.1:4173`에 두고 기존 `scripts/hani-asset-intake-v2-AB.browser.mjs <playwright/index.mjs> <browser.exe>`를 실행하는 순서다. 위 방법은 생성 절차 안내이며 실제 브라우저 검증 PASS가 아니다. 최종 HTML 해시는 함수 주입으로 원본 해시와 달라진다.
