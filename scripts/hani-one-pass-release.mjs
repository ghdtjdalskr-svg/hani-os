#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import contract from "../dev-center/one-pass-gate-contract.json" with { type: "json" };
import { contractHash, evaluatePackage } from "./hani-one-pass-rules.mjs";

const root=path.resolve(import.meta.dirname,"..");const argv=process.argv.slice(2);const option=(n,d="")=>{const i=argv.indexOf(n);return i<0?d:argv[i+1]};
const git=args=>execFileSync("git",args,{cwd:root,encoding:"utf8",maxBuffer:100*1024*1024}).trim();
const readRef=(ref,file)=>execFileSync("git",["show",`${ref}:${file}`],{cwd:root,encoding:"utf8",maxBuffer:100*1024*1024});
function load(file){return JSON.parse(fs.readFileSync(path.resolve(file),"utf8"));}
function run(pkg,productionVersion,baselineOnly=false){
  if(pkg.gate_contract_version!==contract.contract_version||pkg.gate_contract_sha256!==contractHash(contract))throw new Error("gate-contract version/hash mismatch");
  const currentMain=git(["rev-parse",option("--base","origin/main")]);if(currentMain!==pkg.base_main_sha)throw new Error(`current main baseline drift: ${currentMain} != ${pkg.base_main_sha}`);
  const baseFiles=pkg.files.filter(f=>/\.(?:html|js|css)$/i.test(f.path)).map(f=>{try{return readRef(pkg.base_main_sha,f.path)}catch{return ""}}).join("\n");
  const runtimePaths=new Set(pkg.files.map(f=>f.path));const changed=git(["diff","--name-only",pkg.base_main_sha,pkg.candidate_sha]).split("\n").filter(Boolean);baselineOnly=baselineOnly||!changed.some(file=>runtimePaths.has(file));
  productionVersion=productionVersion||(baseFiles.match(/HANI_DISPLAY_VERSION\s*=\s*["'](\d+\.\d+\.\d+)/)||[])[1]||"";
  const result=evaluatePackage({pkg,baseFiles,productionVersion,contract,baselineOnly});
  const evidence={contract_version:contract.contract_version,gate_contract_sha256:contractHash(contract),release_kind:baselineOnly?"DEV_TOOLING_ONLY":"RUNTIME",candidate_sha:pkg.candidate_sha,base_main_sha:pkg.base_main_sha,package_sha256:pkg.package_sha256,preflight_state:result.ok?"PASS":"BLOCKED",hina_equivalent_state:baselineOnly?"N/A_DEV_TOOLING":result.ok?"PASS":"BLOCKED",queue_state:baselineOnly?"N/A_DEV_TOOLING":result.ok?"READY":"BLOCKED",manual_preview_required:!baselineOnly,checks:result.checks};
  process.stdout.write(`${JSON.stringify(evidence,null,2)}\n`);if(!result.ok)process.exitCode=2;return evidence;
}
async function selfTest(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"hani-one-pass-"));const candidate=git(["rev-parse","HEAD"]),base=git(["rev-parse","origin/main"]);const packageFile=path.join(temp,"release.json");
  execFileSync(process.execPath,[path.join(root,"scripts/hani-release-package.mjs"),"build","--candidate",candidate,"--base",base,"--output",packageFile],{cwd:root,stdio:"ignore"});const normal=load(packageFile);
  const baseline=JSON.parse(JSON.stringify(normal));baseline.candidate_sha=candidate===base?"f".repeat(40):candidate;baseline.base_main_sha=base;
  const productionVersion=(normal.files.find(f=>f.path==="hani-main.js")?.content.match(/HANI_DISPLAY_VERSION\s*=\s*["']([^"']+)/)||[])[1]||"2.9.90";
  const first=evaluatePackage({pkg:baseline,baseFiles:normal.files.map(f=>f.content||"").join("\n"),productionVersion,contract,baselineOnly:true});
  if(!first.ok)throw new Error(`production baseline regression failed: ${JSON.stringify(first.checks.filter(x=>x.status==="BLOCKED"))}`);
  const secondFile=path.join(temp,"release-second.json");execFileSync(process.execPath,[path.join(root,"scripts/hani-release-package.mjs"),"build","--candidate",candidate,"--base",base,"--output",secondFile],{cwd:root,stdio:"ignore"});const deterministic=load(secondFile);if(normal.package_sha256!==deterministic.package_sha256)throw new Error("deterministic hash failed");
  const missing=JSON.parse(JSON.stringify(normal));missing.files=missing.files.filter(f=>f.path!=="hani-main.js");const missingResult=evaluatePackage({pkg:missing,baseFiles:"",productionVersion:"2.9.89",contract});if(!missingResult.checks.some(x=>x.id==="runtime_closure"&&x.status==="BLOCKED"))throw new Error("missing fixture did not block");
  const same=evaluatePackage({pkg:normal,baseFiles:normal.files.map(f=>f.content||"").join("\n"),productionVersion,contract});if(!same.checks.find(x=>x.id==="version_forward"&&x.status==="BLOCKED"))throw new Error("same-version fixture did not block");
  const tampered=JSON.parse(JSON.stringify(normal));tampered.files[0].content+=" ";if(evaluatePackage({pkg:tampered,baseFiles:"",productionVersion:"2.9.89",contract}).checks.find(x=>x.id==="package_integrity").status!=="BLOCKED")throw new Error("tamper fixture did not block");
  const protectedFixture=JSON.parse(JSON.stringify(normal));const main=protectedFixture.files.find(f=>f.path==="hani-main.js");main.content=main.content.replace('const STORAGE_KEY="hani_os_life_v23"','const STORAGE_KEY="changed_key"');const protectedResult=evaluatePackage({pkg:protectedFixture,baseFiles:normal.files.map(f=>f.content||"").join("\n"),productionVersion:"2.9.89",contract});if(protectedResult.checks.find(x=>x.id==="protected_write_surface").status!=="BLOCKED")throw new Error("protected fixture did not block");
  process.stdout.write(JSON.stringify({state:"PASS",tests:["production baseline","missing file block","same version block","frozen hash tamper block","protected invariant block","deterministic Package SHA"]},null,2)+"\n");
}
try{if(argv[0]==="--self-test")await selfTest();else run(load(option("--package")),option("--production-version"));}catch(e){process.stderr.write(JSON.stringify({state:"BLOCKED",error:e.message})+"\n");process.exitCode=2;}
