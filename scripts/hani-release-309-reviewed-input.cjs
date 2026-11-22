// Test-only309 boundary. Git objects and ordinary reference queries stay actual.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-309-source.cjs'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),stat=fs.statSync.bind(fs),cache=new Map();
const actualReference=repository.reference,actualRead=repository.read;
function currentHash(file,read){
 if(read!==release.readRawFileSync)return release.hash(read(file));
 const info=stat(file,{bigint:true}),key=[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].join(':');
 const old=cache.get(file);if(old?.key===key)return old.hash;
 const hash=release.hash(read(file));cache.set(file,{key,hash});return hash;
}
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 if(actualReference('origin/main')!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(currentHash(path.join(root,file),read)!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(release.layer.owners))if(currentHash(path.join(root,file),read)!==pin)return base;
 return release.layer.base;
}
const entry=path.resolve(process.argv[1]||''),is308=entry===path.join(__dirname,'hani-release-308.test.mjs');
function authorized(){return selectBase(rawReadOnly(['merge-base','HEAD','origin/main']).trim())===release.layer.base}
function readOnly(args){
 // VM fixtures pass arrays from a separate realm; retain the exact protocol
 // values while using the repository reader's native Array prototype.
 args=Array.from(args);
 const result=rawReadOnly(args);
 if(args.length===3&&args.join(' ')==='merge-base HEAD origin/main')return selectBase(result.trim());
 //308 was authored before its tooling commit. Its HEAD-dependent script and
 //fixture comparisons describe that independently retained tree, not today's HEAD.
 if(is308&&args.length===2&&args[0]==='rev-parse'&&args[1]==='HEAD'&&authorized())return release.layer.authored308;
 return result;
}
function installHistoricalInputs(){
 if(is308)repository.reference=function(name){return name==='HEAD'&&authorized()?release.layer.authored308:actualReference(name)};
 if(['hani-ui-203b.test.mjs','hani-ui-203b-ui.test.mjs'].some(n=>entry===path.join(__dirname,n))){
  repository.read=function(ref,file){
   const source=actualRead.apply(this,arguments);
   if(ref!==release.layer.release||file!=='hani-main.js'||!authorized())return source;
   const view=require('./hani-ai-budget-view-source.cjs'),r308=require('./hani-release-308-source.cjs');
   const r307=require('./hani-release-307-source.cjs'),menu=require('./hani-menu-badges-source.cjs');
   return menu.project(r307.project(r308.project(view.project(release.project(source,file),file),file),file),file);
  };
 }
}
module.exports={...repository,readOnly,rawReadOnly,selectBase,currentHash,installHistoricalInputs,actualReference,actualRead};
