import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const {scene}=loadScene(),s=scene.scheduler,day='2026-10-22';
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const overlap=(a,b)=>a.left<b.right-1e-7&&a.right>b.left+1e-7&&a.top<b.bottom-1e-7&&a.bottom>b.top+1e-7;
test('obr17 actual atlas proportions / phone dimensions: ratios, dialogue, all sprite/face/label/mascot/bounds and nearby limit',()=>{
 const catalog=JSON.parse(fs.readFileSync('assets/data/desk-mascots-v1.json')),summary=[];
 const manifest=JSON.parse(fs.readFileSync('assets/sprites-v2/manifest.json')),names=new Map(manifest.entries.map(e=>[e.id,e.name]));
 const measure=(text,size)=>[...text].reduce((w,c)=>w+(/\s/.test(c)?size*.35:/[\x00-\x7f]/.test(c)?size*.6:size),0);
 const arrival=at(day,32400).getTime(),options={chairmanPresent:true,chairmanSince:arrival,chairmanArrivalAt:arrival},times=Array.from({length:61},(_,i)=>32400+i*600);
 for(const e of s.blockPlan(day,0,s.plan(day,options),options).filter(e=>e.report))times.push(e.performStart+.001,e.performEnd-.001);
 for(const width of [300,342,1348]){
  const floor=rect(0,0,width,width*941/1672),ratios=[],costs=[],failures=[],counts={sprite:0,face:0,label:0,mascot:0,outside:0,distant:0,dialogue:0};
  for(const sec of times){const snap=s.snapshot(at(day,sec),options);
   for(const f of scene.floors){
    const phone=width<=600,h=Math.max(40,width*.068),w=h*.75,people=[...snap.entries,...snap.visitors].filter(p=>p.floor===f.id);
    const groups=people.map(p=>{const xy=p.position||[p.seat.x,p.seat.y],actor=rect(xy[0]*width/100-w/2,xy[1]*floor.height/100-h*.953125,w,h),line=phone?s.shortLine(p.line,8):p.line;
     // The real sprite turn changes the DOM bounding box. Synthetic envelope
     // encloses +/-4deg partner rotation + 1.2% idle stretch about the foot.
     const pad=p.deskPartner?h*.075:0,sprite=rect(actor.left-pad,actor.top-pad,actor.width+pad*2,actor.height+pad*2);
     return {id:p.id,priority:scene.labels.priority({partner:p.deskPartner,greeting:String(p.behaviorKind==='chairman-greeting'||p.id==='seongmin'&&people.some(q=>q.behaviorKind==='chairman-greeting')),walking:String(p.walking),plain:String(!!p.plain)}),actor,sprite,name:rect(0,0,phone?measure(names.get(p.id)||'방문객',10)+20:Math.min(w*1.3,measure(names.get(p.id)||'방문객',Math.min(12,width*.0085))+12),phone?11:17),status:rect(0,0,Math.min(phone?Infinity:150,measure(line,phone?10:Math.min(12,width*.009))+ (phone?6:12)),phone?13:22)};
    });
    const obstacles=Object.values(catalog.staff).filter(m=>m.floor===f.id).map(m=>{const a=scene.art.anchors[m.anchor],size=Math.max(16,width*32/1440);return rect((a.x+m.offset[0])*width/100-size/2,(a.y+m.offset[1])*floor.height/100-size,size,size)});
    const begin=performance.now(),p=scene.labels.place(floor,groups,obstacles);costs.push(performance.now()-begin);const boxes=[];
    for(const g of groups){const placement=p.get(g.id);if(g.priority===3&&!placement)counts.dialogue++;if(!placement)continue;
     const groupBoxes=['name','status'].map(k=>rect(placement[k].left,placement[k].top,g[k].width,g[k].height)),left=Math.min(...groupBoxes.map(b=>b.left)),right=Math.max(...groupBoxes.map(b=>b.right)),top=Math.min(...groupBoxes.map(b=>b.top)),bottom=Math.max(...groupBoxes.map(b=>b.bottom));
     if(Math.abs((left+right)/2-(g.actor.left+g.actor.width/2))>Math.max(w*1.5,phone?96:100)+1e-7||bottom<g.actor.top-Math.max(h*2,64)-1e-7||top>g.actor.bottom+Math.max(h*2,64)+1e-7)counts.distant++;
     for(const b of groupBoxes){if(b.left<floor.left||b.right>floor.right||b.top<floor.top||b.bottom>floor.bottom)counts.outside++;
      if(groups.some(q=>q.id!==g.id&&overlap(b,q.sprite)))counts.sprite++;
      if(overlap(b,rect(g.actor.left,g.actor.top,w,h*.65)))counts.face++;
      if(obstacles.some(r=>overlap(b,r)))counts.mascot++;if(boxes.some(r=>overlap(b,r)))counts.label++;boxes.push(b);
     }
    }
    if(groups.length){const ratio=[...p.values()].filter(Boolean).length/groups.length;ratios.push(ratio);if(ratio<(phone?.7:.85))failures.push({sec,floor:f.id,ratio,hidden:groups.filter(g=>!p.get(g.id)).map(g=>g.id)})}
   }
  }
  summary.push({width,metrics:'Node synthetic font/animation geometry, not browser pixels',samples:costs.length,minimumRatio:Math.min(...ratios),meanMs:costs.reduce((a,b)=>a+b,0)/costs.length,maxMs:Math.max(...costs),counts,failures});
 }
 fs.writeFileSync('artifacts/office-behavior/obr17-layout-node.json',JSON.stringify(summary,null,2)+'\n');console.log(summary);
 for(const row of summary){assert.deepEqual(row.counts,{sprite:0,face:0,label:0,mascot:0,outside:0,distant:0,dialogue:0});assert.deepEqual(row.failures,[],String(row.width))}
});
test('obr17 actor context removed; canonical layers, atlas pivot and compact >=10px are explicit',()=>{
 const css=fs.readFileSync('hani-office-live.css','utf8'),js=fs.readFileSync('hani-office-live.js','utf8'),rule=c=>css.match(new RegExp('\\.'+c+'\\{([^}]+)\\}'))[1];
 assert.doesNotMatch(rule('hani-office-actor'),/z-index|transform:|translate:|opacity:/);assert.doesNotMatch(js,/actor.style.(?:zIndex|transform)\s*=/);
 const z=c=>Number([...css.matchAll(new RegExp('\\.'+c+'\\{([^}]+)\\}','g'))].map(m=>m[1].match(/z-index:(\d+)/)).find(Boolean)[1]);
 assert.ok(z('hani-office-desk-props')<4&&z('hani-office-room-plate')<4);assert.equal(z('hani-office-sprite'),4);assert.equal(z('hani-office-name'),5);assert.equal(z('hani-office-status'),6);assert.equal(z('hani-office-foreground'),8);assert.equal(z('hani-office-character-bubble'),10);
 assert.match(css,/font-size:10px;line-height:1.1;padding:0 2px/);assert.match(css,/margin-left:calc\(var\(--actor-height\)\*var\(--sprite-ratio\)\*var\(--actor-pivot-x,-.5\)\)/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
});
test('obr17 blocked nearby space hides a label instead of sending it to a distant empty desk',()=>{
 const actor=rect(25,110,30,40),group={id:'staff',priority:1,actor,name:rect(0,0,40,11),status:rect(0,0,64,13)};
 const floor=rect(0,0,500,200),blocked=rect(0,0,180,200),placed=scene.labels.place(floor,[group],[blocked]);
 assert.equal(placed.get('staff'),null);
 assert.ok(500-180>group.name.width+group.status.width,'distant free space exists');
});
