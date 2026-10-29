$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot
Push-Location $taskRoot
try {
    $branch = (& git branch --show-current).Trim()
    $base = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'hani/release-train-20261023' -or $base -ne '246f1c0b56ef2dd63fc134c0e7cba583725bcf25') { throw 'Unexpected worktree identity; do not merge/rebase automatically' }
    $protected = @('index.html','hani-main.js','hani-desk-mascots.js','assets/data/desk-mascots-v1.json','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','scripts/fixtures/office-obr6-plans.json.gz','scripts/fixtures/office-obr8-plans.json.gz','scripts/fixtures/office-obr6-routes.json','scripts/hani-reviewed-release-baseline.mjs','scripts/hani-reviewed-release-baseline.test.mjs')
    $changed = @(& git diff --name-only HEAD -- $protected)
    if ($LASTEXITCODE -ne 0 -or $changed.Count) { throw ('Protected files changed: ' + ($changed -join ', ')) }
    git diff --check
    if ($LASTEXITCODE -ne 0) { throw 'Whitespace check failed' }
    $historical = @()
    foreach ($ref in @('246f1c0','0b7bedd')) {
        foreach ($file in @('hani-office-live.js','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','data/hani-building/office-places.json','assets/sprites-v2/manifest.json','assets/data/office-actions-221.json')) {
            $path = Join-Path ('artifacts/office-behavior/lively-baseline/' + $ref) $file
            $expected = (& git rev-parse "${ref}:$file").Trim()
            if ($LASTEXITCODE -ne 0) { throw 'Historical Git origin missing' }
            $actual = (& git hash-object -- $path).Trim()
            if ($LASTEXITCODE -ne 0 -or $actual -ne $expected) { throw 'Historical export does not match native Git object' }
            $historical += @{ref=$ref;file=$file;blob=$actual}
        }
    }
    foreach ($file in @('hani-office-live.js','scripts/hani-office-obr10-author.mjs','scripts/hani-office-obr10-compare.mjs','scripts/hani-office-obr10-freeze.mjs','scripts/hani-office-obr10-metrics.mjs','scripts/hani-office-obr10-report.mjs','scripts/hani-office-obr10.test.mjs')) {
        node --check $file
        if ($LASTEXITCODE -ne 0) { throw ('Syntax check failed: ' + $file) }
    }
    $result = @{branch=$branch;base=$base;runtimeSha256=(Get-FileHash hani-office-live.js -Algorithm SHA256).Hash.ToLower();placesSha256=(Get-FileHash data/hani-building/office-places.json -Algorithm SHA256).Hash.ToLower();protectedUnchanged=$protected;historicalExports=$historical;originMainCached='d19aa0b62b1657660cb3cc6bec6bee1524dbb2bf';remoteMain='network connection failed';displayVersion='2.9.232';lastUIScript='hani-ui-v02992.js';gitCommit='index.lock Permission denied; no stage/commit; no privilege workaround';production='not performed';notion='forbidden by user'}
    [IO.File]::WriteAllText((Join-Path $taskRoot 'artifacts/office-behavior/obr10-safety.json'), ($result | ConvertTo-Json -Depth 8) + "`n", (New-Object Text.UTF8Encoding($false)))
    Write-Output 'Protected files unchanged, syntax and 12 immutable historical Git objects verified.'
} finally { Pop-Location }
