// Exact release version bytes precede the frozen chibi2 feature inverse.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {project}=require('./hani-chibi-pack-2-source.cjs');
const original=fs.readFileSync,root=path.resolve(__dirname,'..');
fs.readFileSync=function(file,options){
 const bytes=original.apply(this,arguments);
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 // Module/fixture reads cannot enter the dispatcher while it is being loaded.
 const source=['index.html','hani-main.js','assets/data/hani-history-releases-v1.json'].includes(name)
  ?require('./hani-release-version-layers.cjs').projectPreRelease295Source(bytes,name):bytes;
 return project(source,name);
};
require('node:module').syncBuiltinESMExports();
