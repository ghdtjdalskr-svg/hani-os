$ErrorActionPreference='Stop'
$testDir=Join-Path ([IO.Path]::GetTempPath()) ('hani-session-replace-'+[Guid]::NewGuid().ToString('N'))
$null=New-Item -ItemType Directory -Path $testDir
$source=Join-Path $testDir 'source';$target=Join-Path $testDir 'target'
try {
    [IO.File]::WriteAllText($source,'new');[IO.File]::WriteAllText($target,'old')
    try{[IO.File]::Replace($source,$target,$null);Write-Output 'null-backup: success'}catch{Write-Output ('null-backup: '+$_.Exception.GetType().Name)}
    if([IO.File]::Exists($source)){
        [IO.File]::Replace($source,$target,[NullString]::Value)
        if([IO.File]::ReadAllText($target) -ne 'new'){throw 'Replacement failed'}
        Write-Output 'typed-null-backup: PASS'
    }
} finally {
    foreach($file in @($source,$target)){if([IO.File]::Exists($file)){[IO.File]::Delete($file)}}
    [IO.Directory]::Delete($testDir)
}
