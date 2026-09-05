#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { closeSync, openSync, readFileSync, readSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const CONTRACT_VERSION = "1.0.0";
const TOOL_VERSION = "0.2.0";
const PROTECTED_STORAGE_KEY = ["hani", "os", "life", "v23"].join("_");

const args = process.argv.slice(2);
const option = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : "";
};
const has = name => args.includes(name);

function git(argv, { allowFailure = false } = {}) {
  const result = spawnSync("git", argv, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (!allowFailure && result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${argv.join(" ")} failed`).trim());
  }
  return { status: result.status ?? 1, stdout: result.stdout || "", stderr: result.stderr || "" };
}

function resolveCommit(ref, label) {
  const value = git(["rev-parse", "--verify", `${ref}^{commit}`]).stdout.trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`${label} commit SHA를 확인하지 못했습니다: ${ref}`);
  return value;
}

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\.\//, "");
}

function parseNameStatus(text) {
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const parts = line.split("\t");
    const status = parts[0];
    if (/^[RC]/.test(status) && parts.length >= 3) {
      entries.push({ status, path: normalizePath(parts[2]), previous_path: normalizePath(parts[1]) });
    } else if (parts[1]) {
      entries.push({ status, path: normalizePath(parts[1]) });
    }
  }
  return entries;
}

function parsePatch(text) {
  const records = [];
  let oldPath = "";
  let newPath = "";
  let oldLine = 0;
  let newLine = 0;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("--- ")) {
      oldPath = line.slice(4) === "/dev/null" ? "" : normalizePath(line.slice(4).replace(/^a\//, ""));
      continue;
    }
    if (line.startsWith("+++ ")) {
      newPath = line.slice(4) === "/dev/null" ? "" : normalizePath(line.slice(4).replace(/^b\//, ""));
      continue;
    }
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      records.push({ path: newPath, line: newLine++, change: "added", text: line.slice(1) });
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      records.push({ path: oldPath, line: oldLine++, change: "removed", text: line.slice(1) });
    } else if (line.startsWith(" ")) {
      oldLine += 1;
      newLine += 1;
    }
  }
  return records.filter(record => record.path);
}

const BINARY_EXTENSIONS = new Set([".7z", ".avi", ".bmp", ".doc", ".docx", ".exe", ".gif", ".gz", ".ico", ".jpeg", ".jpg", ".mov", ".mp3", ".mp4", ".pdf", ".png", ".ppt", ".pptx", ".tar", ".webm", ".webp", ".woff", ".woff2", ".xls", ".xlsx", ".zip"]);

function isBinaryFile(file) {
  if (BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())) return true;
  let handle;
  try {
    const size = Math.min(statSync(file).size, 8192);
    if (!size) return false;
    const buffer = Buffer.alloc(size);
    handle = openSync(file, "r");
    const bytes = readSync(handle, buffer, 0, size, 0);
    return buffer.subarray(0, bytes).includes(0);
  } finally {
    if (handle !== undefined) closeSync(handle);
  }
}

function untrackedRecords(files) {
  const records = [];
  const binaryFiles = [];
  for (const file of files) {
    if (isBinaryFile(file)) {
      binaryFiles.push(normalizePath(file));
      continue;
    }
    const contents = readFileSync(file, "utf8");
    contents.split(/\r?\n/).forEach((text, index) => {
      records.push({ path: normalizePath(file), line: index + 1, change: "added", text });
    });
  }
  return { records, binaryFiles };
}

function isAllowedPath(file) {
  return [
    /^AGENTS\.md$/,
    /^(?:README|CHANGELOG)(?:\.[^/]+)?$/i,
    /^index\.html$/,
    /^hani-[A-Za-z0-9._-]+\.(?:js|css|png|svg|webp)$/i,
    /^(?:js|css|assets)\/[A-Za-z0-9._/-]+$/i,
    /^scripts\/[A-Za-z0-9._/-]+\.(?:mjs|js|json)$/i,
    /^dev-center\/[A-Za-z0-9._/-]+\.(?:json|md)$/i,
    /^supabase\/functions\/[A-Za-z0-9._-]+\/index\.ts$/i,
    /^\.github\/workflows\/[A-Za-z0-9._-]+\.ya?ml$/i,
    /^docs\/[A-Za-z0-9._/-]+$/i
  ].some(pattern => pattern.test(file));
}

function isExecutableSource(file) {
  return /\.(?:html|m?js|cjs|ts|tsx|ya?ml)$/i.test(file);
}

function stripNonCodeText(text) {
  const source = String(text || "");
  let index = 0;
  let output = "";

  const appendBlank = char => {
    output += char === "\n" ? "\n" : " ";
  };

  function consumeQuotedString(quote) {
    const start = index++;
    while (index < source.length) {
      const char = source[index++];
      if (char === "\\" && index < source.length) {
        index += 1;
      } else if (char === quote) {
        break;
      }
    }
    const token = source.slice(start, index);
    const bracketProperty = output.trimEnd().endsWith("[") && /^["'](?:localStorage|sessionStorage|setItem|removeItem|clear)["']$/.test(token);
    for (const char of token) {
      if (bracketProperty) output += char;
      else appendBlank(char);
    }
  }

  function consumeLineComment() {
    while (index < source.length) {
      const char = source[index++];
      appendBlank(char);
      if (char === "\n") return;
    }
  }

  function consumeBlockComment() {
    appendBlank(source[index++]);
    appendBlank(source[index++]);
    while (index < source.length) {
      const char = source[index];
      const next = source[index + 1] || "";
      appendBlank(char);
      index += 1;
      if (char === "*" && next === "/") {
        appendBlank(source[index++]);
        return;
      }
    }
  }

  function looksLikeRegexStart() {
    const prior = output.trimEnd();
    if (!prior) return true;
    if (/[=(:,!&|?{};\[\]+\-*%^~<>]$/.test(prior)) return true;
    return /\b(?:await|case|delete|instanceof|in|new|return|throw|typeof|void|yield)$/.test(prior);
  }

  function consumeRegexLiteral() {
    let inCharacterClass = false;
    appendBlank(source[index++]);
    while (index < source.length) {
      const char = source[index];
      appendBlank(char);
      index += 1;
      if (char === "\\" && index < source.length) {
        appendBlank(source[index++]);
      } else if (char === "[") {
        inCharacterClass = true;
      } else if (char === "]") {
        inCharacterClass = false;
      } else if (char === "/" && !inCharacterClass) {
        while (/[A-Za-z]/.test(source[index] || "")) appendBlank(source[index++]);
        return;
      } else if (char === "\n") {
        return;
      }
    }
  }

  function consumeTemplate() {
    appendBlank(source[index++]);
    while (index < source.length) {
      const char = source[index];
      const next = source[index + 1] || "";
      if (char === "\\") {
        appendBlank(source[index++]);
        if (index < source.length) appendBlank(source[index++]);
      } else if (char === "`") {
        appendBlank(source[index++]);
        return;
      } else if (char === "$" && next === "{") {
        appendBlank(source[index++]);
        appendBlank(source[index++]);
        consumeCode(true);
      } else {
        appendBlank(source[index++]);
      }
    }
  }

  function consumeCode(templateExpression = false) {
    let braceDepth = templateExpression ? 1 : 0;
    while (index < source.length) {
      const char = source[index];
      const next = source[index + 1] || "";
      if (char === "\"" || char === "'") {
        consumeQuotedString(char);
      } else if (char === "`") {
        consumeTemplate();
      } else if (char === "/" && next === "/") {
        consumeLineComment();
      } else if (char === "/" && next === "*") {
        consumeBlockComment();
      } else if (char === "/" && looksLikeRegexStart()) {
        consumeRegexLiteral();
      } else if (templateExpression && char === "{") {
        braceDepth += 1;
        output += source[index++];
      } else if (templateExpression && char === "}") {
        braceDepth -= 1;
        if (braceDepth === 0) {
          appendBlank(source[index++]);
          return;
        }
        output += source[index++];
      } else {
        output += source[index++];
      }
    }
  }

  consumeCode();
  return output
    .split(/\r?\n/)
    .map(line => line
      .replace(/\/(?![/*])(?:\\.|[^/\r\n])+\/[dgimsuvy]*/g, match => " ".repeat(match.length)))
    .join("\n");
}

function stripNonCode(text) {
  return stripNonCodeText(text);
}

function readGitText(ref, file) {
  const result = git(["show", `${ref}:${file}`], { allowFailure: true });
  return result.status === 0 ? result.stdout : "";
}

function buildSourceSnapshots(fileChanges, { worktree, comparisonBaseSha, commitSha }) {
  const snapshots = new Map();
  for (const change of fileChanges) {
    if (!isExecutableSource(change.path)) continue;
    const basePath = change.previous_path || change.path;
    const baseText = /^[AC]/.test(change.status) ? "" : readGitText(comparisonBaseSha, basePath);
    let headText = "";
    if (!/^D/.test(change.status)) {
      if (worktree) {
        try {
          if (!isBinaryFile(change.path)) headText = readFileSync(change.path, "utf8");
        } catch {
          headText = "";
        }
      } else headText = readGitText(commitSha, change.path);
    }
    snapshots.set(change.path, {
      baseText,
      headText,
      baseLines: stripNonCodeText(baseText).split("\n"),
      headLines: stripNonCodeText(headText).split("\n")
    });
  }
  return snapshots;
}

function attachScanText(records, snapshots) {
  return records.map(record => {
    const snapshot = snapshots.get(record.path);
    const lines = record.change === "removed" ? snapshot?.baseLines : snapshot?.headLines;
    return { ...record, scanText: lines?.[record.line - 1] ?? stripNonCode(record.text) };
  });
}

function isUiFile(change, snapshots) {
  const file = change.path;
  if (/\.(?:html|css|bmp|gif|ico|jpe?g|png|svg|webp)$/i.test(file) || /^hani-ui[^/]*\.js$/i.test(path.basename(file))) return true;
  if (!/\.(?:m?js|ts|tsx)$/i.test(file)) return false;
  if (/^(?:scripts|dev-center|\.github)\//i.test(file)) return false;
  const uiSignal = /\b(?:document|window)\b|querySelector|innerHTML|classList|addEventListener|\.onclick\b|createElement/;
  const snapshot = snapshots.get(file);
  const source = /^D/.test(change.status) ? snapshot?.baseText : snapshot?.headText;
  return uiSignal.test(stripNonCodeText(source || ""));
}

function evidence(records, kind, limit = 20) {
  return records.slice(0, limit).map(record => `${record.path}:${record.line}:${record.change}:${kind}`);
}

function makeCheck(id, label, findings, passDetail, blockedDetail, kind = id) {
  return {
    id,
    label,
    status: findings.length ? "BLOCKED" : "PASS",
    detail: findings.length ? `${blockedDetail} (${findings.length}건)` : passDetail,
    evidence: evidence(findings, kind)
  };
}

function makeInformationalCheck(id, label, findings, passDetail, findingDetail, kind = id) {
  return {
    id,
    label,
    status: "PASS",
    detail: findings.length ? `${findingDetail} (${findings.length}건)` : passDetail,
    evidence: evidence(findings, kind)
  };
}

function storageCallPattern() {
  const storageObject = "(?:(?:window|globalThis)\\s*(?:\\.\\s*(?:localStorage|sessionStorage)|\\[\\s*[\\\"'](?:localStorage|sessionStorage)[\\\"']\\s*\\])|(?:localStorage|sessionStorage))";
  const storageMethod = "(?:\\.\\s*(?:setItem|removeItem|clear)|\\[\\s*[\\\"'](?:setItem|removeItem|clear)[\\\"']\\s*\\])";
  return new RegExp(`${storageObject}\\s*${storageMethod}\\s*\\(`);
}

function detectRisks(fileChanges, records, snapshots = new Map()) {
  const codeRecords = records.filter(record => isExecutableSource(record.path));
  const executableRecords = codeRecords.map(record => ({ ...record, scanText: record.scanText ?? stripNonCode(record.text) }));
  const storageCall = storageCallPattern();
  const supabaseWrite = /(?:\.from\s*\([^\n]*\)\s*\.|\b(?:cloudClient|supabaseClient|supabase)\s*\.)\s*(?:insert|update|delete|upsert)\s*\(/i;
  const supabaseWriteContinuation = /^\s*\.\s*(?:insert|update|delete|upsert)\s*\(/i;
  const eventBinding = /(?:\baddEventListener\s*\(|\.onclick\s*=|\.click\s*\()/;
  const secretPatterns = [
    /github_pat_[A-Za-z0-9_]{20,}/,
    /gh[pousr]_[A-Za-z0-9]{20,}/,
    /sk-[A-Za-z0-9_-]{20,}/,
    /sb_secret_[A-Za-z0-9_-]{20,}/i,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
  ];
  const destructivePatterns = [
    new RegExp("\\bgit\\s+reset\\s+--hard\\b", "i"),
    new RegExp("\\bgit\\s+push\\s+(?:--force|-f)\\b", "i"),
    new RegExp("\\bgit\\s+branch\\s+-D\\b"),
    new RegExp("\\bforce\\s+push\\b", "i"),
    new RegExp("\\bgh\\s+pr\\s+merge\\b", "i"),
    new RegExp("\\brm\\s+-rf\\b", "i"),
    new RegExp("\\bRemove-Item\\b[^\\n]*\\b-Recurse\\b", "i"),
    new RegExp("\\b(?:DROP|TRUNCATE)\\s+TABLE\\b", "i"),
    new RegExp(["deployBridgeApi\\s*\\(\\s*[\"']", "(?:merge|discard|stage)_release", "[\"']"].join(""), "i")
  ];

  const outOfScope = fileChanges.filter(change => !isAllowedPath(change.path));
  const storageChanges = executableRecords.filter(record => storageCall.test(record.scanText));
  const protectedKeyChanges = codeRecords.filter(record => record.text.includes(PROTECTED_STORAGE_KEY));
  const supabaseContextFiles = new Set(fileChanges.filter(change => {
    const snapshot = snapshots.get(change.path);
    const source = /^D/.test(change.status) ? snapshot?.baseText : snapshot?.headText;
    return /\b(?:cloudClient|supabaseClient|supabase)\b|\.from\s*\(/i.test(stripNonCodeText(source || ""));
  }).map(change => change.path));
  const supabaseWrites = executableRecords.filter(record => supabaseWrite.test(record.scanText) || (supabaseContextFiles.has(record.path) && supabaseWriteContinuation.test(record.scanText)));
  const eventChanges = executableRecords.filter(record => eventBinding.test(record.scanText));
  const secretChanges = records.filter(record => secretPatterns.some(pattern => pattern.test(record.text)));
  const destructiveChanges = executableRecords.filter(record => destructivePatterns.some(pattern => pattern.test(record.scanText)));

  const addedEvents = eventChanges.filter(record => record.change === "added");
  const addedBindings = addedEvents.filter(record => /(?:\baddEventListener\s*\(|\.onclick\s*=)/.test(record.scanText));
  const eventSignature = record => {
    const source = record.text.replace(/\s+/g, "");
    const target = source.match(/^(.{1,120}?)(?:\.addEventListener|\.onclick)/)?.[1] || "unknown";
    const type = source.match(/addEventListener\(["']([^"']+)/)?.[1] || (source.includes(".onclick") ? "click" : "programmatic-click");
    return `${record.path}:${target}:${type}`;
  };
  const headEventKeys = new Map();
  for (const change of fileChanges) {
    const snapshot = snapshots.get(change.path);
    if (!snapshot || /^D/.test(change.status)) continue;
    const rawLines = String(snapshot.headText || "").split(/\r?\n/);
    const scanLines = stripNonCodeText(snapshot.headText || "").split("\n");
    rawLines.forEach((text, index) => {
      const scanText = scanLines[index] || "";
      if (!/(?:\baddEventListener\s*\(|\.onclick\s*=)/.test(scanText)) return;
      const key = eventSignature({ path: change.path, text });
      headEventKeys.set(key, (headEventKeys.get(key) || 0) + 1);
    });
  }
  const layeringRisks = addedBindings.filter(record => {
    const duplicated = (headEventKeys.get(eventSignature(record)) || 0) > 1;
    const globalLayer = /(?:\bdocument\b|\bwindow\b)\s*\.\s*addEventListener\s*\(/.test(record.scanText);
    return duplicated || globalLayer;
  });

  const checks = [
    makeCheck("changed_file_scope", "변경 파일 허용 범위", outOfScope, "모든 변경 파일이 허용 범위 안에 있습니다.", "허용 범위 밖의 파일이 변경되었습니다.", "path-out-of-scope"),
    makeCheck("storage_mutation", "브라우저 저장소 쓰기 변경", storageChanges, "localStorage/sessionStorage set/remove/clear 호출 변경이 없습니다.", "localStorage 또는 sessionStorage 쓰기·삭제 호출이 변경되었습니다.", "storage-mutation"),
    makeCheck("protected_storage_key", "보호 Storage Key 변경", protectedKeyChanges, `${PROTECTED_STORAGE_KEY} 관련 실행 코드 변경이 없습니다.`, `${PROTECTED_STORAGE_KEY} 관련 실행 코드가 변경되었습니다.`, "protected-storage-key"),
    makeCheck("supabase_mutation", "Supabase 쓰기 변경", supabaseWrites, "Supabase insert/update/delete/upsert 호출 변경이 없습니다.", "Supabase 쓰기 호출이 변경되었습니다.", "supabase-mutation"),
    makeInformationalCheck("event_binding_change", "DOM 이벤트 연결 변경", eventChanges, "onclick/addEventListener/.click() 연결 변경이 없습니다.", "DOM 이벤트 연결 변경을 Arin Review handoff에 기록했습니다.", "event-binding"),
    makeCheck("event_layering_risk", "DOM 이벤트 중복·레이어링 위험", layeringRisks, "정적 패턴상 이벤트 중복·레이어링 위험이 없습니다.", "중복 또는 추가 이벤트 레이어 가능성이 발견되었습니다.", "event-layering"),
    makeCheck("secret_exposure", "Secret 형식 문자열 노출", secretChanges, "알려진 Secret 형식 문자열이 추가·변경되지 않았습니다.", "Secret 형식과 일치하는 문자열이 발견되었습니다.", "secret-redacted"),
    makeCheck("destructive_git_deploy", "파괴적 Git·배포 코드 변경", destructiveChanges, "파괴적 Git·배포 동작 변경이 없습니다.", "파괴적 Git 또는 배포 상태 변경 코드가 발견되었습니다.", "destructive-operation")
  ];

  return { checks, eventChanges };
}

function validateReportShape(report) {
  const required = ["contract_version", "tool_version", "commit_sha", "base_main_sha", "source_mode", "worktree_dirty", "changed_files", "yuri_state", "checks", "arin_required", "arin_state", "generated_at"];
  for (const key of required) if (!(key in report)) throw new Error(`결과 필드 누락: ${key}`);
  if (report.contract_version !== CONTRACT_VERSION || report.tool_version !== TOOL_VERSION) throw new Error("결과 contract/tool 버전이 실행기와 일치하지 않습니다.");
  if (!new Set(["COMMIT_RANGE", "WORKTREE_DRY_RUN"]).has(report.source_mode) || typeof report.worktree_dirty !== "boolean") throw new Error("결과 source mode 또는 worktree 상태가 올바르지 않습니다.");
  if (!Array.isArray(report.changed_files) || !Array.isArray(report.checks)) throw new Error("결과 목록 필드 형식이 올바르지 않습니다.");
  if (!/^[0-9a-f]{40}$/.test(report.commit_sha) || !/^[0-9a-f]{40}$/.test(report.base_main_sha)) throw new Error("결과 SHA 형식이 올바르지 않습니다.");
  if (!new Set(["YURI_PRE_QA_PASS", "YURI_PRE_QA_BLOCKED"]).has(report.yuri_state)) throw new Error("Yuri 상태값이 올바르지 않습니다.");
  if (report.arin_state !== (report.arin_required ? "PENDING" : "N/A")) throw new Error("Arin 상태와 필요 여부가 일치하지 않습니다.");
}

function selfTest() {
  const riskyStorage = [["local", "Storage.setItem('x','y')"].join("")];
  const riskySupabase = ["  .upsert(row)"];
  const riskyEvent = ["document.addEventListener('click', handler)"];
  const riskyGit = [["git", " reset --hard HEAD"].join("")];
  const sampleTexts = [...riskyStorage, ...riskySupabase, ...riskyGit];
  const samples = sampleTexts.map((text, index) => ({ path: "hani-test.js", line: index + 1, change: "added", text, scanText: stripNonCode(text) }));
  samples.push({ path: "hani-newsroom-ux-v00001.js", line: 1, change: "added", text: riskyEvent[0], scanText: stripNonCode(riskyEvent[0]) });
  const snapshots = new Map([
    ["hani-test.js", { headText: `const cloudClient = getClient();\n${sampleTexts.join("\n")}` }],
    ["hani-newsroom-ux-v00001.js", { headText: riskyEvent[0] }]
  ]);
  const changes = [{ status: "M", path: "hani-test.js" }, { status: "M", path: "hani-newsroom-ux-v00001.js" }];
  const result = detectRisks(changes, samples, snapshots);
  for (const id of ["storage_mutation", "supabase_mutation", "event_layering_risk", "destructive_git_deploy"]) {
    if (result.checks.find(check => check.id === id)?.status !== "BLOCKED") throw new Error(`self-test detector failed: ${id}`);
  }
  if (result.checks.find(check => check.id === "event_binding_change")?.status !== "PASS") throw new Error("self-test event handoff failed");
  const commentStorage = ["const ratio = value / 2; // local", "Storage.setItem('x','y')"].join("");
  if (storageCallPattern().test(stripNonCode(commentStorage))) throw new Error("self-test comment stripping failed");
  const blockStorage = ["/* local", "Storage.removeItem('x') */\nconst safe = true;"].join("");
  if (storageCallPattern().test(stripNonCodeText(blockStorage))) throw new Error("self-test block comment stripping failed");
  const resultForFile = (source, file = "hani-test.js") => {
    const sourceLines = source.split(/\r?\n/);
    const scanLines = stripNonCodeText(source).split("\n");
    const sourceRecords = sourceLines.map((text, index) => ({ path: file, line: index + 1, change: "added", text, scanText: scanLines[index] || "" }));
    return detectRisks([{ status: "M", path: file }], sourceRecords, new Map([[file, { headText: source, headLines: scanLines }]])).checks;
  };
  const resultForSource = source => resultForFile(source);
  const checkStatus = (checks, id) => checks.find(check => check.id === id)?.status;
  const safeTemplate = [
    "const documentation = `",
    "DROP TABLE hani_release_queue;",
    "localStorage.setItem('documentation', 'only');",
    "`;"
  ].join("\n");
  const safeTemplateScan = stripNonCodeText(safeTemplate);
  if (safeTemplateScan.split("\n").length !== safeTemplate.split("\n").length) throw new Error("self-test template line preservation failed");
  const safeTemplateChecks = resultForSource(safeTemplate);
  if (checkStatus(safeTemplateChecks, "storage_mutation") !== "PASS" || checkStatus(safeTemplateChecks, "destructive_git_deploy") !== "PASS") throw new Error("self-test template text stripping failed");
  const expressionTemplate = [
    "const value = `safe text",
    "${localStorage.setItem('x', 'y')}",
    "more safe text`;"
  ].join("\n");
  if (checkStatus(resultForSource(expressionTemplate), "storage_mutation") !== "BLOCKED") throw new Error("self-test template expression scanning failed");
  const storageNotations = [
    'localStorage["setItem"]("x", "y")',
    "localStorage['removeItem']('x')",
    'sessionStorage["clear"]()',
    'window["localStorage"]["setItem"]("x", "y")',
    "localStorage.setItem('x', 'y')"
  ];
  for (const source of storageNotations) {
    if (checkStatus(resultForSource(source), "storage_mutation") !== "BLOCKED") throw new Error(`self-test storage notation failed: ${source}`);
  }
  if (!isUiFile(changes[1], snapshots)) throw new Error("self-test full-file UI detection failed");
  const localEventSource = "button.addEventListener('click', handler);";
  const localEventScan = stripNonCodeText(localEventSource).split("\n");
  const localEventRecords = [{ path:"hani-feature-v00001.js", line:1, change:"added", text:localEventSource, scanText:localEventScan[0] }];
  const localEventChanges = [{ status:"A", path:"hani-feature-v00001.js" }];
  const localEventSnapshots = new Map([["hani-feature-v00001.js", { headText:localEventSource, headLines:localEventScan }]]);
  const localEventResult = detectRisks(localEventChanges, localEventRecords, localEventSnapshots);
  if (checkStatus(localEventResult.checks, "event_binding_change") !== "PASS" || checkStatus(localEventResult.checks, "event_layering_risk") !== "PASS" || !isUiFile(localEventChanges[0], localEventSnapshots)) throw new Error("self-test local UI event handoff failed");
  const duplicateEventSource = [localEventSource, localEventSource].join("\n");
  const duplicateEventScan = stripNonCodeText(duplicateEventSource).split("\n");
  const duplicateEventRecords = duplicateEventSource.split("\n").map((text,index)=>({ path:"hani-feature-v00001.js", line:index+1, change:"added", text, scanText:duplicateEventScan[index] }));
  const duplicateEventResult = detectRisks(localEventChanges, duplicateEventRecords, new Map([["hani-feature-v00001.js", { headText:duplicateEventSource, headLines:duplicateEventScan }]]));
  if (checkStatus(duplicateEventResult.checks, "event_layering_risk") !== "BLOCKED") throw new Error("self-test duplicate event detection failed");
  for (const globalEventSource of ["document.addEventListener('click', handler);", "window.addEventListener('resize', handler);"]) {
    const globalEventScan = stripNonCodeText(globalEventSource).split("\n");
    const globalEventRecords = [{ path:"hani-feature-v00001.js", line:1, change:"added", text:globalEventSource, scanText:globalEventScan[0] }];
    const globalEventResult = detectRisks(localEventChanges, globalEventRecords, new Map([["hani-feature-v00001.js", { headText:globalEventSource, headLines:globalEventScan }]]));
    if (checkStatus(globalEventResult.checks, "event_layering_risk") !== "BLOCKED") throw new Error(`self-test global listener detection failed: ${globalEventSource}`);
  }
  const supabaseFunctionPath = "supabase/functions/hani-learning-quiz/index.ts";
  const supabaseReadOnlySource = "const supabase = createClient(url, key); await supabase.auth.getUser();";
  const supabaseReadOnlyChecks = resultForFile(supabaseReadOnlySource, supabaseFunctionPath);
  if (checkStatus(supabaseReadOnlyChecks, "changed_file_scope") !== "PASS" || checkStatus(supabaseReadOnlyChecks, "supabase_mutation") !== "PASS") throw new Error("self-test read-only Supabase Function scope failed");
  const supabaseWriteSource = "const supabase = client; supabase.from('items').insert(row);";
  if (checkStatus(resultForFile(supabaseWriteSource, supabaseFunctionPath), "supabase_mutation") !== "BLOCKED") throw new Error("self-test Supabase DB write detection failed");
  const deletedScope = detectRisks([{ status: "D", path: "legacy.out-of-scope" }], [], new Map());
  if (deletedScope.checks.find(check => check.id === "changed_file_scope")?.status !== "BLOCKED") throw new Error("self-test deleted out-of-scope detection failed");
  if (!BINARY_EXTENSIONS.has(".png")) throw new Error("self-test binary classification failed");
  process.stdout.write(JSON.stringify({ self_test: "PASS", tool_version: TOOL_VERSION }) + "\n");
}

function main() {
  if (has("--self-test")) return selfTest();

  const baseRef = option("--base") || process.env.PREQA_BASE_SHA || "origin/main";
  const headRef = option("--head") || process.env.PREQA_HEAD_SHA || "HEAD";
  const outputPath = option("--output");
  const worktree = has("--worktree");
  const baseMainSha = resolveCommit(baseRef, "base");
  const commitSha = resolveCommit(headRef, "head");
  const comparisonBaseSha = worktree ? baseMainSha : resolveCommit(git(["merge-base", baseRef, headRef]).stdout.trim(), "merge-base");
  const diffTarget = worktree ? baseRef : `${baseRef}...${headRef}`;
  const diffArgs = ["diff", "--no-ext-diff", "--no-color", "--unified=0", diffTarget, "--"];
  const statusArgs = ["diff", "--no-ext-diff", "--name-status", "--find-renames", diffTarget, "--"];
  const patch = git(diffArgs).stdout;
  const fileChanges = parseNameStatus(git(statusArgs).stdout);
  const records = parsePatch(patch);
  let binaryFiles = [];

  if (worktree) {
    const untracked = git(["ls-files", "--others", "--exclude-standard"]).stdout.split(/\r?\n/).filter(Boolean).map(normalizePath);
    for (const file of untracked) {
      if (!fileChanges.some(change => change.path === file)) fileChanges.push({ status: "A", path: file });
    }
    const untrackedScan = untrackedRecords(untracked);
    records.push(...untrackedScan.records);
    binaryFiles.push(...untrackedScan.binaryFiles);
  }

  const uniqueChanges = [...new Map(fileChanges.map(change => [change.path, change])).values()].sort((a, b) => a.path.localeCompare(b.path));
  const changedFiles = uniqueChanges.map(change => change.path);
  binaryFiles = [...new Set([...binaryFiles, ...changedFiles.filter(file => BINARY_EXTENSIONS.has(path.extname(file).toLowerCase()))])].sort();
  const snapshots = buildSourceSnapshots(uniqueChanges, { worktree, comparisonBaseSha, commitSha });
  const scannedRecords = attachScanText(records, snapshots);
  const { checks } = detectRisks(uniqueChanges, scannedRecords, snapshots);
  const uiFiles = uniqueChanges.filter(change => isUiFile(change, snapshots)).map(change => change.path);
  checks.push({
    id: "changed_files_inventory",
    label: "변경 파일 목록",
    status: "PASS",
    detail: `${changedFiles.length}개 파일: ${changedFiles.join(", ") || "변경 없음"}`,
    evidence: []
  });
  checks.push({
    id: "ui_change_detection",
    label: "UI 변경 여부",
    status: "PASS",
    detail: uiFiles.length ? `Arin Review 필요: ${uiFiles.join(", ")}` : "UI 변경이 없어 Arin Review는 N/A입니다.",
    evidence: []
  });
  checks.push({
    id: "binary_content_scan",
    label: "바이너리 내용 스캔",
    status: "PASS",
    detail: binaryFiles.length ? `바이너리 ${binaryFiles.length}개는 changed_files에 유지하고 내용 스캔만 제외했습니다: ${binaryFiles.join(", ")}` : "바이너리 변경 파일이 없습니다.",
    evidence: []
  });

  const blocked = checks.some(check => check.status === "BLOCKED");
  const report = {
    contract_version: CONTRACT_VERSION,
    tool_version: TOOL_VERSION,
    commit_sha: commitSha,
    base_main_sha: baseMainSha,
    source_mode: worktree ? "WORKTREE_DRY_RUN" : "COMMIT_RANGE",
    worktree_dirty: git(["status", "--porcelain=v1"]).stdout.trim().length > 0,
    changed_files: changedFiles,
    yuri_state: blocked ? "YURI_PRE_QA_BLOCKED" : "YURI_PRE_QA_PASS",
    checks,
    arin_required: uiFiles.length > 0,
    arin_state: uiFiles.length > 0 ? "PENDING" : "N/A",
    generated_at: new Date().toISOString()
  };
  validateReportShape(report);

  const json = JSON.stringify(report, null, 2) + "\n";
  if (outputPath) writeFileSync(outputPath, json, "utf8");
  else process.stdout.write(json);
  if (blocked && !has("--no-fail")) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`HANI Release Pre-QA 실행 실패: ${error.message || error}\n`);
  process.exitCode = 2;
}
