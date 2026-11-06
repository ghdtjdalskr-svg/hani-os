$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$node = 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$results = @()
$tests = Get-ChildItem -LiteralPath (Join-Path $workspace 'scripts') -Filter 'hani-office-*.test.mjs' | Sort-Object Name
foreach ($test in $tests) {
    $stdout = Join-Path $PSScriptRoot ($test.BaseName + '.log')
    $stderr = Join-Path $PSScriptRoot ($test.BaseName + '.stderr.log')
    $process = Start-Process -FilePath $node -ArgumentList @('--test-reporter=tap', ('scripts/' + $test.Name)) -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
    $finished = $process.WaitForExit(60000)
    if (!$finished) { $process.Kill(); $process.WaitForExit() }
    $process.Refresh()
    $text = [IO.File]::ReadAllText($stdout)
    $err = [IO.File]::ReadAllText($stderr)
    $counts = @{}
    foreach ($kind in @('tests','pass','fail','skipped','cancelled')) {
        $match = [regex]::Match($text, '(?m)^# ' + $kind + ' (\d+)\s*$')
        $counts[$kind] = if ($match.Success) { [int]$match.Groups[1].Value } else { $null }
    }
    $row = [ordered]@{file=$test.Name; exitCode=$process.ExitCode; timedOut=(!$finished); counts=$counts; gitEperm=($err -match 'spawnSync git EPERM' -or $text -match 'spawnSync git EPERM'); failedTests=@([regex]::Matches($text,'(?m)^not ok \d+ - (.+)$') | ForEach-Object {$_.Groups[1].Value})}
    $results += [pscustomobject]$row
    Write-Output ($row | ConvertTo-Json -Compress -Depth 6)
    [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'test-results.json'), ($results | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
}
