// Test-only released308 metadata inverse before building,307, menu and older captures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-308-layer.json'));
assert.equal(hash(bytes),"333a59a05abc549560f11fd5a6e4ec982802e12dc447de0ca819c4de4f3e7c0e",'frozen release-308 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'release-308');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release-308 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-308 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete release-308 input bytes');
 assert.equal(row.replacements.length,row.count,'complete release-308 edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.ok(edit.after.length,'nonempty exact release-308 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered release-308 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release-308 edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre308 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre308 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
function restoreEol(source){
 const buffer=Buffer.isBuffer(source);if(hash(source)!==layer.eol.afterSha256)return source;
 const file='hani-main.js',saved=layer.files[file];try{layer.files[file]=layer.eol;return restore(source,file)}finally{layer.files[file]=saved}
}
module.exports={layer,hash,restore,project,restoreEol,readRawFileSync};
