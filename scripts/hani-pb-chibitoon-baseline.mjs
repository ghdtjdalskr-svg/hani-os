// Independent original test, cases, closure and artwork from the feature worktree.
// Keep these inputs under fixtures rather than depending on ignored draft folders.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(new URL('./fixtures/pb-chibitoon-baseline.json.gz',import.meta.url));
assert.equal(hash(bytes),'08d1ed7f4fbe5c67a82a53433c28dafca74b3405c46de8a185f173e7e4c18316','frozen independent chibitoon baselines');
const files=JSON.parse(gunzipSync(bytes));
export function readPbBaseline(file,encoding){
 const row=files[file];assert.ok(row,'known independent chibitoon baseline '+file);
 const value=Buffer.from(row.base64,'base64');
 assert.equal(hash(value),row.sha256,'complete chibitoon baseline '+file);
 return encoding?value.toString(encoding):value;
}
