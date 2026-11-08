param([ValidateSet('safety','life','office','related')][string]$Group='safety',[string]$Only='',[int]$TimeoutSeconds=900)
$ErrorActionPreference='Continue'
$node='C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$env:NODE_PATH='C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
$env:NODE_OPTIONS='--require ./artifacts/save-guard/no-git.cjs'
$playwright=Join-Path $env:NODE_PATH 'playwright/index.mjs'
$edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
$cases=switch($Group){
 'safety' {@(Get-ChildItem scripts -File | Where-Object { $_.Name -match '(storage|cloud|offline|backup|recover|guard|safety|quality-data).*test\.(mjs|cjs)$' } | Sort-Object Name | ForEach-Object Name)+@('hani-photo-backup-222-preservation.mjs','hani-offline-entry-223-preservation.mjs','hani-app-216-safety.cjs','hani-app-216-audit-safety.cjs','hani-app-216-practical-safety.cjs','hani-google-drive-212-safety.mjs','hani-qa-1st-safety.mjs')}
 'life' {@('hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-procrastination-board.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs','hani-gemini-reports-build.test.mjs','hani-tasks-qa-212.test.mjs','hani-nav-groups.test.mjs','hani-navlogin.test.mjs','hani-dashboard-period.test.mjs')}
 'office' {@(Get-ChildItem scripts -Filter 'hani-office-*.test.mjs' | Sort-Object Name | ForEach-Object Name)}
 'related' {@('hani-app-216.test.cjs','hani-app-216-audit.test.cjs','hani-app-216-practical.test.cjs','hani-board.test.mjs','hani-drive-vault.test.mjs','hani-drive-vault-precheck.test.mjs','hani-egress-fix.test.mjs','hani-media-core.test.mjs','hani-media-c-controls.test.mjs','hani-investment-research.test.cjs','hani-milestones-v1.test.mjs','hani-qa-210.test.mjs','hani-qa-210-followup.test.mjs','hani-settings-225.test.mjs','hani-simplify-225.test.mjs','hani-reviewed-release-baseline.test.mjs')}
}
$results=@()
if($Only){$cases=@($cases | Where-Object { $_ -eq $Only })}
$resultName=if($Only){'retry-'+$Only}else{$Group}
foreach($case in $cases){
 $nodeArgs=@()
 if($Group -eq 'office' -or ($Group -eq 'life' -and $case -notin @('hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-procrastination-board.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs'))){$nodeArgs+=@('--import','./scripts/hani-life-bundle-preload.mjs')}
 if($case -match 'runtime.test|offline-(entry|transport)-223.test'){$nodeArgs+="scripts/$case"}else{$nodeArgs+=@('--test','--test-isolation=none','--test-reporter=tap',"scripts/$case")}
 if($case -match 'runtime.test|offline-(entry|transport)-223.test'){$nodeArgs+=@($playwright,$edge)}
 $process=New-Object System.Diagnostics.Process
 $process.StartInfo.FileName=$node
 $process.StartInfo.Arguments=(@($nodeArgs | ForEach-Object { if($_ -match '\s'){'"'+$_+'"'}else{$_} }) -join ' ')
 $process.StartInfo.UseShellExecute=$false;$process.StartInfo.CreateNoWindow=$true
 $process.StartInfo.RedirectStandardOutput=$true;$process.StartInfo.RedirectStandardError=$true
 [void]$process.Start();$stdoutTask=$process.StandardOutput.ReadToEndAsync();$stderrTask=$process.StandardError.ReadToEndAsync()
 $started=Get-Date;$timeout=$false
 while(-not $process.WaitForExit(1000)){
  $elapsed=((Get-Date)-$started).TotalSeconds
  if($elapsed -gt $TimeoutSeconds){$process.Kill();$timeout=$true;break}
 }
 $output=($stdoutTask.GetAwaiter().GetResult()+$stderrTask.GetAwaiter().GetResult()) -split '\r?\n'
 $exit=if($timeout){124}else{$process.ExitCode}
 $text=$output -join "`n"
 $summary=@($output | Select-String -Pattern '^not ok|USER_GIT_DISABLED|AssertionError|ReferenceError|SyntaxError|Error:|^# (tests|pass|fail|skipped)|^PASS' | ForEach-Object { $_.Line.Substring(0,[Math]::Min(230,$_.Line.Length)) })
 $results+=[pscustomobject]@{file=$case;exit=$exit;seconds=[Math]::Round(((Get-Date)-$started).TotalSeconds,2);command=('node '+($nodeArgs -join ' '));gitBlocked=($text -match 'USER_GIT_DISABLED');browserBlocked=($text -match 'spawn EPERM|browserType.launch');timeout=$timeout;summary=$summary}
 ConvertTo-Json -InputObject @($results) -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath "$PSScriptRoot/$resultName-results.json"
 if($exit -ne 0){$output | Out-File -Encoding UTF8 -LiteralPath "$PSScriptRoot/fail-$case.log"}
 "$case exit=$exit"
 if($exit -ne 0){$summary | Select-Object -First 2}
}
"$Group completed $($results.Count), success=$(@($results | Where-Object exit -eq 0).Count), nonzero=$(@($results | Where-Object exit -ne 0).Count)"
