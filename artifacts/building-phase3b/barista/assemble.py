"""Deterministic crop/resize/packing of image_gen artwork; no drawn replacement art."""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json, hashlib, io
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / 'kidstoon/tmp/pylibs'))
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
source = Image.open(OUT / 'generated-source.png').convert('RGBA')
assert source.size == (1536, 1024)
atlas = Image.new('RGBA', (768,768))
frames = []
spec = [('standing',0,0,0,0),('standing-b',1,0,1,0),
        ('standing',0,1,0,1),('dozing',1,1,1,1),('startled',2,1,2,1)]
boxes=[]
for name,sx,sy,col,row in spec:
    cell=source.crop((sx*512,sy*512,(sx+1)*512,(sy+1)*512))
    # Ignore only the faint generation halo in bounding-box detection.
    box=cell.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
    assert box
    boxes.append(box)
standing_heights=[boxes[i][3]-boxes[i][1] for i in (0,2)]
for i,((name,sx,sy,col,row),box) in enumerate(zip(spec,boxes)):
    im=source.crop((sx*512+box[0],sy*512+box[1],sx*512+box[2],sy*512+box[3]))
    scale=120/standing_heights[0 if row==0 else 1]
    im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    # Remove subvisible haze; retain antialiased character alpha.
    im.putalpha(im.getchannel('A').point(lambda a:0 if a<8 else a))
    x=48-im.width//2; y=135-im.height
    assert 0<=x and x+im.width<=96 and y>=0
    atlas.alpha_composite(im,(col*96+x,row*144+y))
    frames.append({'name':name,'rect':[col*96,row*144,96,144], 'pivot':[48,135],
        'contentRect':[x,y,im.width,im.height],
        'sourceRect':[sx*512+box[0],sy*512+box[1],box[2]-box[0],box[3]-box[1]]})

buf=io.BytesIO(); atlas.save(buf,format='WEBP',lossless=True,method=6)
encoding='lossless'
if len(buf.getvalue())>50000:
    for quality in (95,90,85,80):
        buf=io.BytesIO(); atlas.save(buf,format='WEBP',quality=quality,method=6)
        encoding=f'lossy quality={quality}, lossless alpha'
        if len(buf.getvalue())<=50000:break
data=buf.getvalue(); assert len(data)<=50000
(OUT/'npc-barista-v1.webp').write_bytes(data)
decoded=Image.open(io.BytesIO(data)).convert('RGBA'); assert decoded.size==(768,768)
allow=Image.new('L',(768,768)); ad=ImageDraw.Draw(allow)
for f in frames:
    x,y,w,h=f['rect'];ad.rectangle((x,y,x+w-1,y+h-1),fill=255)
alpha=decoded.getchannel('A')
from PIL import ImageChops
assert ImageChops.multiply(alpha,ImageChops.invert(allow)).getbbox() is None
for f in frames:
    x,y,w,h=f['rect']; box=decoded.crop((x,y,x+w,y+h)).getbbox()
    assert box
    f['contentRect']=[box[0],box[1],box[2]-box[0],box[3]-box[1]]
    assert box[3]==135
    assert box[0]>0 and box[2]<96 and box[1]>0

foot=[1552,748]
sha=hashlib.sha256(data).hexdigest()
entries=[]
for who,title,ff in [('iseul','이슬',frames[:2]),('eunha','은하',frames[2:])]:
    entries.append({'id':'npc-barista-'+who,'name':title,'kind':'npc','planned':False,
      'file':'npc-barista-v1.webp','sizeBytes':len(data),'sha256':sha,
      'sourceSha256':hashlib.sha256((OUT/'generated-source.png').read_bytes()).hexdigest(),
      'identityReference':'../building/floor-1f-217.webp' if who=='iseul' else '../office-season/barista-night.webp',
      'atlas':[768,768],'cell':[96,144],'direction':'front','frames':ff,
      'proposedFootPx':foot,'placementBackground':'assets/building/floor-1f-v2.webp',
      'placementNote':'배경 원본 크기 1:1, 계산대 뒤. y=704부터 계산대 전경으로 하반신을 가려야 함.'})
(OUT/'frames.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

font=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',13)
small=ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',11)
def checker(size):
    im=Image.new('RGBA',size,'#f0ece5'); d=ImageDraw.Draw(im)
    for yy in range(0,size[1],8):
        for xx in range(0,size[0],8):
            if (xx//8+yy//8)%2:d.rectangle((xx,yy,xx+7,yy+7),fill='#dedbd5')
    return im
compare=Image.new('RGBA',(736,392),'#f8f5ef'); d=ImageDraw.Draw(compare)
d.text((16,10),'기존 인물 참조 · 원본 1:1',font=font,fill='#302b28')
d.text((408,10),'신규 5칸 · 원본 1:1 (96×144)',font=font,fill='#302b28')
d.line((392,8,392,384),fill='#bbb3aa')
old=Image.open(ROOT/'assets/building/floor-1f-217.webp').convert('RGBA')
compare.alpha_composite(old.crop((1528,644,1592,716)),(20,60))
d.text((96,70),'이슬: 갈색 단발 / 크림 모자',font=small,fill='#302b28')
d.text((96,91),'초록 앞치마',font=small,fill='#302b28')
night=Image.open(ROOT/'assets/office-season/barista-night.webp').convert('RGBA')
assert night.size==(360,110)
compare.alpha_composite(night,(16,220))
d.text((16,340),'은하: standing / dozing / startled',font=small,fill='#302b28')
for i,f in enumerate(frames):
    xx=408+(i if i<2 else i-2)*100; yy=45 if i<2 else 224
    tile=checker((96,144)); x,y,w,h=f['rect']
    tile.alpha_composite(decoded.crop((x,y,x+w,y+h)))
    compare.alpha_composite(tile,(xx,yy))
    d.text((xx,yy-16),('이슬 ' if i<2 else '은하 ')+f['name'],font=small,fill='#302b28')
compare.convert('RGB').save(OUT/'compare.png')

bg=Image.open(ROOT/'assets/building/floor-1f-v2.webp').convert('RGBA')
assert bg.size==(1672,941)
composite=bg.copy(); sprite=decoded.crop((0,0,96,144))
sprite_layer=Image.new('RGBA',bg.size)
sprite_layer.alpha_composite(sprite,(foot[0]-48,foot[1]-135))
# Composite with counter occlusion; no background or character artwork is repainted.
mask=Image.new('L',bg.size,255)
ImageDraw.Draw(mask).rectangle((0,704,bg.width,bg.height),fill=0)
sprite_layer.putalpha(ImageChops.multiply(sprite_layer.getchannel('A'),mask))
composite.alpha_composite(sprite_layer)
composite.crop((1432,550,1672,804)).convert('RGB').save(OUT/'overlay.png')
composite.convert('RGB').save(OUT/'overlay-full.png')
# Enlarged review helper, separately named; required compare.png stays native 1:1.
decoded.crop((0,0,288,288)).resize((864,864),Image.Resampling.NEAREST).save(OUT/'sprites-review-3x.png')
checks={'atlas':[768,768],'cell':[96,144],'pivot':[48,135],'sizeBytes':len(data),'sha256':sha,
  'encoding':encoding,'frameCount':len(frames),'unusedCellsFullyTransparent':True,
  'frameBoundsWithinCells':True,'footBaselineExclusiveY':135,'proposedFootPx':foot,
  'overlayCropPx':[1432,550,240,254],'overlayScale':1,'foregroundOcclusionStartY':704,
  'contentRects':[f['contentRect'] for f in frames],
  'runtimeIntegration':'not performed; asset-only handoff','gitAndEdgeUsed':False}
(OUT/'validation.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(checks,ensure_ascii=False))
