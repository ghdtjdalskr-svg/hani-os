// Outermost feature layer: only frozen complete bytes expose the supplied main.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project}=require('./hani-chibi-pack-2-source.cjs');
const original=fs.readFileSync,root=path.resolve(__dirname,'..');
fs.readFileSync=function(file,options){
 const bytes=original.apply(this,arguments);
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return project(bytes,name);
};
require('node:module').syncBuiltinESMExports();
