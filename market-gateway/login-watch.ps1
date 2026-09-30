param([Parameter(Mandatory=$true)][string]$NodePath)
# Task Scheduler entry point. It inherits the signed-in user's DPAPI scope.
$ErrorActionPreference='Stop'
if(-not [IO.File]::Exists($NodePath)){throw 'Node runtime unavailable; market watch not started'}
$runtime=Join-Path $PSScriptRoot 'verify-live-cache.ps1'
if(-not [IO.File]::Exists($runtime)){throw 'Market collector unavailable'}
$env:PATH=([IO.Path]::GetDirectoryName($NodePath)+';'+$env:PATH)
& $runtime -Portfolio -Watch
exit $LASTEXITCODE
