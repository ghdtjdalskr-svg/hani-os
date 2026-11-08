// Task guard: legacy tests may report missing Git evidence, never execute Git.
const cp=require('node:child_process');
for(const key of ['execFileSync','execFile','spawnSync','spawn','execSync','exec']){
 const original=cp[key];
 cp[key]=function(command,...args){
  if(/(?:^|[\s/\\"'])git(?:\.exe)?(?:$|[\s"'])/i.test(String(command)+' '+(Array.isArray(args[0])?args[0].join(' '):''))){
   const error=new Error('GIT_FORBIDDEN_BY_TASK: read-only baseline unavailable');error.code='GIT_FORBIDDEN_BY_TASK';throw error;
  }
  return original.call(this,command,...args);
 };
}
require('node:module').syncBuiltinESMExports();
