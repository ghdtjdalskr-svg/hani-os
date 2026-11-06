import json,re,pathlib,hashlib
p=pathlib.Path(__file__).parent
def read(path):
    b=path.read_bytes()
    return b.decode('utf-16' if b.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig')
raw=json.loads(read(p/'round2-tests/results.json'))
rows=raw['results']
summary={'identity':raw['identity'],'files':len(rows),'successfulFiles':sum(r['exitCode']==0 for r in rows),
         'counts':{k:sum(r['counts'].get(k) or 0 for r in rows) for k in ['tests','pass','fail','skipped','cancelled']},
         'startupBlocked':[r['file'] for r in rows if r['counts']['tests'] is None], 'failures':[], 'baseline':{}}
for r in rows:
    log=read(p/'round2-tests'/r['file'].replace('.mjs','.log'))
    for m in re.finditer(r'(?ms)^not ok (\d+) - ([^\n]+)\n(.*?)(?=^# Subtest:|^\d+\.\.\d+|^ok \d|^not ok |\Z)',log):
        body=m[3];err=re.search(r'(?m)^  error: (.*)',body)
        if err and err[1]=='|-':
            lines=body[err.end():].splitlines()
            error=' '.join(x.strip() for x in lines[1:6])[:350]
        else:error=err[1] if err else ''
        category='Git EPERM 차단' if 'spawnSync git EPERM' in body else 'pin/기존 기대값 확인 (서윤)'
        if r['file']=='hani-office-residents.test.mjs' and not re.search(r'[0-9a-f]{64}',body):category='기존 동작/기대값 불일치 (서윤, 수정 전 재현)'
        summary['failures'].append({'file':r['file'],'number':int(m[1]),'name':m[2].strip(),'category':category,'error':error})
for name in ['residents','props','xmas']:
    before=read(p/f'round2-baseline-{name}.log');after=read(p/f'round2-tests/hani-office-{name}.test.log')
    counts=lambda text:{kind:int(re.search(r'(?m)^# '+kind+r' (\d+)',text)[1]) for kind in ['pass','fail']}
    failures=lambda text:[s.strip() for s in re.findall(r'(?m)^not ok \d+ - (.*)',text)]
    summary['baseline'][name]={'before':counts(before),'after':counts(after),'sameFailedNames':failures(before)==failures(after)}
identity={ext:hashlib.sha256(pathlib.Path('hani-office-live.'+ext).read_bytes()).hexdigest().upper() for ext in ['js','css']}
assert identity==raw['identity'],'final source no longer matches test run'
browser=json.loads(read(p/'round2-browser-check.json'))
assert len(browser)==8
assert all(x['above'] for row in browser for x in row.get('stacking',[]))
summary['browser']={'screenshots':len(browser),'paintChecks':sum(len(row.get('stacking',[])) for row in browser),'petLabelOverlaps':sum(len([x for x in row['giftLabelOverlaps'] if x['person'].startswith('pet-')]) for row in browser if row['floor']=='1f')}
(p/'round2-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
lines=['# 2차 사무실 테스트 상세', '', '명령: `node --test-reporter=tap scripts/<파일>` (46개 전체). 원래 assertion 파일은 SHA256 46개 일치, 수정 0개.', '',
       f"총 {summary['counts']['pass']}통과 / {summary['counts']['fail']}실패 / {summary['counts']['skipped']}건너뜀. 시작 전 Git 차단 {len(summary['startupBlocked'])}개 파일은 집계형 subtest 수와 별개.", '',
       '## 서윤 확인 및 Git 차단', '', '| 파일 / subtest | 분류 | 실패 이름·근거 |','|---|---|---|']
for f in summary['failures']:
    lines.append('| '+f['file'].replace('hani-office-','')+' #'+str(f['number'])+' | '+f['category']+' | '+(f['name']+' — '+f['error']).replace('|','\\|').replace('\n',' ')+' |')
lines+=['', '## 시작 전 차단', '', *['- `'+f+'`: `spawnSync git EPERM`.' for f in summary['startupBlocked']], '',
        '- `node scripts/hani-office-pets-bubble.test.mjs`: 파일 없음 (`MODULE_NOT_FOUND`), 실행 차단. 현재 배포 변경은 residents/bubble-close 테스트에 일부 포함되어 있으며 요청 파일을 새로 만들거나 통과로 대체하지 않음.', '',
        '## 수정 전 재현', '', '실행: `node --test-reporter=tap --require ./artifacts/office-xmas-live/round2-baseline-loader.cjs scripts/hani-office-{residents,props,xmas}.test.mjs` (파일별 각각 실행).', '',
        '테스트 assertion은 그대로 두고 JS/CSS 읽기만 착수 시 원본으로 치환한 읽기 전용 검증.']
for name,item in summary['baseline'].items():lines.append(f"- {name}: 수정 전 {item['before']}, 수정 후 {item['after']}; 실패 이름 동일={item['sameFailedNames']}.")
lines+=['', 'xmas의 추가 1건은 승인된 선물/눈꽃 좌표와 이전 literal 기대값의 불일치. 기존 보호 baseline은 v2.9.268 통합 변경을 반영하지 않아 수정 전에도 실패. 기존 assertion을 삭제·완화하거나 pin을 갱신하지 않음.', '',
        '주민 18실패에는 hash pin 외에도 인원/DOM write/방문/pose top/낮 층/주기·속도·pause 기대값 불일치가 포함됨. 전부 pin 실패라고 부르지 않음. 수정 전 18개 실패 이름이 동일함.', '',
        '최종 소스 SHA256은 `round2-tests/results.json`의 identity와 일치. 중간 소스 검사는 최종 집계에 사용하지 않음. 전체 로그는 `round2-tests/`, 기계 집계는 `round2-summary.json`.']
(p/'ROUND2-TESTS.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({k:summary[k] for k in ['files','successfulFiles','counts','baseline','browser']},ensure_ascii=False))
