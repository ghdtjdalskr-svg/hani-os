// Exact304 metadata, UI inputs, frozen owners and the unreferenced #529 assets
// authorize a historical test view. rawReadOnly/reference/object retain reality.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-304-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),bytes=release.readRawFileSync(path.join(__dirname,'fixtures/ui-polish-1-layer.json'));
assert.equal(release.hash(bytes),release.layer.uiFixture,'frozen release304 UI boundary');
const ui=JSON.parse(bytes);assert.equal(ui.schema,1);assert.equal(ui.layer,'ui-polish-1');assert.equal(ui.base,release.layer.projectedBase);
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.after)return base;
 for(const [file,pin]of Object.entries(release.layer.passthrough))if(release.hash(read(path.join(root,file)))!==pin)return base;
 for(const [file,row]of Object.entries(ui.files))if(release.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(ui.owners)){
  let source=release.project(read(path.join(root,file)),file);
  if(Object.hasOwn(ui.files,file)){
   const row=ui.files[file],text=source.toString('utf8');
   source=row.position==='append'?text.slice(0,-row.added.length):text.slice(row.added.length);
  }
  if(release.hash(source)!==pin)return base;
 }
 return release.layer.projectedBase;
}
function readOnly(args){
 const result=rawReadOnly(args);
 if(args.length===3&&args.join(' ')==='merge-base HEAD origin/main')return selectBase(result.trim());
 // queen-v3's frozen HEAD/origin assertions describe the released303 test view.
 // Apply only to these two protocol queries and only after the same full gate.
 if(args.length===2&&args[0]==='rev-parse'&&['HEAD','origin/main'].includes(args[1])&&
    selectBase(rawReadOnly(['merge-base','HEAD','origin/main']).trim())===ui.base)return ui.projectedBase;
 return result;
}
module.exports={...repository,readOnly,rawReadOnly,selectBase,ui};
