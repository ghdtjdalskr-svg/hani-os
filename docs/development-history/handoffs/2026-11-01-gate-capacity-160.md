# 2026-11-01 배포 파일 한도 160개

- 담당: 서윤(Claude) / branch hani/gate-capacity-160 / base 4005344
- 회장님 요청: "배포파일한도는 늘려서 배포해줘"
- 변경: 게이트 계약 2.0.9 → 2.0.10, max_files 128 → 160. hani-deploy-bridge의 MAX_RELEASE_FILES와 계약 해시 일치. 총 25MB, 단일 5MB 한도와 저장·Cloud 경로는 그대로.
- 시험: 파일 수 고정 시험을 160개 이하 검사로 변경.
- 순서: 이 PR 머지 직후 `supabase functions deploy hani-deploy-bridge --project-ref qmgikfdwjzmhkwadycxk --use-api --no-verify-jwt`. 서버 배포 전에는 main 계약과 서버 해시가 달라 새 릴리스가 막힌다.
- 남은 일: hani-main.js 복구용 패키지 접수의 128 고정값은 다음 런타임 릴리스에서 160으로 변경. 일반 배포 경로는 쓰지 않는다.
- 위험: 서버가 파일을 4개씩 읽어 파일 수가 늘면 검증 시간이 길어진다. 2.9.251 때 Failed to fetch가 한 번 있었고 원인은 미확인.