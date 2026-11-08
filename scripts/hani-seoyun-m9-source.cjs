// Baseline: main 43eda9e (v2.9.281); released affinity/mascot/version bytes are not M9 changes.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),path=require('node:path');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/seoyun-m9-delta.json'));
assert.equal(hash(bytes),'e38aaf1d180f029ab559bb04b9109f458c980fc76d708cbbac5897a887130e96','exact authored M9 special listing delta');
const delta=JSON.parse(bytes);
assert.equal(delta.baseCommit,'43eda9e2e3f69115c3569f585506904965c26c18');
function restoreSeoyunM9Source(source,file='hani-office-live.js'){
 const row=delta.files.find(r=>r.file===file);assert.ok(row,'authored M9 file');
 assert.equal(hash(source),row.afterSha256,'only exact M9 special listing bytes accepted: '+file);
 for(const r of row.replacements.slice().reverse()){assert.notEqual(r.before,r.after);assert.equal(source.split(r.after).length-1,1,'unique complete M9 pair: '+r.name);source=source.replace(r.after,()=>r.before);}
 assert.equal(hash(source),row.beforeSha256,'every fixed pre-M9 byte restored: '+file);return source;
}
function projectPreSeoyunM9Source(source,file='hani-office-live.js'){
 const row=delta.files.find(r=>r.file===file);return row&&hash(source)===row.afterSha256?restoreSeoyunM9Source(source,file):source;
}
module.exports={delta,hash,restoreSeoyunM9Source,projectPreSeoyunM9Source};
