import { fetchTeamCandidate, validateCandidate } from "../supabase/functions/hani-sports-sync/index.ts";

const nowArg = process.argv.find((arg) => arg.startsWith("--now="))?.slice(6);
const now = nowArg ? new Date(nowArg) : new Date();
if (Number.isNaN(now.getTime())) throw new Error("--now must be an ISO date/time");

let failed = false;
for (const teamId of ["yankees", "kia", "madrid", "dplus"]) {
  try {
    const candidate = await fetchTeamCandidate(teamId, { now });
    const validation = validateCandidate(candidate, null, now);
    const summary = {
      teamId,
      valid: validation.ok,
      errors: validation.errors,
      lastGame: candidate.lastGame && {
        date: candidate.lastGame.date,
        opponent: candidate.lastGame.opponent.name,
        score: candidate.lastGame.score,
        result: candidate.lastGame.result,
      },
      nextGame: candidate.nextGame && {
        dateTime: candidate.nextGame.dateTime,
        opponent: candidate.nextGame.opponent.name,
      },
      source: candidate.source.provider,
    };
    console.log(JSON.stringify(summary));
    failed ||= !validation.ok;
  } catch (error) {
    failed = true;
    console.error(JSON.stringify({ teamId, valid: false, error: String(error?.message || error) }));
  }
}

process.exitCode = failed ? 1 : 0;
