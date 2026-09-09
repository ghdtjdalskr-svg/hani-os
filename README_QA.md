# HANI OS v2.9.100 이미지 적용 후보 — Preview 대기

기준선: v2.9.99 / cb88f88ba4bf90d5d5fdec4623c8f919d3ca4de2
후보: 2bc7b2c228d406b5d443b0c7a96b4c62ef246107
브랜치: hani/canonical-profiles-team-banners (로컬)
Package SHA-256: 23516ddeac4b78ec831bfa98ef4d540b98dba3fad9320d0cfeb4f05c53dd56d4
패키지 크기: 8,131,612 bytes

## 적용 결과
- 확정 이름표 프로필 9종을 `canonicalProfileImages` 단일 맵에 연결했습니다.
- `agentImages`와 `sidebarAgentImages`가 같은 맵을 사용하므로 메뉴 Hero, 한마디, 팀 카드, 코멘트, 결재·안내 UI가 같은 인물 이미지를 참조합니다.
- 레거시 런타임 키 `nauen`, `suyeon`은 canonical `naeun`, `sooyeon` 별칭으로만 유지했습니다.
- 유나 인포데스크 대화/접수 이미지와 히나 Release Gate 안내 이미지를 교체했습니다.
- 사이드바 상단에는 정장 단체사진, 하단에는 최신 사복 Retry 단체사진을 연결했습니다.
- 두 배너 모두 `width:100%`, `height:auto`, `object-fit:contain`을 사용합니다.
- 프로필은 720×720, 단체사진은 1439×810 WebP로 최적화했습니다. 인물·구도 변경 없이 웹 표시용 해상도와 품질만 조정했습니다.

## 검증
| 항목 | 결과 |
|---|---|
| 9명 canonical 프로필 공통 연결 | PASS (정적 경로/파일 검사) |
| 각 메뉴 우측 상단·Hero 프로필 | PASS (공통 맵 소비 경로) |
| 대화·멘트·승인·안내 프로필 | PASS (공통 맵 소비 경로) |
| 유나 인포데스크 | PASS (Yuna canonical 경로) |
| 상단 정장 / 하단 사복 배너 연결 | PASS (DOM·파일·CSS 검사) |
| 배너 crop 방지 구현 | PASS (`contain` + 자동 높이) |
| One-Pass Preflight | PASS |
| HINA 동등 Gate | PASS |
| Queue | READY |
| JS syntax / runtime closure / DOM / 보호 invariant | PASS |
| DB·schema·Supabase write·release tooling 변경 | 없음 |
| Desktop Preview | 미검증 — 로컬 주소가 Cloud Browser에서 차단됨 |
| 390px Mobile Preview | 미검증 — 같은 연결 제한 |
| Console error 0건 | 미검증 — 브라우저 Preview 실행 불가 |
| 기능 regression 없음 | 미확정 — 실제 상호작용 Preview 필요 |

## 원격 게시 상태
성민 대표님이 최적화와 작업 브랜치 게시를 승인했지만 게시 채널이 차단되었습니다.
- 로컬 Git: GitHub 인증정보 없음.
- 연결된 GitHub 앱: binary blob 생성 시 `403 Resource not accessible by integration`.
- 원격 브랜치, PR, Preview, main merge는 생성되지 않았습니다.

## 최종 3항목
- 프로필 적용 누락 없음: 정적 검사 PASS / 실제 화면 최종 확인 대기
- 배너 crop 없음: CSS 검사 PASS / 실제 Desktop·390px 확인 대기
- 기존 기능 regression 없음: One-Pass 보호 검사 PASS / 실제 상호작용 확인 대기
