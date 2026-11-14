// Test-only outer design inverse on main295. The frozen 294 fixture stays intact.
require('./hani-chibi-pack-3-preload.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/design-polish-1-main295-delta.json'));
assert.equal(hash(bytes),'5f445b8993a0830d13cb4628ecfb5caa53bb212716fe5ce4239afe0273a52445','frozen design-polish-1 main295 fixture');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known design-polish-1 main295 owner');
 assert.equal(hash(source),row.afterSha256,'exact design-polish-1 main295 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(file.endsWith('.css'))assert.ok(text.endsWith(row.edits[0].after),'exact design-polish-1 main295 CSS suffix');
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length-1,1,'one complete design-polish-1 main295 edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main295 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return delta.files[file]?.afterSha256===hash(source)?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
