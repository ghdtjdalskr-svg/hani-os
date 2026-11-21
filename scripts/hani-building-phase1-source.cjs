// Frozen test input only: Phase 1 -> office motion -> 306 -> existing 305 chain.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/building-phase1-layer.json'));
assert.equal(hash(bytes),'7c895e924197e39717b7c81d2a5bc1ce4ce88f893886a610ad78f1acf97e674d','frozen building Phase 1 inverse');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'building-phase1');
assert.deepEqual(layer.stages.map(s=>s.name),['building-phase1','office-motion','306']);
function restoreStage(source,file,name){
 const stage=layer.stages.find(s=>s.name===name),row=stage?.files[file];assert.ok(row,'known inverse stage/file');
 assert.equal(hash(source),row.afterSha256,'exact '+name+' input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes);assert.ok(row.replacements.length);
 for(const edit of row.replacements.slice().reverse()){
  assert.notEqual(edit.before,edit.after);assert.equal(text.slice(edit.afterStart,edit.afterStart+edit.after.length),edit.after,'exact inverse span');
  text=text.slice(0,edit.afterStart)+edit.before+text.slice(edit.afterStart+edit.after.length);
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes);assert.equal(hash(text),row.beforeSha256,'exact '+name+' output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){for(const stage of layer.stages){const row=Object.hasOwn(stage.files,file)?stage.files[file]:null;if(row&&hash(source)===row.afterSha256)source=restoreStage(source,file,stage.name)}return source}
module.exports={layer,hash,restoreStage,project,readRawFileSync};
