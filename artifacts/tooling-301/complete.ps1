# Continue serially after the already-running independent baseline.
$ErrorActionPreference='Stop'
$baselinePath=Join-Path $PSScriptRoot 'local/baseline-results.json'
do {
  $baselineRows=Get-Content -Raw -Encoding UTF8 $baselinePath | ConvertFrom-Json
  if($baselineRows.Count -lt 276){Start-Sleep -Seconds 15}
} while($baselineRows.Count -lt 276)
& (Join-Path $PSScriptRoot 'run.ps1') -Phase current
$currentRows=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'local/current-results.json') | ConvertFrom-Json
$perfPattern='^hani-office-(cafe-rest|residents|companion-homes|staff-chat|lively-v2)\.test\.mjs$'
$failedPerf=@($currentRows | Where-Object {$_.file -match $perfPattern -and ($_.exit -ne 0 -or $_.timeout)} | ForEach-Object {$_.file})
if($failedPerf.Count){
  foreach($attempt in 1,2){
    & (Join-Path $PSScriptRoot 'run.ps1') -Phase current -Label "perf-current-$attempt" -Only $failedPerf
  }
}
& node (Join-Path $PSScriptRoot 'compare.cjs')
if($LASTEXITCODE -ne 0){throw 'Comparison failed'}
& node (Join-Path $PSScriptRoot 'preserve.cjs')
if($LASTEXITCODE -ne 0){throw 'Preservation audit failed'}
& node (Join-Path $PSScriptRoot 'finish.cjs')
if($LASTEXITCODE -ne 0){throw 'Report generation failed'}
