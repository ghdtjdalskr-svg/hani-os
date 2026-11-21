// Test-only released306 version/history inverse before the helper and older captures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-306-layer.json'));
assert.equal(hash(bytes),"2523a8db4923c0f2281cc6f587be30814c79a3e7b1223b79ff5106ffe3e1d713",'frozen release-306 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'release-306');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release-306 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-306 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete release-306 input bytes');
 assert.equal(row.replacements.length,row.count,'complete release-306 edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.ok(edit.after.length,'nonempty exact release-306 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered release-306 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release-306 edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre306 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre306 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
