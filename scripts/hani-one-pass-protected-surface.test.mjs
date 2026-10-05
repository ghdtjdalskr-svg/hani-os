import assert from "node:assert/strict";
import {protectedSurface} from "./hani-one-pass-rules.mjs";

const contract={required_storage_key:"hani_os_life_v23",required_internal_version:"2.9.15-safe-baseline-bootstrap"};
const scan=source=>protectedSurface(`const STORAGE_KEY="hani_os_life_v23";const VERSION="2.9.15-safe-baseline-bootstrap";\n${source}`,contract);

for(const source of [
  "localStorage.setItem(STORAGE_KEY, payload)",
  "localStorage [ 'setItem' ] ( STORAGE_KEY , payload )",
  "window.localStorage.setItem('hani_os_life_v23', payload)",
  "window['localStorage']['setItem']('hani_os_life_v23', payload)",
  "const store = window.localStorage; store.setItem(STORAGE_KEY, payload)",
  "const store = localStorage; const protectedStore = store; protectedStore['setItem'](STORAGE_KEY, payload)"
])assert.equal(scan(source).storage_writes,1,`must detect protected write: ${source}`);

for(const source of [
  "localStorage.removeItem(STORAGE_KEY)",
  "const store=window['localStorage']; store['removeItem']('hani_os_life_v23')"
])assert.equal(scan(source).storage_removes,1,`must detect protected removal: ${source}`);

assert.equal(scan("const store=localStorage; store.clear()").storage_clears,1);
assert.equal(scan("localStorage.setItem('unrelated_key', payload)").storage_writes,0,"unrelated keys are not protected writes");
assert.equal(scan("// localStorage.setItem(STORAGE_KEY, payload)").storage_writes,0,"comments do not create a write surface");
assert.equal(scan("client . from ( 'hani_state' )\n . upsert ( payload )").cloud_writes,1);
assert.equal(scan("client['from']('hani_state')['update'](payload)").cloud_writes,1);

console.log("PASS: protected surface detects formatting, bracket notation, aliases, removals, clear and Cloud mutations.");
