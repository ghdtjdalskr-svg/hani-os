# 독서·시청 세션 입력 초안 — 구현 보류 / 최소 설계

- 기준 main: c43ba2f1ce24c05e2cb16338e920fcf73731de0a (2026-10-07 fetch).
- branch: hani/media-session-draft-design-20261007. 문서만 변경. 기능 구현·UI QA PASS 또는 탑승 대기로 표시하지 않음.
- HANI-33 hani/navigation-state-20261007 및 HANI-28/18d6a0a 브랜치 수정 없음. 화면·scroll 저장과 독립된 후속 범위.

## 실제 소유 경로

- hani-main.js의 saveBook/saveMovie onclick이 이미지 처리 후 state.books/state.movies를 수정하고 기존 commit 결과를 검사. 실패 시 이전 배열 복구·renderAll, 성공 후 resetBookForm/resetMovieForm 실행.
- cancelBookEdit/cancelMovieEdit도 같은 reset 함수 사용. 기존 data-book-edit/data-movie-edit는 editId와 폼 값을 직접 채움. 신규 초안은 editId가 비어 있을 때만 대상이어야 함.
- cloudUser/loginGateUnlocked/cloudOwnerVerificationEpoch는 같은 main 내부 변수. cloudBindAuthEvents의 onAuthStateChange는 epoch와 verifier 및 Data Hub를 invalidate하지만 초안용 동기 lifecycle 알림은 확인되지 않음.
- lockLoginGate는 app을 잠그지만 독서·시청 입력값을 초기화하지 않음. 따라서 복원된 A 계정 초안은 별도 즉시 정리 없이 B 계정에 DOM 값으로 남을 수 있음.

## 현재 승인 경계에서 STOP

별도 sessionStorage 기능에서 owner별 key만 나누거나 복원 버튼 클릭 시 owner를 확인하는 것만으로는 이미 복원한 DOM 입력의 로그아웃/계정변경 잔존 문제를 해결하지 못함. interval/MutationObserver로 인증 상태를 추정하는 방식은 즉시 무효화 계약이 아니며 canonical owner 경로 위에 새로운 관찰 layer를 추가하게 됨.

안전하게 구현하려면 인증 담당과 협의해 기존 계정 변경/로그아웃/잠금 경로에서 동기적인 UI 초안 invalidate hook을 제공해야 함. 인증 handler 변경 금지인 이번 범위에서는 이를 추가하지 않았음. 보호 키/state/save/commit/Cloud/auth 및 신규 runtime write 변경 0건.

## 최소 후속 설계 (미구현)

- 한 탭 sessionStorage 전용 새 UI key. 보호 키/Cloud payload 포함 금지. 확인된 user ID와 세션 epoch를 소유 계약에 사용하고 미확인 owner에서는 저장/복원하지 않음.
- 신규 입력만: 제목(최대 200자), 평점(기존 유효 범위), 상태/콘텐츠 유형 enum 정도. credential/개인일기/후기/메모/금융/파일/이미지/기존 수정 입력 제외.
- 최대 2시간, 고정 작은 payload, malformed/expired/owner mismatch는 표시 없이 폐기. 탭 복제 시 sessionStorage가 복사될 수 있으므로 별도의 탭 격리 계약도 검증 필요.
- 기존 canonical 입력 경로에서 초안 저장. 명시적인 임시 입력 복원/버리기만 제공하며 빈 신규 폼에만 복원. 현재 입력을 덮어쓰거나 실제 기록을 자동 저장하지 않음.
- resetBookForm/resetMovieForm의 기존 호출을 활용한 성공/취소 시 초안 제거 hook 필요. 저장 클릭 시 제거하면 validation/commit 실패 초안을 잃으므로 금지. 파일 처리 중 추가 입력과 편집 진입도 테스트.
- 인증 담당의 동기 invalidate hook에서 저장된 초안·복원 CTA·복원한 임시 입력을 제거. 사용자 원본 state는 변경하지 않음. hook 계약 승인 후에만 구현.

## 구현 승인 후 필요한 검증

계정 A→로그아웃→B 전환의 즉시 비노출, 미확인 owner·expiry·손상 저장·storage 실패, 복원/버리기 및 기존 입력 보존, 신규 저장 성공 후 재등장 없음, 저장 실패/중복 클릭/이미지 비동기 경쟁, 수정 모드 제외, PC/390px UI·console, 보호 키 write 0(초안 단계) 및 canonical 기록 저장 기존 횟수 보존. 현재는 모두 미실행.

- 문서 diff 검사만 수행. runtime syntax/build/Production QA N/A. 서버 동시 배포 없음.
- 다음 요청: 인증 담당이 소유한 최소 UI lifecycle hook 허용 범위와 탭 격리 계약 확정. 다른 탭 메시지·타 branch 수정·merge/rebase·PR·버전/cache 증가·배포 없음.
