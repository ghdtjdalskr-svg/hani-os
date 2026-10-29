# Isolate each cold plan from prior VM/snapshot allocation and JIT state.
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot)
try {
    foreach ($taskPresence in @('false', 'true')) {
        foreach ($taskSample in 1..3) {
            node scripts/hani-office-obr21-metrics.mjs --sample $taskPresence $taskSample
            if ($LASTEXITCODE) { throw 'Performance sample failed' }
        }
    }
    node scripts/hani-office-obr21-metrics.mjs --aggregate
    if ($LASTEXITCODE) { throw 'Performance threshold failed' }
} finally { Pop-Location }
