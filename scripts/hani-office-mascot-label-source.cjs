// Outermost exact inverse: only the complete authored display patch is accepted.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const {projectPreKidsPoseBSource}=require('./hani-office-kids-pose-b-source.cjs');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-mascot-label-delta.json'));
assert.equal(hash(bytes),'b5f68565f9ec61ab3f4f2697fb77144a1e9c4c1db26dc577500521f56879d26b','fixed mascot label delta bytes');
const delta=JSON.parse(bytes);assert.equal(delta.baseCommit,'fe7cfbd20e63ef3d56413b3a84a349f0adb90b63');
function restoreMascotLabelSource(source,file='hani-office-live.js'){
 source=projectPreKidsPoseBSource(source,file);
 assert.equal(file,delta.file);assert.equal(hash(source),delta.afterSha256,'only exact mascot label runtime accepted');
 for(const pair of delta.replacements){assert.equal(source.split(pair.after).length-1,1,'unique complete mascot pair: '+pair.name);source=source.replace(pair.after,()=>pair.before)}
 assert.equal(hash(source),delta.beforeSha256,'every affinity-cap HEAD byte restored');return source;
}
function projectPreMascotLabelSource(source,file='hani-office-live.js'){
 source=projectPreKidsPoseBSource(source,file);
 return file===delta.file&&hash(source)===delta.afterSha256?restoreMascotLabelSource(source,file):source;
}
module.exports={delta,hash,restoreMascotLabelSource,projectPreMascotLabelSource};
