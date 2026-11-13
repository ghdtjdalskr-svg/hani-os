// Use only for legacy Node tests. Do not preload a preview server/browser.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {delta,project:projectSource}=require('./hani-join-ieum-source.cjs');
// Capture the shared raw reader before installing this opt-in legacy adapter.
require('./hani-release-version-layers.cjs');
const root=path.resolve(__dirname,'..'),read=fs.readFileSync;
function project(file,bytes){
 if(process.env.HANI_IEUM_RAW==='1'||typeof file==='number')return bytes;
 const name=path.relative(root,path.resolve(file instanceof URL?fileURLToPath(file):String(file))).replaceAll('\\','/');
 return projectSource(bytes,name);
}
fs.readFileSync=function(file,options){return project(file,read.apply(this,arguments))};
const readAsync=fs.readFile,readPromise=fs.promises.readFile;
fs.readFile=function(file,...args){const callback=args.pop();return readAsync.call(this,file,...args,(error,bytes)=>{if(error)return callback(error);try{callback(null,project(file,bytes))}catch(error){callback(error)}})};
fs.promises.readFile=async function(file,...args){return project(file,await readPromise.call(this,file,...args))};
const Module=require('node:module'),compile=Module._extensions['.js'];
Module._extensions['.js']=function(module,file){const name=path.relative(root,file).replaceAll('\\','/');if(process.env.HANI_IEUM_RAW!=='1'&&delta.files.some(r=>r.file===name))return module._compile(fs.readFileSync(file,'utf8'),file);return compile(module,file)};
// Process permissions belong to the caller, not a source projection. The task
// runner supplies a separate Git deny guard; normal suites need no env opt-in.
require('node:module').syncBuiltinESMExports();
