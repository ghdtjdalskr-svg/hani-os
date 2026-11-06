import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-pets-268-delta.json',import.meta.url));
assert.equal(hash(bytes),'47f7b31e560f41fb8e9ad83b1129c6d7304297f8f63ea9d646ba5ce2c07dc709','exact approved v2.9.268 pet/bubble delta');
export const pets268Delta=JSON.parse(bytes);
assert.equal(pets268Delta.beforeSha256,'6729f9f832851446fcc4b9df9b6ccb21e8b999a9a2559f4a0ba750d27ec671f7','pinned origin/main source');

// Also used AFTER the independently hash-pinned G normalization in zoom QA.
// Every replacement is literal, unique and required; no regex/optional allowance.
export function restorePets268Pairs(source){
 for(const r of pets268Delta.replacements){
  assert.equal(source.split(r.after).length-1,1,'unique approved pet/bubble bytes: '+r.name);
  source=source.replace(r.after,r.before);
 }
 return source;
}
export function restorePets268Source(source){
 assert.equal(hash(source),pets268Delta.afterSha256,'only the approved v2.9.268 source is accepted');
 const restored=restorePets268Pairs(source);
 assert.equal(hash(restored),pets268Delta.beforeSha256,'all bytes outside the exact pet/bubble delta equal origin/main');
 return restored;
}
