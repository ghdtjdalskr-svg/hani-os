#!/usr/bin/env node

import { readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";

const CONTRACT_VERSION = "1.0.0";
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const EXTERNAL_REVIEW = Object.freeze({ state: "DEFERRED", reason: "Gemini CLI unavailable" });
const FLOW_STATES = new Set([
  "PENDING_YURI", "PENDING_ARIN", "READY_FOR_HINA", "READY_FOR_PREVIEW",
  "READY_FOR_APPROVAL", "READY_FOR_MERGE", "PENDING_PRODUCTION_READBACK",
  "COMPLETE", "BLOCKED"
]);

const argv = process.argv.slice(2);
const command = argv[0] || "help";
const option = name => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : "";
};

function fail(message, code = 2) {
  const error = new Error(message);
  error.exitCode = code;
  throw error;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertSha(value, label) {
  assert(typeof value === "string" && SHA_PATTERN.test(value), `${label} must be a lowercase 40-character Git SHA.`);
}

function assertIsoOrNull(value, label) {
  assert(value === null || (typeof value === "string" && Number.isFinite(Date.parse(value))), `${label} must be null or an ISO date-time.`);
}

function assertIso(value, label) {
  assert(typeof value === "string" && Number.isFinite(Date.parse(value)), `${label} must be an ISO date-time.`);
}

function assertExactKeys(value, keys, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object.`);
  const expected = [...keys].sort();
  const actual = Object.keys(value).sort();
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} fields do not match the contract.`);
}

function readJson(file, label) {
  assert(file, `${label} path is required.`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function writeJsonAtomic(file, value) {
  assert(file, "Manifest path is required.");
  const absolute = path.resolve(file);
  const temporary = `${absolute}.tmp-${process.pid}`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(temporary, absolute);
}

function now() {
  return new Date().toISOString();
}

function createManifest({ baseSha, candidateSha, releaseKind, displayedVersion, runtimeJs }) {
  assertSha(baseSha, "base_sha");
  assertSha(candidateSha, "candidate_sha");
  assert(baseSha !== candidateSha, "base_sha and candidate_sha must identify different commits.");
  assert(["RUNTIME", "DEV_TOOLING_ONLY"].includes(releaseKind), "release_kind must be RUNTIME or DEV_TOOLING_ONLY.");
  assert(displayedVersion, "All releases require --expected-version for Production read-back.");
  assert(runtimeJs, "All releases require --expected-runtime-js for Production read-back.");
  const timestamp = now();
  return {
    contract_version: CONTRACT_VERSION,
    base_sha: baseSha,
    candidate_sha: candidateSha,
    release_kind: releaseKind,
    expected: {
      version_bump: releaseKind === "DEV_TOOLING_ONLY" ? "N/A_DEV_TOOLING" : "REQUIRED",
      displayed_version: displayedVersion,
      runtime_js: runtimeJs
    },
    external_review: { ...EXTERNAL_REVIEW },
    yuri: { state: "PENDING", base_sha: baseSha, candidate_sha: candidateSha, report_generated_at: null },
    arin: { required: false, state: "UNDETERMINED", candidate_sha: candidateSha, report_generated_at: null },
    hina: {
      state: releaseKind === "RUNTIME" ? "PENDING" : "N/A_DEV_TOOLING",
      candidate_sha: candidateSha,
      report_generated_at: null
    },
    preview: { pr_number: null, url: null, head_sha: null, approval_state: "NOT_READY" },
    production: {
      state: "PENDING",
      candidate_sha: candidateSha,
      merged_sha: null,
      pages_url: null,
      pages_accessible: null,
      displayed_version: null,
      runtime_js: null,
      smoke_state: "PENDING",
      read_back_state: "PENDING"
    },
    flow_state: "PENDING_YURI",
    created_at: timestamp,
    updated_at: timestamp
  };
}

function validateShape(manifest) {
  assertExactKeys(manifest, [
    "contract_version", "base_sha", "candidate_sha", "release_kind", "expected",
    "external_review", "yuri", "arin", "hina", "preview", "production",
    "flow_state", "created_at", "updated_at"
  ], "manifest");
  assert(manifest.contract_version === CONTRACT_VERSION, `contract_version must be ${CONTRACT_VERSION}.`);
  assertSha(manifest.base_sha, "base_sha");
  assertSha(manifest.candidate_sha, "candidate_sha");
  assert(manifest.base_sha !== manifest.candidate_sha, "base_sha and candidate_sha must identify different commits.");
  assert(["RUNTIME", "DEV_TOOLING_ONLY"].includes(manifest.release_kind), "Invalid release_kind.");
  assertExactKeys(manifest.expected, ["version_bump", "displayed_version", "runtime_js"], "expected");
  assert(["REQUIRED", "N/A_DEV_TOOLING"].includes(manifest.expected.version_bump), "Invalid expected.version_bump.");
  assert(typeof manifest.expected.displayed_version === "string" && manifest.expected.displayed_version.length > 0, "Invalid expected.displayed_version.");
  assert(typeof manifest.expected.runtime_js === "string" && manifest.expected.runtime_js.length > 0, "Invalid expected.runtime_js.");
  if (manifest.release_kind === "RUNTIME") {
    assert(manifest.expected.version_bump === "REQUIRED", "RUNTIME requires version_bump REQUIRED.");
  } else {
    assert(manifest.expected.version_bump === "N/A_DEV_TOOLING", "DEV_TOOLING_ONLY requires version_bump N/A_DEV_TOOLING.");
  }

  assertExactKeys(manifest.external_review, ["state", "reason"], "external_review");
  assert(manifest.external_review.state === EXTERNAL_REVIEW.state, "External review must remain DEFERRED; it cannot be PASS.");
  assert(manifest.external_review.reason === EXTERNAL_REVIEW.reason, "External review reason must record Gemini CLI unavailability.");

  assertExactKeys(manifest.yuri, ["state", "base_sha", "candidate_sha", "report_generated_at"], "yuri");
  assert(["PENDING", "PASS", "BLOCKED"].includes(manifest.yuri.state), "Invalid yuri.state.");
  assertSha(manifest.yuri.base_sha, "yuri.base_sha");
  assertSha(manifest.yuri.candidate_sha, "yuri.candidate_sha");
  assertIsoOrNull(manifest.yuri.report_generated_at, "yuri.report_generated_at");

  assertExactKeys(manifest.arin, ["required", "state", "candidate_sha", "report_generated_at"], "arin");
  assert(typeof manifest.arin.required === "boolean", "arin.required must be boolean.");
  assert(["UNDETERMINED", "PENDING", "PASS", "BLOCKED", "N/A"].includes(manifest.arin.state), "Invalid arin.state.");
  assertSha(manifest.arin.candidate_sha, "arin.candidate_sha");
  assertIsoOrNull(manifest.arin.report_generated_at, "arin.report_generated_at");

  assertExactKeys(manifest.hina, ["state", "candidate_sha", "report_generated_at"], "hina");
  assert(["PENDING", "PASS", "BLOCKED", "N/A_DEV_TOOLING"].includes(manifest.hina.state), "Invalid hina.state.");
  assertSha(manifest.hina.candidate_sha, "hina.candidate_sha");
  assertIsoOrNull(manifest.hina.report_generated_at, "hina.report_generated_at");

  assertExactKeys(manifest.preview, ["pr_number", "url", "head_sha", "approval_state"], "preview");
  assert(manifest.preview.pr_number === null || (Number.isInteger(manifest.preview.pr_number) && manifest.preview.pr_number > 0), "Invalid preview.pr_number.");
  assert(manifest.preview.url === null || /^https:\/\//.test(manifest.preview.url), "preview.url must be null or HTTPS.");
  if (manifest.preview.head_sha !== null) assertSha(manifest.preview.head_sha, "preview.head_sha");
  assert(["NOT_READY", "PENDING", "APPROVED", "REJECTED", "INVALIDATED"].includes(manifest.preview.approval_state), "Invalid preview.approval_state.");

  assertExactKeys(manifest.production, [
    "state", "candidate_sha", "merged_sha", "pages_url", "pages_accessible",
    "displayed_version", "runtime_js", "smoke_state", "read_back_state"
  ], "production");
  assert(["PENDING", "BLOCKED", "COMPLETE"].includes(manifest.production.state), "Invalid production.state.");
  assertSha(manifest.production.candidate_sha, "production.candidate_sha");
  if (manifest.production.merged_sha !== null) assertSha(manifest.production.merged_sha, "production.merged_sha");
  assert(manifest.production.pages_url === null || /^https:\/\//.test(manifest.production.pages_url), "production.pages_url must be null or HTTPS.");
  assert(manifest.production.pages_accessible === null || typeof manifest.production.pages_accessible === "boolean", "Invalid production.pages_accessible.");
  assert(manifest.production.displayed_version === null || typeof manifest.production.displayed_version === "string", "Invalid production.displayed_version.");
  assert(manifest.production.runtime_js === null || typeof manifest.production.runtime_js === "string", "Invalid production.runtime_js.");
  assert(["PENDING", "PASS", "BLOCKED"].includes(manifest.production.smoke_state), "Invalid production.smoke_state.");
  assert(["PENDING", "PASS", "BLOCKED"].includes(manifest.production.read_back_state), "Invalid production.read_back_state.");
  assert(FLOW_STATES.has(manifest.flow_state), "Invalid flow_state.");
  assertIso(manifest.created_at, "created_at");
  assertIso(manifest.updated_at, "updated_at");
}

function semanticProblems(manifest) {
  const problems = [];
  const same = (actual, expected, label) => {
    if (actual !== expected) problems.push(`${label} SHA mismatch.`);
  };
  same(manifest.yuri.base_sha, manifest.base_sha, "Yuri base");
  same(manifest.yuri.candidate_sha, manifest.candidate_sha, "Yuri candidate");
  same(manifest.arin.candidate_sha, manifest.candidate_sha, "Arin candidate");
  same(manifest.hina.candidate_sha, manifest.candidate_sha, "HINA candidate");
  same(manifest.production.candidate_sha, manifest.candidate_sha, "Production candidate");

  if (manifest.release_kind === "RUNTIME" && manifest.hina.state === "N/A_DEV_TOOLING") {
    problems.push("RUNTIME releases cannot mark HINA as N/A_DEV_TOOLING.");
  }
  if (manifest.release_kind === "DEV_TOOLING_ONLY" && manifest.hina.state !== "N/A_DEV_TOOLING") {
    problems.push("DEV_TOOLING_ONLY releases must keep HINA at N/A_DEV_TOOLING; this state is not PASS.");
  }

  if (manifest.arin.required && !["PENDING", "PASS", "BLOCKED"].includes(manifest.arin.state)) {
    problems.push("Arin is required and cannot be N/A or UNDETERMINED.");
  }
  if (!manifest.arin.required && !["UNDETERMINED", "N/A"].includes(manifest.arin.state)) {
    problems.push("Arin is not required and must be N/A after Yuri classification.");
  }
  if (manifest.preview.head_sha !== null && manifest.preview.head_sha !== manifest.candidate_sha) {
    problems.push("Preview head SHA mismatch invalidates approval.");
  }
  if (manifest.preview.approval_state === "APPROVED") {
    if (!manifest.preview.pr_number || !manifest.preview.url || manifest.preview.head_sha !== manifest.candidate_sha) {
      problems.push("Representative approval lacks an exact candidate Preview identity.");
    }
  }
  if (manifest.production.state === "COMPLETE") {
    if (!manifest.production.merged_sha || !manifest.production.pages_url || manifest.production.pages_accessible !== true) {
      problems.push("Production completion requires merged SHA and accessible GitHub Pages URL.");
    }
    if (!manifest.production.displayed_version || !manifest.production.runtime_js) {
      problems.push("Production completion requires displayed version and actual runtime JS read-back.");
    }
    if (manifest.production.smoke_state !== "PASS" || manifest.production.read_back_state !== "PASS") {
      problems.push("Production completion requires smoke and read-back PASS.");
    }
    if (manifest.expected.displayed_version && manifest.production.displayed_version !== manifest.expected.displayed_version) {
      problems.push("Production displayed version does not match the expected version.");
    }
    if (manifest.expected.runtime_js && manifest.production.runtime_js !== manifest.expected.runtime_js) {
      problems.push("Production runtime JS does not match the expected runtime JS.");
    }
  }
  return problems;
}

function deriveFlowState(manifest) {
  const problems = semanticProblems(manifest);
  if (problems.length) return { state: "BLOCKED", problems };
  if (manifest.yuri.state === "BLOCKED" || manifest.arin.state === "BLOCKED" || manifest.hina.state === "BLOCKED" ||
      manifest.preview.approval_state === "REJECTED" || manifest.preview.approval_state === "INVALIDATED" ||
      manifest.production.state === "BLOCKED" || manifest.production.smoke_state === "BLOCKED" || manifest.production.read_back_state === "BLOCKED") {
    return { state: "BLOCKED", problems: ["At least one required gate is BLOCKED."] };
  }
  if (manifest.yuri.state !== "PASS") return { state: "PENDING_YURI", problems: [] };
  if (manifest.arin.state === "UNDETERMINED") return { state: "BLOCKED", problems: ["Yuri result did not determine the Arin path."] };
  if (manifest.arin.required && manifest.arin.state !== "PASS") return { state: "PENDING_ARIN", problems: [] };
  if (!manifest.arin.required && manifest.arin.state !== "N/A") return { state: "BLOCKED", problems: ["Non-UI changes require the Arin N/A path."] };
  if (manifest.release_kind === "RUNTIME" && manifest.hina.state !== "PASS") return { state: "READY_FOR_HINA", problems: [] };
  if (manifest.preview.head_sha === null) return { state: "READY_FOR_PREVIEW", problems: [] };
  if (manifest.preview.approval_state !== "APPROVED") return { state: "READY_FOR_APPROVAL", problems: [] };
  if (manifest.production.merged_sha === null) return { state: "READY_FOR_MERGE", problems: [] };
  if (manifest.production.state !== "COMPLETE") return { state: "PENDING_PRODUCTION_READBACK", problems: [] };
  return { state: "COMPLETE", problems: [] };
}

function validateManifest(manifest, { requireStoredState = true } = {}) {
  validateShape(manifest);
  const derived = deriveFlowState(manifest);
  if (requireStoredState) assert(manifest.flow_state === derived.state, `Stored flow_state ${manifest.flow_state} does not match derived state ${derived.state}.`);
  return derived;
}

function refresh(manifest) {
  validateShape(manifest);
  manifest.external_review = { ...EXTERNAL_REVIEW };
  manifest.flow_state = deriveFlowState(manifest).state;
  manifest.updated_at = now();
  validateManifest(manifest);
  return manifest;
}

function loadManifest(file) {
  const manifest = readJson(file, "Manifest");
  validateManifest(manifest);
  return manifest;
}

function ingestYuri(manifest, report) {
  assertExactKeys(report, [
    "contract_version", "tool_version", "commit_sha", "base_main_sha", "source_mode",
    "worktree_dirty", "changed_files", "yuri_state", "checks", "arin_required",
    "arin_state", "generated_at"
  ], "Yuri report");
  assert(report.contract_version === "1.0.0", "Unsupported Yuri contract_version.");
  assert(report.base_main_sha === manifest.base_sha, "Yuri base SHA mismatch.");
  assert(report.commit_sha === manifest.candidate_sha, "Yuri candidate SHA mismatch.");
  assert(["YURI_PRE_QA_PASS", "YURI_PRE_QA_BLOCKED"].includes(report.yuri_state), "Invalid Yuri verdict.");
  assert(typeof report.arin_required === "boolean", "Yuri arin_required is missing.");
  const expectedArinState = report.arin_required ? "PENDING" : "N/A";
  assert(report.arin_state === expectedArinState, "Yuri Arin classification is inconsistent.");
  manifest.yuri = {
    state: report.yuri_state === "YURI_PRE_QA_PASS" ? "PASS" : "BLOCKED",
    base_sha: report.base_main_sha,
    candidate_sha: report.commit_sha,
    report_generated_at: report.generated_at
  };
  manifest.arin = {
    required: report.arin_required,
    state: expectedArinState,
    candidate_sha: manifest.candidate_sha,
    report_generated_at: null
  };
  return refresh(manifest);
}

function ingestArin(manifest, report) {
  assert(manifest.arin.required, "Arin handoff is not applicable because Yuri classified this as a non-UI change.");
  assertExactKeys(report, ["contract_version", "reviewer", "candidate_sha", "state", "reviewed_files", "generated_at"], "Arin report");
  assert(report.contract_version === "1.0.0" && report.reviewer === "ARIN", "Invalid Arin handoff contract.");
  assert(report.candidate_sha === manifest.candidate_sha, "Arin candidate SHA mismatch.");
  assert(["PASS", "BLOCKED"].includes(report.state), "Arin state must be PASS or BLOCKED.");
  assert(Array.isArray(report.reviewed_files) && report.reviewed_files.every(file => typeof file === "string"), "Arin reviewed_files must be a string array.");
  assertIso(report.generated_at, "Arin generated_at");
  manifest.arin.state = report.state;
  manifest.arin.report_generated_at = report.generated_at;
  return refresh(manifest);
}

function ingestHina(manifest, report) {
  assert(manifest.release_kind === "RUNTIME", "HINA runtime Gate is not applicable to DEV_TOOLING_ONLY releases.");
  const beforeHina = deriveFlowState(manifest).state;
  assert(beforeHina === "READY_FOR_HINA", `HINA entry is blocked while flow_state is ${beforeHina}.`);
  assertExactKeys(report, ["contract_version", "source", "candidate_sha", "state", "generated_at"], "HINA report");
  assert(report.contract_version === "1.0.0" && report.source === "HANI_DEPLOY_BRIDGE", "Invalid HINA handoff contract.");
  assert(report.candidate_sha === manifest.candidate_sha, "HINA candidate SHA mismatch.");
  assert(["HINA_QA_PASS", "HINA_QA_BLOCKED"].includes(report.state), "Invalid HINA state.");
  assertIso(report.generated_at, "HINA generated_at");
  manifest.hina = {
    state: report.state === "HINA_QA_PASS" ? "PASS" : "BLOCKED",
    candidate_sha: report.candidate_sha,
    report_generated_at: report.generated_at
  };
  return refresh(manifest);
}

function ingestPreview(manifest, report) {
  const hinaReady = manifest.release_kind === "RUNTIME"
    ? manifest.hina.state === "PASS"
    : manifest.hina.state === "N/A_DEV_TOOLING";
  assert(hinaReady, "Preview cannot be connected before the applicable HINA state is satisfied.");
  assertExactKeys(report, ["contract_version", "candidate_sha", "pr_number", "url", "head_sha", "approval_state"], "Preview handoff");
  assert(report.contract_version === "1.0.0", "Invalid Preview handoff contract.");
  assert(report.candidate_sha === manifest.candidate_sha, "Preview candidate SHA mismatch.");
  assert(report.head_sha === manifest.candidate_sha, "Preview head SHA mismatch; approval is invalid.");
  assert(Number.isInteger(report.pr_number) && report.pr_number > 0, "Invalid Preview PR number.");
  assert(/^https:\/\//.test(report.url || ""), "Preview URL must use HTTPS.");
  assert(["PENDING", "APPROVED", "REJECTED"].includes(report.approval_state), "Invalid representative approval state.");
  manifest.preview = {
    pr_number: report.pr_number,
    url: report.url,
    head_sha: report.head_sha,
    approval_state: report.approval_state
  };
  return refresh(manifest);
}

function ingestProduction(manifest, report) {
  const hinaReady = manifest.release_kind === "RUNTIME"
    ? manifest.hina.state === "PASS"
    : manifest.hina.state === "N/A_DEV_TOOLING";
  assert(hinaReady && manifest.preview.approval_state === "APPROVED", "Production handoff requires the applicable HINA state and representative approval.");
  assert(manifest.preview.head_sha === manifest.candidate_sha, "Production handoff is blocked by Preview SHA mismatch.");
  assertExactKeys(report, [
    "contract_version", "candidate_sha", "merged_sha", "pages_url", "pages_accessible",
    "displayed_version", "runtime_js", "smoke_state", "read_back_state"
  ], "Production handoff");
  assert(report.contract_version === "1.0.0", "Invalid Production handoff contract.");
  assert(report.candidate_sha === manifest.candidate_sha, "Production candidate SHA mismatch.");
  assertSha(report.merged_sha, "Production merged_sha");
  assert(/^https:\/\//.test(report.pages_url || ""), "Production Pages URL must use HTTPS.");
  const complete = report.pages_accessible === true && report.smoke_state === "PASS" && report.read_back_state === "PASS" &&
    Boolean(report.displayed_version && report.runtime_js) &&
    (!manifest.expected.displayed_version || report.displayed_version === manifest.expected.displayed_version) &&
    (!manifest.expected.runtime_js || report.runtime_js === manifest.expected.runtime_js);
  manifest.production = {
    state: complete ? "COMPLETE" : "BLOCKED",
    candidate_sha: report.candidate_sha,
    merged_sha: report.merged_sha,
    pages_url: report.pages_url,
    pages_accessible: report.pages_accessible,
    displayed_version: report.displayed_version,
    runtime_js: report.runtime_js,
    smoke_state: report.smoke_state,
    read_back_state: report.read_back_state
  };
  return refresh(manifest);
}

function sampleYuri(manifest, { pass = true, ui = false } = {}) {
  return {
    contract_version: "1.0.0", tool_version: "0.1.0", commit_sha: manifest.candidate_sha,
    base_main_sha: manifest.base_sha, source_mode: "COMMIT_RANGE", worktree_dirty: false,
    changed_files: [ui ? "index.html" : "scripts/example.mjs"],
    yuri_state: pass ? "YURI_PRE_QA_PASS" : "YURI_PRE_QA_BLOCKED",
    checks: [{ id: "sample", label: "sample", status: pass ? "PASS" : "BLOCKED", detail: "sample", evidence: [] }],
    arin_required: ui, arin_state: ui ? "PENDING" : "N/A", generated_at: now()
  };
}

function runSelfTest() {
  const base = "1".repeat(40);
  const candidate = "2".repeat(40);
  const merged = "3".repeat(40);
  const cases = [];
  const test = (name, fn) => {
    try { fn(); cases.push({ name, status: "PASS" }); }
    catch (error) { cases.push({ name, status: "BLOCKED", detail: error.message }); }
  };
  const mustBlock = (name, fn) => test(name, () => {
    let blocked = false;
    try { fn(); } catch { blocked = true; }
    assert(blocked, `${name} failed open.`);
  });
  const fresh = () => createManifest({ baseSha: base, candidateSha: candidate, releaseKind: "DEV_TOOLING_ONLY", displayedVersion: "2.9.83", runtimeJs: "hani-ui-v02983.js" });
  const freshRuntime = () => createManifest({ baseSha: base, candidateSha: candidate, releaseKind: "RUNTIME", displayedVersion: "2.9.84", runtimeJs: "hani-ui-v02984.js" });

  test("schema and manifest shape", () => validateManifest(fresh()));
  mustBlock("SHA mismatch fail-closed", () => ingestYuri(fresh(), { ...sampleYuri(fresh()), commit_sha: "4".repeat(40) }));
  test("Yuri missing remains blocked from HINA", () => assert(deriveFlowState(fresh()).state === "PENDING_YURI", "Yuri missing was not held."));
  test("Yuri BLOCKED", () => {
    const manifest = ingestYuri(fresh(), sampleYuri(fresh(), { pass: false }));
    assert(manifest.flow_state === "BLOCKED", "Yuri BLOCKED failed open.");
  });
  test("Arin required and PENDING blocks HINA", () => {
    const manifest = ingestYuri(fresh(), sampleYuri(fresh(), { ui: true }));
    assert(manifest.flow_state === "PENDING_ARIN", "Arin PENDING failed open.");
  });
  test("Arin N/A path", () => {
    const manifest = ingestYuri(fresh(), sampleYuri(fresh()));
    assert(manifest.arin.state === "N/A" && manifest.hina.state === "N/A_DEV_TOOLING" && manifest.flow_state === "READY_FOR_PREVIEW", "Arin N/A path failed.");
  });
  test("DEV_TOOLING_ONLY with HINA N/A proceeds", () => {
    const manifest = ingestYuri(fresh(), sampleYuri(fresh()));
    assert(manifest.hina.state === "N/A_DEV_TOOLING" && manifest.flow_state === "READY_FOR_PREVIEW", "DEV_TOOLING_ONLY HINA N/A did not proceed.");
  });
  mustBlock("DEV_TOOLING_ONLY rejects forced HINA PASS", () => {
    const manifest = fresh();
    manifest.hina.state = "PASS";
    validateManifest(manifest);
  });
  mustBlock("DEV_TOOLING_ONLY rejects ingest-hina", () => {
    const manifest = ingestYuri(fresh(), sampleYuri(fresh()));
    ingestHina(manifest, { contract_version: "1.0.0", source: "HANI_DEPLOY_BRIDGE", candidate_sha: candidate, state: "HINA_QA_PASS", generated_at: now() });
  });
  test("RUNTIME HINA PENDING blocks Preview", () => {
    const manifest = ingestYuri(freshRuntime(), sampleYuri(freshRuntime()));
    let blocked = false;
    try { ingestPreview(manifest, {}); } catch { blocked = true; }
    assert(blocked, "Preview advanced before HINA PASS.");
  });
  test("RUNTIME HINA PASS allows Preview", () => {
    let manifest = ingestYuri(freshRuntime(), sampleYuri(freshRuntime()));
    manifest = ingestHina(manifest, { contract_version: "1.0.0", source: "HANI_DEPLOY_BRIDGE", candidate_sha: candidate, state: "HINA_QA_PASS", generated_at: now() });
    manifest = ingestPreview(manifest, { contract_version: "1.0.0", candidate_sha: candidate, pr_number: 1, url: "https://example.test/pr/1", head_sha: candidate, approval_state: "PENDING" });
    assert(manifest.flow_state === "READY_FOR_APPROVAL", "RUNTIME HINA PASS did not allow Preview.");
  });
  mustBlock("RUNTIME rejects HINA N/A", () => {
    const manifest = freshRuntime();
    manifest.hina.state = "N/A_DEV_TOOLING";
    validateManifest(manifest);
  });
  mustBlock("Preview SHA mismatch", () => {
    let manifest = ingestYuri(fresh(), sampleYuri(fresh()));
    ingestPreview(manifest, { contract_version: "1.0.0", candidate_sha: candidate, pr_number: 1, url: "https://example.test/pr/1", head_sha: "4".repeat(40), approval_state: "APPROVED" });
  });
  mustBlock("External review cannot become PASS", () => {
    const manifest = fresh();
    manifest.external_review.state = "PASS";
    validateManifest(manifest);
  });
  test("complete non-UI flow", () => {
    let manifest = ingestYuri(fresh(), sampleYuri(fresh()));
    manifest = ingestPreview(manifest, { contract_version: "1.0.0", candidate_sha: candidate, pr_number: 49, url: "https://example.test/pr/49", head_sha: candidate, approval_state: "APPROVED" });
    manifest = ingestProduction(manifest, { contract_version: "1.0.0", candidate_sha: candidate, merged_sha: merged, pages_url: "https://example.test/", pages_accessible: true, displayed_version: "2.9.83", runtime_js: "hani-ui-v02983.js", smoke_state: "PASS", read_back_state: "PASS" });
    assert(manifest.flow_state === "COMPLETE", "Valid flow did not complete.");
  });

  const failed = cases.filter(item => item.status !== "PASS");
  process.stdout.write(`${JSON.stringify({ contract_version: CONTRACT_VERSION, tests: cases, passed: cases.length - failed.length, failed: failed.length }, null, 2)}\n`);
  if (failed.length) process.exitCode = 1;
}

function usage() {
  process.stdout.write(`HANI Phase 1 Release Flow\n\n` +
    `  init --base SHA --candidate SHA --release-kind RUNTIME|DEV_TOOLING_ONLY --output FILE [--expected-version V] [--expected-runtime-js FILE]\n` +
    `  ingest-yuri|ingest-arin|ingest-hina|ingest-preview|ingest-production --manifest FILE --report FILE\n` +
    `  validate|status --manifest FILE\n` +
    `  --self-test\n`);
}

function main() {
  if (command === "--self-test") return runSelfTest();
  if (command === "help" || command === "--help" || command === "-h") return usage();
  if (command === "init") {
    const manifest = refresh(createManifest({
      baseSha: option("--base"), candidateSha: option("--candidate"),
      releaseKind: option("--release-kind"), displayedVersion: option("--expected-version"),
      runtimeJs: option("--expected-runtime-js")
    }));
    const output = option("--output");
    writeJsonAtomic(output, manifest);
    process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    return;
  }
  const manifestFile = option("--manifest");
  const manifest = loadManifest(manifestFile);
  if (command === "validate" || command === "status") {
    const derived = validateManifest(manifest);
    process.stdout.write(`${JSON.stringify({ valid: true, flow_state: derived.state, base_sha: manifest.base_sha, candidate_sha: manifest.candidate_sha, external_review: manifest.external_review }, null, 2)}\n`);
    return;
  }
  const report = readJson(option("--report"), "Report");
  const handlers = {
    "ingest-yuri": ingestYuri,
    "ingest-arin": ingestArin,
    "ingest-hina": ingestHina,
    "ingest-preview": ingestPreview,
    "ingest-production": ingestProduction
  };
  assert(handlers[command], `Unknown command: ${command}`);
  const updated = handlers[command](manifest, report);
  writeJsonAtomic(manifestFile, updated);
  process.stdout.write(`${JSON.stringify({ valid: true, flow_state: updated.flow_state, manifest: path.resolve(manifestFile) }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ valid: false, state: "BLOCKED", error: error.message }, null, 2)}\n`);
  process.exitCode = error.exitCode || 1;
}
