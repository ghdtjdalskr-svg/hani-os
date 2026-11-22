// Test input only:310 version/history -> attendance ->309 -> budget view ->308.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project,projectHelper,layer}=require('./hani-release-310-source.cjs'),root=path.resolve(__dirname,'..');
const reviewed=require('./hani-release-310-reviewed-input.cjs');
const sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,bytes){
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 // Only the original attendance layer's source-preservation assertion consumes
 // its authored helper input. Directory-comparison entries retain all310 pins.
 if(path.resolve(process.argv[1]||'')===path.join(__dirname,'hani-attendance-layer.test.mjs')&&name===layer.helper.file)return projectHelper(bytes);
 return project(bytes,name);
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,bytes)=>{if(error)return done(error);let projected;try{projected=apply(file,bytes)}catch(e){return done(e)}done(null,projected)})};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
reviewed.installHistoricalInputs();
require('node:module').syncBuiltinESMExports();
