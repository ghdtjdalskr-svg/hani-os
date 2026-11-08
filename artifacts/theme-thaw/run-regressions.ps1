$ErrorActionPreference='Continue'
$runtime='C:\Users\홍성민\.cache\codex-runtimes\codex-primary-runtime\dependencies'
$node=Join-Path $runtime 'node\bin\node.exe'
$pw=Join-Path $runtime 'node\node_modules\playwright\index.mjs'
$edge='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$env:HANI_GIT_PATH=Join-Path $runtime 'native\git\cmd\git.exe'
$env:NODE_PATH=Join-Path $runtime 'node\node_modules'
& $node artifacts/theme-thaw/verify.mjs > artifacts/theme-thaw/verify.log
if($LASTEXITCODE -ne 0){throw 'Closure/safety prerequisites failed'}
$summary=@()
foreach($file in @('hani-theme-thaw.test.mjs','hani-theme-white-215.test.mjs','hani-design-system-qa.mjs','hani-dashboard-period.test.mjs','hani-nav-groups.test.mjs','hani-navlogin.test.mjs','hani-qa-1st.test.cjs','hani-qa-1st-safety.mjs')){
  $log="artifacts/theme-thaw/$file.log"
  & $node "scripts/$file" *> $log
  $summary+=@{file=$file;command="node scripts/$file";exit=$LASTEXITCODE;log=$log}
  Write-Output "$file exit=$LASTEXITCODE"
}
foreach($file in @('hani-qa-1st-ui.test.mjs','hani-dashboard-period-ui.test.mjs','hani-navigation-state-ui.test.mjs','hani-navlogin-ui.test.mjs')){
  $log="artifacts/theme-thaw/$file.log"
  & $node "scripts/$file" $pw $edge *> $log
  $summary+=@{file=$file;command="node scripts/$file <runtime playwright> <Edge>";exit=$LASTEXITCODE;log=$log}
  Write-Output "$file exit=$LASTEXITCODE"
}
$summary | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 artifacts/theme-thaw/regression.json
