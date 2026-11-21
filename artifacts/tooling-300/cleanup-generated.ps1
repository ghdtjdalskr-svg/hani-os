$ErrorActionPreference='Stop'
$taskRoot=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$rootPrefix=[IO.Path]::GetFullPath($taskRoot).TrimEnd('\')+'\'
$targetRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'local/generated-new'))
$targetPrefix=$targetRoot.TrimEnd('\')+'\'
$moved=@()
Push-Location $taskRoot
try {
  $newFiles=@(& git -c core.quotepath=false ls-files --others --exclude-standard)
  if($LASTEXITCODE -ne 0){throw 'untracked inventory failed'}
  foreach($relative in $newFiles){
    if(!$relative.StartsWith('artifacts/') -or $relative.StartsWith('artifacts/tooling-300/')){continue}
    $source=[IO.Path]::GetFullPath((Join-Path $taskRoot $relative))
    $target=[IO.Path]::GetFullPath((Join-Path $targetRoot $relative))
    if(!$source.StartsWith($rootPrefix,[StringComparison]::OrdinalIgnoreCase) -or !$target.StartsWith($targetPrefix,[StringComparison]::OrdinalIgnoreCase)){throw 'move outside workspace evidence'}
    $archiveBase=$target
    $archiveIndex=1
    while(Test-Path -LiteralPath $target){$target="$archiveBase.rerun-$archiveIndex"; $archiveIndex++}
    [void][IO.Directory]::CreateDirectory((Split-Path -Parent $target))
    Move-Item -LiteralPath $source -Destination $target
    $moved+=,$relative
  }
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'local/moved-generated.json'),(ConvertTo-Json -InputObject @($moved)),[Text.UTF8Encoding]::new($false))
  Write-Output "Moved $($moved.Count) generated files into local/generated-new"
} finally {Pop-Location}
