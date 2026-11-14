// Outermost feature inverse: main296 + chibi3 -> exact main296. Test-only.
require('./hani-release-297-preload.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/chibi-pack-3-delta.json'));
assert.equal(hash(bytes),'e5ce922d0307e915bae15a2b93e6ebfee06d9e313172fa9b576244cd31a44a90','frozen chibi-pack-3 fixture');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known chibi-pack-3 owner');
 assert.equal(hash(source),row.afterSha256,'exact chibi-pack-3 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length-1,1,'one complete chibi-pack-3 edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main296 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return delta.files[file]?.afterSha256===hash(source)?restore(source,file):source;}
module.exports={readRawFileSync,hash,delta,restore,project};
