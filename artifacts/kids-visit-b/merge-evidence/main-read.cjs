// Diagnostic only: exact pinned main office bytes, no runtime file writes.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const kids=require('../../../scripts/hani-office-kids-pose-b-source.cjs');
const original=fs.readFileSync,root=process.cwd();
fs.readFileSync=function(file,...args){
 const value=original.call(this,file,...args);if(typeof file==='number')return value;
 const name=path.relative(root,path.resolve(file instanceof URL?fileURLToPath(file):String(file))).replaceAll('\\','/');
 if(!kids.delta.files.some(row=>row.file===name))return value;
 const source=Buffer.isBuffer(value)?value.toString('utf8'):value,restored=kids.projectPreKidsPoseBSource(source,name);
 return Buffer.isBuffer(value)?Buffer.from(restored):restored;
};
require('node:module').syncBuiltinESMExports();
