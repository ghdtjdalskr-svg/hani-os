param([switch]$Portfolio,[switch]$Watch,[switch]$SeedCharts,[switch]$RefreshCharts,[switch]$Diagnose,[switch]$BrowserCheck,[switch]$Catalog,[switch]$Preview,[switch]$SdkBrowserCheck)
# Decrypt only in memory and send to the child through stdin. No secret command-line arguments.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
$child=$null; $payload=$null; $inputData=$null; $lock=$null; $stage='private-directory'
try {
    if($SdkBrowserCheck){if($Portfolio -or $Watch -or $SeedCharts -or $Diagnose -or $Catalog -or $Preview){throw 'SDK check is read-only standalone'};$BrowserCheck=$true}
    if($Watch -and -not $Portfolio){throw 'Watch requires portfolio mode'}
    if($Preview -and ($Portfolio -or $Watch -or $SeedCharts -or $Diagnose -or $BrowserCheck -or $Catalog)){throw 'Preview is read-only standalone'}
    if($Catalog -and ($Portfolio -or $Watch -or $SeedCharts -or $Diagnose -or $BrowserCheck)){throw 'Catalog requires standalone mode'}
    if($BrowserCheck -and ($Portfolio -or $Watch -or $SeedCharts -or $Diagnose)){throw 'Browser check is read-only and standalone'}
    if($Diagnose -and (-not $Portfolio -or $Watch -or $SeedCharts)){throw 'Diagnostic requires one-shot portfolio mode'}
    if($SeedCharts -and (-not $Portfolio -or $Watch)){throw 'Chart seed requires one-shot portfolio mode'}
    if($RefreshCharts -and (-not $Portfolio -or $Watch -or $SeedCharts -or $Diagnose)){throw 'Chart refresh requires standalone one-shot portfolio mode'}
    $dir=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market'
    $directory=Get-Item -LiteralPath $dir -Force
    if($directory.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe directory'}
    $acl=Get-Acl -LiteralPath $dir
    if(-not $acl.AreAccessRulesProtected){throw 'Private directory required'}
    $allowed=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18')
    foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){if($rule.IdentityReference.Value -notin $allowed){throw 'Unexpected access'}}
    $stage='collector-lock'
    $lockPath=Join-Path $dir 'collector.lock'
    if((Test-Path -LiteralPath $lockPath) -and ((Get-Item -LiteralPath $lockPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unsafe lock'}
    if(-not $Preview -and -not $SdkBrowserCheck){$lock=[IO.File]::Open($lockPath,[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)}
    $inputData=@{}
    foreach($entry in @(@('toss','toss-credentials.dpapi'),@('session','hani-session.dpapi'))){
        if(($BrowserCheck -or $Preview) -and $entry[0] -eq 'toss'){continue}
        $stage='decrypt-'+$entry[0]
        $path=Join-Path $dir $entry[1];$item=Get-Item -LiteralPath $path -Force
        if($item.Length -gt 32768 -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Invalid encrypted file'}
        $plain=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
        try{$inputData[$entry[0]]=[Text.Encoding]::UTF8.GetString($plain)|ConvertFrom-Json}finally{[Array]::Clear($plain,0,$plain.Length)}
    }
    $payload=$inputData | ConvertTo-Json -Compress -Depth 5
    $stage='start-node'
    $node=Get-Command node -CommandType Application | Select-Object -First 1
    $start=[Diagnostics.ProcessStartInfo]::new();$start.FileName=$node.Source
    $start.WorkingDirectory=$PSScriptRoot
    $scriptName=if($Portfolio){'portfolio-collector.mjs'}else{'verify-live-cache.mjs'}
    if($BrowserCheck){$scriptName='../scripts/hani-market-live-browser.cjs'}
    if($Catalog){$scriptName='catalog-runner.mjs'}
    if($Preview){$scriptName='../scripts/hani-market-interactive-preview.cjs'}
    $start.ArgumentList.Add((Join-Path $PSScriptRoot $scriptName))
    if($SdkBrowserCheck){$start.ArgumentList.Add('--sdk')}
    if($Watch){$start.ArgumentList.Add('--watch')}
    if($SeedCharts){$start.ArgumentList.Add('--seed-charts')}
    if($RefreshCharts){$start.ArgumentList.Add('--refresh-charts')}
    if($Diagnose){$start.ArgumentList.Add('--diagnose')}
    $start.Environment['HANI_MARKET_PWSH']=(Get-Process -Id $PID).Path
    $start.UseShellExecute=$false;$start.CreateNoWindow=$true;$start.RedirectStandardInput=$true;$start.RedirectStandardOutput=$true;$start.RedirectStandardError=$true
    $child=[Diagnostics.Process]::new();$child.StartInfo=$start;$null=$child.Start()
    $stage='child-pipe'
    $errTask=$child.StandardError.ReadToEndAsync()
    if(-not $Watch -and -not $Preview){$outTask=$child.StandardOutput.ReadToEndAsync()}
    $child.StandardInput.Write($payload);$child.StandardInput.Close();$payload=$null;$inputData=$null
    if($Preview){
        $ready=$child.StandardOutput.ReadLineAsync();if(-not $ready.Wait(90000)){throw 'Preview timeout'}
        $result=$ready.Result|ConvertFrom-Json
        if(-not $result.success -or $result.previewUrl -notmatch '^http://127[.]0[.]0[.]1:[0-9]+/[a-f0-9]{48}/$'){throw 'Preview failed'}
        [pscustomobject]@{success=$true;previewUrl=$result.previewUrl;holdingCount=[int]$result.symbols}|ConvertTo-Json -Compress
        $child.WaitForExit();exit $child.ExitCode
    }
    if($Watch){
        $statusPath=Join-Path $dir 'collector-status.json'
        if((Test-Path -LiteralPath $statusPath) -and ((Get-Item -LiteralPath $statusPath -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Unsafe status path'}
        while($null -ne ($line=$child.StandardOutput.ReadLine())){
            if($line.Length -gt 2048){throw 'Oversized collector status'}
            $event=$line|ConvertFrom-Json
            $status=@{running=$true;launcherPid=$PID;childPid=$child.Id;checkedAt=[DateTimeOffset]::UtcNow.ToString('o');success=($event.success -eq $true);published=($event.published -eq $true);skipped=($event.skipped -eq $true)}
            if($event.success){$status.symbols=[int]$event.symbols;$status.unresolved=[int]$event.unresolved;$status.bytes=[int]$event.bytes}
            elseif($event.stage -in @('session','holding-codes','collect-publish','read-back','private-input')){$status.stage=$event.stage}
            if($event.reason -in @('login-required','refresh-rejected','session-save-failed','owner-mismatch','invalid-session','invalid-refresh-response','operation-failed','no-supported-codes','regressed-quotes','incomplete-quotes','market-source-failed')){$status.reason=$event.reason}
            [IO.File]::WriteAllText($statusPath,($status|ConvertTo-Json -Compress))
        }
        $child.WaitForExit();if(-not $status){$status=@{}}
        $status.running=$false;$status.checkedAt=[DateTimeOffset]::UtcNow.ToString('o');$status.exitCode=$child.ExitCode
        [IO.File]::WriteAllText($statusPath,($status|ConvertTo-Json -Compress))
        exit $child.ExitCode
    }
    if(-not $child.WaitForExit(90000)){$child.Kill();throw 'Diagnostic timeout'}
    $stage='sanitized-result'
    # Child output is a fixed sanitized schema; never forward stderr or an unknown response.
    $result=$outTask.GetAwaiter().GetResult() | ConvertFrom-Json
    $allowedFields=@('success','stage','published','httpStatus','failureStage','readBack','anonymousDenied','symbols','bytes','collectedAt','quoteTimes','skipped','unresolved','holdingCount','reason','chartCount','chartBytes')
    if($Diagnose){$allowedFields+='exceptions'}
    if(@($result.PSObject.Properties.Name | Where-Object {$_ -notin $allowedFields}).Count){throw 'Unexpected output'}
    $result | ConvertTo-Json -Compress -Depth 4
    exit $child.ExitCode
}catch{[pscustomobject]@{success=$false;stage=$stage;errorType=$_.Exception.GetType().Name} | ConvertTo-Json -Compress;exit 1}
finally{$payload=$null;$inputData=$null;if($child){if(-not $child.HasExited){$child.Kill()};$child.Dispose()};if($lock){$lock.Dispose()}}
