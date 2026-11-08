// Browser server reads the independent release-282 runtime snapshot in memory.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
const root=path.resolve(import.meta.dirname,'../..'),snapshot=path.join(import.meta.dirname,'283/main-282');
const original=fs.readFileSync;
const evidence=JSON.parse(original(path.join(import.meta.dirname,'283/main-282-evidence.json'),'utf8'));
const files=new Set(evidence.rows.map(r=>r.file));
fs.readFileSync=function(file,...args){
 if(typeof file==='string'||file instanceof URL){
  const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
  if(files.has(name))return original.call(this,path.join(snapshot,name),...args);
 }
 return original.call(this,file,...args);
};
syncBuiltinESMExports();
