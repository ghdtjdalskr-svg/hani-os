// Test-only312 boundary. Actual refs and independently verified Git objects stay accessible.
const repository=require('./hani-test-repository-evidence.cjs'),release=require('./hani-release-312-source.cjs');
const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
const actualReadOnly=repository.readOnly,actualReference=repository.reference;
const {layer,hash,readRawFileSync:read}=release,stat=fs.statSync.bind(fs),cache=new Map(),ancestryCache=new Map();
const gitEvidence={commit:repository.commit};
function acceptsRemote(ref,evidence=gitEvidence){
 if(!/^[a-f0-9]{40}$/.test(ref)||/^0{40}$/.test(ref))return false;
 const memo=evidence===gitEvidence?ancestryCache:null,trail=[],seen=new Set();let at=ref,valid=false;
 while(at){
  if(at===layer.release){valid=true;break}
  const saved=memo?.get(at);if(saved!==undefined){valid=saved;break}
  if(seen.has(at)||/^0{40}$/.test(at))break;seen.add(at);trail.push(at);
  at=evidence.commit(at).parents[0];
 }
 if(memo)for(const sha of trail)memo.set(sha,valid);
 return valid;
}
function currentHash(file,reader){
 if(reader!==read)return hash(reader(file));
 const info=stat(file,{bigint:true}),key=[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].join(':');
 const old=cache.get(file);if(old?.key===key)return old.hash;
 const pin=hash(reader(file));cache.set(file,{key,hash:pin});return pin;
}
function selectBase(base,reader=read,remote=actualReference('origin/main')){
 // Forward refs can retain the frozen312 prefix, but never supply expected bytes.
 if(!acceptsRemote(base)||!acceptsRemote(remote))return base;
 for(const [file,row]of Object.entries(layer.files))if(currentHash(path.join(root,file),reader)!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(layer.owners))if(currentHash(path.join(root,file),reader)!==pin)return base;
 const helper=reader(path.join(root,layer.helper.file)),before=release.projectHelper(helper,reader);
 if(before===helper||hash(before)!==layer.helper.beforeSha256)return base;
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
module.exports={actualReadOnly,actualReference,readOnly,reference,selectBase,currentHash,installHistoricalInputs,acceptsRemote};
