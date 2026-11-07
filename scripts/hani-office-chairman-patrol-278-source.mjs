import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import seoyunM9 from './hani-seoyun-m9-source.cjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const bytes=fs.readFileSync(new URL('fixtures/office-chairman-patrol-278-delta.json',import.meta.url));
assert.equal(hash(bytes),'a096d64a75128b63d1b67e5b0a2c51ef648a24653be77da8100ca4ae68f21c2c','exact authored patrol 278 delta');
export const patrol278Delta=JSON.parse(bytes);
assert.equal(patrol278Delta.baseCommit,'3f4158e7a1d793ede02160f2dfac21b834d268d1');
assert.deepEqual(patrol278Delta.files.map(r=>r.beforeSha256),['43224cad9ebb0eeed913f485afaa9895783157748816458218401810652f389b','3911b660d786f550046a9805fea998a3a865151d843beb39e1c94b5ff9a31f46']);
export function restorePatrol278Source(source,file='hani-office-live.js'){
 source=projectPreKidsSource(source,file);
 const row=patrol278Delta.files.find(r=>r.file===file);assert.ok(row,'authored patrol file');
 assert.equal(hash(source),row.afterSha256,'only exact patrol 278 bytes accepted: '+file);
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'one complete patrol pair: '+r.name);source=source.replace(r.after,()=>r.before);}
 assert.equal(hash(source),row.beforeSha256,'every pre-patrol byte restored: '+file);return source;
}
// A strict extension of 278, retaining the original frozen patrol assertions.
// Only the exact authored kid patch can be projected to the 1066c57 layer.
export function restoreKids278Source(source,file='hani-office-live.js'){
 source=projectPreVisitsSource(source,file);
 const row=patrol278Delta.kidsExtension;assert.equal(file,row.file);
 assert.equal(hash(source),row.afterSha256,'only exact kids 278 extension accepted');
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'all 1066c57 bytes restored');return source;
}
export function projectPreKidsSource(source,file='hani-office-live.js'){
 const row=patrol278Delta.kidsExtension;
 return row&&file===row.file&&hash(source)!==row.beforeSha256?restoreKids278Source(source,file):source;
}
export function projectPrePatrolSource(source,file='hani-office-live.js'){
 const row=patrol278Delta.files.find(r=>r.file===file);if(!row)return source;
 return hash(source)===row.beforeSha256?source:restorePatrol278Source(source,file);
}

// Exact outer visit extension; every older assertion remains on its frozen bytes.
export function restoreVisits278Source(source,file='hani-office-live.js'){
 source=projectPreStaffChatSource(source,file);
 const row=patrol278Delta.visitExtension;assert.equal(file,row.file);assert.equal(hash(source),row.afterSha256,'only exact visit 278 extension accepted');
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'every 59db365 byte restored');return source;
}
export function projectPreVisitsSource(source,file='hani-office-live.js'){
 source=projectPreStaffChatSource(source,file);
 const row=patrol278Delta.visitExtension;return file===row.file&&hash(source)===row.afterSha256?restoreVisits278Source(source,file):source;
}

// Strict outer staff-chat layer. Unrelated/partial changes still fail all pins.
export function restoreStaffChats278Source(source,file='hani-office-live.js'){
 source=projectPreBubblePlaceSource(source,file);
 const row=patrol278Delta.staffChatExtension;assert.equal(file,row.file);assert.equal(hash(source),row.afterSha256,'only exact staff-chat extension accepted');
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'all pre-chat bytes restored');return source;
}
export function projectPreStaffChatSource(source,file='hani-office-live.js'){
 source=projectPreBubblePlaceSource(source,file);
 const row=patrol278Delta.staffChatExtension;return file===row.file&&hash(source)===row.afterSha256?restoreStaffChats278Source(source,file):source;
}

// Exact PC bubble-only outer layer; all earlier frozen assertions stay intact.
export function restoreBubblePlace278Source(source,file='hani-office-live.js'){
 source=projectPreFix278Source(source,file);
 const row=patrol278Delta.bubblePlaceExtension;assert.equal(file,row.file);assert.equal(hash(source),row.afterSha256,'only exact bubble placement extension accepted');
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'all 0159d09 bytes restored');return source;
}
export function projectPreBubblePlaceSource(source,file='hani-office-live.js'){
 source=projectPreFix278Source(source,file);
 const row=patrol278Delta.bubblePlaceExtension;return file===row.file&&hash(source)===row.afterSha256?restoreBubblePlace278Source(source,file):source;
}

// Exact optimization/reset layer; every earlier assertion retains its frozen bytes.
export function restoreFix278Source(source,file='hani-office-live.js'){
 source=projectPreCompanionHomesSource(source,file);
 const row=patrol278Delta.fix278Extension;assert.equal(file,row.file);assert.equal(hash(source),row.afterSha256,'only exact fix278 bytes accepted');
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'every ccda3c8 byte restored');return source;
}
export function projectPreFix278Source(source,file='hani-office-live.js'){
 source=projectPreCompanionHomesSource(source,file);
 const row=patrol278Delta.fix278Extension;return file===row.file&&hash(source)===row.afterSha256?restoreFix278Source(source,file):source;
}

// Exact department-home outer layer; every older frozen contract stays intact.
export function restoreCompanionHomesSource(source,file='hani-office-live.js'){
 source=seoyunM9.projectPreSeoyunM9Source(source,file);
 const row=patrol278Delta.companionHomesExtension;assert.equal(file,row.file);assert.equal(hash(source),row.afterSha256,'only exact companion home bytes accepted');
 for(const r of row.replacements){assert.equal(source.split(r.after).length-1,1,'one complete home pair: '+r.name);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'every c590f8a byte restored');return source;
}
export function projectPreCompanionHomesSource(source,file='hani-office-live.js'){
 source=seoyunM9.projectPreSeoyunM9Source(source,file);
 const row=patrol278Delta.companionHomesExtension;return file===row.file&&hash(source)===row.afterSha256?restoreCompanionHomesSource(source,file):source;
}
