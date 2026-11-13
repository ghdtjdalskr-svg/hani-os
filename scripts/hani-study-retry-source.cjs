// Exact outer projection for fixed legacy QA. Never relax its assertions.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const hash=value=>createHash('sha256').update(value).digest('hex');
const bytes=fs.readFileSync(require('node:path').join(__dirname,'fixtures/study-retry-delta.json'));
assert.equal(hash(bytes),'7459dec9429ef2c139a3ca3c2501e84ba5c0d8136c3f45c9131c5a93318fee28','frozen study-retry delta');
const delta=JSON.parse(bytes);
assert.equal(delta.base,'2bc93683182728877a6b8e543badb330a3312756');
exports.projectPreStudyRetrySource=source=>{
  assert.equal(hash(source),delta.afterSha256,'only the exact reviewed study-retry source is accepted');
  for(const pair of delta.replacements){
    assert.equal(source.split(pair.after).length-1,1,pair.name+' must be unique and complete');
    source=source.replace(pair.after,()=>pair.before);
  }
  assert.equal(hash(source),delta.beforeSha256,'restore the entire baseline exactly');
  return source;
};
