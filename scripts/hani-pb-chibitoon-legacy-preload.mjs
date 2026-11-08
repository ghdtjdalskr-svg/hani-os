// Only legacy tests read exact lower-layer bytes in memory. Raw tests use no preload.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
import {restoreChibitoonSource} from './hani-pb-chibitoon-source.mjs';
import releaseLayers from './hani-release-version-layers.cjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const original=fs.readFileSync;
const owners=new Set(['hani-main.js','index.html','hani-procrastination-board.js','hani-procrastination-board.css']);
function readProjected(read,file,options){
  const value=read(file,options);
  if(typeof file!=='string'&&!(file instanceof URL))return value;
  const absolute=file instanceof URL?fileURLToPath(file):path.resolve(file);
  const name=path.relative(root,absolute).replaceAll('\\','/');
  if(!owners.has(name))return value;
  const source=Buffer.isBuffer(value)?value.toString('utf8'):value;
  // Keep the feature's pre-release bytes; life projection owns the 283 inverse.
  const restored=restoreChibitoonSource(source,name);
  return Buffer.isBuffer(value)?Buffer.from(restored):restored;
};
export const readLegacyPbFile=(file,options)=>readProjected(releaseLayers.readRawFileSync,file,options);
fs.readFileSync=(file,options)=>readProjected(original,file,options);
syncBuiltinESMExports();
