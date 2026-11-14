param([switch]$GitOnly,[switch]$AllowProcesses,[ValidateSet('current','baseline')][string]$Phase='current',[int]$Shard=0,[int]$Shards=1,[string[]]$Only)
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 if($Shard -lt 0 -or $Shards -lt 1 -or $Shard -ge $Shards){throw 'Invalid shard'}
 if($GitOnly -and -not $AllowProcesses){throw 'GitOnly is delegated to Seoyun; use -AllowProcesses explicitly'}
 & node artifacts/design-polish-2/tooling299-plan.mjs
 if($LASTEXITCODE -ne 0){throw 'Inventory failed'}
 $out=Join-Path $PSScriptRoot 'tooling299-local'
 if(-not $GitOnly){[IO.File]::WriteAllText((Join-Path $out ('run-config-'+$Phase+'.json')),('{"shards":'+$Shards+'}'),[Text.UTF8Encoding]::new($false))}
 $plan=Get-Content -Raw -Encoding UTF8 (Join-Path $out 'test-inventory.json')|ConvertFrom-Json
 $rows=@();$index=0
 $logRoot=Join-Path $out ($Phase+'/test-logs');New-Item -ItemType Directory -Force -Path $logRoot|Out-Null
 $env:DESIGN2_EVIDENCE_DIR='artifacts/design-polish-2/tooling299-local/'+$Phase
 $env:OFFICE_SOFT='1';$env:FORCE_COLOR='0'
 foreach($entry in $plan.entries){
  if($GitOnly){if($entry.reason -ne 'GIT_DELEGATED'){continue}}elseif($entry.reason){continue}
  if($Only -and $entry.file -notin $Only){continue}
  if($Phase -eq 'baseline' -and -not ($entry.knownLegacy -or $entry.file.Contains('exam-popup-214'))){continue}
  $selected=(($index % $Shards) -eq $Shard);$index++;if(-not $selected){continue}
  $nodeArgs=@()
  if(-not $AllowProcesses){$nodeArgs+=@('--require','./scripts/hani-design-polish-2-execution-guard.cjs')}
  $nodeArgs+=@('--require','./artifacts/design-polish-2/tooling299-output.cjs')
  if($Phase -eq 'baseline'){$nodeArgs+=@('--require','./scripts/hani-design-polish-2-main297-baseline.cjs')}
  $nodeArgs+=@('--test','--test-isolation=none','--test-reporter=tap',$entry.file)+@($entry.args)
  $ErrorActionPreference='Continue';$output=@(& node @nodeArgs 2>&1);$code=$LASTEXITCODE;$ErrorActionPreference='Stop'
  $log=($output|ForEach-Object {"$_"}) -join [Environment]::NewLine
  $logPath=Join-Path $logRoot ((Split-Path $entry.file -Leaf)+'.log')
  [IO.File]::WriteAllText($logPath,$log,[Text.UTF8Encoding]::new($false))
  $counts=@{};foreach($metric in @('pass','fail','skipped')){$found=[regex]::Matches($log,'(?m)^# '+$metric+' (\d+)\r?$');$counts[$metric]=if($found.Count){[int]$found[$found.Count-1].Groups[1].Value}else{0}}
  $names=@([regex]::Matches($log,'(?m)^not ok \d+ - (.+)\r?$')|ForEach-Object {$_.Groups[1].Value.Trim()})
  $rows+=@{phase=$Phase;file=$entry.file;exit=$code;office=$entry.office;tooling=$entry.tooling;knownLegacy=$entry.knownLegacy;pass=$counts.pass;fail=$counts.fail;skip=$counts.skipped;scriptPass=[int]($code -eq 0 -and $counts.pass -eq 0);failureNames=$names;command=('node '+($nodeArgs -join ' '));log=$logPath.Substring($repoRoot.Length+1).Replace('\','/')}
  $resultName=if($GitOnly){'results-git-'+$Shard+'.json'}else{'results-'+$Phase+'-'+$Shard+'.json'}
  [IO.File]::WriteAllText((Join-Path $out $resultName),(ConvertTo-Json -InputObject @($rows) -Depth 8),[Text.UTF8Encoding]::new($false))
  Write-Output ($entry.file+' pass='+$counts.pass+' fail='+$counts.fail+' exit='+$code)
 }
 if(@($rows|Where-Object {$_.exit -ne 0 -and -not $_.knownLegacy -and -not $_.file.Contains('exam-popup-214')}).Count){exit 1}
} finally {Remove-Item Env:DESIGN2_EVIDENCE_DIR -ErrorAction SilentlyContinue;Pop-Location}
