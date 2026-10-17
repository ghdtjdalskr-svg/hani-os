/* Asset-only crop/resize/packing. All character art is built-in image_gen output. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sharp = require(process.env.HANI_SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const input = JSON.parse(fs.readFileSync(path.join(root, '_sources.json'), 'utf8'));
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
assert.ok(!only || only === 'seongmin', 'scoped replacement supports seongmin only');
const previous = only ? JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')) : null;
const clear = (width, height) => sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}});
function bounds(data, width, height, threshold=8) {
  let left=width, top=height, right=-1, bottom=-1;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) if(data[(y*width+x)*4+3]>threshold) {
    left=Math.min(left,x); top=Math.min(top,y); right=Math.max(right,x); bottom=Math.max(bottom,y);
  }
  assert.ok(right>=left, 'empty frame');
  return {left,top,width:right-left+1,height:bottom-top+1};
}
// Packing cleanup only: discard detached alpha specks, never redraw the actor.
async function removeDetachedSpecks(png) {
  const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h}=info,seen=new Uint8Array(w*h),keep=new Uint8Array(w*h);
  for(let p=0;p<w*h;p++){
    if(seen[p] || data[p*4+3]<=8)continue;
    const component=[p];seen[p]=1;
    for(let j=0;j<component.length;j++){
      const q=component[j],x=q%w,y=Math.floor(q/w);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy,n=yy*w+xx;
        if(xx<0||xx>=w||yy<0||yy>=h||seen[n]||data[n*4+3]<=8)continue;
        seen[n]=1;component.push(n);
      }
    }
    if(component.length>=4)for(const q of component)keep[q]=1;
  }
  for(let p=0;p<w*h;p++){
    if(keep[p])continue;
    const x=p%w,y=Math.floor(p/w);
    let edge=false;
    if(data[p*4+3]<=8)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;
      if(xx>=0&&xx<w&&yy>=0&&yy<h&&keep[yy*w+xx])edge=true;
    }
    if(!edge)data[p*4+3]=0;
  }
  return sharp(data,{raw:info}).png().toBuffer();
}
const xml = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;');
async function makePreview(encoded, cw, ch) {
  const enlarged=[];
  for(let i=0;i<4;i++) enlarged.push({input:await sharp(encoded).extract({left:i*cw,top:0,width:cw,height:ch}).resize(96,128,{fit:'contain',kernel:'nearest',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer(),left:i*96,top:0});
  return clear(384,128).composite(enlarged).png().toBuffer();
}
async function main(){
  const entries=[], previews=[];
  for(const person of input.people){
    if(only && person.id !== only){
      const entry=previous.entries.find(e=>e.id===person.id);
      const encoded=fs.readFileSync(path.join(root,entry.file));
      assert.equal(hash(encoded),entry.sha256,person.id+' unchanged character hash');
      entries.push(entry);
      previews.push({person,preview:await makePreview(encoded,...entry.cell)});
      continue;
    }
    const source = fs.readFileSync(person.source);
    const meta = await sharp(source).metadata();
    assert.ok(meta.hasAlpha, person.id+' source alpha');
    const halfW=Math.floor(meta.width/2);
    // Generation may place the row gap away from the exact canvas midpoint.
    // Find the quietest five-row alpha band; a fixed cut can clip feet and
    // transfer their shadow into the following walking pose.
    const full=await sharp(source).ensureAlpha().raw().toBuffer();
    let rowSplit=Math.floor(meta.height/2),bestScore=Infinity;
    for(let y=Math.floor(meta.height*.44);y<Math.floor(meta.height*.57);y++){
      let score=0;
      for(let yy=y-2;yy<=y+2;yy++)for(let x=0;x<meta.width;x++)if(full[(yy*meta.width+x)*4+3]>16)score++;
      if(score<bestScore || (score===bestScore && Math.abs(y-meta.height/2)<Math.abs(rowSplit-meta.height/2))){bestScore=score;rowSplit=y;}
    }
    // Thin hair/glow antialiasing can cross an otherwise empty band. Reject
    // a substantial intersection, while allowing <2% occupied band samples.
    assert.ok(bestScore<=meta.width*.1,person.id+' sparse source row separator');
    const crops=[];
    for(const [col,row] of [[0,0],[1,0],[0,1],[1,1]]){
      const origin={left:col*halfW,top:row?rowSplit:0,width:halfW,height:row?meta.height-rowSplit:rowSplit};
      const cell = await sharp(source).extract(origin).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const box = bounds(cell.data,origin.width,origin.height);
      const trimmed = await sharp(cell.data,{raw:cell.info}).extract(box).png().toBuffer();
      crops.push({box,trimmed,origin});
    }
    const npc=person.id.startsWith('visitor-'), cw=npc?32:48, ch=npc?48:64;
    // Base scale preserves seated height. Correct undersized generated walk
    // poses proportionally, keeping them within four pixels of standing.
    const scale=Math.min((cw-4)/Math.max(...crops.map(c=>c.box.width)),(ch-8)/Math.max(...crops.map(c=>c.box.height)));
    const pivot=[cw/2,ch-3], frames=[], buffers=[];
    const names=['standing','sitting','walk-a','walk-b'];
    for(let i=0;i<4;i++){
      const crop=crops[i];
      const poseScale=person.frameHeights ? person.frameHeights[i]/crop.box.height : i>=2?Math.min(Math.max(scale,(crops[0].box.height*scale-4)/crop.box.height),(cw-4)/crop.box.width,(ch-8)/crop.box.height):scale;
      const w=Math.max(1,Math.round(crop.box.width*poseScale)), h=Math.max(1,Math.round(crop.box.height*poseScale));
      assert.ok(w<=cw-4 && h<=ch-8,person.id+' proportional content fit');
      let resized=await sharp(crop.trimmed).resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
      if(person.cleanDetachedAlpha)resized=await removeDetachedSpecks(resized);
      const left=Math.floor((cw-w)/2),top=pivot[1]-h;
      assert.ok(left>=2 && top>=3,person.id+' gutter');
      buffers.push(await clear(cw,ch).composite([{input:resized,left,top}]).png().toBuffer());
      frames.push({name:names[i],rect:[i*cw,0,cw,ch],pivot,contentRect:[left,top,w,h],sourceRect:[crop.origin.left+crop.box.left,crop.origin.top+crop.box.top,crop.box.width,crop.box.height]});
    }
    const filename=`${person.id}.webp`, out=path.join(root,filename);
    const width=npc?256:384, height=npc?256:512;
    const cap=person.maxBytes || (npc?35000:65000);
    const atlas=await clear(width,height).composite(buffers.map((b,i)=>({input:b,left:i*cw,top:0}))).png().toBuffer();
    let encoded,quality=person.webpQuality || 88;
    do {
      encoded=await sharp(atlas).webp({quality,alphaQuality:100,effort:6}).toBuffer();
      if(encoded.length<=cap)break;
      quality-=2;
    } while(person.maxBytes && quality>=50);
    assert.ok(encoded.length<=cap,person.id+' individual budget');
    fs.writeFileSync(out,encoded);
    const decoded=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(decoded.info.width,width);assert.equal(decoded.info.height,height);
    let transparent=0,partial=0,opaque=0;
    for(let i=3;i<decoded.data.length;i+=4){const a=decoded.data[i];if(a===0)transparent++;else if(a===255)opaque++;else partial++;}
    assert.ok(transparent>width*height*.8 && opaque>100 && partial>20,person.id+' alpha coverage');
    const frameHashes=[];
    for(let i=0;i<4;i++){
      const b=await sharp(encoded).extract({left:i*cw,top:0,width:cw,height:ch}).raw().toBuffer();
      const bb=bounds(b,cw,ch);assert.ok(bb.left>0 && bb.top>0 && bb.left+bb.width<cw && bb.top+bb.height<ch,person.id+' clipped edge');
      frameHashes.push(hash(b));
    }
    assert.equal(new Set(frameHashes).size,4,person.id+' four distinct frames');
    const unused=await sharp(encoded).extract({left:0,top:ch,width,height:height-ch}).raw().toBuffer();
    for(let i=3;i<unused.length;i+=4)assert.equal(unused[i],0,person.id+' unprovided directions must stay transparent');
    entries.push({id:person.id,name:person.name,kind:person.kind || (npc?'visitor':person.id==='mir'?'office_entity':'human'),planned:['daon','yoonseul'].includes(person.id),file:filename,sizeBytes:encoded.length,sha256:hash(encoded),sourceSha256:hash(source),sourceRowSplit:rowSplit,sourceGapSamples:bestScore,identityReference:person.identityReference,atlas:[width,height],cell:[cw,ch],direction:'front',frames,alpha:{transparent,partial,opaque},maxBytes:cap});
    // Review sheet uses decoded final WebP, never a larger source in its place.
    const preview=await makePreview(encoded,cw,ch);
    previews.push({person,preview});
  }
  const spriteBytes=entries.reduce((a,e)=>a+e.sizeBytes,0);
  assert.equal(entries.length,25);assert.ok(spriteBytes<=1475000);
  const sheetW=2080,sheetH=1180,composites=[];
  let text=`<svg width="${sheetW}" height="${sheetH}" xmlns="http://www.w3.org/2000/svg"><style>text{font-family:Malgun Gothic,Arial,sans-serif;fill:#25324a}</style><rect width="100%" height="100%" fill="#edf1f5"/><text x="28" y="38" font-size="24" font-weight="bold">HANI OS · CHARACTER SPRITES 217</text><text x="28" y="67" font-size="15">25 characters · front standing / sitting / walk A / walk B · final WebP at 2× (NPC cells enlarged for review)</text>`;
  for(let i=0;i<25;i++){
    const x=20+(i%5)*412,y=90+Math.floor(i/5)*216,p=previews[i].person;
    text+=`<rect x="${x}" y="${y}" width="400" height="204" rx="8" fill="${p.id==='mir'?'#dceff2':i>=20?'#e3e9ef':'#f9fafc'}"/><text x="${x+12}" y="${y+25}" font-size="17" font-weight="bold">${xml(p.name)}${['daon','yoonseul'].includes(p.id)?' · planned':''}</text><text x="${x+12}" y="${y+45}" font-size="12" fill="#617088">${p.id}</text>`;
    ['STAND','SIT','WALK A','WALK B'].forEach((s,j)=>{text+=`<text x="${x+20+j*96}" y="${y+195}" font-size="11">${s}</text>`;});
    composites.push({input:previews[i].preview,left:x+8,top:y+52});
  }
  text+='</svg>';
  await sharp(Buffer.from(text)).composite(composites).png({palette:true,colours:256,compressionLevel:9,dither:0}).toFile(path.join(root,'_contact-sheet.png'));
  const manifest={version:'art-sprites-217-front-v1',canon:'spatial-216-v1',base:'7978d7b91969db163f64b464bd416c3ecd78af98',generator:'built-in image_gen',layout:'Only row 0 columns 0..3 are populated: standing, sitting, walk-a, walk-b. Other cells are transparent reserved capacity. This is the user-requested front-only four-pose subset, not a completed four-direction animation set.',shadow:'Generated translucent floor shadow included per frame. Do not double-render; future split shadow pass requires mask/extraction work.',pivotMeaning:'Bottom center of included floor shadow; chair/desk masking must be validated by runtime owner.',spriteBytes,maxSpriteBytes:1475000,reviewSheet:'_contact-sheet.png',reviewSheetBytes:fs.statSync(path.join(root,'_contact-sheet.png')).size,entries};
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(root,'_validation.json'),JSON.stringify({status:'PASS',node:process.version,sharp:sharp.versions.sharp,characterCount:25,frameCount:100,spriteBytes,budget:1475000,scope:only || 'all',checks:only?['decode all final WebP for contact sheet','24 other character SHA256 unchanged; their prior checks retained','seongmin expected atlas dimensions, alpha and transparent gutters','seongmin four distinct decoded frames and unused rows transparent','seongmin original pose heights and pivot retained','seongmin original 7350-byte cap and aggregate budget']:['decode all final WebP','expected atlas dimensions','nonempty alpha and transparent gutters','four distinct decoded frames per character','unused rows transparent','per-file and aggregate byte budget'],notVerified:['runtime integration and actual desk/chair occlusion','four-direction animation not requested','Android and production','art approval']},null,2)+'\n');
  console.log(JSON.stringify({characters:25,frames:100,spriteBytes,contactSheetBytes:manifest.reviewSheetBytes,maxSpriteBytes:1475000,files:entries.map(e=>({id:e.id,bytes:e.sizeBytes}))},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
