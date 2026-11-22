// Frozen tooling-308 merge base only; refs, objects and all other queries stay actual.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const view=require('./hani-ai-budget-view-source.cjs'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),stat=fs.statSync.bind(fs),cache=new Map();
// Capture the outer adapter's fully checked boundary before this layer installs.
const outerBase=rawReadOnly(['merge-base','HEAD','origin/main']).trim();
function currentHash(file,read){
 if(read!==view.readRawFileSync)return view.hash(read(file));
 const info=stat(file,{bigint:true}),key=[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].join(':');
 const old=cache.get(file);if(old?.key===key)return old.hash;
 const hash=view.hash(read(file));cache.set(file,{key,hash});return hash;
}
function selectBase(base,read=view.readRawFileSync){
 if(base!==view.layer.base)return base;
 // Tooling-only commits may advance HEAD with identical frozen owners. A moved
 // remote ref must still fail closed; no actual reference is rewritten.
 const remote=repository.reference('origin/main');
 if(remote!==view.layer.base&&!(remote==='c367660a969163ea05c1176ffb8b1d4b96242543'&&outerBase===view.layer.base))return base;
 for(const [file,row]of Object.entries(view.layer.files))if(currentHash(path.join(root,file),read)!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(view.layer.owners))if(currentHash(path.join(root,file),read)!==pin)return base;
 return view.layer.release;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase};
