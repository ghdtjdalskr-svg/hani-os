import fs from 'node:fs';
import {projectPrePatrolSource} from './hani-office-chairman-patrol-278-source.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-companions-276-delta.json',import.meta.url));
assert.equal(hash(bytes),"88d3a9d3c45162138a698533f85640fb8184e91ab4d8b585a7513b20fff4889f",'exact authored companions 276 delta');
export const companions276Delta=JSON.parse(bytes);
assert.equal(companions276Delta.baseCommit,'ce072a4d2c4a445e835f8a8adbd040465a598f17','fixed task base');
assert.deepEqual(companions276Delta.files.map(r=>r.beforeSha256),["d42811da8644c5be985bfd0912bc0d258c3f7e39d51cd9f97e929e2d37aa6573","38851731fc7540954826c6409d85c7be34163d04c0d1d99745c89cc082d9bdc0"]);
// Strict outer layer: 276 -> 275/274 -> 273 -> 272 -> 269 -> 268.
export function restoreCompanions276Source(source,file='hani-office-live.js'){
 source=projectPrePatrolSource(source,file);
 const row=companions276Delta.files.find(r=>r.file===file);assert.ok(row,'authored companions 276 file: '+file);
 assert.equal(hash(source),row.afterSha256,'only authored companions 276 bytes accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'unique companions 276 pair: '+r.name);source=source.replace(r.after,()=>r.before);}
 assert.equal(hash(source),row.beforeSha256,'every fixed ce072a4 byte restored: '+file);return source;
}
