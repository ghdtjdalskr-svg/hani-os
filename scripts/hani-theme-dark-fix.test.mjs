// node --test scripts/hani-theme-dark-fix.test.mjs
// Static regression checks for dark finish fix 1 (Top 2, 3, 4, 5, 8, and Top 10 contrast).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (rel) => fs.readFileSync(new URL(rel, root), 'utf8');

const dsCss = read('hani-design-system.css');
const studyJs = read('hani-study-v02984.js');

const DS_MARKER = '/* dark finish fix 1 */';
const dsIdx = dsCss.indexOf(DS_MARKER);
const dsAdded = dsIdx >= 0 ? dsCss.slice(dsIdx) : '';

const STUDY_MARKER = ':root[data-finish="midnight-black"] #study.hani-study-v02984';
const studyStart = studyJs.indexOf(STUDY_MARKER);
const studyEnd = studyStart >= 0 ? studyJs.indexOf('`;', studyStart) : -1;
const studyAdded = studyStart >= 0 && studyEnd > studyStart ? studyJs.slice(studyStart, studyEnd) : '';

function extractSelectorLists(cssBlock) {
  const cleaned = cssBlock.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (ch === '{') {
      if (depth === 0 && current.trim()) {
        selectors.push(current.trim());
      }
      depth += 1;
      current = '';
    } else if (ch === '}') {
      depth -= 1;
      assert.ok(depth >= 0, 'unmatched closing brace in dark finish CSS');
      current = '';
    } else if (depth === 0) {
      current += ch;
    }
  }
  assert.equal(depth, 0, 'unclosed brace in dark finish CSS');
  return selectors;
}

function splitTopLevelCommas(selectorList) {
  const parts = [];
  let paren = 0;
  let bracket = 0;
  let buf = '';
  for (const ch of selectorList) {
    if (ch === '(') paren += 1;
    else if (ch === ')') paren -= 1;
    else if (ch === '[') bracket += 1;
    else if (ch === ']') bracket -= 1;
    if (ch === ',' && paren === 0 && bracket === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

const DARK_PREFIX_RE = /^:root\[data-finish="(midnight-black|titanium-graphite)"\]/;

test('dark finish fix 1 sections exist and have balanced CSS braces', () => {
  assert.ok(dsIdx > 0, 'hani-design-system.css contains dark finish fix 1 marker');
  assert.ok(studyStart > 0 && studyEnd > studyStart, 'hani-study-v02984.js contains dark finish CSS inside style()');
  assert.ok(extractSelectorLists(dsAdded).length >= 30, 'hani-design-system.css dark fix rule count');
  assert.ok(extractSelectorLists(studyAdded).length >= 10, 'hani-study-v02984.js dark fix rule count');
});

test('every added selector is strictly scoped to midnight-black or titanium-graphite dark finishes', () => {
  for (const [label, block] of [
    ['hani-design-system.css', dsAdded],
    ['hani-study-v02984.js', studyAdded],
  ]) {
    const selectorLists = extractSelectorLists(block);
    assert.ok(selectorLists.length > 0, label + ' has selectors');
    for (const list of selectorLists) {
      for (const sel of splitTopLevelCommas(list)) {
        assert.match(
          sel,
          DARK_PREFIX_RE,
          `${label} selector leaked outside dark finishes: ${sel}`
        );
      }
    }
  }
});

test('Top 2, Top 3, Top 4, Top 5, Top 8, and Top 10 contrast target selectors are present', () => {
  const requiredDs = [
    // Top 2
    'body[data-finish-active] :is(.asset-dashboard-card',
    '.account-card .account-value',
    '#yunaTargetHelp',
    '#assetStats .stat:has(.asset-evaluation)',
    '#travel .module-kpi',
    '#travel :is(.travel-tabs',
    '#travelTripDetailModal',
    '#investment .invest-tabs',
    '#investmentIntake',
    '#study .study-main-empty',
    '#diary [data-diary-view]',
    '#home .home-cal-day',
    '#home .home-task-mini-item i',
    '.media-work-row',
    '.series-archive-v2',
    '.wishlist-review-state',
    '.sports-view-tabs',
    '.sports-home-logo',
    '.team-madrid',
    '#aura .tabs',
    '#aura :is(.aura-preview',
    '.date-mode-toggle',
    // Top 3
    '.sidebar-team-mini',
    '.sidebar-corporate-lockup',
    '.hani-brand-logo-frame',
    '.nav-home .nav-btn',
    '.dashboard-nav .ico',
    '.nav-btn.active .ico',
    '.season-frame-band',
    // Top 4
    ':root[data-finish="titanium-graphite"] #app #milestones > .ds-main-character-banner',
    '#milestones .ms-tier',
    '#agentReview .hani-office-live',
    '#agentReview .hani-building-tabs',
    '#ilbo :is(.ilbo-nameplate-illustrated',
    '#procrastination',
    // Top 5 (CSS stylesheets)
    '#intake :is(.yuna-desk',
    '#dev :is(.hani-development-snapshot',
    '#deployment :is(.deploy-exec-status',
    '#haniOrganizationHub :is(.ogh-person-image',
    // Top 8
    '.home-dialogue-shell',
    '#homeDialogueText',
    '.ds-agent-comment>div',
    '.ds-jieun>div',
    '.ledger-jieun-comment',
    '#ledgerJieunComment',
    // Top 10 contrast
    '.phase1-collapsible-form>summary em',
    '.wishlist-item-card details summary',
    '.media-work-identity span',
    '.media-work-row>details>summary',
    '#newsroom .newsroom-4cut-context td.is-up',
    '#newsroom .newsroom-4cut .newsroom-4cut-cuts b',
  ];
  for (const snippet of requiredDs) {
    assert.ok(dsAdded.includes(snippet), `Missing expected selector in hani-design-system.css: ${snippet}`);
  }

  const requiredStudy = [
    '#study.hani-study-v02984',
    '.study-chip',
    '.study-subtabs',
    '.study-card-v02984',
    '.study-project-row',
    '.study-main-empty',
    '.study-today-card',
    '.study-board',
    '.study-question',
    '.study-choice',
    '.study-submit-wrap',
    '.study-wrong-group',
    '.study-history-card',
    '.home-task-mini-item.learning-derived',
  ];
  for (const snippet of requiredStudy) {
    assert.ok(studyAdded.includes(snippet), `Missing expected selector in hani-study-v02984.js: ${snippet}`);
  }
});

test('uses existing design tokens without raw white/dark-ink hex leaks or out-of-scope edits', () => {
  const combined = dsAdded + '\n' + studyAdded;
  const bodies = [...combined.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]).join('\n');
  assert.doesNotMatch(bodies, /#[0-9a-fA-F]{3,8}\b/, 'no raw hardcoded hex colors in dark finish fix 1 declarations');
  assert.doesNotMatch(bodies, /\b(?:rgb|rgba)\(/i, 'no raw rgb/rgba colors in dark finish fix 1 declarations');
  for (const forbidden of [
    '.ds-page-hero',
    '.ogh-hero-copy',
    '.ogh-hero-art',
    'hani-remote',
    'brokerDashboardStats',
    'hani_os_life_v23',
    'localStorage',
    'supabase',
  ]) {
    assert.equal(combined.includes(forbidden), false, `Out-of-scope token found in dark finish fix 1: ${forbidden}`);
  }
  const withoutMilestones = dsAdded.replaceAll('#milestones > .ds-main-character-banner', '');
  assert.equal(
    withoutMilestones.includes('.ds-main-character-banner'),
    false,
    'Top 1 .ds-main-character-banner must remain untouched outside Top 4 milestones titanium-graphite'
  );
  assert.ok(dsAdded.includes('var(--surface-'), 'uses --surface-* tokens');
  assert.ok(dsAdded.includes('var(--text-'), 'uses --text-* tokens');
  assert.ok(dsAdded.includes('var(--border-'), 'uses --border-* tokens');
  assert.ok(dsAdded.includes('var(--structure-'), 'uses --structure-* tokens');
});

test('hani-study-v02984.js dark finish rules stay inside style() el.textContent only', () => {
  const beforeDark = studyJs.slice(0, studyStart);
  const styleFnIdx = beforeDark.lastIndexOf('function style()');
  assert.ok(styleFnIdx >= 0, 'dark CSS appears inside function style()');
  const afterDark = studyJs.slice(studyEnd, studyEnd + 64);
  assert.match(afterDark, /^`;\s+document\.head\.appendChild\(el\);/, 'style() closes cleanly right after dark CSS');
});

test('dark finish fix 2 keeps home dialogue background and text together in the same dark rule block', () => {
  const dsFix2Marker = '/* dark finish fix 2 */';
  assert.ok(dsAdded.includes(dsFix2Marker), 'hani-design-system.css contains dark finish fix 2 marker');

  const rules = [...dsAdded.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)];
  for (const target of ['#homeDialogueText', '.home-dialogue-line', '.home-dialogue-speaker']) {
    const matchingRules = rules.filter(([, sel]) =>
      splitTopLevelCommas(sel).some((part) => DARK_PREFIX_RE.test(part) && part.includes(target))
    );
    assert.ok(matchingRules.length > 0, `dark rule exists for ${target}`);
    const hasPairedBgAndColor = matchingRules.some(
      ([, , body]) => /\bbackground\s*:/.test(body) && /\bcolor\s*:/.test(body)
    );
    assert.ok(
      hasPairedBgAndColor,
      `${target} must set both background and color together in the same dark declaration block`
    );
  }
  assert.ok(dsAdded.includes('.home-dialogue-line b'), 'dark rule styles .home-dialogue-line b');
  assert.ok(dsAdded.includes('.home-dialogue-line span'), 'dark rule styles .home-dialogue-line span');
});

test('dark finish fix 2 covers intake, investment, sidebar logo, high-specificity #app resets, and after/ regressions', () => {
  const dsFix2Idx = dsAdded.indexOf('/* dark finish fix 2 */');
  assert.ok(dsFix2Idx > 0, 'dark finish fix 2 block exists after fix 1');
  const dsFix2 = dsAdded.slice(dsFix2Idx);

  for (const snippet of [
    'body[data-finish-active] #app :is(.asset-dashboard-card',
    'body[data-finish-active] #app :is(#asset,#investment) .stat',
    '#app #intake .yuna-desk #yunaTargetHelp',
    '.yuna-welcome>div:last-child',
    '#app #intake .yuna-status',
    '.yuna-chips button.is-active',
    '.investment-tabs-main',
    '.investment-overview-tabs',
    '.investment-live',
    '.page-nav-context-v02992',
    '#app #investment .pill',
    '#sidebar .hani-brand-logo-frame>img',
    'mix-blend-mode:screen',
    '#app #asset #assetStats .stat:has(.asset-evaluation)',
    '--pb-bubble:var(--surface-panel)',
    '#app #procrastination .pb-speech',
    '#app #newsroom .newsroom-4cut-context td.is-down',
    '#app #aura .aura-preview',
    '#app #aura .tab.active',
    '#app #deployment .deploy-exec-copy',
    '#app #dev .hani-history-list .hani-history-row',
    '#app #travel .module-kpi :is(small,.sub)',
    '#app #game .sports-home-panel.team-madrid',
    '.phase1-collapsible-form>summary em',
    '#app #wishlist :is(.wishlist-kpis>div',
    '#app .date-mode-toggle',
  ]) {
    assert.ok(dsAdded.includes(snippet), `Missing fix 2 selector or token snippet: ${snippet}`);
  }
  assert.ok(extractSelectorLists(dsFix2).length >= 25, 'dark finish fix 2 has expected rule count');
});
