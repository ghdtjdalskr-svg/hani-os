require('./hani-building-phase1-preload.cjs'); // Phase 1 / motion / 306 precede every historical capture.
// Test-only released305 metadata/catalog -> exact304 input before every older reader.
// The single304 bootstrap require is also inverted for historical source tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-305-layer.json'));
assert.equal(hash(bytes),'26e43c56886021b4120a86af4e7054a030907e23822cb12fdf40e1bd5b77b784','frozen release305 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.to,'2.9.305');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release305 owner');
 assert.equal(hash(source),row.after,'exact release-305 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release305 metadata edit count');
  for(const edit of row.replacements){assert.ok(edit.after.length,'nonempty exact release305 metadata');assert.equal(text.split(edit.after).length-1,1,'unique complete release305 metadata');assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release305 metadata position');text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);}
 }else{assert.equal(text.split(layer.to).length-1,row.count,'complete release305 version token count');text=text.replaceAll(layer.to,layer.from);}
 assert.equal(hash(text),row.before,'exact pre305 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&layer.files[file].after===hash(source)?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
