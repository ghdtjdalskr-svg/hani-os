#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectReferences, isTextArtifact, resolveRuntimeClosure } from "./hani-runtime-closure.mjs";
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
  const bridge = await import("../supabase/functions/hani-deploy-bridge/runtime-closure.ts");
  const canonicalSource = fs.readFileSync(new URL("./hani-runtime-closure.mjs", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  const bridgeSource = fs.readFileSync(new URL("../supabase/functions/hani-deploy-bridge/runtime-closure.ts", import.meta.url), "utf8").replace(/\r\n/g, "\n").split("\n").slice(2).join("\n");
  assert.equal(bridgeSource, canonicalSource, "Node/bridge closure algorithms must remain identical");
  const manifest = {
    id: "./", name: "HANI OS", short_name: "HANI OS", start_url: "./?source=pwa", scope: "./",
    display: "standalone", orientation: "any", background_color: "#f8f7f4", lang: "ko",
    icons: [
      { src: "./assets/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "./assets/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "./assets/pwa/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
  const icons = manifest.icons.map(icon => icon.src.slice(2)).sort();
  const extensions = "png jpg jpeg webp svg gif ico json js mjs cjs css html htm webmanifest woff woff2 ttf otf eot mp3 mp4 wav ogg webm".split(" ");
  const jsonPaths = [...extensions.map(ext => `asset.${ext}`), "./relative", "../parent.json", "assets/no-extension", "data/no-extension", "js/no-extension", "assets/ICON.PNG?v=2#icon"];
  const metadata = ["192x192", "512x512", "any", "HANI OS", "image/png", "ko", "maskable", "standalone", "application/json", "text/css", "font/woff2", "https://example.com/a.png", "custom:asset.png", "//example.com/a.png", "/absolute.png", "#theme", "data:image/png;base64,AA==", "blob:asset.png", "has space.png", " assets/a.png", "assets/a.png\n", "./", "../", "./?source=pwa", "assets/", "file.unknown", "v2.9.212"];
  for (const collect of [collectReferences, bridge.collectReferences]) {
    assert.deepEqual(collect("manifest.webmanifest", Buffer.from(JSON.stringify(manifest))), icons, "manifest collects only its icon files");
    assert.deepEqual(collect("manifest.webmanifest", JSON.stringify({ ...manifest, name: "metadata.json", start_url: "./index.html?source=pwa", scope: "./app/" })), [...icons, "index.html"].sort(), "file start_url is collected, metadata is ignored");
    for (const start_url of ["./?source=pwa", "./app/", "./app", "https://example.com/index.html"]) {
      assert.deepEqual(collect("manifest.webmanifest", JSON.stringify({ ...manifest, start_url })), icons, "non-file start_url is ignored");
    }
    assert.deepEqual(collect("data/nested.json", JSON.stringify({ nested: [jsonPaths, { ignored: metadata }], count: 12, empty: null })), [...extensions.map(ext => `data/asset.${ext}`), "data/relative", "parent.json", "data/assets/no-extension", "data/data/no-extension", "data/js/no-extension", "data/assets/ICON.PNG"].sort(), "nested JSON preserves actual local references");
    assert.deepEqual(collect("data.json", "invalid json"), [], "invalid JSON remains caller-owned");
    assert.deepEqual(collect("index.html", '<link rel="icon" href="icon.png"><script src="./app.js?v=1"></script><img src="https://example.com/image.png">'), ["app.js"], "HTML behavior is unchanged");
    assert.deepEqual(collect("app.js", 'import "./module.mjs"; import("./lazy.js"); new URL("./image.png", import.meta.url); fetch("./data.json");'), ["data.json", "image.png", "lazy.js", "module.mjs"], "JS behavior is unchanged");
    assert.deepEqual(collect("app.css", '@import "./theme.css"; a{background:url("./image.png")}'), ["image.png", "theme.css"], "CSS behavior is unchanged");
  }
  const pwaFixture = new Map([["index.html", '<link rel="manifest" href="./manifest.webmanifest">'], ["manifest.webmanifest", JSON.stringify(manifest)], ...icons.map(file => [file, Buffer.from([1, 2, 3])])]);
  for (const resolve of [resolveRuntimeClosure, bridge.resolveRuntimeClosure]) {
    const result = await resolve({ exists: file => pwaFixture.has(file), read: file => pwaFixture.get(file) });
    assert.deepEqual(result.files, [...pwaFixture.keys()].sort());
    assert.deepEqual(result.missing, []);
    const absent = icons[0];
    const blocked = await resolve({ exists: file => file !== absent && pwaFixture.has(file), read: file => pwaFixture.get(file) });
    assert.deepEqual(blocked.missing, [{ path: absent, referenced_by: "manifest.webmanifest" }], "missing manifest icon still blocks");
  }
  const current = await closure(git(["rev-parse", candidate]).trim());
  failMissing(current.missing);
  const fixture = new Map([["index.html", Buffer.from('<link href="./a.css"><script src="./a.js"></script>')], ["a.css", Buffer.from('body{background:url("img.png")}')], ["a.js", Buffer.from('import("./b.js")')], ["b.js", Buffer.from('fetch("data.json")')], ["data.json", Buffer.from('{"nested":[{"image":"img.png","next":"./more.json"}],"title":"HANI OS"}')], ["more.json", Buffer.from('{}')], ["img.png", Buffer.from([1, 2, 3])]]);
  const recursive = await resolveRuntimeClosure({ exists: f => fixture.has(f), read: f => fixture.get(f) });
  if (recursive.missing.length || recursive.files.length !== fixture.size) throw new Error("Recursive closure test failed.");
  fixture.delete("b.js");
  const blocked = await resolveRuntimeClosure({ exists: f => fixture.has(f), read: f => fixture.get(f) });
  if (!blocked.missing.some(x => x.path === "b.js")) throw new Error("Missing dependency did not block.");
  fixture.set("b.js", Buffer.from('fetch("data.json")'));
  fixture.delete("more.json");
  const missingJson = await resolveRuntimeClosure({ exists: f => fixture.has(f), read: f => fixture.get(f) });
  assert.ok(missingJson.missing.some(x => x.path === "more.json" && x.referenced_by === "data.json"), "missing nested JSON file still blocks");
  process.stdout.write(`PASS Node/bridge parity, manifest icons/file start_url, JSON paths/metadata, unchanged HTML/JS/CSS, runtime closure (${current.files.length} current files), recursive assets, missing-file blocks\n`);
} else throw new Error(`Unknown command: ${command}`);
