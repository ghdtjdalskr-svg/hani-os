// Read-only reproduction of the starting owner files. Assertions are untouched.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const original=fs.readFileSync,root=path.resolve(__dirname,'../..');
const files=new Map(['js','css'].map(ext=>[path.join(root,'hani-office-live.'+ext),original(path.join(__dirname,'round2-before.'+ext))]));
fs.readFileSync=function(file,options){
 let target;try{target=path.resolve(file instanceof URL?fileURLToPath(file):String(file))}catch{}
 if(!files.has(target))return original.apply(this,arguments);
 const bytes=files.get(target),encoding=typeof options==='string'?options:options?.encoding;
 return encoding?bytes.toString(encoding):Buffer.from(bytes);
};
require('node:module').syncBuiltinESMExports();
