// Deterministic packing/conversion only; all added character art is image_gen output.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require(process.env.HANI_SHARP_MODULE||path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'));
sharp.concurrency(1);
const dir=__dirname,root=path.resolve(dir,'../..');
(async()=>{
 const original=path.join(root,'assets/office-companions/kids-v1.webp'),source=path.join(dir,'generated.png');
 const meta=await sharp(source).metadata(),layers=[{input:await sharp(original).png().toBuffer(),left:0,top:0}],frames=[];
 // Keep the authored v1 frame positions AND bytes visually identical. The new
 // rows contain B wave / seat / surprised-or-pout / folded-arms-or-cling.
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  // Generated rows have uneven vertical spacing; use the inspected alpha gaps
  // rather than a uniform crop that would cut feet across adjacent cells.
  const [sy,ey]=[[1156,1404],[1410,1668],[1680,1914],[1928,2172]][row];
  const sx=Math.round(col*meta.width/4),ex=Math.round((col+1)*meta.width/4);
  const cell=await sharp(source).extract({left:sx,top:sy,width:ex-sx,height:ey-sy}).png().toBuffer();
  const {data,info}=await sharp(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  let art=sharp(cell).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1});
  // The generation's clinging/folded-arm figures face right on both rows.
  // Mirror the left version during packing to match the existing facing owner.
  if(row%2===0&&col===3)art=art.flop();
  const input=await art.resize({width:68,height:104,fit:'inside'}).png().toBuffer(),m=await sharp(input).metadata();
  const left=col*96+Math.floor((96-m.width)/2),top=(row+4)*144+135-m.height;
  layers.push({input,left,top});frames.push({row:row+4,col,left,top,width:m.width,height:m.height});
 }
 const packed=await sharp({create:{width:384,height:1152,channels:4,background:'#00000000'}}).composite(layers).raw().toBuffer();
 const originalRaw=await sharp(original).ensureAlpha().raw().toBuffer();originalRaw.copy(packed,0);
 const atlas=await sharp(packed,{raw:{width:384,height:1152,channels:4}}).webp({lossless:true}).toBuffer();
 fs.writeFileSync(path.join(root,'assets/office-companions/kids-v2.webp'),atlas);
 const a=await sharp(original).ensureAlpha().raw().toBuffer(),b=await sharp(atlas).extract({left:0,top:0,width:384,height:576}).ensureAlpha().raw().toBuffer();
 for(let i=0;i<a.length;i+=4)if(!a[i+3]&&!b[i+3]){a.fill(0,i,i+3);b.fill(0,i,i+3)}
 assert.ok(b.equals(a),'visible original RGBA pixels must be identical');
 const matte={r:245,g:241,b:252,alpha:1},label=Buffer.from('<svg width="848" height="48"><rect width="848" height="48" fill="#f5f1fc"/><text x="16" y="30" font-family="sans-serif" font-size="20">v1 · 16 frames</text><text x="448" y="30" font-family="sans-serif" font-size="20">v2 · original 16 + B 16</text></svg>');
 await sharp({create:{width:848,height:1200,channels:4,background:matte}}).composite([{input:label,left:0,top:0},{input:await sharp(original).png().toBuffer(),left:16,top:48},{input:await sharp(atlas).png().toBuffer(),left:448,top:48}]).png().toFile(path.join(dir,'compare-v1-v2.png'));
 fs.writeFileSync(path.join(dir,'atlas-layout.json'),JSON.stringify({sourceSize:[meta.width,meta.height],atlasSize:[384,1152],cell:[96,144],pivot:[48,135],original16PixelIdentical:true,frames},null,2)+'\n');
 console.log('atlas 384x1152 RGBA, original 16 frames pixel-identical, B rows packed');
})().catch(e=>{console.error(e);process.exitCode=1});
