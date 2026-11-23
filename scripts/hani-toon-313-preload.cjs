// Node tests only: toon313 ->312 ->procrast-312 ->311 ->light-311; no runtime edits.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project,projectHelper,directory,layer}=require('./hani-toon-313-source.cjs'),root=path.resolve(__dirname,'..');
const sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return name===layer.helper.file?projectHelper(bytes):project(bytes,name);
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,bytes)=>{if(error)return done(error);let projected;try{projected=apply(file,bytes)}catch(e){return done(e)}done(null,projected)})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
if(['hani-helper-bubble-layer.test.mjs','hani-release-306.test.mjs'].includes(path.basename(process.argv[1]||''))){
 const readdir=fs.readdirSync;
 fs.readdirSync=function(file,...args){return directory(file,readdir.call(this,file,...args))};
}
require('node:module').syncBuiltinESMExports();
