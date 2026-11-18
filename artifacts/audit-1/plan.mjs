// Generate exactly tooling299's inventory, with every write redirected locally.
import './output.cjs';
import fs from 'node:fs';
import path from 'node:path';
await import('../design-polish-2/tooling299-plan.mjs');
const local=path.join(import.meta.dirname,'local'),phase=process.env.AUDIT1_PHASE||'current';
const inventory=JSON.parse(fs.readFileSync(path.join(local,phase,'generated/artifacts/design-polish-2/tooling299-local/test-inventory.json'),'utf8'));
for(const file of ['scripts/hani-audit-1.test.mjs','scripts/hani-book-share-parse.test.mjs','scripts/hani-yuna-smoke.js','scripts/hani-sports-sync-contract.test.mjs','scripts/hani-lounge-billboard.test.mjs'])if(!inventory.entries.some(e=>e.file===file))inventory.entries.push({file,args:[],office:false,tooling:false,reason:null,added:true});
fs.writeFileSync(path.join(local,'test-inventory.json'),JSON.stringify({...inventory,base:'2220b61'},null,2)+'\n');
fs.writeFileSync(path.join(local,'git-delegated.json'),JSON.stringify(inventory.entries.filter(e=>e.reason==='GIT_DELEGATED'),null,2)+'\n');
