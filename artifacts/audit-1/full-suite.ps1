param([ValidateSet('baseline','before','current')][string]$Phase='current',[string[]]$Only,[switch]$CompareFailures)
$ErrorActionPreference='Stop'
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location -LiteralPath $root
try {
 $local=Join-Path $PSScriptRoot 'local/second-pass'
 $out=Join-Path $local $Phase
 New-Item -ItemType Directory -Force -Path $out|Out-Null
 $files=@(Get-ChildItem -LiteralPath scripts -File -Filter '*.test.mjs' | Where-Object { -not $Only -or $_.Name -in $Only } | Sort-Object Name)
 if($Phase -eq 'baseline'){$files=@($files|Where-Object {$_.Name -notin @('hani-audit-1.test.mjs','hani-book-share-parse.test.mjs')})}
 if($CompareFailures){
  if($Phase -ne 'baseline'){throw 'CompareFailures requires baseline'}
  $currentRows=Get-Content -Raw -Encoding UTF8 (Join-Path $local 'current/results.json')|ConvertFrom-Json
  $rechecks=Get-Content -Raw -Encoding UTF8 (Join-Path $local 'current/selected.json')|ConvertFrom-Json
  $failed=@(foreach($row in $currentRows){$latest=@($rechecks|Where-Object {$_.file -eq $row.file});$effective=if($latest.Count){$latest[-1]}else{$row};if($effective.exit -ne 0 -or $effective.timeout){$effective.file}})
  $files=@($files|Where-Object {$_.Name -in $failed})
 }
 Write-Output ('PLAN phase='+$Phase+' compareFailures='+$CompareFailures+' files='+$files.Count)
 $node=(Get-Command node).Source
 $rows=@();$env:FORCE_COLOR='0'
 foreach($file in $files){
  $env:AUDIT1_EVIDENCE_DIR='artifacts/audit-1/local/second-pass/'+$Phase+'/tests/'+$file.Name
  $args=@('--test-reporter=tap','--require','./scripts/hani-design-polish-2-execution-guard.cjs','--require','./artifacts/audit-1/output.cjs')
  if($Phase -eq 'baseline'){$args+=@('--require','./artifacts/audit-1/main299-baseline.cjs')}
  if($CompareFailures){
   $candidateRow=@($rechecks|Where-Object {$_.file -eq $file.Name})
   if(-not $candidateRow.Count){$candidateRow=@($currentRows|Where-Object {$_.file -eq $file.Name})}
   if($candidateRow[0].names.Count -and -not $candidateRow[0].timeout){
    $patterns=@($candidateRow[0].names|ForEach-Object {[regex]::Escape($_).Replace('\ ','\x20').Replace('"','\x22')})
    $args+=@('--test-name-pattern=^(?:'+($patterns -join '|')+')$')
   }
  }
  $args+=@('scripts/'+$file.Name)
  $stdout=Join-Path $out ($file.Name+'.log');$stderr=Join-Path $out ($file.Name+'.err')
  $started=[DateTime]::UtcNow
  $p=Start-Process -FilePath $node -ArgumentList $args -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  $handle=$p.Handle
  $finished=$p.WaitForExit(180000)
  if(-not $finished){$p.Kill();$p.WaitForExit()}
  $p.Refresh();$code=$p.ExitCode
  $log=[IO.File]::ReadAllText($stdout)+[IO.File]::ReadAllText($stderr)
  [IO.File]::WriteAllText($stdout,$log,[Text.UTF8Encoding]::new($false))
  $counts=@{};foreach($metric in @('pass','fail','skipped')){$found=[regex]::Matches($log,'(?m)^# '+$metric+' (\d+)\r?$');$counts[$metric]=if($found.Count){[int]$found[$found.Count-1].Groups[1].Value}else{0}}
  $names=@([regex]::Matches($log,'(?m)^not ok \d+ - (.+)\r?$')|ForEach-Object {$_.Groups[1].Value.Trim()})
  $row=@{file=$file.Name;exit=$code;timeout=(-not $finished);ms=[int]([DateTime]::UtcNow-$started).TotalMilliseconds;pass=$counts.pass;fail=$counts.fail;skip=$counts.skipped;names=$names;delegated=$log.Contains('DESIGN2_DELEGATED_PROCESS:');command=('node '+($args -join ' '))}
  $rows+=$row
  $resultFile=if($Only){'selected.json'}else{'results.json'}
  [IO.File]::WriteAllText((Join-Path $out $resultFile),(ConvertTo-Json -InputObject @($rows) -Depth 8),[Text.UTF8Encoding]::new($false))
  if($code -ne 0 -or ($rows.Count % 20) -eq 0){Write-Output ($Phase+' '+$rows.Count+'/'+$files.Count+' '+$file.Name+' exit='+$code+' pass='+$counts.pass+' fail='+$counts.fail+' ms='+$row.ms+' timeout='+$row.timeout+' delegated='+$row.delegated)}
 }
 $pins=Get-Content -Raw -Encoding UTF8 (Join-Path $local 'preservation.json')|ConvertFrom-Json
 foreach($file in @('artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-drama/reachability.json')){
  $backup=Join-Path (Join-Path $local 'original') $file
  if((Get-FileHash -LiteralPath $file).Hash -ne (Get-FileHash -LiteralPath $backup).Hash){Copy-Item -LiteralPath $backup -Destination $file}
  if((Get-FileHash -LiteralPath $file).Hash.ToLowerInvariant() -ne $pins.$file){throw ('Output not preserved: '+$file)}
 }
 Write-Output ($Phase+' COMPLETE files='+$rows.Count+' success='+@($rows|Where-Object {$_.exit -eq 0 -and -not $_.timeout}).Count+' failed='+@($rows|Where-Object {$_.exit -ne 0 -or $_.timeout}).Count)
} finally {Remove-Item Env:AUDIT1_EVIDENCE_DIR,Env:FORCE_COLOR -ErrorAction SilentlyContinue;Pop-Location}
