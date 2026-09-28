# Internal collector child only. JSON stdin, no credentials in stdout/argv/environment.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
$temp=$null;$plain=$null;$bytes=$null
try {
    $raw=[Console]::In.ReadToEnd();if($raw.Length -gt 32768){throw 'Oversized input'};$inputData=$raw|ConvertFrom-Json;$raw=$null
    $s=$inputData.session
    if($s.version -ne 1 -or $s.userId -ne 'e1c08077-6c94-4652-b017-3760f42aa1ad' -or -not $s.access_token -or -not $s.refresh_token -or $s.expires_at -lt [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()){throw 'Invalid session'}
    $dir=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market'
    $path=Join-Path $dir 'hani-session.dpapi'
    foreach($target in @($dir,$path)){if((Get-Item -LiteralPath $target -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe path'}}
    $acl=Get-Acl -LiteralPath $dir;$allowed=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18')
    if(-not $acl.AreAccessRulesProtected){throw 'Private directory required'}
    foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){if($rule.IdentityReference.Value -notin $allowed){throw 'Unexpected access'}}
    $plain=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
    $previous=[Text.Encoding]::UTF8.GetString($plain)|ConvertFrom-Json
    if($previous.refresh_token -cne $inputData.previousRefreshToken){throw 'Session changed by another process'}
    $safe=@{version=1;userId=$s.userId;access_token=$s.access_token;refresh_token=$s.refresh_token;expires_at=$s.expires_at}
    $bytes=[Text.Encoding]::UTF8.GetBytes(($safe|ConvertTo-Json -Compress))
    $cipher=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
    $temp=Join-Path $dir ('session-'+[Guid]::NewGuid().ToString('N')+'.tmp')
    $file=[IO.File]::Open($temp,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try{$file.Write($cipher,0,$cipher.Length);$file.Flush($true)}finally{$file.Dispose()}
    # PowerShell converts $null to an empty string for this .NET string parameter.
    # A typed null means no backup path; keep the encrypted atomic replacement.
    [IO.File]::Replace($temp,$path,[NullString]::Value);$temp=$null
    Write-Output 'OK'
}catch{Write-Output 'FAILED';exit 1}
finally{if($plain){[Array]::Clear($plain,0,$plain.Length)};if($bytes){[Array]::Clear($bytes,0,$bytes.Length)};if($temp -and [IO.File]::Exists($temp)){[IO.File]::Delete($temp)};$s=$null;$inputData=$null;$previous=$null;$safe=$null}
