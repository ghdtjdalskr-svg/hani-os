import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const syntax=['hani-main.js','scripts/hani-life-bundle-source.mjs','scripts/hani-life-bundle-source.test.mjs','scripts/hani-dev-report-generate.test.mjs','scripts/hani-wishlist-quick-add.test.mjs','artifacts/life-bundle/no-git-283.cjs','artifacts/life-bundle/main-282-preload.mjs'];
const cases=[
 {name:'nav-final',file:'hani-nav-groups.test.mjs',args:['--import','./scripts/hani-life-bundle-preload.mjs','--test','--test-isolation=none','--test-reporter=tap','scripts/hani-nav-groups.test.mjs']},
 {name:'bundle-current-check',args:['scripts/hani-gemini-reports-build.mjs','--check']},
 ...syntax.map(file=>({name:'syntax-'+file.replaceAll('/','_'),file,args:['--check',file]})),
 {name:'runtime-audit',args:['artifacts/life-bundle/audit-283.mjs']}
];
process.env.HANI_MAIN_BASELINE=process.cwd()+'/artifacts/life-bundle/283/main-282';
process.env.HANI_BRANCH_BASELINE=process.env.HANI_MAIN_BASELINE;
const rows=[];
for(const c of cases){
 const r=spawnSync(process.execPath,c.args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
 const output=(r.stdout||'')+(r.stderr||'');
 fs.writeFileSync('artifacts/life-bundle/283/'+c.name+'.log',output);
 rows.push({name:c.name,file:c.file,exit:r.status,command:'node '+c.args.join(' '),summary:output.split(/\r?\n/).filter(s=>s.startsWith('PASS')||s.startsWith('# ')||s.startsWith('Gemini reports')||s.startsWith('AssertionError'))});
 console.log(c.name+' exit='+r.status);
}
fs.writeFileSync('artifacts/life-bundle/283/final-checks.json',JSON.stringify(rows,null,2)+'\n');
if(rows.some(r=>r.exit!==0))process.exitCode=1;
