$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$node = 'C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$output = Join-Path $PSScriptRoot 'final-tests'
$null = New-Item -ItemType Directory -Path $output -Force
$identity = @{js=(Get-FileHash -Algorithm SHA256 (Join-Path $workspace 'hani-office-live.js')).Hash; css=(Get-FileHash -Algorithm SHA256 (Join-Path $workspace 'hani-office-live.css')).Hash}
$tests = @(Get-ChildItem -LiteralPath (Join-Path $workspace 'scripts') -Filter 'hani-office-*.test.mjs' | Sort-Object Name)
$running = [Collections.Generic.List[object]]::new()
$results = [Collections.Generic.List[object]]::new()
$next = 0
while ($next -lt $tests.Count -or $running.Count) {
    while ($next -lt $tests.Count -and $running.Count -lt 3) {
        $test = $tests[$next++]
        $stdout = Join-Path $output ($test.BaseName + '.log')
        $stderr = Join-Path $output ($test.BaseName + '.stderr.log')
        $process = Start-Process -FilePath $node -ArgumentList @('--test-reporter=tap', ('scripts/' + $test.Name)) -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
        $null = $process.Handle
        $running.Add(@{process=$process; file=$test.Name; stdout=$stdout; stderr=$stderr; watch=[Diagnostics.Stopwatch]::StartNew()})
    }
    foreach ($job in @($running.ToArray())) {
        $timeout = $job.watch.Elapsed.TotalSeconds -gt 300
        if (!$job.process.HasExited -and !$timeout) { continue }
        if (!$job.process.HasExited) { $job.process.Kill() }
        $job.process.WaitForExit()
        $text = [IO.File]::ReadAllText($job.stdout)
        $err = [IO.File]::ReadAllText($job.stderr)
        $counts = @{}
        foreach ($kind in @('tests','pass','fail','skipped','cancelled')) {
            $match = [regex]::Match($text, '(?m)^# ' + $kind + ' (\d+)\s*$')
            $counts[$kind] = if ($match.Success) { [int]$match.Groups[1].Value } else { $null }
        }
        $row = [ordered]@{file=$job.file; exitCode=$job.process.ExitCode; timedOut=$timeout; counts=$counts; gitEperm=($err -match 'spawnSync git EPERM' -or $text -match 'spawnSync git EPERM'); failedTests=@([regex]::Matches($text,'(?m)^not ok \d+ - (.+)$') | ForEach-Object {$_.Groups[1].Value})}
        $results.Add([pscustomobject]$row)
        Write-Output ($row | ConvertTo-Json -Compress -Depth 6)
        $null = $running.Remove($job)
        [IO.File]::WriteAllText((Join-Path $output 'results.json'), (@{identity=$identity; results=$results.ToArray()} | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
    }
    if ($running.Count) { $null = $running[0].process.WaitForExit(250) }
}
if ((Get-FileHash -Algorithm SHA256 (Join-Path $workspace 'hani-office-live.js')).Hash -ne $identity.js -or (Get-FileHash -Algorithm SHA256 (Join-Path $workspace 'hani-office-live.css')).Hash -ne $identity.css) { throw 'Source identity changed during final tests' }
