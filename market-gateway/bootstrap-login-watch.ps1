param(
    [Parameter(Mandatory=$true)][string]$PipeName,
    [Parameter(Mandatory=$true)][string]$Commit
)
# One-time Task Scheduler side of a same-user, memory-only DPAPI ciphertext handoff.
# Neither credentials nor plaintext are accepted in task arguments or written to logs.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
$pipe=$null;$reader=$null;$writer=$null;$encrypted=@();$plain=$null
try {
    if($PipeName -cnotmatch '^hani-market-[a-f0-9]{32}$' -or $Commit -cnotmatch '^[a-f0-9]{40}$'){throw 'Invalid bootstrap identity'}
    $sourceRoot=Split-Path -Parent $PSScriptRoot
    $tracked=@('hani-market-data.js','market-gateway/verify-live-cache.ps1','market-gateway/login-watch.ps1','market-gateway/portfolio-collector.mjs','market-gateway/pc-collector.mjs','market-gateway/cache-publisher.mjs','market-gateway/server.mjs','market-gateway/session-manager.mjs','market-gateway/save-session-private.ps1')
    $pipe=[IO.Pipes.NamedPipeClientStream]::new('.',$PipeName,[IO.Pipes.PipeDirection]::InOut)
    $pipe.Connect(30000)
    $reader=[IO.BinaryReader]::new($pipe);$writer=[IO.BinaryWriter]::new($pipe)
    foreach($name in @('toss-credentials.dpapi','hani-session.dpapi')){
        $length=$reader.ReadInt32()
        if($length -lt 1 -or $length -gt 32768){throw 'Invalid encrypted credential size'}
        $bytes=$reader.ReadBytes($length)
        if($bytes.Length -ne $length){throw 'Incomplete credential transfer'}
        $plain=[Security.Cryptography.ProtectedData]::Unprotect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
        try { $parsed=[Text.Encoding]::UTF8.GetString($plain)|ConvertFrom-Json; if(-not $parsed){throw 'Invalid credential format'} }
        finally { [Array]::Clear($plain,0,$plain.Length);$plain=$null;$parsed=$null }
        $encrypted+=,[pscustomobject]@{Name=$name;Bytes=$bytes}
    }
    foreach($relative in $tracked){
        $expected=$reader.ReadBytes(32)
        if($expected.Length -ne 32){throw 'Incomplete source verification'}
        $source=Join-Path $sourceRoot $relative
        $actual=[Security.Cryptography.SHA256]::HashData([IO.File]::ReadAllBytes($source))
        if(-not [Security.Cryptography.CryptographicOperations]::FixedTimeEquals($expected,$actual)){throw 'Collector source changed'}
    }
    $privateDir=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market'
    if(Test-Path -LiteralPath $privateDir){
        $item=Get-Item -LiteralPath $privateDir -Force
        if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe private directory'}
        $acl=Get-Acl -LiteralPath $privateDir
        $allowed=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18')
        if(-not $acl.AreAccessRulesProtected){throw 'Private directory required'}
        foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])){if($rule.IdentityReference.Value -notin $allowed){throw 'Unexpected private-directory access'}}
    }else{
        $null=New-Item -ItemType Directory -Path $privateDir
        $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
        $acl=[Security.AccessControl.DirectorySecurity]::new()
        $acl.SetAccessRuleProtection($true,$false)
        $flags=[Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit'
        $propagation=[Security.AccessControl.PropagationFlags]::None
        foreach($identity in @($sid,[Security.Principal.SecurityIdentifier]'S-1-5-18')){
            $rule=[Security.AccessControl.FileSystemAccessRule]::new($identity,[Security.AccessControl.FileSystemRights]::FullControl,$flags,$propagation,[Security.AccessControl.AccessControlType]::Allow)
            $acl.AddAccessRule($rule)
        }
        Set-Acl -LiteralPath $privateDir -AclObject $acl
    }
    foreach($entry in $encrypted){
        $target=Join-Path $privateDir $entry.Name
        if(Test-Path -LiteralPath $target){
            $item=Get-Item -LiteralPath $target -Force
            if($item.Attributes -band [IO.FileAttributes]::ReparsePoint -or $item.Length -gt 32768){throw 'Unsafe existing credential'}
            if(-not [Security.Cryptography.CryptographicOperations]::FixedTimeEquals([Security.Cryptography.SHA256]::HashData([IO.File]::ReadAllBytes($target)),[Security.Cryptography.SHA256]::HashData($entry.Bytes))){throw 'Existing credential differs'}
        }
    }
    foreach($entry in $encrypted){
        $target=Join-Path $privateDir $entry.Name
        if(-not (Test-Path -LiteralPath $target)){[IO.File]::WriteAllBytes($target,$entry.Bytes)}
    }
    $runtimeRoot=Join-Path $privateDir ('runtime-'+$Commit.Substring(0,12))
    if(Test-Path -LiteralPath $runtimeRoot){
        if((Get-Item -LiteralPath $runtimeRoot -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe runtime directory'}
    }else{$null=New-Item -ItemType Directory -Path $runtimeRoot}
    $gatewayDir=Join-Path $runtimeRoot 'market-gateway'
    if(-not (Test-Path -LiteralPath $gatewayDir)){$null=New-Item -ItemType Directory -Path $gatewayDir}
    foreach($relative in $tracked){
        $source=Join-Path $sourceRoot $relative;$target=Join-Path $runtimeRoot $relative
        if(Test-Path -LiteralPath $target){
            if((Get-Item -LiteralPath $target -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Unsafe runtime file'}
        }else{Copy-Item -LiteralPath $source -Destination $target -ErrorAction Stop}
        if((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash){throw 'Runtime copy differs'}
    }
    $writer.Write([byte]1);$writer.Flush()
    exit 0
}catch{
    if($writer){try{$writer.Write([byte]0);$writer.Flush()}catch{}}
    exit 1
}finally{
    if($plain){[Array]::Clear($plain,0,$plain.Length)}
    foreach($entry in $encrypted){[Array]::Clear($entry.Bytes,0,$entry.Bytes.Length)}
    if($reader){$reader.Dispose()};if($writer){$writer.Dispose()};if($pipe){$pipe.Dispose()}
}
