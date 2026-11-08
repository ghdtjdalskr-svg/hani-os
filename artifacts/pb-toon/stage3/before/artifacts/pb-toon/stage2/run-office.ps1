$ErrorActionPreference='Continue'
$root=(Resolve-Path "$PSScriptRoot/../../..").Path
Set-Location -LiteralPath $root
$env:HANI_BRANCH_BASELINE=(Resolve-Path ../life-bundle/artifacts/life-bundle/283/main-282).Path
$env:HANI_MAIN_BASELINE=$env:HANI_BRANCH_BASELINE
$cases=Get-ChildItem scripts -Filter 'hani-office-*.test.mjs' | Sort-Object Name
$results=@()
foreach($case in $cases){
 $started=Get-Date
 $argsForNode=@('--require','./artifacts/pb-toon/stage2/no-git.cjs','--import','./scripts/hani-pb-chibitoon-legacy-preload.mjs','--import','./scripts/hani-life-bundle-preload.mjs','--test','--test-isolation=none','--test-reporter=tap',"scripts/$($case.Name)")
 $output=& node @argsForNode 2>&1
 $code=$LASTEXITCODE
 $output | Out-File -Encoding UTF8 -LiteralPath "$PSScriptRoot/office-$($case.Name).log"
 $summary=@($output | Select-String '^not ok|USER_GIT_DISABLED|AssertionError|error:|^# (tests|pass|fail|skipped)' | ForEach-Object {$_.Line.Substring(0,[Math]::Min(260,$_.Line.Length))})
 $results += [pscustomobject]@{file=$case.Name;exit=$code;seconds=[Math]::Round(((Get-Date)-$started).TotalSeconds,2);command=('node '+($argsForNode -join ' '));summary=$summary}
 $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath "$PSScriptRoot/office-results.json"
 "$($case.Name) exit=$code"
 if($code -ne 0){$summary | Select-Object -First 2}
}
"office files=$($results.Count), success=$(@($results | Where-Object exit -eq 0).Count), nonzero=$(@($results | Where-Object exit -ne 0).Count)"
