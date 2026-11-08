from pathlib import Path
import json,re,copy
out=Path(__file__).resolve().parent
raw=json.loads((out/'office-summary.json').read_text(encoding='utf-8'))
assert raw['completed']==raw['files']==73
final=copy.deepcopy(raw)
def readlog(name):
    b=(out/'logs'/name).read_bytes()
    return b.decode('utf-16') if b[:2] in (b'\xff\xfe',b'\xfe\xff') else b.decode('utf-8-sig')
def counts(text):return {k:int(v) for k,v in re.findall(r'^(?:ℹ|#) (tests|pass|fail|skipped) (\d+)',text,re.M)}
for row in final['results']:
    name=row['file']
    if name=='hani-building-206-safety.test.mjs':
        text=readlog('building-safety-with-baseline-path.log')
        assert 'GIT_FORBIDDEN_BY_TASK' in text and 'TypeError' not in text
        row.update(status='git-blocked',gitBlocked=True,retest='logs/building-safety-with-baseline-path.log',reasons=['Expected baseline directory supplied; actual Git baseline lookup blocked.'])
    elif name=='hani-office-barista-night.test.mjs':
        text=readlog('barista-night-version284-retest.log')
        assert counts(text)['pass']==1 and counts(text)['fail']==0 and row['counts']['fail']==1
        row['counts']['pass']+=1;row['counts']['fail']-=1
        row.update(status='pass',retest='logs/barista-night-version284-retest.log',reasons=[])
    elif name=='hani-office-barista-night-273-pins.test.mjs':
        text=readlog('barista-273-version284-retest.log');n=counts(text)
        assert n['tests']==row['counts']['tests'] and n['pass']==4 and n['fail']==1 and 'AssertionError' not in text and 'GIT_FORBIDDEN_BY_TASK' in text
        row.update(counts=n,status='git-blocked',retest='logs/barista-273-version284-retest.log',reasons=['Fixed Git release blobs blocked; all four local exact preservation assertions passed.'])
    elif name in ('hani-office-cafe-rest.test.mjs','hani-office-lively-v2.test.mjs'):
        log='cafe-performance-retest.log' if name=='hani-office-cafe-rest.test.mjs' else 'lively-performance-retest.log'
        assert counts(readlog(log))['fail']==1
        row.update(status='mixed-git-and-performance',retest='logs/'+log)
final['fileStatus']={s:sum(r['status']==s for r in final['results']) for s in ['pass','git-blocked','mixed-git-and-performance','failed']}
final['testCounts']={k:sum(r['counts'].get(k,0) for r in final['results']) for k in ['tests','pass','fail','skipped']}
final['testCounts']['nonGitFailures']=3
final['testCounts']['gitBlocked']=final['testCounts']['fail']-3
assert final['testCounts']=={'tests':812,'pass':769,'fail':39,'skipped':4,'nonGitFailures':3,'gitBlocked':36}
final['notes']=['Initial full run kept in office-results.json and office-summary.json. Only demonstrated retests reconcile final results.','No Git command executed. No assertion, pin or timing threshold weakened.','Office evidence is the unchanged projected lower owner; this is not current newsroom UI or release QA evidence.']
(out/'office-final-summary.json').write_text(json.dumps(final,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
blocked=[r['file'] for r in final['results'] if r.get('gitBlocked')]
fragment='''## office 전체 최종 결과

기존 runner와 같은 `hani-office-*.test.mjs` + `hani-building-*.test.mjs` **73파일 전부 실행**했습니다. 초회 원문은 `office-results.json`·`office-summary.json`, 확인된 재실행만 반영한 최종본은 `office-final-summary.json`입니다.

| 항목 | 결과 |
|---|---:|
| 전체 test case | 812 |
| 통과 | 769 |
| Git 기준 조회 차단 | 36 |
| Git 외 실패 | 3 |
| 기존 skip | 4 |

파일 기준으로는 **43개 전부 통과, 27개 Git 차단만, 2개 Git 차단+성능 실패, 1개 별도 실패**입니다. 저장·Cloud·서버·Git write는 하지 않았습니다. 표시는 이 개발 환경의 결과이며 Release PASS가 아닙니다.

### 남은 실패 3건

1. `hani-building-206.test.mjs` — 3층 background가 `floor-3f-215.webp`라는 기존 기대와 현행 `floor-3f-218.webp`가 불일치합니다. 뉴스룸 패치가 바꾸지 않은 office owner입니다.
2. `hani-office-cafe-rest.test.mjs` — 기존 cold plan **400ms 미만** 기준 실패. 단독 재실행도 최소 **484.7981ms**였습니다.
3. `hani-office-lively-v2.test.mjs` — 기존 cold full-day plan **400ms 미만** 기준 실패. 단독 재실행도 최소 **500.2187ms**였습니다. warm snapshot은 **1.1845ms**, 기존 3ms 미만 기준을 충족했습니다.

두 성능 실패는 전체 시험 종료 뒤 해당 assertion만 한 번씩 재실행해도 남았습니다. 기준 완화·assertion 삭제·범위 밖 성능 코드는 수정하지 않았습니다.

### 기준/환경 차이 정리

- 273 보존 검사의 284/283 버전 차이는 정확한 바깥 역변환 후 재실행에서 해소됐습니다. barista night의 해당 보존 assertion PASS, 273 pin 파일은 로컬4 PASS·Git1 차단입니다.
- building safety는 원래 필요한 export 경로가 없는 CLI 호출에서 시작 실패했습니다. canonical 예상 경로를 명시한 재실행에서는 실제 Git 원문 조회에서 차단되는 것을 확인해 Git 차단으로 분류했습니다. 가짜 baseline은 제공하지 않았습니다.
- `219`는 과제에서 원래 실패한다고 명시한 항목입니다. 여기서는 Git 조회가 먼저 차단되어 원래 실패 assertion까지 재현하지 못했습니다.
- 이전 원문 JSON 부산물4개(`obr16/17/19-layout-node.json`, `office-drama/reachability.json`)는 runner가 원래 바이트로 복원했습니다.
- 검증 중 적용한 UI·284 inverse는 원래 lower owner의 전체 SHA를 유지합니다. office 결과를 최신 뉴스룸 실제 화면·최종 릴리스의 PASS로 사용하지 않습니다.

### Git 차단 파일 목록 (29개, 성능 실패 동반 2개 포함)

```text
'''+ '\n'.join(blocked)+ '\n```\n'
(out/'office-summary.md').write_text(fragment,encoding='utf-8')
print(json.dumps({'fileStatus':final['fileStatus'],'testCounts':final['testCounts'],'blockedFiles':len(blocked)},ensure_ascii=True))
