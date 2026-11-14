// Non-Git inventory: original design2/tooling297 coverage plus deployed298/helper.
// Each frozen suite runs in a fresh Node process through its normal input path.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),task=path.join(root,'artifacts/design-polish-2');
const out=path.join(task,'local/design2e'),base='98cc7debbf9bf365b5db97aabac9b616b2889d20';
fs.mkdirSync(out,{recursive:true});
const original=JSON.parse(fs.readFileSync(path.join(task,'test-inventory.json'),'utf8'));
const tooling=JSON.parse(fs.readFileSync(path.join(root,'artifacts/chibi-pack-3/tooling297-plan.json'),'utf8'));
const entries=original.map(row=>({...row,tooling:false}));
for(const row of tooling.plan){
 const reason={READY:null,GIT_REQUIRED:'GIT_DELEGATED',BROWSER_DELEGATED:'BROWSER_DELEGATED',KNOWN_FAILURE_UNTOUCHED:'ORIGINAL_FAILURE_DO_NOT_TOUCH'}[row.status];
 const existing=entries.find(e=>e.file===row.file);
 if(existing){existing.tooling=row.status==='READY';if(reason)existing.reason=reason;}
 else entries.push({file:row.file,args:row.args,office:row.office,reason,tooling:row.status==='READY'});
}
for(const name of fs.readdirSync(path.join(root,'scripts')).filter(f=>/^hani-design-polish-2.*\.test\.mjs$/.test(f))){if(!entries.some(e=>e.file==='scripts/'+name))entries.push({file:'scripts/'+name,args:[],office:false,reason:null,tooling:false});}
for(const name of ['hani-release-298.test.mjs','hani-helper-toggle.test.mjs'])if(!entries.some(e=>e.file==='scripts/'+name))entries.push({file:'scripts/'+name,args:[],office:false,reason:null,tooling:false});
entries.sort((a,b)=>a.file.localeCompare(b.file));
fs.writeFileSync(path.join(out,'test-inventory.json'),JSON.stringify({base,entries},null,2)+'\n');
if(process.argv.includes('--collect')){
 const rows=JSON.parse(fs.readFileSync(path.join(out,'test-results.json'),'utf8'));
 const metric=list=>({files:list.length,passedFiles:list.filter(r=>r.exit===0).length,failedFiles:list.filter(r=>r.exit!==0).length,pass:list.reduce((n,r)=>n+r.pass,0),fail:list.reduce((n,r)=>n+r.fail,0),skip:list.reduce((n,r)=>n+r.skip,0),scriptPass:list.reduce((n,r)=>n+r.scriptPass,0)});
 const current=rows.filter(r=>r.phase==='current'),baseline=rows.filter(r=>r.phase==='baseline');
 for(const [phase,list]of [['current',current],['baseline',baseline]]){
  const expected=entries.filter(e=>!e.reason&&(phase==='current'||!e.file.startsWith('scripts/hani-design-polish-2'))).map(e=>e.file).sort();
  assert.deepEqual(list.map(e=>e.file).sort(),expected,'complete nonduplicated '+phase+' inventory');
 }
 const regressions=current.filter(row=>!row.file.startsWith('scripts/hani-design-polish-2')).filter(row=>{const old=baseline.find(r=>r.file===row.file);return !old||row.exit!==old.exit||row.pass!==old.pass||row.fail!==old.fail||row.skip!==old.skip||row.scriptPass!==old.scriptPass;});
 const summary={base,current:metric(current),baseline:metric(baseline),tooling:metric(current.filter(r=>r.tooling)),office:metric(current.filter(r=>r.office)),newRegressions:regressions,failed:current.filter(r=>r.exit!==0),gitDelegated:entries.filter(e=>e.reason==='GIT_DELEGATED').map(e=>e.file),browserDelegated:entries.filter(e=>e.reason==='BROWSER_DELEGATED').map(e=>e.file),originalFailuresExcluded:entries.filter(e=>e.reason==='ORIGINAL_FAILURE_DO_NOT_TOUCH').map(e=>e.file)};
 fs.writeFileSync(path.join(out,'test-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({...summary,failed:summary.failed.map(r=>r.file),gitDelegated:summary.gitDelegated.length,browserDelegated:summary.browserDelegated.length,originalFailuresExcluded:summary.originalFailuresExcluded.length}));
 if(regressions.length||current.some(r=>r.exit!==0&&!baseline.some(b=>b.file===r.file&&b.exit===r.exit)))process.exitCode=1;
}else if(process.argv.includes('--list-only')){
 console.log(JSON.stringify({base,files:entries.length,run:entries.filter(e=>!e.reason).length,tooling:entries.filter(e=>!e.reason&&e.tooling).length,office:entries.filter(e=>!e.reason&&e.office).length}));
}else{
 const ps=`$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 $plan=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'test-inventory.json')|ConvertFrom-Json
 $rows=@()
 foreach($phase in @('baseline','current')) {
  $logRoot=Join-Path $PSScriptRoot ($phase+'/test-logs')
  New-Item -ItemType Directory -Force -Path $logRoot|Out-Null
  $env:DESIGN2_EVIDENCE_DIR='artifacts/design-polish-2/local/design2e/'+$phase
  $env:OFFICE_SOFT='1'
  $env:FORCE_COLOR='0'
  foreach($entry in $plan.entries) {
   if($entry.reason -or ($phase -eq 'baseline' -and $entry.file.StartsWith('scripts/hani-design-polish-2'))) {continue}
   $nodeArgs=@('--require','./scripts/hani-design-polish-2-execution-guard.cjs','--require','./scripts/hani-design-polish-2-output.cjs')
   if($phase -eq 'baseline') {$nodeArgs+=@('--require','./scripts/hani-design-polish-2-main297-baseline.cjs')}
   $nodeArgs+=@('--test','--test-isolation=none','--test-reporter=tap',$entry.file)+@($entry.args)
   $ErrorActionPreference='Continue'
   $output=@(& node @nodeArgs 2>&1)
   $code=$LASTEXITCODE
   $ErrorActionPreference='Stop'
   $log=($output|ForEach-Object {"$_"}) -join [Environment]::NewLine
   $logPath=Join-Path $logRoot ((Split-Path $entry.file -Leaf)+'.log')
   [IO.File]::WriteAllText($logPath,$log,[Text.UTF8Encoding]::new($false))
   $counts=@{}
   foreach($metric in @('pass','fail','skipped')) { $found=[regex]::Matches($log,'(?m)^# '+$metric+' (\\d+)\\r?$');$counts[$metric]=if($found.Count){[int]$found[$found.Count-1].Groups[1].Value}else{0} }
   $rows+=@{phase=$phase;file=$entry.file;exit=$code;office=$entry.office;tooling=$entry.tooling;pass=$counts.pass;fail=$counts.fail;skip=$counts.skipped;scriptPass=[int]($code -eq 0 -and $counts.pass -eq 0);command=('node '+($nodeArgs -join ' '));log=$logPath.Substring($repoRoot.Length+1).Replace('\\','/')}
   [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'test-results.json'),($rows|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
   Write-Output ($phase+' '+$entry.file+' pass='+$counts.pass+' fail='+$counts.fail+' exit='+$code)
  }
 }
 & node scripts/hani-design-polish-2-regression.mjs --collect
 exit $LASTEXITCODE
} finally {Remove-Item Env:DESIGN2_EVIDENCE_DIR -ErrorAction SilentlyContinue;Pop-Location}
`;
 fs.writeFileSync(path.join(out,'run-regression.ps1'),'\ufeff'+ps);
 console.log('Prepared: & artifacts/design-polish-2/local/design2e/run-regression.ps1 (paired baseline/current main298; no Git or browser)');
}
