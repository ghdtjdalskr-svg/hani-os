# 2026-11-07 배포 파일 한도 200개

- 담당: 서윤(Claude) / branch hani/gate-capacity-200 / base 507c344
- 회장님 승인(11/7): 배포 파일 159/160로 동행 캐릭터 그림을 넣으면 꽉 찬다는 설명 뒤 "올려줘".
- 변경: 게이트 계약 2.0.10 → 2.0.11, max_files 160 → 200. hani-deploy-bridge의 MAX_RELEASE_FILES와 계약 해시(bd2493be…) 일치. 총 25MB, 단일 5MB 한도와 저장·Cloud 데이터 경로는 그대로.
- 시험: 게이트 용량 시험 200 허용 / 201 거부, closure 상한 검사 160 → 200.
- 순서: 이 PR 머지 직후 `supabase functions deploy hani-deploy-bridge --project-ref qmgikfdwjzmhkwadycxk --use-api --no-verify-jwt`. 서버 배포 전에는 main 계약과 서버 해시가 달라 새 릴리스가 막힌다.
- 위험: 서버가 파일을 4개씩 읽어 파일 수가 늘면 검증 시간이 길어진다. 총 25MB 한도는 그대로라 큰 그림은 여전히 제한된다.
