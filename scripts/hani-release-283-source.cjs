// Test-only outer inverse: release 283 changed exactly 60 index and one main
// version tokens. Full input/output digests retain every other byte and EOL.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {projectPreRelease284Source}=require('./hani-release-284-source.cjs');
const hash=s=>createHash('sha256').update(s).digest('hex');
const files={
 'index.html':{after:'15226a2f3e63b350865ef24d296c7ce34a44e36307f17b77449e5cb8494a0c59',before:'93f4ad567faa2858a881f33bfd473b5b2be971d97160f4a1aea830e082d4752b',count:60},
 'hani-main.js':{after:'636a4ac932bbbc99960135c2583d2430353b68eed2e13714be916f36e22bdd31',before:'4cab375b51ac3895d6f7e3697dcbeaa17254dcaf8040f1e08b7dfc9fc7c860c1',count:1}
};
function restoreRelease283(source,file){
 source=projectPreRelease284Source(source,file);
 const row=files[file];assert.ok(row,'known release-283 owner');
 assert.equal(hash(source),row.after,'exact release-283 input '+file);
 assert.equal(source.split('2.9.283').length-1,row.count,'complete version token count');
 const before=source.replaceAll('2.9.283','2.9.282');
 assert.equal(hash(before),row.before,'exact release-282 life-bundle bytes '+file);
 return before;
}
function projectPreRelease283Source(source,file){source=projectPreRelease284Source(source,file);return files[file]&&hash(source)===files[file].after?restoreRelease283(source,file):source;}
module.exports={files,restoreRelease283,projectPreRelease283Source};
