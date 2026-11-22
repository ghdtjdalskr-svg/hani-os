require('./hani-building-phase1-preload.cjs'); // Building inverses precede the307 capture.
// Test-only released307 version/history inverse before the menu and older captures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-307-layer.json'));
assert.equal(hash(bytes),"b209d2ffdd3dd4d17d996abd3bb81567c05f2450f7c28d2f48fb5ab32caddf7d",'frozen release-307 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'release-307');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release-307 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-307 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete release-307 input bytes');
 assert.equal(row.replacements.length,row.count,'complete release-307 edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.ok(edit.after.length,'nonempty exact release-307 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered release-307 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release-307 edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre307 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre307 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
