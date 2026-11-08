$node='C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$env:NODE_OPTIONS='--require ./artifacts/save-guard/no-git.cjs --require ./artifacts/save-guard/prepatch-preload.cjs'
$rows=@()
foreach($file in @('hani-app-216-audit.test.cjs','hani-procrastination-board.test.mjs','hani-tasks-qa-212.test.mjs')){
 $env:HANI_SAVE_GUARD_PREPATCH=if($file -eq 'hani-app-216-audit.test.cjs'){'raw'}else{'historical'}
 $argsForNode=@()
 if($file -eq 'hani-tasks-qa-212.test.mjs'){$argsForNode+=@('--import','./scripts/hani-life-bundle-preload.mjs')}
 $argsForNode+=@('--test','--test-isolation=none','--test-reporter=tap',"scripts/$file")
 if($file -eq 'hani-procrastination-board.test.mjs'){$argsForNode=@('--test-name-pattern=persistent cards')+$argsForNode}
 $output=& $node @argsForNode 2>&1;$code=$LASTEXITCODE
 $summary=@($output | Select-String '^not ok|error:|^# (tests|pass|fail|skipped)' | ForEach-Object { $_.Line.Substring(0,[Math]::Min(220,$_.Line.Length)) })
 $rows+=[pscustomobject]@{file=$file;mode=$env:HANI_SAVE_GUARD_PREPATCH;exit=$code;summary=$summary}
 Write-Output "$file prepatch exit=$code";$summary | Select-Object -First 3
}
$rows | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 artifacts/save-guard/prepatch-results.json
