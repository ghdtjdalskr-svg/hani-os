param([switch]$SelfTest)
# Run with PowerShell 7 on Windows. No network, logging, clipboard reads or command-line secrets.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData

function Protect-TossInput([string]$ClientId, [string]$ClientSecret) {
    if ([string]::IsNullOrWhiteSpace($ClientId) -or [string]::IsNullOrWhiteSpace($ClientSecret) -or
        $ClientId.Length -gt 4096 -or $ClientSecret.Length -gt 4096 -or
        $ClientId -match '\s' -or $ClientSecret -match '\s') { throw 'Invalid credential format' }
    $payload = @{version=1; clientId=$ClientId; clientSecret=$ClientSecret} | ConvertTo-Json -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    try { return ,([Security.Cryptography.ProtectedData]::Protect($bytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)) }
    finally { [Array]::Clear($bytes,0,$bytes.Length); $payload=$null }
}

function Save-TossInput([byte[]]$Cipher, [string]$TestDirectory='') {
    $base = [Environment]::GetFolderPath('LocalApplicationData')
    if (-not [IO.Path]::IsPathFullyQualified($base)) { throw 'Invalid private directory' }
    $directory = Join-Path $base 'HANI_OS_Market'
    if ($TestDirectory) {
        if (-not $SelfTest -or -not [IO.Path]::IsPathFullyQualified($TestDirectory)) { throw 'Test directory not allowed' }
        $directory=$TestDirectory
    }
    $path = Join-Path $directory 'toss-credentials.dpapi'
    if (Test-Path -LiteralPath $directory) {
        $item=Get-Item -LiteralPath $directory -Force
        if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unsafe private directory' }
    } else { $null=New-Item -ItemType Directory -Path $directory }
    # Dedicated directory only: current user + SYSTEM, no inherited access for other users.
    $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl=[Security.AccessControl.DirectorySecurity]::new()
    $acl.SetOwner($sid)
    $acl.SetAccessRuleProtection($true,$false)
    foreach ($principal in @($sid,[Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
        $rule=[Security.AccessControl.FileSystemAccessRule]::new($principal,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $directory -AclObject $acl
    # CreateNew fails if any previous credential exists; never replace a working key silently.
    $stream=[IO.File]::Open($path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $stream.Write($Cipher,0,$Cipher.Length); $stream.Flush($true) } finally { $stream.Dispose() }
    $saved=[IO.File]::ReadAllBytes($path)
    if ([Convert]::ToBase64String($saved) -cne [Convert]::ToBase64String($Cipher)) { throw 'Encrypted write verification failed' }
}

$form=[Windows.Forms.Form]::new()
$form.Text='HANI OS - Toss API 보안 입력'
$form.ClientSize=[Drawing.Size]::new(540,315)
$form.StartPosition='CenterScreen'
$form.FormBorderStyle='FixedDialog'
$form.MaximizeBox=$false
$form.Font=[Drawing.Font]::new('맑은 고딕',10)
$note=[Windows.Forms.Label]::new()
$note.SetBounds(20,15,500,60)
$note.Text="발급받은 두 값을 이 창에만 붙여넣으세요.`n현재 Windows 계정으로 암호화해 PC에 저장합니다.`n이 단계에서는 외부 전송·토스 연결·자동 실행을 하지 않습니다."
$form.Controls.Add($note)
$fields=@()
foreach ($entry in @(@('Client ID',90),@('Client Secret',155))) {
    $label=[Windows.Forms.Label]::new(); $label.Text=$entry[0]; $label.SetBounds(20,$entry[1],120,25); $form.Controls.Add($label)
    $box=[Windows.Forms.TextBox]::new(); $box.SetBounds(145,$entry[1],365,28); $box.UseSystemPasswordChar=$true; $box.MaxLength=4096
    $form.Controls.Add($box); $fields+=,$box
}
$status=[Windows.Forms.Label]::new(); $status.SetBounds(20,200,490,45); $status.Text='키 값이 포함된 화면을 캡처하거나 채팅으로 보내지 마세요.'; $form.Controls.Add($status)
$save=[Windows.Forms.Button]::new(); $save.Text='암호화 저장'; $save.SetBounds(270,260,120,35); $form.Controls.Add($save)
$cancel=[Windows.Forms.Button]::new(); $cancel.Text='취소'; $cancel.SetBounds(400,260,110,35); $cancel.DialogResult='Cancel'; $form.Controls.Add($cancel)
$form.CancelButton=$cancel
$save.Add_Click({
    $save.Enabled=$false
    try {
        $cipher=Protect-TossInput $fields[0].Text.Trim() $fields[1].Text.Trim()
        Save-TossInput $cipher
        foreach($field in $fields) { $field.Clear(); $field.Enabled=$false }
        $status.Text='암호화 저장 완료. 채팅에는 저장 완료라고만 알려주세요.'
        $cancel.Text='닫기'
    } catch {
        # Never include exception details, input text or upstream credentials in output.
        $status.Text='저장하지 못했습니다. 입력값 또는 기존 키 파일 여부를 확인해주세요.'
        $save.Enabled=$true
    }
})
try {
    if ($SelfTest) {
        $encrypted=Protect-TossInput 'synthetic-id' 'synthetic-secret'
        $plain=[Security.Cryptography.ProtectedData]::Unprotect($encrypted,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
        try {
            $decoded=[Text.Encoding]::UTF8.GetString($plain) | ConvertFrom-Json
            if ($decoded.clientId -cne 'synthetic-id' -or $decoded.clientSecret -cne 'synthetic-secret') { throw 'DPAPI round trip failed' }
            if ([Text.Encoding]::UTF8.GetString($encrypted).Contains('synthetic-secret')) { throw 'Plaintext found' }
        } finally { [Array]::Clear($plain,0,$plain.Length); $decoded=$null }
        $denied=$false; try { $null=Protect-TossInput '' 'synthetic-secret' } catch { $denied=$true }
        if (-not $denied -or -not $fields[0].UseSystemPasswordChar -or -not $fields[1].UseSystemPasswordChar) { throw 'Input protection failed' }
        $testDir=Join-Path ([IO.Path]::GetTempPath()) ('hani-market-credential-test-'+[Guid]::NewGuid().ToString('N'))
        try {
            Save-TossInput $encrypted $testDir
            $testFile=Join-Path $testDir 'toss-credentials.dpapi'
            $savedAcl=Get-Acl -LiteralPath $testDir
            if (-not $savedAcl.AreAccessRulesProtected) { throw 'Directory ACL not protected' }
            $allowed=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18')
            foreach($rule in $savedAcl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])) {
                if ($rule.IdentityReference.Value -notin $allowed) { throw 'Unexpected directory access' }
            }
            $blocked=$false; try { Save-TossInput $encrypted $testDir } catch { $blocked=$true }
            if (-not $blocked) { throw 'Existing key overwrite allowed' }
            $saved=[IO.File]::ReadAllBytes($testFile)
            if ([Convert]::ToBase64String($saved) -cne [Convert]::ToBase64String($encrypted)) { throw 'Saved key changed' }
        } finally {
            # Only the unique synthetic test file and its empty directory are removed, never recursively.
            if ($testFile -and [IO.File]::Exists($testFile)) { [IO.File]::Delete($testFile) }
            if ([IO.Directory]::Exists($testDir)) { [IO.Directory]::Delete($testDir,$false) }
        }
        Write-Output 'PASS: DPAPI round-trip, masked fields, invalid input, encrypted write/read, private ACL, overwrite rejected. Synthetic temporary file removed.'
    } else { $null=$form.ShowDialog() }
} finally { foreach($field in $fields) { $field.Clear() }; $form.Dispose() }
