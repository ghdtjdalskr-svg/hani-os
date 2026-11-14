// Independent main297+#513 comparator for the two pre-existing failing legacy suites.
// Reads the fixed repository objects directly, without the new inverse or Git process.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const base='22fedb33cbd67923cc499ba99f55e8902a66ecb2',root=path.resolve(__dirname,'../..');
const owners=new Map(['hani-ui-v02992.js','hani-style-08.css'].map(f=>[f,repository.read(base,f)]));
const sync=fs.readFileSync,callback=fs.readFile,promise=fs.promises.readFile;
function apply(file,value){
 if(typeof file!=='string'&&!(file instanceof URL))return value;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 const old=owners.get(name);return old===undefined?value:Buffer.isBuffer(value)?Buffer.from(old):old;
}
fs.readFileSync=function(file,...args){return apply(file,sync.call(this,file,...args))};
fs.readFile=function(file,...args){const done=args.pop();return callback.call(this,file,...args,(error,value)=>error?done(error):done(null,apply(file,value)))};
fs.promises.readFile=async function(file,...args){return apply(file,await promise.call(this,file,...args))};
require('node:module').syncBuiltinESMExports();
