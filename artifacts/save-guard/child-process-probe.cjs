const cp=require('node:child_process'),fs=require('node:fs');
const r=cp.spawnSync(process.execPath,['--version'],{encoding:'utf8'});
const result={command:'node --version (synthetic child process)',status:r.status,error:r.error?.code||null};
fs.writeFileSync('artifacts/save-guard/child-process-probe.json',JSON.stringify(result,null,2));console.log(result);
