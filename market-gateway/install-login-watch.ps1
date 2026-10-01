param([switch]$StartNow)
# Transfer only DPAPI ciphertext over a current-user named pipe into the real
# Task Scheduler filesystem view, then register the approved login watcher.
$ErrorActionPreference='Stop'
$taskName='HANI Market Price Watch'
$privateDir=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market'
$directory=Get-Item -LiteralPath $privateDir -Force
if($directory.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe private directory'}
$acl=Get-Acl -LiteralPath $privateDir
if(-not $acl.AreAccessRulesProtected){throw 'Private directory required'}
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){
    if($rule.IdentityReference.Value -notin @($sid,'S-1-5-18')){throw 'Unexpected private-directory access'}
}
$credentialPaths=@('toss-credentials.dpapi','hani-session.dpapi')|ForEach-Object {Join-Path $privateDir $_}
foreach($path in $credentialPaths){
    $item=Get-Item -LiteralPath $path -Force
    if($item.Attributes -band [IO.FileAttributes]::ReparsePoint -or $item.Length -lt 1 -or $item.Length -gt 32768){throw 'Invalid encrypted credential file'}
}
$repository=Split-Path -Parent $PSScriptRoot
$commit=(& git -C $repository rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0 -or $commit -notmatch '^[a-f0-9]{40}$'){throw 'Committed source required'}
$runtimeFiles=@('hani-market-data.js','market-gateway/verify-live-cache.ps1','market-gateway/login-watch.ps1','market-gateway/portfolio-collector.mjs','market-gateway/pc-collector.mjs','market-gateway/cache-publisher.mjs','market-gateway/server.mjs','market-gateway/session-manager.mjs','market-gateway/save-session-private.ps1')
$tracked=$runtimeFiles+@('market-gateway/bootstrap-login-watch.ps1','market-gateway/install-login-watch.ps1')
if(@(& git -C $repository status --porcelain -- $tracked).Count){throw 'Collector source has uncommitted changes'}
$nodePath=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Programs/nodejs/node.exe'
if(-not [IO.File]::Exists($nodePath)){throw 'Stable Node installation not found'}
$powershell=(Get-Process -Id $PID).Path
if(-not [IO.File]::Exists($powershell) -or [IO.Path]::GetFileName($powershell) -ne 'pwsh.exe'){throw 'PowerShell 7 required'}
$user=[Security.Principal.WindowsIdentity]::GetCurrent().Name
if(Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue){throw 'Market watch task already exists; inspect before replacing'}
$pipeName='hani-market-'+[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(16)).ToLowerInvariant()
$bootstrapName='HANI Market Bootstrap '+$pipeName.Substring(12,8)
$pipeOptions=[IO.Pipes.PipeOptions]([int][IO.Pipes.PipeOptions]::Asynchronous -bor [int][IO.Pipes.PipeOptions]::CurrentUserOnly)
$pipe=[IO.Pipes.NamedPipeServerStream]::new($pipeName,[IO.Pipes.PipeDirection]::InOut,1,[IO.Pipes.PipeTransmissionMode]::Byte,$pipeOptions)
$writer=$null;$bootstrapRegistered=$false;$watchRegistered=$false;$ciphertexts=@()
try {
    $bootstrap=Join-Path $PSScriptRoot 'bootstrap-login-watch.ps1'
    $bootstrapArgs='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+$bootstrap+'" -PipeName "'+$pipeName+'" -Commit "'+$commit+'"'
    $bootstrapAction=New-ScheduledTaskAction -Execute $powershell -Argument $bootstrapArgs
    $principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
    $null=Register-ScheduledTask -TaskName $bootstrapName -Action $bootstrapAction -Principal $principal -ErrorAction Stop
    $bootstrapRegistered=$true
    Start-ScheduledTask -TaskName $bootstrapName -ErrorAction Stop
    $connection=$pipe.WaitForConnectionAsync()
    if(-not $connection.Wait(45000)){throw 'Bootstrap did not connect'}
    $connection.GetAwaiter().GetResult()
    $writer=[IO.BinaryWriter]::new($pipe)
    foreach($path in $credentialPaths){
        $bytes=[IO.File]::ReadAllBytes($path)
        if($bytes.Length -lt 1 -or $bytes.Length -gt 32768){throw 'Encrypted credential changed'}
        $ciphertexts+=,$bytes
        $writer.Write([int]$bytes.Length);$writer.Write($bytes)
    }
    foreach($relative in $runtimeFiles){
        $source=Join-Path $repository $relative
        $writer.Write([Security.Cryptography.SHA256]::HashData([IO.File]::ReadAllBytes($source)))
    }
    $writer.Flush()
    $reply=[byte[]]::new(1)
    $read=$pipe.ReadAsync($reply,0,1)
    if(-not $read.Wait(60000) -or $read.GetAwaiter().GetResult() -ne 1 -or $reply[0] -ne 1){throw 'Bootstrap verification failed'}
    $result=Get-ScheduledTaskInfo -TaskName $bootstrapName -ErrorAction Stop
    if($result.LastTaskResult -notin @(0,267009)){throw 'Bootstrap task failed'}
}finally{
    foreach($bytes in $ciphertexts){[Array]::Clear($bytes,0,$bytes.Length)}
    if($writer){$writer.Dispose()};$pipe.Dispose()
    if($bootstrapRegistered){Unregister-ScheduledTask -TaskName $bootstrapName -Confirm:$false -ErrorAction SilentlyContinue}
}
$runtimeRoot=Join-Path $privateDir ('runtime-'+$commit.Substring(0,12))
$entry=Join-Path $runtimeRoot 'market-gateway/login-watch.ps1'
$arguments='-NoProfile -NonInteractive -WindowStyle Hidden -File "'+$entry+'" -NodePath "'+$nodePath+'"'
$action=New-ScheduledTaskAction -Execute $powershell -Argument $arguments
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $user
$trigger.Delay='PT1M'
$principal=New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
try {
    $task=New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings
    $null=Register-ScheduledTask -TaskName $taskName -InputObject $task -ErrorAction Stop
    $watchRegistered=$true
    $installed=Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    $taskSid=([Security.Principal.NTAccount]$installed.Principal.UserId).Translate([Security.Principal.SecurityIdentifier]).Value
    if($installed.Actions.Execute -ne $powershell -or $installed.Actions.Arguments -notlike ('*'+$entry+'*') -or $taskSid -ne $sid){throw 'Scheduled task read-back failed'}
    if($StartNow){Start-ScheduledTask -TaskName $taskName -ErrorAction Stop}
    [pscustomobject]@{installed=$true;taskName=$taskName;trigger='current-user logon + 1 minute';startedNow=[bool]$StartNow;runtimeCommit=$commit;chartRefresh='manual only'}|ConvertTo-Json -Compress
}catch{
    if($watchRegistered){Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue}
    throw
}
