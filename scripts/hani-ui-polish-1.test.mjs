import './hani-menu-badges-preload.cjs'; // Exact menu badge inverse before historical readers.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function relativeLuminance(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const channels = [0, 2, 4].map(i => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

test('UI Polish 1: dashboard keeps 168px banner and applies Pilot 2 layout without font-size edits', () => {
  const css = read('hani-design-system.css');
  const marker = 'UI Polish 1 (11/15, 11/17, 11/20)';
  const idx = css.indexOf(marker);
  assert.ok(idx !== -1, 'UI Polish 1 block must exist in hani-design-system.css');
  const patch = css.slice(idx);

  assert.match(patch, /#app #home>\.ds-main-character-banner\{order:-30;min-height:168px;height:168px/);
  assert.match(patch, /#app #home \.home-planner-card\{order:-28\}/);
  assert.match(patch, /#app #home>\.home-dialogue-shell\{order:-27\}/);
  assert.match(patch, /#app #home \.sh h3::before/);
  assert.doesNotMatch(patch, /font-size\s*:/, 'UI Polish 1 must not add font-size declarations');
});

test('UI Polish 1: numeric/command views get 120px compact banner while #home, world views, and #investmentIntake stay excluded', () => {
  const css = read('hani-design-system.css');
  const patch = css.slice(css.indexOf('UI Polish 1 (11/15, 11/17, 11/20)'));

  const compactMatch = patch.match(/#app :is\(([^)]+)\)>\.ds-main-character-banner\s*\{\s*min-height:120px/);
  assert.ok(compactMatch, '120px banner rule must exist');
  const scopedIds = compactMatch[1].split(',').map(s => s.trim());

  for (const id of ['#investment', '#investmentCommittee', '#ledger', '#newsroom', '#monthlyReport', '#diet', '#exercise', '#study', '#university', '#certificate', '#tasks', '#calendar', '#drive', '#aiWork', '#aiBudget', '#geminiReports', '#dev', '#settings']) {
    assert.ok(scopedIds.includes(id), `${id} should be included in 120px banner rule`);
  }
  for (const excluded of ['#home', '#asset', '#intake', '#investmentIntake', '#deployment', '#loginGate', '#organization', '#board', '#ilbo', '#milestones', '#game', '#aura', '#reading', '#movie', '#travel', '#wishlist', '#diary', '#procrastination']) {
    assert.ok(!scopedIds.includes(excluded), `${excluded} must NOT be in 120px banner rule`);
  }
  assert.match(patch, />\.ds-main-character-banner \.ds-main-character-banner__description\{\s*display:none\s*\}/);
});

test('UI Polish 1: primary buttons unify to --structure-accent / --structure-on-accent with AA >= 4.5 across 6 finishes', () => {
  const css = read('hani-design-system.css');
  const patch = css.slice(css.indexOf('UI Polish 1 (11/15, 11/17, 11/20)'));

  assert.match(patch, /:not\(#investmentIntake\):not\(#deployment\) :is\(\.btn\.primary,\.btn\.finance,\.btn\.health\)/);
  assert.match(patch, /background:var\(--structure-accent\)!important;\s*color:var\(--structure-on-accent\)!important/);

  const finishes = [
    ['porcelain-cream', '#79674c', '#ffffff'],
    ['pure-white', '#7562d9', '#ffffff'],
    ['midnight-black', '#c0b6a5', '#111318'],
    ['titanium-graphite', '#b7b2a6', '#292b2f'],
    ['sakura-pink', '#98647c', '#ffffff'],
    ['alpine-blue', '#537994', '#ffffff'],
  ];
  for (const [name, accent, onAccent] of finishes) {
    assert.ok(css.includes(`[data-finish="${name}"]`), `finish ${name} must exist in CSS`);
    assert.ok(css.includes(`--structure-accent:${accent}`), `${name} --structure-accent=${accent}`);
    assert.ok(contrastRatio(accent, onAccent) >= 4.5, `${name} button contrast must be >= 4.5:1`);
  }
});

test('UI Polish 1: dark finish #investment, #organization, #haniContextRemote, and mobile #home fixes exist without storage writes', () => {
  const css = read('hani-design-system.css');
  const patch = css.slice(css.indexOf('UI Polish 1 (11/15, 11/17, 11/20)'));
  const remoteJs = read('hani-context-remote-v1.js');

  // Only the 3 KPI cells duplicated by the top summary are hidden; 전월 대비·보유 종목·기록 월 stay visible.
  assert.match(patch, /#app #investment #brokerDashboardStats>\.broker-kpi:is\(:nth-child\(1\),:nth-child\(3\),:nth-child\(4\)\)\{display:none!important\}/);
  assert.doesNotMatch(patch, /#brokerDashboardStats\{display:none/);
  // Organization hero was already fixed before this patch; leave it untouched.
  assert.doesNotMatch(patch, /#organization/);
  // The 4 round remote buttons must never be hidden.
  assert.doesNotMatch(patch, /data-remote-action="(primary|yuna|agent|recent)"\][^{]*\{\s*display:none/);
  assert.match(patch, /#app #haniContextRemote \.hani-remote-utility\{order:99;margin-top:auto\}/);
  assert.match(patch, /#app #haniContextRemote \.hani-remote-today ul>li:nth-child\(n\+4\)\{display:none\}/);
  assert.ok(remoteJs.includes('화면 바로가기'), 'context remote heading must remain localized');
  assert.match(patch, /#app #home :is\(\.card,\.home-kpi,\[data-life-index\],\.home-index-card,\.home-update-item/);
  assert.doesNotMatch(patch, /localStorage/);
});
