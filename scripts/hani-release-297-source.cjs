require('./hani-design-polish-2-preload.cjs'); // Preserve deployed297 pins beneath design2.
// Standalone test-only outer inverse. Capture deployed bytes before legacy adapters.
require('./hani-helper-toggle-preload.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const layer=JSON.parse(readRawFileSync(path.join(__dirname,'fixtures/release-version-layers.json'),'utf8')).layers.find(r=>r.to==='2.9.297');
assert.ok(layer,'known release297 outer layer');
function restore(source,file){
 const row=layer.files[file];assert.ok(row,'known release297 owner');
 assert.equal(hash(source),row.after,'exact release-297 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact metadata edit');assert.equal(text.split(edit.after).length-1,1,'unique complete release metadata');text=text.replace(edit.after,()=>edit.before);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact release-296 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return layer.files[file]?.after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
