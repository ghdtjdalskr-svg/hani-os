require('./hani-release-299-preload.cjs'); // Exact deployed299 version/history precedes design2.
// Input adapter only. Existing assertions see byte-exact main296, never loose normalization.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project}=require('./hani-design-polish-2-source.cjs'),root=path.resolve(__dirname,'..');
const sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return name==='hani-design-system.css'?project(bytes,name):bytes;
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,bytes)=>{if(error)return done(error);try{done(null,apply(file,bytes))}catch(e){done(e)}})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
