import fs from 'node:fs';
import seoyunM9 from './hani-seoyun-m9-source.cjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-bori-stroll-delta.json',import.meta.url));
assert.equal(hash(bytes),'c7e8675afd032e18c0eb6a46c71d6812964bddc8057a747641c4b2874e66deba','exact authored Bori stroll contract');
export const boriStrollDelta=JSON.parse(bytes);
assert.equal(boriStrollDelta.baseCommit,'f1a457f0ffe6a42721c73cf22218f13e4e961bf6');
assert.equal(boriStrollDelta.beforeSha256,'84b448af3f4251d33b4d992016a7f158524fad49bbeb589c67e8a07c80d557ec');
export function restoreBoriStrollSource(source,file='hani-office-live.js'){
 source=seoyunM9.projectPreSeoyunM9Source(source,file);
 const row=boriStrollDelta;assert.equal(file,row.file);assert.equal(hash(source),row.afterSha256,'only exact Bori stroll bytes accepted');
 for(const pair of row.replacements){assert.equal(source.split(pair.after).length-1,1,'complete unique stroll pair: '+pair.name);source=source.replace(pair.after,()=>pair.before)}
 assert.equal(hash(source),row.beforeSha256,'all fixed f1a457f bytes restored');return source;
}
export function projectPreBoriStrollSource(source,file='hani-office-live.js'){
 source=seoyunM9.projectPreSeoyunM9Source(source,file);
 return file===boriStrollDelta.file&&hash(source)===boriStrollDelta.afterSha256?restoreBoriStrollSource(source,file):source;
}
