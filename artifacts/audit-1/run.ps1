param([switch]$GitOnly,[switch]$AllowProcesses,[switch]$Baseline,[string]$Only,[int]$Shard=0,[int]$Shards=1,[switch]$SkipPlan)
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 if($GitOnly -and -not $AllowProcesses){throw 'GitOnly is delegated to Seoyun; use -AllowProcesses explicitly'}
 $phase=if($Baseline){'baseline'}elseif($GitOnly){'git'}else{'current'}
 $env:AUDIT1_PHASE=$phase;$env:AUDIT1_EVIDENCE_DIR='artifacts/audit-1/local/'+$phase
 if($Shard -lt 0 -or $Shards -lt 1 -or $Shard -ge $Shards){throw 'Invalid shard'}
 if(-not $SkipPlan){& node artifacts/audit-1/plan.mjs;if($LASTEXITCODE -ne 0){throw 'Inventory failed'}}
 $out=Join-Path $PSScriptRoot 'local'
 $plan=Get-Content -Raw -Encoding UTF8 (Join-Path $out 'test-inventory.json')|ConvertFrom-Json
 $contract=(Get-FileHash -LiteralPath 'scripts/fixtures/audit-1-delta.json' -Algorithm SHA256).Hash.ToLowerInvariant()
 $rows=@();$logRoot=Join-Path $out ($phase+'/test-logs')
 New-Item -ItemType Directory -Force -Path $logRoot|Out-Null
 $env:OFFICE_SOFT='1';$env:FORCE_COLOR='0'
 $index=0
 foreach($entry in $plan.entries){
  if($GitOnly){if($entry.reason -ne 'GIT_DELEGATED'){continue}}elseif($entry.reason){continue}
  if($Baseline -and -not ($entry.knownLegacy -or $entry.file.Contains('exam-popup-214') -or $entry.file -eq 'scripts/hani-lounge-billboard.test.mjs')){continue}
  if($Only -and $entry.file -notin $Only.Split(',')){continue}
  $selected=(($index % $Shards) -eq $Shard);$index++;if(-not $selected){continue}
  $env:AUDIT1_EVIDENCE_DIR='artifacts/audit-1/local/'+$phase+'/tests/'+(Split-Path $entry.file -Leaf)
  $nodeArgs=@()
  if(-not $AllowProcesses){$nodeArgs+=@('--require','./scripts/hani-design-polish-2-execution-guard.cjs')}
  $nodeArgs+=@('--require','./artifacts/audit-1/output.cjs','--require','./scripts/hani-audit-1-preload.cjs')
  if($Baseline){$nodeArgs+=@('--require','./scripts/hani-design-polish-2-main297-baseline.cjs')}
  if($Baseline -and $entry.file -eq 'scripts/hani-lounge-billboard.test.mjs'){$nodeArgs+=@('--require','./artifacts/audit-1/main299-baseline.cjs')}
  $testFile=if($entry.file -eq 'scripts/hani-lounge-billboard.test.mjs'){Join-Path $repoRoot $entry.file}else{$entry.file}
  $nodeArgs+=@('--test','--test-isolation=none','--test-reporter=tap',$testFile)+@($entry.args)
  $ErrorActionPreference='Continue';$output=@(& node @nodeArgs 2>&1);$code=$LASTEXITCODE;$ErrorActionPreference='Stop'
  $log=($output|ForEach-Object {"$_"}) -join [Environment]::NewLine
  $logPath=Join-Path $logRoot ((Split-Path $entry.file -Leaf)+'.log')
  [IO.File]::WriteAllText($logPath,$log,[Text.UTF8Encoding]::new($false))
  $counts=@{};foreach($metric in @('pass','fail','skipped')){$found=[regex]::Matches($log,'(?m)^# '+$metric+' (\d+)\r?$');$counts[$metric]=if($found.Count){[int]$found[$found.Count-1].Groups[1].Value}else{0}}
  $names=@([regex]::Matches($log,'(?m)^not ok \d+ - (.+)\r?$')|ForEach-Object {$_.Groups[1].Value.Trim()})
  if((Get-FileHash -LiteralPath 'scripts/fixtures/audit-1-delta.json' -Algorithm SHA256).Hash.ToLowerInvariant() -ne $contract){throw 'audit-1 contract changed during run'}
  $rows+=@{phase=$phase;contract=$contract;file=$entry.file;exit=$code;office=$entry.office;tooling=$entry.tooling;knownLegacy=$entry.knownLegacy;added=$entry.added;pass=$counts.pass;fail=$counts.fail;skip=$counts.skipped;scriptPass=[int]($code -eq 0 -and $counts.pass -eq 0);failureNames=$names;command=('node '+($nodeArgs -join ' '));log=$logPath.Substring($repoRoot.Length+1).Replace('\','/')}
  $name=if($Only){'results-'+$phase+'-selected.json'}else{'results-'+$phase+'-'+$Shard+'.json'}
  [IO.File]::WriteAllText((Join-Path $out $name),(ConvertTo-Json -InputObject @($rows) -Depth 8),[Text.UTF8Encoding]::new($false))
  Write-Output ($entry.file+' pass='+$counts.pass+' fail='+$counts.fail+' exit='+$code)
 }
 if(@($rows|Where-Object {$_.exit -ne 0 -and -not $_.knownLegacy -and -not $_.file.Contains('exam-popup-214')}).Count){exit 1}
} finally {Remove-Item Env:AUDIT1_PHASE,Env:AUDIT1_EVIDENCE_DIR -ErrorAction SilentlyContinue;Pop-Location}
