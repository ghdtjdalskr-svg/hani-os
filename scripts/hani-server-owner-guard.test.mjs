// Synthetic identities only. Execute raw staged server sources without network or DB writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {stripTypeScriptTypes} from 'node:module';
import {createHash, webcrypto} from 'node:crypto';
import * as persona from '../supabase/functions/hani-newsroom-publisher/comment-persona.mjs';
import {calendarBeforeOwnerGuard} from './hani-server-owner-guard-source.cjs';

const slugs = ['hani-agent-orchestrator', 'hani-google-calendar', 'hani-newsroom-publisher'];
const read = slug => fs.readFileSync(new URL(`../supabase/functions/${slug}/index.ts`, import.meta.url), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const sha = value => createHash('sha256').update(value).digest('hex');
const calendarCore = value => value.replace(/function (?:escapeHtml|callbackRedirect)\([\s\S]*?(?=function b64\()/, '')
  .replace(/^      return (?:html\(callbackHtml|callbackRedirect)\(.*\r?$/gm, '      return CALLBACK_RESPONSE;');

function server(slug, {id = 'test-owner', owner = 'test-owner', cron, openai = true} = {}) {
  let handler;
  const effects = {auth: 0, body: 0, db: [], fetch: 0};
  const env = {SUPABASE_URL: 'https://synthetic.invalid', SUPABASE_ANON_KEY: 'synthetic-public',
    SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server', HANI_OWNER_USER_ID: owner,
    HANI_NEWSROOM_CRON_SECRET: cron, OPENAI_API_KEY: openai ? 'synthetic-openai' : undefined};
  const context = vm.createContext({...persona, Request, Response, Headers, URL, URLSearchParams,
    TextEncoder, TextDecoder, Uint8Array, Uint32Array, crypto: webcrypto, atob, btoa, setTimeout, clearTimeout,
    console: {log() {}, warn() {}, error() {}},
    Deno: {env: {get: key => env[key]}, serve: fn => {handler = fn;}},
    createClient: () => ({
      auth: {getUser: async () => {effects.auth++; return {data: {user: id ? {id} : null}, error: null};}},
      from(table) {
        effects.db.push(table);
        const query = {select() {return query;}, eq() {return query;},
          maybeSingle: async () => ({data: null, error: null}),
          then: (resolve, reject) => Promise.resolve({data: [], error: null, count: 0}).then(resolve, reject)};
        return query;
      },
    }),
    fetch: async () => {effects.fetch++; throw Error('Unexpected external request');},
  });
  let source = stripTypeScriptTypes(read(slug).replace(/^import .*;\r?\n/gm, ''));
  if (slug === 'hani-newsroom-publisher') source += '\nthis.api={NEWS_COMMENT_TONES,newsCommentTone,INTEREST_SCHEMA,archiveInterest};';
  vm.runInContext(source, context);
  return {effects, api: context.api, async request(body = {action: 'health'}, headers = {Authorization: 'Bearer synthetic-session'}) {
    const req = new Request('https://synthetic.invalid', {method: 'POST', headers, body: JSON.stringify(body)});
    const json = req.json.bind(req);
    req.json = () => {effects.body++; return json();};
    return handler(req);
  }};
}

for (const slug of slugs) {
  test(`${slug}: raw source authenticates then immediately checks owner before protected dispatch/DB`, () => {
    const raw = read(slug), handler = raw.slice(raw.indexOf('Deno.serve('));
    assert.ok(raw.includes('Deno.serve('));
    assert.equal((raw.match(/function ownerAccess\(/g) || []).length, 1);
    assert.equal((handler.match(/ownerAccess\(/g) || []).length, 1);
    if (slug === 'hani-google-calendar') {
      // GET OAuth callback has its own unchanged state validation, before the POST session path.
      const post = handler.slice(handler.indexOf('const user = await userFromRequest(req, admin);'));
      assert.match(post, /^const user = await userFromRequest\(req, admin\);\s*const access = ownerAccess\(user, Deno.env.get\("HANI_OWNER_USER_ID"\)\);\s*if \(!access.ok\) return json\(req, \{ ok: false, error: access.error \}, access.status\);\s*const body = await req.json\(\)/);
      assert.doesNotMatch(handler.slice(handler.indexOf('if (req.method !== "POST")'), handler.indexOf('const access = ownerAccess')), /\.from\(|getConnection\(/);
    } else if (slug === 'hani-agent-orchestrator') {
      assert.match(handler, /const auth = await getAuthenticatedUser\(req, supabaseUrl, publishableKey\);\s*if \(!auth.user\) \{\s*return json\([^]*?401\);\s*\}\s*const access = ownerAccess\(auth.user, Deno.env.get\("HANI_OWNER_USER_ID"\)\);\s*if \(!access.ok\) \{\s*return json\(\{ ok: false, error: access.error \}, access.status\);\s*\}\s*let body:/);
      const guard = handler.indexOf('const access = ownerAccess');
      assert.ok(guard < handler.indexOf('req.json()'));
      assert.ok(guard < handler.indexOf('const admin = createClient'));
      assert.ok(guard < handler.indexOf('.from('));
    } else {
      // Existing scheduled_publish routing requires JSON before session authentication.
      assert.ok(handler.indexOf('req.json()') < handler.indexOf('await getAuthenticatedUser'));
      assert.match(handler, /const auth=await getAuthenticatedUser\(req,supabaseUrl,publishableKey\); if\(!auth.user\)return json\([^]*?401\);\s*const access=ownerAccess\(auth.user,Deno.env.get\("HANI_OWNER_USER_ID"\)\); if\(!access.ok\)return json\(\{ok:false,error:access.error\},access.status\);\s*if\(action==="health"\)/);
      const normal = handler.slice(handler.indexOf('const auth=await getAuthenticatedUser'));
      assert.ok(normal.indexOf('ownerAccess(') < normal.indexOf('.from('));
      assert.ok(normal.indexOf('ownerAccess(') < normal.indexOf('await archiveResult('));
    }
  });

  test(`${slug}: extracted actual ownerAccess rejects missing/other IDs, trims only configured ID`, () => {
    const helper = read(slug).match(/function ownerAccess\([^]*?\r?\n\}/)?.[0];
    assert.ok(helper);
    const ownerAccess = vm.runInNewContext(stripTypeScriptTypes(helper) + '; ownerAccess;');
    for (const configured of [undefined, '', ' ', '\t\r\n']) {
      assert.deepEqual(plain(ownerAccess({id: 'test-owner'}, configured)), {ok: false, status: 503, error: 'OWNER_ACCESS_NOT_CONFIGURED'});
    }
    for (const user of [null, {}, {id: ''}, {id: 'other'}, {id: ' test-owner '}, {id: 'other', user_metadata: {owner: true}}]) {
      assert.deepEqual(plain(ownerAccess(user, 'test-owner')), {ok: false, status: 403, error: 'OWNER_ACCESS_DENIED'});
    }
    for (const configured of ['test-owner', ' \t test-owner\r\n']) {
      assert.deepEqual(plain(ownerAccess({id: 'test-owner'}, configured)), {ok: true, status: 200, error: ''});
    }
  });

  test(`${slug}: actual handler denies before DB/fetch and owner reaches existing health/status`, async () => {
    for (const [options, status, error] of [
      [{owner: ''}, 503, 'OWNER_ACCESS_NOT_CONFIGURED'],
      [{owner: ' \n\t'}, 503, 'OWNER_ACCESS_NOT_CONFIGURED'],
      [{id: 'other'}, 403, 'OWNER_ACCESS_DENIED'],
      [{id: null}, 401, null],
    ]) {
      const s = server(slug, options), response = await s.request({action: 'archive_result', news: {entities: []}});
      assert.equal(response.status, status);
      if (error) assert.equal((await response.json()).error, error);
      assert.equal(s.effects.auth, 1);
      assert.deepEqual(s.effects.db, []);
      assert.equal(s.effects.fetch, 0);
      assert.equal(s.effects.body, slug === 'hani-newsroom-publisher' ? 1 : 0);
    }
    const s = server(slug, {owner: ' \t test-owner\n'});
    const response = await s.request({action: slug === 'hani-google-calendar' ? 'status' : 'health'});
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(s.effects.auth, 1);
    assert.equal(s.effects.body, 1);
    assert.equal(s.effects.fetch, 0);
    assert.deepEqual(s.effects.db, slug === 'hani-google-calendar' ? ['hani_google_calendar_connections'] : slug === 'hani-newsroom-publisher' ? ['hani_newsroom_posts'] : []);
  });
}

test('Newsroom: scheduled_publish stays before owner/session check and requires configured matching cron secret', async () => {
  const handler = read('hani-newsroom-publisher').split('Deno.serve(')[1];
  const scheduled = handler.slice(handler.indexOf('if(action==="scheduled_publish")'), handler.indexOf('const auth=await getAuthenticatedUser'));
  assert.ok(scheduled.length > 0);
  assert.match(scheduled, /Deno.env.get\("HANI_NEWSROOM_CRON_SECRET"\)/);
  assert.match(scheduled, /req.headers.get\("x-hani-cron-secret"\)/);
  assert.match(scheduled, /if\(!expected\|\|provided!==expected\)return json\([^]*?401\)/);
  assert.ok(scheduled.indexOf('CRON_AUTH_FAILED') < scheduled.indexOf('await scheduledPublish'));
  for (const [cron, provided] of [[undefined, 'synthetic-cron'], ['', ''], ['synthetic-cron', 'wrong'], ['synthetic-cron', '']]) {
    const s = server('hani-newsroom-publisher', {owner: '', cron});
    const response = await s.request({action: 'scheduled_publish'}, {'x-hani-cron-secret': provided});
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, 'CRON_AUTH_FAILED');
    assert.equal(s.effects.auth, 0);
    assert.deepEqual(s.effects.db, []);
    assert.equal(s.effects.fetch, 0);
  }
  const allowed = server('hani-newsroom-publisher', {owner: '', id: null, cron: 'synthetic-cron'});
  const response = await allowed.request({action: 'scheduled_publish'}, {'x-hani-cron-secret': 'synthetic-cron'});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).action, 'SCHEDULED_PUBLISH');
  assert.equal(allowed.effects.auth, 0);
  assert.deepEqual(allowed.effects.db, ['hani_state']);
  assert.equal(allowed.effects.fetch, 0);
});

test('Newsroom: actual tone sanitizer matches generation enum and archive persists only enum/empty tones', async () => {
  const {api} = server('hani-newsroom-publisher');
  const expected = api.INTEREST_SCHEMA.properties.entities.items.properties.news.items.properties.comments.items.properties.tone.enum;
  assert.deepEqual(plain(api.NEWS_COMMENT_TONES), plain(expected));
  for (const tone of expected) {
    assert.equal(api.newsCommentTone(tone), tone);
    assert.equal(api.newsCommentTone(` \t${tone.toLowerCase()}\n`), tone);
  }
  for (const invalid of [undefined, null, '', 'UNKNOWN', 'ANALYSIS extra', '\"><img src=x>', 'LIGHT onclick=bad', {}, [], 'x'.repeat(100)]) {
    assert.equal(api.newsCommentTone(invalid), '');
  }
  let rows;
  const admin = {from(table) {assert.equal(table, 'hani_newsroom_posts'); return {
    upsert(value) {rows = plain(value); return {select: async () => ({data: [{id: 'synthetic'}], error: null})};},
  };}};
  await api.archiveInterest(admin, 'test-owner', {entities: [{name: 'Synthetic', news: [{title: 'Synthetic news', comments: [
    {tone: 'LIGHT onclick=bad', comment: '합성 댓글'}, {tone: ' question ', comment: '합성 질문'},
  ]}]}]});
  assert.deepEqual(rows[0].comments.map(c => c.tone), ['', 'QUESTION']);
  assert.equal(rows[0].user_id, 'test-owner');
});

test('Calendar exact inverse keeps frozen core hash and refuses missing/changed/duplicate additions', () => {
  const raw = read('hani-google-calendar'), restored = calendarBeforeOwnerGuard(raw);
  const pin = '2a6fb8aec3afa3a876781e8af4a06e1065db6897d8e935622039099003aaaf84';
  assert.equal(sha(calendarCore(restored)), pin);
  assert.notEqual(sha(calendarCore(raw)), pin);
  assert.doesNotMatch(restored, /ownerAccess|OWNER_ACCESS_|HANI_OWNER_USER_ID/);
  const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/server-owner-guard/calendar-owner-additions.json', import.meta.url), 'utf8'));
  for (const edit of fixture.edits) {
    assert.throws(() => calendarBeforeOwnerGuard(raw.replace(edit.after, edit.before)), /missing exact/);
    assert.throws(() => calendarBeforeOwnerGuard(raw + '\n' + edit.after), /duplicate/);
  }
  for (const [before, after] of [['status: 403', 'status: 200'], ['if (!access.ok)', 'if (false)'], ['"HANI_OWNER_USER_ID"', '"WRONG_OWNER_KEY"']]) {
    assert.ok(raw.includes(before));
    assert.throws(() => calendarBeforeOwnerGuard(raw.replace(before, after)), /missing exact/);
  }
  for (const [before, after] of [['AES-GCM', 'AES-CTR'], ['.eq("user_id", userId)', '.eq("user_id", "other")']]) {
    assert.ok(raw.includes(before));
    assert.notEqual(sha(calendarCore(calendarBeforeOwnerGuard(raw.replace(before, after)))), pin, 'unrelated core edits must still fail the original pin');
  }
  assert.throws(() => calendarBeforeOwnerGuard(restored), /missing exact/);
});

test('browser-delivered JS/HTML contain no privileged server environment names or service-role credentials', () => {
  // Check root client files, never print a matching value or file contents.
  const files = fs.readdirSync(new URL('../', import.meta.url)).filter(name => /\.(?:js|html)$/.test(name));
  assert.ok(files.includes('hani-main.js') && files.includes('index.html'));
  for (const name of files) {
    const raw = fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
    let scanned = raw;
    if (name === 'hani-main.js') {
      // The existing browser validator names service_role only to reject it.
      // Execute that path, then exclude exactly its function from the text scan.
      const guard = raw.match(/^function cloudValidateBrowserKey\([^]*?^\}/m)?.[0];
      const decode = raw.match(/^function cloudDecodeJwtRole\([^]*?^\}/m)?.[0];
      assert.ok(guard && decode);
      const validate = vm.runInNewContext(decode + '\n' + guard + ';cloudValidateBrowserKey;', {atob});
      for (const key of ['service_role', 'sb_secret_synthetic', 'eyJhbGciOiJub25lIn0.' + Buffer.from(JSON.stringify({role: 'service_role'})).toString('base64url') + '.synthetic']) {
        assert.throws(() => validate(key));
      }
      assert.equal(validate('synthetic-public'), 'synthetic-public');
      scanned = raw.replace(guard, '');
    } else if (name === 'index.html') {
      const warning = '<div class="cloud-key-warning">Secret / service_role key는 사용할 수 없습니다.</div>';
      assert.equal(raw.split(warning).length - 1, 1, 'existing visible browser-key rejection warning');
      scanned = raw.replace(warning, '');
    }
    assert.equal(/service_role|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEYS|GOOGLE_CLIENT_SECRET|HANI_GOOGLE_TOKEN_KEY|HANI_NEWSROOM_CRON_SECRET|OPENAI_API_KEY|sb_secret_[A-Za-z0-9_-]+/.test(scanned), false, name + ': privileged server material absent');
    for (const token of raw.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) || []) {
      let claims;
      try {claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());} catch {continue;}
      assert.equal(claims.role === 'service_role', false, name + ': no service-role JWT');
    }
  }
});
