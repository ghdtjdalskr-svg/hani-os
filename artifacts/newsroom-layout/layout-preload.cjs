const fs=require('node:fs'),path=require('node:path'),{projectPreLayout,rows}=require('./layout-source.cjs');
const {files:versionFiles,projectPre284}=require('./release284-source.cjs');
const root=path.resolve(__dirname,'../..'),read=fs.readFileSync;
fs.readFileSync=function(file,options){
 const bytes=read.call(this,file,options);
 if(typeof file!=='string'&&!(file instanceof URL))return bytes;
 const name=path.relative(root,file instanceof URL?require('node:url').fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 if(!rows[name]&&!versionFiles[name])return bytes;
 const source=Buffer.isBuffer(bytes)?bytes.toString('utf8'):bytes;
 const prior=projectPreLayout(process.env.HANI_LAYOUT_KEEP_VERSION==='1'?source:projectPre284(source,name),name);
 return Buffer.isBuffer(bytes)?Buffer.from(prior):prior;
};
require('node:module').syncBuiltinESMExports();
