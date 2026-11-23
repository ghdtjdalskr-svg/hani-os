"""Deterministic packing of image_gen art. Python standard library + local FFmpeg.
No Git, Edge, network, runtime code writes, or existing sprite overwrites.
"""
import hashlib,json,shutil,struct,subprocess,zlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
ASSETS=ROOT/'assets/sprites-v3'
DEST=ASSETS/'npc-guide-v1.webp'
SOURCE=HERE/'source.png'
FFMPEG=r'C:\Program Files\TheDeepDarkVideoManager_Falcon_v3\ffmpeg-lgpl-builds-x64\ffmpeg.exe'
ORIGINAL=Path(r'C:\Users\홍성민\.codex-2\generated_images\01a20a85-2d7f-73d0-961b-57723a6ce09c\exec-2dfff5b1-a2eb-447b-a913-678dfe3578f2.png')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args,data=None):
    p=subprocess.run([FFMPEG,'-v','error','-threads','1',*args],input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=40,creationflags=0x08000000)
    assert not p.returncode,p.stderr.decode('utf-8',errors='replace')
    return p.stdout
def decode(path,w,h):
    b=run(['-i',str(path),'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'])
    assert len(b)==w*h*4,(path,len(b),w,h)
    return b
def bbox(b,w,h,threshold=0):
    l,t,r,d=w,h,-1,-1
    for y in range(h):
        for x in range(w):
            if b[(y*w+x)*4+3]>threshold:l=min(l,x);t=min(t,y);r=max(r,x);d=max(d,y)
    return None if r<0 else [l,t,r-l+1,d-t+1]
def crop(b,w,rect):
    x,y,cw,ch=rect
    return b''.join(b[((y+j)*w+x)*4:((y+j)*w+x+cw)*4] for j in range(ch))
def paste(dest,dw,b,w,h,x,y):
    for j in range(h):dest[((y+j)*dw+x)*4:((y+j)*dw+x+w)*4]=b[j*w*4:(j+1)*w*4]
def resize(b,w,h,nw,nh):
    return run(['-f','rawvideo','-pix_fmt','rgba','-s',f'{w}x{h}','-i','pipe:0','-vf',f'scale={nw}:{nh}:flags=lanczos','-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],b)
def png(path,b,w,h):
    def chunk(n,v):return struct.pack('>I',len(v))+n+v+struct.pack('>I',zlib.crc32(n+v)&0xffffffff)
    rows=b''.join(b'\0'+b[j*w*4:(j+1)*w*4] for j in range(h))
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))
def entries(v):
    if isinstance(v,dict):
        if 'id' in v:yield v
        for c in v.values():yield from entries(c)
    elif isinstance(v,list):
        for c in v:yield from entries(c)
assert not DEST.exists(),'Refusing to overwrite existing sprite'
if not SOURCE.exists():shutil.copyfile(ORIGINAL,SOURCE)
protected=sorted(p for p in ASSETS.iterdir() if p.is_file() and p!=DEST)
before={str(p.relative_to(ROOT)):sha(p) for p in protected}
manifest=json.loads((ASSETS/'manifest-v3.json').read_text(encoding='utf-8-sig'))
cleaner=next(x for x in entries(manifest) if x.get('id')=='npc-cleaner')
sw,sh=struct.unpack('>II',SOURCE.read_bytes()[16:24])
source=decode(SOURCE,sw,sh)
atlas=bytearray(768*768*4);frames=[]
for i,(name,height) in enumerate(zip(['standing','sitting','walk-a','walk-b'],[120,105,111,111])):
    qx,qy=(i%2)*(sw//2),(i//2)*(sh//2)
    # Ignore generated near-invisible outer alpha debris when selecting crops.
    # Keep the original, unmodified alpha of every pixel INSIDE those crops.
    quadrant=crop(source,sw,[qx,qy,sw//2,sh//2]);b=bbox(quadrant,sw//2,sh//2,8)
    assert b,'Empty source quadrant'
    piece=crop(quadrant,sw//2,b);pw,ph=b[2:];nw=round(pw*height/ph)
    for attempt in range(5):
        scaled=resize(piece,pw,ph,nw,height);sb=bbox(scaled,nw,height)
        assert sb,'Empty scaled sprite'
        if sb[1]==0 and sb[3]==height:break
        piece=crop(scaled,nw,sb);pw,ph=sb[2:]
    assert sb[1]==0 and sb[3]==height,'Cannot fit exact content height'
    scaled=crop(scaled,nw,sb);nw=sb[2];assert nw<=80
    x,y=round((96-nw)/2),135-height
    paste(atlas,768,scaled,nw,height,i*96+x,y)
    frames.append({'name':name,'rect':[i*96,0,96,144],'pivot':[48,135],'contentRect':[x,y,nw,height],'sourceRect':[qx+b[0],qy+b[1],b[2],b[3]]})
temporary=HERE/'_encoded.webp';assert not temporary.exists()
run(['-f','rawvideo','-pix_fmt','rgba','-s','768x768','-i','pipe:0','-frames:v','1','-c:v','libwebp','-lossless','1','-compression_level','6',str(temporary)],bytes(atlas))
assert temporary.stat().st_size<=50000,'WebP exceeds 50,000 bytes'
encoded=decode(temporary,768,768)
for frame in frames:
    cell=crop(encoded,768,frame['rect'])
    assert bbox(cell,96,144)==frame['contentRect'],('Encoded bounds differ',frame['name'])
    assert cell[3::4]==crop(atlas,768,frame['rect'])[3::4],'Alpha changed during encoding'
outside=sum(encoded[(y*768+x)*4+3]>0 for y in range(768) for x in range(768) if y>=144 or x>=384)
assert outside==0,'Pixels outside four allowed cells'
assert len({hashlib.sha256(crop(encoded,768,f['rect'])).hexdigest() for f in frames})==4,'Duplicate poses'
alpha=encoded[3::4]
pack=decode(ASSETS/'npc-pack-v2.webp',768,1152)
cw,ch=1104,176;comparison=bytearray(bytes([238,240,243,255])*cw*ch)
def composite(data,w,h,x,y):
    for row in range(h):
        for col in range(w):
            si=(row*w+col)*4;di=((y+row)*cw+x+col)*4;a=data[si+3]
            for c in range(3):comparison[di+c]=(data[si+c]*a+comparison[di+c]*(255-a)+127)//255
for i in range(7):composite(crop(pack,768,[0,i*144,96,144]),96,144,12+i*96,16)
for i in range(4):composite(crop(encoded,768,[i*96,0,96,144]),96,144,708+i*96,16)
for y in range(8,168):comparison[(y*cw+696)*4:(y*cw+696)*4+4]=bytes([160,169,181,255])
png(HERE/'compare.png',comparison,cw,ch)
after={str(p.relative_to(ROOT)):sha(p) for p in protected};assert before==after,'Existing asset changed'
shutil.copyfile(temporary,DEST);temporary.unlink()
entry={'id':'npc-guide','name':'안내 데스크','kind':'npc','file':DEST.name,'atlas':cleaner['atlas'],'cell':cleaner['cell'],'direction':'front','frames':frames,'sizeBytes':DEST.stat().st_size,'sha256':sha(DEST)}
(HERE/'frames.json').write_text(json.dumps(entry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
result={'sourceSize':[sw,sh],'encoder':'FFmpeg libwebp, lossless=1, compression_level=6','sizeBytes':entry['sizeBytes'],'sha256':entry['sha256'],'frames':frames,'outsideNontransparentPixels':outside,'alpha':{'transparent':alpha.count(0),'partial':sum(0<a<255 for a in alpha),'opaque':alpha.count(255)},'protectedFileCount':len(protected),'protectedHashesUnchanged':before==after,'referenceHashes':{n:sha(ASSETS/n) for n in ['npc-pack-v2.webp','npc-cleaner.webp','manifest-v3.json']},'compareSize':[cw,ch],'compareScale':1,'checks':['768x768 RGBA','96x144 cells','four unique decoded poses','pivot 48,135','decoded content heights 120/105/111/111','outside four cells alpha=0','encoded alpha identical to packed alpha','lossless WebP <= 50000 bytes','compare original source cells copied at 1:1','existing sprite directory hashes unchanged']}
(HERE/'VALIDATION.txt').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:result[k] for k in ['sizeBytes','sha256','outsideNontransparentPixels','protectedFileCount','protectedHashesUnchanged','checks']},indent=2))
