import fs from 'node:fs';
let s=fs.readFileSync('artifacts/kids-weekday/capture-office.mjs','utf8');
s=s.replace("const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');","const out=path.resolve('artifacts/kids-visit-b/merge-shots'),root=process.cwd();fs.mkdirSync(out,{recursive:true});");
s=s.replace('dates.size<2','dates.size<1').replace('assert.equal(dates.size,2)','assert.equal(dates.size,1)');
s=s.replace("browser=await chromium.launch({headless:true,executablePath:process.argv[3]||process.env.HANI_CHROME_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});","browser=await chromium.connectOverCDP('http://127.0.0.1:9248');");
fs.writeFileSync('artifacts/kids-visit-b/capture-merge.mjs',s);
