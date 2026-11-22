import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Every published 4-cut draws the "정보 정리용이며 투자 권유가 아닙니다." notice inside the art
// (docs/drafts/newsroom-4cut-composition-guide.md), so the text footnote under the image must hide
// for every 3-digit issue image, not only 001/002 (3호 showed the notice twice before this fix).
const src = fs.readFileSync(new URL('../hani-newsroom-4cut.js', import.meta.url), 'utf8');

test('footnote hides for every published 3-digit 4-cut image', () => {
  const m = src.match(/q\(selector\)\.hidden = (\/[^/]+\/)\.test\(issue\.image\);/);
  assert.ok(m, 'footnote hide rule exists');
  const re = new Function('return ' + m[1])();
  for (const id of ['001', '002', '003', '004', '052']) assert.equal(re.test(id), true, id);
  for (const id of ['', '3', 'custom-art', '0031']) assert.equal(re.test(id), false, id);
});

test('issues catalog images are all 3-digit ids', () => {
  const cat = JSON.parse(fs.readFileSync(new URL('../assets/data/newsroom-4cut/issues.json', import.meta.url), 'utf8'));
  for (const issue of cat.issues) assert.match(issue.image, /^\d{3}$/, 'issue ' + issue.number);
});
