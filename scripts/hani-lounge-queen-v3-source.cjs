// Outermost test input. Capture candidate bytes before released302 and older layers.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/lounge-queen-v3-layer.json'));
assert.equal(hash(bytes),'de503ba06f4ccb56856a39f7a90593105985abb966391c8b3361f5be6c0f2dfd','frozen queen-v3 fixture');
const delta=JSON.parse(bytes);assert.equal(delta.schema,1);assert.equal(delta.layer,'lounge-queen-v3');
function restore(source,file){
 const row=Object.hasOwn(delta.files,file)?delta.files[file]:null;assert.ok(row,'known queen-v3 owner');
 assert.equal(hash(source),row.afterSha256,'exact queen-v3 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 for(const edit of row.edits.toReversed()){
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'complete queen-v3 hunk '+file);
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);
 }
 assert.equal(hash(text),row.beforeSha256,'exact main5073125 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(delta.files,file)&&delta.files[file].afterSha256===hash(source)?restore(source,file):source;}
// Keep the actual repository protocol outside every historical adapter. Only
// this frozen candidate and its exact released302/dark/seat owners authorize
// the tooling-only main advance from 5073125 back to the released302 boundary.
const gitBytes=readRawFileSync(path.join(__dirname,'fixtures/lounge-queen-v3-git.json'));
assert.equal(hash(gitBytes),'48b43f7ee9a8a3a6d1841774b1b94cf243953bbe64e79229a4f7bb7826d58972','frozen queen-v3 Git boundary');
const gitBoundary=JSON.parse(gitBytes);
assert.equal(gitBoundary.schema,1);assert.equal(gitBoundary.layer,'lounge-queen-v3-git');
assert.equal(gitBoundary.base,delta.base);
Object.freeze(gitBoundary.owners);Object.freeze(gitBoundary);
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const root=path.resolve(__dirname,'..');
function selectBase(base,read=readRawFileSync){
 if(base!==gitBoundary.base)return base;
 for(const [file,pin]of Object.entries(gitBoundary.owners))if(hash(read(path.join(root,file)))!==pin)return base;
 return gitBoundary.projectedBase;
}
function readOnly(args){
 const result=rawReadOnly(args);
 return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;
}
// Node's native Git child can be denied even when the calling PowerShell can
// read Git. Fall back to verified repository objects, never to guessed output.
// The sole diff fallback is an independently proven EMPTY diff; any changed
// byte, unsupported command/option or other process error remains a failure.
const childProcess=require('node:child_process'),rawExecFileSync=childProcess.execFileSync;
const diffOwners=['hani-main.js','index.html','hani-study-v02984.js','hani-goal-progress.js','hani-yuna-helpdesk.js'];
function deniedGitRead(file,args,options,error,read=readRawFileSync){
 if(error.code!=='EPERM'||file!=='git'||!Array.isArray(args)||!options||path.resolve(options.cwd||'.')!==root||
    Object.keys(options).some(k=>!['cwd','encoding','maxBuffer'].includes(k))||
    options.encoding!==undefined&&options.encoding!=='utf8')throw error;
 let result;
 if(args.length===3&&args.join(' ')==='merge-base HEAD origin/main')result=rawReadOnly(args)+'\n';
 else if(args.length===4+diffOwners.length&&args[0]==='diff'&&args[1]==='--unified=0'&&args[3]==='--'&&
         /^[a-f0-9]{40}$/.test(args[2])&&diffOwners.every((f,i)=>args[i+4]===f)){
  for(const owner of diffOwners)if(!Buffer.from(repository.read(args[2],owner)).equals(Buffer.from(read(path.join(root,owner)))))throw error;
  result='';
 }else throw error;
 return options.encoding?result:Buffer.from(result);
}
function execFileSync(file,args,options){
 try{return rawExecFileSync.apply(this,arguments)}catch(error){return deniedGitRead(file,args,options,error)}
}
module.exports={delta,hash,restore,project,readRawFileSync,gitBoundary,rawReadOnly,readOnly,selectBase,rawExecFileSync,deniedGitRead,execFileSync};
