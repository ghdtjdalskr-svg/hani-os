param([ValidateSet('features','regression','ui')][string]$Group='features')
$ErrorActionPreference='Continue'
$root=(Resolve-Path "$PSScriptRoot/../..").Path
Set-Location -LiteralPath $root
$runtime=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node'
$node=Join-Path $runtime 'bin/node.exe'
$env:NODE_PATH=Join-Path $runtime 'node_modules'
$env:NODE_OPTIONS='--require ./artifacts/life-bundle/no-git-283.cjs'
$env:HANI_BRANCH_BASELINE=Join-Path $PSScriptRoot '283/main-282'
$env:HANI_MAIN_BASELINE=$env:HANI_BRANCH_BASELINE
$playwright=Join-Path $env:NODE_PATH 'playwright/index.mjs'
$browser='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
$features=@('hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-procrastination-board.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs','hani-gemini-reports-build.test.mjs')
$regression=@('hani-nav-groups.test.mjs','hani-navlogin.test.mjs','hani-dashboard-period.test.mjs','hani-tasks-qa-212.test.mjs')+(Get-ChildItem scripts -Filter 'hani-office-*.test.mjs' | Sort-Object Name | ForEach-Object Name)+@('hani-m9-link.test.mjs','hani-seoyun-m9.test.mjs','hani-m9-polish.test.mjs')
$uis=@('hani-navlogin-ui.test.mjs','hani-navigation-state-ui.test.mjs','hani-dashboard-period-ui.test.mjs')
$cases=switch($Group){'features'{$features}'regression'{$regression}'ui'{$uis}}
$results=@()
foreach($case in $cases){
 $argsForNode=@()
 if($case -eq 'hani-m9-link.test.mjs'){$argsForNode+=@('--require','./scripts/hani-m9-polish-preload.cjs')}
 if($case -eq 'hani-seoyun-m9.test.mjs'){$argsForNode+=@('--require','./scripts/hani-m9-polish-preload.cjs','--require','./scripts/hani-m9-link-preload.cjs')}
 if(($Group -in @('regression','ui')) -or $case -eq 'hani-gemini-reports-build.test.mjs'){$argsForNode+=@('--import','./scripts/hani-life-bundle-preload.mjs')}
 if($Group -ne 'ui'){$argsForNode+=@('--test','--test-isolation=none','--test-reporter=tap')}
 $argsForNode+="scripts/$case"
 if($Group -eq 'ui'){$argsForNode+=@($playwright,$browser)}
 $started=Get-Date
 $output=& $node @argsForNode 2>&1
 $code=$LASTEXITCODE
 $output | Out-File -Encoding UTF8 -LiteralPath "$PSScriptRoot/283/$Group-$case.log"
 $summary=@($output | Select-String -Pattern '^not ok|USER_GIT_DISABLED|AssertionError|Error:|^# (tests|pass|fail|skipped)|^PASS.*(그룹|tests)' | ForEach-Object {$_.Line.Substring(0,[Math]::Min(250,$_.Line.Length))})
 $results+=[pscustomobject]@{file=$case;exit=$code;seconds=[Math]::Round(((Get-Date)-$started).TotalSeconds,2);command=('node '+($argsForNode -join ' '));summary=$summary}
 $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath "$PSScriptRoot/283/$Group-results.json"
 "$case exit=$code"
 if($code -ne 0){$summary | Select-Object -First 3}
}
"$Group completed $($results.Count), success=$(@($results | Where-Object exit -eq 0).Count), nonzero=$(@($results | Where-Object exit -ne 0).Count)"
