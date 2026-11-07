import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/helper-275-delta.json',import.meta.url));
assert.equal(hash(bytes),'89bf070a71fe5c69931e61180380baed65eaebe7af6092fdd62cb18bbe118fc3','exact authored helper 275 delta');
export const helper275Delta=JSON.parse(bytes);
assert.equal(helper275Delta.baseCommit,'507c344775c70eb25bf4f4e8107cbb3169cd489e','fixed origin/main 507c344');
assert.deepEqual(helper275Delta.files.map(r=>r.beforeSha256),['fc5806fa3a0beef21264218f26d07980b328fb6679573dda94cce2994db1dec7','ae02df55ee6be7d903b19ff00f8a3fbf9bf687937ad99162c891a86801e27075']);
// Strict outer layer: 275 -> 274 -> 273 -> 272 -> 269 -> 268; no moving refs.
export function restoreHelper275Source(source,file){
 const row=helper275Delta.files.find(r=>r.file===file);assert.ok(row,'authored helper 275 file: '+file);
 assert.equal(hash(source),row.afterSha256,'only authored helper 275 bytes accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'unique helper 275 pair: '+r.name);source=source.replace(r.after,()=>r.before);}
 assert.equal(hash(source),row.beforeSha256,'every fixed 507c344 byte restored: '+file);return source;
}
