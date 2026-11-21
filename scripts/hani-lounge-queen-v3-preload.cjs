// queen-v3 -> 302 metadata -> dark-bundle -> 301 -> ieum-seat -> 300 -> older.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project,readOnly,execFileSync}=require('./hani-lounge-queen-v3-source.cjs'),root=path.resolve(__dirname,'..');
require('./hani-test-repository-evidence.cjs').readOnly=readOnly;
require('node:child_process').execFileSync=execFileSync;
const sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return project(bytes,name);
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,bytes)=>{if(error)return done(error);let projected;try{projected=apply(file,bytes)}catch(e){return done(e)}done(null,projected)})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
