import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";

const contract = JSON.parse(fs.readFileSync(new URL("../dev-center/one-pass-gate-contract.json", import.meta.url), "utf8"));
const packagePath = process.argv[2];
if (!packagePath) throw new Error("Usage: node scripts/hani-deploy-package-intake-test.mjs PACKAGE.json");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const source = fs.readFileSync(new URL("../hani-main.js", import.meta.url), "utf8");
const names = [
  "deployNormalizeReleasePath", "deployPackagePathAllowed", "deploySha256Bytes",
  "deployPackageHash", "deployCenterReadPackage",
];
const snippets = names.map(name => {
  const line = source.split(/\r?\n/).find(line => line.startsWith(`function ${name}(`) || line.startsWith(`async function ${name}(`));
  assert.ok(line, `missing ${name}`);
  return line;
});
const fields = new Map();
const element = id => {
  if (!fields.has(id)) fields.set(id, { className: "", textContent: "", innerHTML: "" });
  return fields.get(id);
};
const context = vm.createContext({
  atob, TextEncoder, Uint8Array, crypto: webcrypto,
  DEPLOY_PACKAGE_FORMAT: "HANI_MODULAR_RELEASE_PACKAGE_V1",
  DEPLOY_REQUIRED_STORAGE_KEY: ["hani", "os", "life", "v23"].join("_"),
  DEPLOY_REQUIRED_INTERNAL_VERSION: "2.9.15-safe-baseline-bootstrap",
  $: element, haniWorkShow() {}, haniWorkFinish() {}, haniWorkHide() {},
  deployFmtBytes: n => String(n), deployShortSha: s => String(s).slice(0, 12), deployCenterRender() {}, esc: String,
});
vm.runInContext(`let deployPackageCandidate=null;\n${snippets.join("\n")}`, context);
await vm.runInContext("deployCenterReadPackage", context)({ text: async () => JSON.stringify(pkg), name: "candidate.json" });
const result = vm.runInContext("deployPackageCandidate", context);
assert.ok(result, element("deployPackageResult").textContent);
assert.equal(result.files.length, pkg.files.length);
assert.equal(result.package_sha256, pkg.package_sha256);
assert.equal(result.candidate_sha, pkg.candidate_sha);
assert.equal(result.base_main_sha, pkg.base_main_sha);
assert.equal(result.gate_contract_sha256, pkg.gate_contract_sha256);
assert.ok(result.files.some(file => file.encoding === "base64"));

const tampered = structuredClone(pkg);
tampered.files.find(file => file.encoding === "base64").content += "AA==";
await vm.runInContext("deployCenterReadPackage", context)({ text: async () => JSON.stringify(tampered), name: "tampered.json" });
assert.equal(vm.runInContext("deployPackageCandidate", context), null);
assert.equal(element("deployPackageSha").textContent, "FAIL");
const tooMany=structuredClone(pkg);
while(tooMany.files.length<=contract.limits.max_files)tooMany.files.push({path:`assets/qa-limit-${tooMany.files.length}.png`,encoding:'base64',content:'AA=='});
await vm.runInContext("deployCenterReadPackage",context)({text:async()=>JSON.stringify(tooMany),name:'too-many.json'});
assert.equal(vm.runInContext('deployPackageCandidate',context),null);
assert.match(element('deployPackageResult').textContent,/파일 수/);
const tooLarge=structuredClone(pkg);
tooLarge.package_sha256="";
tooLarge.files.find(f=>f.encoding==='base64').content=Buffer.alloc(contract.limits.max_single_file_bytes+1).toString('base64');
await vm.runInContext('deployCenterReadPackage',context)({text:async()=>JSON.stringify(tooLarge),name:'single-overflow.json'});
assert.equal(vm.runInContext('deployPackageCandidate',context),null);
assert.match(element('deployPackageResult').textContent,/単一|단일 파일/);
const totalOverflow=structuredClone(pkg);
totalOverflow.package_sha256="";
const sizes=await vm.runInContext('deployPackageHash',context)(totalOverflow.files);
const image=totalOverflow.files.find(f=>f.encoding==='base64');
const grown=Buffer.from(image.content,'base64').length+contract.limits.max_total_bytes-sizes.total_bytes+1;
assert.ok(grown<=contract.limits.max_single_file_bytes);
image.content=Buffer.alloc(grown).toString('base64');
await vm.runInContext('deployCenterReadPackage',context)({text:async()=>JSON.stringify(totalOverflow),name:'total-overflow.json'});
assert.equal(vm.runInContext('deployPackageCandidate',context),null);
assert.match(element('deployPackageResult').textContent,/총 크기/);
console.log(`PASS: ${pkg.files.length}-file binary package intake, tamper, file-count, single-file and total-size blocks`);
