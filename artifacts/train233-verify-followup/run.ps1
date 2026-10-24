param([string]$Phase='logs',[string]$Only='',[int]$TimeoutSeconds=180,[switch]$BrowserProbes,[string]$Task='',[switch]$ExportOnly,[switch]$Resume,[string]$Targets='candidate')
$ErrorActionPreference='Stop'
if($BrowserProbes -or $Task -or $Targets -ne 'candidate'){throw 'This follow-up is candidate Node-only; no browser, package, or other worktree runs.'}
$root=Split-Path (Split-Path $PSScriptRoot)
$out=Join-Path $PSScriptRoot $Phase
New-Item -ItemType Directory -Force -Path $out | Out-Null
$node=(Get-Command node).Source
$git=(Get-Command git).Source
$utf8=New-Object System.Text.UTF8Encoding($false)
$cache=Join-Path $PSScriptRoot 'git-cache'
New-Item -ItemType Directory -Force -Path $cache | Out-Null
$runtime=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
$env:NODE_PATH=Split-Path (Split-Path $runtime)
$env:HANI_CHROME_PATH=$edge
$env:HANI_CHROME=$edge
$env:HANI_PLAYWRIGHT_MODULE=$runtime
$env:HANI_VERIFY_CACHE=$cache
$env:NO_COLOR='1'
$env:HANI_BUILDING_SAFETY_BASELINE=Join-Path $PSScriptRoot 'exports/building-baseline'
$env:HANI_VERIFY_NO_BROWSER=if($BrowserProbes){'0'}else{'1'}
function Invoke-Captured([string]$exe,[string[]]$arguments,[string]$cwd,[int]$timeout){
 $si=New-Object System.Diagnostics.ProcessStartInfo
 $si.FileName=$exe
 $si.Arguments=($arguments | ForEach-Object {'"'+$_.Replace('"','\"')+'"'}) -join ' '
 $si.WorkingDirectory=$cwd;$si.UseShellExecute=$false;$si.CreateNoWindow=$true
 $si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 $p=New-Object System.Diagnostics.Process;$p.StartInfo=$si
 $watch=[Diagnostics.Stopwatch]::StartNew();[void]$p.Start()
 $stdout=$p.StandardOutput.BaseStream;$memory=New-Object IO.MemoryStream
 $copy=$stdout.CopyToAsync($memory);$err=$p.StandardError.ReadToEndAsync()
 $timedOut=-not $p.WaitForExit($timeout*1000)
 if($timedOut){$p.Kill();$p.WaitForExit()}
 [void]$copy.GetAwaiter().GetResult();$stderr=$err.GetAwaiter().GetResult()
 $result=@{status=$p.ExitCode;timedOut=$timedOut;ms=$watch.ElapsedMilliseconds;bytes=$memory.ToArray();stderr=$stderr}
 $p.Dispose();$memory.Dispose();return $result
}
function Export-Requests {
 foreach($file in @(Get-ChildItem -LiteralPath $cache -Filter '*.request.json')){
  if(-not(Test-Path -LiteralPath $file.FullName)){continue}
  $req=Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
  if(@('show','rev-parse','diff','merge-base','cat-file','ls-tree','log') -notcontains $req.args[0]){throw 'Non-read Git request'}
  $r=Invoke-Captured $git @($req.args) $req.cwd 30
  $key=$file.Name.Replace('.request.json','')
  [IO.File]::WriteAllBytes((Join-Path $cache ($key+'.bin')),$r.bytes)
  [IO.File]::WriteAllText((Join-Path $cache ($key+'.json')),(@{cwd=$req.cwd;args=$req.args;status=$r.status;stderr=$r.stderr;bytes=$r.bytes.Length}|ConvertTo-Json -Depth 6),$utf8)
  Remove-Item -LiteralPath $file.FullName -ErrorAction SilentlyContinue
 }
}
$inventory=Get-Content (Join-Path $PSScriptRoot 'inventory.json') -Raw | ConvertFrom-Json
if($ExportOnly){Export-Requests;Write-Output 'Native Git exports complete';exit}
if($Only){$inventory=@($inventory | Where-Object {$_.file -match $Only})}
if($Task -eq 'package'){$inventory=@(@{file='scripts/hani-release-package.mjs';browser=$false})}
$results=New-Object System.Collections.Generic.List[object]
if($Resume -and (Test-Path (Join-Path $out 'results.json'))){$resumeRows=Get-Content (Join-Path $out 'results.json') -Raw|ConvertFrom-Json;foreach($old in $resumeRows){if($old -is [array]){foreach($nested in $old){$results.Add($nested)}}else{$results.Add($old)}}}
$probes=0
foreach($entry in $inventory){
 foreach($target in $Targets.Split(',')){
  if($Resume -and @($results|Where-Object {$_.file -eq $entry.file -and $_.target -eq $target}).Count -gt 0){continue}
  if($Task -and $target -eq 'main'){continue}
  $cwd=if($target -eq 'candidate'){$root}else{[IO.Path]::GetFullPath((Join-Path $root '../m233'))}
  $file=Join-Path $cwd $entry.file
  if(-not(Test-Path -LiteralPath $file)){$results.Add(@{file=$entry.file;target=$target;status='ABSENT'});continue}
  if($entry.file -match '\.ps1$'){$results.Add(@{file=$entry.file;target=$target;status='NOT_RUN';reason='PowerShell helper needs its own service/session fixtures'});continue}
  $argsNode=@('--require',(Join-Path $PSScriptRoot 'git-read-cache.cjs'),$entry.file)
  if($entry.args){$argsNode+=@($entry.args)}
  if($Task -eq 'package'){$argsNode+=@('build','--base','origin/main','--candidate','HEAD','--output',(Join-Path $PSScriptRoot 'candidate-package.json'))}
  if($entry.browser -and $BrowserProbes){
   if($probes -ge 4){$results.Add(@{file=$entry.file;target=$target;status='BLOCKED';reason='Four Edge launch attempts exhausted; no further browser launches'});continue}
   $argsNode+=@($runtime,$edge);$probes++
  }
  $name=$target+'-'+[IO.Path]::GetFileName($entry.file)
  $r=Invoke-Captured $node $argsNode $cwd $TimeoutSeconds
  $attempt=0
  while($r.status -ne 0 -and ([Text.Encoding]::UTF8.GetString($r.bytes)+$r.stderr) -match 'Exact native Git export required|Runtime preflight BLOCKED' -and (Get-ChildItem -LiteralPath $cache -Filter '*.request.json').Count -gt 0 -and $attempt -lt 100){Export-Requests;$attempt++;$r=Invoke-Captured $node $argsNode $cwd $TimeoutSeconds}
  $log=[Text.Encoding]::UTF8.GetString($r.bytes)+$r.stderr
  [IO.File]::WriteAllText((Join-Path $out ($name+'.log')),$log,$utf8)
  $status=if($r.timedOut){'TIMEOUT'}elseif($r.status -eq 0){'PASS'}elseif($log -match 'spawn(?:Sync)? .*EPERM|EACCES|HANI_GIT_EXPORT_REQUIRED|HANI_BROWSER_QUOTA_EXHAUSTED|MCP tool call requires approval|Cannot find module .playwright.|Usage:'){ 'BLOCKED'}else{'FAIL'}
  $row=@{file=$entry.file;target=$target;status=$status;exit=$r.status;ms=$r.ms;exports=$attempt;browserArgs=[bool]$BrowserProbes;log=$Phase+'/'+$name+'.log'}
  $results.Add($row)
  [IO.File]::WriteAllText((Join-Path $out 'results.json'),(ConvertTo-Json -InputObject @($results.ToArray()) -Depth 6),$utf8)
  Write-Output ($target+' '+$status+' '+$entry.file+' '+$r.ms+'ms')
 }
}
[IO.File]::WriteAllText((Join-Path $out 'results.json'),(ConvertTo-Json -InputObject @($results.ToArray()) -Depth 6),$utf8)
Write-Output ('COMPLETE '+$results.Count)
