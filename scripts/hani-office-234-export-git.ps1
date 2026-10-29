# Read-only historical Git export; raw cmd redirection preserves all EOL bytes.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot
Push-Location $taskRoot
try {
    node scripts/hani-office-234-export-requests.mjs
    if ($LASTEXITCODE) { throw 'request generation failed' }
    $taskExports = Join-Path $taskRoot 'artifacts/office-behavior/obr13-git'
    $taskManifest = @()
    foreach ($row in (Get-Content -Raw -LiteralPath (Join-Path $taskExports 'requests.json') | ConvertFrom-Json)) {
        $objectId = & git rev-parse --verify $row.key 2>$null
        if ($LASTEXITCODE) { continue } # Nonexistent historical files cannot be requested by preload.
        $target = Join-Path $taskExports $row.path
        cmd /d /c "git show `"$($row.key)`" > `"$target`""
        if ($LASTEXITCODE) { throw "Git export failed: $($row.key)" }
        $taskManifest += @{ key = $row.key; path = $row.path; object = $objectId.Trim() }
    }
    $taskManifest | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $taskExports 'manifest.json')
    Write-Output ("Historical Git objects exported: " + $taskManifest.Count)
} finally { Pop-Location }
