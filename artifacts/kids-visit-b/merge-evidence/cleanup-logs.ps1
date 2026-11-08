# Only this task's exact generated log files; never recurse or touch source.
$ErrorActionPreference='Stop'
$ownedRoot=(Resolve-Path -LiteralPath $PSScriptRoot).Path
$summary=Get-Content -Raw -Encoding UTF8 (Join-Path $ownedRoot 'final-summary.json') | ConvertFrom-Json
$restoration=Get-Content -Raw -Encoding UTF8 (Join-Path $ownedRoot 'artifact-restoration.json') | ConvertFrom-Json
foreach($row in $restoration.changed){if(-not $row.restored){throw 'Artifact restoration incomplete'}}
foreach($row in $summary.results){
 if($row.exit -eq 0 -or $row.gitFailures -eq $row.fail -or ($row.file -eq 'hani-office-cafe-rest.test.mjs' -and (Test-Path -LiteralPath (Join-Path $ownedRoot 'performance.json')))){
  $target=Join-Path $ownedRoot ($row.file+'.failure.tap')
  if(Test-Path -LiteralPath $target){
   $absolute=(Resolve-Path -LiteralPath $target).Path
   if([IO.Path]::GetDirectoryName($absolute) -ne $ownedRoot){throw 'Log path outside task evidence'}
   Remove-Item -LiteralPath $absolute
  }
 }
}
foreach($name in @('hani-seoyun-m9.test.mjs.failure.tap','kids-initial.tap','targeted-summary.json','targeted-artifact-restoration.json','office-artifact-restoration.json','protected-artifacts.json','cafe-main-24.20.tap','cafe-merged-24.22.tap','cafe-main-serial.tap','cafe-canonical-serial.tap')){
 $target=Join-Path $ownedRoot $name
 if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target}
}
