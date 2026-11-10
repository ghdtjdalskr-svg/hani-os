# 2026-11-08 GPT 정밀검사 후속: 작은 안전 수정 3건 (탑승 대기)

- 담당: 서윤(Claude, 개발 탭)
- branch: `hani/audit-safety-fixes`
- base: `2bc9368` (origin/main)
- 회장님 승인 범위
  - 11/8 회장님이 검토 결과를 보신 뒤 "응 진행해줘"라고 하셨어요.
  - 범위는 작은 안전 수정 3건(06·03·05)만이에요.
  - 01·07(CRITICAL 묶음)과 04(개인정보 정리)는 포함하지 않았어요.
- 버전과 캐시 태그는 올리지 않았어요(§11 배포 열차 규칙).

## 변경
1. **06 가계부 확정 반영**: `hani-main.js` `ledgerImportApply` 핸들러
   - `commit()`이 false를 돌려주면 메모리 state(`ledgerMonths`, `ui.ledgerMonth`, preview)를 되돌려요.
   - 원문 칸은 비우지 않고, 실패 문구를 표시해요.
   - 성공했을 때 동작은 이전과 같아요.
   - 저장 경로(`save`/`writeProtectedState`)는 변경하지 않았어요.
2. **03 뉴스 댓글 tone**
   - 클라이언트 `hani-main.js`: 댓글 class에 `^[a-z_]{1,30}$`에 맞는 값만 넣어요. 기존 enum 값은 모두 영문자라 표시가 같아요.
   - 서버 `hani-newsroom-publisher`: `archive_result`로 보관할 때 tone을 생성 enum 15개로 제한해요. 목록에 없으면 빈 값으로 저장해요.
3. **05 소유자 확인**: `hani-agent-orchestrator`, `hani-google-calendar`, `hani-newsroom-publisher`
   - 인증 직후에 기존 5개 함수와 같은 `ownerAccess(HANI_OWNER_USER_ID)`를 적용했어요.
   - 결과: 설정이 없으면 503, 다른 계정이면 403이에요.
   - newsroom의 `scheduled_publish`(Cron secret 경로)는 인증 전에 처리되므로 영향이 없어요.
   - calendar의 OAuth callback(GET)도 영향이 없어요. state가 owner 확인을 거친 `oauth_start`에서만 생기기 때문이에요.

## 검증
- `node --check hani-main.js`: 통과
- 수정한 TS 3개: strip-types 후 파싱 통과
- 관련 targeted test 9개 통과
  - boardroom-voice-contract, fixes-213-oauth, hana-intake-224, meeting-character-voice, meeting-engine-v2-batch1, newsroom-persona, toss-intake-224, second-opinion, lounge-ai-213
- `hani-ocr-accuracy-224.test.mjs`: 실패. 수정 전 origin/main에서도 똑같이 실패해서, 이번 변경과는 무관한 기존 실패예요.
- tone 필터에 합성 입력을 넣어 확인했어요.
  - 정상 enum 값은 그대로 유지돼요.
  - `"><img ...>` 같은 값은 빈 값이 돼요.
- 원본 파일의 혼합 줄바꿈(CRLF/LF)을 보존했어요. diff는 실제 변경 39줄이에요.

## 미검증과 위험
- 실제 브라우저에서 가계부 저장 실패를 일으켜 보는 화면 검증은 안 했어요.
- Edge Function 실제 배포와 운영 호출 검증도 안 했어요.
- 전제: `HANI_OWNER_USER_ID` Secret이 프로젝트 공통으로 이미 설정돼 있어야 해요.
  - 근거: 같은 Secret을 쓰는 quiz·lounge 등이 운영 중이에요.
  - 설정이 빠져 있으면 3개 함수가 503을 돌려줘요. 배포 직후 health를 호출해서 꼭 확인해야 해요.

## 함께 배포할 서버 함수 (순서)
1. `hani-newsroom-publisher`
2. `hani-google-calendar`
3. `hani-agent-orchestrator`
- 각 함수를 배포한 뒤 health(인증 상태)를 호출해 200인지 확인해요.

## 다음 행동
- 배포 담당이 다음 열차에 태워요.
- 원래 탭에서 Codex 4건(affinity-cap / m9-link / study-retry / procrastination)이 `hani-main.js`를 수정 중이에요. 열차에서 충돌하는지 확인해야 해요.
- 회장님 확인 대기
  - 04: 계좌번호 형식 값과 건강 원문이 실제 정보인지
  - Supabase에서 새 회원가입이 허용돼 있는지
- 검토 원문: 개발 탭 scratchpad의 `GPT보고서-검토결과-20261108.md`
