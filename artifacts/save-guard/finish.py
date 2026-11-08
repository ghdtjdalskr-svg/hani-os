from pathlib import Path
import json
root=Path('.').resolve();out=root/'artifacts/save-guard'
current=root/'docs/development-history/CURRENT.md'
prefix='''# 2026-11-08 · 저장 안전장치 01+07 (Codex / audit-safe)

`hani/audit-safety-284` / 착수·최종 HEAD `3ab1177` / 로컬 origin/main 참조 `5c375d9`(Git 금지·원격 새 조회 없음). **다른 탭 저장 잠금·입력 보존 안내, Cloud 수신 기존 validator 적용**. 운영 변경은 hani-main.js 하나, 표시/cache2.9.284·내부 버전·보호 키 유지, localStorage setItem18→18/remove5→5/clear0→0. **신규10/10·syntax14/14·closure164불변/누락0, 전체122명령67통과·Git38차단·기타차단14·수정전재현실패3. office69파일41통과/28Git차단·744통과/36차단/3skip·Git외실패0.** Edge는 spawn EPERM 및 Windows IPC Access denied로 실제 두 탭·1280/390 PNG 미검증. 생성JSON4복원·신규시험JSON1제거·범위밖변경0. Git/commit/push/merge/버전증가/배포 없음, **서윤 검토·커밋 및 차단 검증 대기**. Notion insert_content는 자동 승인 never 거절로 미반영. [보고서](../../artifacts/save-guard/REPORT.md) · [인수인계](handoffs/2026-11-08-save-guard.md). 아래 기존 기록 보존.

'''
data=current.read_bytes()
if not data.startswith(prefix.splitlines()[0].encode('utf8')):
    current.write_bytes(prefix.replace('\n','\r\n').encode('utf8')+data)
preservation=json.loads((out/'workspace-preservation.json').read_text(encoding='utf8'))
preservation['removedNewGeneratedJson']=['artifacts/qa-210/node-evidence.json']
if 'docs/development-history/CURRENT.md' not in preservation['intentionalChangesSinceSnapshot']:
    preservation['intentionalChangesSinceSnapshot'].append('docs/development-history/CURRENT.md')
(out/'workspace-preservation.json').write_text(json.dumps(preservation,ensure_ascii=False,indent=2),encoding='utf8')
log=out/'unit-final.log'
if log.exists():
    b=log.read_bytes();s=b.decode('utf16') if b.startswith((b'\xff\xfe',b'\xfe\xff')) else b.decode('utf-8-sig')
    log.write_text(s,encoding='utf8')
names=['hani-main.before.txt','index.before.txt','patch.py','edits.json','prepare-inverse.py','snapshot.py','finalize-scope.py','extend-raw-inverse.py','workspace-before.json.gz','probe-out.log','probe-err.log','probe-pid.txt','edge-pid.txt','edge-profile-path.txt','edge-stdout.log','edge-stderr.log','current-out.log','current-err.log','cleanup.py']
for p in [*(out/name for name in names),*out.glob('fail-*.log')]:
    assert p.resolve().is_relative_to(out)
    if p.exists():p.unlink()
print('CURRENT summary appended; original history preserved; temporary source copies and verbose logs removed')
