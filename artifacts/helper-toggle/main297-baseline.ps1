$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 & node (Join-Path $PSScriptRoot 'main297-baseline.cjs')
 if($LASTEXITCODE -ne 0){throw 'Independent main297 suite preparation failed'}
 $baselineFolder=Join-Path $PSScriptRoot 'local/helperoff3'
 foreach($baselineName in @('helper-bot','fun-chat-fortune')){
  $output=@(& node --require ./scripts/hani-tooling-293-deny-process.cjs --require ./artifacts/helper-toggle/base-preload.cjs --test --test-isolation=none --test-reporter=tap (Join-Path $baselineFolder ($baselineName+'-main297.test.mjs')) 2>&1)
  $code=$LASTEXITCODE
  $log=($output|ForEach-Object {"$_"}) -join "`n"
  [IO.File]::WriteAllText((Join-Path $baselineFolder ($baselineName+'-main297.tap')),$log,[Text.UTF8Encoding]::new($false))
  if($code -ne 1 -or $log.Contains('TOOL293_PROCESS_BLOCKED')){throw ('Unexpected baseline execution: '+$baselineName+' exit='+$code)}
  Write-Output ($baselineName+' original main297 exit=1; exact status comparison in helperoff3-audit.mjs')
 }
} finally {Pop-Location}
