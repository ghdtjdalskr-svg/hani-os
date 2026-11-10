import {resolveRuntimeClosure as resolve} from './hani-runtime-closure.mjs';
import kidsPoseB from './hani-office-kids-pose-b-source.cjs';
import {patrol278Delta,restorePatrol278Source} from './hani-office-chairman-patrol-278-source.mjs';
import {companions276Delta,restoreCompanions276Source} from './hani-office-companions-276-source.mjs';
import {createHash} from 'node:crypto';
// Preserve the earlier layer's exact assertions; 276 has its own +2 closure contract.
export function resolveRuntimeClosure(options){return resolve({...options,read:async file=>{const input=await options.read(file),raw=kidsPoseB.delta.files.some(r=>r.file===file)?kidsPoseB.projectPreKidsPoseBSource(String(input),file):input,row=companions276Delta.files.find(r=>r.file===file);if(!row)return raw;const hash=x=>createHash('sha256').update(x).digest('hex'),patrol=patrol278Delta.files.find(r=>r.file===file),bytes=hash(raw)===patrol.afterSha256?restorePatrol278Source(String(raw),file):raw;return hash(bytes)===row.afterSha256?restoreCompanions276Source(String(bytes),file):bytes;}})}
