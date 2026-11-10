// Exact outer comparison layer for the approved main mascot/affinity-v2 merge.
// Keep the authored kids B bytes and the frozen weekday baseline unchanged.
const assert=require('node:assert/strict');
const {hash}=require('./hani-office-kids-weekday-source.cjs');
const cap=require('./hani-office-affinity-cap-source.cjs');
const mascot=require('./hani-office-mascot-label-source.cjs');
const after='6ed8145767ab7e0f762a64aba892182cd1df8c2c015cf23007056b818a758aaa';
const before='3c64d0e91bea897d3ee59a3e406a710934b40c2299abb9d9c0e10cd3d6d1fe1d';
function restoreMainOfficeSource(source,file='hani-office-live.js'){
 assert.equal(file,'hani-office-live.js','known merged main office owner');
 assert.equal(hash(source),after,'exact merged main office input');
 const buffer=Buffer.isBuffer(source);
 let restored=buffer?source.toString('utf8'):source;
 for(const pair of [{after:cap.delta.after,before:cap.delta.before},...mascot.delta.replacements]){
  assert.notEqual(pair.after,pair.before);
  assert.equal(restored.split(pair.after).length-1,1,'complete unique main office edit');
  restored=restored.replace(pair.after,()=>pair.before);
 }
 assert.equal(hash(restored),before,'exact authored weekday baseline output');
 return buffer?Buffer.from(restored):restored;
}
module.exports={after,before,restoreMainOfficeSource};
