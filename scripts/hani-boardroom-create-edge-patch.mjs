import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const edited = process.argv[2];
if (!edited || !fs.existsSync(edited)) throw new Error("Edited Edge Function path required");
const baselineDir = fs.mkdtempSync(path.join(os.tmpdir(), "hani-boardroom-baseline-"));
try {
  const baseline = execFileSync(process.execPath, [path.join(root, "scripts/hani-boardroom-rebuild-edge.mjs"), baselineDir, "--no-cross"], { cwd: root, encoding: "utf8" }).trim();
  let diff = "";
  try { diff = execFileSync("git", ["diff", "--no-index", "--", baseline, edited], { cwd: root, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 }); }
  catch (error) { if (error.status !== 1) throw error; diff = error.stdout; }
  if (!diff) throw new Error("Edge Function has no changes");
  diff = diff.replace(/^diff --git .*$/m, "diff --git a/supabase/functions/hani-agent-orchestrator/index.ts b/supabase/functions/hani-agent-orchestrator/index.ts")
    .replace(/^--- .*$/m, "--- a/supabase/functions/hani-agent-orchestrator/index.ts")
    .replace(/^\+\+\+ .*$/m, "+++ b/supabase/functions/hani-agent-orchestrator/index.ts")
    .replace(/^\+ +$/gm, "+");
  const output = path.join(root, "docs/hani-agent-orchestrator-boardroom-cross-review.patch");
  fs.writeFileSync(output, diff);
  console.log(output);
} finally {
  const resolved = path.resolve(baselineDir);
  const tempRoot = path.resolve(os.tmpdir()) + path.sep;
  if (!resolved.startsWith(tempRoot) || !path.basename(resolved).startsWith("hani-boardroom-baseline-")) throw new Error("Unsafe temporary cleanup path");
  fs.rmSync(resolved, { recursive: true, force: true });
}
