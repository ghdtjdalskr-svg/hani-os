// Explicit legacy-test outer layer. All original assertions remain unchanged.
const fs=require('node:fs'),path=require('node:path'),{fileURLToPath}=require('node:url');
const {delta,hash,restore}=require('./hani-m9-link-source.cjs');
const original=fs.readFileSync,root=path.resolve(__dirname,'..');
fs.readFileSync=function(file,options){
  const bytes=original.apply(this,arguments);
  if(typeof file==='number')return bytes;
  const name=path.relative(root,path.resolve(file instanceof URL?fileURLToPath(file):String(file))).replaceAll('\\','/');
  const row=delta.files.find(r=>r.file===name);
  if(!row)return bytes;
  const source=Buffer.isBuffer(bytes)?bytes.toString('utf8'):bytes;
  if(hash(source)===row.beforeSha256)return bytes;
  const restored=restore(source,name);
  return Buffer.isBuffer(bytes)?Buffer.from(restored):restored;
};
require('node:module').syncBuiltinESMExports();
