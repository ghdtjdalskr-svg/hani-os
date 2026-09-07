#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isTextArtifact, resolveRuntimeClosure } from "./hani-runtime-closure.mjs";
import contract from "../dev-center/one-pass-gate-contract.json" with { type: "json" };
import { contractHash } from "./hani-one-pass-rules.mjs";

const FORMAT = contract.package_format;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const option = (name, fallback = "") => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const command = args[0] || "build";
const git = argv => execFileSync("git", argv, { cwd: root, encoding: argv.includes("--binary") ? null : "utf8", maxBuffer: 100 * 1024 * 1024 });
const sha256 = value => createHash("sha256").update(value).digest("hex");
const candidate = option("--candidate", "HEAD");

function objectExists(ref, file) {
  try { execFileSync("git", ["cat-file", "-e", `${ref}:${file}`], { cwd: root, stdio: "ignore" }); return true; } catch { return false; }
}
function objectRead(ref, file) { return execFileSync("git", ["show", `${ref}:${file}`], { cwd: root, encoding: null, maxBuffer: 100 * 1024 * 1024 }); }
function canonicalHash(files) {
  const entries = files.map(file => {
    const bytes = file.encoding === "base64" ? Buffer.from(file.content, "base64") : Buffer.from(file.content, "utf8");
    return { path: file.path, bytes: bytes.length, sha256: sha256(bytes) };
  }).sort((a, b) => a.path.localeCompare(b.path));
  return { entries, package_sha256: sha256(entries.map(e => `${e.path}\t${e.bytes}\t${e.sha256}`).join("\n")), total_bytes: entries.reduce((n, e) => n + e.bytes, 0) };
}

async function closure(ref) {
  return resolveRuntimeClosure({ exists: file => objectExists(ref, file), read: file => objectRead(ref, file) });
}
function failMissing(missing) {
  if (!missing.length) return;
  process.stderr.write(`Runtime preflight BLOCKED (${missing.length} missing):\n${missing.map(x => `- ${x.path} <- ${x.referenced_by}`).join("\n")}\n`);
  process.exit(2);
}

if (command === "build") {
  const candidateSha = git(["rev-parse", candidate]).trim();
  const base = option("--base", "origin/main");
  const baseSha = git(["rev-parse", base]).trim();
  const result = await closure(candidateSha);
  failMissing(result.missing);
  const files = result.files.map(file => {
    const bytes = result.contents.get(file);
    return isTextArtifact(file) ? { path: file, content: bytes.toString("utf8") } : { path: file, encoding: "base64", content: bytes.toString("base64") };
  });
  const hash = canonicalHash(files);
  const pkg = { format: FORMAT, gate_contract_version: contract.contract_version, gate_contract_sha256: contractHash(contract), label: option("--label", `HANI OS ${candidateSha.slice(0, 12)}`), release_notes: option("--notes", "Candidate runtime closure snapshot"), base_main_sha: baseSha, candidate_sha: candidateSha, package_sha256: hash.package_sha256, file_hashes: hash.entries, files };
  const output = path.resolve(option("--output", `hani-release-${candidateSha.slice(0, 12)}.json`));
  fs.writeFileSync(output, `${JSON.stringify(pkg, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ valid: true, output, candidate_sha: candidateSha, base_main_sha: baseSha, package_sha256: hash.package_sha256, files: files.length, total_bytes: hash.total_bytes }, null, 2)}\n`);
} else if (command === "preflight") {
  const ref = git(["rev-parse", candidate]).trim();
  const result = await closure(ref);
  failMissing(result.missing);
  process.stdout.write(`${JSON.stringify({ valid: true, candidate_sha: ref, files: result.files }, null, 2)}\n`);
} else if (command === "verify") {
  const input = path.resolve(option("--input"));
  const pkg = JSON.parse(fs.readFileSync(input, "utf8"));
  if (pkg.format !== FORMAT || pkg.gate_contract_version !== contract.contract_version || pkg.gate_contract_sha256 !== contractHash(contract) || !Array.isArray(pkg.files)) throw new Error("Invalid One-Pass package/contract.");
  const paths = pkg.files.map(f => f.path);
  if (new Set(paths).size !== paths.length) throw new Error("Duplicate package path.");
  const map = new Map(pkg.files.map(f => [f.path, f.encoding === "base64" ? Buffer.from(f.content, "base64") : Buffer.from(String(f.content), "utf8")]));
  const result = await resolveRuntimeClosure({ exists: file => map.has(file), read: file => map.get(file) });
  failMissing(result.missing);
  const hash = canonicalHash(pkg.files);
  if (hash.package_sha256 !== pkg.package_sha256) throw new Error(`Package SHA mismatch: ${hash.package_sha256}`);
  process.stdout.write(`${JSON.stringify({ valid: true, package_sha256: hash.package_sha256, files: pkg.files.length, closure_files: result.files.length }, null, 2)}\n`);
} else if (command === "test") {
  const current = await closure(git(["rev-parse", candidate]).trim());
  failMissing(current.missing);
  const fixture = new Map([["index.html", Buffer.from('<link href="./a.css"><script src="./a.js"></script>')], ["a.css", Buffer.from('body{background:url("img.png")}')], ["a.js", Buffer.from('import("./b.js")')], ["b.js", Buffer.from('fetch("data.json")')], ["data.json", Buffer.from('{}')], ["img.png", Buffer.from([1, 2, 3])]]);
  const recursive = await resolveRuntimeClosure({ exists: f => fixture.has(f), read: f => fixture.get(f) });
  if (recursive.missing.length || recursive.files.length !== fixture.size) throw new Error("Recursive closure test failed.");
  fixture.delete("b.js");
  const blocked = await resolveRuntimeClosure({ exists: f => fixture.has(f), read: f => fixture.get(f) });
  if (!blocked.missing.some(x => x.path === "b.js")) throw new Error("Missing dependency did not block.");
  process.stdout.write(`PASS runtime closure (${current.files.length} current files), recursive assets, missing-file block\n`);
} else throw new Error(`Unknown command: ${command}`);
