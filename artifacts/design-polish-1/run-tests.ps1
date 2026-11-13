$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $taskRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
  & node (Join-Path $taskRoot 'plan.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'Test enumeration failed' }
  $plan = Get-Content -Raw -Encoding UTF8 (Join-Path $taskRoot 'test-plan.json') | ConvertFrom-Json
  $logRoot = Join-Path $taskRoot 'test-logs'
  New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
  $rows = @()
  foreach ($testRow in $plan.plan) {
    if ($testRow.status -ne 'READY') { continue }
    $testArgs = @()
    if ($testRow.preload) { $testArgs += @('--require', './scripts/hani-design-polish-1-preload.cjs') }
    $testArgs += $testRow.file
    $testArgs += $testRow.args
    $logFile = Join-Path $logRoot ((Split-Path $testRow.file -Leaf) + '.log')
    # Direct node script avoids Node's child test-worker spawn in this workspace.
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & node @testArgs *> $logFile
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousPreference
    $log = Get-Content -Raw -Encoding UTF8 $logFile
    $counts = @{}
    foreach ($metric in @('tests','pass','fail','skipped')) {
      $matchesFound = [regex]::Matches($log, '(?m)(?:^|[ ])' + $metric + ' ([0-9]+)\r?$')
      $counts[$metric] = if ($matchesFound.Count) { [int]$matchesFound[$matchesFound.Count-1].Groups[1].Value } else { 0 }
    }
    $rows += [pscustomobject]@{file=$testRow.file;exitCode=$exitCode;office=$testRow.office;knownFailure=$testRow.knownFailure;tests=$counts.tests;pass=$counts.pass;fail=$counts.fail;skipped=$counts.skipped;log=$logFile.Substring($repoRoot.Length+1).Replace('\','/')}
    $label = if ($exitCode -eq 0) {'PASS'} else {'FAIL'}
    Write-Output ($label + ' ' + $testRow.file)
  }
  $rows | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $taskRoot 'test-results.json')
  $failed = @($rows | Where-Object exitCode -ne 0)
  Write-Output ('Files ' + $rows.Count + '; success ' + ($rows.Count-$failed.Count) + '; failed ' + $failed.Count)
  & node (Join-Path $taskRoot 'summarize.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'Result summarization failed' }
  if ($failed.Count -gt 0) { exit 1 }
} finally { Pop-Location }
