$ErrorActionPreference='Stop'
$taskRoot=$PSScriptRoot
$repoRoot=Split-Path (Split-Path $taskRoot)
$gitPath=(Get-Command git).Source
function Export-Git([string[]]$arguments,[string]$destination) {
 $si=New-Object Diagnostics.ProcessStartInfo
 $si.FileName=$gitPath
 $si.Arguments=($arguments | ForEach-Object {'"'+$_.Replace('"','\"')+'"'}) -join ' '
 $si.WorkingDirectory=$repoRoot;$si.UseShellExecute=$false;$si.CreateNoWindow=$true
 $si.RedirectStandardOutput=$true;$si.RedirectStandardError=$true
 $p=New-Object Diagnostics.Process;$p.StartInfo=$si
 New-Item -ItemType Directory -Force (Split-Path $destination) | Out-Null
 [void]$p.Start();$dest=[IO.File]::Create($destination)
 $p.StandardOutput.BaseStream.CopyTo($dest);$dest.Dispose()
 $err=$p.StandardError.ReadToEnd();$p.WaitForExit()
 if($p.ExitCode -ne 0){throw $err};$p.Dispose()
}
$plan=Get-Content (Join-Path $taskRoot 'snapshot-plan.json') -Raw | ConvertFrom-Json
foreach($entry in $plan.files){Export-Git @('show',($entry.ref+':'+$entry.file)) (Join-Path $taskRoot $entry.destination)}
Export-Git (@('diff','--no-ext-diff','--ignore-space-at-eol','--unified=0','1cdf07f','7d0fa05e873d09bb7b7eb070bea7c8271a6cfa5c','--')+@($plan.safetyFiles)) (Join-Path $taskRoot 'test-output/candidate/artifacts/qa-1st/eol-map.diff')
Write-Output ('Native Git snapshots exported: '+$plan.files.Count+'; QA EOL diff from 1cdf07f to 7d0fa05')
