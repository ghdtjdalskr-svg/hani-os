import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSS_PATH = path.resolve(__dirname, '..', 'hani-design-system.css');
const css = fs.readFileSync(CSS_PATH, 'utf8');

const LIGHT_FIX_MARKER = '/* light finish fix 1 */';
const LIGHT_PREFIX = ':root:not([data-finish="midnight-black"]):not([data-finish="titanium-graphite"])';

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitTopLevelCommas(selectorText) {
  const parts = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let quote = null;
  let start = 0;

  for (let i = 0; i < selectorText.length; i += 1) {
    const ch = selectorText[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '(') {
      parenDepth += 1;
    } else if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (ch === '[') {
      bracketDepth += 1;
    } else if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
      const part = selectorText.slice(start, i).trim();
      if (part) parts.push(part);
      start = i + 1;
    }
  }

  const tail = selectorText.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function findMatchingBrace(text, openIdx) {
  let depth = 0;
  let quote = null;
  for (let i = openIdx; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
      if (depth < 0) return -1;
    }
  }
  return -1;
}

function checkBalancedBraces(text) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth < 0) return { balanced: false, depth };
    }
  }
  return { balanced: depth === 0, depth };
}

function extractStyleRules(blockText, rules = []) {
  let pos = 0;
  while (pos < blockText.length) {
    const openIdx = blockText.indexOf('{', pos);
    if (openIdx === -1) break;
    const header = blockText.slice(pos, openIdx).trim();
    const closeIdx = findMatchingBrace(blockText, openIdx);
    if (closeIdx === -1) {
      throw new Error(`Unmatched '{' near: ${header.slice(0, 80)}`);
    }
    const inner = blockText.slice(openIdx + 1, closeIdx);
    if (/^@(media|supports|layer|container)\b/i.test(header)) {
      extractStyleRules(inner, rules);
    } else if (header) {
      rules.push({ selector: header, body: inner });
    }
    pos = closeIdx + 1;
  }
  return rules;
}

test('light finish fix 1 section exists after existing dark finish sections and has balanced braces', () => {
  const lightStart = css.indexOf(LIGHT_FIX_MARKER);
  assert.ok(lightStart !== -1, 'Expected /* light finish fix 1 */ section marker in hani-design-system.css');

  for (const darkMarker of ['/* dark finish fix 1 */', '/* dark finish fix 2 */', 'hero banner dark finish']) {
    const darkIdx = css.indexOf(darkMarker);
    assert.ok(darkIdx !== -1, `Expected existing dark finish marker to remain intact: ${darkMarker}`);
    assert.ok(darkIdx < lightStart, `Expected ${darkMarker} to appear before ${LIGHT_FIX_MARKER}`);
  }

  const lightSection = css.slice(lightStart);
  const stripped = stripCssComments(lightSection);
  const balance = checkBalancedBraces(stripped);
  assert.equal(balance.balanced, true, `Unbalanced braces in light finish fix 1 (final depth: ${balance.depth})`);
});

test('all selectors in light finish fix 1 are strictly gated away from dark finishes', () => {
  const lightStart = css.indexOf(LIGHT_FIX_MARKER);
  assert.ok(lightStart !== -1);
  const stripped = stripCssComments(css.slice(lightStart));
  const rules = extractStyleRules(stripped);
  assert.ok(rules.length > 0, 'Expected at least one CSS rule inside light finish fix 1');

  for (const rule of rules) {
    const selectors = splitTopLevelCommas(rule.selector);
    assert.ok(selectors.length > 0, `Empty selector list in rule: ${rule.selector}`);
    for (const sel of selectors) {
      assert.ok(
        sel.startsWith(LIGHT_PREFIX),
        `Selector must be gated by ${LIGHT_PREFIX} to prevent dark-finish regression: ${sel}`
      );
      const withoutPrefix = sel.slice(LIGHT_PREFIX.length);
      assert.ok(
        !withoutPrefix.includes('midnight-black') && !withoutPrefix.includes('titanium-graphite'),
        `Selector must not reference dark finishes outside the :not(...) guard: ${sel}`
      );
    }
  }
});

test('light finish fix 1 declarations use design tokens without hardcoded hex or rgb/rgba colors', () => {
  const lightStart = css.indexOf(LIGHT_FIX_MARKER);
  assert.ok(lightStart !== -1);
  const stripped = stripCssComments(css.slice(lightStart));
  const rules = extractStyleRules(stripped);

  for (const rule of rules) {
    const hexMatch = rule.body.match(/#[0-9a-fA-F]{3,8}\b/);
    assert.equal(
      hexMatch,
      null,
      `Hardcoded hex color ${hexMatch?.[0]} found in declaration body for ${rule.selector}`
    );
    const rgbMatch = rule.body.match(/\brgba?\s*\(/i);
    assert.equal(
      rgbMatch,
      null,
      `Hardcoded rgb/rgba color ${rgbMatch?.[0]} found in declaration body for ${rule.selector}`
    );
  }
});

test('light finish fix 1 covers required L1-L4 selectors without touching storage/runtime symbols', () => {
  const lightStart = css.indexOf(LIGHT_FIX_MARKER);
  assert.ok(lightStart !== -1);
  const lightSection = css.slice(lightStart);

  for (const forbidden of ['hani_os_life_v23', 'localStorage', 'supabase']) {
    assert.equal(lightSection.includes(forbidden), false, `Unexpected token in CSS patch: ${forbidden}`);
  }

  const requiredSelectors = [
    '#study.hani-study-v02984',
    '#agentReview',
    '#haniOrganizationHub',
    '#investmentCommittee',
    '#travel',
    '#intake.yuna-helpdesk',
    '#dev',
    '#movie',
    '#board',
    '#launchGreetingEnabled',
    '#dietStats .stat:nth-child(5)',
    '.pill:not(',
    '.campus-semester-status',
    '#milestones>.ds-main-character-banner',
    '.ilbo-nameplate-illustrated',
    '.aura-preview',
    '#homeDialogueText',
    '.sidebar-corporate-lockup',
    '#ledgerJieunEdit',
    '#procrastination',
    '#app .footer',
    '#monthlyReport',
    '#diet .stats',
    '#geminiReports',
  ];

  for (const token of requiredSelectors) {
    assert.ok(lightSection.includes(token), `Missing expected L1-L4 selector token: ${token}`);
  }
});

function stripNotPseudo(selectorText) {
  let out = '';
  let i = 0;
  while (i < selectorText.length) {
    if (selectorText.slice(i, i + 5) === ':not(') {
      let depth = 1;
      i += 5;
      while (i < selectorText.length && depth > 0) {
        if (selectorText[i] === '(') depth += 1;
        else if (selectorText[i] === ')') depth -= 1;
        i += 1;
      }
      continue;
    }
    out += selectorText[i];
    i += 1;
  }
  return out;
}

test('light finish fix 1 removes Deployment Center, protected views, primary buttons, and #home Pilot 2 conflicts', () => {
  const lightStart = css.indexOf(LIGHT_FIX_MARKER);
  assert.ok(lightStart !== -1);
  const lightSection = css.slice(lightStart);

  for (const removed of [
    '/* L1 - Deployment Center */',
    '.btn.finance',
    '.deploy-btn.primary',
    '.deploy-exec-status',
    '.deploy-inbox-summary',
    '.home-dialogue-shell',
  ]) {
    assert.equal(lightSection.includes(removed), false, `Removed rule token must not remain in light finish fix 1: ${removed}`);
  }

  const stripped = stripCssComments(lightSection);
  const rules = extractStyleRules(stripped);
  const forbiddenOutsideNot = [
    '#deployment',
    '#deploymentQueueModal',
    '.deploy-',
    '#investmentIntake',
    '#loginGate',
    '#group-backup',
    '#group-cloud',
    '#cloudBridgeCard',
    '#cloudChoice',
    '#cloudAdvanced',
    '#cloudEmergency',
    '#loadRecovery',
    '#safetyArchive',
    '.btn.primary',
    '.btn.finance',
    '.btn.health',
    '.home-dialogue-shell',
  ];

  for (const rule of rules) {
    for (const sel of splitTopLevelCommas(rule.selector)) {
      const targetPart = stripNotPseudo(sel);
      for (const forbidden of forbiddenOutsideNot) {
        assert.equal(
          targetPart.includes(forbidden),
          false,
          `Selector must not target protected/overridden token (${forbidden}): ${sel}`
        );
      }
    }
  }
});
