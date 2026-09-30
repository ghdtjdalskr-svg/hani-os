import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../supabase/functions/hani-deploy-bridge/index.ts", import.meta.url), "utf8");
const begin = source.indexOf('    if (action === "qa_existing_pr") {');
const end = source.indexOf('    if (action === "pending_release") {', begin);
assert.ok(begin >= 0 && end > begin, "read-only action not found");
const body = source.slice(begin, end);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const sha = "a".repeat(40), base = "b".repeat(40), hash = "c".repeat(64), contract = "d".repeat(64);
const input = () => ({
  pr_number: 126, candidate_sha: sha, expected_main_sha: base,
  package_sha256: hash, package_paths: ["index.html", "hani-main.js"],
  gate_contract_version: "2.0.0", gate_contract_sha256: contract,
  preflight_state: "PASS",
});
async function run(payload, overrides = {}) {
  let mainReads = 0, qaCalls = 0;
  const deps = {
    action: "qa_existing_pr", payload, githubToken: "test-token",
    GATE_CONTRACT_VERSION: "2.0.0", GATE_CONTRACT_SHA256: contract,
    MAX_RELEASE_FILES: 81, TARGET_PATH: "index.html", BASE_BRANCH: "main",
    GITHUB_OWNER: "ghdtjdalskr-svg", GITHUB_REPO: "hani-os",
    cleanText: (value, max = 500) => String(value ?? "").trim().slice(0, max),
    normalizeReleasePath: value => String(value ?? "").trim().replaceAll("\\", "/"),
    isAllowedReleasePath: path => ["index.html", "hani-main.js"].includes(path),
    getPullRequest: async () => ({ state: "open", base: { ref: "main" }, head: { ref: "hani/monthly-report-editorial", sha, repo: { full_name: "ghdtjdalskr-svg/hani-os" } } }),
    getMainRef: async () => ({ object: { sha: ++mainReads && base } }),
    getPullRequestFiles: async () => [{ filename: "index.html", status: "modified" }],
    releaseFilePolicy: () => ({ ok: true, paths: ["index.html"] }),
    runtimePackagePaths: async () => ["index.html", "hani-main.js"],
    packageSnapshot: async () => ({ package_sha256: hash }),
    runHinaModularQa: async () => { qaCalls++; return { ok: true, state: "HINA_QA_PASS" }; },
    json: (value, status = 200) => ({ status, ...value }),
    ...overrides,
  };
  const names = Object.keys(deps);
  const fn = new AsyncFunction(...names, body);
  const result = await fn(...names.map(name => deps[name]));
  return { result, qaCalls };
}

let check = await run(input());
assert.equal(check.result.status, 200);
assert.equal(check.result.state, "HINA_QA_PASS");
assert.equal(check.qaCalls, 1);
check = await run({ ...input(), candidate_sha: "e".repeat(40) });
assert.equal(check.result.status, 409);
assert.equal(check.qaCalls, 0);
check = await run({ ...input(), gate_contract_sha256: "e".repeat(64) });
assert.equal(check.result.status, 400);
check = await run(input(), { releaseFilePolicy: () => ({ ok: true, paths: ["unexpected.js"] }) });
assert.equal(check.result.status, 409);
check = await run(input(), { packageSnapshot: async () => ({ package_sha256: "e".repeat(64) }) });
assert.equal(check.result.status, 409);
let count = 0;
check = await run(input(), { getMainRef: async () => ({ object: { sha: ++count === 1 ? base : "e".repeat(40) } }) });
assert.equal(check.result.status, 409);
let prReads = 0;
check = await run(input(), { getPullRequest: async () => ({ state: "open", base: { ref: "main" }, head: { ref: "hani/monthly-report-editorial", sha: ++prReads === 1 ? sha : "e".repeat(40), repo: { full_name: "ghdtjdalskr-svg/hani-os" } } }) });
assert.equal(check.result.status, 409);
console.log("PASS: existing PR read-only QA accepts frozen identity and blocks drift/tamper");
