import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const rows=JSON.parse(fs.readFileSync('assets/data/hani-history-releases-v1.json')).entries.filter(r=>/^v2\.9\.(\d+)$/.test(r.id)&&+r.id.split('.').at(-1)>=230&&+r.id.split('.').at(-1)<=280);
const reports=fs.readdirSync('docs/gemini-reports').filter(f=>f.endsWith('-dev-report.md')).map(file=>({file,body:fs.readFileSync('docs/gemini-reports/'+file,'utf8')}));
const evidence={provenance:'ada3be2 regenerated report source; cached public PR references only, no Git executed in task 283',rows:{},reports:{}};
for(const row of rows){
 const report=reports.find(r=>r.body.includes('| '+row.id+' |'));
 assert.ok(report,row.id);
 const line=report.body.split('\n').find(l=>l.startsWith('| '+row.id+' |'));
 assert.ok(report.body.includes('로컬 Git 커밋 제목·본문 확인'));
 evidence.rows[row.id]={commit:row.source.commit,prs:[...line.matchAll(/#(\d+)/g)].map(m=>m[1])};
 evidence.reports[report.file]=hash(report.body);
}
assert.equal(rows.length,51);assert.equal(Object.keys(evidence.reports).length,13);
const bytes=JSON.stringify(evidence,null,2)+'\n';
fs.writeFileSync('scripts/fixtures/dev-report-git-evidence-283.json',bytes);
console.log(hash(bytes));
