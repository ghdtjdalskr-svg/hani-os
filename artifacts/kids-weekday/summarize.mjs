import fs from 'node:fs';import assert from 'node:assert/strict';
const out='artifacts/kids-weekday',read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),array=x=>Array.isArray(x)?x:[x];
const original=array(read(out+'/final-tests/summary.json')),rows=original.map(row=>({...row}));
const replacement=array(read(out+'/updated-legacy-tests/summary.json'));
for(const row of replacement){const index=rows.findIndex(r=>r.file===row.file);assert.ok(index>=0);rows[index]={...row,evidence:'updated-legacy-tests',earlier:original[index]}}
assert.equal(rows.length,fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)).length,'every requested office file completed');
const baseline=array(read(out+'/baseline-tests/summary.json'));
const tap=file=>{const bytes=fs.readFileSync(file);return bytes[0]===255&&bytes[1]===254?bytes.toString('utf16le'):bytes.toString('utf8')};
for(const row of rows.filter(r=>r.fail||r.exit)){
 assert.equal(row.file,'hani-office-219.test.mjs','unexpected final failure: '+row.file);
 const before=baseline.find(r=>r.file===row.file);assert.ok(before?.fail===row.fail&&before.exit===row.exit);for(const folder of ['final-tests','baseline-tests'])assert.ok(tap(out+'/'+folder+'/'+row.file+'.tap').includes("error: '.hani-office-name AA text contrast'"));row.classification='pre-existing: identical .hani-office-name AA text contrast failure on fixed HEAD';
}
const totals={files:rows.length,pass:0,fail:0,skipped:0};for(const row of rows)for(const key of ['pass','fail','skipped'])totals[key]+=row[key];
const result={result:totals.fail?'completed-with-pre-existing-failure':'pass',totals,newFailures:0,rows,baseline,notes:['Latest changed legacy test uses the exact outer weekday projection; its original assertions are preserved.','Initial failed logs are retained; updated-legacy-tests supersedes its one earlier failure.','Runtime and contract identities are in validation.json; no runtime change during these tests.']};
fs.writeFileSync(out+'/test-summary.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({result:result.result,...totals,newFailures:0}));
