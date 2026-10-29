# Exact final-source targeted office regression. Raw UTF-8 Node output, no browser.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot)
try {
    $taskDir = 'artifacts/office-behavior/obr21-suite'
    New-Item -ItemType Directory -Force $taskDir | Out-Null
    $taskIdentity = (Get-FileHash -Algorithm SHA256 hani-office-live.js).Hash.ToLower()
    if (Test-Path 'artifacts/office-behavior/obr13-git/manifest.json') { $env:NODE_OPTIONS = '--require ./scripts/hani-office-234-git-preload.cjs' }
    if (Test-Path 'artifacts/office-behavior/safety-baseline') { $env:HANI_BUILDING_SAFETY_BASELINE = Join-Path (Get-Location) 'artifacts/office-behavior/safety-baseline' }
    if (Test-Path 'artifacts/office-behavior/git-baseline') { $env:HANI_OFFICE_TEST_BASELINE = Join-Path (Get-Location) 'artifacts/office-behavior/git-baseline' }
    $env:HANI_OFFICE_TEST_TAG = 'obr21'
    $env:OFFICE_SOFT = '1' # Existing optional-browser flag; unchanged assertions.
    $taskResults = @()
    $taskFiles = Get-ChildItem scripts -File | Where-Object { $_.Name -like 'hani-office-*.test.mjs' -or $_.Name -like 'hani-building-*.test.mjs' } | Sort-Object Name
    foreach ($taskFile in $taskFiles) {
        $taskLog = "$taskDir/$($taskFile.Name).log"
        cmd /d /c "node --test --test-isolation=none `"scripts/$($taskFile.Name)`" > `"$taskLog`" 2>&1"
        $taskExit = $LASTEXITCODE
        if ((Get-FileHash -Algorithm SHA256 hani-office-live.js).Hash.ToLower() -ne $taskIdentity) { throw 'Runtime changed during regression' }
        $taskResults += @{file=$taskFile.Name; exit=$taskExit; log=$taskLog; runtimeSha256=$taskIdentity}
        $taskResults | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 "$taskDir/results.json"
        Write-Output ("finished " + $taskFile.Name + " exit=" + $taskExit)
    }
    if (@($taskResults | Where-Object exit -ne 0).Count) { throw 'Office regression failures: see results.json; no thresholds waived' }
} finally { Pop-Location }
