# 2.9.292·293 후속 시험 층 · 도연 / Codex · 2026-11-13 KST

시험 층 정리 완료, Git·브라우저 검증은 서윤 인계. 기준 `hani/tooling-293` / `9d6ecdd389186e467143f5dde05d14cfae67042d` (HEAD/ref 파일 읽기로 일치 확인).
Git 명령·Edge·운영 파일 수정·버전 증가·commit/push/merge·배포 없음. 원격 최신성 미확인.

## 변경과 층 구조

- `scripts/fixtures/release-version-layers.json`: 293 행만 앞에 추가. index/main 버전 및 293 연혁 추가·292 source.commit/subject 채움의 exact inverse.
- `scripts/hani-chibi-pack-1-source.cjs`: 새 293 바깥 버전만 제거하는 읽기 helper. 기존 치비 restore·fixture·hash 보존.
- `scripts/hani-release-version-layers.cjs`: 순서 설명 갱신. 실제 합성은 기존 manifest dispatcher 재사용.
- 치비 기본·layers 시험: 기존 단언 앞에서 293 버전만 제거. release-version-layers 시험: raw reader로 모든 층을 검증하도록 preload 연결 제거. assertion 삭제·완화·숫자/hash 교체 없음.
- 새 `hani-chibi-pack-1-release293.test.mjs`: 독립 객체 비교·Buffer·변조 거부·#499 exact inverse 증명 3개.
- `hani-tooling-293-deny-process.cjs`, `tool293-run.ps1`, `tool293-pre499.cjs`: Git·브라우저 실행 차단, 파일별 기본 실행, 213ffc8 원문 대조 실행 도구. 차단 결과를 PASS로 바꾸지 않음.

**바깥 → 안:** `293 version/history → frozen 치비 inverse → 292 version/history + 사무실 inverse → 291 version + contrast → 290 version + 이음 → 기존 289/288 이하`.

#499의 office diff는 이미 가져온 frozen `release-292-delta.json`과 입력·출력·편집 조각이 정확히 같아 재사용했다. 새 중복 fixture나 event/renderer 층을 만들지 않았다. M9 preload의 치비 → 이음 경로도 유지하며 새 바깥 층을 통과한다.

## 검증

- 핵심 14파일 **116 PASS / 0 FAIL**, history `--unit-only` PASS. 파일별 개수는 아래 최종 증거에 보존.
- 운영 504파일 변경 0, 기존 fixture 109개 변경 0, 기존 manifest 전체 바이트 보존. raw closure168 → 기존 투영164, 누락0. syntax8/8 PASS.
- office **73파일: 796 PASS / Git 차단33 / 성능1 FAIL / skip3**. 성능은 병행 실행 후 단독 재검증 **1 PASS**, chairman absent/present 최소310.9443/305.8742ms로 기존400ms 제한 통과. 병행 결과와 단독 결과를 합산하지 않음.
- 요청14개는 293과 #499 직전 `213ffc8` 대조 실행 결과가 동일. **대조177 PASS / Git 차단5 / 비Git 기능 실패0**, 별도 브라우저 차단1파일. 대조 입력은 변경된5 owner만 독립 객체로 공급했으며 나머지 운영499파일도 Git blob identity가 같음을 확인.
- CODEMAP에 이 release tooling anchor가 없어 실제 owner/helper로 scoped fallback. 운영 UI 변경이 없어 실제 화면·Candidate/Build/One-Pass/HINA·Production read-back·버전 증가는 N/A.
- 지시된 기존 실패 20종은 수정·직접 실행하지 않음. Git·브라우저가 필요한 구간은 서윤 재검증 대상.

| 요청 시험 (hani- 생략) | 293 PASS | 남은 구간 (213ffc8도 동일) |
| --- | ---: | --- |
| office-barista-night-273-pins | 4 | Git1 |
| office-barista-night | 13 | 없음 |
| office-bori-stroll | 13 | Git1 |
| office-companion-homes | 15 | Git1 |
| office-kids-286-source | 3 | 없음 |
| office-kids-merge | 10 | 없음 |
| office-kids-visit | 16 | 없음 |
| office-kids-weekday | 19 | 없음 |
| office-pet-bori-272-pins | 3 | Git1 |
| office-residents | 49 | 없음 |
| office-staff-chat | 17 | 없음 |
| office-xmas-269-pins | 1 | Git1 |
| office-xmas | 13 | 없음 |
| ilbo-banner-215 | 수명주기1 | 브라우저 차단; 전체 PASS 아님 |

핵심별 PASS: chibi-pack-1 **10**, layers **6**, 새 release293 **3**, release-version-layers **11**, save-guard **10**, seoyun-m9 **15**, join-ieum **17**, app-216-audit **7**, qa-easy-cleanup **12**, newsroom-285-source **2**, newsroom-4cut-288 **7**, life-bundle-source **5**, street-journal **10**, street-journal-closure **1**. history unit은 자체 세부 개수 미출력.

**#499 이전부터 실패하던 목록:** 요청14개 중 재현된 비Git 기능 실패는 없음. 위 Git5개와 ilbo-banner 브라우저는 sandbox에서 원래 성공 여부를 판정할 수 없으므로 미해결 목록으로 남김. Git 명령을 객체 reader로 대체해 해당 단언을 PASS 처리하지 않았음.

모든 office73 파일별 PASS/FAIL/skip·차단 시험 이름은 [최종 증거](TOOLING-293-EVIDENCE.json), 보존·독립 기준 확인은 [감사 결과](TOOLING-293-AUDIT.json)에 기록. 과거 tooling-292 결과를 이번 결과로 재사용하지 않음.

## 서윤 명령과 남은 일

아래는 Git·Edge가 가능한 서윤 환경에서 실행. **process deny guard나 외부 source preload 없이** 기본 실행하며 파일별로 격리. 이 작업은 배포 승인이 아님.

```powershell
git diff --check
$e = Get-Content -Raw -Encoding UTF8 artifacts/chibi-pack-1/TOOLING-293-EVIDENCE.json | ConvertFrom-Json
foreach ($t in $e.core) { node --test "scripts/$($t.file)" }
node scripts/hani-history-226.test.mjs --unit-only
Get-ChildItem scripts -Filter 'hani-office*.test.mjs' | Sort-Object Name | ForEach-Object { node --test $_.FullName }
node scripts/hani-ilbo-banner-215.test.mjs
```

Codex 실행 재현(프로세스 차단 포함): `./artifacts/chibi-pack-1/tool293-run.ps1 -Phase verify -Group core`, `-Group office` 또는 `-Group reported`. #499 전 대조: `-Phase pre499 -Group reported -Pre499`. 병행 실행은 `-Shard 0 -Shards 4`부터 0~3 각각 실행했으며 성능 항목은 반드시 단독 확인.

```powershell
node --require ./scripts/hani-tooling-293-deny-process.cjs --test --test-isolation=none --test-name-pattern 'first full daily plan' scripts/hani-office-cafe-rest.test.mjs
```

저장·Cloud·schema 변경 없음. 생성된 기존 JSON4개는 원문 복원, 신규 부산물JSON4개는 제거. 작업용 snapshot·중간 로그/JSON도 최종 증거로 모은 뒤 정리. 미커밋 상태로 검토·commit/push는 서윤 담당.

Notion HANI-88 착수 append는 자동 승인 검토가 `MCP tool call requires approval, but approval policy is never`로 거절했다. 읽기만 성공했으며 갱신 대기. 로컬 보고·인수인계 내용을 개발 게시판에 기록한 뒤 읽어 확인해야 한다.
