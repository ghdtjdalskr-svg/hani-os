// Local task execution guard only: never substitutes Git output or launches Edge.
const cp=require('node:child_process');
for(const name of ['exec','execSync','execFile','execFileSync','spawn','spawnSync','fork'])cp[name]=()=>{
 throw Object.assign(Error('TASK_PROCESS_BLOCKED: Git/browser processes delegated to Seoyun'),{code:'TASK_PROCESS_BLOCKED'});
};
require('node:module').syncBuiltinESMExports();
