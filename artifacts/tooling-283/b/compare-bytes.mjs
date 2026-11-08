// Additional local evidence only. This never supplies or intercepts Git output.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readRawLifeFile} from '../../../scripts/hani-life-bundle-source.mjs';
import '../../../scripts/hani-life-bundle-preload.mjs';
import {normalizeReleaseVersion} from '../../../scripts/hani-reviewed-release-baseline.mjs';
import {resolveRuntimeClosure} from '../../../scripts/hani-runtime-closure.mjs';
import {boriStrollDelta,restoreBoriStrollSource} from '../../../scripts/hani-office-bori-stroll-source.mjs';
import {patrol278Delta,restoreCompanionHomesSource} from '../../../scripts/hani-office-chairman-patrol-278-source.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const evidence=[];
for(const [fixture,version,normalize] of [
 ['office-barista-night-273-delta.json','2.9.272',s=>normalizeReleaseVersion(s,'2.9.272')],
 ['office-pet-bori-272-delta.json','2.9.271',s=>s.replace(/2\.9\.(27[2-9]|2[89]\d)\b/g,'2.9.271')],
 // Reconstruct the fixed raw 268 pin too, without synthesizing a Git response.
 ['office-xmas-269-delta.json','2.9.268',s=>s.replaceAll('2.9.282','2.9.268')]
]){
 const delta=JSON.parse(fs.readFileSync('scripts/fixtures/'+fixture));
 for(const pin of delta.unchangedRuntime){
  const projected=normalize(fs.readFileSync(pin.file,'utf8'));
  const expected=pin.normalizedSha256||pin.sha256;
  assert.equal(hash(projected),expected);
  assert.equal(projected.split(version).length-1,pin.normalizedVersionCount||pin.versionCount);
  evidence.push({fixture,file:pin.file,sha256:expected,pass:true});
 }
}
for(const [name,restore,expected] of [
 ['bori-stroll',restoreBoriStrollSource,boriStrollDelta.beforeSha256],
 ['companion-homes',restoreCompanionHomesSource,patrol278Delta.companionHomesExtension.beforeSha256]
]){
 const source=restore(fs.readFileSync('hani-office-live.js','utf8'));
 assert.equal(hash(source),expected);
 evidence.push({name,file:'hani-office-live.js',sha256:expected,pass:true});
}
const raw=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>readRawLifeFile(f)});
const lower=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>fs.readFileSync(f)});
assert.deepEqual(raw.missing,[]);assert.deepEqual(lower.missing,[]);
assert.equal(raw.files.length,168);assert.equal(lower.files.length,161);
const added=raw.files.filter(f=>!lower.files.includes(f));
assert.equal(added.length,7);assert.deepEqual(lower.files.filter(f=>!raw.files.includes(f)),[]);
const result={evidence,closure:{raw:raw.files.length,projected:lower.files.length,added,missing:[]},gitExecuted:false};
fs.writeFileSync('artifacts/tooling-283/b/byte-comparison.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
