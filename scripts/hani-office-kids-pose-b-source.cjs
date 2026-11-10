const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const weekday=require('./hani-office-kids-weekday-source.cjs');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-kids-pose-b-delta.json'));
assert.equal(hash(bytes),'e9ea69c80ada9af199197230f2edb84bf95173d5686166ac57910956549c8c89','exact authored kids pose B delta');
const delta=JSON.parse(bytes);assert.equal(delta.baseCommit,'70c5d5d8e1ddc1262314f412934b3a450974599c');
// baseCommit records authorship; the merged contract pins the new main exactly.
assert.equal(delta.mergeBase,'5c375d9','fixed merged main 284 baseline');
function restoreKidsPoseBSource(source,file='hani-office-live.js'){
 source=weekday.projectPreKidsWeekdaySource(source,file);
 const row=delta.files.find(r=>r.file===file);assert.ok(row,'authored kids B file');
 assert.equal(hash(source),row.afterSha256,'only exact kids B bytes accepted: '+file);
 for(const r of row.replacements){assert.notEqual(r.before,r.after);assert.equal(source.split(r.after).length-1,1,'complete unique kids B pair: '+r.name);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'all fixed 70c5d5d bytes restored: '+file);return source;
}
function projectPreKidsPoseBSource(source,file='hani-office-live.js'){
 source=weekday.projectPreKidsWeekdaySource(source,file);
 const row=delta.files.find(r=>r.file===file);return row&&hash(source)===row.afterSha256?restoreKidsPoseBSource(source,file):source;
}
module.exports={delta,hash,restoreKidsPoseBSource,projectPreKidsPoseBSource};
