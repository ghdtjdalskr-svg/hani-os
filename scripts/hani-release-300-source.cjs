require('./hani-ieum-seat-preload.cjs'); // Exact main300 input before release-300 capture.
// Test-only exact deployed300 metadata -> frozen audit-1 candidate metadata.
// Capture disk before every older fs adapter; no runtime file is ever written.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-300-layer.json'));
assert.equal(hash(bytes),'323c8153ee8d714bf3c1dc8cace1e5f81bc9a3d126459da51e83f50d7e62985a','frozen release300 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.to,'2.9.300');
function restore(source,file){
 const row=layer.files[file];assert.ok(row,'known release300 owner');
 assert.equal(hash(source),row.after,'exact release-300 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact metadata edit');assert.equal(text.split(edit.after).length-1,1,'unique complete release metadata');text=text.replace(edit.after,()=>edit.before);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact audit-1 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return layer.files[file]?.after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
