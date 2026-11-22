// Frozen 308 input only. All refs and Git objects remain independently available.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-308-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const stat=require('node:fs').statSync.bind(require('node:fs')),cache=new Map();
// Reuse a verified raw hash only while size, modification and change timestamps
// all retain their identity. Injected readers always run the complete byte gate.
function currentHash(file,read){
 if(read!==release.readRawFileSync)return release.hash(read(file));
 const info=stat(file,{bigint:true}),key=[info.dev,info.ino,info.size,info.mtimeNs,info.ctimeNs].join(':');
 const old=cache.get(file);if(old?.key===key)return old.hash;
 const hash=release.hash(read(file));cache.set(file,{key,hash});return hash;
}
for(const [file,pin]of Object.entries(release.layer.boundaries))assert.equal(release.hash(release.readRawFileSync(path.join(root,file))),pin,'frozen308 lower boundary '+file);
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(currentHash(path.join(root,file),read)!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries({...release.layer.owners,...release.layer.boundaries}))if(currentHash(path.join(root,file),read)!==pin)return base;
 return release.layer.base;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
function installEolBaseline(){
 // The legacy 203b fallback compares retained lines with origin/main. The menu
 // release changed this one retained header from CRLF to LF. Reconstruct that
 // exact historical EOL in this baseline input only; do not normalize any file.
 const entry=path.resolve(process.argv[1]||'');
 if(!['hani-ui-203b.test.mjs','hani-ui-203b-ui.test.mjs'].some(n=>entry===path.join(__dirname,n)))return;
 const read=repository.read;
 repository.read=function(ref,file){
  const source=read.apply(this,arguments);
  if(ref!==release.layer.release||file!=='hani-main.js'||selectBase(rawReadOnly(['merge-base','HEAD','origin/main']).trim())!==release.layer.base)return source;
  // Validate the isolated EOL inverse as well as the complete menu inverse.
  // Both comparison sides must omit the released menu-seen write together.
  if(release.hash(release.restoreEol(source))!==release.layer.eol.beforeSha256)return source;
  const previous=require('./hani-release-307-source.cjs'),menu=require('./hani-menu-badges-source.cjs');
  return menu.project(previous.project(release.project(source,file),file),file);
 };
}
module.exports={...repository,readOnly,rawReadOnly,selectBase,installEolBaseline};
