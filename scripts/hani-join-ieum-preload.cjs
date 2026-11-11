// Use only for legacy Node tests. Do not preload a preview server/browser.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),{fileURLToPath}=require('node:url');
const {delta,hash,restore}=require('./hani-join-ieum-source.cjs');
const release289=require('./hani-join-ieum-release289.cjs');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync;
function project(file,bytes){
 if(process.env.HANI_IEUM_RAW==='1'||typeof file==='number')return bytes;
 const name=path.relative(root,path.resolve(file instanceof URL?fileURLToPath(file):String(file))).replaceAll('\\','/');
 const row=delta.files.find(r=>r.file===name);
 const lower=!row||hash(bytes)===row.beforeSha256?bytes:restore(bytes,name);
 return release289.project(lower,name);
}
fs.readFileSync=function(file,options){return project(file,read.apply(this,arguments))};
const readAsync=fs.readFile,readPromise=fs.promises.readFile;
fs.readFile=function(file,...args){const callback=args.pop();return readAsync.call(this,file,...args,(error,bytes)=>{if(error)return callback(error);try{callback(null,project(file,bytes))}catch(error){callback(error)}})};
fs.promises.readFile=async function(file,...args){return project(file,await readPromise.call(this,file,...args))};
const Module=require('node:module'),compile=Module._extensions['.js'];
Module._extensions['.js']=function(module,file){const name=path.relative(root,file).replaceAll('\\','/');if(process.env.HANI_IEUM_RAW!=='1'&&delta.files.some(r=>r.file===name))return module._compile(fs.readFileSync(file,'utf8'),file);return compile(module,file)};
// The task explicitly forbids Git commands, including subprocesses of tests.
// Only Seoyun's separately authorized environment may opt in for real Git oracles.
if(process.env.HANI_IEUM_ALLOW_GIT!=='1')for(const method of ['execFileSync','execFile','spawnSync','spawn','execSync','exec']){
 const original=cp[method];cp[method]=function(command,...args){
  if(/(?:^|[\\/\s])git(?:\.exe)?(?:$|\s)/i.test(String(command))){const error=new Error('HANI_GIT_FORBIDDEN: task forbids Git; rerun in Seoyun environment');error.code='HANI_GIT_FORBIDDEN';throw error}
  return original.call(this,command,...args);
 };
}
require('node:module').syncBuiltinESMExports();
