"""Pack approved decoded RGBA strips without resizing or alpha blending."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = root.parent / 'xmas-art/artifacts/office-xmas'
rows = [('tree', 'christmas-tree.webp', 0, 0, 112, 136, 4),
        ('snow', 'window-snow.webp', 0, 140, 88, 112, 4),
        ('wreath', 'wall-wreath.webp', 0, 256, 76, 76, 1),
        ('gifts', 'gift-boxes.webp', 80, 256, 80, 60, 1),
        ('lights', 'rooftop-lights.webp', 0, 336, 384, 64, 4)]
atlas = Image.new('RGBA', (1536, 400), (0, 0, 0, 0))
checks = []
for name, filename, x, y, w, h, count in rows:
    image = Image.open(source / filename).convert('RGBA')
    assert image.size == (w * count, h)
    atlas.paste(image, (x, y))
    checks.append(dict(id=name, file=filename, rect=[x, y, w, h], frames=count,
                       rgbaSha256=hashlib.sha256(image.tobytes()).hexdigest()))
target = root / 'assets/office-season/xmas.webp'
target.parent.mkdir(parents=True, exist_ok=True)
atlas.save(target, 'WEBP', lossless=True, exact=True, method=6)
decoded = Image.open(target).convert('RGBA')
assert decoded.tobytes() == atlas.tobytes()
for row in checks:
    x, y, w, h = row['rect']
    pixels = decoded.crop((x, y, x + w * row['frames'], y + h)).tobytes()
    assert hashlib.sha256(pixels).hexdigest() == row['rgbaSha256']
result = dict(size=list(atlas.size), bytes=target.stat().st_size,
              sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
              lossless=True, resampled=False, copiedPixelsEqual=True,
              limitBytes=120_000, limitPassed=target.stat().st_size < 120_000, strips=checks)
(root / 'artifacts/office-xmas-live/atlas-check.json').write_text(
    json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, ensure_ascii=False))
assert target.stat().st_size < 120_000
