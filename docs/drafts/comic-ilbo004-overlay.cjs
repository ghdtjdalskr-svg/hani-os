// Overlays Korean text on the empty-balloon comic and writes assets/hani-ilbo/004-comic.webp + a PNG preview.
const sharp = require('C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('node:fs');
const boxes = JSON.parse(fs.readFileSync('docs/drafts/comic-ilbo004-boxes-v2.json', 'utf8'));
const draft = JSON.parse(fs.readFileSync('docs/drafts/hani-ilbo-004-draft.json', 'utf8'));
const lines = [
  '조용한 밤엔 원두 향이 더 잘 느껴져요…', '(새근새근)… 멍',
  '아침까지 카페는 제가 지킬게요… 쿠울…',
  '밤 카페가 참 포근하네.', '어서 와요! 큰 꼬리로 인사할게요, 멍!',
  '앗, 회장님! 졸지 않았어요… 커피 드릴게요!',
  '하하, 고마워요. 따뜻한 걸로 한 잔 부탁해요.', '디카페인도 따뜻하게 준비해 둘게요!',
  '급하지 않아요. 잠깐 쉬었다 가세요.', '관심은 없지만 곁에 있을게요, 야옹.'
];
const FONT = "'Malgun Gothic','맑은 고딕',sans-serif";
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const w = ch => /[\s]/.test(ch) ? 0.32 : /[.,!?…()~'"]/.test(ch) ? 0.42 : /[A-Za-z0-9]/.test(ch) ? 0.58 : 1;
const width = (s, size) => [...s].reduce((a, c) => a + w(c), 0) * size;
function wrap(text, size, maxW) {
  const words = text.split(' '), out = []; let cur = '';
  for (const word of words) {
    const t = cur ? cur + ' ' + word : word;
    if (width(t, size) <= maxW || !cur) cur = t; else { out.push(cur); cur = word; }
  }
  if (cur) out.push(cur);
  return out;
}
function fit(text, [x1, y1, x2, y2], max = 40, min = 22) {
  const bw = x2 - x1, bh = y2 - y1;
  for (let size = max; size >= min; size--) {
    const ls = wrap(text, size, bw);
    if (ls.every(l => width(l, size) <= bw) && ls.length * size * 1.3 <= bh) return { size, ls };
  }
  throw new Error('does not fit: ' + text);
}
function block(text, box, color, weight, max, min) {
  const { size, ls } = fit(text, box, max, min);
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2, lh = size * 1.3;
  const top = cy - (ls.length * lh) / 2 + lh * 0.78;
  return ls.map((l, i) => `<text x="${cx}" y="${(top + i * lh).toFixed(1)}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle" font-family="${FONT}">${esc(l)}</text>`).join('');
}
let svg = `<svg width="1600" height="2400" xmlns="http://www.w3.org/2000/svg">`;
svg += block(draft.comic.title, boxes.title_band.text_box, '#ffffff', 700, 46, 30);
boxes.balloons.forEach((b, i) => { svg += block(lines[i], b.text_box, '#2f2546', 700, 40, 22); });
let ci = 0;
for (const row of boxes.caption_bands) for (const c of row.cells) svg += block(draft.comic.captions[ci++], c.text_box, '#4a3a6b', 600, 27, 18);
svg += '</svg>';
(async () => {
  const img = sharp('assets/comic-trial/hani-ilbo-004-v2.png').composite([{ input: Buffer.from(svg), left: 0, top: 0 }]);
  const png = await img.png().toBuffer();
  fs.writeFileSync('assets/comic-trial/hani-ilbo-004-lettered.png', png);
  await sharp(png).webp({ quality: 82 }).toFile('assets/hani-ilbo/004-comic.webp');
  console.log('ok', fs.statSync('assets/hani-ilbo/004-comic.webp').size, fs.statSync('assets/hani-ilbo/003-comic.webp').size);
})().catch(e => { console.error(e); process.exitCode = 1; });
