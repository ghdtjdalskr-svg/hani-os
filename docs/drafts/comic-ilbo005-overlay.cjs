// Overlays Korean text on the empty-balloon comic and writes assets/hani-ilbo/005-comic.webp + a PNG preview.
const sharp = require('C:/Users/홍성민/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('node:fs');
const boxes = JSON.parse(fs.readFileSync('docs/drafts/comic-ilbo005-boxes.json', 'utf8'));
const draft = JSON.parse(fs.readFileSync('docs/drafts/hani-ilbo-005-draft.json', 'utf8').replace(/^\uFEFF/, ''));
const lines = [
  '유나 선배님, 1층 잘 부탁드려요!', '저는 1층에서 손님 맞을게요! 파이팅!',
  '멍! 길 안내는 제게 맡겨요!', '하하, 보리가 길 안내를 자청했네.',
  '보리야… 엘리베이터 이쪽 맞죠…?',
  '어라?! 거긴 오늘부터 제 자리인데요?!', '보리가 1층이 제일 익숙한가 봐요…',
  '이번엔 제가 4층까지 모셔다드릴게요.', '어서 와요, 책상 자리 비워 뒀어요.',
  '비서실 새 자리 입주 완료!♡', '확인 완료! 이사도 무사히 닫아둘게요.'
];
if (lines.length !== boxes.balloons.length) throw new Error('balloon count');
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
svg += block(draft.comic.title, boxes.titleBand.textBox, '#ffffff', 700, 46, 28);
boxes.balloons.forEach((b, i) => { svg += block(lines[i], b.textBox, '#2f2546', 700, 38, 20); });
for (const row of boxes.captionBands) for (const c of row.cells) svg += block(draft.comic.captions[c.captionIndex], c.textBox, '#4a3a6b', 600, 27, 16);
svg += '</svg>';
(async () => {
  const png = await sharp('assets/comic-trial/hani-ilbo-005-v1.png').composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).png().toBuffer();
  fs.writeFileSync('assets/comic-trial/hani-ilbo-005-lettered.png', png);
  await sharp(png).webp({ quality: 82 }).toFile('assets/hani-ilbo/005-comic.webp');
  fs.writeFileSync('docs/drafts/comic-ilbo005-lines.json', JSON.stringify(lines, null, 2));
  console.log('ok', fs.statSync('assets/hani-ilbo/005-comic.webp').size, fs.statSync('assets/hani-ilbo/004-comic.webp').size);
})().catch(e => { console.error(e); process.exitCode = 1; });
