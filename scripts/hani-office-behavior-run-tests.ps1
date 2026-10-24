# Read-only Git baseline exports for legacy checks. No browser, network, index,
# app data, or branch mutation. Run from any folder with Windows PowerShell.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot
Push-Location $taskRoot
try {
    $safetyRoot = Join-Path $taskRoot 'artifacts/office-behavior/safety-baseline'
    New-Item -ItemType Directory -Force -Path $safetyRoot | Out-Null
    foreach ($relativeFile in @('index.html','hani-office-live.js','hani-office-live.css','hani-style-01.css','scripts/hani-nav-groups.test.mjs','hani-main.js','hani-ui-cleanup-v02971.js','hani-investment-committee.js')) {
        $exportTarget = Join-Path $safetyRoot ($relativeFile.Replace('/','-'))
        cmd /d /c "git show 65cd8a071d657741319b54c063d1ba8c5ab6aefb:$relativeFile > `"$exportTarget`""
        if ($LASTEXITCODE -ne 0) { throw "Safety baseline export failed: $relativeFile" }
    }
    $gitRoot = Join-Path $taskRoot 'artifacts/office-behavior/git-baseline'
    $revisions = @(
        @('60db7b5', @('hani-office-live.js','data/hani-building/art-map-v1.json','assets/sprites-v2/manifest.json')),
        @('974fa64df67a3c0060bdf0eda951aafeaf5a9b11', @('data/hani-building/spatial-contract.json','assets/data/office-actions-216.json','assets/sprites-v2/manifest.json')),
        @('04fb2b377f28958aec1480ca09244f4567c3a339', @('index.html')),
        @('4ac6b6c', @('index.html'))
    )
    foreach ($row in $revisions) {
        $revision = $row[0]
        foreach ($relativeFile in $row[1]) {
            $exportTarget = Join-Path (Join-Path $gitRoot $revision) $relativeFile
            New-Item -ItemType Directory -Force -Path (Split-Path $exportTarget) | Out-Null
            cmd /d /c "git show ${revision}:$relativeFile > `"$exportTarget`""
            if ($LASTEXITCODE -ne 0) { throw "Legacy baseline export failed: $relativeFile" }
        }
    }
    $env:HANI_BUILDING_SAFETY_BASELINE = $safetyRoot
    $canonExport = Join-Path $taskRoot 'artifacts/office-behavior/lively-baseline/65cd8a071d657741319b54c063d1ba8c5ab6aefb/data/hani-building/spatial-contract.json'
    New-Item -ItemType Directory -Force -Path (Split-Path $canonExport) | Out-Null
    cmd /d /c "git show 65cd8a071d657741319b54c063d1ba8c5ab6aefb:data/hani-building/spatial-contract.json > `"$canonExport`""
    if ($LASTEXITCODE -ne 0) { throw 'Frozen onboarding baseline export failed' }
    foreach ($relativeFile in @('hani-office-live.js','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','assets/data/office-actions-216.json','assets/data/office-actions-221.json')) {
        $exportTarget = Join-Path $taskRoot ('artifacts/office-behavior/lively-baseline/4ac6b6c/' + $relativeFile)
        New-Item -ItemType Directory -Force -Path (Split-Path $exportTarget) | Out-Null
        cmd /d /c "git show 4ac6b6c:$relativeFile > `"$exportTarget`""
        if ($LASTEXITCODE -ne 0) { throw "232 rollout baseline export failed: $relativeFile" }
    }
    $env:HANI_OFFICE_TEST_BASELINE = $gitRoot
    $env:OFFICE_SOFT = '1'
    node --test --test-isolation=none 'scripts/hani-office-*.test.mjs' 'scripts/hani-building-*.test.mjs'
    if ($LASTEXITCODE -ne 0) { throw "Node suite failed: $LASTEXITCODE" }
} finally { Pop-Location }
