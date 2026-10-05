# 연간 보고 뷰어 · 실제 인증 검증 대기

## 최신 운영 기준선 확인 · 목표 등록부 중복 방지

- origin/main `c544592e427b44fd7c7c530213a790f50e92bce8` 확인. 운영 코드 표시 버전 v2.9.178. 이 Preview의 base `69ea05d8523b9f6b148f987692c213992f3ba34c` / v2.9.175와 차이가 있으며 기존 미커밋 파일은 보존. merge/rebase/main 수정 없음.
- 최신 main의 Goal Registry는 연간·분기별 지표, 적용일, 변경 Preview, 명시적 승인 저장 및 이력을 이미 구현. 현재 Preview의 별도 목표 초안 카드를 그대로 배포하지 않고, 최신 기준선 후보에서 기존 등록부 입력에만 제안을 연결해야 함. 기존 승인 저장 handler 또는 보호 데이터 write 경로 변경은 이번 UI 범위가 아님.
- 대표님은 현재 Q&A 보관 없이 가독성 수정 적용에 동의. 별도 대화 보관 기능/저장 경로는 추가하지 않음. 기존 메모리 대화는 새로고침 시 초기화됨.
- 최신 main 확인은 Git 코드 기준이며 이번 확인만으로 Pages/운영 표시 버전/실제 JS/기능 read-back PASS를 주장하지 않음. 보고 후보 PR·병합·Production 배포는 여전히 미완료.

## Q&A 발표 장면 가독성 개선

- 대표님이 실제 질문 후 답변이 표시된 화면을 제공. 사용자 제공 화면 기준 실제 답변 UI 표시 확인. 전송 payload/네트워크/server trace 또는 해당 응답 PPT read-back까지 검증한 근거는 아니며 후속 검증은 유지.
- Q&A 장면 본문만 읽기 전용 개선: 기존 가운데 정렬된 단일 p 대신 문장 경계에서 문단 분리, 왼쪽 정렬, desktop 20px/mobile 18px 및 넓은 줄 간격. 수치/문장을 요약하거나 다시 생성하지 않으며 decimal 유지 및 escape 적용. 다른 발표 장면/PPT/목표/저장 경로 변경 없음.
- 격리 desktop/mobile 회귀 PASS: 긴 답변 문단 3개 이상, 원문 텍스트 동일(공백 제외), script 문자열 escape, 실제 computed font/정렬, 가로 넘침 없음, 기존 보고/목표 초안/보호 데이터 보존. 양쪽 실제 screenshot 시각 확인. JS syntax/diff check PASS.
- 새로고침은 기존 메모리 대화를 초기화하는 원래 동작 유지. 최종 release 미완료.

## 분기 다운로드 PPT · 캐릭터 발표 디자인 연결

- Artifact Tool로 작성한 10개 편집 가능한 발표 레이아웃을 기존 earningsPptx 내에 압축 템플릿으로 연결. 새 runtime 파일 없이 동일 earningsCallProgramme 및 earningsCallKeynote를 웹/PPT에 사용. 그룹 오프닝, 6개 현재 성과 지표, 담당자별 색상·좌우 교차 사진, 어두운 학습/Q&A 무대, 편집 가능한 추진 방향 표 반영.
- 기존 프로젝트 이미지만 같은 origin에서 읽어 브라우저에서 JPEG로 변환·PPT 내부 포함. 개인 원본/로그인 정보 외부 전송 없음. 압축된 템플릿은 정적 레이아웃 XML 및 프로젝트 이미지 경로만 포함하며 예시 실적 하드코딩 없음. 텍스트·표는 native 객체, 사진은 개별 이미지 객체 유지. 월별 시각 자료는 수치 텍스트와 근거 표이며 별도 editable chart 추가는 아님.
- 첫 10장 뒤 긴 발표 내용·현재 상황·Q&A·월별 근거·읽는 기준을 후속 장으로 보존. 다운로드 시작 때 대화 내용 snapshot, 비동기 준비 중 계정 변경 시 다운로드 중단. 생성 실패는 오류 안내 후 입력·원본 보존. 보호 life 데이터 및 목표 저장 경로 변경 없음.
- desktop/mobile 격리 회귀 PASS: 10개 제목 순서, 6지표 값, 빈 달 미확인, 긴 답변 끝/전망 보존, JPEG 내부 포함 및 템플릿 토큰 해소, 기존 월간 생성·실패 복구·아카이브, 목표 초안, 연간 빈 무대, 보호 데이터 동일성. MOCK Q&A이며 실제 인증 AI 답변 검증으로 간주하지 않음.
- 다운로드 파일 finalizer에서 package integrity, heading geometry, native 추진 방향/월별 표 및 Artifact Tool 재import PASS. 합성 fixture 14장 전체 PNG를 개별 시각 확인. 긴 학습 발표 문구 줄바꿈 수정 후 재검사. PowerPoint 앱에서의 수동 편집·재저장 검증은 미실시.
- runtime closure: 94파일 / 18,075,824바이트 / missing=[]로 승인 계약 2.0.6(94파일/19,000,000바이트/단일5MB) 유지. 현재 Preview v2.9.175, 최신 main v2.9.177 대비 별도 최종 후보 통합·버전 증가와 모든 release gate는 아직 미완료.
- 실제 사용자 로그인 Q&A 및 그 응답 PPT, 연간 인증 파일 검증·등록·read-back·복구, 사용자 목표 저장은 미검증. PR/main 병합/Pages 배포/Production 완료 없음. 배포 승인은 유지하되 위 실사용 검증과 최종 게이트를 생략하지 않음.

## 현재 성과 강조 및 어닝콜 기반 수정 가능한 목표 초안

- 대표님이 선택을 정정하여 미래 전망보다 현재 성과를 강조. 종합 장면에 확인된 분기 지출과 실제 채점 문항을 추가하여 자산/지출/학습/활동/완독/정답률 6개 근거 지표 표시. 전망은 미확정 제안 유지.
- 현재 checkout 설정·데이터에는 중앙 목표 탭이 없어 목표 설정 영역 추가. 분기 선택/자동 초안/현재 목표 재불러오기/수정 가능한 입력 제공. 완료 분기 기록만 초안 생성, 기간 말 자산 미확인은 기존 목표 유지. 투자값은 확인된 자산 유지 기준, 독서값은 확인된 완독 기록의 월 페이스 올림 및 월 목표 × 12의 새 연간 목표 초안. 빈 달의 독서 여부를 0으로 단정하거나 이를 연간 실적으로 표시하지 않음.
- 체중 목표는 자동 추가 감량 없이 기존 값 유지. 초안 import/prefill에서 state.goals 또는 보호 storage write 없음. 투자/체중 기존 modal opener와 독서 기존 목표 입력으로 연결하고 대표님이 기존 저장 버튼을 눌러 확정. 새 goal schema, quarter history, Cloud write, 목표 저장 handler 추가/변경 없음.
- desktop/mobile 실제 UI 검사 PASS: 초안 생성값, 미확인/빈 분기 거부, 체중 기존값 유지, 편집값 기존 모달 및 독서 입력으로 전달, 아직 저장하지 않은 state.goals 및 hani_os_life_v23 완전 보존, 페이지 가로 넘침 없음. 기존 월간/분기/연간 회귀 PASS. 실제 사용자 Cloud 목표 저장 검증은 미실시.
- 최종 배포/PPT 캐릭터 디자인 연결은 여전히 미완료. 이번 목표 초안 및 성과 강화는 Preview 변경.

## 연간 발표 무대 · 내용 작성 전 디자인 예시

- 대표님 요청으로 보고서 미등록 상태에 4개 장면 추가: HANI GROUP 팀 오프닝, 올해의 회고 질문, 분야별 담당자 발표 질문, 다음 해 방향 및 작성·등록 과정. 임의 실적/목표/성과 차트 없이 DESIGN PREVIEW와 작성 전 상태를 명시.
- annualReportRenderList의 빈 보관함 경로만 교체. 기존 보고서가 있으면 수정본 목록 및 PDF 원본 뷰어 유지. 등록한 PDF를 이 예시 레이아웃으로 변환하지 않음. 기존 검증/등록/복구/소유자 검증/Storage 및 보호 life 데이터 경로 변경 없음.
- desktop/mobile 4장면·5명 발표자·예시 표시·페이지 넘침 검사, 기존 분기/월간 회귀와 보호 데이터 보존 PASS. 실제 PDF 엔진과 MOCK Cloud 검증/등록 read-back/원본 다운로드/계정 분리 검사 PASS. 실제 사용자 인증 업로드 증거는 아님.
- 데스크톱 그룹 오프닝·담당자, 모바일 회고·다음 해 화면 시각 확인. 런타임 참조 94파일/18,056,796바이트/missing=[]; 승인된 용량 범위 유지. 최종 후보 freeze/배포 미완료.

## 분기 페이지 발표 구성 반영

### HANI GROUP 키노트 스타일 · Preview

- 대표님 승인 후 사이드바/화면 제목을 `컨퍼런스 룸`, 안내 역할을 `HANI CONFERENCE ROOM`으로 변경. 기존 monthlyReport route/DOM/data key 유지. 메뉴 위치/이름 실제 렌더링 검사 추가.
- 배포 요청 시 재확인: 최신 origin/main `2c2ce5778aa69cfa4748208a86b89a5d79089ec6` (v2.9.177, #178 뉴스룸 가독성/보관 주차 변경). 현재 Preview 기준은 v2.9.175로 drift 있음. 미커밋 파일 보존, 임의 merge/rebase/main 수정 없음. 최신 기준선 별도 후보 통합 및 version 증가 필요. 실제 Q&A/연간 업로드 검증, 앱 PPT 디자인 연결, final freeze/게이트 미완료이므로 Production 배포 완료로 보고하지 않음.

- 담당자별 재치 있는 발표 문구 추가. 그룹 CI/팀 이미지 오프닝, 큰 숫자의 종합 지표, 좌우 교차 발표자, 학습의 어두운 무대, 독서 목록, 다음 분기 제안 일정, Q&A 엔딩으로 장면 배치를 구분. 기존 프로젝트 이미지를 재사용.
- 전망과 일정은 미확정 제안이며 기존 목표/원본 데이터를 수정하지 않음. 독서 완료 기록이 없으면 완독을 주장하는 문구 대신 대기 문구 표시.
- desktop/mobile 분기 화면의 페이지 가로 넘침과 발표 문구 크기 자동 검사 추가. 모바일 추진 방향 표의 내부 가로 스크롤을 유지하고 종합 투자 자산은 넓은 행으로 배치. 원본 집계/미확인/Q&A 모의 응답/계정 분리/월간 회귀/보호 데이터 보존 검사 PASS. 장면별 스크린샷 시각 확인.
- 웹 Preview 변경이며 실제 사용자 로그인 Q&A 및 PPT 디자인 연결, 최종 Release 게이트/Production 검증은 별도 미완료.

- 대표님 요청으로 분기 화면에 10개 장면 연결: 오프닝, 종합 지표, 지은 재무, 나은 신체·활동, 히나 학습, 하루 독서, 민지 문화, 하니 전망, 추진 방향·조건부 기대효과, Q&A. 기존 canonical earningsRender 안에서 렌더링하며 새 event layer를 추가하지 않음.
- earningsCallProgramme은 선택 분기의 기존 원본 집계로 수치·미확인·발표자·전망·계획을 구성. 첨부 PPT 예시 수치를 runtime에 복사하지 않음. 신체·학습/재무에 원본 기준을 표시, 과거 목표·확정 기대성과 추정 없음.
- desktop/mobile 검사 PASS: 10개 장면·분야별 장면·히나 발표자·빈 달 미확인 표시, 기존 Q&A 최소 전송/escaping/계정 분리(모의), 월간 회귀와 보호 데이터 보존. 전체 장면 화면과 재무/추진 방향 확대 screenshot 시각 확인. 모바일 표는 가로 스크롤로 기대효과 열 조회.
- 현재 closure 94파일/18,040,636바이트/missing=[]로 승인된 한도 이내. 최종 후보 freeze/preflight/HINA/Production 미완료.
- 이번 반영은 분기 웹 화면. 다운로드 PPT는 기존 native exporter이며 승인된 별도 캐릭터 PPT 디자인과의 runtime 연결은 남아 있음. 화면/PPT 완전 일치 또는 배포 완료로 표시하지 않음.

- 기준선 origin/main 69ea05d8523b9f6b148f987692c213992f3ba34c / v2.9.175. 별도 hani/earnings-annual-viewer-20261005에서 작업. 기존 earnings-report-release-20261005 미커밋 작업은 보존, merge/rebase 없음.
- 기존 보고 변경만 범위별 patch로 이관. 운영 v175 모바일/대시보드 및 v174 개발 보고팀 코드 보존. 최종 runtime 버전 증가·후보 freeze·전체 release preflight/HINA는 아직 미실시.
- 연간 화면은 자동 집계/Q&A 대신 PDF 필수 + PPTX 선택 첨부, 검증→canvas 미리보기→명시적 등록→metadata 및 실제 파일 hash read-back. 비공개 수정본 조회·원본 다운로드·대표본 복구, 이전 수정본 보존. life state/목표/보호 LocalStorage write 추가 없음.
- PDF.js 6.4.299 고정, lockfile, production audit 알려진 취약점 없음. core/worker 두 파일을 IIFE로 빌드하여 기존 JS syntax gate 유지. 동일 origin worker만 사용하고 미사용 CDN wrapper를 차단. eval/wasm/worker 외부 resource fetch/active annotation 비활성. canvas 최대 6M pixels. 실제 문서 폰트/이미지의 모든 조합 호환을 보증하지 않음.
- 현재 runtime closure: 94파일 / 18,030,824바이트 / missing=[] (최종 freeze 전 변경에 따라 재검증 필요). 승인 계약 2.0.6의 94파일/19,000,000바이트/단일 5MB 이내. 용량 검사는 최종 package/preflight 대체 아님.
- 실제 PDF 엔진 + mock Cloud 격리 desktop/mobile 검사 PASS: canvas/페이지 이동/확대, validate 단계 무저장, quota 실패 시 선택 파일 보존, 등록 read-back/download, 계정 변경 후 rows/files/PDF 폐기. 이는 실제 Supabase 인증 업로드 검증이 아님.
- 월간/분기 회귀 desktop/mobile PASS. 첫 시도에 기존 remote 요청의 단발 401 console 실패가 있었고 경로 진단 추가 후 재실행 PASS. 실제 Q&A를 검증한 것으로 표시하지 않음.
- 미리보기 http://127.0.0.1:8776/index.html#monthlyReport. CUA 기존 tab 선택은 URL protocol 보안 정책으로 거부. 다른 surface/간접 실행으로 우회하지 않음. 사용자 직접 새로고침 및 실제 로그인 상태의 업로드/표시 확인 필요.
- 남은 작업: 앱 내 마스터 템플릿 다운로드 연결, 실제 인증 업로드·원본 read-back·복구, 실제 PDF/PPTX 및 모바일 시각 확인, 분기 캐릭터 10장 디자인 runtime exporter 연결, 실제 인증 Q&A/PPT 검증, 최종 후보 version/preflight/HINA/Preview/승인/PR/main/Pages/production read-back. 보고 frontend Production 배포 미완료.
