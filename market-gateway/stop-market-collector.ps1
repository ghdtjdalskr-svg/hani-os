# Stop only the validated dedicated child; launcher observes exit and releases its lock.
$ErrorActionPreference='Stop'
try {
    $path=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market/collector-status.json'
    $status=Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
    if(-not $status.running){Write-Output 'Already stopped';exit 0}
    $launcher=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$status.launcherPid)
    $child=Get-CimInstance Win32_Process -Filter ('ProcessId='+[int]$status.childPid)
    $expected=Join-Path $PSScriptRoot 'verify-live-cache.ps1'
    if(-not $launcher -or $launcher.Name -ne 'pwsh.exe' -or -not $launcher.CommandLine.Replace('/','\').Contains($expected.Replace('/','\')) -or $launcher.CommandLine -notmatch '-Portfolio.*-Watch'){throw 'Launcher identity mismatch'}
    if(-not $child -or $child.Name -ne 'node.exe' -or $child.ParentProcessId -ne $launcher.ProcessId -or -not $child.CommandLine.Replace('/','\').Contains((Join-Path $PSScriptRoot 'portfolio-collector.mjs').Replace('/','\'))){throw 'Child identity mismatch'}
    Stop-Process -Id $child.ProcessId
    Write-Output 'Collector stopped; encrypted credentials and cached prices retained.'
}catch{Write-Output 'Unable to verify collector process; nothing else stopped.';exit 1}
