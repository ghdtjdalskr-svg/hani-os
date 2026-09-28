param([switch]$SelfTest)
$ErrorActionPreference='Stop'
$VerbosePreference='SilentlyContinue'; $DebugPreference='SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
$projectUrl='https://qmgikfdwjzmhkwadycxk.supabase.co'
$publicKey='sb_publishable_Z0YkkRSJIo5hs00YNcMOdQ__PA5BAj5'
$ownerId='e1c08077-6c94-4652-b017-3760f42aa1ad'

function Assert-OwnerSession($Session,$User) {
    if ($User.id -ne $ownerId -or $User.is_anonymous -ne $false -or
        $Session.user.id -ne $ownerId -or -not $Session.access_token -or -not $Session.refresh_token -or
        [double]$Session.expires_in -le 60) { throw 'Owner session validation failed' }
}
function Protect-OwnerSession($Session) {
    $safe=@{version=1; userId=$ownerId; access_token=$Session.access_token; refresh_token=$Session.refresh_token;
        expires_at=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()+[long]$Session.expires_in}
    $plain=[Text.Encoding]::UTF8.GetBytes(($safe | ConvertTo-Json -Compress))
    try { return ,([Security.Cryptography.ProtectedData]::Protect($plain,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)) }
    finally { [Array]::Clear($plain,0,$plain.Length); $safe=$null }
}
function Save-OwnerSession([byte[]]$Encrypted) {
    $dir=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market'
    $item=Get-Item -LiteralPath $dir -Force
    if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unsafe session directory' }
    $acl=Get-Acl -LiteralPath $dir
    if (-not $acl.AreAccessRulesProtected) { throw 'Private directory required' }
    $allowed=@([Security.Principal.WindowsIdentity]::GetCurrent().User.Value,'S-1-5-18')
    foreach($rule in $acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])) {
        if ($rule.IdentityReference.Value -notin $allowed) { throw 'Unexpected directory access' }
    }
    $path=Join-Path $dir 'hani-session.dpapi'
    $stream=[IO.File]::Open($path,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    try { $stream.Write($Encrypted,0,$Encrypted.Length); $stream.Flush($true) } finally { $stream.Dispose() }
    if ([Convert]::ToBase64String([IO.File]::ReadAllBytes($path)) -cne [Convert]::ToBase64String($Encrypted)) { throw 'Session write verification failed' }
}
function Connect-Owner([string]$Email,[string]$Password) {
    if ([string]::IsNullOrWhiteSpace($Email) -or [string]::IsNullOrEmpty($Password)) { throw 'Enter login fields' }
    $handler=[Net.Http.HttpClientHandler]::new(); $handler.AllowAutoRedirect=$false
    $http=[Net.Http.HttpClient]::new($handler); $http.Timeout=[TimeSpan]::FromSeconds(15)
    $http.DefaultRequestHeaders.Add('apikey',$publicKey)
    $response=$null; $content=$null; $session=$null; $user=$null
    try {
        $content=[Net.Http.StringContent]::new((@{email=$Email;password=$Password} | ConvertTo-Json -Compress),[Text.Encoding]::UTF8,'application/json')
        $response=$http.PostAsync($projectUrl+'/auth/v1/token?grant_type=password',$content).GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) { throw 'Sign in failed' }
        $session=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
        $response.Dispose(); $response=$null; $content.Dispose(); $content=$null; $Password=$null
        $http.DefaultRequestHeaders.Authorization=[Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$session.access_token)
        $response=$http.GetAsync($projectUrl+'/auth/v1/user').GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) { throw 'User verification failed' }
        $user=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
        Assert-OwnerSession $session $user
        Save-OwnerSession (Protect-OwnerSession $session)
    } finally {
        if($response){$response.Dispose()}; if($content){$content.Dispose()}; $http.Dispose()
        $session=$null; $user=$null; $Password=$null
    }
}

$form=[Windows.Forms.Form]::new(); $form.Text='HANI OS - PC 시세 수집기 로그인'; $form.ClientSize=[Drawing.Size]::new(565,330)
$form.StartPosition='CenterScreen'; $form.FormBorderStyle='FixedDialog'; $form.MaximizeBox=$false; $form.Font=[Drawing.Font]::new('맑은 고딕',10)
$note=[Windows.Forms.Label]::new(); $note.SetBounds(20,15,525,70)
$note.Text="토스 계정이 아닌 HANI 로그인 이메일·비밀번호입니다.`n비밀번호는 HANI 인증 서버에만 전송하며 저장하지 않습니다.`n로그인 유지 정보는 이 Windows 계정으로 암호화 보관합니다."
$form.Controls.Add($note)
$boxes=@()
foreach($entry in @(@('HANI 이메일',100),@('HANI 비밀번호',155))) {
    $label=[Windows.Forms.Label]::new(); $label.Text=$entry[0]; $label.SetBounds(20,$entry[1],125,28); $form.Controls.Add($label)
    $box=[Windows.Forms.TextBox]::new(); $box.SetBounds(150,$entry[1],390,28); $box.MaxLength=4096; $form.Controls.Add($box); $boxes+=,$box
}
$boxes[1].UseSystemPasswordChar=$true
$status=[Windows.Forms.Label]::new(); $status.SetBounds(20,200,525,55); $status.Text='기존 자산을 읽거나 변경하지 않습니다. 비밀번호를 채팅으로 보내지 마세요.'; $form.Controls.Add($status)
$login=[Windows.Forms.Button]::new(); $login.Text='로그인 연결'; $login.SetBounds(285,270,125,35); $form.Controls.Add($login)
$close=[Windows.Forms.Button]::new(); $close.Text='취소'; $close.SetBounds(420,270,120,35); $close.DialogResult='Cancel'; $form.Controls.Add($close); $form.CancelButton=$close
$login.Add_Click({
    $login.Enabled=$false; $status.Text='HANI 계정 확인 중…'; $form.Refresh()
    try {
        Connect-Owner $boxes[0].Text.Trim() $boxes[1].Text
        foreach($box in $boxes){$box.Clear();$box.Enabled=$false}
        $status.Text='로그인 연결 완료. 채팅에는 연결 완료라고만 알려주세요.'; $close.Text='닫기'
    } catch {
        $boxes[1].Clear(); $status.Text='연결 실패: HANI 로그인 정보·네트워크·기존 인증 파일 여부를 확인해주세요.'; $login.Enabled=$true
    }
})
try {
    if($SelfTest) {
        $session=@{user=@{id=$ownerId};access_token='synthetic-access';refresh_token='synthetic-refresh';expires_in=3600;password='MUST-NOT-SAVE'}
        $user=@{id=$ownerId;is_anonymous=$false}; Assert-OwnerSession $session $user
        foreach($bad in @(@{id='wrong';is_anonymous=$false},@{id=$ownerId;is_anonymous=$true})) {
            $rejected=$false; try{Assert-OwnerSession $session $bad}catch{$rejected=$true}; if(-not $rejected){throw 'Bad owner accepted'}
        }
        $cipher=Protect-OwnerSession $session
        $plain=[Security.Cryptography.ProtectedData]::Unprotect($cipher,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
        try {
            $text=[Text.Encoding]::UTF8.GetString($plain); $decoded=$text | ConvertFrom-Json
            if($text.Contains('MUST-NOT-SAVE') -or $decoded.userId -ne $ownerId -or $decoded.refresh_token -ne 'synthetic-refresh'){throw 'Session payload failed'}
        } finally{[Array]::Clear($plain,0,$plain.Length);$text=$null;$decoded=$null}
        if(-not $boxes[1].UseSystemPasswordChar){throw 'Password visible'}
        Write-Output 'PASS: owner and anonymous guards, DPAPI session round-trip, password excluded, input masked. No network or file writes.'
    } else { $null=$form.ShowDialog() }
} finally { foreach($box in $boxes){$box.Clear()}; $form.Dispose() }
