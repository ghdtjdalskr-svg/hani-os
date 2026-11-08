from pathlib import Path
import json,re

root=Path(__file__).resolve().parents[2]
out=Path(__file__).resolve().parent
files=sorted(p for p in (root/'scripts').glob('*.test.mjs') if p.name.startswith(('hani-office-','hani-building-')))
results=[]
for file in files:
    log=out/'logs'/(file.name+'.log')
    if not log.exists():
        results.append({'file':file.name,'status':'pending'});continue
    raw=log.read_bytes()
    text=raw.decode('utf-16') if raw[:2] in (b'\xff\xfe',b'\xfe\xff') else raw.decode('utf-8-sig',errors='replace')
    counts={key:int(value) for key,value in re.findall(r'^(?:ℹ|#) (tests|pass|fail|skipped) (\d+)',text,re.M)}
    complete=bool(re.search(r'^(?:ℹ|#) duration_ms ',text,re.M))
    reasons=list(dict.fromkeys(re.findall(r'^\s*(?:AssertionError[^\n]*|TypeError[^\n]*|Error:[^\n]*)',text,re.M)))
    git='GIT_FORBIDDEN_BY_TASK' in text
    results.append({'file':file.name,'status':('pass' if counts.get('fail')==0 else 'git-blocked' if git else 'failed') if complete else 'running','counts':counts,'gitBlocked':git,'reasons':reasons[:8]})
summary={'files':len(files),'completed':sum(r['status'] in ('pass','failed','git-blocked') for r in results),'fileStatus':{s:sum(r['status']==s for r in results) for s in ['pass','git-blocked','failed','running','pending']},'testCounts':{key:sum(r.get('counts',{}).get(key,0) for r in results) for key in ['tests','pass','fail','skipped']},'results':results}
(out/'office-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in summary.items() if k!='results'},ensure_ascii=True))
