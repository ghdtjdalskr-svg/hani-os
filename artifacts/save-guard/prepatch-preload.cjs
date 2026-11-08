// Reproduce pre-existing failures using exact frozen bytes in memory only.
const fs=require('node:fs'),path=require('node:path'),{syncBuiltinESMExports}=require('node:module');
const {fileURLToPath}=require('node:url');
const inverse=require('../../scripts/hani-save-guard-source.cjs');
const root=path.resolve(__dirname,'../..'),read=fs.readFileSync;
fs.readFileSync=function(file,options){
 const value=read.call(this,file,options);
 if(typeof file!=='string'&&!(file instanceof URL))return value;
 const absolute=file instanceof URL?fileURLToPath(file):path.resolve(file);
 const name=path.relative(root,absolute).replaceAll('\\','/');
 if(!['hani-main.js','index.html'].includes(name))return value;
 const source=Buffer.isBuffer(value)?value.toString('utf8'):value;
 const restored=process.env.HANI_SAVE_GUARD_PREPATCH==='historical'?inverse.projectPreSaveGuard284Source(source,name):name==='hani-main.js'?inverse.restoreSaveGuard284(source,'guard-patch-only'):source;
 return Buffer.isBuffer(value)?Buffer.from(restored):restored;
};
syncBuiltinESMExports();
