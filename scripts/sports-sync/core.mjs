const DAY_MS = 86_400_000;

export const SPORTS_SYNC_VERSION = "0.1.0-dry-run";

export const TEAM_CONFIG = Object.freeze({
  yankees: Object.freeze({
    teamId: "yankees",
    league: "MLB",
    cadenceDays: 1,
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    source: "MLB Stats API",
    sourceUrl: "https://statsapi.mlb.com/api/v1/schedule",
  }),
  kia: Object.freeze({
    teamId: "kia",
    league: "KBO",
    cadenceDays: 1,
    activeMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    source: "KBO Schedule",
    sourceUrl: "https://www.koreabaseball.com/Schedule/Schedule.aspx",
  }),
  madrid: Object.freeze({
    teamId: "madrid",
    league: "LALIGA_UEFA",
    cadenceDays: 7,
    activeMonths: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12],
    discoveryWindows: [{ month: 7, fromDay: 29, toDay: 31 }],
    source: "Real Madrid Official Schedule",
    sourceUrl: "https://www.realmadrid.com/en-US/schedule?filter-football=primer-equipo-masculino&filter-tickets=general%3Bvip",
  }),
  dplus: Object.freeze({
    teamId: "dplus",
    league: "LCK",
    cadenceDays: 7,
    activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    source: "LoL Esports LCK",
    sourceUrl: "https://lolesports.com/ko-KR/leagues/lck",
  }),
});

const SOURCE_HOSTS = Object.freeze({
  yankees: new Set(["statsapi.mlb.com", "www.mlb.com"]),
  kia: new Set(["www.koreabaseball.com"]),
  madrid: new Set(["www.realmadrid.com"]),
  dplus: new Set(["lolesports.com"]),
});

function asDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${String(value)}`);
  return date;
}

function kstParts(value) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(asDate(value));
  const get = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function cleanText(value, max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function dateOnly(value) {
  const iso = isoOrNull(value);
  return iso ? iso.slice(0, 10) : null;
}

function scoreResult(team, opponent) {
  if (team > opponent) return "WIN";
  if (team < opponent) return "LOSS";
  return "DRAW";
}

function stripTags(value) {
  return cleanText(String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " "));
}

function uniqueBy(rows, keyFn) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = keyFn(row);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isTeamActive(teamId, now = new Date(), force = false) {
  if (force) return { active: true, reason: "FORCED" };
  const config = TEAM_CONFIG[teamId];
  if (!config) throw new Error(`Unknown team: ${teamId}`);
  const { month, day } = kstParts(now);
  if (config.activeMonths.includes(month)) return { active: true, reason: "ACTIVE_MONTH" };
  const discovery = (config.discoveryWindows || []).some((window) =>
    month === window.month && day >= window.fromDay && day <= window.toDay
  );
  return discovery
    ? { active: true, reason: "RESUME_DISCOVERY_WINDOW" }
    : { active: false, reason: "BLACKOUT_MONTH" };
}

export function shouldFetchTeam(teamId, lastSuccessAt, now = new Date(), force = false) {
  const activity = isTeamActive(teamId, now, force);
  if (!activity.active) return { due: false, reason: activity.reason };
  if (force || !lastSuccessAt) return { due: true, reason: force ? "FORCED" : "NO_SUCCESS_RECORDED" };
  const last = asDate(lastSuccessAt);
  const elapsed = asDate(now).getTime() - last.getTime();
  const due = elapsed >= TEAM_CONFIG[teamId].cadenceDays * DAY_MS;
  return { due, reason: due ? "CADENCE_DUE" : "CADENCE_NOT_DUE" };
}

export function freshnessState(teamId, lastSuccessAt, now = new Date()) {
  if (!TEAM_CONFIG[teamId]) throw new Error(`Unknown team: ${teamId}`);
  if (!lastSuccessAt) return { freshness: "missing", stale: true, ageHours: null };
  const ageHours = Math.max(0, (asDate(now).getTime() - asDate(lastSuccessAt).getTime()) / 3_600_000);
  const staleAfterHours = TEAM_CONFIG[teamId].cadenceDays === 1 ? 36 : 8 * 24;
  return { freshness: ageHours > staleAfterHours ? "stale" : "fresh", stale: ageHours > staleAfterHours, ageHours };
}

export function parseMlbSchedule(payload, now = new Date()) {
  const teamId = 147;
  const games = (payload?.dates || []).flatMap((entry) => entry?.games || []).map((game) => {
    const home = game?.teams?.home;
    const away = game?.teams?.away;
    const isHome = Number(home?.team?.id) === teamId;
    const side = isHome ? home : away;
    const opponent = isHome ? away : home;
    if (Number(side?.team?.id) !== teamId || !opponent?.team?.name) return null;
    return {
      id: String(game?.gamePk || ""),
      dateTime: isoOrNull(game?.gameDate),
      date: cleanText(game?.officialDate, 10) || dateOnly(game?.gameDate),
      state: cleanText(game?.status?.abstractGameState || game?.status?.detailedState, 40).toLowerCase(),
      homeAway: isHome ? "home" : "away",
      opponent: { id: String(opponent?.team?.id || ""), name: cleanText(opponent?.team?.name) },
      teamScore: Number(side?.score),
      opponentScore: Number(opponent?.score),
      competition: cleanText(game?.seriesDescription || game?.gameType || "MLB"),
      venue: cleanText(game?.venue?.name),
    };
  }).filter(Boolean);
  return normalizeEvents("yankees", games, now);
}

function parseKboRow(row, seasonYear) {
  const cells = row?.row || [];
  const dateMatch = cleanText(cells[0]?.Text, 20).match(/(\d{2})\.(\d{2})/);
  const timeMatch = String(cells[1]?.Text || "").match(/(\d{2}:\d{2})/);
  const playHtml = String(cells[2]?.Text || "");
  const spans = [...playHtml.matchAll(/<span(?:\s+class="[^"]*")?>([^<]*)<\/span>/gi)]
    .map((match) => cleanText(match[1], 60)).filter(Boolean);
  if (!dateMatch || spans.length < 3) return null;
  const teams = [spans[0], spans.at(-1)];
  if (!teams.includes("KIA")) return null;
  const scoreTokens = spans.slice(1, -1).filter((value) => /^\d+$/.test(value)).map(Number);
  const cancelled = stripTags(cells.at(-1)?.Text).includes("취소");
  const month = dateMatch[1];
  const day = dateMatch[2];
  const date = `${seasonYear}-${month}-${day}`;
  const dateTime = timeMatch ? `${date}T${timeMatch[1]}:00+09:00` : `${date}T00:00:00+09:00`;
  const isHome = teams[1] === "KIA";
  const teamIndex = isHome ? 1 : 0;
  const gameLink = String(cells[3]?.Text || "").match(/href=['"]([^'"]+)/i)?.[1] || "";
  return {
    id: gameLink.match(/gameId=([^&'"]+)/i)?.[1] || `${date}-${teams.join("-")}`,
    date,
    dateTime: isoOrNull(dateTime),
    state: cancelled ? "cancelled" : scoreTokens.length === 2 ? "final" : "scheduled",
    homeAway: isHome ? "home" : "away",
    opponent: { id: teams[1 - teamIndex], name: teams[1 - teamIndex] },
    teamScore: scoreTokens.length === 2 ? scoreTokens[teamIndex] : NaN,
    opponentScore: scoreTokens.length === 2 ? scoreTokens[1 - teamIndex] : NaN,
    competition: "KBO League",
    venue: stripTags(cells[7]?.Text),
    sourceUrl: gameLink ? new URL(gameLink, "https://www.koreabaseball.com").toString() : null,
  };
}

export function parseKboSchedule(payloads, now = new Date()) {
  const events = [];
  for (const item of payloads || []) {
    const year = Number(item?.year);
    for (const row of item?.payload?.rows || []) {
      const event = parseKboRow(row, year);
      if (event) events.push(event);
    }
  }
  return normalizeEvents("kia", uniqueBy(events, (event) => event.id), now);
}

function walkJson(root, predicate) {
  const found = [];
  const stack = [root];
  const seen = new Set();
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== "object" || seen.has(value)) continue;
    seen.add(value);
    if (predicate(value)) found.push(value);
    if (Array.isArray(value)) stack.push(...value);
    else stack.push(...Object.values(value));
  }
  return found;
}

function parseJsonScripts(html, matcher = () => true) {
  const values = [];
  const regex = /<script([^>]*)type=["']application\/json["']([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of String(html || "").matchAll(regex)) {
    const attrs = `${match[1]} ${match[2]}`;
    if (!matcher(attrs)) continue;
    try { values.push(JSON.parse(match[3])); } catch { /* Structural validation reports missing events. */ }
  }
  return values;
}

function parseApolloTransportScripts(html) {
  const values = [];
  const regex = /<script[^>]*>([\s\S]*?ApolloSSRDataTransport[\s\S]*?)<\/script>/gi;
  for (const match of String(html || "").matchAll(regex)) {
    const push = match[1].match(/\.push\((\{[\s\S]*\})\);?\s*$/);
    if (!push) continue;
    try { values.push(JSON.parse(push[1].replace(/\bundefined\b/g, "null"))); } catch { /* Missing events fail validation. */ }
  }
  return values;
}

export function parseRealMadridHtml(html, now = new Date()) {
  const roots = parseJsonScripts(html, (attrs) => /id=["']ng-state["']/i.test(attrs));
  const rows = roots.flatMap((root) => walkJson(root, (value) =>
    value?.dateTime && value?.homeTeam?.name && value?.awayTeam?.name && value?.competition?.name
  ));
  const events = uniqueBy(rows, (row) => String(row?.id || `${row?.dateTime}|${row?.description?.plaintext || ""}`))
    .filter((row) => (row?.squad?.tag || []).some((tag) => String(tag).includes("primer-equipo-masculino")))
    .filter((row) => [row.homeTeam?.name, row.awayTeam?.name].some((name) => /^Real Madrid(?: C\.F\.)?$/i.test(cleanText(name))))
    .map((row) => {
      const isHome = /^Real Madrid(?: C\.F\.)?$/i.test(cleanText(row.homeTeam?.name));
      const side = isHome ? row.homeTeam : row.awayTeam;
      const opponent = isHome ? row.awayTeam : row.homeTeam;
      return {
        id: String(row.id || `${row.dateTime}|${opponent?.name}`),
        dateTime: isoOrNull(row.dateTime),
        date: dateOnly(row.dateTime),
        state: cleanText(row.status, 40).toLowerCase(),
        homeAway: isHome ? "home" : "away",
        opponent: { id: String(opponent?.optaId || ""), name: cleanText(opponent?.name) },
        teamScore: Number(isHome ? row.homeTeamScoreTotal : row.awayTeamScoreTotal),
        opponentScore: Number(isHome ? row.awayTeamScoreTotal : row.homeTeamScoreTotal),
        competition: cleanText(row.competition?.name),
        venue: cleanText(row.venue?.name),
      };
    });
  return normalizeEvents("madrid", events, now);
}

export function parseDplusHtml(html, now = new Date()) {
  const roots = [...parseJsonScripts(html), ...parseApolloTransportScripts(html)];
  const rows = roots.flatMap((root) => walkJson(root, (value) =>
    value?.__typename === "EventMatch" && Array.isArray(value?.matchTeams)
  ));
  const events = uniqueBy(rows, (row) => String(row?.id || ""))
    .filter((row) => cleanText(row?.league?.slug).toLowerCase() === "lck")
    .filter((row) => row.matchTeams.some((team) => cleanText(team?.code).toUpperCase() === "DK"))
    .map((row) => {
      const side = row.matchTeams.find((team) => cleanText(team?.code).toUpperCase() === "DK");
      const opponent = row.matchTeams.find((team) => team !== side);
      return {
        id: String(row.id || ""),
        dateTime: isoOrNull(row.startTime),
        date: dateOnly(row.startTime),
        state: cleanText(row.state, 40).toLowerCase(),
        homeAway: "neutral",
        opponent: { id: String(opponent?.id || "").split(":").at(-1), name: cleanText(opponent?.name) },
        teamScore: Number(side?.result?.gameWins),
        opponentScore: Number(opponent?.result?.gameWins),
        competition: cleanText(row?.tournament?.name || row?.blockName || "LCK"),
        series: row?.match?.strategy?.count ? `BO${Number(row.match.strategy.count)}` : null,
      };
    });
  return normalizeEvents("dplus", events, now);
}

function normalizeEvents(teamId, events, now) {
  const timestamp = asDate(now).getTime();
  const completedStates = new Set(["final", "completed", "finished", "game over"]);
  const cancelledStates = new Set(["cancelled", "canceled", "postponed"]);
  const completed = events.filter((event) => completedStates.has(event.state))
    .filter((event) => Number.isInteger(event.teamScore) && Number.isInteger(event.opponentScore))
    .sort((a, b) => new Date(b.dateTime || b.date).getTime() - new Date(a.dateTime || a.date).getTime());
  const scheduled = events.filter((event) => !completedStates.has(event.state) && !cancelledStates.has(event.state))
    .filter((event) => event.dateTime && new Date(event.dateTime).getTime() > timestamp - 6 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  const last = completed[0] || null;
  const next = scheduled[0] || null;
  const config = TEAM_CONFIG[teamId];
  return {
    teamId,
    league: config.league,
    lastGame: last ? {
      eventId: last.id,
      date: last.date,
      opponent: last.opponent,
      score: { team: last.teamScore, opponent: last.opponentScore },
      result: scoreResult(last.teamScore, last.opponentScore),
      homeAway: last.homeAway,
      competition: last.competition,
      venue: last.venue || null,
      series: last.series || null,
    } : null,
    nextGame: next ? {
      eventId: next.id,
      dateTime: next.dateTime,
      opponent: next.opponent,
      competition: next.competition,
      homeAway: next.homeAway,
      venue: next.venue || null,
      series: next.series || null,
    } : null,
    source: {
      provider: config.source,
      url: config.sourceUrl,
      kind: teamId === "yankees" ? "api" : "html",
    },
  };
}

export function validateCandidate(candidate, previous = null, now = new Date()) {
  const errors = [];
  const config = TEAM_CONFIG[candidate?.teamId];
  if (!config) errors.push("UNKNOWN_TEAM");
  if (config && candidate?.league !== config.league) errors.push("LEAGUE_MISMATCH");
  if (!candidate?.lastGame && !candidate?.nextGame) errors.push("NO_GAME_DATA");
  if (candidate?.lastGame) {
    const game = candidate.lastGame;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(game.date || ""))) errors.push("LAST_DATE_INVALID");
    if (!game?.opponent?.name) errors.push("LAST_OPPONENT_MISSING");
    if (!Number.isInteger(game?.score?.team) || game.score.team < 0 || !Number.isInteger(game?.score?.opponent) || game.score.opponent < 0) errors.push("LAST_SCORE_INVALID");
    else if (game.result !== scoreResult(game.score.team, game.score.opponent)) errors.push("LAST_RESULT_MISMATCH");
    if (!["home", "away", "neutral"].includes(game.homeAway)) errors.push("LAST_HOME_AWAY_INVALID");
    const gameTime = new Date(`${game.date}T23:59:59Z`).getTime();
    if (Number.isFinite(gameTime) && gameTime > asDate(now).getTime() + DAY_MS) errors.push("LAST_GAME_IN_FUTURE");
    const previousDate = previous?.lastGame?.date;
    if (previousDate && game.date < previousDate && game.eventId !== previous?.lastGame?.eventId) errors.push("LAST_GAME_REGRESSION");
  }
  if (candidate?.nextGame) {
    const next = candidate.nextGame;
    if (!isoOrNull(next.dateTime)) errors.push("NEXT_DATETIME_INVALID");
    if (!next?.opponent?.name) errors.push("NEXT_OPPONENT_MISSING");
  }
  try {
    const host = new URL(candidate?.source?.url || "").hostname;
    if (!SOURCE_HOSTS[candidate?.teamId]?.has(host)) errors.push("SOURCE_HOST_NOT_ALLOWED");
  } catch { errors.push("SOURCE_URL_INVALID"); }
  return { ok: errors.length === 0, errors };
}

function dateParam(date) {
  return asDate(date).toISOString().slice(0, 10);
}

function monthWindow(now, delta) {
  const { year, month } = kstParts(now);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: date.getUTCFullYear(), month: String(date.getUTCMonth() + 1).padStart(2, "0") };
}

async function checkedJson(response, label) {
  if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, "");
  try { return JSON.parse(text); }
  catch {
    const type = response.headers.get("content-type") || "unknown";
    throw new Error(`${label} returned non-JSON content (${type})`);
  }
}

const FETCH_HEADERS = Object.freeze({
  "Accept": "application/json,text/html;q=0.9",
  "User-Agent": "HANI-OS-Sports-Sync/0.1 (+https://github.com/ghdtjdalskr-svg/hani-os)",
});

export async function fetchTeamCandidate(teamId, { now = new Date(), fetchImpl = fetch } = {}) {
  const config = TEAM_CONFIG[teamId];
  if (!config) throw new Error(`Unknown team: ${teamId}`);
  if (teamId === "yankees") {
    const from = new Date(asDate(now).getTime() - 30 * DAY_MS);
    const to = new Date(asDate(now).getTime() + 60 * DAY_MS);
    const url = new URL(config.sourceUrl);
    url.search = new URLSearchParams({ sportId: "1", teamId: "147", gameTypes: "R,F,D,L,W", startDate: dateParam(from), endDate: dateParam(to), hydrate: "team,venue" }).toString();
    return parseMlbSchedule(await checkedJson(await fetchImpl(url, { headers: FETCH_HEADERS }), "MLB"), now);
  }
  if (teamId === "kia") {
    const payloads = [];
    for (const delta of [-1, 0, 1]) {
      const window = monthWindow(now, delta);
      const body = new URLSearchParams({ leId: "1", srIdList: "0,9,6", seasonId: String(window.year), gameMonth: window.month, teamId: "HT" });
      const response = await fetchImpl("https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList", {
        method: "POST",
        headers: {
          ...FETCH_HEADERS,
          "Accept": "application/json, text/javascript, */*; q=0.01",
          "User-Agent": "Mozilla/5.0 (compatible; HANI-OS-Sports-Sync/0.1)",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": config.sourceUrl,
        },
        body,
      });
      payloads.push({ year: window.year, payload: await checkedJson(response, "KBO") });
    }
    return parseKboSchedule(payloads, now);
  }
  const response = await fetchImpl(config.sourceUrl, { headers: { ...FETCH_HEADERS, Accept: "text/html" } });
  if (!response.ok) throw new Error(`${config.source} HTTP ${response.status}`);
  const html = await response.text();
  return teamId === "madrid" ? parseRealMadridHtml(html, now) : parseDplusHtml(html, now);
}
