param([switch]$RetryFailed,[string[]]$Files)
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 & node (Join-Path $PSScriptRoot 'plan.cjs')
 if($LASTEXITCODE -ne 0){throw 'Test enumeration failed'}
 $plan=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'plan.json')|ConvertFrom-Json
 $logRoot=Join-Path $PSScriptRoot 'local/test-logs'
 New-Item -ItemType Directory -Force -Path $logRoot|Out-Null
 $resultPath=Join-Path $PSScriptRoot 'local/results.json'
 $previous=@()
 if($RetryFailed -or $Files){$previous=Get-Content -Raw -Encoding UTF8 $resultPath|ConvertFrom-Json}
 $rows=@(if($Files){$previous|Where-Object {$Files -notcontains $_.file}}else{$previous|Where-Object exit -eq 0})
 foreach($row in $plan.plan){
  if($row.status -ne 'READY'){continue}
  if($Files -and $Files -notcontains $row.file){continue}
  if($RetryFailed -and -not @($previous|Where-Object {$_.file -eq $row.file -and $_.exit -ne 0}).Count){continue}
  $argsForTest=@('--require','./scripts/hani-tooling-293-deny-process.cjs','--require','./artifacts/helper-toggle/output.cjs',
   '--test','--test-isolation=none','--test-reporter=tap',$row.file)
  $argsForTest+=@($row.args)
  $logPath=Join-Path $logRoot ((Split-Path $row.file -Leaf)+'.log')
  if(($RetryFailed -or $Files) -and (Test-Path -LiteralPath $logPath)){
   $archive=Join-Path $PSScriptRoot 'local/initial-failures'
   New-Item -ItemType Directory -Force -Path $archive|Out-Null
   $archivePath=Join-Path $archive (Split-Path $logPath -Leaf)
   if(-not (Test-Path -LiteralPath $archivePath)){Copy-Item -LiteralPath $logPath -Destination $archivePath}
  }
  $ErrorActionPreference='Continue'
  $output=@(& node @argsForTest 2>&1)
  $code=$LASTEXITCODE
  $ErrorActionPreference='Stop'
  $log=($output|ForEach-Object {"$_"}) -join "`n"
  [IO.File]::WriteAllText($logPath,$log,[Text.UTF8Encoding]::new($false))
  $counts=@{}
  foreach($metric in @('tests','pass','fail','skipped')){
   $found=[regex]::Matches($log,'(?m)^# '+$metric+' (\d+)\r?$')
   $counts[$metric]=if($found.Count){[int]$found[$found.Count-1].Groups[1].Value}else{0}
  }
  $rows+=@{file=$row.file;exit=$code;office=$row.office;pass=$counts.pass;fail=$counts.fail;skip=$counts.skipped;log=$logPath.Substring($repoRoot.Length+1).Replace('\','/');blocked=$log.Contains('TOOL293_PROCESS_BLOCKED')}
  Write-Output ($row.file+' pass='+$counts.pass+' fail='+$counts.fail+' skip='+$counts.skipped+' exit='+$code)
 }
 [IO.File]::WriteAllText($resultPath,($rows|Sort-Object file|ConvertTo-Json -Depth 6),[Text.UTF8Encoding]::new($false))
 if(@($rows|Where-Object exit -ne 0).Count){exit 1}
} finally {Pop-Location}
