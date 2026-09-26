# PROJECT HANI / HANI OS 개발 Agent 최상위 규칙

## 문서 목적과 적용 범위

이 문서는 이 저장소 전체에 적용되는 최상위 개발 규칙이다. 이 저장소에서 작업하는 모든 개발 Agent는 작업 계획, 코드 변경, 테스트, Release QA, Git 및 배포 과정에서 이 규칙을 항상 따라야 한다.

이 문서는 PROJECT HANI의 **일반 안전규칙에 대한 Canonical Source**이다. 작업 Prompt는 기본 안전규칙을 장문으로 반복하지 않고 `AGENTS.md 준수`로 참조할 수 있다. 작업별 추가 제한, 승인 범위, 대상 파일과 배포 조건은 Prompt에 별도로 기록한다.

## 1. 프로젝트

- 프로젝트명은 **PROJECT HANI / HANI OS**이다.
- HANI OS는 **Personal Life OS + Personal Agent OS + AI Orchestration + Personal AI Company**를 목표로 한다.
- 사용자는 성민이며, 프로젝트 맥락에서는 항상 **성민 대표님**으로 호칭한다.

## 2. 최우선 원칙

의사결정의 우선순위는 다음과 같다.

> **데이터 보존 > 기능 안정성 > 입력 편의 > 조회/시각화 > 디자인**

- 중요한 `localStorage` 키인 `hani_os_life_v23`은 절대 이름을 변경하거나 삭제, 초기화, 자동 reset하지 않는다.
- 내부 데이터 기준 버전 `2.9.15-safe-baseline-bootstrap`을 임의로 변경하지 않는다.
- Cloud 오류를 이유로 정상 Local 데이터를 삭제하거나 오래된 Cloud 데이터로 자동 rollback하지 않는다.
- 데이터 migration 및 Cloud schema 변경은 성민 대표님의 명시적 승인 없이 수행하지 않는다.
- 구현 방식이나 디자인 판단이 데이터 보존 또는 기능 안정성과 충돌하면 데이터 보존과 기능 안정성을 우선한다.

## 3. Git / 배포 안전

- `main` 브랜치에서 직접 파일을 수정하지 않는다.
- 모든 개발은 별도의 `hani/...` 브랜치에서 수행한다.
- 성민 대표님의 승인 전에는 `main`에 merge하지 않는다.
- PR merge만으로 Production 배포가 완료되었다고 판단하지 않는다.
- `force push`, `git reset --hard`, 임의 history rewrite, 다른 작업 branch 삭제 등 파괴적 Git 작업은 성민 대표님의 명시적 승인 없이 수행하지 않는다.
- Production 완료 조건은 다음 전체 흐름이 성공한 상태이다.

  `main merge → GitHub Pages 반영 → 표시 버전 확인 → 최신 JS 실제 로딩 확인 → 기능 read-back`

- 각 단계는 실제 결과를 확인하며, 앞 단계가 성공했다는 추정만으로 다음 단계의 성공을 간주하지 않는다.

## 4. 개발 작업 원칙

- 새로운 개발 세션 시작, Candidate Freeze, `main` drift 의심, CRITICAL 작업 시 원격 `origin/main`의 최신성을 확인하고 현재 작업 기준선과 비교한다.
- 같은 세션에서 연속된 LIGHT 또는 NORMAL Patch를 수행할 때 동일한 main SHA, 표시 버전, 최신 Runtime JS를 반복 확인하지 않는다.
- 작업 도중 `main`이 진행된 경우 임의로 merge 또는 rebase하지 않는다. 현재 기준선과 최신 `main`의 차이, 작업에 미치는 영향, 필요한 대응을 성민 대표님께 보고한다.
- 위 기준선 확인 시 현재 `main` SHA, 화면 표시 버전, 마지막으로 로드되는 최신 UI JS 파일을 함께 확인한다.
- 정상 동작 중인 기능은 요청 범위 밖에서 불필요하게 변경하지 않는다.
- 문제를 해결하기 위해 기존 코드 위에 새로운 JS, event 또는 renderer layer를 계속 추가하지 않는다.
- 변경 전에 기존 DOM, Event, Renderer의 실제 소유 경로와 실행 순서를 분석한다.
- Legacy handler가 충돌하면 새 handler를 덧붙이기보다 canonical event path 하나로 정리한다.
- 반복적인 DOM create/delete보다 **Persistent Slot + Update** 구조를 우선 검토한다.
- UI 수정은 가능하면 **READ-ONLY UI PATCH**로 수행한다.
- 수정 범위는 요구사항을 충족하는 최소 범위로 제한하고, 기존 데이터 경로와 정상 동작을 보존한다.

### Development Mode

개별 Patch 개발은 다음 흐름을 따른다.

`Scoped Discovery → Patch → Risk-tier Targeted Test`

- 먼저 `dev-center/codemap.json`에서 feature owner, dependency symbol, DOM/event anchor와 targeted test를 확인한다.
- owner 파일과 필요한 symbol 주변만 우선 읽고, CODEMAP anchor가 없거나 오래된 경우에만 검색 범위를 확장한다.
- CODEMAP anchor가 사라졌거나 경로가 맞지 않으면 `CODEMAP_MISS`로 처리하고 실제 코드 검색으로 fallback한다. 틀린 CODEMAP 정보를 사실로 사용하지 않는다.
- 큰 파일 전체 읽기, Full Package Build, One-Pass Full Preflight, HINA Full QA, Production read-back을 Patch마다 반복하지 않는다.

### Candidate Mode

성민 대표님이 Preview Candidate 준비를 요청하거나 여러 Patch가 완료된 경우에만 Candidate Mode로 전환한다.

`Candidate Freeze → Build 1회 → One-Pass Preflight 1회 → HINA Independent Verification 1회 → Preview / Arin → 성민 대표 승인 → identity 재확인 → Merge → Production Read-back`

- Candidate Freeze 이후의 모든 자동 결과는 동일한 candidate SHA, package SHA 및 gate contract hash에 연결한다.
- Candidate 내용이 변경되면 기존 PASS를 재사용하지 않고 새 Candidate로 다시 Freeze한다.
- HINA는 frozen Candidate를 독립 검증한다. 동일한 identity가 유지되는 동안 다른 단계에서 동일 Package를 불필요하게 재구성하지 않는다.

## 5. 금지 및 승인 필요 작업

다음 동작이 필요하다고 판단되면 즉시 작업을 멈추고, 변경하지 않은 상태에서 이유와 영향 범위를 설명한 뒤 성민 대표님의 명시적 승인을 요청한다.

- 기존 데이터 구조 변경을 목적으로 `localStorage.setItem`, `localStorage.removeItem`, `localStorage.clear`를 사용하는 작업
- `hani_os_life_v23`에 대한 새로운 write, remove, clear 경로 추가 또는 기존 write 로직 변경
- Supabase `insert`, `update`, `delete`, `upsert` 로직의 구조 변경
- Cloud schema 변경
- 데이터 migration
- `main` 브랜치 직접 수정
- 운영 데이터 삭제

승인을 받더라도 승인된 범위만 작업하며, 데이터 백업·복구 가능성·검증 방법을 먼저 확인한다.

### 비밀정보 보호

- Supabase `service_role` 또는 secret key, API token, 비밀번호 등 비밀정보를 저장소, commit, PR, 로그에 기록하지 않는다.
- Supabase `service_role`은 클라이언트 코드에서 절대 사용하지 않는다.
- 비밀정보 노출을 발견하면 값을 재출력하거나 복제하지 않고 즉시 작업을 멈춘 뒤 노출 위치와 필요한 대응을 성민 대표님께 보고한다.

## 6. Release QA

### Risk Tier

- **LIGHT**: 문구, spacing, CSS, 캐릭터 Comment, 이미지 배치 등. 관련 파일 syntax와 해당 화면·컴포넌트 targeted QA만 수행한다.
- **NORMAL**: Quiz generation, Newsroom logic, Asset matching, Intake parsing, 일반 UI interaction 등. feature owner와 관련 dependency를 확인하고 targeted regression을 수행한다.
- **CRITICAL**: `hani_os_life_v23`, storage write, Cloud Sync, Supabase write/schema, auth, delete/recovery, release pipeline 등. 기존 Full Safety Audit과 승인 절차를 유지한다.

LIGHT와 NORMAL 작업도 Release Candidate에 포함될 때는 Candidate Freeze 이후 One-Pass 및 HINA 절차를 거친다. Risk Tier는 개발 중 검증 범위를 정하며 Release Gate를 우회하지 않는다.

개발 완료 후 최소한 다음 항목을 검증한다.

- 운영 코드 또는 배포 파일이 변경되는 Release의 버전 증가 여부
- 필요한 파일 누락 여부
- JS syntax
- DOM 구조
- Event conflict
- Regression
- LocalStorage safety
- Cloud write/schema safety
- 실제 화면 결과

단순 문자열 존재 여부만으로 PASS 처리하지 않는다. 가능한 경우 실제 실행 경로, 이벤트 결과, 렌더링 결과, 데이터 read/write 영향과 화면 결과를 확인한다. 검증하지 못한 항목은 PASS로 표시하지 않고 미검증 사유와 남은 위험을 보고한다.

문서 또는 개발도구만 변경하고 운영 코드와 배포 파일을 변경하지 않은 작업은 버전 증가 검증을 `N/A`로 보고할 수 있다.

## 7. Agent 역할과 개발 Flow

### 역할

- **하니**: PM / Chief of Staff / 요구사항 정리 / 위험 판단 / 최종 종합
- **개발 Agent(Codex)**: 실제 코드 변경 / 파일 작업 / 테스트
- **유리**: 변경 범위 / UI 여부 / owner path / event layering 위험 / One-Pass가 소유하지 않는 특수 검사
- **아린**: UI 변경 시 Preview UI/UX Review. Machine Safety Gate를 반복하지 않는다.
- **히나**: Final QA / Release Gate
- **성민 대표님**: Preview 확인 및 최종 승인

### 목표 개발 Flow

- Development: `성민 요구 → 하니 Spec → 개발 Agent → Scoped Discovery → Patch → Risk-tier Targeted Test`
- Candidate: `Candidate Freeze → Build → One-Pass Preflight → 히나 독립 검증 → Preview / 필요 시 아린 Review → 성민 승인 → identity 재확인 → PR/main merge → Pages → Production Read-back`

각 Agent는 자신의 단계 결과와 확인하지 못한 위험을 다음 단계에 명확히 전달한다. 성민 대표님의 최종 승인 전에는 승인 이후 단계로 진행하지 않는다.

## 8. 사용자 작업 최소화

- 성민 대표님에게 코드 몇 줄을 직접 수정하거나 특정 줄을 찾아 붙여넣으라고 요구하지 않는다.
- 가능한 경우 개발 Agent가 직접 파일 수정, 테스트, branch 및 PR 준비까지 수행한다.
- 작업 결과는 성민 대표님이 Preview에서 판단할 수 있도록 구체적으로 준비한다.
- 최종 목표는 **대표는 미리보기 확인 → 승인만** 하는 흐름이다.
