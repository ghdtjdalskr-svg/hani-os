# Compatibility entry point. Logs and snapshots are confined to local/.
$ErrorActionPreference='Stop'
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $repoRoot
try {
 & node scripts/hani-design-polish-2-regression.mjs --prepare-powershell
 if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
 & artifacts/design-polish-2/local/design2d/run-regression.ps1
 exit $LASTEXITCODE
} finally {Pop-Location}
