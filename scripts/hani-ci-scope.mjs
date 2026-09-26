import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Deliberately narrow: unknown paths and deletions retain full preflight.
const docs = new Set(['AGENTS.md', 'dev-center/one-pass-release.md']);
function classify(records) {
  const docsOnly = records.length > 0 && records.every(([status, file]) =>
    ['A', 'M'].includes(status) && docs.has(file));
  return {
    docs_only: docsOnly,
    tooling: records.some(([, file]) => !docs.has(file) &&
      /^(scripts\/|dev-center\/|\.github\/workflows\/)/.test(file)),
  };
}
if (process.argv.includes('--self-test')) {
  assert.deepEqual(classify([['M', 'AGENTS.md']]), { docs_only: true, tooling: false });
  assert.equal(classify([['D', 'AGENTS.md']]).docs_only, false);
  assert.equal(classify([['M', 'index.html']]).docs_only, false);
  assert.equal(classify([['M', 'AGENTS.md'], ['A', 'new.js']]).docs_only, false);
  assert.equal(classify([['M', 'scripts/hani-one-pass-rules.mjs']]).tooling, true);
  assert.equal(classify([['M', '.github/workflows/hani-dev-center-gate.yml']]).tooling, true);
  assert.equal(classify([['D', 'dev-center/one-pass-gate-contract.json']]).tooling, true);
  assert.equal(classify([]).docs_only, false);
  assert.equal(classify([['A', 'docs/unknown.md']]).docs_only, false);
  console.log('scope self-test: 9/9 PASS');
} else {
  const [base, head] = process.argv.slice(2);
  if (![base, head].every(sha => /^[a-f0-9]{40}$/.test(sha || ''))) throw new Error('Exact base/head SHA required');
  const parts = execFileSync('git', ['diff', '--no-renames', '--name-status', '-z', base, head],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).split('\0');
  if (parts.pop() !== '' || parts.length % 2) throw new Error('Invalid diff records');
  const records = [];
  for (let i = 0; i < parts.length; i += 2) records.push([parts[i], parts[i + 1]]);
  const result = classify(records);
  if (!process.env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT missing');
  appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
  console.log(JSON.stringify({ base_sha: base, candidate_sha: head, ...result }));
}
