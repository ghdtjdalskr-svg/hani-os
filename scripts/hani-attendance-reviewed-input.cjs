// Historical test boundary only. Actual Git refs, trees, objects and disk stay intact.
const repository=require('./hani-test-repository-evidence.cjs'),attendance=require('./hani-attendance-source.cjs');
const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
const actualReadOnly=repository.readOnly,actualReference=repository.reference;
const {layer,hash,readRawFileSync:read}=attendance,stat=fs.statSync.bind(fs),cache=new Map();
function currentHash(file,reader){
 if(reader!==read)return hash(reader(file));
 const info=stat(file,{bigint:true}),key=[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].join(':');
 const old=cache.get(file);if(old?.key===key)return old.hash;
 const pin=hash(reader(file));cache.set(file,{key,hash:pin});return pin;
}
function treeRows(ref){
 const rows=new Map();
 function walk(sha,prefix){for(const row of repository.tree(sha)){const name=prefix+row.name;if(row.mode==='40000')walk(row.sha,name+'/');else rows.set(name,row)}}
 walk(repository.commit(ref).tree,'');return rows;
}
const baseRows=treeRows(layer.base),treeCache=new Map();
function acceptsRemote(remote){
 if(treeCache.has(remote))return treeCache.get(remote);
 const rows=treeRows(remote);let additions=0;
 for(const [name,row]of baseRows){const next=rows.get(name);if(next?.sha!==row.sha||next?.mode!==row.mode){treeCache.set(remote,false);return false}}
 for(const [name,row]of rows)if(!baseRows.has(name)){
  if(!Object.hasOwn(layer.prelanded,name)||row.mode!=='100644'||hash(repository.object(row.sha).data)!==layer.prelanded[name]){treeCache.set(remote,false);return false}additions++;
 }
 const ok=additions===0||additions===Object.keys(layer.prelanded).length;treeCache.set(remote,ok);return ok;
}
function selectBase(base,reader=read,remote=actualReference('origin/main')){
 if(base!==layer.base&&base!==remote)return base;
 if(!acceptsRemote(remote))return base;
 for(const [file,row]of Object.entries(layer.files))if(currentHash(path.join(root,file),reader)!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries({...layer.owners,...layer.prelanded}))if(currentHash(path.join(root,file),reader)!==pin)return base;
 return layer.release;
}
function authorized(){return selectBase(actualReadOnly(['merge-base','HEAD','origin/main']).trim())===layer.release}
function readOnly(args){
 args=Array.from(args);const value=actualReadOnly(args);
 if(args.length===3&&args.join(' ')==='merge-base HEAD origin/main')return selectBase(value.trim());
 if(args.length===2&&args[0]==='rev-parse'&&args[1]==='origin/main'&&authorized())return layer.release;
 return value;
}
function reference(name){return name==='origin/main'&&authorized()?layer.release:actualReference(name)}
function installHistoricalInputs(){repository.readOnly=readOnly;repository.reference=reference}
module.exports={actualReadOnly,actualReference,readOnly,reference,selectBase,acceptsRemote,treeRows,currentHash,installHistoricalInputs};
