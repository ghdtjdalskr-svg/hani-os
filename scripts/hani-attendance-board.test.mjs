// node --test scripts/hani-attendance-board.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function makeDom() {
  function makeEl(tag) {
    const classes = new Set();
    const attrs = new Map();
    const listeners = new Map();
    const el = {
      tagName: tag.toUpperCase(),
      children: [],
      parentNode: null,
      style: {},
      hidden: false,
      disabled: false,
      textContent: "",
      type: "",
      alt: "",
      width: 0,
      height: 0,
      decoding: "",
      get id() {
        return attrs.get("id") || "";
      },
      set id(v) {
        if (v) attrs.set("id", String(v));
        else attrs.delete("id");
      },
      get src() {
        return attrs.get("src") || "";
      },
      set src(v) {
        attrs.set("src", String(v));
      },
      get className() {
        return [...classes].join(" ");
      },
      set className(v) {
        classes.clear();
        for (const c of String(v || "").split(/\s+/)) {
          if (c) classes.add(c);
        }
      },
      classList: {
        add(...cs) {
          for (const c of cs) if (c) classes.add(c);
        },
        toggle(c, force) {
          const next = force === undefined ? !classes.has(c) : Boolean(force);
          if (next) classes.add(c);
          else classes.delete(c);
          return next;
        },
        contains(c) {
          return classes.has(c);
        }
      },
      setAttribute(k, v) {
        attrs.set(String(k), String(v));
      },
      getAttribute(k) {
        return attrs.has(String(k)) ? attrs.get(String(k)) : null;
      },
      removeAttribute(k) {
        attrs.delete(String(k));
      },
      get nextElementSibling() {
        if (!el.parentNode) return null;
        const list = el.parentNode.children;
        const i = list.indexOf(el);
        return i >= 0 && i + 1 < list.length ? list[i + 1] : null;
      },
      append(...nodes) {
        for (const n of nodes) el.insertBefore(n, null);
      },
      insertBefore(node, ref) {
        if (node.parentNode) {
          const prev = node.parentNode.children;
          const idx = prev.indexOf(node);
          if (idx >= 0) prev.splice(idx, 1);
        }
        node.parentNode = el;
        if (ref) {
          const i = el.children.indexOf(ref);
          if (i >= 0) {
            el.children.splice(i, 0, node);
            return node;
          }
        }
        el.children.push(node);
        return node;
      },
      remove() {
        if (!el.parentNode) return;
        const idx = el.parentNode.children.indexOf(el);
        if (idx >= 0) el.parentNode.children.splice(idx, 1);
        el.parentNode = null;
      },
      contains(target) {
        if (target === el) return true;
        return el.children.some((c) => c.contains(target));
      },
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      click() {
        for (const fn of listeners.get("click") || []) fn({ target: el });
      }
    };
    return el;
  }

  const home = makeEl("section");
  home.id = "home";
  const actions = makeEl("div");
  actions.id = "homeActions";
  home.append(actions);

  function findById(node, id) {
    if (node.id === id) return node;
    for (const child of node.children) {
      const hit = findById(child, id);
      if (hit) return hit;
    }
    return null;
  }

  return {
    home,
    actions,
    document: {
      createElement: (tag) => makeEl(tag),
      getElementById: (id) => findById(home, id)
    }
  };
}

function makeMemoryStorage(initial = {}, opts = {}) {
  const map = new Map(Object.entries(initial));
  const writes = [];
  return {
    writes,
    map,
    getItem(k) {
      if (opts.throwGet) throw new Error("storage blocked");
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      if (opts.throwSet) throw new Error("quota exceeded");
      writes.push([k, v]);
      map.set(k, String(v));
    }
  };
}

function bootBoard({ storage, nowMs = new Date("2026-11-17T10:00:00+09:00").getTime() } = {}) {
  const RealDate = Date;
  let clockMs = nowMs;
  function TestDate(...args) {
    return args.length ? new RealDate(...args) : new RealDate(clockMs);
  }
  TestDate.UTC = RealDate.UTC;
  TestDate.parse = RealDate.parse;
  TestDate.now = () => clockMs;
  TestDate.prototype = RealDate.prototype;

  const dom = makeDom();
  const ctx = vm.createContext({
    Date: TestDate,
    document: dom.document,
    localStorage: storage
  });
  ctx.window = ctx;
  ctx.globalThis = ctx;

  vm.runInContext(read("hani-attendance-core.js"), ctx, { filename: "hani-attendance-core.js" });
  vm.runInContext(read("hani-attendance-board.js"), ctx, { filename: "hani-attendance-board.js" });

  return {
    ctx,
    dom,
    advanceDays(n) {
      clockMs += n * 86400000;
    }
  };
}

test("syntax and index/main wiring", () => {
  const core = read("hani-attendance-core.js");
  const board = read("hani-attendance-board.js");
  const css = read("hani-attendance-board.css");
  const html = read("index.html");
  const main = read("hani-main.js");

  new vm.Script(core, { filename: "hani-attendance-core.js" });
  new vm.Script(board, { filename: "hani-attendance-board.js" });

  assert.match(html, /href="\.\/hani-attendance-board\.css"/);
  const coreIdx = html.indexOf('<script src="./hani-attendance-core.js"></script>');
  const boardIdx = html.indexOf('<script src="./hani-attendance-board.js"></script>');
  assert.ok(coreIdx >= 0 && boardIdx > coreIdx, "core script must load before board script");

  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "no duplicate ids in index.html");
  assert.equal(ids.includes("attendanceBoard"), false, "slot is mounted once dynamically, not duplicated");

  assert.match(main, /function renderHome\(\)\{[\s\S]{0,120}HaniAttendanceBoard\?\.render\(\)/);
  assert.match(css, /#attendanceBoard\b/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test("safety guardrails: isolated key, no forbidden APIs or layers", () => {
  const core = read("hani-attendance-core.js");
  const board = read("hani-attendance-board.js");

  for (const [name, src] of [["core", core], ["board", board]]) {
    assert.doesNotMatch(src, /hani_os_life_v23/, `${name} must not reference hani_os_life_v23`);
    assert.doesNotMatch(src, /hani_office_affinity_v1/, `${name} must not touch affinity storage`);
    assert.doesNotMatch(src, /\.removeItem\s*\(|\.clear\s*\(/, `${name} must never remove/clear storage`);
    assert.doesNotMatch(src, /\bsetInterval\s*\(|\bMutationObserver\b/, `${name} must not use setInterval/MutationObserver`);
    assert.doesNotMatch(src, /\.from\s*\(\s*["']hani_state["']/, `${name} must not touch Supabase`);
  }

  // Board must not reference any localStorage key directly; core owns hani_attendance_v1.
  assert.doesNotMatch(board, /localStorage\.(getItem|setItem)/, "board uses HaniAttendance.load/save only");
  assert.match(core, /const KEY = "hani_attendance_v1"/);
});

test("single #attendanceBoard slot id and all 24 characters covered in lines", () => {
  const boardSrc = read("hani-attendance-board.js");
  const linesJson = JSON.parse(read("artifacts/attendance-v1/lines.json"));
  const { ctx } = bootBoard({ storage: makeMemoryStorage() });
  const { CREW, LINES } = ctx.HaniAttendanceBoard;

  // Single #attendanceBoard slot id literal in board source
  assert.equal((boardSrc.match(/["']attendanceBoard["']/g) || []).length, 1);

  assert.equal(CREW.length, 24, "20 staff + 4 pets = 24");
  const crewIds = CREW.map((c) => c.id);
  assert.equal(new Set(crewIds).size, 24, "unique 24 ids");
  assert.ok(crewIds.includes("ieum"), "ieum included");

  for (const id of crewIds) {
    for (const [label, bank] of [["lines.json", linesJson], ["HaniAttendanceBoard.LINES", LINES]]) {
      assert.ok(bank.duty[id], `${label} has duty.${id}`);
      assert.ok(Array.isArray(bank.duty[id].before) && bank.duty[id].before.length >= 2, `${label} duty.${id}.before`);
      assert.ok(Array.isArray(bank.duty[id].after) && bank.duty[id].after.length >= 2, `${label} duty.${id}.after`);
      assert.ok(typeof bank.secret7[id] === "string" && bank.secret7[id].length > 0, `${label} secret7.${id}`);
    }
  }

  for (const m of ["3", "7", "14", "30"]) {
    assert.ok(linesJson.milestone[m]?.length >= 1 && LINES.milestone[m]?.length >= 1, `milestone ${m} lines`);
  }
  assert.ok(linesJson.rest.length >= 1 && LINES.rest.length >= 1);
  assert.ok(linesJson.comeback.length >= 1 && LINES.comeback.length >= 1);
});

test("referenced character portraits and pet sprites exist on disk", () => {
  const { ctx } = bootBoard({ storage: makeMemoryStorage() });
  const { CREW } = ctx.HaniAttendanceBoard;
  const special = {
    daon: "assets/profiles/thumb/hani-profile-daon-v2-256.webp",
    yoonseul: "assets/profiles/thumb/hani-profile-yoonseul-v2-256.webp",
    sua: "assets/profiles/thumb/hani-profile-sua-id-256.webp"
  };
  const pets = {
    "pet-cat": "assets/sprites-v3/pet-cat.webp",
    "pet-dog": "assets/sprites-v3/pet-dog.webp",
    "pet-bori": "assets/sprites-v3/pet-bori.webp",
    "pet-rabbit": "assets/sprites-v3/pet-rabbit.webp"
  };
  for (const c of CREW) {
    const rel = c.pet ? pets[c.id] : (special[c.id] || `assets/profiles/thumb/hani-profile-${c.id}-256.webp`);
    assert.ok(fs.statSync(path.join(ROOT, rel)).isFile(), `asset exists for ${c.id}: ${rel}`);
  }
});

test("runtime slot reuse, broken/unavailable storage, milestones, and midnight rollover", () => {
  // 1. Broken storage: renders empty without overwriting until next stamp
  const brokenStorage = makeMemoryStorage({ hani_attendance_v1: "{not-json" });
  const app1 = bootBoard({ storage: brokenStorage });
  const slot1 = app1.dom.document.getElementById("attendanceBoard");
  assert.ok(slot1, "mounted #attendanceBoard");
  assert.equal(app1.dom.home.children[0], slot1);
  assert.equal(app1.dom.home.children[1], app1.dom.actions);
  assert.equal(brokenStorage.writes.length, 0, "does not overwrite broken storage on load");

  // Re-render reuses the exact same DOM node
  app1.ctx.HaniAttendanceBoard.render();
  assert.equal(app1.dom.document.getElementById("attendanceBoard"), slot1, "persistent slot reused in place");

  // Click stamp button
  assert.equal(slot1._attRefs.btn.textContent, "오늘 도장 쾅!");
  assert.equal(slot1._attRefs.btn.disabled, false);
  slot1._attRefs.btn.click();
  assert.equal(slot1._attRefs.btn.textContent, "오늘 도장 완료 ✓");
  assert.equal(slot1._attRefs.btn.disabled, true);
  assert.equal(brokenStorage.writes.length, 1, "saves only on stamp click");

  // Midnight rollover: advance clock by 1 day and click again without reload
  app1.advanceDays(1);
  app1.ctx.HaniAttendanceBoard.render();
  assert.equal(slot1._attRefs.btn.disabled, false, "new day unlocks button");
  slot1._attRefs.btn.click();
  const savedAfterRollover = JSON.parse(brokenStorage.map.get("hani_attendance_v1"));
  assert.equal(savedAfterRollover.days.length, 2, "midnight rollover stamps new day");

  // 2. Unavailable storage: in-memory fallback + notice
  const blockedStorage = makeMemoryStorage({}, { throwGet: true, throwSet: true });
  const app2 = bootBoard({ storage: blockedStorage });
  const slot2 = app2.dom.document.getElementById("attendanceBoard");
  assert.equal(slot2._attRefs.notice.hidden, false, "shows storage unavailable notice");
  slot2._attRefs.btn.click();
  assert.equal(slot2._attRefs.btn.textContent, "오늘 도장 완료 ✓", "button still works in memory");

  // 3. Milestones 14 (.gold) and 30 (👑 개근 후원자 badge)
  const days29 = Array.from({ length: 29 }, (_, i) => {
    const d = new Date("2026-10-19T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const milestoneStorage = makeMemoryStorage({
    hani_attendance_v1: JSON.stringify({ v: 1, days: days29, rest: [], bonus7: [], best: 29, unlocked: [3, 7, 14] })
  });
  const app3 = bootBoard({ storage: milestoneStorage, nowMs: new Date("2026-11-17T10:00:00+09:00").getTime() });
  const slot3 = app3.dom.document.getElementById("attendanceBoard");
  assert.ok(slot3.classList.contains("gold"), "14+ unlocked -> gold card");
  assert.equal(slot3._attRefs.secret.hidden, false, "7+ unlocked -> secret7 line visible");
  assert.equal(slot3._attRefs.honorBadge.hidden, true, "29 streak -> 30-day badge still hidden");
  slot3._attRefs.btn.click();
  assert.equal(slot3._attRefs.honorBadge.hidden, false, "30th day stamp -> honor badge visible");
});
