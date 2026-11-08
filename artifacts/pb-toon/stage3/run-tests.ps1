param([switch]$RerunAffected)
$ErrorActionPreference='Continue'
Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot/../../..").Path
$env:HANI_BRANCH_BASELINE=(Resolve-Path scripts/fixtures/life-282-baseline).Path
$env:HANI_MAIN_BASELINE=$env:HANI_BRANCH_BASELINE
$features=@('hani-pb-chibitoon.test.mjs','hani-procrastination-board.test.mjs','hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs')
$office=@(Get-ChildItem scripts -Filter 'hani-office-*.test.mjs' | Where-Object Name -ne 'hani-office-219.test.mjs' | Sort-Object Name | ForEach-Object Name)
$results=@()
$cases=@($features+$office)
$resultName='results.json'
if($RerunAffected){$cases=@($features+@('hani-office-kids-visit.test.mjs'));$resultName='rerun-results.json'}
foreach($case in $cases){
 $started=Get-Date
 $argsForNode=@('--require','./artifacts/pb-toon/stage2/no-git.cjs')
 if($case -notin @('hani-pb-chibitoon.test.mjs','hani-life-bundle-source.test.mjs')){$argsForNode+=@('--import','./scripts/hani-pb-chibitoon-legacy-preload.mjs')}
 if($office -contains $case){$argsForNode+=@('--import','./scripts/hani-life-bundle-preload.mjs')}
 $argsForNode+=@('--test','--test-isolation=none','--test-reporter=tap',"scripts/$case")
 $output=& node @argsForNode 2>&1
 $code=$LASTEXITCODE
 $output | Out-File -Encoding UTF8 -LiteralPath "$PSScriptRoot/$case.log"
 $summary=@($output | Select-String '^not ok|USER_GIT_DISABLED|error:|^# (tests|pass|fail|skipped)|^PASS' | ForEach-Object {$_.Line.Substring(0,[Math]::Min(260,$_.Line.Length))})
 $results += [pscustomobject]@{file=$case;group=$(if($office -contains $case){'office'}else{'feature'});exit=$code;seconds=[Math]::Round(((Get-Date)-$started).TotalSeconds,2);command=('node '+($argsForNode -join ' '));summary=$summary}
 $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath "$PSScriptRoot/$resultName"
 "$case exit=$code"
 if($code -ne 0){$summary | Select-Object -First 3}
}
"files=$($results.Count), success=$(@($results | Where-Object exit -eq 0).Count), nonzero=$(@($results | Where-Object exit -ne 0).Count)"
