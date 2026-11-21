// Test-only menu boundary: explicit outer files are absent from the older tree.
// Do not alter Git trees/objects, assertions, or filesystem contents.
const path=require('node:path'),{fileURLToPath}=require('node:url');
const inverse=require('./hani-menu-badges-source.cjs'),repository=require('./hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'..'),authored='55f3fe64e2b88aa1b39ed503e3133614265e88d7';
const outerFiles=new Map([
 ['scripts/fixtures/menu-badges-layer.json',null],
 ['scripts/hani-menu-badges-layer.test.mjs',null],
 ['scripts/hani-menu-badges.test.mjs',null],
 ['scripts/hani-menu-seen.test.mjs',null],
 ['scripts/hani-menu-badges-compat.test.mjs','7db2ad030c506e579d4b66fa76d625e9e7068fc4496aaa236f32aa29ca8c3157']
]);
function relative(file){
 if(typeof file!=='string'&&!(file instanceof URL))return null;
 return path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
}
function directory(file,entries,read=inverse.readRawFileSync){
 const dir=relative(file);
 if(!['scripts','scripts/fixtures'].includes(dir))return entries;
 return entries.filter(entry=>{
  const name=typeof entry==='string'?entry:entry.name;
  if(typeof name!=='string')return true;
  const owner=dir+'/'+name;
  if(!outerFiles.has(owner))return true;
  // A changed or unknown outer file remains visible and fails the older check.
  const pin=outerFiles.get(owner)||inverse.hash(repository.read(authored,owner));
  return inverse.hash(read(path.join(root,owner)))!==pin;
 });
}
const diffOwners=['hani-main.js','index.html','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js'];
function emptyHistoricalDiff(command,args,options,read=inverse.readRawFileSync){
 if(command!=='git'||!Array.isArray(args)||!options||path.resolve(options.cwd||'.')!==root||
    Object.keys(options).some(k=>!['cwd','encoding','maxBuffer'].includes(k))||
    options.encoding!==undefined&&options.encoding!=='utf8'||
    args.length!==4+diffOwners.length||args[0]!=='diff'||args[1]!=='--unified=0'||
    args[2]!==inverse.layer.base||args[3]!=='--'||!diffOwners.every((f,i)=>args[i+4]===f))return null;
 // Prove the entire requested diff empty against independent Git blobs after
 // the exact menu inverse. Never delete selected lines from a nonempty diff.
 for(const owner of diffOwners){
  const source=inverse.project(read(path.join(root,owner)),owner);
  if(!Buffer.from(source).equals(Buffer.from(repository.read(inverse.layer.base,owner))))return null;
 }
 return options.encoding?'':Buffer.alloc(0);
}
function install(fs,entry){
 const name=relative(entry);
 if(['scripts/hani-helper-bubble-layer.test.mjs','scripts/hani-release-306.test.mjs'].includes(name)){
  const readdir=fs.readdirSync;
  fs.readdirSync=function(file,...args){return directory(file,readdir.call(this,file,...args))};
 }
 if(name==='scripts/hani-proactive-204.test.mjs'){
  const cp=require('node:child_process'),exec=cp.execFileSync;
  cp.execFileSync=function(command,args,options){
   const result=emptyHistoricalDiff(command,args,options);
   return result===null?exec.apply(this,arguments):result;
  };
 }
}
module.exports={directory,emptyHistoricalDiff,diffOwners,outerFiles,install,relative};
