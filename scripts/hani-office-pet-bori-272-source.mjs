import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-pet-bori-272-delta.json',import.meta.url));
assert.equal(hash(bytes),'f1d60f89f1be17a128a9236e8473d7946feea655f99d9fbe2f09ebb4de68fb1b','exact approved Bori delta');
export const bori272Delta=JSON.parse(bytes);
assert.equal(bori272Delta.baseCommit,'5f13d8d794184b35b29fb45e6539fd0d68c08b76','fixed v2.9.271 release');
assert.deepEqual(bori272Delta.files.map(f=>f.beforeSha256),['dbc449e861d78f8ecfa7b05fda83bf5b8c7ff811d86c2efde3320e7b78fe8e9b','6dace7444ef33a861c55883d240e763c6845873cb0285f4c7ced60cd936d437c']);
// Strict outer layer. Christmas restores these fixed 271 bytes next, then 268.
// No origin/main lookup, optional pairs, regex allowances or source re-pinning.
export function restoreBori272Source(source,file='hani-office-live.js'){
 const row=bori272Delta.files.find(f=>f.file===file);assert.ok(row,'approved Bori source: '+file);
 assert.equal(hash(source),row.afterSha256,'only the approved v2.9.272 Bori bytes are accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'unique required Bori bytes: '+r.name);source=source.replace(r.after,r.before)}
 assert.equal(hash(source),row.beforeSha256,'every fixed v2.9.271 byte restored: '+file);return source;
}
