from pathlib import Path
import json,re,collections
out=Path('artifacts/save-guard')
groups={};git=[];unverified=[]
for group in ['safety','life','related','office']:
    p=out/(group+'-results.json');rows=json.loads(p.read_text(encoding='utf-8-sig'))
    if isinstance(rows,dict):rows=[rows]
    for row in rows:
        retry=out/('retry-'+row['file']+'-results.json')
        if retry.exists():
            data=json.loads(retry.read_text(encoding='utf-8-sig'));replacement=data[0] if isinstance(data,list) else data
            row['firstAttempt']={k:row.get(k) for k in ['exit','seconds','timeout','summary']}
            row.update(replacement);row['retryEvidence']=retry.name
        if row['exit'] is None:
            row['processExit']=None
            failed=next((int(m[1]) for s in row['summary'] if (m:=re.match(r'# fail (\d+)',s))),None)
            row['exit']=124 if row.get('timeout') else (0 if failed==0 else 1)
            row['exitSource']='completed TAP summary; PowerShell process ExitCode unavailable'
        if row.get('timeout'):status='시간 제한 / 미완료'
        elif row['exit']==0:status='통과'
        elif row.get('gitBlocked'):status='Git 차단'
        elif row.get('browserBlocked'):status='브라우저 차단'
        elif any('Usage:' in s or 'usage:' in s or 'Received undefined' in s or 'eol-map.diff' in s for s in row['summary']):status='과거 baseline/fixture 없음'
        elif row['file']=='hani-drive-vault-precheck.test.mjs':status='자식 Node EPERM'
        elif row['file'] in ['hani-app-216-audit.test.cjs','hani-procrastination-board.test.mjs','hani-tasks-qa-212.test.mjs']:status='수정 전 재현 실패'
        else:status='추가 확인 필요'
        row['status']=status
        if status=='Git 차단':git.append((group,row))
        elif status!='통과':unverified.append((group,row))
    groups[group]=rows
    (out/(group+'-final-results.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
summary={g:dict(collections.Counter(r['status'] for r in rows)) for g,rows in groups.items()}
assert len(groups['office'])==69,'office 전체 파일 수 확인'
(out/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf8')
text=['# 파일별 실행 결과','', '실제 실행 명령과 요약은 각 `*-final-results.json`에 보존한다. 통과하지 못한 항목은 PASS가 아니다.','']
text+=['| 묶음 | 파일 | 결과 |','|---|---|---|']
for group,rows in groups.items():
    for row in rows:text.append(f"| {group} | `{row['file']}` | {row['status']} |")
(out/'RESULTS.md').write_text('\n'.join(text)+'\n',encoding='utf8')
text=['# Git 실행 금지로 미검증인 원래 assertion','', 'Git은 실행 전 차단했으며 assertion을 삭제·완화하지 않았다. 아래 검사는 Git이 허용된 담당 환경에서 다시 실행해야 한다.','']
for group,row in git:
    text.append(f"- {group}: `{row['file']}`")
    text.extend('  - '+s for s in row['summary'] if s.startswith('not ok'))
(out/'GIT-BLOCKED.md').write_text('\n'.join(text)+'\n',encoding='utf8')
text=['# Git 외 미검증·기존 실패','']
for group,row in unverified:
    text.append(f"- {group}: `{row['file']}` — {row['status']}")
    text.extend('  - '+s for s in row['summary'] if s.startswith('not ok') or 'error:' in s)
(out/'UNVERIFIED.md').write_text('\n'.join(text)+'\n',encoding='utf8')
print(json.dumps(summary,ensure_ascii=False))
