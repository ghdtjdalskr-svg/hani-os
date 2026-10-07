import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const DRIVE_VAULT_PRECHECK_CONTRACT = "hani-drive-vault-precheck-v1";
export const HANI_BACKUP_STORAGE_KEY = "hani_os_life_v23";
export const MAX_BACKUP_BYTES = 30 * 1024 * 1024;

const recordLists = [
  "accounts",
  "instruments",
  "transactions",
  "snapshots",
  "investmentMonthlySnapshots",
  "investmentBrokerSnapshots",
  "investmentCashFlows",
  "investmentJournal",
  "investmentWatchlist",
  "ledgerMonths",
  "spendReviews",
  "body",
  "exercise",
  "cardio",
  "strength",
  "books",
  "movies",
  "diaries",
  "tasks",
  "campusSemesters",
  "travelTrips",
  "travelPlaces",
  "travelWishlist",
  "certificates",
  "wishlistItems",
  "learningProjects",
  "learningQuizzes",
  "learningWrongAnswers",
  "monthlyReports",
  "goalRegistry"
];

const secretKeyPattern = /(^|[_-])(access|refresh|id)?token($|[_-])|secret|password|service[_-]?role|api[_-]?key|authorization/i;
const camelSecretKeyPattern = /^(accessToken|refreshToken|idToken|apiKey)$/i;
const secretValuePattern = /(sb_secret_[A-Za-z0-9_-]{20,}|ya29\.[A-Za-z0-9_-]{20,}|Bearer\s+[A-Za-z0-9._-]{20,}|-----BEGIN\s+(?:RSA\s+)?PRIVATE KEY-----)/i;

export function sha256Hex(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function byteLength(text) {
  return Buffer.byteLength(text, "utf8");
}

function assertPlainRecordList(data) {
  for (const key of recordLists) {
    if (data[key] === undefined) continue;
    if (!Array.isArray(data[key]) || data[key].some(row => !row || typeof row !== "object" || Array.isArray(row))) {
      throw new Error(`INVALID_RECORD_LIST:${key}`);
    }
  }
}

function detectSecrets(value, path = "$", hits = [], depth = 0) {
  if(depth>128)throw new Error('BACKUP_TOO_DEEP');
  if (hits.length >= 8 || value === null || value === undefined) return hits;
  if (typeof value === "string") {
    if (secretValuePattern.test(value)) hits.push(path);
    return hits;
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length && hits.length < 8; index += 1) detectSecrets(value[index], `${path}[]`, hits,depth+1);
    return hits;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if ((secretKeyPattern.test(key)||camelSecretKeyPattern.test(key)) && child !== "" && child !== null && child !== undefined) hits.push(childPath);
      detectSecrets(child, childPath, hits,depth+1);
      if (hits.length >= 8) break;
    }
  }
  return hits;
}

function summarize(data) {
  return {
    accounts: data.accounts?.length || 0,
    instruments: (data.instruments || data.assets || []).length,
    transactions: (data.transactions || data.trades || []).length,
    monthlySnapshots: (data.investmentMonthlySnapshots || []).length + (data.investmentBrokerSnapshots || []).length,
    ledgers: data.ledgerMonths?.length || 0,
    books: data.books?.length || 0,
    movies: data.movies?.length || 0,
    diaries: data.diaries?.length || 0,
    travelTrips: data.travelTrips?.length || 0,
    travelPlaces: data.travelPlaces?.length || 0,
    goals: data.goalRegistry?.length || 0
  };
}

export function inspectHaniBackupBuffer(buffer, { fileName = "selected-backup.json" } = {}) {
  const bytes = buffer.length;
  const hash = sha256Hex(buffer);
  const resultBase = {
    contract: DRIVE_VAULT_PRECHECK_CONTRACT,
    fileName,
    bytes,
    sha256: hash,
    driveApiUsed: false,
    restoreExecuted: false,
    storageWriteRequired: false
  };
  if (bytes > MAX_BACKUP_BYTES) throw Object.assign(new Error("BACKUP_TOO_LARGE"), { result: resultBase });

  let parsed;
  const text = buffer.toString("utf8");
  try {
    parsed = JSON.parse(text);
  } catch {
    throw Object.assign(new Error("INVALID_JSON"), { result: resultBase });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw Object.assign(new Error("INVALID_ROOT"), { result: resultBase });
  }

  const data = parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data) ? parsed.data : parsed;
  const metadata = parsed._haniBackup && typeof parsed._haniBackup === "object" ? parsed._haniBackup : null;
  if(parsed._haniBackup!==undefined&&(!metadata||Array.isArray(metadata)))throw new Error('INVALID_BACKUP_METADATA');
  if(metadata&&(metadata.format!==1||metadata.storageKey!==HANI_BACKUP_STORAGE_KEY))throw new Error('UNSUPPORTED_BACKUP_METADATA');
  const declaredVersions=[parsed.version,data.version,metadata?.version].filter(v=>v!==undefined);
  if(declaredVersions.some(v=>v!=='2.9.15-safe-baseline-bootstrap'))throw new Error('UNSUPPORTED_BACKUP_VERSION');
  const hasAccounts = Array.isArray(data.accounts);
  const kind = hasAccounts && ["instruments", "transactions", "books", "movies", "body", "exercise"].some(key => Array.isArray(data[key]))
    ? "current"
    : hasAccounts && (Array.isArray(data.assets) || Array.isArray(data.trades) || Array.isArray(data.cash))
      ? "v22"
      : null;
  if (!kind) throw Object.assign(new Error("UNKNOWN_HANI_BACKUP_CONTRACT"), { result: resultBase });
  if (data.accounts.some(account => !account || typeof account !== "object" || Array.isArray(account))) {
    throw Object.assign(new Error("INVALID_ACCOUNTS"), { result: resultBase });
  }
  if (kind === "current") assertPlainRecordList(data);
  else for(const key of ['assets','trades','cash'])if(data[key]!==undefined&&(!Array.isArray(data[key])||data[key].some(row=>!row||typeof row!=='object'||Array.isArray(row))))throw new Error('INVALID_LEGACY_LIST');

  const secretHits = detectSecrets(parsed);
  if (secretHits.length) {
    throw Object.assign(new Error("SECRET_LIKE_CONTENT_REJECTED"), {
      result: { ...resultBase, kind, secretDetected: true }
    });
  }

  return {
    ...resultBase,
    ok: true,
    kind,
    backupFormat: metadata?.format ?? null,
    backupVersion: declaredVersions[0] || null,
    storageKey: metadata?.storageKey || null,
    storageKeyMatches: metadata?.storageKey ? metadata.storageKey === HANI_BACKUP_STORAGE_KEY : null,
    summary: summarize(data),
    warnings: [
      ...(metadata && metadata.storageKey !== HANI_BACKUP_STORAGE_KEY ? ["STORAGE_KEY_MISMATCH"] : []),
      ...(!metadata ? ["MISSING_HANI_BACKUP_METADATA"] : [])
    ]
  };
}

export async function inspectHaniBackupFile(filePath) {
  const info=await stat(filePath);if(!info.isFile())throw new Error('BACKUP_NOT_FILE');if(info.size>MAX_BACKUP_BYTES)throw new Error('BACKUP_TOO_LARGE');
  return inspectHaniBackupBuffer(await readFile(filePath), { fileName: filePath.split(/[\\/]/).pop() || "selected-backup.json" });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/hani-drive-vault-precheck.mjs <backup.json>");
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(await inspectHaniBackupFile(filePath), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      reason: /^[A-Z_]+(?::[a-zA-Z]+)?$/.test(error.message)?error.message:'BACKUP_READ_FAILED',
      ...(error.result ? { fileName: error.result.fileName, bytes: error.result.bytes, sha256: error.result.sha256 } : {})
    }, null, 2));
    process.exit(1);
  }
}
