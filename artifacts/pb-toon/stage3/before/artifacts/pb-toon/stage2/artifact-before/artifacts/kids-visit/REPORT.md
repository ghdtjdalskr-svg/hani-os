# 남매 직원 방문 대화

- Codex / hani/office-companions / base 59db365. 기존 companion·rhythm·tick·단일 bubble owner 확장. 25세트 원문 그대로 내장·실제 ID 전부 연결(미매핑 0). 30~60초 방문·남매 이동/복귀·가까운 대상 탭 우선·KST 일일 순번·rare 1/10. 저장/새 timer/listener/runtime 파일 0, closure 161.
- 전용 10/10(공통 포함 16/16), 기존 순찰 15/15·활발 15/15, syntax 6/6. 전체 지정 65파일 **698통과 / Git EPERM 29차단 / skip 5 / 그 외 실패 0**. 전체 PASS는 아님. [근거](final-regression/summary.json). 278 원래 assertion·성능 임계값 유지, strict 방문 확장 추가.
- 실제 10분: 방문 13회·대상 5명. 순찰 첫 220초: 1층5회/4명·3층5회/4명(서윤 먼저)·5층4회/1명·2층5회/3명. **5층은 해당 시간에 치즈만 가능하므로 서로 다른 2~3명 보장 미충족**. 직원/주민 일정 변경 안 함.
- Edge156 PC·390px [서윤](seoyun-390.png) / [은하](eunha-390.png), 각 PC PNG도 보존. 폰 이름표·bubble 교차0, 가로 넘침·오류0. PC 서윤 bubble/name 교차2건 남음. 은하는 실제 야간 슬롯+브라우저 시험에서만 회장님 1층 배치한 합성 시나리오. [화면 근거](browser-results.json).
- 로컬 표시/cache **2.9.276 그대로**(과제 설명의 2.9.277과 다름). index/main/CSS/atlas/manifest 보호, Git 원본7항목 읽기 대조 일치.
- **미커밋**: git 명령 미제공·subprocess EPERM, staging 차단. push/merge/배포/버전 변경 없음. Notion 쓰기는 자동 승인 검토가 approval policy never로 거절하여 갱신 대기. 운영·독립 Arin/HINA 미검증.
