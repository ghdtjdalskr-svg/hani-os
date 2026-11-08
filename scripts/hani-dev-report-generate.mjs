import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BEGIN = '<!-- HANI_DEV_REPORT_INDEX_START -->';
const END = '<!-- HANI_DEV_REPORT_INDEX_END -->';
const HEADER = '# 배포 완료 기록';
const VERSION = /^v?(\d+)\.(\d+)\.(\d+)$/;
// Source prose is never copied from Git or handoffs. Public titles/editorial
// still pass this fail-closed check; errors never echo the offending value.
const PRIVATE = [
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,
  /\b(?:01[016789][- .]?\d{3,4}[- .]?\d{4}|\d{6}[- ]?[1-4]\d{6})\b/,
  /(?:₩|[$€£¥])\s*\d|\d[\d,.]*\s*(?:억\s*원|만\s*원|천\s*원|원|달러|엔|유로|USD|KRW|JPY)/i,
  /[일이삼사오육칠팔구십백천]+\s*(?:만|억)\s*원|\b\d{10,16}\b/,
  /\d[\d,.]*\s*(?:kg|㎏|cm|mmHg|mg\/dL|kcal|킬로|킬로그램|퍼센트|%)|(?:BMI|체중|체지방|혈압|혈당|건강\s*수치)\s*[:=]?\s*\d/i,
  /(?:토큰|token|password|passwd|비밀번호|api[ _-]?key|service[ _-]?role|secret|Bearer|access[ _-]?key|refresh[ _-]?key)/i,
  /\b(?:sk[-_][a-z0-9_-]{8,}|gh[pousr]_[a-z0-9_]{8,}|github_pat_[a-z0-9_]+|eyJ[a-z0-9_-]{8,}\.[a-z0-9_-]+\.[a-z0-9_-]+)\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:실명|성명|전화번호|연락처|이메일|계좌번호|주민번호|주소|생년월일)\s*[:=]/,
  /(?:C:\\Users\\|file:\/\/|https?:\/\/(?!github\.com\/ghdtjdalskr-svg\/hani-os(?:\/|$)))/i,
  /(?:하니\s*(?:사원|연구원)|서윤\s*(?:연구원|선임)|도연\s*(?:팀장|연구원)|세린\s*(?:팀장|선임)|유리\s*(?:선임|연구원)|성민\s*대표님)/,
  /\uFFFD|\?\?/,
];

export function assertPublic(text) {
  if (PRIVATE.some(pattern => pattern.test(text))) throw new Error('공개 출력에 금지어 또는 민감 패턴이 있습니다. 원문은 출력하지 않습니다.');
  return text;
}

function version(value) {
  const match = VERSION.exec(value);
  if (!match) throw new Error('버전은 2.9.230 형식이어야 합니다.');
  const numbers = match.slice(1).map(Number);
  if (numbers.some(n => !Number.isSafeInteger(n))) throw new Error('버전 범위가 너무 큽니다.');
  return numbers;
}

function selectedEntries(catalog, from, to) {
  const a = version(from), b = version(to);
  if (a[0] !== b[0] || a[1] !== b[1] || a[2] > b[2] || b[2] - a[2] > 999) throw new Error('같은 major/minor의 오름차순 범위만 지원합니다.');
  const rows = [];
  for (let n = a[2]; n <= b[2]; n++) {
    const id = `v${a[0]}.${a[1]}.${n}`;
    const matches = catalog.entries.filter(e => e.id === id);
    if (matches.length !== 1) throw new Error(`${id}: 릴리스가 없거나 중복입니다. 범위를 임의로 채우지 않습니다.`);
    const row = matches[0];
    if (!['released', 'pages'].includes(row.status) || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
        !Number.isFinite(Date.parse(row.date)) || new Date(row.date).toISOString().slice(0, 10) !== row.date ||
        typeof row.title !== 'string' || !row.title.trim() || /[\r\n|<>]/.test(row.title)) throw new Error(`${id}: 릴리스 형식 오류`);
    assertPublic(row.title);
    rows.push(row);
  }
  return rows;
}

function split(rows, size) {
  if (!Number.isInteger(size) || ![1, 3, 4, 5].includes(size)) throw new Error('group-size는 1, 3, 4, 5만 지원합니다.');
  const result = [];
  // Balance the tail: six releases with size five become three plus three.
  for (let count = Math.ceil(rows.length / size), offset = 0; count; count--) {
    const length = Math.ceil((rows.length - offset) / count);
    result.push(rows.slice(offset, offset += length));
  }
  return result;
}

export function localGit(root, row) {
  const commit = row.source?.commit;
  if (!/^[a-f0-9]{40}$/.test(commit || '')) return { state: 'missing', prs: [] };
  const git = typeof process !== 'undefined' ? (process.env.HANI_GIT_PATH || process.env.HANI_GIT || 'git') : 'git';
  const result = spawnSync(git, ['show', '-s', '--format=%s%n%b', commit, '--'], {
    cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  if (result.error || result.status !== 0) return { state: 'unavailable', prs: [] };
  const prose = result.stdout || '';
  return { state: 'read', prs: [...new Set([...prose.matchAll(/#(\d+)\b/g)].map(m => m[1]))].sort((a, b) => +a - +b) };
}

function handoffs(root, editorial, row) {
  const directory = join(root, 'docs/development-history/handoffs');
  const explicit = editorial.handoffs || [];
  if (explicit.some(f => !/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9-]+\.md$/.test(f))) throw new Error('인수인계 경로 형식 오류');
  const matches = [];
  for (const file of existsSync(directory) ? readdirSync(directory).sort() : []) {
    if (!/^\d{4}-\d{2}-\d{2}-[a-zA-Z0-9-]+\.md$/.test(file) || file === '2026-11-08-dev-report-auto.md') continue;
    // Limit fallback discovery to the release date. Explicit editorial links
    // handle earlier implementation notes without confusing a base version
    // mention with a feature's release identity.
    if (!explicit.includes(file) && !file.startsWith(row.date)) continue;
    const body = readFileSync(join(directory, file), 'utf8');
    const releaseClaim = body.split(/\r?\n/).some(line =>
      new RegExp(`(?:release|배포|운영 반영)[^\\n]{0,60}\\bv?${row.id.slice(1).replaceAll('.', '\\.')}\\b`, 'i').test(line));
    if (explicit.includes(file) || releaseClaim) matches.push(file);
  }
  if (explicit.some(f => !matches.includes(f))) throw new Error(`${row.id}: 지정 인수인계가 없습니다.`);
  return matches;
}

function editorialFor(editorial, row) {
  const value = editorial[row.id];
  if (value) {
    for (const field of ['what', 'why', 'risk']) {
      if (typeof value[field] !== 'string' || !value[field].trim() || /[\r\n|<>]/.test(value[field])) throw new Error(`${row.id}: 편집 문장 형식 오류`);
      assertPublic(value[field]);
    }
    return value;
  }
  return { what: `${row.title} 내용이 릴리스 원장에 등록됐습니다.`,
    why: '회장님이 변경 내용을 한눈에 찾도록 정리했습니다. 기능을 바꾼 구체적인 이유는 담당자 확인이 필요합니다.',
    risk: '제목만으로 세부 동작과 검증 결과를 확정할 수 없어 담당자 확인이 필요합니다.', handoffs: [] };
}

function renderReport(items) {
  const first = items[0].row, last = items.at(-1).row;
  const range = first.id === last.id ? first.id : `${first.id}~${last.id}`;
  const lines = [`# HANI OS ${range} 개발노트`, '', '## 이번 업데이트 한줄 요약', '',
    `성민 회장님, 이번 묶음은 ${first.title}${items.length > 1 ? `부터 ${last.title}까지` : ''}의 변화를 정리했습니다.`, '',
    '| 버전 | 배포일(원장) | 내용 | PR | 현재 상태 | 운영 확인 |', '|---|---|---|---|---|---|'];
  for (const { row, prs } of items) lines.push(`| ${row.id} | ${row.date} | ${row.title} | ${prs.map(p => `#${p}`).join(' · ') || '미확인'} | ${row.status === 'released' ? '원장: 운영 반영' : '원장: Pages 확인'} | 이번 작성에서 재확인하지 않음 |`);
  lines.push('', '## 내가 실제로 체감하는 변화', '');
  for (const { row, note } of items) lines.push(`- **${row.id}**: ${note.what}`);
  lines.push('', '## 왜 바꿨나요?', '', '공개용 제목과 관련 인수인계를 바탕으로 정리한 목적입니다. 원문에 없는 효과를 검증 완료로 판단하지 않았습니다.', '');
  for (const { row, note } of items) lines.push(`- **${row.id}**: ${note.why}`);
  lines.push('', '## 어떻게 확인했나요?', '',
    '- 릴리스 원장에서 범위·날짜·제목·PR 참조를 대조했습니다. 아래 문서는 당시 구현·검증 기록의 참고 자료이며, 기능 시험을 이번에 다시 실행했다는 뜻은 아닙니다.');
  for (const { row, git, links } of items) {
    const state = git.state === 'read' ? '로컬 Git 커밋 제목·본문 확인(PR 본문은 커밋에 남은 부분만)' : git.state === 'missing' ? '원장 커밋 없음: Git 상세 미확인' : '로컬 Git 실행 불가: 커밋·PR 본문 미확인';
    lines.push(`- **${row.id}**: ${state}. ${links.length ? links.map(f => `[인수인계 ${f.slice(0, 10)}](../development-history/handoffs/${f})`).join(' · ') : '연결할 인수인계 미확인.'}`);
  }
  lines.push('', '## 아직 남은 것', '');
  for (const { row, note } of items) lines.push(`- **${row.id}**: ${note.risk}`);
  lines.push('- 이번 문서 작성에서는 운영 화면·실기기·서버·데이터 저장을 재검증하지 않았습니다. 실제 운영 상태는 배포 담당자의 확인 기록을 따릅니다.', '',
    '## 데이터나 안전에 영향이 있나요?', '',
    '- 보고서 생성은 문서와 문서 목록만 씁니다. 앱의 생활 기록·Cloud·설정·런타임 코드는 변경하지 않습니다.',
    '- 개인 생활 원본과 원문 로그를 싣지 않고 공개용 변경 설명과 문서 참조만 담았습니다.', '',
    '## 회장님이 알아둘 점', '',
    '- 새 원고는 검토 대기입니다. 파일 추가만으로 앱에 표시되지 않으며, 서윤 팀장의 릴리스 후속 tooling에서 기존 보고서 번들 반영을 따로 검토해야 합니다.',
    '- 역할 안내: 하니 전무님은 방향 조율, 서윤 팀장(M9 특별 합류)은 후속 tooling, 도연 선임은 구현, 세린 연구원은 보고서 문체, 유리 책임은 품질 검토의 참고 역할입니다. 이번 문서를 이들이 작성·검수했다는 뜻은 아닙니다.', '',
    '출처: [공통 릴리스 원장](../../assets/data/hani-history-releases-v1.json). 위 배포일은 원장 값이며 문서 작성일과 다릅니다.', '',
    '작성: Codex 생성 도구 · 공개용 편집 자료 기반. 세린 연구원의 기존 개발노트 형식 참고. 승인·독립 검토·운영 완료 판정 아님.', '');
  return { range, body: assertPublic(lines.join('\n')) };
}

function indexBlock(reports) {
  const rows = reports.map(r => `| ${r.range} | ${r.date} | [개발노트](${r.file}) | 원고 검토 대기 |`);
  return `${BEGIN}\n## 자동 생성 개발보고서 목록\n\n배포 완료 판정과 원고 검토는 별개입니다. 기존 원자료 표는 위에 보존합니다.\n\n| 버전 | 마지막 릴리스일(원장) | 문서 | 검토 |\n|---|---|---|---|\n${rows.join('\n')}\n${END}`;
}

export function generate(root = ROOT, { from, to = from, groupSize = 1, check = false, gitReader = localGit } = {}) {
  const catalog = JSON.parse(readFileSync(join(root, 'assets/data/hani-history-releases-v1.json'), 'utf8'));
  if (catalog.schema !== 1 || !Array.isArray(catalog.entries)) throw new Error('릴리스 원장 형식 오류');
  const editorialPath = join(root, 'scripts/fixtures/dev-report-editorial-v230-280.json');
  const editorial = existsSync(editorialPath) ? JSON.parse(readFileSync(editorialPath, 'utf8')) : {};
  const rows = selectedEntries(catalog, from, to);
  const directory = join(root, 'docs/gemini-reports');
  const items = rows.map(row => {
    const note = editorialFor(editorial, row), git = gitReader(root, row);
    const prs = [...new Set([...(row.source?.subject || '').matchAll(/#(\d+)\b/g)].map(m => m[1]).concat(git.prs))].sort((a, b) => +a - +b);
    return { row, note, git, prs, links: handoffs(root, note, row) };
  });
  const reports = split(items, groupSize).map(group => {
    const report = renderReport(group), first = group[0].row, last = group.at(-1).row;
    const suffix = first.id === last.id ? first.id : `${first.id}-${last.id.replace(/^v/, '')}`;
    return { ...report, date: last.date, file: `${last.date}-${suffix}-dev-report.md`, versions: group.map(i => i.row.id) };
  });
  // Reject overlapping automatic reports instead of silently duplicating releases
  // when a later invocation uses different range/group boundaries.
  const names = new Set(reports.map(r => r.file));
  for (const file of readdirSync(directory).filter(f => f.endsWith('-dev-report.md') && !names.has(f))) {
    const heading = /^# HANI OS (v[\d.]+)(?:~(v[\d.]+))? 개발노트/m.exec(readFileSync(join(directory, file), 'utf8'));
    if (!heading) throw new Error('기존 자동 보고서 형식 오류');
    const oldStart = version(heading[1]), oldEnd = version(heading[2] || heading[1]);
    if (rows.some(r => {const n = version(r.id); return n[0] === oldStart[0] && n[1] === oldStart[1] && n[2] >= oldStart[2] && n[2] <= oldEnd[2];})) throw new Error('기존 자동 보고서와 버전 범위가 겹칩니다. 기존 묶음을 그대로 재실행하세요.');
  }
  const sourcePath = join(directory, '_SOURCE-release-log.md');
  const source = readFileSync(sourcePath, 'utf8');
  if (!source.startsWith(HEADER) || (source.includes(BEGIN) !== source.includes(END)) || source.split(BEGIN).length > 2 || source.split(END).length > 2 || (source.includes(BEGIN) && source.indexOf(END) < source.indexOf(BEGIN))) throw new Error('원자료 목록 marker 형식 오류');
  // Rebuild the generated index from all generated Markdown, preserving older
  // manual reports and the entire historical source table byte-for-byte.
  const indexed = readdirSync(directory).filter(f => f.endsWith('-dev-report.md') && !names.has(f)).map(file => {
    const body = readFileSync(join(directory, file), 'utf8');
    const range = /^# HANI OS (.+?) 개발노트/m.exec(body)?.[1];
    if (!range) throw new Error('기존 자동 보고서 제목 누락');
    return { file, range, date: file.slice(0, 10) };
  }).concat(reports).sort((a, b) => a.date.localeCompare(b.date) || a.file.localeCompare(b.file, 'en', { numeric: true }));
  const block = assertPublic(indexBlock(indexed));
  const nextSource = source.includes(BEGIN) ? source.slice(0, source.indexOf(BEGIN)) + block + source.slice(source.indexOf(END) + END.length) : source + '\n' + block + '\n';
  const writes = reports.map(r => [join(directory, r.file), r.body]).concat([[sourcePath, nextSource]]);
  const changed = writes.filter(([file, text]) => !existsSync(file) || readFileSync(file, 'utf8') !== text);
  // Finish all validation before the first write. Never call the runtime builder.
  if (!check) for (const [file, text] of changed) writeFileSync(file, text, 'utf8');
  return { exitCode: check && changed.length ? 1 : 0, reports, changed: changed.map(([file]) => file),
    gitUnavailable: items.filter(i => i.git.state !== 'read').length, releaseCount: rows.length };
}

export function runCli(args, root = ROOT) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--check') options.check = true;
    else if (['--from', '--to', '--group-size'].includes(arg)) {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('옵션 값 누락');
      options[{ '--from': 'from', '--to': 'to', '--group-size': 'groupSize' }[arg]] = arg === '--group-size' ? Number(args[++i]) : args[++i];
    } else if (!options.from && !arg.startsWith('--')) {
      const range = arg.split(/~|\.\./);
      if (range.length > 2) throw new Error('범위 형식 오류');
      [options.from, options.to = range[0]] = range;
    } else throw new Error('알 수 없는 옵션');
  }
  if (!options.from) throw new Error('Usage: node scripts/hani-dev-report-generate.mjs 2.9.230~2.9.280 [--group-size 4] [--check]');
  return generate(root, options);
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = runCli(process.argv.slice(2));
    console.log(`개발보고서 ${result.reports.length}편 / 릴리스 ${result.releaseCount}건 / 변경 ${result.changed.length}파일 / Git 상세 미확인 ${result.gitUnavailable}건. 앱 번들 반영은 별도입니다.`);
    process.exitCode = result.exitCode;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
