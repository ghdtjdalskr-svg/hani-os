import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-chairman-patrol-278-delta.json',import.meta.url));
assert.equal(hash(bytes),'1cede98687d5fbb50abc6ec70d76cb1fe1f2094a701a8043c41a02bcf0d69aef','exact authored patrol 278 delta');
export const patrol278Delta=JSON.parse(bytes);
assert.equal(patrol278Delta.baseCommit,'3f4158e7a1d793ede02160f2dfac21b834d268d1');
assert.deepEqual(patrol278Delta.files.map(r=>r.beforeSha256),['43224cad9ebb0eeed913f485afaa9895783157748816458218401810652f389b','3911b660d786f550046a9805fea998a3a865151d843beb39e1c94b5ff9a31f46']);
export function restorePatrol278Source(source,file='hani-office-live.js'){
 const row=patrol278Delta.files.find(r=>r.file===file);assert.ok(row,'authored patrol file');
 assert.equal(hash(source),row.afterSha256,'only exact patrol 278 bytes accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'one complete patrol pair: '+r.name);source=source.replace(r.after,()=>r.before);}
 assert.equal(hash(source),row.beforeSha256,'every pre-patrol byte restored: '+file);return source;
}
export function projectPrePatrolSource(source,file='hani-office-live.js'){
 const row=patrol278Delta.files.find(r=>r.file===file);if(!row)return source;
 return hash(source)===row.beforeSha256?source:restorePatrol278Source(source,file);
}
