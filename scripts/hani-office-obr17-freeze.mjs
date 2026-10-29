// Update only the explicitly authorized 235 pending after bytes, never the oracle.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readAt} from './hani-office-lively-fixture.mjs';
const file='scripts/fixtures/office-lively-labels-235.json',f=JSON.parse(fs.readFileSync(file)),hash=s=>createHash('sha256').update(s).digest('hex');
assert.equal(f.baseSha,'33d39892c2a5c0a1779650e440a2dd5068b44495');
assert.deepEqual(f.changes.map(c=>c.file),['hani-office-live.js','hani-office-live.css']);
for(const c of f.changes){const before=readAt(c.file,f.baseSha),after=fs.readFileSync(c.file,'utf8');assert.equal(hash(before),c.beforeSha256);assert.equal(c.replacements.length,1);assert.equal(c.replacements[0].before,before);c.afterSha256=hash(after);c.replacements=[{before,after}];}
f.reason=f.reason.replace(/; obr17 authorized.*$/,'')+'; obr17 authorized UI-only shared sprite/label layers, atlas-equivalent margin pivots, nearby compact labels and sprite/face avoidance; immutable behavior oracle unchanged';
fs.writeFileSync(file,JSON.stringify(f,null,2)+'\n');console.log('235 pending exact after updated; reviewed before and plan oracle retained');
