// Exact test-only inverse of the v2.9.289 budget view change. Runtime stays raw.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/budget-289-delta.json'));
assert.equal(hash(bytes),'c87f9014f214b5fee1d5264e050b750b24bdc0fd4901b00af4566de42c55b2c1','frozen budget-289 outer fixture');
const delta=JSON.parse(bytes);
function restoreBudget289Source(source,file){
  const row=delta.files[file];assert.ok(row,'known budget-289 owner');
  assert.equal(hash(source),row.afterSha256,'exact budget-289 input '+file);
  const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
  for(const edit of row.edits){
    assert.equal(text.split(edit.after).length-1,1,'unique complete budget-289 edit');
    text=text.replace(edit.after,()=>edit.before);
  }
  assert.equal(hash(text),row.beforeSha256,'exact pre-budget-289 bytes '+file);
  return buffer?Buffer.from(text):text;
}
module.exports={delta,hash,restoreBudget289Source};
