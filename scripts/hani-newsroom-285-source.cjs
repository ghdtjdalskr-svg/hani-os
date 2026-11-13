// Test-only exact outer inverse: release 285 newsroom issue and layout.
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const hash=source=>createHash('sha256').update(source).digest('hex');
const bytes=require('node:fs').readFileSync(require('node:path').join(__dirname,'fixtures/newsroom-285-delta.json'));
assert.equal(hash(bytes),'56f1731b9d53a48a1cacc4b2471b8ce31eb67cc32a0d2dbd7f37cc3973ade085','frozen release-285 newsroom delta');
const delta=JSON.parse(bytes);
const lines=source=>source.match(/[^\n]*\n|[^\n]+$/g)||[];
function restoreNewsroom285Source(source,file){
 const row=delta.files[file];assert.ok(row,'known release-285 newsroom owner '+file);
 assert.equal(hash(source),row.afterSha256,'exact newsroom-285 input '+file);
 const buffer=Buffer.isBuffer(source),parts=lines(buffer?source.toString('utf8'):source);
 for(const edit of row.edits.toReversed()){
  const removed=lines(edit.after);
  assert.equal(parts.slice(edit.at,edit.at+removed.length).join(''),edit.after,'complete newsroom-285 edit');
  parts.splice(edit.at,removed.length,...lines(edit.before));
 }
 const before=parts.join('');assert.equal(hash(before),row.beforeSha256,'exact pre-newsroom-285 output '+file);
 return buffer?Buffer.from(before):before;
}
module.exports={delta,restoreNewsroom285Source};
