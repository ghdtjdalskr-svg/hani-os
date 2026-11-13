param([string]$Phase='before',[string]$Group='reported',[int]$Shard=0,[int]$Shards=1,[switch]$Pre499)
$ErrorActionPreference='Continue'
$reported=@('office-barista-night-273-pins','office-barista-night','office-bori-stroll','office-companion-homes','office-kids-286-source','office-kids-merge','office-kids-visit','office-kids-weekday','office-pet-bori-272-pins','office-residents','office-staff-chat','office-xmas-269-pins','office-xmas','ilbo-banner-215')
$core=@('chibi-pack-1','chibi-pack-1-layers','release-version-layers','save-guard','seoyun-m9','join-ieum','app-216-audit','qa-easy-cleanup','newsroom-285-source','newsroom-4cut-288','life-bundle-source','street-journal','street-journal-closure')
$files=if($Group -eq 'reported'){@($reported|ForEach-Object {Get-ChildItem -LiteralPath scripts -Filter "hani-$_.test.*"})}elseif($Group -eq 'office'){@(Get-ChildItem -LiteralPath scripts -Filter 'hani-office*.test.mjs')}else{@($core|ForEach-Object {Get-ChildItem -LiteralPath scripts -Filter "hani-$_.test.*"});@(Get-ChildItem -LiteralPath scripts -Filter 'hani-save-guard*.test.*');@(Get-ChildItem -LiteralPath scripts -Filter 'hani-chibi-pack-1*.test.mjs')}
$rows=@()
$ordered=@($files|Sort-Object -Property Name -Unique)
$index=-1
foreach($file in $ordered){
 $index++
 if(($index % $Shards) -ne $Shard){continue}
 $preloads=@('--require','./scripts/hani-tooling-293-deny-process.cjs')
 if($Pre499){$preloads+=@('--require','./artifacts/chibi-pack-1/tool293-pre499.cjs')}
 $out=@(& node @preloads --test --test-isolation=none --test-reporter=tap $file.FullName 2>&1)
 $code=$LASTEXITCODE
 $log=($out|ForEach-Object {"$_"}) -join "`n"
 $path="artifacts/chibi-pack-1/tool293-$Phase-$($file.Name).log"
 [IO.File]::WriteAllText((Join-Path (Get-Location) $path),$log,[Text.UTF8Encoding]::new($false))
 $pass=if($log -match '(?m)^# pass (\d+)') {[int]$Matches[1]}else{0}
 $fail=if($log -match '(?m)^# fail (\d+)') {[int]$Matches[1]}else{0}
 $skip=if($log -match '(?m)^# skipped (\d+)') {[int]$Matches[1]}else{0}
 $rows+=@{file=$file.Name;exit=$code;pass=$pass;fail=$fail;skip=$skip;log=$path;blocked=$log.Contains('TOOL293_PROCESS_BLOCKED')}
 Write-Output "$($file.Name) pass=$pass fail=$fail skip=$skip exit=$code"
}
$dest=Join-Path (Get-Location) "artifacts/chibi-pack-1/TOOLING-293-$Phase-$Group-$Shard.json"
[IO.File]::WriteAllText($dest,($rows|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
