// Read-only rectangular-cell feasibility diagnostic, independent of label order.
// No UI/clock/model mutation. Measurements are Node boxes, not browser pixels.
import fs from 'node:fs';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const {scene}=loadScene(),day='2026-10-22',width=342,height=width*941/1672,h=40,w=30,gap=.5;
const catalog=JSON.parse(fs.readFileSync('assets/data/desk-mascots-v1.json')),names=new Map(JSON.parse(fs.readFileSync('assets/sprites-v2/manifest.json')).entries.map(e=>[e.id,e.name.split('/')[0]]));names.set('seongmin','회장님');
const measure=text=>[...text].reduce((w,c)=>w+(/\s|·/.test(c)?3.5:/[\x00-\x7f]/.test(c)?6:10),0);
function minimum(head,bw,bh,obstacles){
 const domain={left:bw/2+gap,right:width-bw/2-gap,top:bh/2+gap,bottom:height-bh/2-gap},blocked=obstacles.map(r=>({left:r.left-bw/2-gap,right:r.right+bw/2+gap,top:r.top-bh/2-gap,bottom:r.bottom+bh/2+gap}));
 const axis=(a,b,k1,k2)=>[...new Set([a,b,...blocked.flatMap(r=>[r[k1],r[k2]]).filter(n=>n>a&&n<b)])].sort((a,b)=>a-b),xs=axis(domain.left,domain.right,'left','right'),ys=axis(domain.top,domain.bottom,'top','bottom');
 let distance=Infinity,nearest=null;
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
  const mx=(xs[i]+xs[i+1])/2,my=(ys[j]+ys[j+1])/2;if(blocked.some(r=>mx>r.left&&mx<r.right&&my>r.top&&my<r.bottom))continue;
  const x=Math.max(xs[i],Math.min(head.x,xs[i+1])),y=Math.max(ys[j],Math.min(head.y,ys[j+1])),d=Math.hypot(x-head.x,y-head.y);if(d<distance){distance=d;nearest={x,y}}
 }
 return {minimumHeadDistance:distance,nearest,feasible:distance<=27.5+1e-7};
}
const options={chairmanPresent:true,chairmanSince:at(day,32400).getTime(),chairmanArrivalAt:at(day,32400).getTime()},s=scene.scheduler,report=s.blockPlan(day,0,s.plan(day,options),options).find(e=>e.report),rows=[];
for(const sec of [32400,report.performStart+.001]){
 const snap=s.snapshot(at(day,sec),options);
 for(const floor of ['2f','4f']){
  const people=[...snap.entries,...snap.visitors].filter(p=>p.floor===floor),used=new Set(),sprites=people.map(p=>{const [x,y]=p.position||[p.seat.x,p.seat.y],angle=(p.deskPartner?4:0)*Math.PI/180,sw=w*Math.cos(angle)+h*Math.sin(angle),sh=h*Math.cos(angle)+w*Math.sin(angle);return {id:p.id,left:x*width/100-sw/2,right:x*width/100+sw/2,top:y*height/100-h*.953125-(sh-h),bottom:y*height/100+h*(1-.953125)}});
  const fixed=sprites.map(r=>({...r,left:r.left-1,right:r.right+1,top:r.top-1,bottom:r.bottom+1}));
  for(const m of Object.values(catalog.staff).filter(m=>m.floor===floor)){const a=scene.art.anchors[m.anchor],size=Math.max(16,width*32/1440);fixed.push({left:(a.x+m.offset[0])*width/100-size/2,right:(a.x+m.offset[0])*width/100+size/2,top:(a.y+m.offset[1])*height/100-size,bottom:(a.y+m.offset[1])*height/100})}
  for(const p of people){const r=sprites.find(r=>r.id===p.id),head={x:(r.left+r.right)/2,y:r.top},short=scene.labels.short(p.line,used),pillWidth=measure((p.name||names.get(p.id)||'방문객')+' · '+short)+11;rows.push({sec,floor,id:p.id,line:p.line,short,head,dot:minimum(head,5,5,fixed),pill:{width:pillWidth,height:10,...minimum(head,pillWidth,10,fixed)},metric:'fixed sprites/mascots only; no other labels; Node approximate boxes'})}
 }
}
fs.writeFileSync('artifacts/office-behavior/obr19-fixed-head-space.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows.filter(r=>!r.dot.feasible||r.id===report.report||r.id==='yuna'&&r.floor==='4f')));
