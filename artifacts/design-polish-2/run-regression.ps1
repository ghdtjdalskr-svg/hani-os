$ErrorActionPreference = 'Continue'
Set-Location -LiteralPath $PSScriptRoot
Set-Location -LiteralPath '..\..'
$env:OFFICE_SOFT = '1'
$env:FORCE_COLOR = '0'
$entries = Get-Content -Raw -Encoding UTF8 'artifacts/design-polish-2/test-inventory.json' | ConvertFrom-Json
$results = @()
foreach ($entry in $entries) {
  if ($entry.reason) { continue }
  $nodeArgs = @('--require','./scripts/hani-design-polish-2-execution-guard.cjs',$entry.file) + @($entry.args)
  $logPath = 'artifacts/design-polish-2/test-logs/' + [System.IO.Path]::GetFileName($entry.file) + '.log'
  & node @nodeArgs *> $logPath
  $results += [PSCustomObject]@{file=$entry.file;exit=$LASTEXITCODE}
  $results | ConvertTo-Json | Set-Content -Encoding UTF8 'artifacts/design-polish-2/powershell-exits.json'
  Write-Output ($entry.file + ' exit=' + $LASTEXITCODE)
}
& node scripts/hani-design-polish-2-regression.mjs --collect
exit $LASTEXITCODE
