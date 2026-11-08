// Existing 283 proofs remain immutable. Undo only the exact 284 version layer.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const files={
 'index.html':{after:'02aba01325adb688c61a933740532dad303dc1b3ff1b870a55e44ac26c7561c5',before:'15226a2f3e63b350865ef24d296c7ce34a44e36307f17b77449e5cb8494a0c59',count:60},
 'hani-main.js':{after:'9b9cd783236aaf6d5941a3575ef92cf1e49e0ffd084e5ef54cfa6d4ac5cdf1e9',before:'636a4ac932bbbc99960135c2583d2430353b68eed2e13714be916f36e22bdd31',count:1}
};
function restore284(source,file){
 const row=files[file];assert.ok(row,'known 284 version owner');assert.equal(hash(source),row.after,'exact 284 input');
 assert.equal(source.split('2.9.284').length-1,row.count,'complete 284 token count');
 const before=source.replaceAll('2.9.284','2.9.283');assert.equal(hash(before),row.before,'existing pinned 283 owner');return before;
}
function projectPre284(source,file){return files[file]&&hash(source)===files[file].after?restore284(source,file):source;}
module.exports={files,restore284,projectPre284};
