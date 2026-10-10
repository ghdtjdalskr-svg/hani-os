import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext, Script } from 'node:vm';
import { build, runCli } from './hani-gemini-reports-build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'hani-main.js'));
const START = '/* HANI_GEMINI_REPORTS_BUNDLE_START */';
const END = '/* HANI_GEMINI_REPORTS_BUNDLE_END */';
function catalog(bytes) {
  return JSON.parse(bytes.toString('utf8').match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[1]);
}
function withoutAssignment(bytes) {
  const match = /globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/.exec(bytes.toString('utf8'));
  const from = Buffer.byteLength(bytes.toString('utf8').slice(0, match.index));
  return Buffer.concat([bytes.subarray(0, from), bytes.subarray(from + Buffer.byteLength(match[0]))]);
}
const temp = mkdtempSync(join(tmpdir(), 'hani-gemini-reports-'));
const reportDir = join(temp, 'docs', 'gemini-reports');
const mainPath = join(temp, 'hani-main.js');
try {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(mainPath, source);
  const originalFile = '2026-10-04-v2.9.164-data-hub.md';
  const old = catalog(source).reports.find(report => report.file === originalFile);
  assert.ok(old, 'Existing v164 report must be present');
  const body = readFileSync(join(root, 'docs', 'gemini-reports', originalFile), 'utf8');
  writeFileSync(join(reportDir, originalFile), body.replace(/\r?\n/g, '\r\n'));
  writeFileSync(join(reportDir, '_ignored.md'), 'This intentionally has no report heading');
  assert.equal(build(temp).exitCode, 0);
  const generated = readFileSync(mainPath);
  const single = catalog(generated);
  assert.equal(single.reports.length, 1);
  for (const key of ['body', 'title', 'id']) assert.equal(single.reports[0][key], old[key], `v164 ${key} round-trip`);
  assert.equal(single.catalog_version, catalog(source).catalog_version + 1);
  assert.deepEqual(withoutAssignment(generated), withoutAssignment(source), 'Every surrounding byte and line ending must be preserved');
  assert.equal(runCli(['--check'], temp).exitCode, 0);
  assert.deepEqual(readFileSync(mainPath), generated, '--check must never write');
  console.log('PASS v2.9.164 body/title/id round-trip; surrounding bytes preserved; _ files skipped');

  const fake = (version, summary) => `# HANI OS ${version} 개발노트\n\n## 이번 업데이트 한줄 요약\n\n${summary}\n\n## 상세\n내용\n`;
  // Create in reverse order and tie dates to exercise the filename tiebreaker.
  writeFileSync(join(reportDir, '2026-10-03-z-latest.md'), fake('v2.9.165 ~ v2.9.166', '첫 문장입니다. 두 번째는 제외합니다.'));
  writeFileSync(join(reportDir, '2026-10-03-a-earliest.md'), fake('v2.9.163', '가'.repeat(70)));
  const beforeDriftCheck = readFileSync(mainPath);
  assert.equal(runCli(['--check'], temp).exitCode, 1);
  assert.deepEqual(readFileSync(mainPath), beforeDriftCheck, 'Drift check must not write');
  build(temp);
  const multi = catalog(readFileSync(mainPath));
  const ids = ['2026-10-03-a-earliest', '2026-10-03-z-latest', old.id];
  assert.deepEqual(multi.reports.map(report => report.id), ids);
  assert.deepEqual(multi.reports.map(report => report.previous_report_id), [null, ids[0], ids[1]]);
  assert.equal(multi.reports[0].title, '가'.repeat(60));
  assert.equal(multi.reports[1].title, '첫 문장입니다.');
  assert.equal(multi.reports[1].release_version, 'v2.9.165 ~ v2.9.166');
  assert.ok(multi.reports.every(report => report.review_status === 'approved' && !report.body.includes('\r')));
  assert.equal(runCli(['--check'], temp).exitCode, 0);
  // Content drift is detected even when the file list stays unchanged.
  writeFileSync(join(reportDir, '2026-10-03-z-latest.md'), fake('v2.9.165 ~ v2.9.166', '바뀐 문장입니다.'));
  assert.equal(runCli(['--check'], temp).exitCode, 1);
  console.log('PASS ordering/previous_report_id; sentence/60-char titles; version range; --check detects drift without writing');

  // Fallback and LF catalog line, with CRLF elsewhere, remain supported.
  writeFileSync(join(reportDir, '2026-10-03-z-latest.md'), '# HANI OS v2.9.165-v2.9.166 개발노트\n\n## 이번 업데이트 한줄 요약\n\n## 상세\n내용\n');
  const mixed = source.toString('utf8').replace(/\r?\n/g, '\r\n').replace(/(globalThis\.HaniGeminiReportCatalog[^\r\n]*)\r\n/, '$1\n');
  writeFileSync(mainPath, mixed);
  build(temp);
  const mixedGenerated = readFileSync(mainPath);
  assert.deepEqual(withoutAssignment(mixedGenerated), withoutAssignment(Buffer.from(mixed)));
  assert.equal(catalog(mixedGenerated).reports[1].title, 'HANI OS v2.9.165-v2.9.166 개발노트');
  new Script(mixedGenerated.toString('utf8'));
  console.log('PASS heading fallback; mixed LF/CRLF preservation; generated runtime syntax');

  // Execute the real view's exported validation/selection path, not a copy.
  const renderer = source.toString('utf8').split(START)[1].split(END)[0];
  const context = { module: { exports: {} } };
  runInNewContext(renderer, context);
  const { validateCatalog, selectReports } = context.module.exports;
  const reports = validateCatalog(catalog(mixedGenerated));
  assert.deepEqual(Array.from(selectReports(reports), report => report.id), ids.slice().reverse());
  const many = Array.from({ length: 80 }, (_, i) => ({ ...reports[0],
    id: `2026-10-03-report-${String(i).padStart(3, '0')}`,
    file: `2026-10-03-report-${String(i).padStart(3, '0')}.md`, previous_report_id: null }));
  assert.equal(validateCatalog({ catalog_version: 42, reports: many }).length, 80);
  assert.deepEqual(Array.from(selectReports(many), report => report.id), many.map(report => report.id).reverse());
  assert.equal(selectReports(reports, 'v2.9.164', 'approved')[0].id, old.id);
  assert.throws(() => validateCatalog({ ...multi, catalog_version: 0 }));
  assert.throws(() => validateCatalog({ ...multi, reports: [{ ...multi.reports[0], release_version: 'invalid' }] }));
  console.log('PASS actual view validation and newest-first selection (80 reports); search/filter; invalid catalogs rejected');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
console.log('PASS Gemini reports build tests');
