$ErrorActionPreference = 'Continue'
$directory = 'artifacts/m9-rebase281/office-logs'
New-Item -ItemType Directory -Force -Path $directory | Out-Null
$files = @(Get-ChildItem -LiteralPath scripts -Filter 'hani-office-*.test.mjs' | Sort-Object Name)
$results = @()
foreach ($file in $files) {
    $started = Get-Date
    & node --require ./scripts/hani-m9-polish-preload.cjs --require ./scripts/hani-m9-link-preload.cjs --test --test-isolation=none --test-timeout=30000 --test-reporter=tap ('scripts/' + $file.Name) 2>&1 | Out-File -Encoding utf8 ($directory + '/' + $file.Name + '.log')
    $exit = $LASTEXITCODE
    $results += [pscustomobject]@{file=$file.Name;exit=$exit;seconds=[math]::Round(((Get-Date)-$started).TotalSeconds,2)}
    $results | ConvertTo-Json | Out-File -Encoding utf8 artifacts/m9-rebase281/office-exits.json
    Write-Output ($results.Count.ToString() + '/' + $files.Count + ' ' + $file.Name + ' exit=' + $exit)
}
