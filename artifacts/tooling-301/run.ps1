param([ValidateSet('baseline','current')][string]$Phase='current',[string]$Label='',[string[]]$Only=@(),[int]$TimeoutSeconds=90)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$runRoot=if($Phase -eq 'baseline'){Join-Path $PSScriptRoot 'local/baseline'}else{$taskRoot}
if(-not $Label){$Label=$Phase}
$outDir=Join-Path $PSScriptRoot "local/$Label-logs"
[void][IO.Directory]::CreateDirectory($outDir)
$nodePath=(Get-Command node).Source
$results=@()
$testFiles=@(Get-ChildItem -LiteralPath (Join-Path $runRoot 'scripts') -File -Filter '*.test.mjs' | Sort-Object Name)
if($Only.Count){$testFiles=@($testFiles | Where-Object {$_.Name -in $Only})}
foreach($testFile in $testFiles){
  $watch=[Diagnostics.Stopwatch]::StartNew()
  $info=New-Object Diagnostics.ProcessStartInfo
  $info.FileName=$nodePath
  $info.Arguments="scripts/$($testFile.Name)"
  $info.WorkingDirectory=$runRoot
  $info.UseShellExecute=$false
  $info.CreateNoWindow=$true
  $info.RedirectStandardOutput=$true
  $info.RedirectStandardError=$true
  $proc=New-Object Diagnostics.Process
  $proc.StartInfo=$info
  [void]$proc.Start()
  $stdout=$proc.StandardOutput.ReadToEndAsync()
  $stderr=$proc.StandardError.ReadToEndAsync()
  $timedOut=-not $proc.WaitForExit($TimeoutSeconds*1000)
  if($timedOut){$proc.Kill();$proc.WaitForExit()}
  $code=$proc.ExitCode
  $body=$stdout.Result+"`n"+$stderr.Result
  $proc.Dispose()
  [IO.File]::WriteAllText((Join-Path $outDir "$($testFile.Name).log"),$body,[Text.UTF8Encoding]::new($false))
  $row=[ordered]@{file=$testFile.Name;exit=$code;timeout=$timedOut;pass=0;fail=0;skip=0;scriptPass=0;eperm=($body -match 'EPERM');seconds=[Math]::Round($watch.Elapsed.TotalSeconds,2)}
  foreach($pair in @(@('pass','pass'),@('fail','fail'),@('skip','skipped'))){
    $numbers=[regex]::Matches($body,"(?m)^[#ℹ]?\s*$($pair[1])\s+(\d+)\s*$")
    if($numbers.Count){$row[$pair[0]]=[int]$numbers[$numbers.Count-1].Groups[1].Value}
  }
  $row.scriptPass=[regex]::Matches($body,'(?m)^.*\bPASS\b.*$').Count
  $results+=,$row
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot "local/$Label-results.json"),(ConvertTo-Json -InputObject @($results) -Depth 5),[Text.UTF8Encoding]::new($false))
  Write-Output ("{0} {1}/{2} {3} exit={4} timeout={5} pass={6} fail={7}" -f $Label,$results.Count,$testFiles.Count,$testFile.Name,$code,$timedOut,$row.pass,$row.fail)
}
