// Standalone page function: PNG is decoded by the browser, with no dependency,
// fetch, DOM mutation, storage write or production hook. Pixels also allow Node QA.
export async function sampleBackgroundPixels({png,pixels,width,height,clip,textRects,color}){
 if(png){
  const bytes=Uint8Array.from(atob(png),c=>c.charCodeAt(0));
  const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
  width=bitmap.width;height=bitmap.height;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,0,0);bitmap.close();
  pixels=context.getImageData(0,0,width,height).data;
 }
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||pixels?.length!==width*height*4||!clip?.width||!clip?.height||color?.length!==4||color.some(v=>!Number.isFinite(v)))return {unresolved:'invalid screenshot geometry/color'};
 const luminance=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 let ratio=Infinity,samples=0,worst=null;
 const sx=clip.width/width,sy=clip.height/height;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const left=clip.x+x*sx,top=clip.y+y*sy,right=left+sx,bottom=top+sy;
  // Exclude whole glyph layout boxes + 2 CSS px against antialiasing/shadows.
  // Never infer background by picking a favorable color or averaging pixels.
  if(textRects.some(r=>left<r.right+2&&right>r.left-2&&top<r.bottom+2&&bottom>r.top-2))continue;
  const offset=(y*width+x)*4;if(pixels[offset+3]!==255)return {unresolved:'non-opaque screenshot pixel'};
  const background=[pixels[offset],pixels[offset+1],pixels[offset+2],1];
  const foreground=background.slice(0,3).map((v,i)=>color[i]*color[3]+v*(1-color[3]));
  const a=luminance(foreground),b=luminance(background),value=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);samples++;
  if(value<ratio){ratio=value;worst={x:left+sx/2,y:top+sy/2,background,foreground};}
 }
 return samples?{ratio,samples,worst,unresolved:null}:{unresolved:'no text-free background pixels'};
}

export async function resolveScreenshotContrast(page,row,{out,prefix}){
 for(const [index,text]of row.contrast.entries()){
  if(text.unresolved!=='gradient/image background')continue;
  const locator=page.locator('#'+row.id+' '+text.selector);
  await locator.scrollIntoViewIfNeeded();
  const geometry=await locator.evaluate(e=>{
   const r=e.getBoundingClientRect(),padding=6;
   // Include the immediate text-free margin even for an inline eyebrow whose
   // bounding box contains only glyphs. Stay entirely inside the viewport.
   const left=Math.max(0,Math.floor(r.left-padding)),top=Math.max(0,Math.floor(r.top-padding));
   const right=Math.min(innerWidth,Math.ceil(r.right+padding)),bottom=Math.min(innerHeight,Math.ceil(r.bottom+padding));
   const clip={x:left,y:top,width:right-left,height:bottom-top},textRects=[];
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    const node=walker.currentNode;if(!node.textContent.trim())continue;
    const range=document.createRange();range.selectNodeContents(node);
    for(const b of range.getClientRects())if(b.left<right+2&&b.right>left-2&&b.top<bottom+2&&b.bottom>top-2)textRects.push({left:b.left,top:b.top,right:b.right,bottom:b.bottom});
   }
   const ancestors=[];for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);if(Number(s.opacity)!==1||s.filter!=='none'||s.mixBlendMode!=='normal')ancestors.push(n.tagName);}
   return {clip,textRects,unsupportedEffects:ancestors};
  });
  if(geometry.unsupportedEffects.length){text.unresolved='opacity/filter/blend requires separate compositing QA';text.geometry=geometry;continue;}
  if(geometry.clip.width<=0||geometry.clip.height<=0){text.unresolved='element outside screenshot viewport';continue;}
  const filename=`${prefix}-contrast-${index}.png`;
  const png=await page.screenshot({path:out+'/'+filename,clip:geometry.clip,type:'png',animations:'disabled',scale:'css'});
  const sampled=await page.evaluate(sampleBackgroundPixels,{png:png.toString('base64'),...geometry,color:text.rgba});
  Object.assign(text,sampled,{method:'screenshot text-free worst pixel',screenshot:filename,clip:geometry.clip,textRects:geometry.textRects});
  if(sampled.worst)text.background=sampled.worst.background;
 }
 return row;
}
