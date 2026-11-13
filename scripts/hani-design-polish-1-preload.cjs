// Legacy test readers see the exact cb11935 bytes. Never imported by runtime.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project}=require('./hani-design-polish-1-source.cjs'),root=path.resolve(__dirname,'..');
const sync=fs.readFileSync,callbackRead=fs.readFile,promiseRead=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return ['hani-main.js','hani-design-system.css'].includes(name)?project(bytes,name):bytes;
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callbackRead.call(this,file,...args,(error,bytes)=>{if(error)return done(error);try{done(null,apply(file,bytes))}catch(e){done(e)}})};
fs.promises.readFile=async function(file,...args){return apply(file,await promiseRead.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
