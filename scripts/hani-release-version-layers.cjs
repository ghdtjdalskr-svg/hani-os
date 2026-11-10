// Test-only exact outer layers. Add releases newest first in the JSON manifest.
// Each release removes its version bytes, then its optional frozen feature delta.
const assert=require('node:assert/strict');
const readRawFileSync=require('node:fs').readFileSync.bind(require('node:fs'));
const {createHash}=require('node:crypto');
const manifest=require('./fixtures/release-version-layers.json');
const outer=require('./hani-save-guard-source.cjs');
const hash=source=>createHash('sha256').update(source).digest('hex');
assert.equal(manifest.schema,1,'known release layer schema');
const layers=manifest.layers;
const number=version=>{
 assert.match(version,/^2\.9\.\d+$/,'exact release version');
 return Number(version.split('.')[2]);
};
for(const [i,layer] of layers.entries()){
 assert.equal(number(layer.to),number(layer.from)+1,'contiguous version inverse');
 if(i)assert.equal(layers[i-1].from,layer.to,'newest first, no release gaps');
 for(const file of ['index.html','hani-main.js'])assert.ok(layer.files[file],'canonical version owner '+file);
 for(const file of Object.keys(layer.files)){
  const row=layer.files[file];assert.ok(row,'canonical version owner '+file);
  assert.ok(Number.isSafeInteger(row.count)&&row.count>0,'exact token count');
  for(const pin of [row.before,row.after])assert.match(pin,/^[0-9a-f]{64}$/,'full SHA256 pin');
 }
}
function getLayer(version){const layer=layers.find(row=>row.to===version);assert.ok(layer,'known release layer '+version);return layer;}
function restoreVersionLayer(source,file,version){
 const layer=getLayer(version),row=layer.files[file];assert.ok(row,'known release version owner '+file);
 assert.equal(hash(source),row.after,'exact release-'+number(version)+' input '+file);
 const text=Buffer.isBuffer(source)?source.toString('utf8'):source;
 let changed=text;
 if(row.replacements){
  assert.equal(row.replacements.length,row.count,'complete release metadata edit count');
  for(const edit of row.replacements){
   assert.ok(edit.after.length,'nonempty exact metadata edit');
   assert.equal(changed.split(edit.after).length-1,1,'unique complete release metadata');
   changed=changed.replace(edit.after,()=>edit.before);
  }
 }else{
  assert.equal(text.split(layer.to).length-1,row.count,'complete version token count');
  changed=text.replaceAll(layer.to,layer.from);
 }
 const before=Buffer.isBuffer(source)?Buffer.from(changed):changed;
 assert.equal(hash(before),row.before,'exact release-'+number(layer.from)+' output '+file);
 return before;
}
// Projection dispatch accepts only pinned inputs; drift is left for the caller's
// strict lower-layer assertion to reject. It never normalizes arbitrary versions.
function project(source,file,target,features,keepFeature=false){
 // Peel only the pinned save-guard outer edits, retaining the 286 layer.
 source=outer.projectPreSaveGuard286Source(source,file);
 const boundary=number(target);
 assert.ok(layers.some(row=>row.from===target||row.to===target),'known release target '+target);
 for(const layer of layers){
  source=outer.projectPreSaveGuard286Source(source,file);
  const version=number(layer.to);
  if(version<boundary||version===boundary&&!keepFeature)break;
  const row=layer.files[file];
  if(row&&hash(source)===row.after)source=restoreVersionLayer(source,file,layer.to);
  if(features&&layer.feature&&!(keepFeature&&version===boundary)){
   const delta=require(layer.feature.fixture).files[file];
   if(delta&&hash(source)===delta.afterSha256){
    const buffer=Buffer.isBuffer(source);
    const restored=require(layer.feature.module)[layer.feature.restore](source,file);
    source=buffer?Buffer.from(restored):restored;
   }
  }
 }
 return source;
}
module.exports={layers,hash,getLayer,restoreVersionLayer,readRawFileSync,
 projectVersionSource:(source,file,target)=>project(source,file,target,false),
 projectReleaseSource:(source,file,target)=>project(source,file,target,true),
 // Leave this feature raw, peeling all newer releases and their features first.
 projectFeatureSource:(source,file,version)=>project(source,file,version,true,true)};
