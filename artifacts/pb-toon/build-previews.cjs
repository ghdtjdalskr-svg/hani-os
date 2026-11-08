// Static art layout only. No runtime imports, persistence, network or Git.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '../..');
const out = path.join(__dirname, 'drafts');
const source = process.argv[2];
if (!source) throw Error('Provide the selected image_gen PNG path.');
const rows = ['naeun', 'hina', 'jieun', 'haru', 'minji'];
const names = ['나은', '히나', '지은', '하루', '민지'];
const xml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const svg = (w,h,body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><style>text{font-family:'Malgun Gothic',sans-serif;fill:#373342}</style>${body}</svg>`);
const text = (s,x,y,size=16,extra='') => `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${xml(s)}</text>`;
const rect = (x,y,w,h,fill,stroke='none',rx=0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
async function art(file,w,h) { return sharp(file).resize(w,h,{fit:'contain',background:'#00000000'}).png().toBuffer(); }
async function crop(row,col) { return sharp(path.join(out,'pb-chibi-sheet-v1.webp')).extract({left:col*256,top:row*256,width:256,height:256}).png().toBuffer(); }
async function main() {
  // image_gen's rows have slightly unequal whitespace. These separator bands
  // were visually checked; no character is cut at the new grid boundaries.
  const meta = await sharp(source).metadata();
  if (meta.width !== 1374 || meta.height !== 1145) throw Error('Reinspect generated row/column separators before using a new source.');
  const ys = [0,242,478,706,929,1145];
  const sprites=[];
  const evidence=[];
  for(let r=0;r<5;r++) for(let c=0;c<6;c++) {
    const {data,info} = await sharp(source).extract({left:c*229,top:ys[r],width:229,height:ys[r+1]-ys[r]}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let x0=info.width,y0=info.height,x1=-1,y1=-1,visible=0;
    for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>=32) {x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);visible++;}
    if(visible<1000) throw Error(`Empty sprite ${r}/${c}`);
    const box={left:Math.max(0,x0-2),top:Math.max(0,y0-2),width:Math.min(info.width-1,x1+2)-Math.max(0,x0-2)+1,height:Math.min(info.height-1,y1+2)-Math.max(0,y0-2)+1};
    const img=await sharp(data,{raw:info}).extract(box).resize(216,216,{fit:'inside'}).png().toBuffer();
    const sm=await sharp(img).metadata();
    // Pose 4 rests at lower right; other poses share a lower baseline.
    const left=c*256+(c===4?244-sm.width:Math.round((256-sm.width)/2));
    const top=r*256+244-sm.height;
    sprites.push({input:img,left,top});
    evidence.push({employee:rows[r],state:c===5?'unknown':c,sourceBox:box,visiblePixels:visible,placed:{left,top,width:sm.width,height:sm.height}});
  }
  await sharp({create:{width:1536,height:1280,channels:4,background:'#00000000'}}).composite(sprites).webp({lossless:true,effort:6}).toFile(path.join(out,'pb-chibi-sheet-v1.webp'));

  // Compare real legacy assets directly against cells of the final sheet.
  let body=rect(0,0,1200,1050,'#f7f4ee');
  body+=text('기존 치비와 그림체 비교',36,48,29,'font-weight="700"');
  body+=text('원본은 그대로 · 새 시트에서 발췌 · 배경색 위에서 투명 경계도 확인',36,80,16);
  const layers=[];
  const samples=[['jieun','cheer',2,0],['minji','cheer',4,0],['jieun','think',2,2],['minji','think',4,2]];
  for(let i=0;i<samples.length;i++) {
    const [id,pose,r,c]=samples[i],x=24+(i%2)*588,y=108+Math.floor(i/2)*302;
    body+=rect(x,y,564,284,'#fffdf9','#e1d9ce',16);
    body+=text(`${names[r]} · 기존 ${pose}`,x+18,y+28,16,'font-weight="700"');
    body+=text(`새 치비 · ${c}단계`,x+300,y+28,16,'font-weight="700"');
    body+=`<path d="M${x+280} ${y+45}v215" stroke="#e5dfd5"/>`;
    layers.push({input:await art(path.join(root,`assets/street-journal/chibi/${id}-${pose}.webp`),230,230),left:x+20,top:y+43});
    layers.push({input:await art(await crop(r,c),230,230),left:x+310,top:y+43});
  }
  body+=text('얼굴·의상 기준 → 새 치비',36,756,22,'font-weight="700"');
  body+=text('나은 민트 단발 · 히나 벚꽃 올림머리 · 지은 안경 · 하루 긴 머리 · 민지 포니테일',36,785,15);
  for(let r=0;r<5;r++) {
    const x=26+r*234;
    body+=rect(x,807,218,210,'#fffdf9','#e1d9ce',12);
    body+=text(names[r],x+12,833,16,'font-weight="700"');
    layers.push({input:await art(path.join(root,`assets/profiles/hani-profile-${rows[r]}.webp`),90,90),left:x+12,top:863});
    layers.push({input:await art(await crop(r,0),112,154),left:x+103,top:846});
  }
  await sharp(svg(1200,1050,body)).composite(layers).png().toFile(path.join(out,'compare.png'));

  // Read only the literal STAFF block; never execute the app or invent dialogue.
  const code=fs.readFileSync(path.join(root,'hani-procrastination-board.js'),'utf8');
  const staff=code.slice(code.indexOf('const STAFF = {'),code.indexOf('const SPECS = ['));
  const linesFor=id=>{
    const m=staff.match(new RegExp(id+': \\{[\\s\\S]*?lines:\\[([\\s\\S]*?)\\]'));
    if(!m)throw Error('STAFF anchor missing: '+id);
    return [...m[1].matchAll(/'([^']*)'/g)].map(x=>x[1]);
  };
  const examples=[{row:0,state:2,title:'걸음 수 입력',role:'건강 · 루틴',mood:'2단계 · 삐짐',color:'#edf4ec'},
    {row:1,state:4,title:'미완료 퀴즈 풀기',role:'학습 · 최종 리뷰',mood:'4단계 · 구석에서 웅크림',color:'#f8ebef'},
    {row:2,state:0,title:'자산 업데이트',role:'재무 · 자산',mood:'0단계 · 괜찮아요',color:'#f3ede3'}];
  let card=rect(0,0,390,1412,'#f6f2eb');
  card+=text('미룬 일',18,38,26,'font-weight="700"');
  card+=text('치비툰 그림 시안 · 390px',18,65,14);
  const cardLayers=[];const dialogues=[];
  for(let i=0;i<examples.length;i++) {
    const e=examples[i],y=88+i*434,line=linesFor(rows[e.row])[e.state];
    dialogues.push({employee:rows[e.row],state:e.state,line});
    card+=rect(16,y,358,416,'#fffcf8','#49404a',13);
    card+=text(`${names[e.row]} · ${e.role}`,30,y+30,13,'font-weight="700"');
    card+=text(e.title,30,y+59,21,'font-weight="700"');
    card+=rect(28,y+78,334,296,e.color,'#49404a',8);
    card+=rect(42,y+92,306,86,'#ffffff','#49404a',18);
    card+=`<path d="M115 ${y+178} l-11 18 35-18" fill="white" stroke="#49404a" stroke-width="2"/><path d="M116 ${y+178}h22" stroke="white" stroke-width="3"/>`;
    // Line breaks only: the concatenated speech is byte-for-byte STAFF.lines.
    const words=line.split(' '),wrapped=[];let buf='';
    for(const w of words){if((buf+' '+w).trim().length>21&&buf){wrapped.push(buf);buf=w;}else buf=(buf+' '+w).trim();} if(buf)wrapped.push(buf);
    if(wrapped.length>3)throw Error('Speech bubble requires revised layout');
    wrapped.forEach((l,j)=>{card+=text(l,58,y+116+j*23,15);});
    cardLayers.push({input:await art(await crop(e.row,e.state),186,186),left:e.state===4?164:104,top:y+184});
    card+=text(e.mood,30,y+399,14,'font-weight="700"');
  }
  await sharp(svg(390,1412,card)).composite(cardLayers).png().toFile(path.join(out,'card-mock.png'));
  const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'baseline.json'),'utf8'));
  const changed=Object.entries(baseline).filter(([file,hash])=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')!==hash).map(([file])=>file);
  if(changed.length)throw Error('Existing files changed: '+changed.join(', '));
  const sheet=await sharp(path.join(out,'pb-chibi-sheet-v1.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let transparent=0;for(let i=3;i<sheet.data.length;i+=4)if(sheet.data[i]===0)transparent++;
  const report={source,width:1536,height:1280,cell:256,rows,columns:['0','1','2','3','4','unknown'],cells:evidence,transparentPixels:transparent,totalPixels:1536*1280,dialogues,card:{width:390,height:1412,examples:3},preservedFiles:Object.keys(baseline).length,changedFiles:changed};
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({sheet:'1536x1280 RGBA / 30 cells / 256px',transparentPixels:transparent,card:'390x1412 / 3 exact STAFF.lines',preservedFiles:Object.keys(baseline).length,changedFiles:changed}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
