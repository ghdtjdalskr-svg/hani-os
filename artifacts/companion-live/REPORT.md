# 사무실 전용 동행 — 구현 완료 / Git 차단

- 담당 Codex · 2026-11-07 KST · hani/office-companions · base/main **ce072a4**(GitHub 조회 일치). 표시 **2.9.275 유지**.
- 평일 월~금 5종 순번, 회장님 부재 시 숨김·같은 층 동행·앉기. 주말 수현(후드·가방·독서)·수연(트윈테일·손 흔들기)과 독립 동물 5종 순찰, 지정 대사·근처 직원 반응 5줄 구현.
- 기존 residents/tick/슬롯/sprite loader/말풍선/혼잡 이름표 owner 확장. 기존 resident API·직원/방문객 scheduler 보존. **새 저장·timer·전역 listener 0**, closure **159→161(+2), 누락 0**.
- 그림은 built-in imagegen. [동물 atlas](../../assets/office-companions/companions-v1.webp) 480×1440 / [남매 atlas](../../assets/office-companions/kids-v1.webp) 384×576. 기존 96×144 셀·좌우 프레임·pivot 유지. [비교판](style-compare.png), [prompt·조립 근거](ASSET-NOTES.md). manifest 변경 없음, 회장님 ref 커밋 대상 아님.
- **전용 11/11 PASS**, 최종 영향 검사 **110통과·5차단(모두 Git EPERM)**, syntax **16/16**. 276 delta/source/pins로 기존 고정 assertion 유지. 기존 office 전부+helper/fortune **62파일 실행**, 중간 실패 수정 후 영향 범위 재검사. 세부 [검증 기록](VALIDATION.md).
- Edge 실제 index·로컬 서버 **1280×900 / 390×844**, 월·금·토·주말 전 층·남매 실제 클릭 **20 PNG**. 표시 이름표 겹침·390px 남매 말풍선/이름표 교차·가로 넘침·page error **0**([결과](browser-results.json)). [수연 휴대폰](kid-suyeon-tap-390.png), [토요일 PC](saturday-1280.png).
- commit **차단(EPERM)**: [Git 기록](git-blocker.json). push/merge/배포/버전·cache/저장·Cloud·schema 변경 없음. 서버 설정/Edge Function 선행 배포 없음. 운영·HINA·독립 Arin 검증은 미실행.
- 다음: 서윤이 Git 원본 대조·commit 재실행. **두 atlas만 seed commit/PR 먼저**, 그 다음 기능·시험 commit. 현재 사용자 지시의 push/merge 금지는 유지.
- Notion은 읽기 성공, 쓰기는 자동 승인 정책 **never** 거절로 **갱신 대기**. [인수인계](../../docs/development-history/handoffs/2026-11-07-office-companions.md)에 반영할 요약 보존.
