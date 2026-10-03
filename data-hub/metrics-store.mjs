// Batch B: isolated cache adapter; deliberately not imported by application runtime.
import {ENGINE_VERSION, DEFAULT_REGISTRY, createRegistry, metricPeriod, validDate, koreaDate, calculateMonth} from './metrics-core.mjs';
export const DATABASE_NAME = 'hani_data_hub_v1';
export const DATABASE_VERSION = 1;
const clone = value => structuredClone(value);
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const canonicalJson = value => {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).sort().join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
};
export async function digest(value, cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider?.subtle) throw new Error('SHA256_UNAVAILABLE');
  const bytes = await cryptoProvider.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(value)));
  return 'sha256:' + [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
function validateBinding(binding) {
  if (!binding || binding.sourceOwnerVerified !== true || binding.sourceOwnerId !== binding.userId ||
      !['projectRef', 'userId', 'sourceOwnerId', 'datasetId', 'sessionEpoch'].every(key => typeof binding[key] === 'string' && binding[key].length > 0)) throw new Error('OWNER_UNVERIFIED');
  return canonicalJson(binding);
}
export async function datasetScope(binding, cryptoProvider) {
  validateBinding(binding);
  return digest(['hani-data-hub-owner-v1', binding.projectRef, binding.userId, binding.datasetId], cryptoProvider);
}
const pick = (row, fields) => Object.fromEntries(fields.filter(key => row?.[key] !== undefined).map(key => [key, clone(row[key])]));
const common = ['id', 'updatedAt', 'createdAt'];
function projection(rows, definition, month, asOf, customProjectors) {
  if (!Array.isArray(rows)) return null;
  const period = metricPeriod(month, definition.period_basis), cutoff = asOf < period.period_end ? asOf : period.period_end;
  const inside = date => !validDate(date) || (date >= period.period_start && date <= cutoff);
  switch (definition.adapter) {
    case 'weight': return rows.filter(row => inside(row?.date)).map(row => pick(row, [...common, 'date', 'weight']));
    case 'steps': return rows.filter(row => inside(row?.date)).map(row => pick(row, [...common, 'date', 'steps']));
    case 'books': return rows.filter(row => row?.status === 'read' &&
      (inside(row.readDate || row.completedDate) || (row.readDate && row.completedDate && inside(row.completedDate))))
      .map(row => pick(row, [...common, 'status', 'readDate', 'completedDate']));
    case 'quiz': return rows.filter(row => row?.status === 'completed' && inside(koreaDate(row.completedAt)))
      .map(row => pick(row, [...common, 'status', 'completedAt', 'total', 'correctCount']));
    case 'ledger': return rows.filter(row => row?.month === month).map(row => ({...pick(row, [...common, 'month', 'periodStart', 'periodEnd']),
      items: Array.isArray(row.items) ? row.items.map(item => pick(item, ['id', 'date', 'category', 'amount', 'reimbursement'])) : null}));
    case 'investment': return rows.filter(row => row?.period === month && row.mode === 'actual' && row.status === 'confirmed' && row.recordType !== 'positions')
      .map(row => ({...pick(row, [...common, 'mode', 'status', 'recordType', 'period', 'snapshotDate', 'revision']),
        accounts: (row.accounts || []).filter(account => account.enabled).map(account => {
          if (account.estimatedAssets != null) return pick(account, ['enabled', 'estimatedAssets']);
          if (account.totalEvaluation != null) return pick(account, ['enabled', 'totalEvaluation']);
          return {enabled: account.enabled, holdings: (account.holdings || []).map(holding => holding.evaluationAmount != null ?
            pick(holding, ['evaluationAmount']) : pick(holding, ['quantity', 'currentPrice']))};
        })}));
    default: {
      if (typeof customProjectors[definition.adapter] !== 'function') throw new Error('SOURCE_PROJECTOR_REQUIRED');
      return customProjectors[definition.adapter](freeze(clone(rows)), {month, asOf, period});
    }
  }
}
const fields = new Set(['value', 'sample_count', 'as_of', 'numerator', 'denominator', 'observed_days', 'total',
  'metric_id', 'name', 'domain', 'month', 'unit', 'kind', 'aggregation', 'period_basis', 'period_start', 'period_end',
  'status', 'reasons', 'coverage', 'source', 'source_revision', 'calculated_at', 'revision', 'definition_version', 'engine_version',
  'attempted_source_revision', 'last_attempt_at', 'goal_id', 'goal_revision']);
const identity = row => row.metric_id + '\u0000' + row.month;
function validateRows(rows, registry, months) {
  if (!Array.isArray(rows) || !Array.isArray(months) || !months.length || new Set(months).size !== months.length) throw new Error('INVALID_MANIFEST');
  const definitions = new Map(registry.map(def => [def.metric_id, def])), keys = new Set();
  for (const row of rows) {
    const def = definitions.get(row.metric_id), period = def && metricPeriod(row.month, def.period_basis);
    if (!def || !months.includes(row.month) || keys.has(identity(row)) || Object.keys(row).some(key => !fields.has(key)) ||
        row.definition_version !== def.definition_version || row.engine_version !== ENGINE_VERSION || row.unit !== def.unit ||
        row.kind !== def.kind || row.aggregation !== def.aggregation || row.source !== def.source ||
        ['period_basis', 'period_start', 'period_end'].some(key => row[key] !== period[key]) ||
        !['CONFIRMED', 'PARTIAL', 'NO_DATA', 'STALE'].includes(row.status) ||
        (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value))) ||
        (row.status === 'NO_DATA' && row.value !== null) || !Array.isArray(row.reasons) || row.reasons.some(reason => typeof reason !== 'string') ||
        !Number.isInteger(row.sample_count) || row.sample_count < 0 || !Number.isInteger(row.revision) || row.revision < 1 ||
        !koreaDate(row.calculated_at) || (row.as_of !== null && !validDate(row.as_of))) throw new Error('INVALID_METRIC_ROW');
    if (!row.coverage || Object.keys(row.coverage).some(key => !['ready', 'complete', 'period_complete'].includes(key)) ||
        Object.values(row.coverage).some(value => typeof value !== 'boolean') ||
        ['numerator', 'denominator', 'observed_days', 'total', 'goal_revision'].some(key => row[key] !== undefined &&
          (typeof row[key] !== 'number' || !Number.isFinite(row[key]))) ||
        (row.goal_id !== undefined && typeof row.goal_id !== 'string')) throw new Error('INVALID_METRIC_ROW');
    keys.add(identity(row));
  }
  if (keys.size !== registry.length * months.length) throw new Error('INCOMPLETE_GENERATION');
}
const comparisonRefs = rows => rows.flatMap(row => row.goal_id ? [{metric_id: row.metric_id, month: row.month,
  goal_id: row.goal_id, goal_revision: row.goal_revision}] : []);
const manifestFor = rows => rows.map(row => ({metric_id: row.metric_id, month: row.month, definition_version: row.definition_version,
  unit: row.unit, period_basis: row.period_basis, period_start: row.period_start, period_end: row.period_end}));
function contentFor(rows, metadata) {
  const relevantRows = rows.map(row => Object.fromEntries(Object.entries(row).filter(([key]) =>
    !['source_revision', 'revision', 'calculated_at', 'last_attempt_at', 'attempted_source_revision'].includes(key))));
  return {relevantRows, fingerprints: metadata.fingerprints, manifest: metadata.manifest,
    goal_references: metadata.goal_references, engine_version: metadata.engine_version};
}
async function verifySnapshot(rows, metadata, cryptoProvider) {
  if (!Array.isArray(rows) || !metadata || !Array.isArray(metadata.manifest) || !metadata.fingerprints ||
      metadata.engine_version !== ENGINE_VERSION || !koreaDate(metadata.created_at) ||
      rows.length !== metadata.manifest.length || new Set(rows.map(identity)).size !== rows.length ||
      rows.some(row => Object.keys(row).some(key => !fields.has(key))) ||
      canonicalJson(manifestFor(rows)) !== canonicalJson(metadata.manifest) ||
      canonicalJson(comparisonRefs(rows)) !== canonicalJson(metadata.goal_references) ||
      canonicalJson(Object.fromEntries(rows.map(row => [row.metric_id, row.definition_version]))) !== canonicalJson(metadata.definition_versions) ||
      Object.keys(metadata.fingerprints).length !== rows.length || rows.some(row =>
        !/^sha256:[0-9a-f]{64}$/.test(metadata.fingerprints[identity(row)] || ''))) throw new Error('INVALID_CACHE');
  if (await digest(rows, cryptoProvider) !== metadata.rows_hash ||
      await digest(metadata.fingerprints, cryptoProvider) !== metadata.source_fingerprint ||
      await digest(contentFor(rows, metadata), cryptoProvider) !== metadata.content_hash) throw new Error('INVALID_CACHE');
}
export async function prepareSnapshot(source, options) {
  const {rows, months, asOf, createdAt, registry = DEFAULT_REGISTRY, sourceContext = {}, canonicalVersion = null,
    projectors = {}, binding, cryptoProvider = globalThis.crypto} = options;
  validateBinding(binding);
  const sourceSnapshot = freeze(clone(source));
  const bindingSnapshot = freeze(clone(binding));
  const coverageSnapshot = freeze(clone(sourceContext));
  const definitions = createRegistry(registry);
  if (!validDate(asOf) || !koreaDate(createdAt)) throw new Error('INVALID_CLOCK');
  validateRows(rows, definitions, months);
  const safeRows = clone(rows), fingerprints = {};
  for (const row of safeRows) {
    const def = definitions.find(value => value.metric_id === row.metric_id);
    fingerprints[identity(row)] = await digest({definition_version: def.definition_version, engine_version: ENGINE_VERSION,
      period: metricPeriod(row.month, def.period_basis),
      raw: projection(sourceSnapshot?.[def.source], def, row.month, asOf, projectors),
      coverage: coverageSnapshot[def.source] || {},
      canonicalVersion: ['investment', 'ledger'].includes(def.adapter) ? canonicalVersion : null}, cryptoProvider);
  }
  const definition_versions = Object.fromEntries(definitions.map(def => [def.metric_id, def.definition_version]));
  const manifest = manifestFor(safeRows);
  const goal_references = comparisonRefs(safeRows);
  const relevantRows = safeRows.map(row => Object.fromEntries(Object.entries(row).filter(([key]) =>
    !['source_revision', 'revision', 'calculated_at', 'last_attempt_at', 'attempted_source_revision'].includes(key))));
  const source_fingerprint = await digest(fingerprints, cryptoProvider);
  const content_hash = await digest({relevantRows, fingerprints, manifest, goal_references, engine_version: ENGINE_VERSION}, cryptoProvider);
  const rows_hash = await digest(safeRows, cryptoProvider);
  return freeze({rows: safeRows, context_digest: await digest(bindingSnapshot, cryptoProvider), metadata: {
    dataset_scope: await datasetScope(bindingSnapshot, cryptoProvider), created_at: createdAt, engine_version: ENGINE_VERSION, definition_versions,
    source_fingerprint, content_hash, rows_hash, manifest, fingerprints, goal_references}});
}
const schema = {
  generations: {key: ['dataset_scope', 'generation_id'], indexes: {by_scope: 'dataset_scope'}},
  metrics: {key: ['dataset_scope', 'generation_id', 'metric_id', 'month', 'definition_version'], indexes: {by_generation: ['dataset_scope', 'generation_id']}},
  pointers: {key: 'dataset_scope', indexes: {}}
};
function validateSchema(db) {
  if (db.version !== DATABASE_VERSION || canonicalJson([...db.objectStoreNames]) !== canonicalJson(Object.keys(schema))) throw new Error('NAMESPACE_OR_SCHEMA_COLLISION');
  const tx = db.transaction(Object.keys(schema), 'readonly');
  for (const [name, contract] of Object.entries(schema)) {
    const store = tx.objectStore(name);
    if (canonicalJson(store.keyPath) !== canonicalJson(contract.key) || canonicalJson([...store.indexNames]) !== canonicalJson(Object.keys(contract.indexes))) throw new Error('NAMESPACE_OR_SCHEMA_COLLISION');
    for (const [index, key] of Object.entries(contract.indexes)) if (canonicalJson(store.index(index).keyPath) !== canonicalJson(key)) throw new Error('NAMESPACE_OR_SCHEMA_COLLISION');
  }
}
export function createMetricsStore({factory = globalThis.indexedDB, cryptoProvider = globalThis.crypto, getBinding, fault = () => {}} = {}) {
  if (typeof getBinding !== 'function') throw new Error('LIVE_BINDING_REQUIRED');
  let active = null, epoch = 0, dbPromise = null;
  const transactions = new Set();
  const invalidate = () => { active = null; epoch++; for (const tx of transactions) { try { tx.abort(); } catch {} } };
  function check(token) {
    if (!active || token !== epoch || validateBinding(getBinding()) !== active.binding) { invalidate(); throw new Error('CONTEXT_CHANGED'); }
    return active.scope;
  }
  async function activate(binding) {
    invalidate(); const token = epoch, signature = validateBinding(binding);
    if (validateBinding(getBinding()) !== signature) throw new Error('CONTEXT_CHANGED');
    const scope = await datasetScope(binding, cryptoProvider);
    if (token !== epoch || validateBinding(getBinding()) !== signature) throw new Error('CONTEXT_CHANGED');
    const contextDigest = await digest(binding, cryptoProvider);
    if (token !== epoch || validateBinding(getBinding()) !== signature) throw new Error('CONTEXT_CHANGED');
    active = {scope, binding: signature, contextDigest}; return scope;
  }
  async function open(token) {
    check(token);
    if (!dbPromise) dbPromise = (async () => {
      fault('open');
      if (!factory?.databases) throw new Error('NAMESPACE_VERIFICATION_UNAVAILABLE');
      const names = await factory.databases(); check(token);
      const existing = names.find(info => info.name === DATABASE_NAME);
      if (existing && existing.version !== DATABASE_VERSION) throw new Error('DATABASE_VERSION_MISMATCH');
      return new Promise((resolve, reject) => {
        const request = factory.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = event => {
          if (event.oldVersion !== 0) { request.transaction.abort(); return; }
          for (const [name, contract] of Object.entries(schema)) {
            const store = request.result.createObjectStore(name, {keyPath: contract.key});
            for (const [index, key] of Object.entries(contract.indexes)) store.createIndex(index, key);
          }
        };
        request.onerror = () => reject(request.error || new Error('OPEN_FAILED'));
        request.onblocked = () => reject(new Error('OPEN_BLOCKED'));
        request.onsuccess = () => {
          try { check(token); validateSchema(request.result); } catch (error) { request.result.close(); reject(error); return; }
          request.result.onversionchange = () => { request.result.close(); dbPromise = null; invalidate(); };
          resolve(request.result);
        };
      });
    })().catch(error => { dbPromise = null; throw error; });
    const db = await dbPromise; check(token); return db;
  }
  async function readActive(expectation = null) {
    const token = epoch;
    try {
      const scope = check(token), db = await open(token);
      const snapshot = await new Promise((resolve, reject) => {
        const tx = db.transaction(Object.keys(schema), 'readonly'); transactions.add(tx);
        let pointer, metadata, storedRows;
        tx.onabort = () => { transactions.delete(tx); reject(tx.error || new Error('READ_ABORTED')); };
        tx.onerror = () => {};
        tx.oncomplete = () => { transactions.delete(tx); resolve(pointer ? {pointer, metadata, storedRows} : null); };
        const request = tx.objectStore('pointers').get(scope);
        request.onsuccess = () => {
          pointer = request.result;
          if (!pointer) return;
          const meta = tx.objectStore('generations').get([scope, pointer.generation_id]);
          meta.onsuccess = () => { metadata = meta.result; };
          const rows = tx.objectStore('metrics').index('by_generation').getAll([scope, pointer.generation_id]);
          rows.onsuccess = () => { storedRows = rows.result; };
        };
      });
      check(token);
      if (!snapshot) return {status: 'CACHE_MISS', rows: [], generation: null};
      const {pointer, metadata, storedRows} = snapshot;
      if (!metadata || metadata.dataset_scope !== scope || metadata.generation_id !== pointer.generation_id || metadata.status !== 'READY' ||
          metadata.content_hash !== pointer.content_hash || metadata.sequence !== pointer.sequence ||
          !Array.isArray(storedRows) || storedRows.some(row => row.dataset_scope !== scope || row.generation_id !== pointer.generation_id)) throw new Error('INVALID_CACHE');
      const rows = storedRows.map(({dataset_scope, generation_id, ...row}) => row);
      await verifySnapshot(rows, metadata, cryptoProvider);
      check(token);
      let status = 'READY';
      if (expectation && (expectation.metadata.content_hash !== metadata.content_hash)) {
        status = 'STALE';
        for (const row of rows) {
          const target = expectation.metadata.manifest.find(item => identity(item) === identity(row));
          const targetRow = expectation.rows.find(item => identity(item) === identity(row));
          if (!target || target.definition_version !== row.definition_version ||
              expectation.metadata.fingerprints[identity(row)] !== metadata.fingerprints[identity(row)] ||
              expectation.metadata.engine_version !== metadata.engine_version ||
              (targetRow && canonicalJson([targetRow.status, targetRow.reasons, targetRow.coverage, targetRow.value, targetRow.as_of]) !==
                canonicalJson([row.status, row.reasons, row.coverage, row.value, row.as_of])) ||
              canonicalJson(expectation.metadata.goal_references.filter(ref => identity(ref) === identity(row))) !==
                canonicalJson(metadata.goal_references.filter(ref => identity(ref) === identity(row)))) {
            row.status = 'STALE'; row.reasons = [...new Set([...row.reasons, 'CACHE_CONTRACT_CHANGED'])];
          }
        }
      }
      return freeze({status, generation: metadata, rows});
    } catch (error) { return {status: 'STORAGE_WARNING', warning: error.message, rows: [], generation: null}; }
  }
  async function publish(prepared, {expectedGeneration} = {}) {
    const token = epoch;
    try {
      const scope = check(token);
      if (expectedGeneration === undefined) throw new Error('EXPECTED_GENERATION_REQUIRED');
      if (prepared.metadata.dataset_scope !== scope || prepared.context_digest !== active.contextDigest) throw new Error('SNAPSHOT_OWNER_MISMATCH');
      await verifySnapshot(prepared.rows, prepared.metadata, cryptoProvider);
      const db = await open(token); check(token);
      const result = await new Promise((resolve, reject) => {
        const tx = db.transaction(Object.keys(schema), 'readwrite'); transactions.add(tx);
        let result, failure;
        const fail = error => { failure = error; try { tx.abort(); } catch {} };
        tx.onabort = () => { transactions.delete(tx); reject(failure || tx.error || new Error('PUBLISH_ABORTED')); };
        tx.onerror = () => {};
        tx.oncomplete = () => { transactions.delete(tx); resolve(result); };
        const pointers = tx.objectStore('pointers'), generations = tx.objectStore('generations'), metrics = tx.objectStore('metrics');
        const request = pointers.get(scope);
        request.onsuccess = () => {
          try {
            check(token); const previous = request.result;
            if ((previous?.generation_id || null) !== expectedGeneration) throw new Error('GENERATION_CONFLICT');
            if (previous?.content_hash === prepared.metadata.content_hash) { result = {status: 'UNCHANGED', generation_id: previous.generation_id}; return; }
            fault('before_write', tx);
            const sequence = (previous?.sequence || 0) + 1;
            const generation_id = `g${sequence}-${prepared.metadata.content_hash.slice(7, 23)}`;
            const metadata = {...clone(prepared.metadata), dataset_scope: scope, generation_id, sequence, status: 'READY'};
            for (const row of prepared.rows) metrics.put({...clone(row), dataset_scope: scope, generation_id});
            generations.put(metadata);
            if (previous) {
              const old = generations.get([scope, previous.generation_id]);
              old.onsuccess = () => { if (old.result) generations.put({...old.result, status: 'SUPERSEDED'}); };
            }
            const history = generations.index('by_scope').getAll(scope);
            history.onsuccess = () => {
              for (const old of history.result) {
                if ([generation_id, previous?.generation_id].includes(old.generation_id)) continue;
                generations.delete([scope, old.generation_id]);
                const cursor = metrics.index('by_generation').openCursor([scope, old.generation_id]);
                cursor.onsuccess = () => { if (cursor.result) { cursor.result.delete(); cursor.result.continue(); } };
              }
            };
            fault('after_rows', tx);
            pointers.put({dataset_scope: scope, generation_id, sequence, content_hash: metadata.content_hash});
            fault('after_pointer', tx);
            result = {status: 'PUBLISHED', generation_id};
          } catch (error) { fail(error); }
        };
      });
      check(token); return result;
    } catch (error) {
      const current = (() => { try { check(token); return true; } catch { return false; } })();
      const sameOwner = current && prepared?.metadata?.dataset_scope === active?.scope && prepared?.context_digest === active?.contextDigest;
      return {status: 'STORAGE_WARNING', warning: error.message, fallback: sameOwner ? clone(prepared) : null};
    }
  }
  async function reset() {
    const token = epoch;
    try {
      const scope = check(token), db = await open(token);
      await new Promise((resolve, reject) => {
        const tx = db.transaction(Object.keys(schema), 'readwrite'); transactions.add(tx);
        tx.onabort = () => { transactions.delete(tx); reject(tx.error || new Error('RESET_ABORTED')); };
        tx.oncomplete = () => { transactions.delete(tx); resolve(); };
        tx.objectStore('pointers').delete(scope);
        // Reset is exceptional: also remove orphan rows belonging only to this scope.
        const orphanCursor = tx.objectStore('metrics').openCursor();
        orphanCursor.onsuccess = () => {
          if (orphanCursor.result) {
            if (orphanCursor.result.value.dataset_scope === scope) orphanCursor.result.delete();
            orphanCursor.result.continue();
          }
        };
        const request = tx.objectStore('generations').index('by_scope').getAll(scope);
        request.onsuccess = () => {
          for (const generation of request.result) {
            tx.objectStore('generations').delete([scope, generation.generation_id]);
            const cursor = tx.objectStore('metrics').index('by_generation').openCursor([scope, generation.generation_id]);
            cursor.onsuccess = () => { if (cursor.result) { cursor.result.delete(); cursor.result.continue(); } };
          }
        };
      });
      check(token); return {status: 'RESET'};
    } catch (error) { return {status: 'STORAGE_WARNING', warning: error.message}; }
  }
  async function rebuild(source, options) {
    const token = epoch;
    try {
      check(token); const previous = await readActive(); check(token);
      const rows = options.months.flatMap(month => calculateMonth(source, {...options, month,
        previousRows: previous.rows || []}));
      const prepared = await prepareSnapshot(source, {...options, rows, binding: clone(getBinding()), cryptoProvider}); check(token);
      return publish(prepared, {expectedGeneration: previous.generation?.generation_id || null});
    } catch (error) { return {status: 'STORAGE_WARNING', warning: error.message}; }
  }
  async function close() { invalidate(); if (dbPromise) { try { (await dbPromise).close(); } catch {} } dbPromise = null; }
  return {activate, invalidate, readActive, publish, reset, rebuild, close};
}
