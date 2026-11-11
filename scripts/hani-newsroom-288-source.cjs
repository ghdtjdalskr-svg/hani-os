// Exact test-only outer inverse. Runtime and frozen lower assertions stay raw.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/newsroom-288-delta.json'));
assert.equal(hash(bytes),'fc825177d2adfb09b39b3669d616ff256ba1cdc057710063e063241573a90b98','frozen newsroom-288 outer fixture');
const delta=JSON.parse(bytes),lines=s=>s.match(/[^\n]*\n|[^\n]+$/g)||[];
function restoreNewsroom288Source(source,file){
  const row=delta.files[file];assert.ok(row,'known newsroom-288 owner');
  assert.equal(hash(source),row.afterSha256,'exact newsroom-288 input '+file);
  const buffer=Buffer.isBuffer(source),parts=lines(buffer?source.toString('utf8'):source);
  for(const edit of row.edits.toReversed()){
    const removed=lines(edit.after);assert.equal(parts.slice(edit.at,edit.at+removed.length).join(''),edit.after,'complete newsroom-288 edit');
    parts.splice(edit.at,removed.length,...lines(edit.before));
  }
  const before=parts.join('');assert.equal(hash(before),row.beforeSha256,'exact pre-newsroom-288 bytes '+file);
  return buffer?Buffer.from(before):before;
}
function projectPreNewsroom288Source(source,file){const row=delta.files[file];return row&&hash(source)===row.afterSha256?restoreNewsroom288Source(source,file):source;}
module.exports={delta,hash,restoreNewsroom288Source,projectPreNewsroom288Source};
