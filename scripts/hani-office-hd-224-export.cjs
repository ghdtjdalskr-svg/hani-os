// Repack the existing alpha artwork, never resize the released 48x64 bitmaps.
// HANI_SHARP_MODULE may point to a local sharp install. No network or data writes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require(process.env.HANI_SHARP_MODULE||path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/sprites-v3'),evidence=path.join(root,'artifacts/office-hd-224');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/sprites-v2/manifest.json')));
const sources=JSON.parse(fs.readFileSync(path.join(root,'docs/design/sprites-v3-meta/_sources.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const scale=3,quality=88;
const clear=(width,height)=>sharp({create:{width,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}});
// Match the prior packer's detached-speck cleanup, retaining adjacent alpha edges.
async function clean(png,threshold,minArea,diagonal,preserveEdges){
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,seen=new Uint8Array(w*h),keep=new Uint8Array(w*h);
 for(let p=0;p<w*h;p++){
  if(seen[p]||data[p*4+3]<=threshold)continue;
  const component=[p];seen[p]=1;
  for(let j=0;j<component.length;j++){
   const q=component[j],x=q%w,y=Math.floor(q/w);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!diagonal&&Math.abs(dx)+Math.abs(dy)!==1)continue;
    const xx=x+dx,yy=y+dy,n=yy*w+xx;
    if(xx<0||xx>=w||yy<0||yy>=h||seen[n]||data[n*4+3]<=threshold)continue;
    seen[n]=1;component.push(n);
   }
  }
  if(component.length>=minArea)for(const q of component)keep[q]=1;
 }
 for(let p=0;p<w*h;p++){
  if(keep[p])continue;
  if(!preserveEdges){if(data[p*4+3]>threshold)data[p*4+3]=0;continue;}
  const x=p%w,y=Math.floor(p/w);let edge=false;
  if(data[p*4+3]<=threshold)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&keep[yy*w+xx])edge=true;
  }
  if(!edge)data[p*4+3]=0;
 }
 return sharp(data,{raw:info}).png().toBuffer();
}
async function main(){
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(evidence,{recursive:true});
 assert.equal(sources.people.length,25);
 const entries=[],audit=[];
 for(const person of sources.people){
  const old=person.currentEntry||manifest.entries.find(e=>e.id===person.id);
  const source=fs.readFileSync(person.source),meta=await sharp(source).metadata();
  assert.equal(hash(source),old.sourceSha256,person.id+' verified original artwork');
  // 217's two replacement faces use portrait canvases; retain their current art.
  if(person.currentEntry)assert.ok(meta.width>=1000&&meta.height>=1000);
  else assert.deepEqual([meta.width,meta.height],[1254,1254]);
  assert.ok(meta.hasAlpha);
  const layers=[],frames=[];
  for(const f of old.frames){
   const [x,y,w,h]=f.sourceRect,[left,top,width,height]=f.contentRect;
   let crop=await sharp(source).extract({left:x,top:y,width:w,height:h}).png().toBuffer();
   if(person.currentEntry)crop=await clean(crop,16,12,false,false);
   let resized=await sharp(crop).resize(width*scale,height*scale,{kernel:'lanczos3'}).png().toBuffer();
   if(person.cleanDetachedAlpha)resized=await clean(resized,8,4*scale*scale,true,true);
   layers.push({input:resized,left:(f.rect[0]+left)*scale,top:(f.rect[1]+top)*scale});
   frames.push({...f,rect:f.rect.map(n=>n*scale),pivot:f.pivot.map(n=>n*scale),contentRect:f.contentRect.map(n=>n*scale)});
  }
  const atlas=old.atlas.map(n=>n*scale),cell=old.cell.map(n=>n*scale);
  // No sharpening: Lanczos retains clean original antialiasing without halos.
  const encoded=await clear(...atlas).composite(layers).webp({quality,alphaQuality:100,effort:6}).toBuffer();
  const file=person.id+'.webp';fs.writeFileSync(path.join(out,file),encoded);
  const decoded=await sharp(encoded).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([decoded.info.width,decoded.info.height],atlas);
  let transparent=0,partial=0,opaque=0;const raw=decoded.data,hashes=[];
  for(let i=3;i<raw.length;i+=4){if(raw[i]===0)transparent++;else if(raw[i]===255)opaque++;else partial++;}
  assert.ok(transparent>atlas[0]*atlas[1]*.8&&partial>20&&opaque>100,person.id+' transparent alpha');
  for(const f of frames){
   const [left,top,width,height]=f.rect;
   const data=await sharp(encoded).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x===0||y===0||x===width-1||y===height-1)assert.equal(data[(y*width+x)*4+3],0,person.id+' clean frame edges');
   hashes.push(hash(data));
  }
  assert.equal(new Set(hashes).size,4,person.id+' four distinct decoded poses');
  const reserved=await sharp(encoded).extract({left:0,top:cell[1],width:atlas[0],height:atlas[1]-cell[1]}).ensureAlpha().raw().toBuffer();
  for(let i=3;i<reserved.length;i+=4)assert.equal(reserved[i],0,person.id+' reserved cells');
  assert.ok(encoded.length<100000,person.id+' atlas budget');
  entries.push({...old,identityReference:old.identityReference?.startsWith('assets/')?path.posix.relative('assets/sprites-v3',old.identityReference):old.identityReference,file,scale,quality,sizeBytes:encoded.length,sha256:hash(encoded),atlas,cell,frames,alpha:{transparent,partial,opaque},maxBytes:100000});
  const previousFile=person.currentEntry?old.file:manifest.entries.find(e=>e.id===person.id).file;
  const previousBytes=fs.statSync(path.join(root,'assets/sprites-v2',previousFile)).size;
  audit.push({id:person.id,sourceSha256:hash(source),sourceSize:[meta.width,meta.height],previousFile,previousBytes,sizeBytes:encoded.length,quality,frames:hashes});
  console.log(person.id+': '+(encoded.length/1024).toFixed(2)+' KiB');
 }
 const spriteBytes=entries.reduce((n,e)=>n+e.sizeBytes,0);assert.ok(spriteBytes<1475000,'total sprite budget');
 const hd={...manifest,version:'office-hd-224-v3',scale,filter:'lanczos3',sharpen:false,spriteBytes,maxSpriteBytes:1475000,entries};
 delete hd.reviewSheet;delete hd.reviewSheetBytes;
 fs.writeFileSync(path.join(out,'manifest-v3.json'),JSON.stringify(hd,null,2)+'\n');
 fs.writeFileSync(path.join(evidence,'export-validation.json'),JSON.stringify({result:'passed',scale,quality,filter:'lanczos3',sharpen:false,spriteBytes,entries:audit},null,2)+'\n');
 const rows=['| Atlas | v2 KiB | v3 KiB |','| --- | ---: | ---: |',...audit.map(e=>`| ${e.id} | ${(e.previousBytes/1024).toFixed(2)} | ${(e.sizeBytes/1024).toFixed(2)} |`),`| **Total** | **${(audit.reduce((n,e)=>n+e.previousBytes,0)/1024).toFixed(2)}** | **${(spriteBytes/1024).toFixed(2)}** |`];
 fs.writeFileSync(path.join(evidence,'sizes.md'),rows.join('\n')+'\n');
 console.log('TOTAL: '+spriteBytes+' bytes / '+(spriteBytes/1024).toFixed(2)+' KiB');
}
main().catch(e=>{console.error(e);process.exitCode=1});
