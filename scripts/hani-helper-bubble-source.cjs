require('./hani-release-306-preload.cjs'); // Released306 metadata precedes the helper inverse.
// Test-only exact helper-bubble inverse, outside release305 and all older captures.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/helper-bubble-layer.json'));
assert.equal(hash(bytes),'ae1dd04ca9677d3a07377a3396827e59973bb0ee703da3e70ab775d29da7af01','frozen helper-bubble fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'helper-bubble');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known helper-bubble owner');
 assert.equal(hash(source),row.afterSha256,'exact helper-bubble input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete helper-bubble input bytes');
 assert.equal(row.replacements.length,row.count,'complete helper-bubble edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.ok(edit.after.length,'nonempty exact helper-bubble edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered helper-bubble edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact helper-bubble edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre-helper-bubble output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre-helper-bubble output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
