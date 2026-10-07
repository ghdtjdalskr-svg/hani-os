import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const engine=Number(source.match(/const CLOUD_SYNC_ENGINE=(\d+)/)?.[1]);
const schema=Number(source.match(/const CLOUD_HASH_SCHEMA=(\d+)/)?.[1]);
const helperStart=source.indexOf("function cloudShouldFetchFullState(");
const helperEnd=source.indexOf("async function cloudSyncCycle",helperStart);
assert.ok(helperStart>0&&helperEnd>helperStart,"metadata gate helper is present");

const helperSource=source.slice(helperStart,helperEnd);
const buildHelper=new Function("CLOUD_SYNC_ENGINE","CLOUD_HASH_SCHEMA","cloudMeta",`${helperSource}; return [cloudShouldFetchFullState,cloudCanUseVerifiedRemote];`);
const [shouldFetch,canUseCache]=buildHelper(engine,schema,()=>({}));
const baseline={syncEngine:engine,hashSchema:schema,lastSyncedHash:"baseline",appliedRevision:7};

assert.equal(shouldFetch("poll",{revision:7},baseline),false,"unchanged poll stays metadata-only");
assert.equal(shouldFetch("focus",{revision:7},baseline),false,"unchanged focus stays metadata-only");
assert.equal(shouldFetch("visible",{revision:8},baseline),true,"new remote revision fetches full state");
assert.equal(shouldFetch("poll",null,baseline),true,"missing metadata fails closed to full state");
assert.equal(shouldFetch("poll",{revision:7},{...baseline,lastSyncedHash:""}),true,"unverified baseline fetches full state");
assert.equal(shouldFetch("local-save",{revision:7},baseline),true,"lifecycle gate never skips local-save reads by itself");
assert.equal(shouldFetch("view-home",{revision:7},baseline),false,"unchanged data-heavy view re-check stays metadata-only");
assert.equal(shouldFetch("view-asset",{revision:8},baseline),true,"view re-check fetches full state on a new remote revision");
assert.equal(shouldFetch("view-investment",null,baseline),true,"view re-check fails closed without metadata");
assert.equal(shouldFetch("manual",{revision:7},baseline),true,"manual sync keeps full verification");

const cache={userId:"u",revision:7,hash:"baseline"};
assert.equal(canUseCache("local-save",{revision:7},baseline,cache,"u"),true,"unchanged remote save reuses verified memory row");
assert.equal(canUseCache("queued",{revision:7},baseline,cache,"u"),true,"queued save reuses verified memory row");
assert.equal(canUseCache("local-save",{revision:8},baseline,cache,"u"),false,"remote revision change forces full read");
assert.equal(canUseCache("local-save",null,baseline,cache,"u"),false,"missing metadata forces full read");
assert.equal(canUseCache("local-save",{revision:7},baseline,null,"u"),false,"missing memory row forces full read");
assert.equal(canUseCache("local-save",{revision:7},baseline,{...cache,hash:"other"},"u"),false,"hash mismatch forces full read");
assert.equal(canUseCache("local-save",{revision:7},baseline,{...cache,revision:6},"u"),false,"stale memory row forces full read");
assert.equal(canUseCache("local-save",{revision:7},baseline,cache,"someone-else"),false,"other account forces full read");
assert.equal(canUseCache("local-save",{revision:7},{...baseline,lastSyncedHash:""},cache,"u"),false,"unverified baseline forces full read");
assert.equal(canUseCache("manual",{revision:7},baseline,cache,"u"),false,"manual sync keeps full read");
assert.equal(canUseCache("poll",{revision:7},baseline,cache,"u"),false,"poll path is unchanged");

const cycle=source.slice(source.indexOf("async function cloudSyncCycle"),source.indexOf("function cloudBindLifecycle"));
assert.ok(cycle.indexOf("await cloudFetchMeta()")<cycle.indexOf("await cloudReadRow()"),"metadata gate precedes full-state read");
assert.ok(cycle.includes("cloudIsLifecycleCheck(reason)"),"cycle uses the shared lifecycle gate");
assert.match(cycle,/localClean=!\/\^view-\/\.test\(reason\)\|\|/,"view re-check still syncs when this device has unsynced changes");
assert.match(cycle,/cloudCanUseVerifiedRemote\(reason,remoteMeta,cloudMeta\(\),cache,cloudUser\?\.id\)/,"save path is gated by the verified-remote helper");
const push=source.slice(source.indexOf("async function cloudPushLocalRow"),source.indexOf("function cloudSyncDecision"));
const pushUpdate=push.match(/\.update\([^\n]*?\.select\("([^"]*)"\)/);
assert.ok(pushUpdate,"push update select is present");
assert.doesNotMatch(pushUpdate[1],/\bstate\b/,"push update does not echo the full state");
assert.match(push,/\.eq\("revision",expectedRevision\)/,"optimistic revision lock is kept");
assert.match(push,/writtenRevision!==expectedRevision\+1/,"revision +1 verification is kept");
assert.match(source,/function cloudStopAutoSync\([^)]*\)\{\s*cloudAutoSyncReady=false;cloudVerifiedRemote=null;/,"stopping sync drops the memory row");
assert.doesNotMatch(source,/(setItem|cloudSaveJson|sessionStorage|indexedDB)[^\n]*cloudVerifiedRemote/,"verified row is never persisted");
const metaReader=source.slice(source.indexOf("async function cloudFetchMeta"),source.indexOf("async function initCloudBridge"));
assert.match(metaReader,/select\("revision,updated_at,device"\)/,"metadata query excludes state");
assert.doesNotMatch(metaReader,/select\("state,/,"metadata query must not include state");
const protectedKey=["hani","os","life","v23"].join("_");
assert.ok(source.includes(`const STORAGE_KEY="${protectedKey}"`),"protected storage key is unchanged");
assert.match(source,/const VERSION="2\.9\.15-safe-baseline-bootstrap"/,"internal data version is unchanged");
assert.match(source,/const HANI_DISPLAY_VERSION="2\.9\.\d+"/,"runtime display version is present (bumped by the release train)");

console.log("HANI Cloud Egress Sync: PASS");
