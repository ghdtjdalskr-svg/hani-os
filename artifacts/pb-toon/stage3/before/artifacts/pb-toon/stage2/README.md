# 검증 재현과 출처

- 기준: `a28918df50ba5fef3e7dab498eaa5eec4a27a103` / v2.9.283. Git 명령 없이 로컬 ref만 직접 읽음. 실행 환경 Node v24.20.0 / Windows PowerShell, 단일 Codex와 자동 검사.
- `run-features.ps1`: 각 시험을 별도 Node 프로세스에서 실행한다. 생활 묶음 preload 시험은 fs를 변경하므로 한 프로세스에 다른 시험을 합치지 않는다. raw 치비툰 시험은 preload 없이 실행한다.
- `run-office.ps1`: 요청한 office 69개 전부, 기존 생활 묶음 메모리 역변환에 이번 UI/버전 바깥 역변환만 추가한다. office의 코드·fixture·assertion은 수정하지 않는다. office baseline 경로는 이전 `../life-bundle/artifacts/life-bundle/283/main-282` 원문을 읽기 전용 사용한다.
- `no-git.cjs`: Git 하위 프로세스는 실행 전에 차단한다. spawnSync에는 불가 결과를 반환하고 동기 실행에는 USER_GIT_DISABLED를 던진다. 테스트의 원래 Git assertion은 남아 있으며 통과로 바꾸지 않는다.
- 원래 시험/helper/생활 fixture 출처는 `../life-bundle/scripts/`이다. 해당 파일이 이 worktree에는 없어서 필요한 것만 복사했다. 기존 생활 layer/refresh/study pin은 변경하지 않았다.
- 개발보고서 시험의 원본13편·목록은 이 worktree에 seed되지 않았다. `scripts/fixtures/dev-report-283-docs/`에 이전 작업 원문을 바이트 그대로 복사하고 manifest SHA-256을 pin했다. 개발보고서 전용 preload가 이 문서 경로만 메모리에서 제공한다. 실제 `docs/gemini-reports/`는 변경하지 않았다. 51건의 공개 Git cache는 과거 근거를 재사용하며 새 Git 독립 검증이 아니다.
- 생활 시험용 `scripts/fixtures/life-282-baseline/`은 이전 작업의 독립 main-282 snapshot 중 필요한 4파일만 바이트 복사했다. v283→v282 바깥 역변환은 전체 입력/출력 hash와 버전 문자열 수를 검사한다.
- `original-hani-procrastination-*`: 이 작업 시작 시 가져온 기존 보드 시험·browser·cases 원문. 원래 Node assertion 보존을 raw 시험에서 비교한다. CSS/JS before 원문은 `before-*`에 보존했다.
- `baseline.json`: 변경 전 원시 closure168개 및 root runtime 목록/hash. `final-audit.json`: 변경 후 원시 런타임3개·나머지91개 보존 및 closure164. legacy preload를 통과한 가상 closure와 실제 closure를 구분한다.
- `artifact-before/`: office 실행 전 기존 artifacts의 작은 JSON/문서 원문 snapshot. 기존 파일이 바뀌면 새 결과를 이 작업 폴더로 옮겨 보존한 뒤 기존 원문으로 복원한다. 새 산출물 역시 별도로 기록한다.
- Edge 시험은 지정 NODE_PATH와 지정 msedge.exe를 사용한다. 실행 정책 차단으로 PNG·실제 UI PASS는 없다. `../preview-2.html`은 실제 owner를 로컬에서 사용하는 합성 미리보기이며 운영 앱을 열거나 생활 저장소를 읽지 않는다. `edge-profile/`은 실패한 Edge의 임시 폴더로 커밋 대상에서 제외한다.
