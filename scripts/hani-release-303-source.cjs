// Test-only released303 metadata -> exact main302 metadata before dark-bundle.
// Capture actual disk before queen-v3, 302 and every older fs adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-303-layer.json'));
assert.equal(hash(bytes),'37a954f85706f61ea89d5fa55ac285402dcacdd33777090600f0acee5e8333fb','frozen release303 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.to,'2.9.303');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release303 owner');
 assert.equal(hash(source),row.after,'exact release-303 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release303 metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact release303 metadata');assert.equal(text.split(edit.after).length-1,1,'unique complete release303 metadata');text=text.replace(edit.after,()=>edit.before);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete release303 version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact main302 metadata output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&layer.files[file].after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
