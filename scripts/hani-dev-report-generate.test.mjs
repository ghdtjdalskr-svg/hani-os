import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { generate, runCli, assertPublic, localGit } from './hani-dev-report-generate.mjs';
import {restoreLifeLayer,lifeHash,lifeRefresh,restoreLifeReportRefresh} from './hani-life-bundle-source.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'hani-dev-report-test-'));
const directory = join(temp, 'docs/gemini-reports');
const catalogPath = join(temp, 'assets/data/hani-history-releases-v1.json');
const handoff = '2026-11-07-example.md';
const source = '# 배포 완료 기록\r\n\r\n| 버전 | 날짜 | 내용 | 분야 | PR | 운영 확인 | 메모 |\r\n|---|---|---|---|---|---|---|\r\n| v2.9.229 | 2026-10-22 | 과거 원자료 | 화면 | #328 | 당시 기록 | 보존 |\r\n';
const gitReader = () => ({ state: 'read', prs: ['501'] });
let groups = 0;
function pass(name) { groups++; console.log(`PASS ${name}`); }
function fixture(entries) { writeFileSync(catalogPath, JSON.stringify({ schema: 1, entries })); }
function entry(n) { return { id: `v2.9.${n}`, date: '2026-11-07', status: 'released', title: `사무실 안내 ${n}`, source: { commit: 'a'.repeat(40), subject: `release: v2.9.${n} (#${n})` } }; }
function bytes() { return Object.fromEntries(readdirSync(directory).map(f => [f, readFileSync(join(directory, f), 'utf8')])); }
try {
  for (const dir of ['docs/gemini-reports', 'docs/development-history/handoffs', 'assets/data', 'scripts/fixtures']) mkdirSync(join(temp, dir), { recursive: true });
  writeFileSync(join(directory, '_SOURCE-release-log.md'), source);
  writeFileSync(join(directory, '2026-10-22-v2.9.229-legacy.md'), '# 보존할 수동 보고서\r\n');
  writeFileSync(join(temp, 'hani-main.js'), 'RUNTIME SENTINEL\r\n');
  fixture(Array.from({ length: 6 }, (_, i) => entry(i + 230)).reverse());
  writeFileSync(join(temp, 'docs/development-history/handoffs', handoff), '# 참고\nrelease v2.9.230\n성명: 테스트인물\n잔액: 123456원\n미검증\n');
  const result = generate(temp, { from: '2.9.230', to: 'v2.9.235', groupSize: 5, gitReader });
  assert.equal(result.reports.length, 2);
  assert.deepEqual(result.reports.map(r => r.versions.length), [3, 3]);
  assert.deepEqual(result.reports.flatMap(r => r.versions), Array.from({ length: 6 }, (_, i) => `v2.9.${230 + i}`));
  for (const report of result.reports) {
    assert.match(report.body, /^# HANI OS v2\.9\.\d+~v2\.9\.\d+ 개발노트\n/);
    for (const section of ['이번 업데이트 한줄 요약', '내가 실제로 체감하는 변화', '왜 바꿨나요?', '어떻게 확인했나요?', '아직 남은 것', '데이터나 안전에 영향이 있나요?', '회장님이 알아둘 점']) assert.ok(report.body.includes(`## ${section}`));
    assert.equal(assertPublic(report.body), report.body);
    assert.match(report.body, /서윤 팀장\(M9 특별 합류\)/);
    assert.ok(!report.body.includes('테스트인물') && !report.body.includes('123456'));
    assert.ok(report.body.length < 100000);
  }
  assert.match(result.reports[0].body, /#230 · #501/);
  assert.match(result.reports[0].body, /인수인계 2026-11-07/);
  assert.ok(readFileSync(join(directory, '_SOURCE-release-log.md'), 'utf8').startsWith(source));
  assert.equal(readFileSync(join(directory, '2026-10-22-v2.9.229-legacy.md'), 'utf8'), '# 보존할 수동 보고서\r\n');
  assert.equal(readFileSync(join(temp, 'hani-main.js'), 'utf8'), 'RUNTIME SENTINEL\r\n');
  pass('형식·3~5개 균등 묶음·범위 정확·캐릭터 직급·원자료/수동 보고서/runtime 바이트 보존');

  const first = bytes();
  const repeat = generate(temp, { from: '2.9.230', to: '2.9.235', groupSize: 5, gitReader });
  assert.equal(repeat.changed.length, 0);
  assert.deepEqual(bytes(), first);
  assert.equal(generate(temp, { from: '2.9.230', to: '2.9.235', groupSize: 5, gitReader, check: true }).exitCode, 0);
  writeFileSync(join(directory, result.reports[0].file), '원고 변경');
  assert.equal(generate(temp, { from: '2.9.230', to: '2.9.235', groupSize: 5, gitReader, check: true }).exitCode, 1);
  assert.equal(readFileSync(join(directory, result.reports[0].file), 'utf8'), '원고 변경');
  generate(temp, { from: '2.9.230', to: '2.9.235', groupSize: 5, gitReader });
  pass('같은 입력·출처의 출력 완전 동일, 두 번째 write 0, check drift 감지·쓰기 0');

  const before = bytes();
  for (const opts of [
    { from: '2.9.235', to: '2.9.230' }, { from: '2.9.230', to: '3.0.235' },
    { from: '../../x', to: '2.9.230' }, { from: '2.9.230', to: '2.9.236' },
    { from: '2.9.230', to: '2.9.235', groupSize: 2 },
    { from: '2.9.230', to: '2.9.234', groupSize: 4 },
  ]) assert.throws(() => generate(temp, { gitReader, ...opts }));
  fixture([entry(230), entry(230)]);
  assert.throws(() => generate(temp, { from: '2.9.230', gitReader }));
  fixture([{ ...entry(230), status: 'preview' }]);
  assert.throws(() => generate(temp, { from: '2.9.230', gitReader }));
  fixture([{ ...entry(230), date: '2026-02-30' }]);
  assert.throws(() => generate(temp, { from: '2.9.230', gitReader }));
  assert.deepEqual(bytes(), before);
  pass('잘못된 범위·누락·중복·미배포·잘못된 날짜·기존 묶음 중복은 쓰기 전 차단');

  const privateSamples = ['성명: 홍길동', '이메일: example@example.invalid', '010-1234-5678', '900101-1234567',
    '잔액 12,345원', '예산 $123', '연봉 삼천만 원', '체중 72.5kg', 'BMI 24.5', '체지방 18%',
    '혈압 120mmHg', '혈당 99mg/dL', 'password=synthetic', 'Bearer synthetic', 'API_KEY=synthetic',
    'sk-synthetic0123456', 'ghp_synthetic0123456', 'service_role', '토큰', '-----BEGIN PRIVATE KEY-----',
    'C:\\Users\\example', 'file:///private', 'https://untrusted.invalid', '성민 대표님', '세린 선임', '??', '\uFFFD'];
  for (const text of privateSamples) {
    assert.throws(() => assertPublic(text), /민감 패턴/);
    fixture([{ ...entry(236), title: text }]);
    assert.throws(() => generate(temp, { from: '2.9.236', gitReader }));
    assert.deepEqual(bytes(), before);
  }
  fixture([entry(236)]);
  writeFileSync(join(temp, 'scripts/fixtures/dev-report-editorial-v230-280.json'), JSON.stringify({
    'v2.9.236': { what: '공개 설명', why: '잔액 999원', risk: '확인 필요', handoffs: [] },
  }));
  assert.throws(() => generate(temp, { from: '2.9.236', gitReader }));
  assert.deepEqual(bytes(), before);
  writeFileSync(join(temp, 'scripts/fixtures/dev-report-editorial-v230-280.json'), '{}');
  pass('개인정보·금액·건강 수치·인증정보·금지 호칭·깨진 글자 거절, raw handoff 비노출');

  const single = generate(temp, { from: '2.9.236', gitReader: () => ({ state: 'unavailable', prs: [] }) });
  assert.equal(single.reports.length, 1);
  assert.equal(single.reports[0].range, 'v2.9.236');
  assert.match(single.reports[0].body, /커밋·PR 본문 미확인/);
  assert.match(single.reports[0].body, /구체적인 이유는 담당자 확인이 필요/);
  assert.equal((readFileSync(join(directory, '_SOURCE-release-log.md'), 'utf8').match(/\| 원고 검토 대기 \|/g) || []).length, 3);
  assert.throws(() => runCli(['--unknown'], temp));
  assert.throws(() => runCli(['--from'], temp));
  assert.throws(() => runCli(['2.9.230~2.9.231~2.9.232'], temp));
  assert.equal(runCli(['--from', '2.9.236', '--to', '2.9.236', '--check'], temp).exitCode, 0);
  assert.equal(runCli(['2.9.236..2.9.236', '--check'], temp).exitCode, 0);
  pass('기본 릴리스당 1편·추가 실행 기존 목록 보존·Git 불가와 편집자료 부재 명시·CLI');

  const indexBefore = readFileSync(join(directory, '_SOURCE-release-log.md'), 'utf8');
  writeFileSync(join(directory, '_SOURCE-release-log.md'), source + '<!-- HANI_DEV_REPORT_INDEX_START -->');
  assert.throws(() => generate(temp, { from: '2.9.236', gitReader }));
  writeFileSync(join(directory, '_SOURCE-release-log.md'), indexBefore);
  pass('손상된 목록 marker 차단');

  let gitArgs;
  const fakeGit = runInNewContext(`(${localGit.toString()})`, { spawnSync: (...args) => {
    gitArgs = args;
    return { status: 0, stdout: 'release: v2.9.230 (#501)\nPR body #502\n성명: 테스트인물\n잔액 123456원' };
  } });
  assert.deepEqual(JSON.parse(JSON.stringify(fakeGit(temp, entry(230)))), { state: 'read', prs: ['501', '502'] });
  assert.deepEqual(Array.from(gitArgs[1]), ['show', '-s', '--format=%s%n%b', 'a'.repeat(40), '--']);
  assert.equal(gitArgs[2].cwd, temp);
  assert.equal(gitArgs[2].windowsHide, true);
  assert.equal(fakeGit(temp, { source: { commit: '--remote' } }).state, 'missing');
  const deniedGit = runInNewContext(`(${localGit.toString()})`, { spawnSync: () => ({ error: { code: 'EPERM' } }) });
  assert.equal(deniedGit(temp, entry(230)).state, 'unavailable');
  pass('실제 localGit 함수: 고정 커밋 로컬 조회만, 제목·본문에서 PR 번호만 추출·원문 비노출, Git 거부 명시');

  // Reuse the public commit/PR evidence captured by ada3be2. This session is
  // forbidden to run Git; localGit's call contract is independently tested above.
  const evidenceBytes=readFileSync(join(root,'scripts/fixtures/dev-report-git-evidence-283.json'));
  assert.equal(lifeHash(evidenceBytes),'b01b0ea07b7ddd4c28a1800ce3d3ce9f785b23ecb24eb278d53fd4657604c39b');
  const evidence=JSON.parse(evidenceBytes);
  for(const [file,digest]of Object.entries(evidence.reports))assert.equal(lifeHash(readFileSync(join(root,'docs/gemini-reports',file),'utf8')),digest,file+' frozen regenerated report');
  const cachedGit=(_root,row)=>{const saved=evidence.rows[row.id];assert.equal(row.source.commit,saved.commit);return {state:'read',prs:saved.prs};};
  const actual = generate(root, { from: '2.9.230', to: '2.9.280', groupSize: 4, check: true, gitReader:cachedGit });
  assert.equal(actual.exitCode,0,'regenerated reports and source index match cached public Git evidence');
  assert.equal(actual.releaseCount, 51);
  assert.equal(actual.reports.length, 13);
  assert.deepEqual(actual.reports.flatMap(r => r.versions), Array.from({ length: 51 }, (_, i) => `v2.9.${230 + i}`));
  assert.ok(actual.reports.every(r => r.versions.length >= 3 && r.versions.length <= 5));
  const mergedMain = readFileSync(join(root, 'hani-main.js'), 'utf8');
  // Keep the generator-only contract on its exact pre-embedding layer. The
  // actual merged catalog and renderer are exercised below as well.
  const main = restoreLifeLayer(mergedMain,'hani-main.js','dev-report');
  const context = { module: { exports: {} } };
  runInNewContext(main.split('/* HANI_GEMINI_REPORTS_BUNDLE_START */')[1].split('/* HANI_GEMINI_REPORTS_BUNDLE_END */')[0], context);
  const { parseMarkdown, validateCatalog, selectReports } = context.module.exports;
  const reports = actual.reports.map((r, i) => ({ id: r.file.slice(0, -3), file: r.file, date: r.date,
    release_version: r.range, title: `개발노트 ${r.range}`, body: r.body,
    review_status: 'source_compared_awaiting_user_review', previous_report_id: i ? actual.reports[i - 1].file.slice(0, -3) : null }));
  validateCatalog({ catalog_version: 1, reports });
  for (const r of reports) {
    assertPublic(r.body);
    assert.ok(parseMarkdown(r.body).some(b => b.type === 'table'));
    assert.ok(parseMarkdown(r.body).some(b => b.type === 'bullet'));
    for (const match of r.body.matchAll(/\]\(([^)]+)\)/g)) assert.ok(existsSync(resolve(root, 'docs/gemini-reports', match[1])), '참고 문서 링크 유효');
  }
  assert.equal(selectReports(reports, 'v2.9.280')[0].release_version, 'v2.9.278~v2.9.280');
  const embedded = JSON.parse(main.match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[1]);
  assert.ok(embedded.reports.every(r => !reports.some(next => next.id === r.id)), '실제 앱 목록은 이번 문서 생성으로 바뀌지 않음');
  pass('실제 v230~280 51건/13편, 민감 패턴 0, 링크 존재, 실제 renderer 형식/검색/검토대기 허용·현재 앱 미반영 확인');

  function node(tag, text = '') {
    return { tag, textContent: text, children: [], dataset: {}, value: '', hidden: false,
      classList: { contains: () => false }, events: {},
      setAttribute(key, value) { this[key] = value; },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      addEventListener(type, handler) { this.events[type] = handler; } };
  }
  const nodes = Object.fromEntries(['geminiReports', 'geminiReportStatus', 'geminiReportList', 'geminiReportSearch',
    'geminiReportFilter', 'geminiReportCount', 'geminiReportDetail'].map(id => [id, node('div')]));
  nodes.geminiReportFilter.value = 'all';
  const forbidden = () => { throw new Error('실제 renderer는 문서 fetch·저장·Cloud에 접근하면 안 됩니다.'); };
  const browser = { document: { getElementById: id => nodes[id], createElement: node,
    createTextNode: text => node('text', text) }, HaniGeminiReportCatalog: embedded, fetch: forbidden,
    localStorage: new Proxy({}, { get: forbidden }), sessionStorage: new Proxy({}, { get: forbidden }) };
  runInNewContext(main.split('/* HANI_GEMINI_REPORTS_BUNDLE_START */')[1].split('/* HANI_GEMINI_REPORTS_BUNDLE_END */')[0], browser);
  await browser.HaniGeminiReports.render();
  assert.equal(nodes.geminiReportList.children.length, embedded.reports.length);
  assert.ok(!nodes.geminiReportList.children.some(n => reports.some(r => r.id === n.dataset.reportId)));
  // A bundle-data replacement is only simulated in the VM, never on disk.
  browser.HaniGeminiReportCatalog = { catalog_version: embedded.catalog_version + 1, reports: [...embedded.reports, ...reports] };
  await browser.HaniGeminiReports.render(true);
  assert.equal(nodes.geminiReportList.children.length, embedded.reports.length + 13);
  assert.equal(nodes.geminiReportList.children[0].dataset.reportId, reports.at(-1).id);
  assert.ok(nodes.geminiReportDetail.children.length > 5);
  nodes.geminiReportSearch.value = 'v2.9.280';
  nodes.geminiReportSearch.events.input();
  assert.equal(nodes.geminiReportList.children.length, 1);
  assert.equal(nodes.geminiReportList.children[0].dataset.reportId, reports.at(-1).id);
  assert.equal(nodes.geminiReportStatus.hidden, true);
  pass('실제 DOM renderer 실행: 파일만 추가 시 앱 목록 불변, VM에서 번들 데이터 교체 시 새 목록·본문·검색 동작, fetch/저장 접근 0');

  const mergedCatalog=JSON.parse(mergedMain.match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[1]);
  const previousMerged=restoreLifeReportRefresh(mergedMain);
  const previousCatalog=JSON.parse(previousMerged.match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[1]);
  assert.equal(previousCatalog.catalog_version,embedded.catalog_version+1);
  assert.equal(mergedCatalog.catalog_version,previousCatalog.catalog_version+1);
  assert.equal(mergedCatalog.catalog_version,lifeRefresh.afterVersion);
  assert.equal(embedded.reports.length,18);
  assert.equal(mergedCatalog.reports.length,31);
  for(const old of embedded.reports){
    const current=mergedCatalog.reports.find(r=>r.id===old.id);
    assert.ok(current,old.id);
    for(const key of ['id','file','body','title','date','release_version','review_status'])assert.equal(current[key],old[key],old.id+' '+key);
  }
  for(const generated of reports)assert.equal(mergedCatalog.reports.find(r=>r.id===generated.id)?.body,generated.body,generated.id+' embedded Markdown');
  browser.HaniGeminiReportCatalog=mergedCatalog;
  nodes.geminiReportSearch.value='';
  await browser.HaniGeminiReports.render(true);
  assert.equal(nodes.geminiReportList.children.length,31);
  assert.equal(nodes.geminiReportList.children[0].dataset.reportId,reports.at(-1).id);
  assert.ok(nodes.geminiReportDetail.children.length>5);
  nodes.geminiReportSearch.value='v2.9.280';
  nodes.geminiReportSearch.events.input();
  assert.equal(nodes.geminiReportList.children.length,1);
  assert.equal(nodes.geminiReportList.children[0].dataset.reportId,reports.at(-1).id);
  assert.equal(nodes.geminiReportStatus.hidden,true);
  assert.ok(mergedCatalog.reports.every(r=>!r.body.includes('로컬 Git 실행 불가')));
  pass('실제 번들31편·기존18편·재생성13편·renderer 목록/본문/검색, catalog8→9 exact inverse·이 시험의 디스크 빌더 실행0');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
console.log(`PASS 개발보고서 생성기 ${groups}그룹`);
