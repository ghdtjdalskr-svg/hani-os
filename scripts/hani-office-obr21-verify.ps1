# Run the final source, retaining raw logs and failures. No browser or release.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot)
try {
    $taskDir = 'artifacts/office-behavior'
    $taskIdentity = (Get-FileHash -Algorithm SHA256 hani-office-live.js).Hash.ToLower()
    if (Test-Path 'artifacts/office-behavior/obr13-git/manifest.json') { $env:NODE_OPTIONS = '--require ./scripts/hani-office-234-git-preload.cjs' }
    $env:HANI_OFFICE_TEST_TAG = 'obr21'
    $env:OFFICE_SOFT = '1'
    $taskResults = @()
    git -c core.quotepath=false ls-tree -r 2cd24abb6360f6509d005b975eb0513ad6b1a03e -- assets data hani-desk-mascots.css hani-desk-mascots.js hani-main.js index.html scripts/fixtures/office-lively-labels-235-plans.json.gz | Set-Content -Encoding UTF8 "$taskDir/obr21-protected-tree.txt"
    if ($LASTEXITCODE) { throw 'Protected Git tree export failed' }
    cmd /d /c 'node --test --test-isolation=none scripts/hani-reviewed-release-baseline.test.mjs > artifacts/office-behavior/obr21-approved.log 2>&1'
    $taskResults += @{gate='approved';exit=$LASTEXITCODE}
    try { & "$PSScriptRoot/hani-office-obr21-regression.ps1"; $taskResults += @{gate='regression';exit=0} }
    catch { $taskResults += @{gate='regression';exit=1;error=$_.Exception.Message} }
    foreach ($taskPresence in @('absent','present')) {
        $taskFlag = if ($taskPresence -eq 'present') { '--chairman' } else { '' }
        $taskRepo = (Get-Location).Path
        cmd /d /c "node docs/drafts/office-behavior-redesign/audit.mjs `"$taskRepo`" $taskFlag > artifacts/office-behavior/obr21-audit-$taskPresence.log 2>&1"
        $taskResults += @{gate="audit-$taskPresence";exit=$LASTEXITCODE}
        Write-Output "finished audit-$taskPresence exit=$LASTEXITCODE"
    }
    try { & "$PSScriptRoot/hani-office-obr21-metrics.ps1"; $taskResults += @{gate='performance';exit=0} }
    catch { $taskResults += @{gate='performance';exit=1;error=$_.Exception.Message} }
    if ((Get-FileHash -Algorithm SHA256 hani-office-live.js).Hash.ToLower() -ne $taskIdentity) { throw 'Runtime changed during verification' }
    @{runtimeSha256=$taskIdentity;results=$taskResults} | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 "$taskDir/obr21-verification.json"
    if (@($taskResults | Where-Object exit -ne 0).Count) { throw 'Verification failed: see obr21-verification.json' }
} finally { Pop-Location }
