$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$textFiles = @('scripts/hani-reviewed-release-baseline.mjs', 'scripts/hani-reviewed-release-baseline.test.mjs')
$textFiles += Get-ChildItem -LiteralPath (Join-Path $root 'scripts/fixtures') -Filter '*.json' | ForEach-Object { $_.FullName }
$refs = [System.Collections.Generic.HashSet[string]]::new()
[void]$refs.Add('cefa62554e520c42acdc8310dd8f00f4dac0148a')
foreach ($file in $textFiles) {
  $resolved = if ([System.IO.Path]::IsPathRooted($file)) { $file } else { Join-Path $root $file }
  $source = [System.IO.File]::ReadAllText($resolved)
  foreach ($m in [regex]::Matches($source, '["'']([a-f0-9]{7,40})(\^?)["'']')) {
    [void]$refs.Add($m.Groups[1].Value + $m.Groups[2].Value)
    [void]$refs.Add($m.Groups[1].Value + '^')
  }
}
$files = @('index.html','scripts/fixtures/train233-integrations.json','assets/data/desk-mascots-v1.json')
$files += Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Name -match '^hani-.*\.(js|css)$' } | ForEach-Object { $_.Name }
$start = [System.Diagnostics.ProcessStartInfo]::new()
$start.FileName = (Get-Command git).Source
$start.Arguments = 'cat-file --batch'
$start.WorkingDirectory = $root
$start.UseShellExecute = $false
$start.CreateNoWindow = $true
$start.RedirectStandardInput = $true
$start.RedirectStandardOutput = $true
$process = [System.Diagnostics.Process]::Start($start)
$stream = $process.StandardOutput.BaseStream
$process.StandardInput.WriteLine('')
$process.StandardInput.Flush()
# Windows PowerShell/.NET emits a UTF-8 preamble on the first StreamWriter flush.
# Consume that deliberately invalid empty request before exporting real blobs.
while (($preambleByte = $stream.ReadByte()) -ne 10) {
  if ($preambleByte -eq -1) { throw 'Unexpected EOF before Git requests' }
}
$cache = @{}
$requestsPath = Join-Path $PSScriptRoot 'git-requests.json'
$requested = if (Test-Path -LiteralPath $requestsPath) { [System.Collections.Generic.HashSet[string]]::new([string[]](Get-Content -LiteralPath $requestsPath -Raw | ConvertFrom-Json)) } else { $null }
foreach ($ref in $refs) {
  foreach ($file in $files) {
    $key = $ref + ':' + $file
    if ($requested -and -not $requested.Contains($key)) { continue }
    $request = [System.Text.UTF8Encoding]::new($false).GetBytes($key + "`n")
    $process.StandardInput.BaseStream.Write($request,0,$request.Length)
    $process.StandardInput.BaseStream.Flush()
    $header = [System.Text.StringBuilder]::new()
    while (($b = $stream.ReadByte()) -ne 10) {
      if ($b -eq -1) { throw 'Unexpected EOF from Git' }
      [void]$header.Append([char]$b)
    }
    if ($header.ToString() -match '^[a-f0-9]+ blob (\d+)$') {
      $size = [int]$Matches[1]
      $bytes = [byte[]]::new($size)
      $offset = 0
      while ($offset -lt $size) {
        $count = $stream.Read($bytes,$offset,$size-$offset)
        if ($count -eq 0) { throw 'Truncated Git blob' }
        $offset += $count
      }
      if ($stream.ReadByte() -ne 10) { throw 'Missing Git delimiter' }
      $cache[$key] = [Convert]::ToBase64String($bytes)
    } elseif ($header.ToString() -notmatch ' missing$') { throw $header.ToString() }
  }
}
$process.StandardInput.Close()
$process.WaitForExit()
[System.IO.File]::WriteAllText((Join-Path $PSScriptRoot 'git-blobs.json'),($cache | ConvertTo-Json -Compress),[System.Text.UTF8Encoding]::new($false))
Write-Output ('Exported {0} exact Git blobs; no working-tree source used as oracle.' -f $cache.Count)
