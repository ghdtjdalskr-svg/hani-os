// Test-only outer exact inverse. No browser/runtime imports or response rewriting.
require('./hani-chibi-pack-3-preload.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/design-polish-1-delta.json'));
assert.equal(hash(bytes),'4d4221180ecc8671efbcabe7fae200e4df2b1dc385c3ca96e5e4486b5a9f646f','frozen design-polish-1 fixture');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known design-polish-1 owner');
 assert.equal(hash(source),row.afterSha256,'exact design-polish-1 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(file.endsWith('.css'))assert.ok(text.endsWith(row.edits[0].after),'exact design-polish-1 CSS suffix');
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length-1,1,'one complete design-polish-1 edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact pre-design-polish-1 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){const row=delta.files[file];if(!row)return source;source=require('./hani-release-296-source.cjs').project(source,file);source=require('./hani-design-polish-1-main295-source.cjs').project(source,file);return hash(source)===row.afterSha256?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
