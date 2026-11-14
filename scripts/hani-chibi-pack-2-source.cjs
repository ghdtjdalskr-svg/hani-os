// Test-only outer exact inverse. This file is never loaded by the application.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/chibi-pack-2-delta.json'));
assert.equal(hash(bytes),'c85dac85e9e979538af367fb176f349f7d71da8ec18574631e69e608bb47b86c','frozen chibi-pack-2 inverse fixture');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known chibi-pack-2 owner');
 assert.equal(hash(source),row.afterSha256,'exact chibi-pack-2 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length-1,1,'one complete chibi-pack-2 edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact pre-chibi-pack-2 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){
 return delta.files[file]?.afterSha256===hash(source)?restore(source,file):source;
}
module.exports={readRawFileSync,hash,delta,restore,project};
