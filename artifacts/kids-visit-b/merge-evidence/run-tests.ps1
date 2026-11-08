param([string[]]$Only=@(),[string]$Label='office')
$ErrorActionPreference='Continue'
$out=$PSScriptRoot
$env:NODE_OPTIONS='--require ./artifacts/life-bundle/no-git-283.cjs'
$env:NODE_PATH=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
$tests=Get-ChildItem scripts -Filter 'hani-office-*.test.mjs' | Sort-Object Name | ForEach-Object Name
if($Only.Count){$tests=$Only}
$rows=@()
foreach($file in $tests){
 $argsForNode=@()
 if($file -eq 'hani-seoyun-m9.test.mjs'){$argsForNode+=@('--require','./scripts/hani-m9-polish-preload.cjs','--require','./scripts/hani-m9-link-preload.cjs')}
 if($file -eq 'hani-m9-link.test.mjs'){$argsForNode+=@('--require','./scripts/hani-m9-polish-preload.cjs')}
 $argsForNode+=@('--import','./scripts/hani-life-bundle-preload.mjs','--test','--test-isolation=none','--test-reporter=tap',('scripts/'+$file))
 $watch=[Diagnostics.Stopwatch]::StartNew()
 $log=Join-Path $out ($file+'.running.tap')
 & node @argsForNode *> $log
 $code=$LASTEXITCODE
 $text=[IO.File]::ReadAllText($log)
 $row=[ordered]@{file=$file;exit=$code;seconds=[Math]::Round($watch.Elapsed.TotalSeconds,1);pass=0;fail=0;skipped=0;failures=@();gitBlocked=$text.Contains('USER_GIT_DISABLED');command=('node '+($argsForNode -join ' '))}
 foreach($name in @('pass','fail','skipped')){$m=[regex]::Match($text,('(?m)^# '+$name+' (\d+)\r?$'));if($m.Success){$row[$name]=[int]$m.Groups[1].Value}}
 $row.failures=@([regex]::Matches($text,'(?m)^not ok \d+ - (.*)') | ForEach-Object {$_.Groups[1].Value.Trim()})
 if($code -ne 0){Move-Item -Force -LiteralPath $log -Destination (Join-Path $out ($file+'.failure.tap'))}else{Remove-Item -LiteralPath $log}
 $rows+=,[pscustomobject]$row
 $rows | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $out ($Label+'-summary.json'))
 Write-Output ($file+': '+$row.pass+' PASS / '+$row.fail+' FAIL / '+$row.skipped+' SKIP'+$(if($row.gitBlocked){' (Git blocked)'}))
}
