import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium} = require(process.argv[2] || 'playwright');
const server = createServer((request, response) => {
  if (['/data-hub/metrics-core.mjs', '/data-hub/metrics-store.mjs'].includes(request.url)) {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(readFileSync(new URL('..' + request.url, import.meta.url)));
  } else if (request.url === '/') response.end('<!doctype html><title>Isolated synthetic Data Hub QA</title>');
  else { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({headless: true, ...(process.argv[3] ? {executablePath: process.argv[3]} : {})});
const results = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:' + server.address().port);
  const result = await page.evaluate(async () => {
    const core = await import('/data-hub/metrics-core.mjs');
    const storage = await import('/data-hub/metrics-store.mjs');
    const pass = [], failures = [];
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const equal = (a, b, message) => check(JSON.stringify(a) === JSON.stringify(b), message);
    const run = async (name, fn) => { try { await fn(); pass.push(name); } catch (error) { failures.push({name, error: error.message}); } };
    let binding = {projectRef: 'synthetic-project', userId: 'synthetic-owner-A', sourceOwnerId: 'synthetic-owner-A',
      datasetId: 'operational-life-state', sourceOwnerVerified: true, sessionEpoch: 'session-A'};
    const source = {
      investmentBrokerSnapshots: [{id: 'snapshot', mode: 'actual', status: 'confirmed', period: '2026-09', snapshotDate: '2026-09-20',
        accounts: [{enabled: true, estimatedAssets: 100}]}],
      body: [{id: 'body', date: '2026-09-20', weight: 101}],
      books: [{id: 'book', status: 'read', completedDate: '2026-09-20'}],
      exercise: [{id: 'steps', date: '2026-09-20', steps: 10000}],
      ledgerMonths: [{id: 'ledger', month: '2026-09', items: [{date: '2026-09-01', category: 'fixed', amount: 1500}]}],
      learningQuizzes: [{id: 'quiz', status: 'completed', completedAt: '2026-09-20T00:00:00Z', total: 10, correctCount: 8}]
    };
    const canonical = {version: 'synthetic-v1', brokerTotal: row => row.accounts[0].estimatedAssets,
      ledgerSpending: row => row.items.filter(item => item.category !== 'finance').reduce((sum, item) => sum + item.amount - (item.reimbursement || 0), 0)};
    const sourceContext = Object.fromEntries(core.DEFAULT_REGISTRY.map(def => [def.source, {ready: true, complete: true}]));
    const options = {months: ['2026-09'], asOf: '2026-09-30', calculatedAt: '2026-09-30T12:00:00Z',
      createdAt: '2026-09-30T12:00:00Z', sourceContext, canonical, canonicalVersion: canonical.version};
    const prepare = async (state = source, extra = {}) => {
      const rows = options.months.flatMap(month => core.calculateMonth(state, {...options, month, ...extra}));
      return storage.prepareSnapshot(state, {...options, rows, binding, ...extra});
    };
    const initialSource = JSON.stringify(source);
    const initialSourceHash = await storage.digest(source);
    localStorage.setItem('hani_os_life_v23', initialSource); // Synthetic sentinel, isolated origin only.
    localStorage.setItem('goal-history-sentinel', 'unchanged');
    let faultAt = '';
    const store = storage.createMetricsStore({getBinding: () => binding, fault: (stage, tx) => {
      if (stage === faultAt) {
        if (stage === 'abort_actual') tx.abort();
        throw new DOMException('injected-' + stage, faultAt === 'before_write' ? 'QuotaExceededError' : 'AbortError');
      }
    }});
    await store.activate(binding);
    let prepared = await prepare(), firstId;
    await run('A new database / CACHE_MISS distinct from NO_DATA', async () => {
      const read = await store.readActive(); check(read.status === 'CACHE_MISS', 'not cache miss');
      const names = await indexedDB.databases(); check(names.some(info => info.name === storage.DATABASE_NAME), 'DB absent');
    });
    await run('B/C publish and read coherent six-row generation', async () => {
      const published = await store.publish(prepared, {expectedGeneration: null});
      check(published.status === 'PUBLISHED', JSON.stringify(published)); firstId = published.generation_id;
      const read = await store.readActive(); check(read.status === 'READY', JSON.stringify(read));
      equal(read.rows.map(row => row.value).sort(), prepared.rows.map(row => row.value).sort(), 'rows differ');
      check(read.generation.generation_id === firstId && read.rows.length === 6, 'incoherent snapshot');
    });
    await run('D/E rollback after rows and after pointer preserves previous generation', async () => {
      const changed = structuredClone(source); changed.books.push({id: 'extra', status: 'read', readDate: '2026-09-22'});
      const next = await prepare(changed);
      for (const stage of ['after_rows', 'after_pointer']) {
        faultAt = stage; const publish = await store.publish(next, {expectedGeneration: firstId}); faultAt = '';
        check(publish.status === 'STORAGE_WARNING' && publish.fallback.rows.length === 6, 'missing safe fallback');
        const read = await store.readActive(); check(read.generation.generation_id === firstId, 'old pointer lost');
        equal(read.rows.find(row => row.metric_id === 'books_completed_count').value, 1, 'partial rows leaked');
      }
    });
    await run('F extensible 100 metrics without schema redesign', async () => {
      const extras = Array.from({length: 94}, (_, index) => ({...core.DEFAULT_REGISTRY[2],
        metric_id: 'custom_' + index, name: 'Custom ' + index, domain: 'Future', adapter: 'custom', source: 'customSource', comparison: 'none'}));
      const registry = core.createRegistry([...core.DEFAULT_REGISTRY, ...extras]);
      const extended = {...source, customSource: [{count: 1}]};
      const adapters = {...core.SOURCE_ADAPTERS, custom: () => ({value: 1, sample_count: 1, as_of: null})};
      const next = await prepare(extended, {registry, adapters, projectors: {custom: rows => rows.map(row => ({count: row.count}))}});
      const old = await store.readActive(); const published = await store.publish(next, {expectedGeneration: old.generation.generation_id});
      check(published.status === 'PUBLISHED', JSON.stringify(published));
      check((await store.readActive()).rows.length === 100, 'not 100 metrics');
      const restore = await store.publish(prepared, {expectedGeneration: published.generation_id}); firstId = restore.generation_id;
    });
    await run('G definition version / engine contract invalidation', async () => {
      const registry = core.createRegistry(core.DEFAULT_REGISTRY.map(def => def.adapter === 'steps' ? {...def, definition_version: 2} : def));
      const next = await prepare(source, {registry}); const read = await store.readActive(next);
      check(read.status === 'STALE', 'definition not stale');
      check(read.rows.find(row => row.metric_id === 'steps_daily_average').status === 'STALE', 'step not stale');
      check(read.rows.find(row => row.metric_id === 'books_completed_count').status === 'CONFIRMED', 'unrelated row stale');
    });
    await run('H selected source fields and affected period invalidation', async () => {
      const state = structuredClone(source); state.body[0].weight = 99;
      const next = await prepare(state); const read = await store.readActive(next);
      check(read.rows.find(row => row.metric_id === 'body_weight_kg').status === 'STALE', 'body not stale');
      check(read.rows.find(row => row.metric_id === 'books_completed_count').status === 'CONFIRMED', 'other domain stale');
      state.body[0].weight = 101; state.body[0].note = 'not relevant'; state.body.push({id: 'old', date: '2026-08-01', weight: 90});
      const irrelevant = await prepare(state);
      check(irrelevant.metadata.content_hash === prepared.metadata.content_hash, 'irrelevant fields/month invalidate');
    });
    await run('I/N legitimate deletion, observed zero vs NO_DATA', async () => {
      const state = structuredClone(source); state.books = []; state.exercise = [];
      const next = await prepare(state), current = await store.readActive();
      const published = await store.publish(next, {expectedGeneration: current.generation.generation_id});
      check(published.status === 'PUBLISHED', JSON.stringify(published));
      const read = await store.readActive();
      check(read.rows.find(row => row.metric_id === 'books_completed_count').value === 0, 'book zero absent');
      check(read.rows.find(row => row.metric_id === 'steps_daily_average').value === null, 'steps should be no data');
      firstId = (await store.publish(prepared, {expectedGeneration: published.generation_id})).generation_id;
    });
    await run('J owner switch, logout and prepared old-owner snapshot denied', async () => {
      const ownerA = binding;
      binding = {...ownerA, userId: 'synthetic-owner-B', sourceOwnerId: 'synthetic-owner-B', sessionEpoch: 'session-B'};
      check((await store.readActive()).status === 'STORAGE_WARNING', 'old active view survives');
      await store.activate(binding); check((await store.readActive()).status === 'CACHE_MISS', 'owner A leaked');
      const denied = await store.publish(prepared, {expectedGeneration: null});
      check(denied.warning === 'SNAPSHOT_OWNER_MISMATCH' && denied.fallback === null, 'old snapshot or fallback accepted');
      binding = null; check((await store.readActive()).status === 'STORAGE_WARNING', 'logout leak');
      binding = ownerA; await store.activate(binding); check((await store.readActive()).generation.generation_id === firstId, 'owner A cache deleted');
    });
    await run('K injected quota/write failure leaves operational save independent', async () => {
      const changed = structuredClone(source); changed.body[0].weight = 98;
      faultAt = 'before_write'; const published = await store.publish(await prepare(changed), {expectedGeneration: firstId}); faultAt = '';
      check(published.status === 'STORAGE_WARNING', 'quota not handled');
      check((await store.readActive()).generation.generation_id === firstId, 'quota changed pointer');
      check(localStorage.getItem('hani_os_life_v23') === initialSource, 'source changed');
    });
    await run('L schema/namespace mismatch rejected without upgrade', async () => {
      const bad = storage.createMetricsStore({getBinding: () => binding, factory: {databases: async () => [{name: storage.DATABASE_NAME, version: 99}], open: () => { throw new Error('must not open'); }}});
      await bad.activate(binding); check((await bad.readActive()).warning === 'DATABASE_VERSION_MISMATCH', 'version accepted'); await bad.close();
    });
    await run('M cache reset and deterministic reconstruction', async () => {
      check((await store.reset()).status === 'RESET', 'reset failed');
      check((await store.readActive()).status === 'CACHE_MISS', 'not empty');
      const rebuild = await store.rebuild(source, options); check(rebuild.status === 'PUBLISHED', JSON.stringify(rebuild));
      const read = await store.readActive(); check(read.generation.content_hash === prepared.metadata.content_hash, 'not deterministic rebuild'); firstId = read.generation.generation_id;
    });
    await run('O failed calculation retains old value STALE not NO_DATA', async () => {
      const previous = await store.readActive();
      const next = await prepare(source, {previousRows: previous.rows, canonical: {...canonical, brokerTotal: () => { throw new Error('failed'); }}});
      const row = next.rows.find(row => row.metric_id === 'investment_total_krw'); check(row.status === 'STALE' && row.value === 100, 'previous value lost');
      const published = await store.publish(next, {expectedGeneration: firstId}); check(published.status === 'PUBLISHED', JSON.stringify(published));
      const stale = (await store.readActive()).rows.find(value => value.metric_id === 'investment_total_krw');
      check(stale.value === 100 && stale.status === 'STALE', 'stale absent');
      firstId = (await store.publish(prepared, {expectedGeneration: published.generation_id})).generation_id;
    });
    await run('P repeated clock/render/read do not write unnecessary generations', async () => {
      const repeated = await prepare(source, {calculatedAt: '2026-10-01T00:00:00Z', createdAt: '2026-10-01T00:00:00Z'});
      check(repeated.metadata.content_hash === prepared.metadata.content_hash, 'clock changed content');
      const published = await store.publish(repeated, {expectedGeneration: firstId}); check(published.status === 'UNCHANGED', 'unnecessary write');
      const before = (await store.readActive()).generation.generation_id;
      for (let i = 0; i < 5; i++) check((await store.readActive()).generation.generation_id === before, 'read writes');
    });
    await run('Q protected source, Goal History and business state unchanged', async () => {
      check(JSON.stringify(source) === initialSource, 'source mutated');
      check(await storage.digest(source) === initialSourceHash, 'source hash changed');
      check(localStorage.getItem('hani_os_life_v23') === initialSource, 'protected source changed');
      check(localStorage.getItem('goal-history-sentinel') === 'unchanged', 'goal history changed');
      const db = await new Promise((resolve, reject) => { const request = indexedDB.open(storage.DATABASE_NAME); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      const tx = db.transaction('generations', 'readonly'), request = tx.objectStore('generations').getAll();
      const history = await new Promise(resolve => { request.onsuccess = () => resolve(request.result); }); db.close();
      check(history.length <= 2, 'unbounded generations');
      check(!JSON.stringify(history).includes('synthetic-owner-A'), 'raw owner ID persisted');
    });
    await run('conflicting concurrent writer and incomplete generation cannot publish', async () => {
      const changed = structuredClone(source); changed.body[0].weight = 97;
      const publish = await store.publish(await prepare(changed), {expectedGeneration: null});
      check(publish.warning === 'GENERATION_CONFLICT', 'conflict not guarded');
      let rejected = false;
      try { await storage.prepareSnapshot(source, {...options, binding, rows: prepared.rows.slice(1)}); } catch { rejected = true; }
      check(rejected, 'incomplete generation accepted');
    });
    await run('open failure returns storage warning / memory fallback', async () => {
      const bad = storage.createMetricsStore({getBinding: () => binding, factory: {databases: async () => [], open: () => { throw new Error('OPEN_FAILURE'); }}});
      await bad.activate(binding);
      check((await bad.readActive()).warning === 'OPEN_FAILURE', 'open failure not handled');
      const result = await bad.publish(prepared, {expectedGeneration: null}); check(result.fallback.rows.length === 6, 'no memory fallback');
      await bad.close();
    });
    await run('session change during transaction aborts without pointer publish or fallback leak', async () => {
      const oldBinding = binding, before = await store.readActive();
      const racing = storage.createMetricsStore({getBinding: () => binding, fault: stage => {
        if (stage === 'after_pointer') { binding = null; racing.invalidate(); }
      }});
      await racing.activate(binding);
      const changed = structuredClone(source); changed.body[0].weight = 96;
      const publish = await racing.publish(await prepare(changed), {expectedGeneration: before.generation.generation_id});
      check(publish.status === 'STORAGE_WARNING' && publish.fallback === null, 'race leaked view');
      binding = oldBinding; await store.activate(binding);
      check((await store.readActive()).generation.generation_id === before.generation.generation_id, 'race committed pointer');
      await racing.close();
    });
    await run('tampered metadata and raw payload injection rejected before write', async () => {
      const current = await store.readActive(), malformed = structuredClone(prepared);
      malformed.metadata.manifest.pop();
      check((await store.publish(malformed, {expectedGeneration: current.generation.generation_id})).status === 'STORAGE_WARNING', 'bad manifest accepted');
      const raw = structuredClone(prepared); raw.rows[0].rawSource = source;
      check((await store.publish(raw, {expectedGeneration: current.generation.generation_id})).status === 'STORAGE_WARNING', 'raw source accepted');
    });
    await run('SHA unavailable, namespace enumeration unavailable and unverified binding fail closed', async () => {
      let rejected = false;
      try { await storage.datasetScope({...binding, sourceOwnerVerified: false}); } catch { rejected = true; }
      check(rejected, 'unverified binding accepted');
      const unsupported = storage.createMetricsStore({getBinding: () => binding, factory: {open: () => { throw new Error('must not open'); }}});
      await unsupported.activate(binding);
      check((await unsupported.readActive()).warning === 'NAMESPACE_VERIFICATION_UNAVAILABLE', 'namespace verification bypassed'); await unsupported.close();
      rejected = false; try { await storage.digest(source, {}); } catch { rejected = true; }
      check(rejected, 'hash silently downgraded');
    });
    await run('corrupted metric row invalidates cache; rebuild recovers source', async () => {
      const db = await new Promise(resolve => { const request = indexedDB.open(storage.DATABASE_NAME); request.onsuccess = () => resolve(request.result); });
      await new Promise((resolve, reject) => {
        const tx = db.transaction('metrics', 'readwrite'), request = tx.objectStore('metrics').getAll();
        request.onsuccess = () => { const row = request.result.find(row => row.metric_id === 'books_completed_count' && row.generation_id === firstId); tx.objectStore('metrics').put({...row, value: 999}); };
        tx.oncomplete = resolve; tx.onabort = () => reject(tx.error);
      }); db.close();
      check((await store.readActive()).warning === 'INVALID_CACHE', 'corruption not detected');
      await store.reset(); check((await store.rebuild(source, options)).status === 'PUBLISHED', 'rebuild failed');
      check((await store.readActive()).rows.find(row => row.metric_id === 'books_completed_count').value === 1, 'corrupt value reused');
    });
    await store.close();
    return {pass, failures};
  });
  for (const name of result.pass) results.push('PASS ' + name);
  for (const error of result.failures) results.push('FAIL ' + error.name + ': ' + error.error);
  console.log(results.join('\n'));
  console.log(JSON.stringify({passed: result.pass.length, failed: result.failures.length, browser: browser.version(), origin: 'isolated localhost; synthetic data only'}));
  assert.equal(result.failures.length, 0);
  await context.close();
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
