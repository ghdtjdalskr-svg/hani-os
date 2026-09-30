param([switch]$StartNow)
# Installs only the approved, current-user, login-triggered price watcher.
# Charts remain explicit one-shot operations; this task never seeds or deletes them.
$ErrorActionPreference='Stop'
$taskName='HANI Market Price Watch'
$privateDir=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market'
$directory=Get-Item -LiteralPath $privateDir -Force
if($directory.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe private directory'}
$acl=Get-Acl -LiteralPath $privateDir
if(-not $acl.AreAccessRulesProtected){throw 'Private directory required'}
$allowed=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18')
foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
    if($rule.IdentityReference.Value -notin $allowed){throw 'Unexpected private-directory access'}
}
foreach($name in @('toss-credentials.dpapi','hani-session.dpapi')){
    $item=Get-Item -LiteralPath (Join-Path $privateDir $name) -Force
    if($item.Attributes -band [IO.FileAttributes]::ReparsePoint -or $item.Length -gt 32768){throw 'Invalid encrypted credential file'}
}
$repository=Split-Path -Parent $PSScriptRoot
$commit=(& git -C $repository rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0 -or $commit -notmatch '^[a-f0-9]{40}$'){throw 'Committed source required'}
$tracked=@('hani-market-data.js','market-gateway/verify-live-cache.ps1','market-gateway/login-watch.ps1','market-gateway/portfolio-collector.mjs','market-gateway/pc-collector.mjs','market-gateway/cache-publisher.mjs','market-gateway/server.mjs','market-gateway/session-manager.mjs','market-gateway/save-session-private.ps1')
$dirty=@(& git -C $repository status --porcelain -- $tracked)
if($LASTEXITCODE -ne 0 -or $dirty.Count){throw 'Collector source has uncommitted changes'}
$nodePath=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs/nodejs/node.exe'
if(-not [IO.File]::Exists($nodePath)){throw 'Stable Node installation not found'}
$powershell=(Get-Process -Id $PID).Path
if(-not [IO.File]::Exists($powershell) -or [IO.Path]::GetFileName($powershell) -ne 'pwsh.exe'){throw 'PowerShell 7 required'}
$user=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$existing=Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if($existing){throw 'A market watch task already exists; inspect it before replacing'}
$runtimeRoot=Join-Path $privateDir ('runtime-'+$commit.Substring(0,12))
if(Test-Path -LiteralPath $runtimeRoot){throw 'Runtime directory already exists; inspect before retrying'}
$null=New-Item -ItemType Directory -Path $runtimeRoot
$null=New-Item -ItemType Directory -Path (Join-Path $runtimeRoot 'market-gateway')
foreach($relative in $tracked){
    $source=Join-Path $repository $relative
    $target=Join-Path $runtimeRoot $relative
    Copy-Item -LiteralPath $source -Destination $target -ErrorAction Stop
    if((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash){throw 'Runtime copy verification failed'}
}
$entry=Join-Path $runtimeRoot 'market-gateway/login-watch.ps1'
$arguments='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+$entry+'" -NodePath "'+$nodePath+'"'
$action=New-ScheduledTaskAction -Execute $powershell -Argument $arguments
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $user
$trigger.Delay='PT1M'
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$task=New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings
$null=Register-ScheduledTask -TaskName $taskName -InputObject $task -ErrorAction Stop
$installed=Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
$taskSid=([Security.Principal.NTAccount]$installed.Principal.UserId).Translate([Security.Principal.SecurityIdentifier]).Value
if($installed.Actions.Execute -ne $powershell -or $installed.Actions.Arguments -notlike ('*'+$entry+'*') -or $taskSid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value){throw 'Scheduled task read-back failed'}
if($StartNow){Start-ScheduledTask -TaskName $taskName -ErrorAction Stop}
[pscustomobject]@{installed=$true;taskName=$taskName;trigger='current-user logon + 1 minute';startedNow=[bool]$StartNow;runtimeCommit=$commit;chartRefresh='manual only'} | ConvertTo-Json -Compress
