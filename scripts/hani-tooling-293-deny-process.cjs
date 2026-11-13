// Sandbox execution guard only. Never substitutes Git output or launches a browser.
const cp=require('node:child_process');
for(const name of ['exec','execSync','execFile','execFileSync','spawn','spawnSync','fork'])cp[name]=()=>{throw Error('TOOL293_PROCESS_BLOCKED: Git/browser process delegated to Seoyun');};
require('node:module').syncBuiltinESMExports();
