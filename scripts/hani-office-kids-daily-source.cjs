// Exact outer daily-visit layer; all older weekday/B/main pins stay frozen.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=source=>createHash('sha256').update(source).digest('hex');
// Newer exact outer layer: the tap-bubble fix is peeled first, then this daily layer.
const {projectPreTapBubbleSource}=require('./hani-office-tap-bubble-source.cjs');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-kids-daily-delta.json'));
assert.equal(hash(bytes),'034494e170a749911d593ea97b1de09ce919d19503eebd61b47f6aeeb9dd7004','exact authored daily delta');
const delta=JSON.parse(bytes);assert.equal(delta.schema,1);assert.equal(delta.baseCommit,'3f40a06');
assert.equal(delta.beforeSha256,'7e941be508a5efea0c309c8c689cd32bf976d3122a49ac34c7579e33acf67f36');
function restoreKidsDailySource(source,file='hani-office-live.js'){
 assert.equal(file,delta.file,'known daily visit owner');
 source=projectPreTapBubbleSource(source,file);
 assert.equal(hash(source),delta.afterSha256,'only exact daily visit bytes accepted');
 const buffer=Buffer.isBuffer(source);let restored=buffer?source.toString('utf8'):source;
 for(const pair of delta.replacements){
  assert.notEqual(pair.before,pair.after);assert.equal(restored.split(pair.after).length-1,1,'unique complete daily pair');
  restored=restored.replace(pair.after,()=>pair.before);
 }
 assert.equal(hash(restored),delta.beforeSha256,'every pre-daily byte restored');
 return buffer?Buffer.from(restored):restored;
}
function projectPreKidsDailySource(source,file='hani-office-live.js'){
 source=projectPreTapBubbleSource(source,file);
 return file===delta.file&&hash(source)===delta.afterSha256?restoreKidsDailySource(source,file):source;
}
module.exports={delta,hash,restoreKidsDailySource,projectPreKidsDailySource};
