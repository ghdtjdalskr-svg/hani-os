// Server policy is configured separately after review. Repository reports are not authorization.
export function evaluateProtectedWriteContract(input) {
  const deny = reason => ({ ok: false, reason });
  try {
    const { policy, evidence, evidenceHash, baselineSha, candidateSha, runtimeHash, baselineRuntimeHash, packageHash, surface, now } = input;
    const sha = value => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
    const commit = value => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
    if (!policy || policy.version !== 1 || policy.approval !== "OWNER_REVIEWED" || !policy.approval_id) return deny("No reviewed server policy");
    if (!commit(policy.base_sha) || !commit(policy.source_candidate_sha) || policy.base_sha === policy.source_candidate_sha) return deny("Invalid frozen commit identity");
    if (![policy.runtime_sha256, policy.baseline_runtime_sha256, policy.package_sha256, policy.evidence_sha256].every(sha)) return deny("Invalid frozen hashes");
    if (!Number.isFinite(Date.parse(policy.expires_at)) || Date.parse(policy.expires_at) <= now) return deny("Approval expired");
    if (baselineSha !== policy.base_sha || (candidateSha && candidateSha !== policy.source_candidate_sha)) return deny("Commit drift");
    if (runtimeHash !== policy.runtime_sha256 || baselineRuntimeHash !== policy.baseline_runtime_sha256 || packageHash !== policy.package_sha256) return deny("Source or package drift");
    if (!evidence || evidenceHash !== policy.evidence_sha256 || evidence.version !== 1 || evidence.status !== "PASS") return deny("Evidence absent or changed");
    if (evidence.base_sha !== policy.base_sha || evidence.candidate_sha !== policy.source_candidate_sha || evidence.runtime_sha256 !== runtimeHash || evidence.baseline_runtime_sha256 !== baselineRuntimeHash || evidence.package_sha256 !== packageHash) return deny("Evidence identity drift");
    const minimum = { protected_runtime: 28, backup_runtime: 11, access_ui: 6, transaction_runtime: 1, owner_handlers: 2, storage_gate_negative: 19 };
    if (!Array.isArray(evidence.tests)) return deny("Missing execution matrix");
    for (const [id, count] of Object.entries(minimum)) {
      const rows = evidence.tests.filter(row => row.id === id);
      if (rows.length !== 1 || rows[0].status !== "PASS" || !Number.isInteger(rows[0].cases) || rows[0].cases < count || !sha(rows[0].test_sha256) || !sha(rows[0].output_sha256)) return deny("Incomplete execution: " + id);
    }
    if (surface.storage_key !== "hani_os_life_v23" || surface.internal_version !== "2.9.15-safe-baseline-bootstrap" || surface.writes !== 2 || surface.removes !== 1 || surface.clears !== 0 || surface.cloud_calls !== 6) return deny("Protected contract changed");
    return { ok: true, reason: "Reviewed exact source/package and complete preservation evidence", approval_id: policy.approval_id };
  } catch (_) { return deny("Malformed approval or evidence"); }
}
