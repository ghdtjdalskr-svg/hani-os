import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='artifacts/tooling-283',rows=JSON.parse(fs.readFileSync(out+'/office-first-results.json')),retry=JSON.parse(fs.readFileSync(out+'/office-retry-results.json'));
assert.equal(retry.length,2,'both targeted retries completed');
for(const row of retry){assert.notEqual(row.exit,null,'retry completed without timeout');const i=rows.findIndex(r=>r.file===row.file);assert.ok(i>=0);rows[i]=row;}
assert.equal(rows.length,69);assert.equal(new Set(rows.map(r=>r.file)).size,69);
fs.writeFileSync(out+'/office-results.json',JSON.stringify(rows,null,2));
console.log('Merged completed retry evidence into all 69 office rows');
