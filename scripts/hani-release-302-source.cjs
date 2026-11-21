require('./hani-lounge-queen-v3-preload.cjs'); // Exact candidate inverse before302 capture.
// Test-only released302 metadata -> exact main301 metadata before dark-bundle.
// Capture actual disk before dark-bundle, 301, seats and every older fs adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-302-layer.json'));
assert.equal(hash(bytes),'b7f77339ce1592d1a1a075900ec3a18a7cef09763416e9a400f95e9d4871afb8','frozen release302 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.to,'2.9.302');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release302 owner');
 assert.equal(hash(source),row.after,'exact release-302 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release302 metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact release302 metadata');assert.equal(text.split(edit.after).length-1,1,'unique complete release302 metadata');text=text.replace(edit.after,()=>edit.before);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete release302 version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact main301 metadata output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&layer.files[file].after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
