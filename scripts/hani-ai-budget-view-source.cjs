// Test input only: exact AI budget view / 4-cut inverse before released308.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/ai-budget-view-layer.json'));
assert.equal(hash(bytes),'80900c8cc82f7c443d3286277c3d3c6fb87bd5ebb24c947706532a0018650aee','frozen ai-budget-view fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'ai-budget-view');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known ai-budget-view owner');
 assert.equal(hash(source),row.afterSha256,'exact ai-budget-view input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete ai-budget-view input bytes');
 assert.equal(row.replacements.length,row.count,'complete ai-budget-view edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.notEqual(edit.before,edit.after,'effective ai-budget-view edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered ai-budget-view edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact ai-budget-view edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre-view output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre-view output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
