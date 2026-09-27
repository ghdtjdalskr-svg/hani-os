import assert from "node:assert/strict";
import fs from "node:fs";

const source=fs.readFileSync(new URL("../hani-main.js",import.meta.url),"utf8");
const engine=Number(source.match(/const CLOUD_SYNC_ENGINE=(\d+)/)?.[1]);
const schema=Number(source.match(/const CLOUD_HASH_SCHEMA=(\d+)/)?.[1]);
const helperStart=source.indexOf("function cloudShouldFetchFullState(");
const helperEnd=source.indexOf("async function cloudSyncCycle",helperStart);
assert.ok(helperStart>0&&helperEnd>helperStart,"metadata gate helper is present");

const helperSource=source.slice(helperStart,helperEnd);
const buildHelper=new Function("CLOUD_SYNC_ENGINE","CLOUD_HASH_SCHEMA","cloudMeta",`${helperSource}; return cloudShouldFetchFullState;`);
const shouldFetch=buildHelper(engine,schema,()=>({}));
const baseline={syncEngine:engine,hashSchema:schema,lastSyncedHash:"baseline",appliedRevision:7};

assert.equal(shouldFetch("poll",{revision:7},baseline),false,"unchanged poll stays metadata-only");
assert.equal(shouldFetch("focus",{revision:7},baseline),false,"unchanged focus stays metadata-only");
assert.equal(shouldFetch("visible",{revision:8},baseline),true,"new remote revision fetches full state");
assert.equal(shouldFetch("poll",null,baseline),true,"missing metadata fails closed to full state");
assert.equal(shouldFetch("poll",{revision:7},{...baseline,lastSyncedHash:""}),true,"unverified baseline fetches full state");
assert.equal(shouldFetch("local-save",{revision:7},baseline),true,"local writes retain full conflict verification");

const cycle=source.slice(source.indexOf("async function cloudSyncCycle"),source.indexOf("function cloudBindLifecycle"));
assert.ok(cycle.indexOf("await cloudFetchMeta()")<cycle.indexOf("await cloudReadRow()"),"metadata gate precedes full-state read");
const metaReader=source.slice(source.indexOf("async function cloudFetchMeta"),source.indexOf("async function initCloudBridge"));
assert.match(metaReader,/select\("revision,updated_at,device"\)/,"metadata query excludes state");
assert.doesNotMatch(metaReader,/select\("state,/,"metadata query must not include state");
const protectedKey=["hani","os","life","v23"].join("_");
assert.ok(source.includes(`const STORAGE_KEY="${protectedKey}"`),"protected storage key is unchanged");
assert.match(source,/const VERSION="2\.9\.15-safe-baseline-bootstrap"/,"internal data version is unchanged");
assert.match(source,/const HANI_DISPLAY_VERSION="2\.9\.141"/,"runtime display version is updated");

console.log("HANI Cloud Egress Sync: PASS");
