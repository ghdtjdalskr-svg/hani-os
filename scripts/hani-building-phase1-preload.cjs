// Install before every historical capture; new Phase 1 tests use the raw reader.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project}=require('./hani-building-phase1-source.cjs'),root=path.resolve(__dirname,'..');
// Preserve real refs/object reads. Historical merge-base gates may consume the
// 305 boundary only while every complete current owner has its frozen identity.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const {layer,hash,readRawFileSync}=require('./hani-building-phase1-source.cjs');
const owners={};for(const stage of layer.stages.slice().reverse())for(const [file,row]of Object.entries(stage.files))owners[file]=row.afterSha256;
repository.readOnly=function(args){
 const result=rawReadOnly(args);
 if(args.join(' ')==='merge-base HEAD origin/main'&&result.trim()===layer.release306&&Object.entries(owners).every(([file,pin])=>hash(readRawFileSync(path.join(root,file)))===pin))return '8a46ac79705ac515da41d0dccf9ef72283bfad50';
 return result;
};
const sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return project(bytes,name);
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,bytes)=>{if(error)return done(error);let result;try{result=apply(file,bytes)}catch(e){return done(e)}done(null,result)})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
