import assert from "node:assert/strict";
import {
  TEAM_CONFIG,
  freshnessState,
  handleSportsSync,
  isTeamActive,
  parseDplusHtml,
  parseKboSchedule,
  parseMlbSchedule,
  parseRealMadridHtml,
  shouldFetchTeam,
  validateCandidate,
} from "../supabase/functions/hani-sports-sync/index.ts";

const now = new Date("2026-09-15T00:00:00Z");

assert.deepEqual(isTeamActive("yankees", "2026-01-15T00:00:00Z"), { active: false, reason: "BLACKOUT_MONTH" });
assert.deepEqual(isTeamActive("kia", "2026-12-15T00:00:00Z"), { active: false, reason: "BLACKOUT_MONTH" });
assert.deepEqual(isTeamActive("madrid", "2026-06-15T00:00:00Z"), { active: false, reason: "BLACKOUT_MONTH" });
assert.deepEqual(isTeamActive("madrid", "2026-07-30T00:00:00Z"), { active: true, reason: "RESUME_DISCOVERY_WINDOW" });
assert.deepEqual(isTeamActive("dplus", "2026-12-15T00:00:00Z"), { active: false, reason: "BLACKOUT_MONTH" });
assert.equal(shouldFetchTeam("dplus", "2026-09-10T00:00:00Z", now).due, false);
assert.equal(shouldFetchTeam("dplus", "2026-09-01T00:00:00Z", now).due, true);
assert.deepEqual(shouldFetchTeam("dplus", "2026-09-10T00:00:00Z", now, true), { due: true, reason: "FORCED" });
assert.equal(freshnessState("yankees", "2026-09-14T00:00:00Z", now).freshness, "fresh");
assert.equal(freshnessState("yankees", "2026-09-12T00:00:00Z", now).freshness, "stale");
assert.equal(freshnessState("dplus", "2026-09-08T00:00:00Z", now).freshness, "fresh");
assert.equal(freshnessState("dplus", "2026-09-01T00:00:00Z", now).freshness, "stale");

const mlb = parseMlbSchedule({ dates: [{ games: [
  { gamePk: 1, gameDate: "2026-09-13T17:05:00Z", officialDate: "2026-09-13", gameType: "R", seriesDescription: "Regular Season", status: { abstractGameState: "Final" }, teams: { away: { team: { id: 121, name: "New York Mets" }, score: 0 }, home: { team: { id: 147, name: "New York Yankees" }, score: 2 } }, venue: { name: "Yankee Stadium" } },
  { gamePk: 2, gameDate: "2026-09-15T23:05:00Z", officialDate: "2026-09-15", gameType: "R", seriesDescription: "Regular Season", status: { abstractGameState: "Preview" }, teams: { away: { team: { id: 141, name: "Toronto Blue Jays" } }, home: { team: { id: 147, name: "New York Yankees" } } }, venue: { name: "Yankee Stadium" } },
] }] }, now);
assert.equal(mlb.lastGame.result, "WIN");
assert.equal(mlb.lastGame.homeAway, "home");
assert.equal(mlb.nextGame.opponent.name, "Toronto Blue Jays");
assert.equal(validateCandidate(mlb, null, now).ok, true);

const kbo = parseKboSchedule([{ year: 2026, payload: { rows: [
  { row: [
    { Text: "09.13(일)" }, { Text: "<b>14:00</b>" },
    { Text: '<span>한화</span><em><span class="lose">2</span><span>vs</span><span class="win">9</span></em><span>KIA</span>' },
    { Text: "<a href='/Schedule/GameCenter/Main.aspx?gameDate=20260913&gameId=20260913HHHT0&section=REVIEW'>리뷰</a>" },
    {}, {}, {}, { Text: "광주" }, { Text: "-" },
  ] },
  { row: [
    { Text: "09.15(화)" }, { Text: "<b>18:30</b>" },
    { Text: '<span>KIA</span><em><span class="same">0</span><span>vs</span><span class="same">0</span></em><span>SSG</span>' },
    { Text: "" }, {}, {}, {}, { Text: "문학" }, { Text: "-" },
  ] },
  { row: [
    { Text: "09.16(수)" }, { Text: "<b>18:30</b>" },
    { Text: "<span>KIA</span><em><span>vs</span></em><span>삼성</span>" }, {}, {}, {}, {}, { Text: "대구" }, { Text: "-" },
  ] },
] } }], now);
assert.equal(kbo.lastGame.score.team, 9);
assert.equal(kbo.lastGame.opponent.name, "한화");
assert.equal(kbo.nextGame.opponent.name, "SSG");
assert.equal(kbo.nextGame.homeAway, "away");
assert.equal(validateCandidate(kbo, null, now).ok, true);

const realState = { schedule: [{
  id: "rma-1", dateTime: "2026-09-12T19:00:00Z", status: "finished",
  competition: { name: "La Liga" }, description: { plaintext: "Real Madrid vs Rayo Vallecano" },
  squad: { tag: ["realmadrid-com:sports/futbol/primer-equipo-masculino"] },
  venue: { name: "Estadio Bernabéu" }, homeTeam: { optaId: "rma", name: "Real Madrid" }, awayTeam: { optaId: "ray", name: "Rayo Vallecano" },
  homeTeamScoreTotal: "4", awayTeamScoreTotal: "1",
}, {
  id: "rma-2", dateTime: "2026-09-20T14:15:00Z", status: "scheduled", isScheduled: true,
  competition: { name: "La Liga" }, description: { plaintext: "Atletico Madrid vs Real Madrid" },
  squad: { tag: ["realmadrid-com:sports/futbol/primer-equipo-masculino"] },
  venue: { name: "Metropolitano" }, homeTeam: { optaId: "atm", name: "Atlético de Madrid" }, awayTeam: { optaId: "rma", name: "Real Madrid" },
  homeTeamScoreTotal: null, awayTeamScoreTotal: null,
}, {
  id: "academy-1", dateTime: "2026-09-14T10:00:00Z", status: "finished",
  competition: { name: "División de Honor Juvenil" }, description: { plaintext: "Talavera U19 vs Real Madrid U19" },
  squad: { tag: ["realmadrid-com:sports/futbol/cantera-masculina/juvenil-a"] },
  homeTeam: { optaId: "tal", name: "Talavera U19" }, awayTeam: { optaId: "rmu19", name: "Real Madrid" },
  homeTeamScoreTotal: "0", awayTeamScoreTotal: "4",
}, {
  id: "basketball-1", dateTime: "2026-09-18T18:00:00Z", status: "finished",
  competition: { name: "EuroLeague" }, description: { plaintext: "Real Madrid vs Dubai Basketball" },
  squad: { tag: ["realmadrid-com:sports/baloncesto/primer-equipo-masculino"] },
  homeTeam: { optaId: "rmb", name: "Real Madrid" }, awayTeam: { optaId: "dub", name: "Dubai Basketball" },
  homeTeamScoreTotal: "98", awayTeamScoreTotal: "95",
}] };
const realHtml = `<script id="ng-state" type="application/json">${JSON.stringify(realState)}</script>`;
const madrid = parseRealMadridHtml(realHtml, now);
assert.equal(madrid.lastGame.result, "WIN");
assert.equal(madrid.lastGame.opponent.name, "Rayo Vallecano");
assert.equal(madrid.nextGame.opponent.name, "Atlético de Madrid");
assert.equal(validateCandidate(madrid, null, now).ok, true);

const lolState = { data: { esports: { events: [{
  __typename: "EventMatch", id: "lck-1", blockName: "플레이오프", startTime: "2026-09-06T08:00:00Z", state: "completed", type: "match",
  league: { name: "LCK", slug: "lck" }, tournament: { name: "2026 스플릿 3" },
  matchTeams: [
    { id: "lck-1:dk", name: "Dplus KIA", code: "DK", result: { gameWins: 1, outcome: "loss" } },
    { id: "lck-1:t1", name: "T1", code: "T1", result: { gameWins: 3, outcome: "win" } },
  ], match: { strategy: { count: 5 } },
}, {
  __typename: "EventMatch", id: "lck-2", blockName: "정규 시즌", startTime: "2026-09-21T08:00:00Z", state: "unstarted", type: "match",
  league: { name: "LCK", slug: "lck" }, tournament: { name: "2026 스플릿 3" },
  matchTeams: [
    { id: "lck-2:dk", name: "Dplus KIA", code: "DK", result: null },
    { id: "lck-2:gen", name: "Gen.G", code: "GEN", result: null },
  ], match: { strategy: { count: 3 } },
}] } } };
const apolloPayload = JSON.stringify({ rehydrate: { schedule: lolState, pending: null } }).replace('"pending":null', '"pending":undefined');
const dplus = parseDplusHtml(`<script>(window[Symbol.for("ApolloSSRDataTransport")] ??= []).push(${apolloPayload});</script>`, now);
assert.equal(dplus.lastGame.result, "LOSS");
assert.equal(dplus.lastGame.homeAway, "neutral");
assert.equal(dplus.nextGame.opponent.name, "Gen.G");
assert.equal(validateCandidate(dplus, null, now).ok, true);

const regression = structuredClone(mlb);
regression.lastGame.date = "2026-09-01";
regression.lastGame.eventId = "older-event";
assert.deepEqual(validateCandidate(regression, mlb, now).errors.includes("LAST_GAME_REGRESSION"), true);

assert.deepEqual(Object.keys(TEAM_CONFIG), ["yankees", "kia", "madrid", "dplus"]);

const originalDeno = globalThis.Deno;
const originalFetch = globalThis.fetch;
const cronSecret = "unit-test-secret";
const cronSecretHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(cronSecret));
const cronSecretHex = [...new Uint8Array(cronSecretHash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
globalThis.Deno = { env: { get: key => key === "SUPABASE_URL" ? "https://unit-test.supabase.co" : key === "SUPABASE_SERVICE_ROLE_KEY" ? "unit-service-role" : "" } };
globalThis.fetch = async url => {
  if (String(url).includes("hani_sports_sync_auth")) return new Response(JSON.stringify([{ secret_sha256: cronSecretHex }]), { status: 200 });
  throw new Error(`Unexpected wrapper fetch: ${url}`);
};
const unauthorized = await handleSportsSync(new Request("https://unit-test/functions/v1/hani-sports-sync", { method: "POST", headers: { "x-hani-sports-secret": "wrong" }, body: "{}" }));
assert.equal(unauthorized.status, 401);
const invalidScope = await handleSportsSync(new Request("https://unit-test/functions/v1/hani-sports-sync", { method: "POST", headers: { "x-hani-sports-secret": cronSecret, "content-type": "application/json" }, body: JSON.stringify({ teams: ["unknown"] }) }));
assert.equal(invalidScope.status, 400);
globalThis.fetch = originalFetch;
if (originalDeno === undefined) delete globalThis.Deno; else globalThis.Deno = originalDeno;
console.log("HANI Sports sync contract tests: PASS");
