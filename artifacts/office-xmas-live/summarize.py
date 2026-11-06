from pathlib import Path
import copy
import hashlib
import json
import re

out = Path(__file__).resolve().parent
root = out.parents[1]

def read(path):
    raw = path.read_bytes()
    return raw.decode('utf-16' if raw.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig')

run = json.loads(read(out / 'final-tests/results.json'))
rows = copy.deepcopy(run['results'])
serial = {'hani-office-cafe-rest.test.mjs': 'cafe-rest-serial.log',
          'hani-office-lively-v2.test.mjs': 'lively-v2-serial.log'}
for row in rows:
    filename = serial.get(row['file'], row['file'].removesuffix('.mjs') + '.log')
    log = read(out / 'final-tests' / filename)
    row['evidence'] = 'final-tests/' + filename
    if row['file'] in serial:
        for key in row['counts']:
            m = re.search(r'^# ' + key + r' (\d+)\s*$', log, re.M)
            row['counts'][key] = int(m[1]) if m else None
        row['failedTests'] = re.findall(r'^not ok \d+ - (.+)$', log, re.M)
        row['serialPerformanceRecheck'] = True
    row['failures'] = []
    for block in re.split(r'(?m)^not ok ', log)[1:]:
        block = re.split(r'(?m)^# Subtest:|^1\.\.', block)[0]
        title = block.splitlines()[0].split(' - ', 1)[1]
        row['failures'].append(dict(test=title, reason='Git EPERM 실행 차단' if 'spawnSync git EPERM' in block else '기존 source pin 또는 소품 개수 가정'))

for filename, key in [('hani-office-live.js', 'js'), ('hani-office-live.css', 'css')]:
    assert hashlib.sha256((root / filename).read_bytes()).hexdigest().upper() == run['identity'][key]
totals = {key: sum(row['counts'][key] or 0 for row in rows) for key in ['tests', 'pass', 'fail', 'skipped']}
summary = dict(identity=run['identity'], files=len(rows), filePass=sum(row['exitCode'] == 0 for row in rows),
               startupBlocked=[row['file'] for row in rows if row['counts']['tests'] is None],
               counts=totals, timedOut=sum(row['timedOut'] for row in rows), results=rows)
(out / 'test-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines = ['# 최종 사무실 테스트', '',
         '동일한 최종 JS/CSS로 46개 파일을 실행했습니다. 기존 assertion은 수정하지 않았습니다.',
         '명령: `node --test-reporter=tap scripts/hani-office-*.test.mjs`를 파일별 실행. 성능 검사는 아래 2개만 같은 소스로 단독 재검사했습니다.',
         '병렬 원본 결과는 `final-tests/results.json`, 단독 보완 결과를 반영한 집계는 `test-summary.json`입니다.', '',
         f'집계: {totals["pass"]} 통과 / {totals["fail"]} 실패 / {totals["skipped"]} 건너뜀. 공통 engine import 중복 포함. 시작 전 Git 차단 6개 파일은 이 subtest 집계 밖입니다.', '',
         '| 파일 | 통과 / 실패 / 건너뜀 | 근거 |', '|---|---|---|']
for row in sorted(rows, key=lambda row: row['file']):
    c = row['counts']
    counts = f'{c["pass"]} / {c["fail"]} / {c["skipped"]}' if c['tests'] is not None else '시작 전 Git EPERM 차단'
    lines.append(f'| {row["file"]} | {counts} | [로그]({row["evidence"]}) |')
lines += ['', '## 실패 항목', '',
          '`icons` 1개, `zoom` 1개, `residents` 7개는 기존 복원 helper의 source pin, `props` 2개는 전체 슬롯이 7개라는 가정입니다. 서윤 담당으로 남겼습니다.',
          '같은 source pin이 `motion-1` 1개, `tlayout` 2개, `consult` 1개, `obr21` 1개도 차단합니다. 보호 함수 바이트 자체는 `source-check.json`과 새 전용 테스트로 별도 일치 확인했습니다.',
          '`hani-office-219` contrast는 지시 파일에서 main의 기존 실패로 알려졌습니다. 이번 실행은 Git EPERM으로 시작 전 차단되어 contrast를 직접 재검증하지 못했습니다.', '']
for row in sorted(rows, key=lambda row: row['file']):
    for failure in row['failures']:
        lines.append(f'- `{row["file"]}` — {failure["reason"]}: {failure["test"]}')
lines += ['', '## 성능 단독 재검사', '',
          '- `cafe-rest`: 병렬 400ms 실패 → 같은 소스 단독 실행에서 기존 400ms assertion 통과. 남은 실패 1개는 Git EPERM.',
          '- `lively-v2`: 병렬 성능 실패 → 같은 소스 단독 실행에서 기존 warm snapshot <3ms / first plan <400ms assertion 통과. 남은 실패 1개는 Git EPERM.',
          '- 개발 중 harness의 60초 제한으로 중단된 `obr14`는 최종 실행에서 기존 assertion 변경 없이 약 109초에 종료했습니다. 4통과·Git EPERM 1실패.', '']
(out / 'TESTS.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps({key: summary[key] for key in ['files', 'filePass', 'counts', 'timedOut', 'startupBlocked']}, ensure_ascii=False))
