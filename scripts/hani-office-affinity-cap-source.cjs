// Exact outer inverse for the approved daily-cap patch. Never strips arbitrary edits.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),path=require('node:path');
const {projectPreMascotLabelSource}=require('./hani-office-mascot-label-source.cjs');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-affinity-cap-delta.json'));
assert.equal(hash(bytes),'29945522d9ea31aa9af69fc8ff17709ec7accc5d9c659832e8878dba60b63b10','fixed daily-cap delta bytes');
const delta=JSON.parse(bytes);
assert.equal(delta.baseCommit,'2463e88526e585275395e3a564aaff7dfafc25c8');
function restoreAffinityCapSource(source,file='hani-office-live.js'){
 source=projectPreMascotLabelSource(source,file);
 assert.equal(file,delta.file);assert.equal(hash(source),delta.afterSha256,'only exact daily-cap runtime accepted');
 assert.equal(source.split(delta.after).length-1,1,'unique complete daily-cap owner');
 const restored=source.replace(delta.after,()=>delta.before);
 assert.equal(hash(restored),delta.beforeSha256,'all base bytes restored');return restored;
}
function projectPreAffinityCapSource(source,file='hani-office-live.js'){
 source=projectPreMascotLabelSource(source,file);
 return file===delta.file&&hash(source)===delta.afterSha256?restoreAffinityCapSource(source,file):source;
}
module.exports={delta,hash,restoreAffinityCapSource,projectPreAffinityCapSource};
