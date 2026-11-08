import fs from 'node:fs';
import {createHash} from 'node:crypto';
const out='artifacts/tooling-283',hash=b=>createHash('sha256').update(b).digest('hex');
const expected=new Set(['scripts/hani-release-283-source.cjs','scripts/hani-life-bundle-source.mjs','scripts/hani-life-bundle-source.test.mjs','scripts/hani-dev-report-generate.test.mjs','scripts/hani-procrastination-board.test.mjs','scripts/hani-m9-polish-preload.cjs','scripts/hani-seoyun-m9.test.mjs','scripts/hani-office-kids-visit.test.mjs','scripts/hani-office-staff-chat.test.mjs','scripts/fixtures/life-bundle-baseline-282.json.gz','docs/development-history/CURRENT.md','docs/development-history/handoffs/2026-11-08-tooling-283.md']);
const initial=JSON.parse(fs.readFileSync(out+'/initial-files.json'));
const changed=initial.filter(r=>!r.file.startsWith(out+'/')&&!expected.has(r.file)&&(!fs.existsSync(r.file)||hash(fs.readFileSync(r.file))!==r.sha256)).map(r=>r.file);
fs.writeFileSync(out+'/scope-audit.json',JSON.stringify({changedOutsideTask:changed},null,2));
console.log(JSON.stringify({changedOutsideTask:changed}));
if(changed.length)process.exitCode=1;
