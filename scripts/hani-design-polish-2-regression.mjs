// Node-only inventory. Never invokes Git or Edge. Writes evidence under this task.
// No --require design2 preload on legacy commands: their default input chain is tested.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'artifacts/design-polish-2');
fs.mkdirSync(path.join(out,'test-logs'),{recursive:true});
const knownGit=new Set(JSON.parse(fs.readFileSync(path.join(root,'artifacts/design-polish-1/rebase295-git-results.json'),'utf8')).map(r=>path.basename(r.file)));
const originalFailures=['settings-225','ilbo-banner-215','study-news-material','pb-chibitoon','brand-heroes-218','dash-218','fun-top3','hero-restore','ilbo-213','invest-split-ui','investment-research-ui','mascots-poster','nav-groups','owner-verification-ui','qa-210','qa-design-b4','qa-report-fixes','remote-media-219','reviewed-release-baseline','simplify-225','theme-white-215','ui-203b'];
const names=fs.readdirSync(path.join(root,'scripts')).filter(f=>/\.(mjs|cjs|js)$/.test(f)),entries=[];
for(const name of names){
 const source=fs.readFileSync(path.join(root,'scripts',name),'utf8'),test=/(?:\.test\.|-test\.|-qa\.)/.test(name);
 const family=/^hani-(?:design-polish-[12]|release-29[56]|chibi-pack-[12]|theme-thaw|theme-contrast|release-version-layers|office.*\.test|seoyun-m9|save-guard|join-ieum|app-216-audit\.test|qa-easy-cleanup|history-226)/.test(name);
 if(!test||!family&&!source.includes('hani-design-system.css'))continue;
 let reason=null;
 if(originalFailures.some(s=>name.startsWith('hani-'+s+'.')||name.startsWith('hani-'+s+'-test.')))reason='ORIGINAL_FAILURE_DO_NOT_TOUCH';
 else if(knownGit.has(name)||/(?:execFile(?:Sync)?|spawn(?:Sync)?|exec(?:Sync)?)\s*\(\s*['"`]git(?:['"`\s])/.test(source))reason='GIT_DELEGATED';
 else if(['hani-annual-report-ui-test.mjs','hani-design-system-phase1-qa.mjs'].includes(name))reason='BROWSER_DELEGATED';
 const args=[];if(name==='hani-history-226.test.mjs')args.push('--unit-only');
 if(name==='hani-newsroom-4cut-230.test.mjs')args.push('--node');
 entries.push({file:'scripts/'+name,args,reason,office:name.startsWith('hani-office')});
}
// Previously passing tests remain part of this inventory, even if their current
// source now routes CSS reads through a shared helper instead of a literal path.
for(const row of JSON.parse(fs.readFileSync(path.join(root,'artifacts/design-polish-1/rebase295-results.json'),'utf8'))){
 if(entries.some(e=>e.file===row.file)||originalFailures.some(s=>path.basename(row.file).startsWith('hani-'+s+'.')))continue;
 const name=path.basename(row.file);entries.push({file:row.file,args:name==='hani-history-226.test.mjs'?['--unit-only']:name==='hani-newsroom-4cut-230.test.mjs'?['--node']:[],reason:knownGit.has(name)?'GIT_DELEGATED':null,office:!!row.office});
}
entries.sort((a,b)=>a.file.localeCompare(b.file));fs.writeFileSync(path.join(out,'test-inventory.json'),JSON.stringify(entries,null,2)+'\n');
if(process.argv.includes('--list-only')){console.log(JSON.stringify({files:entries.length,run:entries.filter(e=>!e.reason).length,git:entries.filter(e=>e.reason==='GIT_DELEGATED').length,originalFailures:entries.filter(e=>e.reason==='ORIGINAL_FAILURE_DO_NOT_TOUCH').length}));process.exit(0)}
if(process.argv.includes('--prepare-powershell')){
 const oldSummary=path.join(out,'test-summary.json'),oldResults=path.join(out,'test-results.json');
 if(fs.existsSync(oldSummary)&&fs.existsSync(oldResults)&&JSON.parse(fs.readFileSync(oldResults,'utf8')).some(r=>r.error?.includes('EPERM')))fs.copyFileSync(oldSummary,path.join(out,'node-child-spawn-blocked.json'));
 const saved=[];
 function save(file){
  if(!fs.existsSync(file)||file===out||file.startsWith(out+path.sep))return;
  if(fs.statSync(file).isDirectory()){for(const n of fs.readdirSync(file))save(path.join(file,n));return;}
  if(!file.endsWith('.json'))return;const relative=path.relative(root,file),target=path.join(out,'input-evidence',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);saved.push(relative);
 }
 save(path.join(root,'artifacts'));for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.json')))save(path.join(root,f));
 fs.writeFileSync(path.join(out,'input-evidence-manifest.json'),JSON.stringify(saved,null,2)+'\n');
 const ps=`$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath $PSScriptRoot
Set-Location -LiteralPath '..\\..'
$env:OFFICE_SOFT = '1'
$env:FORCE_COLOR = '0'
$entries = Get-Content -Raw -Encoding UTF8 'artifacts/design-polish-2/test-inventory.json' | ConvertFrom-Json
$results = @()
foreach ($entry in $entries) {
  if ($entry.reason) { continue }
  $nodeArgs = @('--require','./scripts/hani-design-polish-2-execution-guard.cjs',$entry.file) + @($entry.args)
  $logPath = 'artifacts/design-polish-2/test-logs/' + [System.IO.Path]::GetFileName($entry.file) + '.log'
  & node @nodeArgs *> $logPath
  $results += [PSCustomObject]@{file=$entry.file;exit=$LASTEXITCODE}
  $results | ConvertTo-Json | Set-Content -Encoding UTF8 'artifacts/design-polish-2/powershell-exits.json'
  Write-Output ($entry.file + ' exit=' + $LASTEXITCODE)
}
& node scripts/hani-design-polish-2-regression.mjs --collect
exit $LASTEXITCODE
`;
 fs.writeFileSync(path.join(out,'run-regression.ps1'),'\ufeff'+ps);console.log('Prepared PowerShell direct-node runner; original JSON evidence saved.');process.exit(0);
}
if(process.argv.includes('--collect')){
 const exits=JSON.parse(fs.readFileSync(path.join(out,'powershell-exits.json'),'utf8').replace(/^\ufeff/,''));
 const rows=exits.map(row=>{const entry=entries.find(e=>e.file===row.file),logFile='test-logs/'+path.basename(row.file)+'.log';let b=fs.readFileSync(path.join(out,logFile));const log=b[0]===255&&b[1]===254?b.toString('utf16le'):b.toString('utf8');const count=kind=>Number(log.match(new RegExp('(?:#|ℹ) '+kind+' (\\d+)'))?.[1]??0);return {...entry,...row,pass:count('pass'),fail:count('fail'),skip:count('skipped'),scriptPass:row.exit===0&&!count('pass')?1:0,log:logFile};});
 const saved=JSON.parse(fs.readFileSync(path.join(out,'input-evidence-manifest.json'),'utf8')),changes=[];
 function restore(file){
  if(!fs.existsSync(file)||file===out||file.startsWith(out+path.sep))return;
  if(fs.statSync(file).isDirectory()){for(const n of fs.readdirSync(file))restore(path.join(file,n));return;}
  if(!file.endsWith('.json'))return;const relative=path.relative(root,file),backup=path.join(out,'input-evidence',relative),current=fs.readFileSync(file),old=saved.includes(relative)?fs.readFileSync(backup):null;
  if(old?.equals(current))return;const target=path.join(out,'generated',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,current);if(old)fs.writeFileSync(file,old);else fs.unlinkSync(file);changes.push({file:relative.replaceAll('\\','/'),action:old?'original restored':'new evidence moved'});
 }
 restore(path.join(root,'artifacts'));for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.json')))restore(path.join(root,f));
 const summary={files:rows.length,passedFiles:rows.filter(r=>r.exit===0).length,failedFiles:rows.filter(r=>r.exit!==0).length,pass:rows.reduce((n,r)=>n+r.pass,0),fail:rows.reduce((n,r)=>n+r.fail,0),skip:rows.reduce((n,r)=>n+r.skip,0),scriptPass:rows.reduce((n,r)=>n+r.scriptPass,0),gitDelegated:entries.filter(e=>e.reason==='GIT_DELEGATED').map(e=>e.file),originalFailuresExcluded:entries.filter(e=>e.reason==='ORIGINAL_FAILURE_DO_NOT_TOUCH').map(e=>e.file)};
 for(const [name,data]of [['test-results',rows],['test-summary',summary],['generated-files',changes]])fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({...summary,gitDelegated:summary.gitDelegated.length,originalFailuresExcluded:summary.originalFailuresExcluded.length}));if(summary.failedFiles)process.exitCode=1;process.exit();
}
// Preserve original artifact/QA JSON bytes while retaining this run's generated
// evidence in the task directory. No runtime, fixture, baseline or data writes.
const generatedRoots=['artifacts',...fs.readdirSync(root).filter(f=>f.endsWith('.json'))];
const snapshot=new Map();
function visit(file,callback){if(!fs.existsSync(file)||file===out||file.startsWith(out+path.sep))return;const stat=fs.statSync(file);if(stat.isDirectory())for(const n of fs.readdirSync(file))visit(path.join(file,n),callback);else if(file.endsWith('.json'))callback(file);}
for(const p of generatedRoots)visit(path.join(root,p),f=>snapshot.set(f,fs.readFileSync(f)));
const rows=[];
try{
 for(const entry of entries){
  if(entry.reason)continue;
  const command=['--require','./scripts/hani-design-polish-2-execution-guard.cjs',entry.file,...entry.args];
  const run=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,env:{...process.env,OFFICE_SOFT:'1',FORCE_COLOR:'0'}});
  const log=(run.stdout??'')+(run.stderr??'')+(run.error?'\n'+run.error.stack:'');
  const logFile='test-logs/'+path.basename(entry.file)+'.log';fs.writeFileSync(path.join(out,logFile),log);
  const count=kind=>Number(log.match(new RegExp('(?:#|ℹ) '+kind+' (\\d+)'))?.[1]??0),row={...entry,command:['node',...command].join(' '),exit:run.status,pass:count('pass'),fail:count('fail'),skip:count('skipped'),log:logFile};
  if(row.exit===0&&!row.pass)row.scriptPass=1;
  if(run.error)row.error=run.error.message;
  rows.push(row);console.log(JSON.stringify({file:entry.file,exit:row.exit,pass:row.pass,fail:row.fail,skip:row.skip,error:row.error}));
  fs.writeFileSync(path.join(out,'test-results.json'),JSON.stringify(rows,null,2)+'\n');
 }
}finally{
 const changes=[];
 for(const p of generatedRoots)visit(path.join(root,p),file=>{
  const old=snapshot.get(file),current=fs.readFileSync(file);if(old?.equals(current))return;
  const relative=path.relative(root,file),target=path.join(out,'generated',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,current);
  if(old)fs.writeFileSync(file,old);else fs.unlinkSync(file);changes.push({file:relative.replaceAll('\\','/'),action:old?'original restored':'new evidence moved'});
 });
 fs.writeFileSync(path.join(out,'generated-files.json'),JSON.stringify(changes,null,2)+'\n');
}
const summary={files:rows.length,passedFiles:rows.filter(r=>r.exit===0).length,failedFiles:rows.filter(r=>r.exit!==0).length,pass:rows.reduce((n,r)=>n+r.pass,0),fail:rows.reduce((n,r)=>n+r.fail,0),skip:rows.reduce((n,r)=>n+r.skip,0),scriptPass:rows.reduce((n,r)=>n+(r.scriptPass??0),0),gitDelegated:entries.filter(e=>e.reason==='GIT_DELEGATED').map(e=>e.file),originalFailuresExcluded:entries.filter(e=>e.reason==='ORIGINAL_FAILURE_DO_NOT_TOUCH').map(e=>e.file)};
fs.writeFileSync(path.join(out,'test-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));if(summary.failedFiles)process.exitCode=1;
