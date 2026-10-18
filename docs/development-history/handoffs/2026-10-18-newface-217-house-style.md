# newface-217 · 기존 앨범 화풍 맞춤

## 작업 식별

- 갱신: 2026-10-18 KST / 도연(Codex), 단일 Agent.
- 상태: LIGHT 구현·targeted 검증 완료 / 성민 대표님 미술 검토 대기. 대표님 compare.png 피드백에 따른 화풍 보정.
- branch/worktree: `hani/newface-217` / `newface217`.
- 시작 HEAD/base: `0b49e86f4a8887b52c3edec9187d60e131b3ed2e`.
- 범위: 소유한 다온/윤슬 v2 초상화 및 thumbs, 수아 id 화풍 재검토 및 thumbs, compare-album.png, 작업별 근거/인수인계. 이전 untracked artifacts/newface-217 전체 보존.
- 승인: 대표님 명시 요청의 재생성·비교·commit 시도. 원본/스프라이트/runtime/버전/Storage/Cloud 변경, main merge·배포 승인 없음.
- CODEMAP: living-office owner 확인. 초상화 제작·album contact sheet는 CODEMAP_MISS; 이전 인수인계와 build-assets.cjs, hani-newface-217.test.mjs에서 기존 export/검증 경로 확인.
- 기준선: 로컬 origin/main 및 GitHub connector main `eea49dbe41b2766715b1c5304e540829a71160a8` 확인. git ls-remote는 proxy 접속 실패. GitHub main/index는 표시 v2.9.216 / 마지막 UI JS hani-ai-budget.js?v=2.9.216, 지정 worktree는 v2.9.215. 지정 branch 유지, merge/rebase 없음. 이미지 전용 작업이라 런타임 충돌 수정 불필요, 열차 담당이 최신 main에 통합해야 함. 실제 운영 표시·JS 로딩은 미검증.

## 결과와 증거

- 내장 image_gen 사용(CLI/API fallback 없음). 기존 지은·나은·히나·민지·수연 5개를 직접 시각 확인. 도구 최대 5경로 제한으로 **지은·나은·민지·수연 4개 원본 + 수정 대상 1개**를 모든 실제 호출에 전달. 원본 4개는 화풍 권위, 대상 1개는 인물 정체성 참조로 구분.
- 유지할 정체성: 다온 흑발 일자앞머리 단발/안경 없음/네이비 핀스트라이프/정면/위험 태블릿. 윤슬 밤색 옆땋기+리본/얇은 둥근 안경/주근깨/크림 카디건/책/밝은 기울기.
- 수아 기존·id 직접 비교: 동일한 부드러운 음영, 눈/홍조, 네이비 의상·파란 스카프와 흐린 푸른 배경이 유지됨. 재생성 불필요 판단, id 원화 유지/썸네일 재생성.
- 맞춘 요소: 따뜻한 복숭아빛 피부와 분홍 홍조, 눈동자·작은 캐치라이트·속눈썹 선, 부드러운 얼굴/목/옷 음영, 머리카락의 넓게 묶은 채색과 중간 굵기 윤곽선, 기존 앨범의 절제된 채도와 따뜻한 색온도. 다온 평면 배경은 부드러운 청회색 중심광/비네트, 윤슬 강한 야외 보케는 차분한 세이지 회색 중심광/비네트로 교체. 명찰은 아이보리 가로 사각+얇은 회색 테두리+남색 한글, 화면 오른쪽 가슴 위치로 통일. 정사각 상반신 crop·정수리 여백·프레임 안 얼굴 크기를 기존과 맞춤.
- 다온 첫 생성의 갈색 기운은 추가 image_gen 호출로 흑색/차콜 하이라이트로 교정. 정면 자세·일자앞머리·안경 없음·네이비 핀스트라이프·위험 태블릿 보존. 윤슬의 밤색 긴 옆땋기/민트 리본·둥근 얇은 안경·주근깨·크림 카디건·책3권·밝은 반대 방향 기울기 보존.
- 변경 파일: `assets/profiles/hani-profile-daon-v2.webp`, `hani-profile-yoonseul-v2.webp` (720×720), 두 사람 및 수아 id의 `assets/profiles/thumb/*-{128,256}.webp` 6개. 수아 id 720 원화, 모든 live 원본 및 스프라이트는 보존. 썸네일은 추가 sharpen 없이 최종720에서 Lanczos downsample.
- 비교판: [compare-album.png](../../../artifacts/newface-217/compare-album.png), 2160×792, 2행×6칸. 기존8명(지은·나은·히나·민지·수연·수아·아린·유리)+다온v2·윤슬v2·수아id 모두 **360×360 동일 배율**, 마지막칸은 설명. 이전 compare.png/sua-compare.png 등 모든 이전 untracked 산출물은 그대로 보존하므로 새 판정을 위해 compare-album.png를 사용.
- 프롬프트 원문/참조: [house-style-prompts.json](../../../artifacts/newface-217/house-style-prompts.json). 생성 원화 경로/기계적 export: [build-house-style.cjs](../../../artifacts/newface-217/build-house-style.cjs). 최종 파일 SHA256/치수/용량/비교 배치/보존173개 목록: [house-style-export.json](../../../artifacts/newface-217/house-style-export.json), 변경 전 hash: [house-style-before.json](../../../artifacts/newface-217/house-style-before.json).

### 검증

- `node artifacts/newface-217/build-house-style.cjs`: PASS. 720/128/256 실디코딩·기존 용량 예산, 11명 동일 크기 비교판, 수정 허용8파일 외 **기존 이미지·thumbs·스프라이트·manifest·runtime·이전 artifacts 173파일 바이트 동일**. Fontconfig cache 쓰기 경고는 있으나 PNG export 및 한글 표시 직접 확인.
- 기존 `scripts/hani-newface-217.test.mjs`: PASS 5그룹/11자산. 실제 registry/앨범/명부·avatar renderer와 sprite loader/fallback, planned 비활성, 실디코딩/치수/용량/alpha 확인. Node stdin에서 fs.writeFileSync의 **리포트 목적지만** house-style-validation.json으로 치환 후 기존 테스트 import; 검사 로직 변경 없음. 기존 validation.json은 보존. 새 결과: [house-style-validation.json](../../../artifacts/newface-217/house-style-validation.json).
- `node --check artifacts/newface-217/build-house-style.cjs` 및 `git -c core.whitespace=cr-at-eol diff --check`: PASS.
- 최종 WebP로 만든 비교판 직접 시각 확인: 기존 앨범과 선·피부·눈·명찰·배경이 가까워지고 새 인물 정체성 유지. 독립 아린/HINA 검토 또는 대표님 승인으로 보고하지 않음.
- JS/DOM/event 변경 없음: 관련 runtime byte-identical. Storage/Cloud/schema/버전/cache 변경 없음. Candidate build·One-Pass·HINA·운영 검증은 기능 담당 이미지 패치 단계 N/A, 열차에서 필요.
- 브라우저 실화면은 재실행하지 않음(이전 Edge spawn EPERM 상태). 실제 카드 crop·모바일·성민 대표님 미술 승인·main/Pages/운영 read-back 미검증.

## 다음 담당에게

- 먼저 읽을 파일: 본 문서, 기존 2026-10-18-newface-217.md, compare-album.png(생성 예정).
- 다음 한 가지 행동: 대표님이 compare-album.png에서 기존8명과 신규3명의 일관성을 판단한 후 열차 담당에게 최종 자산 인계. 기존 newface 작업의 runtime 연결과 sprite/manifest 인수인계는 이전 문서 참조.
- 미검증: 브라우저·미술 승인·Candidate/HINA·main·Pages·운영 read-back. 기능 담당 단계에서 배포 없음.
- 데이터·Storage·Cloud·schema 영향 없음. 버전/캐시 변경 없음.
- 서버 Edge Function·설정 및 배포 순서 N/A. main/배포 승인 없음.
- CURRENT에 새 화풍 보정 결과와 비교판/본 문서 링크 추가, DECISIONS 수정 없음.

## Git / Notion

- **미커밋·미push**. 작업8이미지+이번 비교판/근거/문서만 지정한 `git add -- ...` 시도 → `C:/Users/홍성민/Documents/HANI_OS_DEV/.git/worktrees/newface217/index.lock: Permission denied`. stage 실패로 commit 실행 불가. 시작 HEAD `0b49e86` 유지, 권한 우회/다른 worktree 변경 없음. 대표님 지시대로 이번 수정과 이전 untracked artifacts 전부 현재 worktree에 보존. 이전 파일을 포함한 광범위 stage 없음.
- Notion 기존 작업 카드 https://app.notion.com/p/3fdc52757074816892f7f0adddd2ebe5 fetch 성공. 진행 append는 자동 승인 검토 `MCP tool call requires approval, but approval policy is never` 거절. 재시도·우회 없음, 갱신 완료 아님.
- Notion 반영 대기: 2026-10-18 KST / 도연 / hani/newface-217·base0b49e86 / 기존4원본 화풍 참조로 다온·윤슬 재생성 및 흑발 보정 / 수아id 원본 비교 후 유지 / 새thumb6·기존8+신규3 2행 비교 완료 / 173파일 보존·5그룹/11자산 targeted PASS / 실제브라우저·미술승인·열차 gate·운영 미검증 / 버전·Storage·Cloud·runtime 보존 / 다음 compare-album.png 대표님 미술 확인 후 열차 인계. commit 결과는 아래 기록을 함께 반영.
