// Test-only310 boundary. Keep independently verified Git objects and actual refs accessible.
const repository=require('./hani-test-repository-evidence.cjs'),release=require('./hani-release-310-source.cjs');
const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
const actualReadOnly=repository.readOnly,actualReference=repository.reference;
const {layer,hash,readRawFileSync:read}=release,stat=fs.statSync.bind(fs),cache=new Map();
const gitEvidence={commit:repository.commit,tree:repository.tree,object:repository.object,changedFiles:repository.changedFiles},dataCache=new Map(),ancestryCache=new Map([[layer.release+':'+layer.base,false]]);
function descends(ref,ancestor,evidence=gitEvidence){
 if(!/^[a-f0-9]{40}$/.test(ref)||/^0{40}$/.test(ref))return false;
 const cache=evidence===gitEvidence?ancestryCache:null,trail=[],seen=new Set();let at=ref,valid=false;
 while(at){
  if(at===ancestor){valid=true;break}
  const cached=cache?.get(ancestor+':'+at);if(cached!==undefined){valid=cached;break}
  if(seen.has(at))break;seen.add(at);trail.push(at);
  if(/^0{40}$/.test(at))break;
  at=evidence.commit(at).parents[0];
 }
 if(cache)for(const sha of trail)cache.set(ancestor+':'+sha,valid);
 return valid;
}
function acceptsRemote(remote,evidence=gitEvidence){return descends(remote,layer.release,evidence)}
function gitFileHash(evidence,ref,file){
 let tree=evidence.commit(ref).tree,entry;
 const names=file.split('/');
 for(let i=0;i<names.length;i++){
  entry=evidence.tree(tree).find(row=>row.name===names[i]);
  if(!entry||entry.mode!==(i===names.length-1?'100644':'40000'))return null;
  tree=entry.sha;
 }
 const blob=evidence.object(tree);return blob.type===3?hash(blob.data):null;
}
function verifyDataCommit(remote,evidence=gitEvidence){
 if(!Object.hasOwn(layer.dataCommits||{},remote))return false;
 if(evidence===gitEvidence&&dataCache.has(remote))return dataCache.get(remote);
 const record=layer.dataCommits[remote],files=Object.keys(record.files).sort(),commit=evidence.commit(remote);
 let valid=commit.parents[0]===layer.release&&JSON.stringify(evidence.changedFiles(remote).slice().sort())===JSON.stringify(files);
 if(valid)for(const file of files){const row=record.files[file];if(gitFileHash(evidence,layer.release,file)!==row.beforeSha256||gitFileHash(evidence,remote,file)!==row.afterSha256){valid=false;break}}
 if(evidence===gitEvidence)dataCache.set(remote,valid);
 return valid;
}
function currentHash(file,reader){
 if(reader!==read)return hash(reader(file));
 const info=stat(file,{bigint:true}),key=[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].join(':');
 const old=cache.get(file);if(old?.key===key)return old.hash;
 const pin=hash(reader(file));cache.set(file,{key,hash:pin});return pin;
}
function selectBase(base,reader=read,remote=actualReference('origin/main')){
 // This oracle describes pinned local310 input. Forward main commits never
 // supply expected bytes; both actual refs must retain its first-parent anchor.
 if(!acceptsRemote(base)||!acceptsRemote(remote))return base;
 for(const [file,row]of Object.entries(layer.files))if(currentHash(path.join(root,file),reader)!==row.afterSha256)return base;
 // The separately landed data commit may be present after a tooling merge.
 // Accept its complete before or after cohort; never a mixed or unpinned input.
 const data=new Map();
 for(const [sha,record]of Object.entries(layer.dataCommits||{})){
  if(!verifyDataCommit(sha))return base;
  const rows=Object.entries(record.files).map(([file,pins])=>({pins,hash:currentHash(path.join(root,file),reader)}));
  const before=rows.every(row=>row.hash===row.pins.beforeSha256),after=rows.every(row=>row.hash===row.pins.afterSha256)&&descends(remote,sha);
  if(!before&&!after)return base;
  for(const [file,pins]of Object.entries(record.files))data.set(file,pins.beforeSha256);
 }
 for(const [file,pin]of Object.entries(layer.owners)){
  if(data.get(file)===pin)continue;
  if(currentHash(path.join(root,file),reader)!==pin)return base;
 }
 const helper=reader(path.join(root,layer.helper.file));
 const projected=release.projectHelper(helper,reader);
 if(projected===helper||hash(projected)!==layer.helper.beforeSha256)return base;
 return layer.base;
}
function authorized(){const base=actualReadOnly(['merge-base','HEAD','origin/main']).trim();return acceptsRemote(base)&&selectBase(base)===layer.base}
function readOnly(args){
 args=Array.from(args);const value=actualReadOnly(args);
 if(args.length===3&&args.join(' ')==='merge-base HEAD origin/main')return selectBase(value.trim());
 if(args.length===2&&args[0]==='rev-parse'&&args[1]==='origin/main'&&authorized())return layer.base;
 return value;
}
function reference(name){return name==='origin/main'&&authorized()?layer.base:actualReference(name)}
function installHistoricalInputs(){repository.readOnly=readOnly;repository.reference=reference}
module.exports={actualReadOnly,actualReference,readOnly,reference,selectBase,currentHash,installHistoricalInputs,acceptsRemote,descends,verifyDataCommit,gitFileHash};
