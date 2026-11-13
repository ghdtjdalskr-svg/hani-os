// Explicit legacy test adapter only. Never imported by browser/runtime owners.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project}=require('./hani-theme-thaw-source.cjs'),root=path.resolve(__dirname,'..');
const read=fs.readFileSync,asyncRead=fs.readFile,promiseRead=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return project(bytes,name);
}
fs.readFileSync=function(file,...args){return apply(file,read.call(this,file,...args))};
fs.readFile=function(file,...args){const callback=args.pop();return asyncRead.call(this,file,...args,(err,bytes)=>{if(err)return callback(err);try{callback(null,apply(file,bytes))}catch(error){callback(error)}})};
fs.promises.readFile=async function(file,...args){return apply(file,await promiseRead.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
