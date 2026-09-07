import path from "node:path";

const TEXT_EXTENSIONS = new Set([".html", ".htm", ".js", ".mjs", ".cjs", ".css", ".json", ".svg", ".txt", ".webmanifest"]);
const SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|data:|blob:)/i;

export function normalizeReleasePath(value = "") {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "").split(/[?#]/, 1)[0];
}

function localReference(from, raw) {
  const value = String(raw || "").trim();
  if (!value || SCHEME.test(value) || value.startsWith("/")) return null;
  const joined = normalizeReleasePath(path.posix.join(path.posix.dirname(from), value));
  if (!joined || joined === "." || joined.startsWith("../") || joined.includes("/../")) return null;
  return joined;
}

function matches(text, regex, group = 1) {
  const out = [];
  for (const match of text.matchAll(regex)) if (match[group]) out.push(match[group]);
  return out;
}

export function collectReferences(file, bytes) {
  const ext = path.posix.extname(file).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return [];
  const text = Buffer.isBuffer(bytes) ? bytes.toString("utf8") : String(bytes);
  let refs = [];
  if (ext === ".html" || ext === ".htm") {
    const runtimeHtml = text.replace(/<link\b(?=[^>]*\brel\s*=\s*["'][^"']*icon)[^>]*>/gi, "");
    refs.push(...matches(runtimeHtml, /<(?:script|img|source|video|audio|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi));
    refs.push(...matches(text, /\bsrcset\s*=\s*["']([^"']+)["']/gi).flatMap(value => value.split(",").map(part => part.trim().split(/\s+/)[0])));
  }
  if ([".js", ".mjs", ".cjs"].includes(ext)) {
    refs.push(...matches(text, /\b(?:import|export)\s+(?:[^"']*?\s+from\s*)?["']([^"']+)["']/g));
    refs.push(...matches(text, /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g));
    refs.push(...matches(text, /\bnew\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g));
    refs.push(...matches(text, /\bfetch\s*\(\s*["']([^"']+)["']/g));
  }
  if (ext === ".css") {
    refs.push(...matches(text, /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?/gi));
    refs.push(...matches(text, /url\(\s*["']?([^"')]+)["']?\s*\)/gi));
  }
  if ([".json", ".webmanifest"].includes(ext)) {
    try {
      const walk = value => {
        if (typeof value === "string") refs.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") Object.values(value).forEach(walk);
      };
      walk(JSON.parse(text));
    } catch { /* syntax validation belongs to the caller */ }
  }
  return [...new Set(refs.map(ref => localReference(file, ref)).filter(Boolean))].sort();
}

export async function resolveRuntimeClosure({ entrypoints = ["index.html"], exists, read }) {
  const queue = [...new Set(entrypoints.map(normalizeReleasePath))].sort();
  const files = new Map();
  const missing = [];
  while (queue.length) {
    const file = queue.shift();
    if (files.has(file) || missing.some(item => item.path === file)) continue;
    if (!(await exists(file))) { missing.push({ path: file, referenced_by: "entrypoint" }); continue; }
    const bytes = await read(file);
    files.set(file, bytes);
    for (const ref of collectReferences(file, bytes)) {
      if (!(await exists(ref))) missing.push({ path: ref, referenced_by: file });
      else if (!files.has(ref)) queue.push(ref);
    }
    queue.sort();
  }
  const uniqueMissing = [...new Map(missing.map(item => [`${item.referenced_by}\0${item.path}`, item])).values()]
    .sort((a, b) => a.path.localeCompare(b.path) || a.referenced_by.localeCompare(b.referenced_by));
  return { files: [...files.keys()].sort(), contents: files, missing: uniqueMissing };
}

export function isTextArtifact(file) {
  return TEXT_EXTENSIONS.has(path.posix.extname(file).toLowerCase());
}
