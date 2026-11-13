// Test-only outer THAW inverse. Full-byte pins precede all frozen main layers.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/theme-thaw-main293-delta.json'));
assert.equal(hash(bytes),'131e9f7bba83a61a6ffb3b7878cf31376b0cbb3d6e66128f1b28111ef8f57bf5','frozen THAW main293 fixture');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known THAW owner');
 assert.equal(hash(source),row.afterSha256,'exact THAW input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(file.endsWith('.css'))assert.ok(text.endsWith(row.edits[0].after),'exact THAW CSS suffix');
 for(const edit of row.edits.toReversed()){
  assert.equal(text.split(edit.after).length-1,1,'unique complete THAW edit');
  text=text.replace(edit.after,()=>edit.before);
 }
 assert.equal(hash(text),row.beforeSha256,'exact pre-THAW output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){const row=delta.files[file];return row&&row.afterSha256===hash(source)?restore(source,file):source;}
// No count filtering: removing the exact fetch reference makes just these three
// assets unreachable. The closure resolver and all old count assertions stay raw.
module.exports={delta,hash,restore,project,readRawFileSync};
