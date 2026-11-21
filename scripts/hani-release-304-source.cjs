// Test-only released304 metadata -> exact pre304 metadata before UI Polish 1.
// This reader retains the actual disk bytes outside every historical adapter.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-304-layer.json'));
assert.equal(hash(bytes),'f7ad2620b818a79d64e43f764aa24041b09cf512783f7b133341d33d727b4599','frozen release304 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.to,'2.9.304');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release304 owner');
 assert.equal(hash(source),row.after,'exact release-304 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release304 metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact release304 metadata');assert.equal(text.split(edit.after).length-1,1,'unique complete release304 metadata');text=text.replace(edit.after,()=>edit.before);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete release304 version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact pre304 metadata output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&layer.files[file].after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
