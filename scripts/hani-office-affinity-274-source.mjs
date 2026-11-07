import {restoreCompanions276Source} from './hani-office-companions-276-source.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restoreHelper275Source} from './hani-helper-275-source.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-affinity-274-delta.json',import.meta.url));
assert.equal(hash(bytes),'9c7eaf30377aca6f2f3c697880c6f985cc78923a5bf0a212ecf13bedfb8ecff5','exact authored affinity delta');
export const affinity274Delta=JSON.parse(bytes);
assert.equal(affinity274Delta.baseCommit,'241b5081e97914aa90a4af9b8f384e0d5fc5f175','fixed HEAD of hani/barista-night-live');
assert.deepEqual(affinity274Delta.files.map(r=>r.beforeSha256),["66d5b20204569b8a9039aef1406a3536f24ae2668d3b237a50770b282b391137","f44a75e570705d2c8cc196213bece505eb6603d5c163475e9883341d53de7fff","2e984226648beace1aaf7bae5e92fb1fe503286bdac49c719546a6711a00d173"]);
// Strict outer layer: 275 -> 274 -> 273 -> 272 -> 269 -> 268; no moving refs.
export function restoreAffinity274Source(source,file='hani-office-live.js'){
 const row=affinity274Delta.files.find(r=>r.file===file);assert.ok(row,'authored affinity file');
 if(['hani-office-live.js','hani-office-live.css'].includes(file)&&hash(source)!==row.afterSha256)source=restoreCompanions276Source(source,file);
 if(file==='hani-ui-v02992.js'&&hash(source)!==row.afterSha256)source=restoreHelper275Source(source,file);
 assert.equal(hash(source),row.afterSha256,'only authored affinity bytes accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'unique affinity pair: '+r.name);source=source.replace(r.after,r.before)}
 assert.equal(hash(source),row.beforeSha256,'every fixed barista-night HEAD byte restored: '+file);return source;
}
