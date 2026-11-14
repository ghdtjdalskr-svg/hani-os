// Test-only exact outer layers. Add releases newest first in the JSON manifest.
require('./hani-chibi-pack-2-preload.cjs');
// Each release removes its version bytes, then its optional frozen feature delta.
const thaw=require('./hani-theme-thaw-source.cjs');
const assert=require('node:assert/strict');
// Capture disk bytes before the legacy chibi2 fs adapter; current release tests
// and future manifest rows must see the outermost deployed bytes.
const chibi2=require('./hani-chibi-pack-2-source.cjs');
const {readRawFileSync}=require('./hani-release-299-source.cjs');
const {createHash}=require('node:crypto');
const manifest=require('./fixtures/release-version-layers.json');
const outer=require('./hani-save-guard-source.cjs');
const hash=source=>createHash('sha256').update(source).digest('hex');
assert.equal(manifest.schema,1,'known release layer schema');
const layers=manifest.layers;
// Read fixture JSON through the captured raw reader. Legacy fs adapters can
// invoke this dispatcher while Node is itself loading a JSON/module file.
const featureManifests=new Map();
function featureFiles(fixture){
 if(!featureManifests.has(fixture))featureManifests.set(fixture,JSON.parse(readRawFileSync(require('node:path').resolve(__dirname,fixture),'utf8')).files);
 return featureManifests.get(fixture);
}
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
// 299 version/history -> frozen design2 -> 298 -> frozen helper-toggle -> 297
// -> frozen chibi3 -> 296 -> frozen design1
// -> 295 version/history -> frozen chibi2 -> 294 -> THAW
// -> 293 version/history -> frozen chibi -> 292 version/office -> 291 contrast
// -> 290 Ieum -> frozen 289/288. Each step retains full input/output pins.
// Newest exact version bytes precede their feature inverse. The 289 adapter
// first removes 290 + Ieum, then reaches the unchanged 289/288 contracts.
// Unknown input remains for strict callers to reject.
function projectPreRelease294Source(source,file){
 source=project(source,file,'2.9.294',true);
 const row=getLayer('2.9.294').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.294'):source;
}
function projectPreRelease295Source(source,file){
 source=project(source,file,'2.9.295',true);
 const row=getLayer('2.9.295').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.295'):source;
}
function projectPreRelease296Source(source,file){
 source=project(source,file,'2.9.296',true);
 const row=getLayer('2.9.296').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.296'):source;
}
function projectPreRelease297Source(source,file){
 source=project(source,file,'2.9.297',true);
 const row=getLayer('2.9.297').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.297'):source;
}
function projectPreRelease298Source(source,file){
 source=project(source,file,'2.9.298',true);
 const row=getLayer('2.9.298').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.298'):source;
}
function projectPreRelease299Source(source,file){
 source=project(source,file,'2.9.299',true);
 const row=getLayer('2.9.299').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.299'):source;
}
function projectPreRelease290Source(source,file){
 source=project(source,file,'2.9.290',true);
 const row=getLayer('2.9.290').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.290'):source;
}
function projectPreRelease289Source(source,file){
 source=require('./hani-join-ieum-source.cjs').project(source,file);
 const row=getLayer('2.9.289').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.289'):source;
}
function projectPreRelease288Source(source,file){
 source=projectPreRelease289Source(source,file);
 const row=getLayer('2.9.288').files[file];
 return row&&hash(source)===row.after?restoreVersionLayer(source,file,'2.9.288'):source;
}
// Projection dispatch accepts only pinned inputs; drift is left for the caller's
// strict lower-layer assertion to reject. It never normalizes arbitrary versions.
function project(source,file,target,features,keepFeature=false){
 const boundary=number(target);
 assert.ok(layers.some(row=>row.from===target||row.to===target),'known release target '+target);
 for(const layer of layers){
  const version=number(layer.to);
  if(version<boundary)break;
  // Older unversioned design inputs still enter their unchanged strict inverse.
  if(version<=295)source=require('./hani-design-polish-1-source.cjs').project(source,file);
  // THAW is inside the deployed 294 bytes. Its frozen history metadata already
  // includes the released 293 commit; 294 owns that complete history edit once.
  if(version<=293)source=thaw.project(source,file);
  // Release 287 wraps the guarded 286 bytes. Peel the guard only at 286.
  if(version<=286)source=outer.projectPreSaveGuard286Source(source,file);
  if(version<boundary||version===boundary&&!keepFeature)break;
  const row=layer.files[file];
  if(row&&hash(source)===row.after)source=restoreVersionLayer(source,file,layer.to);
  if(features&&layer.feature&&!(keepFeature&&version===boundary)){
   const files=featureFiles(layer.feature.fixture);
   const delta=Array.isArray(files)?files.find(row=>row.file===file):files[file];
   if(delta&&hash(source)===delta.afterSha256){
    const buffer=Buffer.isBuffer(source);
    const restored=require(layer.feature.module)[layer.feature.restore](source,file);
    source=buffer?Buffer.from(restored):restored;
   }
  }
 }
 return source;
}
// Frozen tests choose an explicit release boundary without altering assertions,
// fixture pins or the strict inverses. Reads always start at unadapted disk bytes.
function createReleaseReader(version,keepFeature=false){
 const path=require('node:path'),{fileURLToPath}=require('node:url'),root=path.resolve(__dirname,'..');
 return (file,...args)=>{
  const source=readRawFileSync(file,...args);
  if(typeof file!=='string'&&!(file instanceof URL))return source;
  const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
  return project(source,name,version,true,keepFeature);
 };
}
module.exports={layers,hash,getLayer,restoreVersionLayer,readRawFileSync,projectPreRelease288Source,projectPreRelease289Source,projectPreRelease290Source,projectPreRelease294Source,projectPreRelease295Source,projectPreRelease296Source,projectPreRelease297Source,projectPreRelease298Source,projectPreRelease299Source,
 createReleaseReader,
 projectVersionSource:(source,file,target)=>project(source,file,target,false),
 projectReleaseSource:(source,file,target)=>project(source,file,target,true),
 // Leave this feature raw, peeling all newer releases and their features first.
 projectFeatureSource:(source,file,version)=>project(source,file,version,true,true)};
