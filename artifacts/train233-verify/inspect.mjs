import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
const scripts=fs.readdirSync('scripts').filter(f=>/\.(?:mjs|cjs|js|ps1)$/.test(f)&&(/\.test\.|smoke|\.browser\.|-test\./.test(f)));
const items=scripts.map(name=>{const text=fs.readFileSync(path.join('scripts',name),'utf8');return {file:'scripts/'+name,browser:/playwright|puppeteer|chromium\.launch|browserType/.test(text),argv:[...text.matchAll(/process\.argv[^\r\n;]{0,180}/g)].slice(0,3).map(m=>m[0]),env:[...new Set([...text.matchAll(/process\.env\.([A-Z_0-9]+)/g)].map(m=>m[1]))],writes:/writeFile|mkdirSync/.test(text)};});
fs.writeFileSync('artifacts/train233-verify/inventory.json',JSON.stringify(items,null,2));
const child=spawnSync(process.execPath,['--version'],{encoding:'utf8'});
console.log(JSON.stringify({total:items.length,browser:items.filter(i=>i.browser).length,child:{status:child.status,error:child.error?.code,stdout:child.stdout},targetHeaders:items.filter(i=>/asset-intake|qa-1st|org-demo|milestones/.test(i.file))},null,2));
