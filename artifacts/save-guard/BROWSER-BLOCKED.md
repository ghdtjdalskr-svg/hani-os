# Edge 실제 앱 검증 차단

- 요청한 시험은 `scripts/hani-save-guard.browser.mjs`에 준비했다. 합성 browser context, 동일 context의 A/B 두 탭, 외부 요청 차단, A 저장→B 차단, 원본·메모리·입력값 보존, 직접 새로고침 후 최신 기록, Cloud 정상/이상 및 안전 사본을 검사한다.
- 성공하면 `conflict-1280.png`, `conflict-390.png`, `browser-results.json`을 만든다. 이번 실행에서는 해당 성공 산출물이 만들어지지 않았다.
- Node 24.20.0 및 제공 런타임 Node 24.22.1에서 Edge 직접 실행은 모두 `browserType.launch: spawn EPERM`으로 시작하지 못했다.
- PowerShell `Start-Process -WindowStyle Hidden`으로 합성 임시 프로필을 열고 CDP 연결도 시도했다. 분리 실행은 `ECONNREFUSED`, 같은 실행 안에서는 WebSocket 연결 후 `1006` 종료 및 30초 timeout으로 앱 검사에 도달하지 못했다.
- 마지막 확인에서 Edge 표준 옵션(`--no-sandbox` 포함)으로도 동일했다. stderr에는 `FATAL: mojo ... platform_channel.cc:187` / `액세스가 거부되었습니다. (0x5)`와 crash server 실행 실패가 남았다. Windows IPC 접근 거부로 브라우저 프로세스가 종료되는 실행환경 제약이며, 더 반복 실행하지 않았다.
- 기존 backup-history / cloud-stability / offline-entry / quality-data runtime 시험도 직접 실행을 시도했으나 같은 Edge launch EPERM으로 차단됐다.
- `scripts/hani-save-guard.test.mjs`의 DOM 대역 단위 시험은 실제 Edge 화면 확인을 대신하지 않는다. PC/폰 실제 레이아웃·두 탭 storage 이벤트 전달·스크린샷은 **미검증**이다.

재실행 명령 (실행이 허용된 환경):

```powershell
node scripts/hani-save-guard.browser.mjs <playwright/index.mjs> <Edge.exe 또는 CDP HTTP 주소>
```

운영 프로필·운영 기록·실제 Cloud 계정은 사용하지 않았다. 성공한 화면 근거가 없으므로 PASS로 기록하지 않는다.
