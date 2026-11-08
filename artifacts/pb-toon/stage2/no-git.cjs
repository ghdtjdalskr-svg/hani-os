// Respect this task's Git prohibition, including indirect test subprocesses.
const cp=require('node:child_process');
for(const name of ['execFileSync','execFile','spawnSync','spawn','execSync','exec']){
 const original=cp[name];
 cp[name]=function(command,...args){
  if(/(?:^|[\\/\s])git(?:\.exe)?(?:$|\s)/i.test(String(command))){
   const error=new Error('USER_GIT_DISABLED: task prohibits Git execution');error.code='USER_GIT_DISABLED';
   if(name==='spawnSync')return {error,status:null,stdout:'',stderr:'USER_GIT_DISABLED'};
   throw error;
  }
  return original.call(this,command,...args);
 };
}
require('node:module').syncBuiltinESMExports();
