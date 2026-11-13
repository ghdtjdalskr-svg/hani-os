// Test-only, fixed approved v289 evidence. Never infer expected bytes from HEAD/worktree.
import repository from './hani-test-repository-evidence.cjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
export const approvedRevision='49096deb9ca99790c48106bbff7ec275273b1b52';
export const readApprovedSource=file=>repository.read(approvedRevision,file);
export const approvedRuntimeClosure=()=>resolveRuntimeClosure({read:readApprovedSource,exists:file=>{
  try{readApprovedSource(file);return true;}catch(error){
    if(error.message.startsWith('file unavailable at '))return false;
    throw error;
  }
}});
