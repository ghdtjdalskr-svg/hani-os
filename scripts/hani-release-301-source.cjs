require('./hani-dark-bundle-preload.cjs'); // Restore exact main301 before its raw-reader capture.
// Test-only exact deployed301 metadata -> main300 metadata with committed seats.
// The raw reader captures disk before ieum-seat and all older fs adapters.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-301-layer.json'));
assert.equal(hash(bytes),'fd3d6d8a4e31dbfe0175854e4994488e24de23823283a73fdb20174601724cf5','frozen release301 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.to,'2.9.301');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release301 owner');
 assert.equal(hash(source),row.after,'exact release-301 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release301 metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact release301 metadata');assert.equal(text.split(edit.after).length-1,1,'unique complete release301 metadata');text=text.replace(edit.after,()=>edit.before);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete release301 version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact main300 metadata output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&layer.files[file].after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
