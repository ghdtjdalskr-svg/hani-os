// PROJECT HANI
// hani-deploy-bridge v0.6.2 Merge Manifest Hash Hotfix
// Purpose: Secure, approval-gated GitHub deployment bridge + PR-backed Supabase Release Queue for HANI OS.
//
// SECURITY MODEL
// - GitHub token lives ONLY in Supabase Secret: GITHUB_DEPLOY_TOKEN.
// - Repository is hard-pinned to ghdtjdalskr-svg/hani-os.
// - Release PRs may change only allowlisted HANI OS runtime files; protected repo/control paths stay blocked.
// - Release branches must use the hani/release-* prefix.
// - Every request requires a valid HANI OS Supabase user JWT.
// - stage_release NEVER touches main directly; it creates a branch + PR.
// - merge_release verifies the PR still targets main and originates from a HANI release branch.
// - Core HANI invariants are checked before a release can be staged.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GITHUB_OWNER = "ghdtjdalskr-svg";
const GITHUB_REPO = "hani-os";
const BASE_BRANCH = "main";
const TARGET_PATH = "index.html";
const RELEASE_PREFIX = "hani/release-";
const MAX_HTML_BYTES = 9_500_000;
const MAX_RELEASE_FILES = 80;
const MAX_RELEASE_TOTAL_BYTES = 12_000_000;
const MAX_RELEASE_SINGLE_FILE_BYTES = 5_000_000;
const MODULAR_QA_PROFILE = "HINA_RELEASE_GATE_v0.2_MULTI_FILE";
const GATE_CONTRACT_VERSION = "2.0.0";
const GATE_CONTRACT_SHA256 = "d58e2b336db2165e10d85d286182be994999148f069b92a7f697b8f5f47b5e25";
const LEGACY_MODULAR_EXTRAS_BY_PACKAGE: Record<string, string[]> = {
  "afb69591840e54938b2c65c292769197ec0fba9043bd3eb2d5d93f776368ee51": ["hani-ui-v02977.js"],
};

// Hard invariants. These may only change with explicit representative approval in a future bridge version.
const REQUIRED_STORAGE_KEY = "hani_os_life_v23";
const REQUIRED_INTERNAL_VERSION = "2.9.15-safe-baseline-bootstrap";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanText(value: unknown, max = 500): string {
  return String(value ?? "").trim().slice(0, max);
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function firstEnvKeyFromJson(name: string): string {
  try {
    const raw = String(Deno.env.get(name) ?? "").trim();
    if (!raw) return "";
    const obj = JSON.parse(raw);
    return String(Object.values(obj || {})[0] || "").trim();
  } catch (_) { return ""; }
}

function supabaseSecretKey(): string {
  return String(
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    firstEnvKeyFromJson("SUPABASE_SECRET_KEYS") ||
    ""
  ).trim();
}

async function getAuthenticatedUser(req: Request, supabaseUrl: string, publishableKey: string) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return { user: null, error: "HANI OS 로그인 세션이 필요합니다." };
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return { user: null, error: "HANI OS 로그인 세션을 확인하지 못했습니다." };
  return { user, error: null };
}

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeReleasePath(value: unknown): string {
  return String(value ?? "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function isAllowedReleasePath(value: unknown): boolean {
  const path = normalizeReleasePath(value);
  if (!path || path.startsWith("/") || path.includes("..") || path.startsWith(".")) return false;
  if (path === TARGET_PATH) return true;
  if (/^hani-[A-Za-z0-9._-]+\.(?:js|css)$/i.test(path)) return true;
  if (/^(?:js|css)\/[A-Za-z0-9._/-]+\.(?:js|css)$/i.test(path)) return true;
  if (/^assets\/[A-Za-z0-9._/-]+\.(?:png|webp|svg|jpg|jpeg|gif|ico|json)$/i.test(path)) return true;
  return false;
}

function releaseFilePolicy(files: any[]) {
  const normalized = Array.isArray(files) ? files.map((f: any) => ({
    path: normalizeReleasePath(f?.filename),
    status: cleanText(f?.status, 40),
  })) : [];
  const paths = normalized.map((x) => x.path).filter(Boolean);
  const invalidPaths = paths.filter((path) => !isAllowedReleasePath(path));
  const destructive = normalized.filter((x) => ["removed", "renamed"].includes(x.status));
  const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
  const ok = paths.length > 0 && paths.length <= MAX_RELEASE_FILES && invalidPaths.length === 0 && destructive.length === 0 && duplicates.length === 0;
  return { ok, paths, invalidPaths, destructive, duplicates };
}

function validateHtml(html: string) {
  const issues: string[] = [];
  const bytes = new TextEncoder().encode(html).byteLength;

  if (!html || html.length < 5000) issues.push("HTML 본문이 비정상적으로 짧습니다.");
  if (bytes > MAX_HTML_BYTES) issues.push(`HTML 크기가 허용 범위(${MAX_HTML_BYTES} bytes)를 초과했습니다.`);
  if (!/<!doctype\s+html/i.test(html)) issues.push("DOCTYPE html을 찾지 못했습니다.");
  if (!html.includes(REQUIRED_STORAGE_KEY)) issues.push(`핵심 localStorage 키 ${REQUIRED_STORAGE_KEY}가 없습니다.`);
  if (!html.includes(REQUIRED_INTERNAL_VERSION)) issues.push(`내부 데이터 버전 ${REQUIRED_INTERNAL_VERSION}가 없습니다.`);
  if (!html.includes("HANI OS")) issues.push("HANI OS 식별 문자열을 찾지 못했습니다.");

  return { ok: issues.length === 0, issues, bytes };
}


type QaCheck = {
  id: string;
  layer: "HINA_LOCAL_EQUIVALENT" | "HINA_SERVER" | "POST_MERGE";
  label: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
};

function qaCheck(checks: QaCheck[], id: string, label: string, ok: boolean, detail: string, layer: QaCheck["layer"] = "HINA_SERVER") {
  checks.push({ id, layer, label, status: ok ? "PASS" : "FAIL", detail: cleanText(detail, 1000) });
}

function countMatches(text: string, rx: RegExp): number {
  return [...String(text || "").matchAll(rx)].length;
}

function semverTuple(version: string): [number, number, number] | null {
  const m = String(version || "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function semverGreater(a: string, b: string): boolean {
  const av = semverTuple(a), bv = semverTuple(b);
  if (!av || !bv) return false;
  for (let i = 0; i < 3; i++) {
    if (av[i] > bv[i]) return true;
    if (av[i] < bv[i]) return false;
  }
  return false;
}

function firstMatch(html: string, rx: RegExp): string {
  return cleanText((html.match(rx) || [])[1] || "", 40);
}

function displayVersionSnapshot(html: string) {
  return {
    title: firstMatch(html, /<title>[^<]*?v(\d+\.\d+\.\d+)[^<]*<\/title>/i),
    login: firstMatch(html, /<div class="login-brand">[\s\S]{0,700}?Life Edition v(\d+\.\d+\.\d+)/i),
    sidebar: firstMatch(html, /<div class="brand-copy">[\s\S]{0,500}?Life Edition v(\d+\.\d+\.\d+)/i),
    sideFoot: firstMatch(html, /<div class="foot">\s*HANI OS\s*·\s*v(\d+\.\d+\.\d+)/i),
    mainFooter: firstMatch(html, /<div class="footer">[^<]*?Life Edition v(\d+\.\d+\.\d+)/i),
    displayConst: firstMatch(html, /const\s+HANI_DISPLAY_VERSION\s*=\s*["'](\d+\.\d+\.\d+)["']/),
  };
}

function runtimeVersionLiterals(html: string): string[] {
  const versions: string[] = [];
  for (const m of String(html || "").matchAll(/\bui_version\s*:\s*["'](\d+\.\d+\.\d+)["']/g)) versions.push(cleanText(m[1], 40));
  return versions;
}

function duplicateIds(html: string): string[] {
  const counts = new Map<string, number>();
  for (const m of String(html || "").matchAll(/\bid=["']([^"']+)["']/g)) {
    const id = cleanText(m[1], 160);
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id).sort();
}

function protectedSurface(html: string) {
  return {
    storageDeclaration: firstMatch(html, /const\s+STORAGE_KEY\s*=\s*["']([^"']+)["']/),
    internalVersionDeclaration: firstMatch(html, /const\s+VERSION\s*=\s*["']([^"']+)["']/),
    haniStateCalls: countMatches(html, /\.from\(["']hani_state["']\)/g),
    storageWrites: countMatches(html, /localStorage\.setItem\(STORAGE_KEY/g),
    storageRemoves: countMatches(html, /localStorage\.removeItem\(STORAGE_KEY/g),
  };
}

function secretLeakFree(html: string): boolean {
  return !/github_pat_[A-Za-z0-9_]{20,}/.test(html) && !/\bsk-[A-Za-z0-9_-]{20,}/.test(html);
}

async function githubRawBytes(token: string, path = TARGET_PATH, ref = BASE_BRANCH): Promise<Uint8Array> {
  const safePath = normalizeReleasePath(path);
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${safePath.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`, {
    headers: {
      "Accept": "application/vnd.github.raw+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub raw ${res.status} (${safePath}): ${cleanText(await res.text(), 700)}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function githubRawFile(token: string, path = TARGET_PATH, ref = BASE_BRANCH): Promise<string> {
  const bytes = await githubRawBytes(token, path, ref);
  return new TextDecoder().decode(bytes);
}

async function githubRawContent(token: string, ref = BASE_BRANCH): Promise<string> {
  return await githubRawFile(token, TARGET_PATH, ref);
}

function localScriptPaths(indexHtml: string): string[] {
  const out: string[] = [];
  for (const m of String(indexHtml || "").matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    let src = String(m[1] || "").trim();
    if (!src || /^(?:https?:|data:|blob:|\/\/)/i.test(src)) continue;
    src = src.split(/[?#]/)[0].replace(/^\.\//, "");
    if (isAllowedReleasePath(src) && /\.js$/i.test(src) && !out.includes(src)) out.push(src);
  }
  return out;
}

function localStylePaths(indexHtml: string): string[] {
  const out: string[] = [];
  for (const m of String(indexHtml || "").matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    let href = String(m[1] || "").trim();
    if (!href || /^(?:https?:|data:|blob:|\/\/)/i.test(href)) continue;
    href = href.split(/[?#]/)[0].replace(/^\.\//, "");
    if (isAllowedReleasePath(href) && /\.css$/i.test(href) && !out.includes(href)) out.push(href);
  }
  return out;
}

async function githubRuntimeCombined(token: string, ref = BASE_BRANCH): Promise<{ indexHtml: string; runtimeText: string; scriptPaths: string[]; stylePaths: string[] }> {
  const indexHtml = await githubRawContent(token, ref);
  const scriptPaths = localScriptPaths(indexHtml);
  const stylePaths = localStylePaths(indexHtml);
  const styles: string[] = [];
  const scripts: string[] = [];
  for (const path of stylePaths) styles.push(await githubRawFile(token, path, ref));
  for (const path of scriptPaths) scripts.push(await githubRawFile(token, path, ref));
  return { indexHtml, runtimeText: [indexHtml, ...styles, ...scripts].join("\n/* HANI MODULAR RUNTIME BOUNDARY */\n"), scriptPaths, stylePaths };
}

async function runtimePackagePaths(token: string, ref: string): Promise<string[]> {
  const indexHtml = await githubRawContent(token, ref);
  const paths = [TARGET_PATH, ...localStylePaths(indexHtml), ...localScriptPaths(indexHtml)]
    .map(normalizeReleasePath)
    .filter(Boolean);
  const unique = [...new Set(paths)].sort();
  if (!unique.length || unique[0] !== TARGET_PATH && !unique.includes(TARGET_PATH)) throw new Error("모듈 런타임 패키지에 index.html이 없습니다.");
  if (unique.length > MAX_RELEASE_FILES) throw new Error(`런타임 패키지 파일 수가 허용 범위(${MAX_RELEASE_FILES})를 초과했습니다.`);
  const invalid = unique.filter((path) => !isAllowedReleasePath(path));
  if (invalid.length) throw new Error(`런타임 패키지에 허용되지 않은 경로가 있습니다: ${invalid.join(", ")}`);
  return unique;
}

async function packageSnapshot(token: string, ref: string, paths: string[]) {
  const unique = [...new Set(paths.map(normalizeReleasePath).filter(Boolean))].sort();
  if (!unique.length) throw new Error("패키지 파일 목록이 비어 있습니다.");
  if (unique.length > MAX_RELEASE_FILES) throw new Error(`패키지 파일 수가 허용 범위(${MAX_RELEASE_FILES})를 초과했습니다.`);
  const entries: Array<{ path: string; bytes: number; sha256: string }> = [];
  let totalBytes = 0;
  for (const path of unique) {
    if (!isAllowedReleasePath(path)) throw new Error(`허용되지 않은 release 경로입니다: ${path}`);
    const bytes = await githubRawBytes(token, path, ref);
    if (bytes.byteLength > MAX_RELEASE_SINGLE_FILE_BYTES) throw new Error(`단일 파일 크기 제한 초과: ${path} (${bytes.byteLength} bytes)`);
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_RELEASE_TOTAL_BYTES) throw new Error(`패키지 총 크기가 허용 범위(${MAX_RELEASE_TOTAL_BYTES})를 초과했습니다.`);
    entries.push({ path, bytes: bytes.byteLength, sha256: await sha256Bytes(bytes) });
  }
  const canonical = entries.map((e) => `${e.path}\t${e.bytes}\t${e.sha256}`).join("\n");
  return { entries, total_bytes: totalBytes, package_sha256: await sha256Hex(canonical) };
}

async function listOpenPullRequests(token: string) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls?state=open&base=${encodeURIComponent(BASE_BRANCH)}&per_page=50`, token);
}

async function runHinaReleaseQa(html: string, githubToken: string, expectedMainSha = "", options: { ignorePrNumber?: number; mainTextOverride?: string; qaProfile?: string } = {}) {
  const checks: QaCheck[] = [];
  const basic = validateHtml(html);
  qaCheck(checks, "BASIC_INVARIANTS", "기본 불변조건", basic.ok, basic.ok ? "필수 HTML/스토리지/내부 버전 조건 유지" : basic.issues.join(" | "));

  const mainRef = await getMainRef(githubToken);
  const mainSha = cleanText(mainRef?.object?.sha, 80);
  qaCheck(checks, "MAIN_BASELINE", "운영 main 기준선", Boolean(mainSha), mainSha ? `main ${mainSha.slice(0, 12)}` : "main SHA 확인 실패");
  if (expectedMainSha) qaCheck(checks, "MAIN_SHA_STABLE", "기준선 변경 여부", expectedMainSha === mainSha, expectedMainSha === mainSha ? "검증 시작 이후 main 변경 없음" : `예상 ${expectedMainSha.slice(0, 12)} / 현재 ${mainSha.slice(0, 12)}`);

  const mainHtml = options.mainTextOverride ?? await githubRawContent(githubToken, BASE_BRANCH);
  const [candidateHash, mainHash] = await Promise.all([sha256Hex(html), sha256Hex(mainHtml)]);
  qaCheck(checks, "NOT_PRODUCTION_DUPLICATE", "중복 배포 차단", candidateHash !== mainHash, candidateHash !== mainHash ? "후보가 현재 운영본과 다름" : "후보가 현재 운영 index.html과 완전히 동일함");

  const cv = displayVersionSnapshot(html);
  const mv = displayVersionSnapshot(mainHtml);
  const candidateVersion = cv.title || cv.displayConst || "";
  const mainVersion = mv.title || mv.displayConst || "";
  const requiredVersionFields = ["title", "login", "sidebar", "sideFoot", "mainFooter", "displayConst"] as const;
  const missing = requiredVersionFields.filter((key) => !cv[key]);
  const inconsistent = requiredVersionFields.filter((key) => cv[key] && cv[key] !== candidateVersion);
  qaCheck(checks, "DISPLAY_VERSION_PRESENT", "표시 버전 필드", missing.length === 0, missing.length ? `누락: ${missing.join(", ")}` : `6개 표시 지점 확인 · v${candidateVersion}`);
  qaCheck(checks, "DISPLAY_VERSION_CONSISTENCY", "표시 버전 일치", inconsistent.length === 0 && Boolean(candidateVersion), inconsistent.length ? `불일치: ${inconsistent.map(k => `${k}=v${cv[k]}`).join(", ")}` : `모든 핵심 표시 지점 v${candidateVersion}`);
  const runtimeVersions = runtimeVersionLiterals(html);
  const staleRuntimeVersions = [...new Set(runtimeVersions.filter((v) => v !== candidateVersion))];
  qaCheck(checks, "RUNTIME_AUDIT_VERSION", "런타임 감사 버전", staleRuntimeVersions.length === 0, staleRuntimeVersions.length ? `stale ui_version: ${staleRuntimeVersions.map(v => `v${v}`).join(", ")} / 후보 v${candidateVersion || "?"}` : runtimeVersions.length ? `모든 literal ui_version이 후보 v${candidateVersion}와 일치` : "literal ui_version 없음 · HANI_DISPLAY_VERSION 참조 방식 허용");
  qaCheck(checks, "VERSION_FORWARD", "릴리스 버전 전진", Boolean(candidateVersion && mainVersion && semverGreater(candidateVersion, mainVersion)), `운영 v${mainVersion || "?"} → 후보 v${candidateVersion || "?"}`);

  const candidateProtected = protectedSurface(html);
  const mainProtected = protectedSurface(mainHtml);
  qaCheck(checks, "STORAGE_KEY_DECLARATION", "핵심 Storage Key", candidateProtected.storageDeclaration === REQUIRED_STORAGE_KEY, `STORAGE_KEY=${candidateProtected.storageDeclaration || "미확인"}`);
  qaCheck(checks, "INTERNAL_VERSION_DECLARATION", "내부 데이터 버전", candidateProtected.internalVersionDeclaration === REQUIRED_INTERNAL_VERSION, `VERSION=${candidateProtected.internalVersionDeclaration || "미확인"}`);
  const protectedCountsSame = candidateProtected.haniStateCalls === mainProtected.haniStateCalls && candidateProtected.storageWrites === mainProtected.storageWrites && candidateProtected.storageRemoves === mainProtected.storageRemoves;
  qaCheck(checks, "PROTECTED_WRITE_SURFACE", "핵심 데이터 쓰기 표면", protectedCountsSame,
    `hani_state ${mainProtected.haniStateCalls}→${candidateProtected.haniStateCalls}, Local write ${mainProtected.storageWrites}→${candidateProtected.storageWrites}, remove ${mainProtected.storageRemoves}→${candidateProtected.storageRemoves}`);

  const baselineDupes = new Set(duplicateIds(mainHtml));
  const candidateDupes = duplicateIds(html);
  const newDupes = candidateDupes.filter((id) => !baselineDupes.has(id));
  qaCheck(checks, "NO_NEW_DUPLICATE_IDS", "새 중복 DOM ID", newDupes.length === 0, newDupes.length ? `새 중복 ID: ${newDupes.join(", ")}` : `기존 중복 외 신규 없음 (${candidateDupes.length}개 baseline duplicate)`);

  const scriptOpen = countMatches(html, /<script(?:\s[^>]*)?>/gi), scriptClose = countMatches(html, /<\/script>/gi);
  const styleOpen = countMatches(html, /<style(?:\s[^>]*)?>/gi), styleClose = countMatches(html, /<\/style>/gi);
  qaCheck(checks, "TAG_BALANCE", "Script/Style 태그 균형", scriptOpen === scriptClose && styleOpen === styleClose, `script ${scriptOpen}/${scriptClose}, style ${styleOpen}/${styleClose}`);
  qaCheck(checks, "NO_SECRET_LEAK", "Secret 노출 검사", secretLeakFree(html), secretLeakFree(html) ? "PAT/OpenAI 형식 secret 미검출" : "브라우저 HTML에서 secret 형식 문자열 검출");

  const requiredIds = ["loginGate", "app", "sidebar", "agentReview", "agentPolicyRegistry", "deployment"];
  const missingIds = requiredIds.filter((id) => !new RegExp(`\\bid=["']${id}["']`).test(html));
  qaCheck(checks, "REQUIRED_UI_ANCHORS", "핵심 UI Anchor", missingIds.length === 0, missingIds.length ? `누락: ${missingIds.join(", ")}` : "핵심 화면 Anchor 유지");

  const ignorePrNumber = Number(options.ignorePrNumber || 0);
  const openPrs = await listOpenPullRequests(githubToken);
  const otherOpenPrs = Array.isArray(openPrs) ? openPrs.filter((pr: any) => Number(pr?.number || 0) !== ignorePrNumber) : [];
  const matchingPr = otherOpenPrs.find((pr: any) => String(pr?.body || "").includes(`SHA-256: ${candidateHash}`));
  qaCheck(checks, "NO_DUPLICATE_OPEN_PREVIEW", "중복 Preview PR", !matchingPr, matchingPr ? `동일 후보 PR #${Number(matchingPr?.number || 0)}가 이미 열려 있음` : "동일 SHA의 다른 open Preview 없음");
  const sameVersionPr = otherOpenPrs.find((pr: any) => String(pr?.title || "").includes(`v${candidateVersion}`));
  qaCheck(checks, "NO_SAME_VERSION_OPEN_PREVIEW", "동일 버전 Preview 중복", !sameVersionPr, sameVersionPr ? `동일 버전 open PR #${Number(sameVersionPr?.number || 0)} 존재 · 기존 PR 정리 필요` : "동일 버전의 다른 open Preview 없음");

  const failures = checks.filter((c) => c.status === "FAIL");
  return {
    ok: failures.length === 0,
    state: failures.length === 0 ? "HINA_QA_PASS" : "HINA_QA_FAIL",
    qa_profile: options.qaProfile || "HINA_RELEASE_GATE_v0.1.2",
    candidate_version: candidateVersion || null,
    main_version: mainVersion || null,
    candidate_sha256: candidateHash,
    main_sha256: mainHash,
    main_sha: mainSha,
    checks,
    failure_count: failures.length,
    warning_count: checks.filter((c) => c.status === "WARN").length,
  };
}

async function runHinaModularQa(githubToken: string, candidateRef: string, expectedMainSha = "", options: { ignorePrNumber?: number } = {}) {
  const [candidateRuntime, mainRuntime] = await Promise.all([
    githubRuntimeCombined(githubToken, candidateRef),
    githubRuntimeCombined(githubToken, BASE_BRANCH),
  ]);
  const qa = await runHinaReleaseQa(candidateRuntime.runtimeText, githubToken, expectedMainSha, {
    ignorePrNumber: options.ignorePrNumber,
    mainTextOverride: mainRuntime.runtimeText,
    qaProfile: MODULAR_QA_PROFILE,
  });
  const allTextSecretFree = secretLeakFree(candidateRuntime.runtimeText);
  if (!allTextSecretFree) {
    qa.checks.push({ id: "MODULAR_SECRET_SCAN", layer: "HINA_SERVER", label: "모듈 Secret 노출 검사", status: "FAIL", detail: "모듈 런타임에서 secret 형식 문자열 검출" });
    qa.failure_count += 1;
    qa.ok = false;
    qa.state = "HINA_QA_FAIL";
  } else {
    qa.checks.push({ id: "MODULAR_SECRET_SCAN", layer: "HINA_SERVER", label: "모듈 Secret 노출 검사", status: "PASS", detail: `index + local CSS ${candidateRuntime.stylePaths.length}개 + local JS ${candidateRuntime.scriptPaths.length}개 검사` });
  }
  return { ...qa, candidate_index_html: candidateRuntime.indexHtml, candidate_script_paths: candidateRuntime.scriptPaths, candidate_style_paths: candidateRuntime.stylePaths, main_script_paths: mainRuntime.scriptPaths, main_style_paths: mainRuntime.stylePaths };
}

async function githubFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { raw: text }; }

  if (!res.ok) {
    const message = cleanText(data?.message || data?.raw || `GitHub HTTP ${res.status}`, 1000);
    throw new Error(`GitHub ${res.status}: ${message}`);
  }
  return data;
}

function makeReleaseBranch(label?: string) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const safe = cleanText(label, 28).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  const suffix = safe || crypto.randomUUID().slice(0, 8);
  return `${RELEASE_PREFIX}${stamp}-${suffix}`;
}

async function getMainRef(token: string) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${BASE_BRANCH}`, token);
}

async function getContentMeta(token: string, ref = BASE_BRANCH) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${TARGET_PATH}?ref=${encodeURIComponent(ref)}`, token);
}

async function createBranch(token: string, branch: string, sha: string) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`, token, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
}

async function updateIndexOnBranch(token: string, branch: string, html: string, currentBlobSha: string, message: string) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${TARGET_PATH}`, token, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: utf8ToBase64(html),
      sha: currentBlobSha,
      branch,
    }),
  });
}


async function putTextFileOnBranch(token: string, branch: string, pathValue: string, content: string, message: string, encoding = "utf8") {
  const path = normalizeReleasePath(pathValue);
  if (!isAllowedReleasePath(path)) throw new Error(`허용되지 않은 release 경로입니다: ${path}`);
  const bytes = encoding === "base64" ? Uint8Array.from(atob(content), c => c.charCodeAt(0)) : new TextEncoder().encode(content);
  if (bytes.byteLength > MAX_RELEASE_SINGLE_FILE_BYTES) throw new Error(`단일 파일 크기 제한 초과: ${path} (${bytes.byteLength} bytes)`);

  const apiPath = `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  let existingSha = "";
  const metaRes = await fetch(`https://api.github.com${apiPath}?ref=${encodeURIComponent(branch)}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (metaRes.ok) {
    const meta = await metaRes.json();
    existingSha = cleanText(meta?.sha, 80);
  } else if (metaRes.status !== 404) {
    throw new Error(`GitHub ${metaRes.status}: ${cleanText(await metaRes.text(), 700)}`);
  }

  const body: Record<string, unknown> = {
    message,
    content: encoding === "base64" ? content : utf8ToBase64(content),
    branch,
  };
  if (existingSha) body.sha = existingSha;
  return await githubFetch(apiPath, token, { method: "PUT", body: JSON.stringify(body) });
}

function suppliedPackageSnapshot(files: Array<{ path: string; content: string; encoding?: string }>) {
  const normalized = files.map((f) => ({ path: normalizeReleasePath(f.path), content: String(f.content ?? ""), encoding: f.encoding === "base64" ? "base64" : "utf8" }));
  const paths = normalized.map((f) => f.path);
  const invalid = paths.filter((path) => !isAllowedReleasePath(path));
  const duplicates = paths.filter((path, i) => paths.indexOf(path) !== i);
  if (!paths.length) throw new Error("모듈 패키지가 비어 있습니다.");
  if (paths.length > MAX_RELEASE_FILES) throw new Error(`패키지 파일 수가 허용 범위(${MAX_RELEASE_FILES})를 초과했습니다.`);
  if (invalid.length) throw new Error(`허용되지 않은 release 경로: ${invalid.join(", ")}`);
  if (duplicates.length) throw new Error(`중복 release 경로: ${[...new Set(duplicates)].join(", ")}`);
  if (!paths.includes(TARGET_PATH)) throw new Error("모듈 패키지에 index.html이 없습니다.");

  const entries = normalized.map((f) => {
    const bytes = f.encoding === "base64" ? Uint8Array.from(atob(f.content), c => c.charCodeAt(0)) : new TextEncoder().encode(f.content);
    if (bytes.byteLength > MAX_RELEASE_SINGLE_FILE_BYTES) throw new Error(`단일 파일 크기 제한 초과: ${f.path} (${bytes.byteLength} bytes)`);
    return { path: f.path, content: f.content, encoding: f.encoding, bytes };
  });
  const totalBytes = entries.reduce((sum, e) => sum + e.bytes.byteLength, 0);
  if (totalBytes > MAX_RELEASE_TOTAL_BYTES) throw new Error(`패키지 총 크기가 허용 범위(${MAX_RELEASE_TOTAL_BYTES})를 초과했습니다.`);
  return { entries, totalBytes };
}

async function suppliedPackageHash(entries: Array<{ path: string; content: string; bytes: Uint8Array }>) {
  const hashed: Array<{ path: string; bytes: number; sha256: string }> = [];
  for (const e of [...entries].sort((a,b) => a.path.localeCompare(b.path))) {
    hashed.push({ path: e.path, bytes: e.bytes.byteLength, sha256: await sha256Bytes(e.bytes) });
  }
  const canonical = hashed.map((e) => `${e.path}\t${e.bytes}\t${e.sha256}`).join("\n");
  return { entries: hashed, package_sha256: await sha256Hex(canonical) };
}

async function runSuppliedModularQa(files: Array<{ path: string; content: string }>, githubToken: string, expectedMainSha = "") {
  const byPath = new Map(files.map((f) => [normalizeReleasePath(f.path), String(f.content ?? "")]));
  const indexHtml = byPath.get(TARGET_PATH) || "";
  const scriptPaths = localScriptPaths(indexHtml);
  const stylePaths = localStylePaths(indexHtml);
  const missing = [...stylePaths, ...scriptPaths].filter((path) => !byPath.has(path));
  if (missing.length) throw new Error(`index.html이 참조하는 로컬 모듈이 패키지에 없습니다: ${missing.join(", ")}`);
  const runtimeText = [indexHtml, ...stylePaths.map((x) => byPath.get(x) || ""), ...scriptPaths.map((x) => byPath.get(x) || "")].join("\n/* HANI MODULAR RUNTIME BOUNDARY */\n");
  const mainRuntime = await githubRuntimeCombined(githubToken, BASE_BRANCH);
  const qa = await runHinaReleaseQa(runtimeText, githubToken, expectedMainSha, { mainTextOverride: mainRuntime.runtimeText, qaProfile: MODULAR_QA_PROFILE });
  const secretOk = secretLeakFree(runtimeText);
  qa.checks.push({ id: "MODULAR_SECRET_SCAN", layer: "HINA_SERVER", label: "모듈 Secret 노출 검사", status: secretOk ? "PASS" : "FAIL", detail: secretOk ? `index + local CSS ${stylePaths.length}개 + local JS ${scriptPaths.length}개 검사` : "모듈 런타임에서 secret 형식 문자열 검출" });
  if (!secretOk) { qa.failure_count += 1; qa.ok = false; qa.state = "HINA_QA_FAIL"; }
  return { ...qa, candidate_index_html: indexHtml, candidate_script_paths: scriptPaths, candidate_style_paths: stylePaths };
}

async function createPullRequest(token: string, branch: string, title: string, body: string) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls`, token, {
    method: "POST",
    body: JSON.stringify({ title, head: branch, base: BASE_BRANCH, body, draft: false }),
  });
}

async function getPullRequest(token: string, prNumber: number) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${prNumber}`, token);
}

async function getPullRequestFiles(token: string, prNumber: number) {
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${prNumber}/files?per_page=100`, token);
}

function extractManifestHash(body: unknown): string {
  return cleanText((String(body || "").match(/(?:^|\n)-?\s*SHA-256:\s*([a-f0-9]{64})/i) || [])[1] || "", 80);
}

function extractManifestPackageHash(body: unknown): string {
  return cleanText((String(body || "").match(/(?:^|\n)-?\s*Package-SHA-256:\s*([a-f0-9]{64})/i) || [])[1] || "", 80);
}

function extractManifestIndexHash(body: unknown): string {
  return cleanText((String(body || "").match(/(?:^|\n)-?\s*Index-SHA-256:\s*([a-f0-9]{64})/i) || [])[1] || "", 80);
}

function extractManifestPackagePaths(body: unknown): string[] {
  const raw = cleanText((String(body || "").match(/(?:^|\n)-?\s*Package-Paths:\s*([^\n]+)/i) || [])[1] || "", 8000);
  if (!raw) return [];
  const paths = [...new Set(raw.split(",").map(normalizeReleasePath).filter(Boolean))].sort();
  if (!paths.includes(TARGET_PATH) || paths.length > MAX_RELEASE_FILES || paths.some((path) => !isAllowedReleasePath(path))) return [];
  return paths;
}

function extractManifestBaseSha(body: unknown): string {
  return cleanText((String(body || "").match(/^- Base:\s*main\s*@\s*([a-f0-9]{40})\s*$/mi) || [])[1] || "", 80);
}
function extractOnePassEvidence(body: unknown) {
  const text = String(body || "");
  const value = (label: string, pattern: string) => cleanText((text.match(new RegExp(`^- ${label}:\\s*(${pattern})\\s*$`, "mi")) || [])[1] || "", 100);
  return {
    candidate_sha: value("Candidate-SHA", "[a-f0-9]{40}"),
    preflight: value("One-Pass-Preflight", "PASS|BLOCKED"),
    contract_version: value("Gate-Contract-Version", "[0-9]+\\.[0-9]+\\.[0-9]+"),
    contract_sha256: value("Gate-Contract-SHA-256", "[a-f0-9]{64}"),
  };
}

function extractReleaseNotes(body: unknown): string {
  return cleanText((String(body || "").match(/^- Notes:\s*(.+)$/mi) || [])[1] || "", 1200);
}

async function inspectPendingRelease(token: string, pr: any) {
  const prNumber = Number(pr?.number || 0);
  const headRef = cleanText(pr?.head?.ref, 200);
  const headSha = cleanText(pr?.head?.sha, 80);
  const baseRef = cleanText(pr?.base?.ref, 200);
  const baseSha = cleanText(pr?.base?.sha, 80);
  const manifestBaseSha = extractManifestBaseSha(pr?.body);
  const onePass = extractOnePassEvidence(pr?.body);
  if (!prNumber || !headRef.startsWith(RELEASE_PREFIX) || baseRef !== BASE_BRANCH) return null;

  const files = await getPullRequestFiles(token, prNumber);
  const policy = releaseFilePolicy(Array.isArray(files) ? files : []);
  const filenames = policy.paths;
  const manifestPackageHash = extractManifestPackageHash(pr?.body);
  const manifestPackagePaths = extractManifestPackagePaths(pr?.body);
  // A modular release may change only a subset of runtime files after the baseline split.
  // The presence of Package-SHA-256 is therefore the authoritative mode marker.
  const modular = Boolean(manifestPackageHash);
  const legacySingle = !modular && filenames.length === 1 && filenames[0] === TARGET_PATH;
  const manifestBaseOk = Boolean(manifestBaseSha);
  let runtimePaths: string[] = [];
  let changedRuntimeOnly = true;

  let qa: any;
  let candidateHash = "";
  let manifestHash = "";
  let manifestOk = false;
  let packageInfo: any = null;
  let indexHash = "";

  if (legacySingle) {
    const candidateHtml = await githubRawContent(token, headSha);
    qa = await runHinaReleaseQa(candidateHtml, token, manifestBaseSha || baseSha, { ignorePrNumber: prNumber });
    candidateHash = await sha256Hex(candidateHtml);
    manifestHash = extractManifestHash(pr?.body);
    manifestOk = Boolean(manifestHash) && manifestHash === candidateHash;
    indexHash = candidateHash;
  } else if (modular) {
    qa = await runHinaModularQa(token, headSha, manifestBaseSha || baseSha, { ignorePrNumber: prNumber });
    const indexBytes = await githubRawBytes(token, TARGET_PATH, headSha);
    indexHash = await sha256Bytes(indexBytes);
    const referencedRuntimePaths = await runtimePackagePaths(token, headSha);
    const legacyExtras = manifestPackagePaths.length ? [] : (LEGACY_MODULAR_EXTRAS_BY_PACKAGE[manifestPackageHash] || []);
    runtimePaths = manifestPackagePaths.length ? manifestPackagePaths : [...new Set([...referencedRuntimePaths, ...legacyExtras])].sort();
    const packagePathsMatchRuntime = referencedRuntimePaths.every((path) => runtimePaths.includes(path))
      && runtimePaths.length === referencedRuntimePaths.length + legacyExtras.length;
    changedRuntimeOnly = packagePathsMatchRuntime && filenames.every((path) => runtimePaths.includes(path));
    if (policy.ok && changedRuntimeOnly) packageInfo = await packageSnapshot(token, headSha, runtimePaths);
    candidateHash = packageInfo?.package_sha256 || "";
    manifestHash = manifestPackageHash;
    manifestOk = Boolean(manifestHash && candidateHash && manifestHash === candidateHash);
    const manifestIndexHash = extractManifestIndexHash(pr?.body);
    if (manifestIndexHash && manifestIndexHash !== indexHash) {
      manifestOk = false;
    }
  } else {
    qa = { ok: false, state: "HINA_QA_FAIL", candidate_version: "", checks: [], failure_count: 1 };
    manifestOk = false;
  }

  const onePassOk = onePass.candidate_sha === headSha && onePass.preflight === "PASS" && onePass.contract_version === GATE_CONTRACT_VERSION && onePass.contract_sha256 === GATE_CONTRACT_SHA256;
  const ready = policy.ok && changedRuntimeOnly && qa.ok && manifestOk && manifestBaseOk && onePassOk;
  return {
    pr_number: prNumber,
    pr_url: cleanText(pr?.html_url, 500) || null,
    branch: headRef,
    head_sha: headSha,
    base_sha: baseSha,
    manifest_base_sha: manifestBaseSha || null,
    title: cleanText(pr?.title, 300),
    release_notes: extractReleaseNotes(pr?.body),
    created_at: cleanText(pr?.created_at, 80) || null,
    candidate_version: qa.candidate_version,
    release_mode: modular ? "MODULAR_MULTI_FILE" : "LEGACY_SINGLE_HTML",
    html_sha256: indexHash || candidateHash,
    package_sha256: modular ? candidateHash || null : null,
    manifest_sha256: manifestHash || null,
    manifest_hash_match: manifestOk,
    changed_files: filenames,
    target_only: policy.ok,
    allowed_paths_only: policy.ok,
    package_file_count: modular ? runtimePaths.length : 1,
    package_total_bytes: packageInfo?.total_bytes ?? null,
    qa,
    gate_contract_version: onePass.contract_version || null,
    gate_contract_sha256: onePass.contract_sha256 || null,
    preflight_state: onePass.preflight || null,
    ready_for_approval: ready,
    block_reasons: [
      ...(policy.invalidPaths.length ? [`허용되지 않은 변경 경로: ${policy.invalidPaths.join(", ")}`] : []),
      ...(policy.destructive.length ? [`삭제/이름변경은 현재 Gate에서 허용하지 않습니다: ${policy.destructive.map((x:any)=>x.path).join(", ")}`] : []),
      ...(filenames.length > MAX_RELEASE_FILES ? [`변경 파일 수가 ${MAX_RELEASE_FILES}개를 초과합니다.`] : []),
      ...(changedRuntimeOnly ? [] : [`런타임에서 참조되지 않는 파일 변경이 포함되어 있습니다: ${filenames.filter((path)=>!runtimePaths.includes(path)).join(", ")}`]),
      ...(manifestOk ? [] : [manifestHash ? (modular ? "PR Package-SHA-256과 실제 패키지 SHA-256이 다릅니다." : "PR Manifest SHA-256과 실제 후보 SHA-256이 다릅니다.") : (modular ? "PR Package-SHA-256이 없습니다." : "PR Manifest SHA-256이 없습니다.")]),
      ...(manifestBaseOk ? [] : ["PR Manifest Base main SHA가 없습니다."]),
      ...(onePassOk ? [] : ["candidate/package가 One-Pass Preflight PASS 및 현재 Gate 계약에 고정되지 않았습니다."]),
      ...(qa.ok ? [] : ["HINA Release Gate FAIL"]),
    ],
  };
}

async function mergePullRequest(token: string, prNumber: number, expectedHeadSha: string | null) {
  const body: Record<string, unknown> = { merge_method: "squash" };
  if (expectedHeadSha) body.sha = expectedHeadSha;
  return await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${prNumber}/merge`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

async function deleteBranch(token: string, branch: string) {
  if (!branch.startsWith(RELEASE_PREFIX)) return;
  await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${branch.split("/").map(encodeURIComponent).join("/")}`, token, {
    method: "DELETE",
  });
}

function queueStatusFromPending(item: any): string {
  if (item?.ready_for_approval) return "READY";
  if (item?.stale_version || item?.stale_base) return "STALE";
  return "BLOCKED";
}

function queueRowFromPending(userId: string, item: any) {
  return {
    user_id: userId,
    repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    pr_number: Number(item?.pr_number || 0),
    branch: cleanText(item?.branch, 240),
    head_sha: cleanText(item?.head_sha, 100) || null,
    base_main_sha: cleanText(item?.manifest_base_sha || item?.base_main_sha || item?.base_sha, 100) || null,
    candidate_version: cleanText(item?.candidate_version, 40) || null,
    package_sha256: cleanText(item?.package_sha256 || item?.html_sha256, 100) || null,
    index_sha256: cleanText(item?.index_sha256 || item?.html_sha256, 100) || null,
    file_count: Number(item?.package_file_count || (Array.isArray(item?.changed_files) ? item.changed_files.length : 0)),
    changed_files: Array.isArray(item?.changed_files) ? item.changed_files : [],
    release_notes: cleanText(item?.release_notes, 1800) || null,
    qa_state: cleanText(item?.qa?.state, 80) || null,
    qa: item?.qa && typeof item.qa === "object" ? item.qa : {},
    status: queueStatusFromPending(item),
    updated_at: new Date().toISOString(),
  };
}

async function queueUpsertPending(admin: any, userId: string, item: any) {
  if (!admin || !item || !Number(item?.pr_number)) return;
  const row = queueRowFromPending(userId, item);
  const { error } = await admin.from("hani_release_queue").upsert(row, { onConflict: "user_id,repo,pr_number" });
  if (error) console.warn("release queue upsert", error.message);
}

async function queueMarkByPr(admin: any, userId: string, prNumber: number, patch: Record<string, unknown>) {
  if (!admin || !Number.isInteger(prNumber) || prNumber <= 0) return;
  const { error } = await admin.from("hani_release_queue")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId).eq("repo", `${GITHUB_OWNER}/${GITHUB_REPO}`).eq("pr_number", prNumber);
  if (error) console.warn("release queue update", error.message);
}

async function queueRecent(admin: any, userId: string, limit = 8) {
  if (!admin) return [];
  const { data, error } = await admin.from("hani_release_queue")
    .select("id,pr_number,branch,head_sha,base_main_sha,candidate_version,package_sha256,index_sha256,file_count,changed_files,release_notes,qa_state,status,discovered_at,updated_at,merged_at")
    .eq("user_id", userId).eq("repo", `${GITHUB_OWNER}/${GITHUB_REPO}`)
    .order("updated_at", { ascending: false }).limit(Math.max(1, Math.min(20, Number(limit)||8)));
  if (error) throw new Error(`Release Queue 조회 실패: ${error.message}`);
  return Array.isArray(data) ? data : [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST만 허용됩니다." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const githubToken = Deno.env.get("GITHUB_DEPLOY_TOKEN") ?? "";

    if (!supabaseUrl || !publishableKey) return json({ ok: false, error: "Supabase 환경변수가 준비되지 않았습니다." }, 500);
    const secretKey = supabaseSecretKey();
    const admin = secretKey ? createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;

    const { user, error: authError } = await getAuthenticatedUser(req, supabaseUrl, publishableKey);
    if (!user) return json({ ok: false, error: authError }, 401);

    const payload = asObject(await req.json().catch(() => ({})));
    const action = cleanText(payload.action, 80);

    if (action === "health") {
      let githubReachable = false;
      let githubLogin = "";
      let githubError = "";
      let mainSha = "";
      let indexBlobSha = "";
      if (githubToken) {
        try {
          const repo = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, githubToken);
          githubReachable = true;
          githubLogin = cleanText(repo?.owner?.login, 120);
          const mainRef = await getMainRef(githubToken);
          mainSha = cleanText(mainRef?.object?.sha, 80);
          const contentMeta = await getContentMeta(githubToken, BASE_BRANCH);
          indexBlobSha = cleanText(contentMeta?.sha, 80);
        } catch (e) {
          githubError = cleanText(e instanceof Error ? e.message : e, 500);
        }
      }
      return json({
        ok: true,
        bridge_version: "0.7.0 HANI One-Pass Release",
        release_queue_version: "0.2",
        gate_contract_version: GATE_CONTRACT_VERSION,
        gate_contract_sha256: GATE_CONTRACT_SHA256,
        release_queue_ready: Boolean(admin),
        qa_profile: MODULAR_QA_PROFILE,
        user_id: user.id,
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        base_branch: BASE_BRANCH,
        target_path: TARGET_PATH,
        github_secret_present: Boolean(githubToken),
        github_reachable: githubReachable,
        github_login: githubLogin || null,
        github_error: githubError || null,
        main_sha: mainSha || null,
        index_blob_sha: indexBlobSha || null,
      });
    }

    if (action === "queue_status") {
      if (!admin) return json({ ok: false, error: "Supabase server secret을 확인하지 못해 Release Queue를 읽을 수 없습니다." }, 503);
      const items = await queueRecent(admin, user.id, Number(payload.limit || 8));
      const active = items.find((x: any) => ["READY","BLOCKED","QUEUED"].includes(String(x?.status || ""))) || null;
      return json({ ok: true, action, state: active ? "QUEUE_HAS_RELEASE" : "QUEUE_CLEAR", queue_version: "0.1", active, items });
    }

    if (!githubToken) return json({ ok: false, error: "Supabase Secret GITHUB_DEPLOY_TOKEN이 없습니다." }, 503);

    if (action === "qa_candidate") {
      const html = String(payload.html ?? "");
      const expectedMainSha = cleanText(payload.expected_main_sha, 80);
      const qa = await runHinaReleaseQa(html, githubToken, expectedMainSha);
      return json({ ok: qa.ok, action, ...qa }, qa.ok ? 200 : 409);
    }

    if (action === "pending_release") {
      const openPrs = await listOpenPullRequests(githubToken);
      const releasePrs = (Array.isArray(openPrs) ? openPrs : [])
        .filter((pr: any) => cleanText(pr?.head?.ref, 200).startsWith(RELEASE_PREFIX) && cleanText(pr?.base?.ref, 200) === BASE_BRANCH)
        .sort((a: any, b: any) => String(b?.created_at || "").localeCompare(String(a?.created_at || "")));

      if (!releasePrs.length) {
        return json({ ok: true, action, state: "NO_PENDING_RELEASE", pending: null, open_release_count: 0, ignored_stale_count: 0 });
      }

      let blocked: any = null;
      let ignoredStale = 0;
      let inspectedCount = 0;
      for (const pr of releasePrs.slice(0, 8)) {
        const item = await inspectPendingRelease(githubToken, pr);
        if (!item) continue;
        inspectedCount++;
        if (item.ready_for_approval) {
          await queueUpsertPending(admin, user.id, item);
          return json({
            ok: true, action, state: "PENDING_RELEASE_READY", pending: item,
            open_release_count: releasePrs.length, inspected_count: inspectedCount, ignored_stale_count: ignoredStale,
            superseded_count: Math.max(0, releasePrs.length - 1),
            note: "대표에게는 검증 완료된 최신 릴리스만 제시합니다. HINA 서버 검증은 조회 시마다 새로 실행됩니다.",
          });
        }
        const staleVersion = Boolean(item.candidate_version && item.qa?.main_version && !semverGreater(String(item.candidate_version), String(item.qa.main_version)));
        await queueUpsertPending(admin, user.id, { ...item, stale_version: staleVersion });
        if (staleVersion) { ignoredStale++; continue; }
        if (!blocked) blocked = item;
      }

      return json({
        ok: true, action,
        state: blocked ? "PENDING_RELEASE_BLOCKED" : "NO_PENDING_RELEASE",
        pending: blocked,
        open_release_count: releasePrs.length,
        inspected_count: inspectedCount,
        ignored_stale_count: ignoredStale,
        superseded_count: Math.max(0, releasePrs.length - 1),
        note: blocked ? "새 릴리스 후보는 있으나 Gate를 통과하지 못해 대표 승인 버튼을 잠급니다." : "열린 과거 PR은 현재 운영 버전보다 오래된 후보라 대표 Inbox에서 자동 제외했습니다.",
      });
    }

    if (action === "discard_release") {
      const prNumber = Number(payload.pr_number || 0);
      if (!Number.isInteger(prNumber) || prNumber <= 0) return json({ ok: false, error: "유효한 pr_number가 필요합니다." }, 400);
      const pr = await getPullRequest(githubToken, prNumber);
      const headRef = cleanText(pr?.head?.ref, 200);
      const baseRef = cleanText(pr?.base?.ref, 200);
      if (!headRef.startsWith(RELEASE_PREFIX) || baseRef !== BASE_BRANCH) return json({ ok: false, error: "HANI release PR만 폐기할 수 있습니다." }, 403);
      if (cleanText(pr?.state, 30) === "open") {
        await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/pulls/${prNumber}`, githubToken, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
      }
      let cleanedUp = false;
      try { await deleteBranch(githubToken, headRef); cleanedUp = true; } catch (_) {}
      await queueMarkByPr(admin, user.id, prNumber, { status: "DISCARDED" });
      return json({ ok: true, action, state: "RELEASE_DISCARDED", pr_number: prNumber, branch: headRef, branch_cleaned_up: cleanedUp });
    }

    if (action === "probe_branch") {
      const mainRef = await getMainRef(githubToken);
      const mainCommitSha = cleanText(mainRef?.object?.sha, 80);
      if (!mainCommitSha) throw new Error("main commit SHA를 읽지 못했습니다.");

      const branch = makeReleaseBranch("probe");
      let created = false;
      let verified = false;
      let cleanedUp = false;
      try {
        await createBranch(githubToken, branch, mainCommitSha);
        created = true;
        const probeRef = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${branch.split("/").map(encodeURIComponent).join("/")}`, githubToken);
        verified = cleanText(probeRef?.object?.sha, 80) === mainCommitSha;
      } finally {
        if (created) {
          try {
            await deleteBranch(githubToken, branch);
            cleanedUp = true;
          } catch (_) {}
        }
      }

      return json({
        ok: created && verified,
        action,
        state: created && verified ? "PROBE_PASS" : "PROBE_FAIL",
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        branch,
        main_sha: mainCommitSha,
        branch_created: created,
        branch_verified: verified,
        branch_cleaned_up: cleanedUp,
        note: "테스트 브랜치는 main/index.html을 변경하지 않고 생성 확인 후 즉시 삭제합니다.",
      }, created && verified ? 200 : 500);
    }


    if (action === "stage_modular_release") {
      const rawFiles = Array.isArray(payload.files) ? payload.files : [];
      const files = rawFiles.map((f: any) => ({ path: normalizeReleasePath(f?.path), content: String(f?.content ?? ""), encoding: f?.encoding === "base64" ? "base64" : "utf8" }));
      const label = cleanText(payload.label, 60);
      const releaseNotes = cleanText(payload.release_notes, 1800);
      const expectedMainSha = cleanText(payload.expected_main_sha, 80);
      const suppliedPackageSha = cleanText(payload.package_sha256, 80);
      const suppliedContractVersion = cleanText(payload.gate_contract_version, 40);
      const suppliedContractHash = cleanText(payload.gate_contract_sha256, 80);
      const suppliedPreflight = cleanText(payload.preflight_state, 20);

      const supplied = suppliedPackageSnapshot(files);
      const suppliedHashes = await suppliedPackageHash(supplied.entries);
      if (suppliedPackageSha !== suppliedHashes.package_sha256 || suppliedContractVersion !== GATE_CONTRACT_VERSION || suppliedContractHash !== GATE_CONTRACT_SHA256 || suppliedPreflight !== "PASS") {
        return json({ ok: false, error: "One-Pass frozen package/preflight/contract mismatch" }, 409);
      }
      const qa = await runSuppliedModularQa(files, githubToken, expectedMainSha);
      if (!qa.ok) return json({ ok: false, error: "HINA Modular Release Gate FAIL · Preview 생성을 차단했습니다.", qa }, 409);

      const mainCommitSha = cleanText(qa.main_sha, 80);
      if (!mainCommitSha) throw new Error("main commit SHA를 읽지 못했습니다.");
      if (expectedMainSha && expectedMainSha !== mainCommitSha) return json({ ok: false, error: "main 기준선이 준비 이후 변경되었습니다.", expected_main_sha: expectedMainSha, current_main_sha: mainCommitSha }, 409);

      const branch = makeReleaseBranch(label || "modular");
      let branchCreated = false;
      let prCreated = false;
      try {
        await createBranch(githubToken, branch, mainCommitSha);
        branchCreated = true;
        for (const file of [...files].sort((a,b) => a.path.localeCompare(b.path))) {
          await putTextFileOnBranch(githubToken, branch, file.path, file.content, `HANI OS modular release: ${label || file.path}`, file.encoding);
        }

        const paths = files.map((f) => f.path);
        const remoteSnapshot = await packageSnapshot(githubToken, branch, paths);
        if (remoteSnapshot.package_sha256 !== suppliedHashes.package_sha256) {
          throw new Error(`업로드 read-back Package SHA 불일치: local ${suppliedHashes.package_sha256} / branch ${remoteSnapshot.package_sha256}`);
        }
        const finalQa = await runHinaModularQa(githubToken, branch, mainCommitSha);
        if (!finalQa.ok) throw new Error(`업로드 후 HINA Modular Gate FAIL: ${finalQa.checks.filter((x:any)=>x.status==="FAIL").map((x:any)=>x.id).join(", ")}`);

        const branchRef = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${branch.split("/").map(encodeURIComponent).join("/")}`, githubToken);
        const frozenCandidateSha = cleanText(branchRef?.object?.sha, 80);
        if (!frozenCandidateSha) throw new Error("frozen candidate SHA를 읽지 못했습니다.");
        const indexContent = files.find((f) => f.path === TARGET_PATH)?.content || "";
        const indexHash = await sha256Hex(indexContent);
        const title = `HANI OS release · ${label || suppliedHashes.package_sha256.slice(0, 12)}`;
        const body = [
          "Automated by HANI Deploy Bridge v0.6.1 · Modular Producer + HINA Release Gate + Release Queue.",
          "",
          `- Base: ${BASE_BRANCH} @ ${mainCommitSha}`,
          `- Candidate-SHA: ${frozenCandidateSha}`,
          `- Mode: MODULAR_MULTI_FILE`,
          `- Package-SHA-256: ${suppliedHashes.package_sha256}`,
          `- Package-Paths: ${[...files].map((f) => normalizeReleasePath(f.path)).sort().join(",")}`,
          `- One-Pass-Preflight: PASS`,
          `- Gate-Contract-Version: ${GATE_CONTRACT_VERSION}`,
          `- Gate-Contract-SHA-256: ${GATE_CONTRACT_SHA256}`,
          `- Index-SHA-256: ${indexHash}`,
          `- Files: ${files.length}`,
          `- Bytes: ${supplied.totalBytes}`,
          `- HINA Release Gate: PASS (${finalQa.qa_profile})`,
          `- Representative approval required before merge: YES`,
          releaseNotes ? `- Notes: ${releaseNotes}` : "",
        ].filter(Boolean).join("\n");
        const pr = await createPullRequest(githubToken, branch, title, body);
        prCreated = true;
        return json({
          ok: true,
          action,
          state: "MODULAR_STAGED_AWAITING_REPRESENTATIVE_APPROVAL",
          repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
          branch,
          base_branch: BASE_BRANCH,
          main_sha_at_stage: mainCommitSha,
          package_sha256: suppliedHashes.package_sha256,
          candidate_sha: frozenCandidateSha,
          gate_contract_version: GATE_CONTRACT_VERSION,
          gate_contract_sha256: GATE_CONTRACT_SHA256,
          index_sha256: indexHash,
          file_count: files.length,
          total_bytes: supplied.totalBytes,
          qa: finalQa,
          pr_number: Number(pr?.number || 0),
          pr_url: cleanText(pr?.html_url, 500) || null,
        });
      } catch (e) {
        if (branchCreated && !prCreated) {
          try { await deleteBranch(githubToken, branch); } catch (_) {}
        }
        throw e;
      }
    }

    if (action === "stage_release") {
      const html = String(payload.html ?? "");
      const label = cleanText(payload.label, 60);
      const releaseNotes = cleanText(payload.release_notes, 1800);
      const expectedMainSha = cleanText(payload.expected_main_sha, 80);

      const qa = await runHinaReleaseQa(html, githubToken, expectedMainSha);
      if (!qa.ok) {
        return json({ ok: false, error: "HINA Release Gate FAIL · Preview 생성을 차단했습니다.", qa }, 409);
      }
      const validation = validateHtml(html);
      const mainCommitSha = cleanText(qa.main_sha, 80);
      if (!mainCommitSha) throw new Error("main commit SHA를 읽지 못했습니다.");

      const contentMeta = await getContentMeta(githubToken, BASE_BRANCH);
      const currentBlobSha = cleanText(contentMeta?.sha, 80);
      if (!currentBlobSha) throw new Error("현재 index.html blob SHA를 읽지 못했습니다.");

      const branch = makeReleaseBranch(label);
      await createBranch(githubToken, branch, mainCommitSha);

      const htmlHash = await sha256Hex(html);
      const commit = await updateIndexOnBranch(
        githubToken,
        branch,
        html,
        currentBlobSha,
        `HANI OS release: ${label || htmlHash.slice(0, 12)}`,
      );

      const commitSha = cleanText(commit?.commit?.sha, 80);
      const title = `HANI OS release · ${label || htmlHash.slice(0, 12)}`;
      const body = [
        "Automated by HANI Deploy Bridge v0.6.1 · Zero-Touch + HINA Release Gate.",
        "",
        `- Base: ${BASE_BRANCH} @ ${mainCommitSha}`,
        `- Target: ${TARGET_PATH}`,
        `- SHA-256: ${htmlHash}`,
        `- Bytes: ${validation.bytes}`,
        `- HINA Release Gate: PASS (${qa.qa_profile})`,
        `- Representative approval required before merge: YES`,
        releaseNotes ? `- Notes: ${releaseNotes}` : "",
      ].filter(Boolean).join("\n");

      const pr = await createPullRequest(githubToken, branch, title, body);

      return json({
        ok: true,
        action,
        state: "STAGED_AWAITING_REPRESENTATIVE_APPROVAL",
        repo: `${GITHUB_OWNER}/${GITHUB_REPO}`,
        branch,
        base_branch: BASE_BRANCH,
        main_sha_at_stage: mainCommitSha,
        previous_index_blob_sha: currentBlobSha,
        release_commit_sha: commitSha || null,
        html_sha256: htmlHash,
        validation,
        qa,
        pr_number: Number(pr?.number || 0),
        pr_url: cleanText(pr?.html_url, 500) || null,
      });
    }

    if (action === "merge_release") {
      const prNumber = Number(payload.pr_number || 0);
      if (!Number.isInteger(prNumber) || prNumber <= 0) return json({ ok: false, error: "유효한 pr_number가 필요합니다." }, 400);

      const pr = await getPullRequest(githubToken, prNumber);
      const headRef = cleanText(pr?.head?.ref, 200);
      const headSha = cleanText(pr?.head?.sha, 80);
      const baseRef = cleanText(pr?.base?.ref, 200);
      const state = cleanText(pr?.state, 30);
      const onePass = extractOnePassEvidence(pr?.body);

      if (!headRef.startsWith(RELEASE_PREFIX)) return json({ ok: false, error: "HANI release branch가 아닌 PR은 병합할 수 없습니다." }, 403);
      if (baseRef !== BASE_BRANCH) return json({ ok: false, error: "main 대상 PR만 병합할 수 있습니다." }, 403);
      if (state !== "open") return json({ ok: false, error: `PR 상태가 open이 아닙니다: ${state}` }, 409);
      if (onePass.candidate_sha !== headSha || onePass.preflight !== "PASS" || onePass.contract_version !== GATE_CONTRACT_VERSION || onePass.contract_sha256 !== GATE_CONTRACT_SHA256) {
        return json({ ok: false, error: "대표 승인 대상이 frozen One-Pass candidate/package 계약과 일치하지 않습니다." }, 409);
      }

      // Representative approval is the only human action, so every machine gate is re-run here.
      const files = await getPullRequestFiles(githubToken, prNumber);
      const policy = releaseFilePolicy(Array.isArray(files) ? files : []);
      const filenames = policy.paths;
      if (!policy.ok) {
        return json({
          ok: false,
          error: "승인 대상 PR에 허용되지 않은 파일 변경 또는 파괴적 변경이 있습니다. 병합을 차단했습니다.",
          changed_files: filenames,
          invalid_paths: policy.invalidPaths,
          destructive_changes: policy.destructive,
        }, 409);
      }
      const manifestPackageHash = extractManifestPackageHash(pr?.body);
      const manifestPackagePaths = extractManifestPackagePaths(pr?.body);
      const modular = Boolean(manifestPackageHash);
      const legacySingle = !modular && filenames.length === 1 && filenames[0] === TARGET_PATH;
      const baseSha = cleanText(pr?.base?.sha, 80);
      const manifestBaseSha = extractManifestBaseSha(pr?.body);
      if (!manifestBaseSha) return json({ ok: false, error: "PR Manifest Base main SHA가 없습니다. 병합을 차단했습니다." }, 409);

      let finalQa: any;
      let approvedHash = "";
      let indexHashNow = "";
      let approvedRuntimePaths: string[] = [];
      if (legacySingle) {
        const candidateHtml = await githubRawContent(githubToken, headSha);
        finalQa = await runHinaReleaseQa(candidateHtml, githubToken, manifestBaseSha || baseSha, { ignorePrNumber: prNumber });
        if (!finalQa.ok) return json({ ok: false, error: "대표 승인 직전 HINA 재검증 FAIL · 병합을 차단했습니다.", qa: finalQa }, 409);
        const candidateHashNow = await sha256Hex(candidateHtml);
        const manifestHash = extractManifestHash(pr?.body);
        if (!manifestHash) return json({ ok: false, error: "PR Manifest SHA-256이 없습니다. 병합을 차단했습니다." }, 409);
        if (manifestHash !== candidateHashNow) {
          return json({ ok: false, error: "PR Manifest SHA-256과 실제 후보가 다릅니다. 병합을 차단했습니다.", manifest_sha256: manifestHash, candidate_sha256: candidateHashNow }, 409);
        }
        approvedHash = candidateHashNow;
        indexHashNow = candidateHashNow;
      } else if (modular) {
        finalQa = await runHinaModularQa(githubToken, headSha, manifestBaseSha || baseSha, { ignorePrNumber: prNumber });
        if (!finalQa.ok) return json({ ok: false, error: "대표 승인 직전 HINA Modular 재검증 FAIL · 병합을 차단했습니다.", qa: finalQa }, 409);
        const referencedRuntimePaths = await runtimePackagePaths(githubToken, headSha);
        const legacyExtras = manifestPackagePaths.length ? [] : (LEGACY_MODULAR_EXTRAS_BY_PACKAGE[manifestPackageHash] || []);
        const runtimePaths = manifestPackagePaths.length ? manifestPackagePaths : [...new Set([...referencedRuntimePaths, ...legacyExtras])].sort();
        approvedRuntimePaths = runtimePaths;
        const packagePathsMatchRuntime = referencedRuntimePaths.every((path) => runtimePaths.includes(path))
          && runtimePaths.length === referencedRuntimePaths.length + legacyExtras.length;
        const changedRuntimeOnly = packagePathsMatchRuntime && filenames.every((path) => runtimePaths.includes(path));
        if (!changedRuntimeOnly) return json({ ok: false, error: "런타임에서 참조되지 않는 파일 변경이 포함되어 있습니다. 병합을 차단했습니다.", changed_files: filenames, runtime_files: runtimePaths }, 409);
        const snapshot = await packageSnapshot(githubToken, headSha, runtimePaths);
        if (!manifestPackageHash) return json({ ok: false, error: "PR Package-SHA-256이 없습니다. 병합을 차단했습니다." }, 409);
        if (manifestPackageHash !== snapshot.package_sha256) {
          return json({ ok: false, error: "PR Package-SHA-256과 실제 런타임 패키지가 다릅니다. 병합을 차단했습니다.", manifest_sha256: manifestPackageHash, candidate_sha256: snapshot.package_sha256 }, 409);
        }
        const indexBytes = await githubRawBytes(githubToken, TARGET_PATH, headSha);
        indexHashNow = await sha256Bytes(indexBytes);
        const manifestIndexHash = extractManifestIndexHash(pr?.body);
        if (manifestIndexHash && manifestIndexHash !== indexHashNow) {
          return json({ ok: false, error: "PR Index-SHA-256과 실제 index.html이 다릅니다. 병합을 차단했습니다.", manifest_index_sha256: manifestIndexHash, index_sha256: indexHashNow }, 409);
        }
        approvedHash = snapshot.package_sha256;
      } else {
        return json({ ok: false, error: "릴리스 모드를 판별할 수 없습니다. 병합을 차단했습니다." }, 409);
      }

      const expectedHeadSha = cleanText(payload.expected_head_sha, 80) || headSha;
      if (expectedHeadSha !== headSha) {
        return json({ ok: false, error: "대표 승인 이후 PR 내용이 변경되었습니다. 재검토가 필요합니다.", expected_head_sha: expectedHeadSha, actual_head_sha: headSha }, 409);
      }

      const expectedCandidateHash = approvedHash;
      const merged = await mergePullRequest(githubToken, prNumber, headSha);
      if (!merged?.merged) {
        return json({ ok: false, error: cleanText(merged?.message || "GitHub가 PR 병합을 거부했습니다.", 1000), result: merged }, 409);
      }

      // Independent post-merge read-back: approved runtime package must match main after merge.
      let productionHash = "";
      let readbackPass = false;
      let readbackAttempts = 0;
      for (let attempt = 1; attempt <= 4; attempt++) {
        readbackAttempts = attempt;
        if (modular) {
          const productionPaths = approvedRuntimePaths.length ? approvedRuntimePaths : await runtimePackagePaths(githubToken, BASE_BRANCH);
          const productionSnapshot = await packageSnapshot(githubToken, BASE_BRANCH, productionPaths);
          productionHash = productionSnapshot.package_sha256;
        } else {
          const productionHtml = await githubRawContent(githubToken, BASE_BRANCH);
          productionHash = await sha256Hex(productionHtml);
        }
        readbackPass = Boolean(expectedCandidateHash && productionHash === expectedCandidateHash);
        if (readbackPass) break;
        if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 450));
      }
      if (!readbackPass) {
        return json({
          ok: false,
          error: "병합은 완료됐지만 Production read-back 검증이 일치하지 않습니다. 추가 배포를 중단하고 확인이 필요합니다.",
          merged: true,
          pr_number: prNumber,
          merged_sha: cleanText(merged?.sha, 80) || null,
          expected_candidate_sha256: expectedCandidateHash || null,
          production_sha256: productionHash,
          production_readback: "FAIL",
          readback_attempts: readbackAttempts,
        }, 500);
      }

      // Branch cleanup is best-effort and does not affect a successful merge.
      let cleanedUp = false;
      try { await deleteBranch(githubToken, headRef); cleanedUp = true; } catch (_) {}

      await queueMarkByPr(admin, user.id, prNumber, { status: "MERGED", merged_at: new Date().toISOString(), head_sha: headSha, qa_state: cleanText(finalQa?.state, 80), qa: finalQa || {} });

      return json({
        ok: true,
        action,
        state: "MERGED_DEPLOYMENT_TRIGGERED",
        pr_number: prNumber,
        merged_sha: cleanText(merged?.sha, 80) || null,
        branch_cleaned_up: cleanedUp,
        production_readback: "PASS",
        expected_candidate_sha256: expectedCandidateHash,
        production_sha256: productionHash,
        readback_attempts: readbackAttempts,
        final_qa: finalQa,
        candidate_sha: headSha,
        package_sha256: approvedHash,
        gate_contract_version: GATE_CONTRACT_VERSION,
        pages_url: `https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/`,
        release_mode: modular ? "MODULAR_MULTI_FILE" : "LEGACY_SINGLE_HTML",
        changed_files: filenames,
        index_sha256: indexHashNow || null,
        note: modular ? "main 모듈 패키지 read-back까지 승인 후보와 동일함을 확인했습니다. GitHub Pages 반영은 별도 전파 시간이 걸릴 수 있습니다." : "main/index.html read-back까지 승인 후보와 동일함을 확인했습니다. GitHub Pages 반영은 별도 전파 시간이 걸릴 수 있습니다.",
      });
    }

    return json({ ok: false, error: `지원하지 않는 action입니다: ${action || "(empty)"}` }, 400);
  } catch (error) {
    console.error("hani-deploy-bridge", error);
    return json({ ok: false, error: cleanText(error instanceof Error ? error.message : error, 1500) }, 500);
  }
});
