// Test-only exact inverse. Runtime/callback tests must keep reading the raw server.
const assert = require('node:assert/strict');
const fixture = require('./fixtures/server-owner-guard/calendar-owner-additions.json');

function calendarBeforeOwnerGuard(source) {
  assert.equal(typeof source, 'string', 'Calendar inverse requires source text');
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  let restored = source;
  for (const { name, before, after } of fixture.edits) {
    const added = after.replaceAll('\n', eol);
    const original = before.replaceAll('\n', eol);
    const start = restored.indexOf(added);
    assert.ok(start >= 0, `Calendar inverse: missing exact ${name}`);
    assert.equal(restored.indexOf(added, start + 1), -1, `Calendar inverse: duplicate ${name}`);
    restored = restored.slice(0, start) + original + restored.slice(start + added.length);
  }
  return restored;
}

module.exports = { calendarBeforeOwnerGuard };
