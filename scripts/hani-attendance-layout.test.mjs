import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readRepoFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), "utf8");
}

test("#attendanceBoard mounts before #homeActions and stylesheet loads after hani-design-system.css", () => {
  const indexHtml = readRepoFile("index.html");
  const boardJs = readRepoFile("hani-attendance-board.js");
  const mainJs = readRepoFile("hani-main.js");

  const dsCssIdx = indexHtml.indexOf("./hani-design-system.css");
  const attCssIdx = indexHtml.indexOf("./hani-attendance-board.css");
  assert.ok(dsCssIdx >= 0 && attCssIdx > dsCssIdx, "hani-attendance-board.css must load after hani-design-system.css");

  const homeSectionMatch = indexHtml.match(/<section id="home"[\s\S]*?<\/section>/);
  assert.ok(homeSectionMatch && homeSectionMatch[0].includes('id="homeActions"'), "#homeActions must live inside #home");

  assert.match(boardJs, /homeActions\.parentNode\.insertBefore\(section,\s*homeActions\)/);
  assert.match(mainJs, /function renderHome\(\)\s*\{[\s\S]{0,200}window\.HaniAttendanceBoard\?\.render\(\)/);
});

test("#attendanceBoard desktop and mobile CSS order rules fit between summary cards and Life Market", () => {
  // Read only the 2.9.304 dashboard order block; older order rules earlier in the file are superseded by it.
  const fullCss = readRepoFile("hani-design-system.css");
  const dsCss = fullCss.slice(fullCss.indexOf("UI Polish 1 (11/15, 11/17, 11/20)"));
  const attCss = readRepoFile("hani-attendance-board.css");

  const desktopLowerOrder = Number(dsCss.match(/#app #home>\.home-lower-grid\{order:(-?\d+)\}/)?.[1]);
  const desktopControlsOrder = Number(dsCss.match(/#app #home>\.home-source-controls\{order:(-?\d+)\}/)?.[1]);
  const desktopMarketOrder = Number(dsCss.match(/#app #home>\.life-market-head\{order:(-?\d+)\}/)?.[1]);

  assert.equal(desktopLowerOrder, -25);
  assert.equal(desktopControlsOrder, -23);
  assert.equal(desktopMarketOrder, -20);

  const mobileSection = dsCss.slice(dsCss.indexOf("@media(max-width:700px)"));
  const mobileMonthlyOrder = Number(mobileSection.match(/#app #home \.home-monthly-check-card\{order:(-?\d+)\}/)?.[1]);
  const mobileTodayTitleOrder = Number(mobileSection.match(/#app #home>\.home-today-title\{order:(-?\d+)\}/)?.[1]);
  const mobileMarketOrder = Number(mobileSection.match(/#app #home>\.life-market-head\{order:(-?\d+)\}/)?.[1]);

  assert.equal(mobileMonthlyOrder, -26);
  assert.equal(mobileTodayTitleOrder, -24);
  assert.equal(mobileMarketOrder, -20);

  const desktopAttMatch = attCss.match(/#app #home > #attendanceBoard \{\s*order:\s*(-?\d+);/);
  assert.ok(desktopAttMatch, "Desktop #app #home > #attendanceBoard order rule must exist");
  const desktopAttOrder = Number(desktopAttMatch[1]);
  assert.ok(
    desktopAttOrder > desktopLowerOrder && desktopAttOrder < desktopControlsOrder && desktopAttOrder < desktopMarketOrder,
    `Desktop #attendanceBoard order (${desktopAttOrder}) must sit below .home-lower-grid (${desktopLowerOrder}) and above .home-source-controls (${desktopControlsOrder}) / .life-market-head (${desktopMarketOrder})`
  );

  const mobileAttMatch = attCss.match(/@media \(max-width: 700px\) \{\s*#app #home > #attendanceBoard \{\s*order:\s*(-?\d+);/);
  assert.ok(mobileAttMatch, "Mobile @media (max-width: 700px) #app #home > #attendanceBoard order rule must exist");
  const mobileAttOrder = Number(mobileAttMatch[1]);
  assert.ok(
    mobileAttOrder > mobileMonthlyOrder && mobileAttOrder < mobileTodayTitleOrder && mobileAttOrder < mobileMarketOrder,
    `Mobile #attendanceBoard order (${mobileAttOrder}) must sit below .home-monthly-check-card (${mobileMonthlyOrder}) and above .home-today-title (${mobileTodayTitleOrder}) / .life-market-head (${mobileMarketOrder})`
  );
});

test("midnight-black and titanium-graphite finishes map #attendanceBoard to Design System Finish tokens", () => {
  const attCss = readRepoFile("hani-attendance-board.css");
  const finishMatch = attCss.match(
    /:root:is\(\[data-finish="midnight-black"\],\s*\[data-finish="titanium-graphite"\]\)\s*#attendanceBoard\s*\{([^}]*--surface-panel[^}]*)\}/
  );
  assert.ok(finishMatch, "Finish token override block for midnight-black and titanium-graphite must exist");
  const block = finishMatch[1];
  for (const token of ["--surface-panel", "--surface-raised", "--text-primary", "--text-secondary", "--border-subtle"]) {
    assert.ok(block.includes(token), `Finish override must reference ${token}`);
  }
});

test("attendance storage and affinity guardrails remain read-only / isolated", () => {
  const coreJs = readRepoFile("hani-attendance-core.js");
  const boardJs = readRepoFile("hani-attendance-board.js");

  assert.match(coreJs, /const KEY = "hani_attendance_v1";/);
  for (const source of [coreJs, boardJs]) {
    assert.equal(source.includes("hani_os_life_v23"), false, "Must never reference hani_os_life_v23");
    assert.equal(source.includes("removeItem"), false, "Must never call removeItem");
    assert.equal(source.includes(".clear("), false, "Must never call storage.clear");
    assert.equal(source.includes("hani_office_affinity_v1"), false, "Must never touch hani_office_affinity_v1");
  }
  assert.equal(/localStorage\.setItem/.test(boardJs), false, "hani-attendance-board.js must delegate storage to core");
});
