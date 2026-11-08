param(
  [string]$Playwright = "$env:USERPROFILE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs",
  [string]$Browser = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
)
$ErrorActionPreference = 'Continue'
$root = (Resolve-Path "$PSScriptRoot/../..").Path
Set-Location -LiteralPath $root
$runtimeModules = Split-Path -Parent (Split-Path -Parent $Playwright)
$env:NODE_PATH = $runtimeModules
$env:HANI_PHASE1_QA_OUTPUT = "$PSScriptRoot/design-system-phase1"
$features = @('hani-life-bundle-source.test.mjs','hani-study-retry.test.mjs','hani-procrastination-board.test.mjs','hani-wishlist-quick-add.test.mjs','hani-dev-report-generate.test.mjs','hani-gemini-reports-build.test.mjs')
$legacy = @('hani-quiz-qa-212.test.cjs','hani-nav-groups.test.mjs','hani-navlogin.test.mjs','hani-dashboard-period.test.mjs','hani-design-system-qa.mjs','hani-qa-1st.test.cjs','hani-qa-1st-safety.mjs')
$legacy += Get-ChildItem scripts -Filter '*212.test.*' | Where-Object { $_.Name -notmatch '-ui\.' } | ForEach-Object Name
$legacy += Get-ChildItem scripts -Filter 'hani-office-*.test.mjs' | ForEach-Object Name
$ui = @('hani-navlogin-ui.test.mjs','hani-navigation-state-ui.test.mjs','hani-dashboard-period-ui.test.mjs','hani-qa-1st-ui.test.mjs','hani-sidebar-remote-photo-qa.cjs','hani-design-system-phase1-qa.mjs')
$results = @()
foreach ($case in @($features + ($legacy | Sort-Object -Unique) + $ui)) {
  $argsForNode = @('--test-reporter=tap')
  if ($case -notin $features) { $argsForNode += @('--import','./scripts/hani-life-bundle-preload.mjs') }
  $argsForNode += "scripts/$case"
  if ($case -in $ui -and $case -notin @('hani-sidebar-remote-photo-qa.cjs','hani-design-system-phase1-qa.mjs')) { $argsForNode += @($Playwright,$Browser) }
  $log = "$PSScriptRoot/after-$case.log"
  $started = Get-Date
  $output = & node @argsForNode 2>&1
  $code = $LASTEXITCODE
  $output | Out-File -Encoding UTF8 -LiteralPath $log
  $text = $output -join "`n"
  $summary = @($output | Select-String -Pattern '^not ok|AssertionError|Error:|^# (tests|pass|fail|skipped)|^PASS.*(그룹|tests)' | ForEach-Object { $_.Line.Substring(0,[Math]::Min($_.Line.Length,240)) })
  $results += [pscustomobject]@{file=$case;exit=$code;seconds=[Math]::Round(((Get-Date)-$started).TotalSeconds,2);command=('node '+($argsForNode -join ' '));summary=$summary}
  $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 "$PSScriptRoot/test-results.json"
  "$case exit=$code"
  if ($code -ne 0) { $summary | Select-Object -First 4 }
}
"Completed $($results.Count) commands; success=$(@($results | Where-Object exit -eq 0).Count); failed=$(@($results | Where-Object exit -ne 0).Count)"
if ($results | Where-Object exit -ne 0) { exit 1 }
