param([ValidateSet('baseline','current')][string]$Phase='current',[string[]]$Only=@())
$ErrorActionPreference='Continue'
$taskRoot=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$runRoot=if($Phase -eq 'baseline'){Join-Path $PSScriptRoot 'local/baseline'}else{$taskRoot}
$outDir=Join-Path $PSScriptRoot "local/$Phase-logs"
[void][IO.Directory]::CreateDirectory($outDir)
$results=@()
if($Only.Count -and (Test-Path (Join-Path $PSScriptRoot "local/$Phase-results.json"))){
  $decoded=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot "local/$Phase-results.json") | ConvertFrom-Json
  foreach($entry in $decoded){$results+=,$entry}
}
$processed=0
Push-Location $runRoot
try {
  $testFiles=@(Get-ChildItem -LiteralPath 'scripts' -File -Filter '*.test.mjs' | Sort-Object Name)
  if($Only.Count){$testFiles=@($testFiles | Where-Object {$_.Name -in $Only})}
  foreach($testFile in $testFiles){
    $processed++
    $watch=[Diagnostics.Stopwatch]::StartNew()
    $output=@(& node "scripts/$($testFile.Name)" 2>&1 | ForEach-Object { $_.ToString() })
    $code=$LASTEXITCODE
    $body=$output -join "`n"
    [IO.File]::WriteAllText((Join-Path $outDir "$($testFile.Name).log"),$body+"`n",[Text.UTF8Encoding]::new($false))
    $row=[ordered]@{file=$testFile.Name;exit=$code;pass=0;fail=0;skip=0;seconds=[Math]::Round($watch.Elapsed.TotalSeconds,2)}
    foreach($pair in @(@('pass','pass'),@('fail','fail'),@('skip','skipped'))){
      $matchesInLog=[regex]::Matches($body,"(?m)^[#ℹ]?\s*$($pair[1])\s+(\d+)\s*$")
      if($matchesInLog.Count){$row[$pair[0]]=[int]$matchesInLog[$matchesInLog.Count-1].Groups[1].Value}
    }
    $results=@($results | Where-Object {$_.file -ne $testFile.Name})
    $results+=,$row
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot "local/$Phase-results.json"), (ConvertTo-Json -InputObject @($results) -Depth 5),[Text.UTF8Encoding]::new($false))
    Write-Output ("{0} {1}/{2} {3} exit={4} pass={5} fail={6} skip={7}" -f $Phase,$processed,$testFiles.Count,$testFile.Name,$code,$row.pass,$row.fail,$row.skip)
  }
} finally { Pop-Location }
