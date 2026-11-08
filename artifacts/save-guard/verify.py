from pathlib import Path
import hashlib,json,re,difflib
root=Path('.')
after=Path('hani-main.js').read_bytes().decode('utf8')
hashtext=lambda x:hashlib.sha256(x.encode('utf8')).hexdigest()
delta=json.loads(Path('scripts/fixtures/save-guard-284-delta.json').read_text(encoding='utf8'))
guard=delta['files']['guard-patch-only'];assert hashtext(after)==guard['afterSha256']
restored=after.splitlines(keepends=True)
for edit in reversed(guard['edits']):
    assert ''.join(restored[edit['at']:edit['at']+edit['remove']])==edit['after']
    restored[edit['at']:edit['at']+edit['remove']]=edit['before'].splitlines(keepends=True)
before=''.join(restored);assert hashtext(before)==guard['beforeSha256']
def section(s,start,end):
    i=s.index(start);return s[i:s.index(end,i)]
owners={
 'record-validation':('function validateStoredRecords(', 'function writeProtectedState('),
 'normalization':('function normalizeState(', 'function isQuotaError('),
 'safety-snapshot':('async function cloudSaveSafetySnapshot(', 'function cloudEmergencyResolved('),
 'revision-locked-upload':('async function cloudPushLocalRow(', 'function cloudSyncDecision('),
 'revision-and-empty-decision':('function cloudSyncDecision(', 'function cloudSyncSelfTest('),
 'sync-cycle':('async function cloudSyncCycle(', 'function cloudBindLifecycle('),
 'quarantine':('function loadState(', 'function validateStoredRecords(')
}
checks={name:section(before,*a)==section(after,*a) for name,a in owners.items()}
oldquarantine=section(before,*owners['quarantine'])
newquarantine=section(after,*owners['quarantine']).replace('    storageLoadedRaw=stored;\r\n','')
checks['quarantine-except-read-only-baseline']=oldquarantine==newquarantine
del checks['quarantine']
assert all(checks.values()),checks
calls={method:{'before':len(re.findall(r'\.\s*'+method+r'\s*\(',before)),'after':len(re.findall(r'\.\s*'+method+r'\s*\(',after))} for method in ['setItem','removeItem','clear']}
localCalls={method:{'before':len(re.findall(r'localStorage\.\s*'+method+r'\s*\(',before)),'after':len(re.findall(r'localStorage\.\s*'+method+r'\s*\(',after))} for method in calls}
primaryCalls={method:{'before':len(re.findall(r'localStorage\.'+method+r'\(STORAGE_KEY',before)),'after':len(re.findall(r'localStorage\.'+method+r'\(STORAGE_KEY',after))} for method in ['setItem','removeItem']}
assert all(x['before']==x['after'] for x in [*calls.values(),*localCalls.values()])
constants={name:re.search(r'const '+name+r'=[^;\n]+',after).group() for name in ['STORAGE_KEY','VERSION','HANI_DISPLAY_VERSION','CLOUD_SAFETY_KEY']}
assert all(v in before for v in constants.values())
index=Path('index.html').read_bytes()
assert hashlib.sha256(index).hexdigest()==delta['files']['index.html']['afterSha256']
anchors=['storageLoadedRaw=null','function loadState(','function writeProtectedState(','function assertCloudSourceReady(','function removeProtectedState(','function showStorageTabConflict(','function assertStorageTabCurrent(','function initStorageTabGuard(','function save(','function validateCloudRecords(','async function cloudReadRow(','async function cloudApplyRemoteRow(','async function cloudRestoreToLocal(','initStorageTabGuard();']
lines=after.splitlines()
locations={name:next(i+1 for i,s in enumerate(lines) if name in s) for name in anchors}
report={'beforeSha256':hashtext(before),'afterSha256':hashtext(after),'indexPreserved':True,'constants':constants,'methodCalls':calls,'localStorageCalls':localCalls,'primaryCalls':primaryCalls,'preservedOwners':checks,'anchors':locations,'storageListenersBefore':before.count('addEventListener("storage",'),'storageListenersAfter':after.count('addEventListener("storage",'),'lastIndexScripts':re.findall(r'<script[^>]+src=["\x27]([^"\x27]+)',index.decode('utf8'))[-3:],'eol':{'beforeCRLF':before.count('\r\n'),'afterCRLF':after.count('\r\n'),'beforeLF':before.count('\n'),'afterLF':after.count('\n')}}
Path('artifacts/save-guard/static-evidence.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
Path('artifacts/save-guard/runtime.diff').write_text(''.join(difflib.unified_diff(before.splitlines(keepends=True),after.splitlines(keepends=True),fromfile='hani-main.before',tofile='hani-main.after',n=2)),encoding='utf8',newline='')
print(json.dumps({'calls':calls,'localStorage':localCalls,'preserved':checks,'version':constants['HANI_DISPLAY_VERSION'],'lastScripts':report['lastIndexScripts']},ensure_ascii=False))
