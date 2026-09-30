import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] && process.argv[2] !== "--no-cross" ? process.argv[2] : fs.mkdtempSync(path.join(os.tmpdir(), "hani-boardroom-edge-"));
const withoutCross = process.argv.includes("--no-cross");
const sourcePath = path.join(out, "supabase/functions/hani-agent-orchestrator/index.ts");
fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
fs.writeFileSync(sourcePath, execFileSync("git", ["show", "cd90dada4e068e0d68c39e6bd8cee34b3f09e9ac:supabase/functions/hani-agent-orchestrator/index.ts"], { cwd: root }));
for (const patch of [
  "hani-agent-orchestrator-v46-baseline.patch",
  "hani-agent-orchestrator-meeting-engine-v2-batch1.patch",
  "hani-agent-orchestrator-meeting-voice.patch",
  "hani-agent-orchestrator-boardroom-voice.patch",
  "hani-agent-orchestrator-boardroom-cross-review.patch",
]) {
  if (withoutCross && patch.includes("cross-review")) continue;
  const patchPath = path.join(root, "docs", patch);
  if (fs.existsSync(patchPath)) execFileSync("git", ["apply", "--ignore-space-change", "--ignore-whitespace", "--whitespace=nowarn", patchPath], { cwd: out });
}
console.log(sourcePath);
