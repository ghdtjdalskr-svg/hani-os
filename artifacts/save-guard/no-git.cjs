// Enforce the task's no-Git boundary before launching any child process.
const cp=require('node:child_process'),{syncBuiltinESMExports}=require('node:module');
for(const key of ['execFileSync','execFile','spawnSync','spawn','execSync','exec']){
 const original=cp[key];
 cp[key]=function(file,...args){
  if(/(?:^|[\\/\s"'])git(?:\.exe)?(?:$|\s|["'])/i.test(String(file))){
   const error=new Error('USER_GIT_DISABLED: save-guard task prohibits Git; original Git assertions remain unverified');error.code='USER_GIT_DISABLED';
   if(key==='spawnSync')return {error,status:null,stdout:null,stderr:null};
   throw error;
  }
  return original.call(this,file,...args);
 };
}
syncBuiltinESMExports();
