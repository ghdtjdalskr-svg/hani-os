import {resolveRuntimeClosure as resolve} from './hani-runtime-closure.mjs';
import inverse from './hani-office-kids-pose-b-source.cjs';
// Older frozen contracts see their exact pre-B bytes. Raw current closure is
// independently tested in hani-office-kids-pose-b.test.mjs without this adapter.
export function resolveRuntimeClosure(options){
 return resolve({...options,read:async file=>{
  const raw=await options.read(file);
  return inverse.delta.files.some(row=>row.file===file)?inverse.projectPreKidsPoseBSource(String(raw),file):raw;
 }});
}
