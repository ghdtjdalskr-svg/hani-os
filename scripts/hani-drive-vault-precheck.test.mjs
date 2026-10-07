import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import { inspectHaniBackupBuffer } from "./hani-drive-vault-precheck.mjs";

function backup(overrides = {}) {
  const exportedAt = "2026-10-07T00:00:00.000Z";
  return {
    version: "2.9.15-safe-baseline-bootstrap",
    exportedAt,
    _haniBackup: {
      app: "HANI OS Life Edition",
      format: 1,
      version: "2.9.15-safe-baseline-bootstrap",
      storageKey: "hani_os_life_v23",
      exportedAt
    },
    accounts: [{ id: "synthetic-account", name: "Synthetic", openingCash: 0 }],
    instruments: [{ id: "synthetic-instrument", name: "Synthetic Asset" }],
    transactions: [],
    books: [{ id: "synthetic-book", title: "Synthetic Book" }],
    movies: [],
    body: [],
    exercise: [],
    goalRegistry: [{ goal_id: "synthetic-goal", revision: 1 }],
    ...overrides
  };
}

function buffer(value) {
  return Buffer.from(JSON.stringify(value, null, 2), "utf8");
}

const valid = inspectHaniBackupBuffer(buffer(backup()), { fileName: "HANI_OS_backup_synthetic.json" });
assert.equal(valid.ok, true);
assert.equal(valid.kind, "current");
assert.equal(valid.storageKeyMatches, true);
assert.equal(valid.driveApiUsed, false);
assert.equal(valid.restoreExecuted, false);
assert.equal(valid.storageWriteRequired, false);
assert.match(valid.sha256, /^[0-9a-f]{64}$/);
assert.deepEqual(valid.summary, {
  accounts: 1,
  instruments: 1,
  transactions: 0,
  monthlySnapshots: 0,
  ledgers: 0,
  books: 1,
  movies: 0,
  diaries: 0,
  travelTrips: 0,
  travelPlaces: 0,
  goals: 1
});

const legacy = inspectHaniBackupBuffer(buffer({
  accounts: [{ id: "brokerage", type: "위탁" }],
  assets: [{ id: "asset-1", name: "Legacy Asset" }],
  trades: [],
  cash: []
}));
assert.equal(legacy.kind, "v22");
assert.deepEqual(legacy.warnings, ["MISSING_HANI_BACKUP_METADATA"]);

assert.throws(() => inspectHaniBackupBuffer(Buffer.from("{broken")), /INVALID_JSON/);
assert.throws(() => inspectHaniBackupBuffer(buffer({ accounts: [] })), /UNKNOWN_HANI_BACKUP_CONTRACT/);
assert.throws(() => inspectHaniBackupBuffer(buffer(backup({ books: [null] }))), /INVALID_RECORD_LIST:books/);
assert.throws(() => inspectHaniBackupBuffer(buffer(backup({ oauth: { access_token: "ya29.synthetic-token-value-that-looks-real" } }))), /SECRET_LIKE_CONTENT_REJECTED/);
assert.throws(() => inspectHaniBackupBuffer(buffer(backup({ supabase: { service_role: "sb_secret_synthetic_token_value_1234567890" } }))), /SECRET_LIKE_CONTENT_REJECTED/);

assert.throws(()=>inspectHaniBackupBuffer(buffer(backup({
  _haniBackup: {
    app: "HANI OS Life Edition",
    format: 1,
    version: "2.9.15-safe-baseline-bootstrap",
    storageKey: "wrong_key",
    exportedAt: "2026-10-07T00:00:00.000Z"
  }
}))),/UNSUPPORTED_BACKUP_METADATA/);
assert.throws(()=>inspectHaniBackupBuffer(buffer(backup({version:'future-version'}))),/UNSUPPORTED_BACKUP_VERSION/);
assert.throws(()=>inspectHaniBackupBuffer(buffer(backup({_haniBackup:{format:2,storageKey:'hani_os_life_v23'}}))),/UNSUPPORTED_BACKUP_METADATA/);
assert.throws(()=>inspectHaniBackupBuffer(buffer(backup({oauth:{accessToken:'synthetic'}}))),/SECRET_LIKE_CONTENT_REJECTED/);
const privateFixture=backup({profile:{name:'PRIVATE_TEST_NAME'}}),before=JSON.stringify(privateFixture);
assert(!JSON.stringify(inspectHaniBackupBuffer(buffer(privateFixture))).includes('PRIVATE_TEST_NAME'));
assert.equal(JSON.stringify(privateFixture),before);
assert.throws(()=>inspectHaniBackupBuffer(Buffer.alloc(30*1024*1024+1)),/BACKUP_TOO_LARGE/);
const deep={};let cursor=deep;for(let i=0;i<140;i++){cursor.next={};cursor=cursor.next}
assert.throws(()=>inspectHaniBackupBuffer(buffer(backup({deep}))),/BACKUP_TOO_DEEP/);
assert.throws(()=>inspectHaniBackupBuffer(buffer({accounts:[],assets:[],cash:[null]})),/INVALID_LEGACY_LIST/);
const temp=await mkdtemp(join(tmpdir(),'hani-precheck-test-'));
try{
 const file=join(temp,'합성 백업.json'),original=buffer(backup());await writeFile(file,original);
 const cli=spawnSync(process.execPath,[fileURLToPath(new URL('./hani-drive-vault-precheck.mjs',import.meta.url)),file],{encoding:'utf8'});
 assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).fileName,'합성 백업.json');assert.deepEqual(await readFile(file),original);
 await writeFile(file,'{invalid');const invalid=spawnSync(process.execPath,[fileURLToPath(new URL('./hani-drive-vault-precheck.mjs',import.meta.url)),file],{encoding:'utf8'});assert.equal(invalid.status,1);assert.equal(JSON.parse(invalid.stderr).reason,'INVALID_JSON');
}finally{await rm(temp,{recursive:true,force:true})}

console.log("PASS drive vault precheck: current/v22 backup metadata, sha256/size summary, malformed rejection, protected-list rejection, token/secret rejection, no Drive/API/restore/write side effects.");
