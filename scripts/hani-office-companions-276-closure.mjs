import {resolveRuntimeClosure as resolve} from './hani-runtime-closure.mjs';
import {companions276Delta,restoreCompanions276Source} from './hani-office-companions-276-source.mjs';
import {createHash} from 'node:crypto';
// Preserve the earlier layer's exact assertions; 276 has its own +2 closure contract.
export function resolveRuntimeClosure(options){return resolve({...options,read:async file=>{const bytes=await options.read(file),row=companions276Delta.files.find(r=>r.file===file);if(!row)return bytes;const hash=createHash('sha256').update(bytes).digest('hex');return hash===row.afterSha256?restoreCompanions276Source(String(bytes),file):bytes;}})}
