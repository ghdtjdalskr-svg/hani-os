$ErrorActionPreference='Continue'
Set-Location -LiteralPath (Resolve-Path "$PSScriptRoot/../../..").Path
$env:HANI_BRANCH_BASELINE=(Resolve-Path scripts/fixtures/life-282-baseline).Path
$env:HANI_MAIN_BASELINE=$env:HANI_BRANCH_BASELINE
$cases=@('hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-procrastination-board.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs','hani-pb-chibitoon.test.mjs')
$results=@()
foreach($case in $cases){
 $argsForNode=@('--require','./artifacts/pb-toon/stage2/no-git.cjs')
 if($case -eq 'hani-dev-report-generate.test.mjs'){$argsForNode+=@('--import','./scripts/hani-pb-dev-report-fixture-preload.mjs')}
 elseif($case -ne 'hani-pb-chibitoon.test.mjs'){$argsForNode+=@('--import','./scripts/hani-pb-chibitoon-legacy-preload.mjs')}
 $argsForNode+=@('--test','--test-isolation=none','--test-reporter=tap',"scripts/$case")
 $output=& node @argsForNode 2>&1
 $code=$LASTEXITCODE
 $output | Out-File -Encoding UTF8 -LiteralPath "$PSScriptRoot/$case.log"
 $summary=@($output | Select-String '^not ok|^# (tests|pass|fail|skipped)|^PASS|error:' | ForEach-Object Line)
 $results += [pscustomobject]@{file=$case;exit=$code;command=('node '+($argsForNode -join ' '));summary=$summary}
 $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath "$PSScriptRoot/features-results.json"
 "$case exit=$code"
 if($code -ne 0){$summary}
}
