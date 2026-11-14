param([switch]$GitOnly,[switch]$AllowProcesses,[switch]$RetryFailed)
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 & node (Join-Path $PSScriptRoot 'tooling296-plan.cjs')
 if($LASTEXITCODE -ne 0){throw 'Test enumeration failed'}
 if($GitOnly -and -not $AllowProcesses){throw 'GitOnly is delegated to Seoyun; use -AllowProcesses explicitly'}
 $plan=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'tooling296-plan.json')|ConvertFrom-Json
 $logRoot=Join-Path $PSScriptRoot 'tooling296-local/test-logs'
 New-Item -ItemType Directory -Force -Path $logRoot|Out-Null
 $resultName=if($GitOnly){'tooling296-local/git-results.json'}else{'tooling296-local/results.json'}
 $resultPath=Join-Path $PSScriptRoot $resultName
 $previous=@()
 if($RetryFailed){$previous=Get-Content -Raw -Encoding UTF8 $resultPath|ConvertFrom-Json}
 $rows=@($previous|Where-Object exit -eq 0)
 foreach($row in $plan.plan){
  if($GitOnly){if($row.status -ne 'GIT_REQUIRED'){continue}}else{if($row.status -ne 'READY'){continue}}
  if($RetryFailed -and -not @($previous|Where-Object {$_.file -eq $row.file -and $_.exit -ne 0}).Count){continue}
  $argsForTest=@()
  if(-not $AllowProcesses){$argsForTest+=@('--require','./scripts/hani-tooling-293-deny-process.cjs')}
  # Each frozen reader owns its own process. No external inverse preload.
  $argsForTest+=@('--require','./artifacts/design-polish-1/tooling296-output.cjs')
  $argsForTest+=@('--test','--test-isolation=none','--test-reporter=tap',$row.file)
  $argsForTest+=@($row.args)
  $logPath=Join-Path $logRoot ((Split-Path $row.file -Leaf)+'.log')
  if($RetryFailed -and (Test-Path -LiteralPath $logPath)){
   $archive=Join-Path $PSScriptRoot 'tooling296-local/initial-failures'
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
  if(-not $GitOnly){& node (Join-Path $PSScriptRoot 'tooling296-summarize.cjs');if($LASTEXITCODE -ne 0){throw 'Result summarization failed'}}
} finally {Pop-Location}
