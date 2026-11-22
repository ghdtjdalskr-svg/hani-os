// Frozen test input only: building-v2data (v2 data file fallback, 308 prep) -> building-phase2 -> building-phase1 -> ...
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/building-v2data-layer.json'));
assert.equal(hash(bytes),'b1a1ef13d0a8d7f18110ac1ec4cf3baa6af755c6de5b6bacfa472071efbfdfea','frozen v2data inverse');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'building-v2data');
function project(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;
 if(!row||hash(source)!==row.afterSha256)return source;
 assert.equal(Buffer.byteLength(source),row.afterBytes);const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.replacements.slice().reverse()){
  assert.notEqual(edit.before,edit.after);assert.equal(text.slice(edit.afterStart,edit.afterStart+edit.after.length),edit.after,'exact inverse span '+file);
  text=text.slice(0,edit.afterStart)+edit.before+text.slice(edit.afterStart+edit.after.length);
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes);assert.equal(hash(text),row.beforeSha256,'exact Phase 2 output '+file);
 return buffer?Buffer.from(text):text;
}
module.exports={layer,hash,project,readRawFileSync};
