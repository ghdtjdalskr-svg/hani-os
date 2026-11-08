param([string]$Label='final',[string[]]$Only=@(),[switch]$Baseline)
$ErrorActionPreference='Continue'
$runtime=Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$env:PATH=(Join-Path $runtime 'native\git\cmd')+';'+(Join-Path $runtime 'node\bin')+';'+$env:PATH
$taskRoot=Split-Path (Split-Path $PSScriptRoot)
Push-Location $taskRoot
try {
 $folder=Join-Path $PSScriptRoot ($Label+'-tests')
 New-Item -ItemType Directory -Force $folder | Out-Null
 $files=Get-ChildItem scripts/hani-office-*.test.mjs | Sort-Object Name
 if($Only.Count){$files=$files | Where-Object {$Only -contains $_.Name}}
 if($Baseline){$files=$files | Where-Object {$_.Name -ne 'hani-office-kids-weekday.test.mjs'}}
 $results=@()
 foreach($file in $files){
  $log=Join-Path $folder ($file.Name+'.tap')
  if($Baseline){node --require ./artifacts/kids-weekday/baseline-read.cjs --test --test-isolation=none --test-reporter=tap $file.FullName *> $log}
  else {node --test --test-isolation=none --test-reporter=tap $file.FullName *> $log}
  $code=$LASTEXITCODE
  $lines=Get-Content $log
  $row=[ordered]@{file=$file.Name;exit=$code;pass=0;fail=0;skipped=0;failures=@()}
  foreach($line in $lines){if($line -match '^# (pass|fail|skipped) (\d+)$'){$row[$matches[1]]=[int]$matches[2]};if($line -match '^not ok \d+ - (.*)$'){$row.failures+=,$matches[1]}}
  $results+=,[pscustomobject]$row
  $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $folder 'summary.json')
  Write-Output ($file.Name+': '+$row.pass+' pass / '+$row.fail+' fail / '+$row.skipped+' skip')
 }
} finally {Pop-Location}
