// Deterministic CI resizing only; no generated artwork or modification of the source.
// node scripts/hani-pwa-icons-213.mjs <sharp module entry>
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {default: sharp} = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'assets/pwa');
await fs.mkdir(out, {recursive: true});
// The flower emblem of the original 1774x887 CI; the wordmark remains in the original.
const pixels = await sharp(path.join(root, 'assets/brand/hani-group-ci-official.webp'))
  .extract({left: 630, top: 75, width: 515, height: 515}).raw().toBuffer();
// Remove near-white WebP background noise before downsampling/compression.
for (let i = 0; i < pixels.length; i += 3) {
  if (pixels[i] > 245 && pixels[i+1] > 245 && pixels[i+2] > 245) pixels.fill(255, i, i+3);
}
const emblem = await sharp(pixels, {raw: {width: 515, height: 515, channels: 3}}).png().toBuffer();
for (const [name, size, ratio] of [
  ['icon-192.png', 192, .78], ['icon-512.png', 512, .78],
  // Every emblem pixel is inside the central 56% square (diagonal < 80% safe circle).
  ['icon-512-maskable.png', 512, .56], ['apple-touch-icon.png', 180, .78]
]) {
  const width = Math.round(size * ratio);
  const mark = await sharp(emblem).resize(width, width).toBuffer();
  const file = path.join(out, name);
  await sharp({create: {width: size, height: size, channels: 3, background: '#ffffff'}})
    .composite([{input: mark, left: Math.floor((size-width)/2), top: Math.floor((size-width)/2)}])
    .png({palette: true, colours: 64, dither: 0, compressionLevel: 9, effort: 10}).toFile(file);
  console.log(`${name}: ${(await fs.stat(file)).size} bytes`);
}
