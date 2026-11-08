const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-kids-pose-b-delta.json'));
assert.equal(hash(bytes),'755acb2933f3b98d61d0e612fd9c20c6831379107398544cbd86ab3d7cd518c8','exact authored kids pose B delta');
const delta=JSON.parse(bytes);assert.equal(delta.baseCommit,'70c5d5d8e1ddc1262314f412934b3a450974599c');
function restoreKidsPoseBSource(source,file='hani-office-live.js'){
 const row=delta.files.find(r=>r.file===file);assert.ok(row,'authored kids B file');
 assert.equal(hash(source),row.afterSha256,'only exact kids B bytes accepted: '+file);
 for(const r of row.replacements){assert.notEqual(r.before,r.after);assert.equal(source.split(r.after).length-1,1,'complete unique kids B pair: '+r.name);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),row.beforeSha256,'all fixed 70c5d5d bytes restored: '+file);return source;
}
function projectPreKidsPoseBSource(source,file='hani-office-live.js'){
 const row=delta.files.find(r=>r.file===file);return row&&hash(source)===row.afterSha256?restoreKidsPoseBSource(source,file):source;
}
module.exports={delta,hash,restoreKidsPoseBSource,projectPreKidsPoseBSource};
