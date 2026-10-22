// Only the two approved desk-mascot connections are removed for legacy whole-index checks.
import assert from 'node:assert/strict';
export function withoutDeskMascots(html) {
  for (const line of [
    '<link rel="stylesheet" href="./hani-desk-mascots.css">',
    '<script src="./hani-desk-mascots.js" defer></script>'
  ]) {
    assert.equal(html.split(line).length - 1, 1, 'one canonical connection: ' + line);
    html = html.replace(new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\r?\\n'), '');
  }
  return html;
}
