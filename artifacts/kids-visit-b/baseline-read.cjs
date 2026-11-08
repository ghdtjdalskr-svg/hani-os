// Read-only fixed-base replay for classification of pre-existing failures.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=fs.readFileSync;
fs.readFileSync=function(file,options){
 let full;try{full=file instanceof URL?require('node:url').fileURLToPath(file):path.resolve(String(file))}catch{}
 const name=full&&path.relative(root,full);
 if(['hani-office-live.js','hani-office-live.css'].includes(name))return read.call(fs,path.join(__dirname,'baseline',name),options);
 return read.apply(fs,arguments);
};
