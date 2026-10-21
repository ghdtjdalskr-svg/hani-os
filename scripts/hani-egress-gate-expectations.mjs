import assert from 'node:assert/strict';

// Preserve the full gate owner, allowing only the egress patch's explicit delta.
// The egress suite executes its outage entry and recovery/owner denial cases.
export function assertEgressGate(actual, baseline) {
  // offline-entry-223 adds only a snapshot-before-first-sync prelude. Keep the rest of the canonical gate exact.
  if(!baseline.includes('await offlineEntryBeforeLoginSync('))actual=actual.replace(/  if\(typeof offlineEntry!=="undefined"\)\{\r?\n    if\(offlineEntry.active\)return false;\r?\n    await offlineEntryBeforeLoginSync\(attempt,owner,client\);\r?\n  \}\r?\n/,'');
  if(!baseline.includes('reason==="offline-local"'))actual=actual.replace('  if(typeof offlineEntry!=="undefined"&&reason==="offline-local")return offlineEntryOpen();\n','');
  if (actual === baseline) return;
  const expected = baseline
    .replace('  await cloudFetchMeta({silent:true});', `  // A verified bfcache session rejoins the same lifecycle/coalescing path; initial login/reload keeps its existing checks.
  const lifecycleResume=reason==="session-resume"&&cloudLifecycleBound;
  if(!lifecycleResume)await cloudFetchMeta({silent:true});`)
    .replace('  await cloudSyncCycle(reason);', '  await cloudSyncCycle(lifecycleResume?"resume-pageshow":reason);')
    .replace('  if(loadRecovery.active||importSyncHold||cloudChoicePreview||!cloudAutoSyncReady||cloudRuntime.sync!=="ON"){', `  let localEntry=false;
  if((cloudOutage.active||cloudNetworkRetryPending)&&!loadRecovery.active&&!importSyncHold&&!cloudChoicePreview){
    try{
      assertCloudSourceReady();
      const raw=localStorage.getItem(STORAGE_KEY),local=raw&&JSON.parse(raw);
      localEntry=!!local&&typeof local==="object"&&!Array.isArray(local)&&cloudHasMeaningfulLocalData(local)&&cloudHasMeaningfulLocalData(state);
    }catch(_){localEntry=false}
  }
  if(loadRecovery.active||importSyncHold||cloudChoicePreview||(!localEntry&&(!cloudAutoSyncReady||cloudRuntime.sync!=="ON"))){`)
    .replace('  markLoginGateSession();cloudBindLifecycle();unlockLoginGate();renderAll();', '  if(localEntry&&cloudOutage.active)cloudShowOutage();\n  markLoginGateSession();cloudBindLifecycle();unlockLoginGate();renderAll();');
  assert.notEqual(expected, baseline, 'baseline gate has the expected pre-egress anchors');
  assert.equal(actual, expected, 'loginGateEnterApp allows only the explicit egress entry/lifecycle delta');
}
