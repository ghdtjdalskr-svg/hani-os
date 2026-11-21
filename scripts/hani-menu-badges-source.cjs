// Test-only exact menu badge inverse, outside306 and every older capture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/menu-badges-layer.json'));
assert.equal(hash(bytes),"f099196509836d63e70509eb3125865387e4f2e4f2b81fc40136601c7a98660f",'frozen menu-badges fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'menu-badges');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known menu-badges owner');
 assert.equal(hash(source),row.afterSha256,'exact menu-badges input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete menu-badges input bytes');
 assert.equal(row.replacements.length,row.count,'complete menu-badges edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.ok(edit.after.length,'nonempty exact menu-badges edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered menu-badges edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact menu-badges edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre-menu-badges output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre-menu-badges output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
