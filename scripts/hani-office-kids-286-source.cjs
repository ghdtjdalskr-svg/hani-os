// Exact release-286 outer adapter; authored daily, weekday and B contracts stay frozen.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=source=>createHash('sha256').update(source).digest('hex');
const bytes=require('node:fs').readFileSync(require('node:path').join(__dirname,'fixtures/office-kids-286-delta.json'));
assert.equal(hash(bytes),'20ebd0967f509ec0e7aea34aca66dbafed735aec69b66d778b1d6425a5896e67','frozen release-286 kids adapter');
const delta=JSON.parse(bytes),kids=require('./hani-office-kids-pose-b-source.cjs');
function restoreKids286Source(source,file){
 const row=delta.files[file];assert.ok(row,'known release-286 kids owner '+file);
 assert.equal(hash(source),row.afterSha256,'exact kids-286 input '+file);
 const buffer=Buffer.isBuffer(source),before=kids.restoreKidsPoseBSource(buffer?source.toString('utf8'):source,file);
 assert.equal(hash(before),row.beforeSha256,'exact pre-kids-286 output '+file);
 return buffer?Buffer.from(before):before;
}
module.exports={delta,restoreKids286Source};
