/* HANI OS · 출석 도장판 계산 엔진 (2안, 2026-11-17 서윤)
 * 화면 없음. 날짜 문자열 'YYYY-MM-DD'(회장님 기기 현지 날짜) 기준의 순수 계산만.
 * 저장은 회장님이 승인한 새 키 하나(hani_attendance_v1)만 쓰고, 다른 키는 읽지도 쓰지도 않는다.
 * hani_os_life_v23 은 이 파일에서 절대 다루지 않는다.
 */
(function (root) {
  "use strict";

  var KEY = "hani_attendance_v1";
  var MILESTONES = [3, 7, 14, 30];
  var KEEP_DAYS = 400; // 저장 크기 상한(약 13개월)
  var DAY = 86400000;
  var RE_DAY = /^\d{4}-\d{2}-\d{2}$/;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function todayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function toNum(k) { var p = k.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / DAY; }
  function fromNum(n) { var d = new Date(n * DAY); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function addDays(k, n) { return fromNum(toNum(k) + n); }
  function isDay(k) { if (typeof k !== "string" || !RE_DAY.test(k)) return false; return fromNum(toNum(k)) === k; }
  // 월요일 시작 주. 1970-01-01 은 목요일.
  function weekStart(k) { var n = toNum(k); var dow = (n + 3) % 7; return fromNum(n - dow); }

  function uniqSorted(list) {
    var seen = {}, out = [];
    (Array.isArray(list) ? list : []).forEach(function (k) { if (isDay(k) && !seen[k]) { seen[k] = 1; out.push(k); } });
    return out.sort();
  }

  function empty() { return { v: 1, days: [], restDays: [], unlocked: [], lastBonusDay: "" }; }

  // 깨진 값이면 빈 기록으로 본다(broken=true). 호출부는 broken 일 때 덮어쓰지 말고, 다음 도장 때만 새로 쓴다.
  function normalize(raw) {
    var s = raw;
    if (typeof s === "string") { try { s = JSON.parse(s); } catch (e) { return { state: empty(), broken: true }; } }
    if (!s || typeof s !== "object" || Array.isArray(s)) return { state: empty(), broken: raw != null };
    var st = {
      v: 1,
      days: uniqSorted(s.days),
      restDays: uniqSorted(s.restDays),
      unlocked: (Array.isArray(s.unlocked) ? s.unlocked : []).filter(function (m) { return MILESTONES.indexOf(m) >= 0; })
        .filter(function (m, i, a) { return a.indexOf(m) === i; }).sort(function (a, b) { return a - b; }),
      lastBonusDay: isDay(s.lastBonusDay) ? s.lastBonusDay : ""
    };
    st.restDays = st.restDays.filter(function (k) { return st.days.indexOf(k) < 0; });
    return { state: st, broken: false };
  }

  function has(list, k) { return list.indexOf(k) >= 0; }
  function kept(st, k) { return has(st.days, k) || has(st.restDays, k); }
  function restUsedInWeek(st, k) { var w = weekStart(k); return st.restDays.some(function (r) { return weekStart(r) === w; }); }

  // k 날짜까지 끊기지 않고 이어진 날 수(도장 + 쉬는 날 패스).
  function streakAt(st, k) { var n = 0; while (kept(st, k)) { n++; k = addDays(k, -1); } return n; }

  function lastKeptBefore(st, today) {
    var all = st.days.concat(st.restDays).filter(function (k) { return k < today; }).sort();
    return all.length ? all[all.length - 1] : "";
  }

  // 오늘 도장 찍기. 원본 state 는 바꾸지 않고 새 state 를 돌려준다.
  function stamp(input, today) {
    var st = normalize(input).state;
    today = today || todayKey();
    if (!isDay(today)) throw new Error("bad day");
    if (has(st.days, today)) return { state: st, added: false, autoRest: [], milestone: null, bonus: false, streak: streakAt(st, today), comeback: false };

    var autoRest = [], comeback = false;
    var last = lastKeptBefore(st, today);
    if (last) {
      var gap = toNum(today) - toNum(last) - 1; // 비어 있는 날 수
      if (gap === 1) {
        var missed = addDays(today, -1);
        if (!restUsedInWeek(st, missed)) { st.restDays.push(missed); autoRest.push(missed); }
        else comeback = true;
      } else if (gap > 1) comeback = true;
    }
    st.restDays = st.restDays.filter(function (k) { return k !== today; });
    st.days.push(today);
    st.days.sort(); st.restDays.sort();

    var streak = streakAt(st, today);
    var milestone = MILESTONES.indexOf(streak) >= 0 ? streak : null;
    if (milestone && !has(st.unlocked, milestone)) { st.unlocked.push(milestone); st.unlocked.sort(function (a, b) { return a - b; }); }
    var bonus = false;
    if (milestone === 7 && st.lastBonusDay !== today) { bonus = true; st.lastBonusDay = today; }

    var cut = addDays(today, -KEEP_DAYS);
    st.days = st.days.filter(function (k) { return k > cut; });
    st.restDays = st.restDays.filter(function (k) { return k > cut; });
    return { state: st, added: true, autoRest: autoRest, milestone: milestone, bonus: bonus, streak: streak, comeback: comeback };
  }

  // 화면용 요약(저장 안 함).
  function view(input, today) {
    var st = normalize(input).state;
    today = today || todayKey();
    var done = has(st.days, today);
    var y = addDays(today, -1), y2 = addDays(today, -2);
    var streak;
    if (done) streak = streakAt(st, today);
    else if (kept(st, y)) streak = streakAt(st, y);
    else if (kept(st, y2) && !restUsedInWeek(st, y)) streak = streakAt(st, y2) + 1; // 오늘 찍으면 패스가 이어 줌
    else streak = 0;
    var next = null;
    for (var i = 0; i < MILESTONES.length; i++) if (MILESTONES[i] > streak) { next = MILESTONES[i]; break; }
    var ws = weekStart(today), week = [];
    for (var d = 0; d < 7; d++) {
      var k = addDays(ws, d);
      week.push({ day: k, state: has(st.days, k) ? "stamp" : has(st.restDays, k) ? "rest" : k === today ? "today" : k > today ? "future" : "miss" });
    }
    var month = today.slice(0, 7);
    return {
      today: today, done: done, streak: streak, next: next, toNext: next ? next - streak : 0,
      week: week, monthCount: st.days.filter(function (k) { return k.slice(0, 7) === month; }).length,
      unlocked: st.unlocked.slice(), honorBadge: has(st.unlocked, 30)
    };
  }

  // 날짜로 정해지는 오늘의 당번(같은 날이면 늘 같은 사람).
  function dutyIndex(dayKey, count) {
    if (!count) return -1;
    var x = (toNum(dayKey) + 11) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0; x = (x ^ (x >>> 16)) >>> 0;
    return x % count;
  }

  // 저장소는 밖에서 넘겨받는다(시험에서 가짜 저장소 사용). 이 키 하나만 다룬다.
  function load(storage) {
    var raw = null;
    try { raw = storage && storage.getItem(KEY); } catch (e) { return { state: empty(), broken: false, unavailable: true }; }
    return normalize(raw);
  }
  function save(storage, st) {
    try { storage.setItem(KEY, JSON.stringify(normalize(st).state)); return true; } catch (e) { return false; }
  }

  var api = { KEY: KEY, MILESTONES: MILESTONES.slice(), todayKey: todayKey, addDays: addDays, weekStart: weekStart,
    normalize: normalize, stamp: stamp, view: view, dutyIndex: dutyIndex, load: load, save: save, version: "attendance-core-v1" };
  if (typeof module === "object" && module.exports) module.exports = api;
  root.HaniAttendance = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
