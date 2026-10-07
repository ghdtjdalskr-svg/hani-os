// Author editable stage layouts with Artifact Tool. No personal records enter this builder.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {inflateRawSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const runtime=process.env.HANI_RUNTIME_MODULES;
const skill=process.env.HANI_PRESENTATION_SKILL;
if(!runtime||!skill)throw Error('Runtime paths required');
process.env.RUNTIME_NODE_MODULES=runtime;
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'@oai/artifact-tool/dist/artifact_tool.mjs')));
const deck=Presentation.create({slideSize:{width:1200,height:675}});
const dir=path.join(root,'artifacts/earnings-stage-template');await fs.mkdir(dir,{recursive:true});
const assets=new Map();
function text(s,value,x,y,w,h,size,color,bold=false){const t=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});t.text=value;t.text.style={typeface:'Malgun Gothic',fontSize:size,color,bold,autoFit:'none'};}
async function pic(s,file,x,y,w,h){const bytes=await fs.readFile(path.join(root,file));assets.set(createHash('sha256').update(bytes).digest('hex'),file);s.images.add({blob:new Uint8Array(bytes),contentType:'image/webp',alt:file,fit:'contain',position:{left:x,top:y,width:w,height:h}});}
const tones=[['opening','hani','#281D42','#FFFFFF'],['overview','hani','#F5F0FA','#63458F'],['finance','jieun','#F8F3EC','#725941'],['health','naeun','#F3F7F2','#315C48'],['learning','hina','#211F36','#F4DFF0'],['reading','haru','#FFF7ED','#8A5235'],['culture','minji','#FFF1ED','#A25746'],['outlook','hani','#F5F0FA','#63458F'],['plan','hani','#F5F0FA','#63458F'],['qa','hani','#281D42','#FFFFFF']];
for(const [i,[key,owner,bg,fg]] of tones.entries()){
  const s=deck.slides.add();s.background.fill=bg;
  text(s,'{{TITLE}}',54,40,1090,64,32,fg,true);
  text(s,'{{KEYNOTE}}',58,112,1080,100,key==='opening'?43:32,fg,true);
  if(key==='opening'){
    text(s,'{{HEADLINE}}',58,242,555,106,46,fg,true);
    text(s,'{{BODY}}',60,384,510,128,25,fg);
    await pic(s,'assets/team/hani-team-office.webp',605,216,552,315);
  }else if(key==='overview'){
    for(let n=0;n<6;n++){const col=n%3,row=Math.floor(n/3),x=58+col*370,y=245+row*145;text(s,`{{M${n}LABEL}}`,x,y,350,40,21,fg);text(s,`{{M${n}VALUE}}`,x,y+42,350,70,n<2?33:47,fg,true);}
  }else if(key==='plan'){
    text(s,'{{BODY}}',58,215,1080,70,24,fg);
    const table=s.tables.add({rows:5,columns:3,left:58,top:310,width:1080,height:244,columnWidths:[150,465,465],values:[['분야','추진 방향 · 미확정','조건부 기대효과'],...Array.from({length:4},(_,row)=>Array.from({length:3},(_,col)=>`{{P${row}${col}}}`))]});
    for(let row=0;row<5;row++)for(let col=0;col<3;col++){const cell=table.getCell(row,col);cell.fill=row===0?'#E2D7F0':bg;cell.text.style={typeface:'Malgun Gothic',fontSize:19,color:fg,bold:row===0};}
  }else{
    const left=i%2===0?420:58;
    await pic(s,`assets/profiles/hani-profile-${owner}.webp`,i%2===0?58:852,240,280,280);
    text(s,'{{PRESENTER}}',i%2===0?58:852,537,280,44,26,fg,true);
    text(s,'{{HEADLINE}}',left,224,710,80,45,fg,true);
    text(s,'{{BODY}}',left,320,710,245,23,fg);
  }
  text(s,'{{BASIS}}',58,584,1080,48,16,fg);
  text(s,'{{FOOTER}}',58,642,1080,24,12,fg);
  s.speakerNotes.textFrame.setText('HANI OS 프로젝트 캐릭터 및 팀 원본 이미지. 실제 수치는 선택 기간 원본에서 런타임에 집계합니다. 전망은 미확정 제안입니다.');
}
const candidate=path.join(dir,'candidate.pptx');await(await PresentationFile.exportPptx(deck)).save(candidate);
// Retain Artifact Tool's authored objects, excluding its package-level layout and notes links.
const zip=await fs.readFile(candidate),entries={};
for(let at=0;at<zip.length-30;){if(zip.readUInt32LE(at)!==0x04034b50){at++;continue}const method=zip.readUInt16LE(at+8),size=zip.readUInt32LE(at+18),nl=zip.readUInt16LE(at+26),el=zip.readUInt16LE(at+28),name=zip.subarray(at+30,at+30+nl).toString(),start=at+30+nl+el,data=zip.subarray(start,start+size);entries[name]=method===8?inflateRawSync(data):data;at=start+size;}
const media={};for(const [name,data]of Object.entries(entries))if(name.startsWith('ppt/media/')){const file=assets.get(createHash('sha256').update(data).digest('hex'));if(!file)throw Error('Unknown template image');media[name]=file;}
const slides=tones.map((_,i)=>({xml:entries[`ppt/slides/slide${i+1}.xml`].toString().replace(/^\uFEFF/,''),rels:entries[`ppt/slides/_rels/slide${i+1}.xml.rels`].toString().match(/<Relationship\b[^>]*\/image[^>]*\/>/g)||[]}));
const encoded=gzipSync(Buffer.from(JSON.stringify({slides,media}))).toString('base64');
await fs.writeFile(path.join(dir,'stage-template.json'),JSON.stringify({encoded,media,slides:slides.length}));
console.log(JSON.stringify({slides:slides.length,encodedBytes:encoded.length,media}));
