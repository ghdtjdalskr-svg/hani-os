import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-barista-night-273-delta.json',import.meta.url));
assert.equal(hash(bytes),'a1d66d73ffe47c9b4b941004fab34d978a2e5ccfcdc39a4e160286e95179cf82','exact authored night barista delta');
export const barista273Delta=JSON.parse(bytes);
assert.equal(barista273Delta.baseCommit,'c338bdab8589676979f85e1a5626fca2af5b86d8','fixed v2.9.272 release');
assert.deepEqual(barista273Delta.files.map(f=>f.beforeSha256),["60075ca9c2992c36db7237ca9945fa771c9106eddb09bfe6665c73cfebf1f067","9506f017e5c01686f9c61225f0e7e41ee934dbbccf6985ea5daf9ee04d9c4e95"]);
// Strict outer layer: 273 -> 272 -> 269 -> 268. No moving reference or repin.
export function restoreBarista273Source(source,file='hani-office-live.js'){
 const row=barista273Delta.files.find(f=>f.file===file);assert.ok(row,'approved night barista source: '+file);
 assert.equal(hash(source),row.afterSha256,'only the authored v2.9.273 night barista bytes are accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'unique required night barista bytes: '+r.name);source=source.replace(r.after,r.before)}
 assert.equal(hash(source),row.beforeSha256,'every fixed v2.9.272 byte restored: '+file);return source;
}
