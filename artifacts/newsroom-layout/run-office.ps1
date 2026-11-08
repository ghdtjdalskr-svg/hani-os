$ErrorActionPreference = 'Stop'
$layoutRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location $layoutRoot
try {
    $layoutLogs = Join-Path $PSScriptRoot 'logs'
    New-Item -ItemType Directory -Force -Path $layoutLogs | Out-Null
    # Restore only incidental JSON outputs produced by this run, not app owners.
    $layoutSaved = @{}
    Get-ChildItem artifacts -Recurse -File -Filter '*.json' | Where-Object { -not $_.FullName.StartsWith($PSScriptRoot + '\') } | ForEach-Object { $layoutSaved[$_.FullName] = [IO.File]::ReadAllBytes($_.FullName) }
    $layoutResults = @()
    $env:OFFICE_SOFT = '1'
    $env:HANI_BUILDING_SAFETY_BASELINE = Join-Path $layoutRoot 'artifacts/office-behavior/safety-baseline'
    foreach ($layoutTest in (Get-ChildItem scripts -File | Where-Object { $_.Name -like 'hani-office-*.test.mjs' -or $_.Name -like 'hani-building-*.test.mjs' } | Sort-Object Name)) {
        $layoutLog = Join-Path $layoutLogs ($layoutTest.Name + '.log')
        $layoutWatch = [Diagnostics.Stopwatch]::StartNew()
        $ErrorActionPreference = 'Continue'
        & node --require ./artifacts/newsroom-layout/no-git.cjs --require ./artifacts/newsroom-layout/layout-preload.cjs --test --test-isolation=none $layoutTest.FullName *> $layoutLog
        $layoutExit = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        $layoutText = Get-Content -Raw -Encoding UTF8 $layoutLog
        $layoutResults += [pscustomobject]@{file=$layoutTest.Name;exit=$layoutExit;gitBlocked=$layoutText.Contains('GIT_FORBIDDEN_BY_TASK');seconds=[math]::Round($layoutWatch.Elapsed.TotalSeconds,2);summary=(@($layoutText -split "`n" | Where-Object { $_ -match '^(ℹ (tests|pass|fail|skipped)|# (tests|pass|fail|skipped)|✖|not ok)' }) -join "`n")}
        Write-Output ($layoutTest.Name + ' exit=' + $layoutExit + $(if ($layoutText.Contains('GIT_FORBIDDEN_BY_TASK')) { ' Git-blocked' } else { '' }))
    }
    $layoutRestored = @()
    foreach ($layoutFile in $layoutSaved.Keys) {
        $layoutNow = [IO.File]::ReadAllBytes($layoutFile)
        if ([Convert]::ToBase64String($layoutNow) -ne [Convert]::ToBase64String($layoutSaved[$layoutFile])) {
            [IO.File]::WriteAllBytes($layoutFile,$layoutSaved[$layoutFile]); $layoutRestored += $layoutFile.Substring($layoutRoot.Length+1)
        }
    }
    [pscustomobject]@{results=$layoutResults;restoredIncidentalJson=$layoutRestored;command='node --require no-git.cjs --require layout-preload.cjs --test --test-isolation=none <file>';gitExecuted=$false} | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'office-results.json')
    Write-Output ('OFFICE FILES=' + $layoutResults.Count + ' SUCCESS=' + @($layoutResults | Where-Object exit -eq 0).Count + ' GIT-BLOCKED=' + @($layoutResults | Where-Object gitBlocked).Count)
} finally { Pop-Location }
