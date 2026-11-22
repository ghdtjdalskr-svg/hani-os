import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const A = require("../hani-attendance-core.js");

function run(days) { let st = null, last; for (const d of days) { last = A.stamp(st, d); st = last.state; } return { st, last }; }
function seq(start, n) { return Array.from({ length: n }, (_, i) => A.addDays(start, i)); }

test("주는 월요일부터, 날짜 계산은 월·연 경계에서도 맞음", () => {
  assert.equal(A.weekStart("2026-11-17"), "2026-11-16"); // 화 → 월
  assert.equal(A.weekStart("2026-11-22"), "2026-11-16"); // 일 → 같은 주 월
  assert.equal(A.weekStart("2026-11-23"), "2026-11-23");
  assert.equal(A.addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(A.addDays("2028-02-28", 1), "2028-02-29");
});

test("연속 도장과 보상 시점 3·7·14·30", () => {
  const hits = [];
  let st = null;
  for (const d of seq("2026-11-16", 30)) { const r = A.stamp(st, d); st = r.state; if (r.milestone) hits.push([r.streak, r.milestone]); }
  assert.deepEqual(hits, [[3, 3], [7, 7], [14, 14], [30, 30]]);
  assert.deepEqual(st.unlocked, [3, 7, 14, 30]);
  assert.equal(A.view(st, "2026-12-15").honorBadge, true);
});

test("같은 날 두 번 눌러도 한 번만", () => {
  const a = A.stamp(null, "2026-11-16");
  const b = A.stamp(a.state, "2026-11-16");
  assert.equal(b.added, false);
  assert.equal(b.state.days.length, 1);
});

test("하루 빠지면 그 주 쉬는 날 패스가 자동으로 이어 줌", () => {
  const { st } = run(["2026-11-16", "2026-11-17"]);
  const r = A.stamp(st, "2026-11-19"); // 18일(수) 빠짐
  assert.deepEqual(r.autoRest, ["2026-11-18"]);
  assert.equal(r.streak, 4);
  assert.equal(r.comeback, false);
});

test("같은 주에 두 번째로 빠지면 패스 없음 → 숨 고르기(연속 1부터), 받은 배지는 유지", () => {
  let { st } = run(seq("2026-11-09", 7)); // 7일 개근
  assert.ok(st.unlocked.includes(7));
  st = A.stamp(st, "2026-11-17").state;    // 16일(월) 빠짐 → 패스
  const r = A.stamp(st, "2026-11-19");     // 18일(수) 또 빠짐 → 같은 주라 패스 없음
  assert.deepEqual(r.autoRest, []);
  assert.equal(r.comeback, true);
  assert.equal(r.streak, 1);
  assert.ok(r.state.unlocked.includes(7));
});

test("이틀 이상 빠지면 패스 없이 숨 고르기, 이번 달 도장 수는 그대로", () => {
  const { st } = run(["2026-11-02", "2026-11-03"]);
  const r = A.stamp(st, "2026-11-06");
  assert.equal(r.comeback, true);
  assert.equal(r.streak, 1);
  assert.equal(A.view(r.state, "2026-11-06").monthCount, 3);
});

test("다음 주가 되면 패스가 다시 생김(주 경계)", () => {
  let { st } = run(["2026-11-20", "2026-11-21"]);   // 금·토
  st = A.stamp(st, "2026-11-23").state;             // 일(22) 빠짐 → 지난주 패스
  const r = A.stamp(st, "2026-11-25");              // 화(24) 빠짐 → 이번 주 새 패스
  assert.deepEqual(r.autoRest, ["2026-11-24"]);
  assert.equal(r.streak, 6);
});

test("7일 친밀도 보너스는 그날 한 번만", () => {
  const { st, last } = run(seq("2026-11-16", 7));
  assert.equal(last.bonus, true);
  assert.equal(st.lastBonusDay, "2026-11-22");
  assert.equal(A.stamp(st, "2026-11-22").bonus, false);
});

test("화면 요약: 오늘 안 찍었을 때 연속 표시와 주간 칸", () => {
  const { st } = run(["2026-11-16", "2026-11-17"]);
  const v = A.view(st, "2026-11-18");
  assert.equal(v.done, false);
  assert.equal(v.streak, 2);
  assert.equal(v.next, 3);
  assert.deepEqual(v.week.map(c => c.state), ["stamp", "stamp", "today", "future", "future", "future", "future"]);
  const v2 = A.view(st, "2026-11-19"); // 어제(18) 빠짐 → 오늘 찍으면 패스가 이어 줄 예정
  assert.equal(v2.streak, 3);
  assert.equal(v2.week[2].state, "miss");
});

test("깨진 저장값은 빈 기록 + broken 표시, 이상한 날짜는 버림", () => {
  assert.equal(A.normalize("{not json").broken, true);
  assert.equal(A.normalize(null).broken, false);
  const n = A.normalize({ days: ["2026-11-16", "2026-13-40", "x", "2026-11-16"], restDays: ["2026-11-16"], unlocked: [7, 99, 7] });
  assert.deepEqual(n.state.days, ["2026-11-16"]);
  assert.deepEqual(n.state.restDays, []);
  assert.deepEqual(n.state.unlocked, [7]);
});

test("저장은 hani_attendance_v1 한 키만, 저장소 오류에도 안 터짐", () => {
  const writes = [];
  const fake = { getItem: k => (k === A.KEY ? null : "x"), setItem: (k, v) => writes.push(k) };
  const st = A.stamp(A.load(fake).state, "2026-11-16").state;
  assert.equal(A.save(fake, st), true);
  assert.deepEqual(writes, ["hani_attendance_v1"]);
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(A.load(broken).unavailable, true);
  assert.equal(A.save(broken, st), false);
});

test("원본 state 를 바꾸지 않음", () => {
  const a = A.stamp(null, "2026-11-16").state;
  const snap = JSON.stringify(a);
  A.stamp(a, "2026-11-17");
  assert.equal(JSON.stringify(a), snap);
});

test("당번은 날짜마다 고정, 범위 안", () => {
  const i = A.dutyIndex("2026-11-17", 24);
  assert.equal(A.dutyIndex("2026-11-17", 24), i);
  assert.ok(i >= 0 && i < 24);
  const spread = new Set(seq("2026-11-01", 60).map(d => A.dutyIndex(d, 24)));
  assert.ok(spread.size >= 18);
});

test("핵심 데이터 키를 코드에서 다루지 않음", () => {
  const src = readFileSync(new URL("../hani-attendance-core.js", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/hani_os_life_v23|localStorage|removeItem|clear\(/.test(src));
});
