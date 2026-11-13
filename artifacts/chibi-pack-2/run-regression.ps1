param([string]$Phase = 'after', [switch]$AllowProcesses)
$ErrorActionPreference = 'Continue'
$outputDir = Join-Path $PWD ('tmp/chibi-pack-2/' + $Phase)
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$excludePattern = 'settings-225|ilbo-banner-215|pb-chibitoon|brand-heroes-218|dash-218|fun-top3|hero-restore|ilbo-213|invest-split-ui|investment-research-ui|mascots-poster|nav-groups|owner-verification-ui|qa-210|qa-design-b4|qa-report-fixes|remote-media-219|reviewed-release-baseline|simplify-225|theme-white-215|ui-203b'
$files = Get-ChildItem scripts -File | Where-Object {
    $_.Name -notmatch $excludePattern -and (
        $_.Name -match '^(hani-chibi-pack-1.*|hani-office.*)\.test\.mjs$' -or
        $_.Name -match '^hani-(seoyun-m9|release-version-layers|save-guard.*|join-ieum|qa-easy-cleanup|newsroom-285-source|newsroom-4cut-288|life-bundle-source|street-journal.*)\.test\.(mjs|cjs)$' -or
        $_.Name -match '^hani-app-216-(audit|practical)\.test\.cjs$' -or
        $_.Name -match '(study|quiz|travel|reading).*\.test\.(mjs|cjs|js)$' -or
        $_.Name -match '^hani-history-226.*\.mjs$' -or
        $_.Name -eq 'hani-chibi-pack-2.test.mjs'
    )
} | Sort-Object Name
$rows = @()
foreach ($file in $files) {
    $logPath = Join-Path $outputDir ($file.Name + '.log')
    $testArgs = @()
    if (-not $AllowProcesses) { $testArgs += @('--require', './artifacts/chibi-pack-2/deny-process.cjs') }
    $testArgs += ('scripts/' + $file.Name)
    if ($file.Name -match '^hani-history-226') { $testArgs += '--unit-only' }
    & node @testArgs *> $logPath
    $status = $LASTEXITCODE
    $log = Get-Content -Raw -Encoding UTF8 $logPath
    $passCount = 0; $failCount = 0; $skipCount = 0
    if ($log -match '(?:# |ℹ )pass (\d+)') { $passCount = [int]$Matches[1] }
    if ($log -match '(?:# |ℹ )fail (\d+)') { $failCount = [int]$Matches[1] }
    if ($log -match '(?:# |ℹ )skipped (\d+)') { $skipCount = [int]$Matches[1] }
    $row = [pscustomobject]@{file=$file.Name;status=$status;pass=$passCount;fail=$failCount;skipped=$skipCount;processBlocked=($log -match 'TASK_(GIT|PROCESS)_BLOCKED')}
    $rows += $row
    $row | ConvertTo-Json -Compress
    ConvertTo-Json -InputObject @($rows) -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $outputDir 'results.json')
}
