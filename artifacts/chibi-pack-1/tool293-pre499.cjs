// Control run only: supply independently verified PR499-parent runtime blobs.
// Test files, assertions, fixtures and historical snapshots still come from disk.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'../..'),read=fs.readFileSync;
const owners=new Set(['index.html','hani-main.js','hani-office-live.js','hani-street-journal.css','assets/data/hani-history-releases-v1.json']);
const cache=new Map([...owners].map(file=>[file,repository.read('213ffc8',file)]));
fs.readFileSync=function(file,options){
 if(typeof file!=='string'&&!(file instanceof URL))return read.apply(this,arguments);
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 if(!owners.has(name))return read.apply(this,arguments);
 const source=cache.get(name),encoding=typeof options==='string'?options:options?.encoding;
 return encoding?Buffer.from(source).toString(encoding):Buffer.from(source);
};
require('node:module').syncBuiltinESMExports();
