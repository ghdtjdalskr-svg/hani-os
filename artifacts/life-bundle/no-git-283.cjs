// Session constraint: execute every test assertion, but never launch Git.
const cp=require('node:child_process'),{syncBuiltinESMExports}=require('node:module');
for(const key of ['execFileSync','execFile','spawnSync','spawn','execSync','exec']){
 const original=cp[key];
 cp[key]=function(file,...args){
  if(/(?:^|[\\/\s"'])git(?:\.exe)?(?:$|\s|["'])/i.test(String(file))){
   const error=new Error('USER_GIT_DISABLED: task 283 prohibits Git; independent Git assertion remains unverified');
   error.code='USER_GIT_DISABLED';
   if(key==='spawnSync')return {error,status:null,stdout:null,stderr:null};
   throw error;
  }
  return original.call(this,file,...args);
 };
}
syncBuiltinESMExports();
