// Legacy tests see their exact lower layer only in memory. Never intercept
// baseline snapshots or temporary builder fixtures with the same basename.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
import {projectLifeSource} from './hani-life-bundle-source.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const original=fs.readFileSync;
const owners=new Set(['hani-main.js','index.html']);
fs.readFileSync=function(file,options){
  const value=original.call(this,file,options);
  if(typeof file!=='string'&&!(file instanceof URL))return value;
  const absolute=file instanceof URL?fileURLToPath(file):path.resolve(file);
  const name=path.relative(root,absolute).replaceAll('\\','/');
  if(!owners.has(name))return value;
  const source=Buffer.isBuffer(value)?value.toString('utf8'):value;
  const restored=projectLifeSource(source,name,'study-retry');
  return Buffer.isBuffer(value)?Buffer.from(restored):restored;
};
syncBuiltinESMExports();
