// Test process boundary: delegation forbids all Git/browser/shell child processes.
const cp=require('node:child_process'),path=require('node:path');
for(const method of ['spawn','spawnSync','execFile','execFileSync','exec','execSync']){
 const original=cp[method];cp[method]=function(command,...args){
  const binary=path.basename(String(command)).toLowerCase();
  if(!['node','node.exe',path.basename(process.execPath).toLowerCase()].includes(binary))throw Error('DESIGN2_DELEGATED_PROCESS: '+binary);
  return original.call(this,command,...args);
 };
}
require('node:module').syncBuiltinESMExports();
