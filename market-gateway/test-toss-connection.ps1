# One-shot read-only verification. Never output keys, tokens, headers or response/error bodies.
$ErrorActionPreference='Stop'
$VerbosePreference='SilentlyContinue'
$DebugPreference='SilentlyContinue'
Add-Type -AssemblyName System.Security.Cryptography.ProtectedData
$stage='local-key'
$bytes=$null; $credentials=$null; $token=$null; $client=$null; $request=$null; $response=$null
try {
    $path=Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'HANI_OS_Market/toss-credentials.dpapi'
    $item=Get-Item -LiteralPath $path
    if ($item.Length -gt 32768 -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Invalid key file' }
    $bytes=[Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($path),$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
    $credentials=[Text.Encoding]::UTF8.GetString($bytes) | ConvertFrom-Json
    if ($credentials.version -ne 1 -or -not $credentials.clientId -or -not $credentials.clientSecret) { throw 'Invalid credential format' }
    $handler=[Net.Http.HttpClientHandler]::new(); $handler.AllowAutoRedirect=$false
    $client=[Net.Http.HttpClient]::new($handler); $client.Timeout=[TimeSpan]::FromSeconds(15)
    $stage='token'
    $fields=[Collections.Generic.Dictionary[string,string]]::new()
    $fields.Add('grant_type','client_credentials'); $fields.Add('client_id',$credentials.clientId); $fields.Add('client_secret',$credentials.clientSecret)
    $request=[Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Post,'https://openapi.tossinvest.com/oauth2/token')
    $request.Content=[Net.Http.FormUrlEncodedContent]::new($fields)
    $response=$client.SendAsync($request).GetAwaiter().GetResult()
    if (-not $response.IsSuccessStatusCode) {
        [pscustomobject]@{Stage=$stage;Success=$false;HttpStatus=[int]$response.StatusCode} | ConvertTo-Json -Compress
        exit 1
    }
    $token=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
    if (-not $token.access_token -or [double]$token.expires_in -le 60) { throw 'Invalid token response' }
    $response.Dispose(); $response=$null; $request.Dispose(); $request=$null; $fields.Clear(); $credentials=$null
    $client.DefaultRequestHeaders.Authorization=[Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer',$token.access_token)
    foreach($route in @('stocks','prices')) {
        $stage=$route
        $response=$client.GetAsync('https://openapi.tossinvest.com/api/v1/'+$route+'?symbols=005930').GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) {
            [pscustomobject]@{Stage=$stage;Success=$false;HttpStatus=[int]$response.StatusCode} | ConvertTo-Json -Compress
            exit 1
        }
        $data=$response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
        $rows=@($data.result | Where-Object { $_.symbol -eq '005930' -and $_.currency -eq 'KRW' })
        if ($rows.Count -ne 1) { throw 'Unexpected market response' }
        if ($route -eq 'stocks' -and $rows[0].market -ne 'KOSPI') { throw 'Unexpected market' }
        if ($route -eq 'prices') {
            $timestamp=[DateTimeOffset]::Parse($rows[0].timestamp)
            if ([double]$rows[0].lastPrice -le 0 -or $timestamp -gt [DateTimeOffset]::UtcNow.AddMinutes(1)) { throw 'Invalid price' }
        }
        [pscustomobject]@{Stage=$stage;Success=$true;Symbol='005930';Currency='KRW'} | ConvertTo-Json -Compress
        $response.Dispose(); $response=$null; $data=$null; $rows=$null
    }
    Write-Output 'PASS: Toss authentication, Samsung metadata and timestamped KRW price. No account/order requests; no cache or asset writes.'
} catch {
    [pscustomobject]@{Stage=$stage;Success=$false;Reason='Local decrypt, network or response validation failed; details suppressed to protect secrets.'} | ConvertTo-Json -Compress
    exit 1
} finally {
    if ($bytes) { [Array]::Clear($bytes,0,$bytes.Length) }
    if ($response) { $response.Dispose() }; if ($request) { $request.Dispose() }; if ($client) { $client.Dispose() }
    $credentials=$null; $token=$null; $data=$null; $rows=$null; $fields=$null
}
