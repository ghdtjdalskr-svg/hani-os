// Independent fixed-commit runtime inputs for the newly exercised lounge suite.
// Read-only Git objects, no Git process/ref lookup and no disk writes.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..');
const read=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile,cache=new Map();
function apply(file,value){
 if(typeof file!=='string'&&!(file instanceof URL))return value;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 if(!(/^[^/]+\.(?:js|css|html)$/.test(name)||/^(?:data|assets\/data)\/.+\.json$/.test(name)))return value;
 if(!cache.has(name))cache.set(name,repo.read('2220b6129c63721906a3788ee9a7681f197c4523',name));
 const source=cache.get(name);return Buffer.isBuffer(value)?Buffer.from(source):source;
}
fs.readFileSync=function(file,...args){return apply(file,read.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,value)=>{if(error)return done(error);try{done(null,apply(file,value))}catch(e){done(e)}})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
