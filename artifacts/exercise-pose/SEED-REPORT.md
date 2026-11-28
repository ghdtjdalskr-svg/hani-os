# 승인된 운동 포즈 21장 반영 결과

2026-11-29 KST · Codex · 로컬 반영·대상 검증 완료, 서윤 커밋 대기.

- `spriteBytes`: 1,241,356 → 1,629,878 bytes. 전체 36개 `sizeBytes` 합산으로 기존 수치 재현 후 재계산.
- `maxSpriteBytes`: 1,475,000 → 1,650,000 bytes. 새 합계가 기존 한도를 넘어 50,000 단위 올림.
- 복사 전 21개 모두 `file == <id>.webp` 확인. 실제 복사본과 sheets-lossy 바이트·SHA-256 일치, 크기·해시·alpha 재디코딩 검증 21/21. 품질 20명 88, 아린 94. 각 파일 100,000 bytes 이하.
- 미대상 15개 manifest 항목의 JSON 원문을 각각 전후 비교해 15/15 바이트 동일. 항목·키 순서 보존. WebP 15장도 바이트 동일.
- 미대상 ID(원래 순서): seongmin, visitor-client, visitor-courier, visitor-rider, visitor-candidate, visitor-generic, pet-cat, pet-dog, pet-bori, npc-cleaner, npc-gardener, npc-temp-a, npc-temp-b, npc-temp-c, pet-rabbit.
- 위 15개 원문 블록을 원래 순서로 LF 한 개씩 사이에 넣어 연결한 SHA-256(전=후): `2d3d0c7447c8fa27060e915813db95969cebfa6241d00ed13e6b5236e41e4fe5`.
- `contentRect`: 최종 복사된 WebP의 144×192 셀에서 **alpha>0** 경계 상자를 측정, 셀 상대 `[left, top, right-left, bottom-top]`. 기존 hani·gaeun의 8개 프레임에서 같은 규칙 재현. 새 42개 프레임의 rect·pivot·bbox·sourceRect 검증.
- `sourceRect`: 파일럿 6명은 validation.json, 나머지 15명은 validation-2-lossless.json의 transforms[i].sourceRect 사용(생성 원본 절반 이미지 기준 좌표). column-0 대체 없음.
- `alpha`: 전체 atlas의 A=0 / 1..254 / 255 픽셀 수. 미대상 seongmin 기존 집계 정확히 재현 후 21장 재계산. 정적 시트·크기·예약 행/열 투명 검증.
- UTF-8 BOM 없음·2칸 들여쓰기·LF·마지막 개행 유지. 기존 84개 프레임·기타 필드·키 순서 보존, 최상위 변경은 layout·spriteBytes·maxSpriteBytes뿐. 비대상 보호 파일 145개 해시 보존.
- Git·JS/CSS/HTML·표시 버전·cache·저장/Cloud 경로 변경 없음. renderer·브라우저·Production 미검증, Build/One-Pass/HINA 미실행. 서버 변경 없음.
- Notion 착수 갱신은 자동 승인 검토의 `approval policy is never` 거절로 미반영. [인수인계](../../docs/development-history/handoffs/2026-11-29-exercise-pose-seed.md)에 갱신 대기·승인 범위·다음 행동 보존.
