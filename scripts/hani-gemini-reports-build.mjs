import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const START = '/* HANI_GEMINI_REPORTS_BUNDLE_START */';
const END = '/* HANI_GEMINI_REPORTS_BUNDLE_END */';
// The original approved v164 title predates sentence-derived titles. Keep its
// public identity without modifying the concurrently maintained Markdown file.
const LEGACY_TITLES = Object.freeze({
  '2026-10-04-v2.9.164-data-hub': '데이터 허브 기반과 월간 카드 6개',
});

function locateBundle(bytes) {
  const start = bytes.indexOf(START), end = bytes.indexOf(END);
  if (start < 0 || end <= start || bytes.indexOf(START, start + 1) !== -1 || bytes.indexOf(END, end + 1) !== -1) {
    throw new Error('Expected exactly one ordered Gemini bundle marker pair');
  }
  const offset = start + Buffer.byteLength(START);
  const text = bytes.subarray(offset, end).toString('utf8');
  // Only replace the catalog assignment. The renderer also lives inside these
  // markers and must retain its exact bytes, including its line endings.
  const pattern = /globalThis\.HaniGeminiReportCatalog\s*=\s*Object\.freeze\(([^\r\n]+)\);/g;
  const matches = [...text.matchAll(pattern)];
  if (matches.length !== 1) throw new Error('Expected one single-line catalog assignment inside markers');
  const match = matches[0];
  const catalog = JSON.parse(match[1]);
  if (!Number.isSafeInteger(catalog.catalog_version) || catalog.catalog_version < 1 || !Array.isArray(catalog.reports)) {
    throw new Error('Invalid existing catalog');
  }
  const from = offset + Buffer.byteLength(text.slice(0, match.index));
  return { catalog, from, to: from + Buffer.byteLength(match[0]), assignment: match[0] };
}

function reportFromFile(directory, file) {
  const id = file.slice(0, -3);
  const date = /^\d{4}-\d{2}-\d{2}/.exec(file)?.[0];
  const body = readFileSync(join(directory, file), 'utf8').replace(/\r\n/g, '\n');
  const heading = /^# HANI OS (.+?) 개발노트\s*$/m.exec(body);
  if (!date || !heading) throw new Error(`Missing report date or HANI OS heading: ${file}`);
  const summary = /^## 이번 업데이트 한줄 요약[^\S\n]*\n([\s\S]*?)(?=^#{1,6}\s|$(?![\s\S]))/m.exec(body)?.[1];
  const paragraph = summary?.trim().split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  // A full stop inside a version number is not a sentence boundary.
  const sentence = paragraph?.match(/^[\s\S]*?[.!?。！？](?=\s|$)/)?.[0] || paragraph;
  const title = (LEGACY_TITLES[id] || sentence || heading[0].trim().replace(/^#\s+/, '')).trim().slice(0, 60);
  return { title, release_version: heading[1].trim(), review_status: 'approved', file, id, date, previous_report_id: null, body };
}

/** Build a repository (also used with isolated temporary repositories in tests).
 * --check compares at the current catalog revision; writes increment it once.
 */
export function build(root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), { check = false } = {}) {
  const main = join(root, 'hani-main.js');
  const original = readFileSync(main);
  const bundle = locateBundle(original);
  const directory = join(root, 'docs', 'gemini-reports');
  const reports = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
    .map(entry => reportFromFile(directory, entry.name))
    .sort((a, b) => a.date.localeCompare(b.date) || a.file.localeCompare(b.file));
  reports.forEach((report, i) => { report.previous_report_id = i ? reports[i - 1].id : null; });
  const catalog = { ...bundle.catalog, reports };
  const serialize = value => `globalThis.HaniGeminiReportCatalog=Object.freeze(${JSON.stringify(value)});`;
  if (check) {
    const stale = serialize(catalog) !== bundle.assignment;
    return { exitCode: stale ? 1 : 0, message: `Gemini reports bundle ${stale ? 'out of date' : 'up to date'} (${reports.length} reports)` };
  }
  if (catalog.catalog_version === Number.MAX_SAFE_INTEGER) throw new Error('Catalog version overflow');
  catalog.catalog_version += 1;
  const output = Buffer.concat([original.subarray(0, bundle.from), Buffer.from(serialize(catalog)), original.subarray(bundle.to)]);
  // Do not overwrite a concurrently changed runtime file.
  if (!readFileSync(main).equals(original)) throw new Error('hani-main.js changed during build; rerun');
  writeFileSync(main, output);
  return { exitCode: 0, message: `Gemini reports bundle written (${reports.length} reports, catalog_version ${catalog.catalog_version})` };
}

export function runCli(args = [], root) {
  if (args.some(arg => arg !== '--check')) throw new Error('Usage: node scripts/hani-gemini-reports-build.mjs [--check]');
  return build(root, { check: args.includes('--check') });
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = runCli(process.argv.slice(2));
    console.log(result.message);
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(`Gemini reports build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
