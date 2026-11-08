// Replay only the fixed HEAD runtime, without changing worktree files.
const fs=require('node:fs'),path=require('node:path'),read=fs.readFileSync;
const root=path.resolve(__dirname,'../..');
fs.readFileSync=function(file,options){
 let full;try{full=file instanceof URL?require('node:url').fileURLToPath(file):path.resolve(String(file))}catch{}
 if(full===path.join(root,'hani-office-live.js'))return read.call(fs,path.join(__dirname,'baseline/hani-office-live.js'),options);
 return read.apply(fs,arguments);
};
