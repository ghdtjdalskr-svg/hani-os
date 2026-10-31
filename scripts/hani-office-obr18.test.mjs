import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
const {scene}=loadScene(),s=scene.scheduler,day='2026-10-22';
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const overlap=(a,b)=>a.left<b.right-1e-7&&a.right>b.left+1e-7&&a.top<b.bottom-1e-7&&a.bottom>b.top+1e-7;
// Independent assertion: head reach remains mandatory except for top-blocked
// text pills beside/below their uniquely closest sprite. Dots keep old reach.
const nearby=(floor,groups,g,b,dot=false,ownBody=false)=>{
 const h=g.sprite||g.actor,reach=dot||g.priority===3?27.5:19.5;
 if(ownBody)return !dot&&b.top>h.top+h.height*.6&&b.bottom<=h.bottom&&Math.abs(b.left+b.right-h.left-h.right)<1e-7&&groups.every(q=>q===g||!overlap(b,q.sprite||q.actor));
 if(Math.hypot((b.left+b.right-h.left-h.right)/2,(b.top+b.bottom)/2-h.top)<=reach+1e-7)return true;
 const distance=(a,c)=>Math.hypot(Math.max(a.left-c.right,c.left-a.right,0),Math.max(a.top-c.bottom,c.top-a.bottom,0)),own=distance(b,h);
 const beside=(b.right<=h.left||b.left>=h.right)&&b.top<h.bottom&&b.bottom>h.top,below=b.top>=h.bottom&&b.left<h.right&&b.right>h.left;
 return !dot&&h.top-floor.top<g.name.height+Math.max(1,h.height*.02)+1&&(beside||below)&&own<=19.5+1e-7&&groups.every(q=>q===g||own+1e-7<distance(b,q.sprite||q.actor));
};
test('obr19 original >=40px atlas / phone dimensions: measured ratios, mandatory dialogue, all sprite/face/label/mascot/bounds and nearby limit',()=>{
 const catalog=JSON.parse(fs.readFileSync('assets/data/desk-mascots-v1.json')),summary=[];
 const manifest=JSON.parse(fs.readFileSync('assets/sprites-v2/manifest.json')),names=new Map(manifest.entries.map(e=>[e.id,e.name.split('/')[0]]));
 names.set('seongmin','회장님');
 const measure=(text,size)=>[...text].reduce((w,c)=>w+(/\s|·/.test(c)?size*.35:/[\x00-\x7f]/.test(c)?size*.6:size),0);
 const arrival=at(day,32400).getTime(),options={chairmanPresent:true,chairmanSince:arrival,chairmanArrivalAt:arrival},times=[...new Set([...Array.from({length:61},(_,i)=>32400+i*600),33300,43800,56400])];
 for(const e of s.blockPlan(day,0,s.plan(day,options),options).filter(e=>e.report))times.push(e.performStart+.001,e.performEnd-.001);
 for(const width of [300,342,1348]){
  const floor=rect(0,0,width,width*941/1672),ratios=[],scenes=[],costs=[],failures=[],spritePairs=[],missingDots=[],counts={sprite:0,face:0,label:0,mascot:0,outside:0,distant:0,dialogue:0};
  for(const sec of times){const snap=s.snapshot(at(day,sec),options);
   for(const f of scene.floors){
    const phone=width<=600,h=Math.max(40,width*.068),w=h*.75,people=[...snap.entries,...snap.visitors].filter(p=>p.floor===f.id);
    const used=new Set(),groups=people.map(p=>{const xy=p.position||[p.seat.x,p.seat.y],actor=rect(xy[0]*width/100-w/2,xy[1]*floor.height/100-h*.953125,w,h),line=phone?scene.labels.short(p.line,used):p.line;
     // Static 4deg partner bounding size; runtime reserves idle motion separately.
     // This is a synthetic box, not proof of animated browser pixels.
     const angle=(p.deskPartner?4:0)*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle),sw=w*c+h*sn,sh=h*c+w*sn;
     const sprite=rect(actor.left-(sw-w)/2,actor.top-(sh-h),sw,sh);
     return {id:p.id,compact:phone,priority:scene.labels.priority({partner:p.deskPartner,greeting:String(p.behaviorKind==='chairman-greeting'||p.id==='seongmin'&&people.some(q=>q.behaviorKind==='chairman-greeting')),walking:String(p.walking),plain:String(!!p.plain)}),actor,sprite,nameOnly:rect(0,0,measure(p.name||names.get(p.id)||'방문객',10)+10,10),name:rect(0,0,phone?measure(p.name||names.get(p.id)||'방문객',10)+measure('·'+line,10)+11:Math.min(w*1.3,measure(p.name||names.get(p.id)||'방문객',Math.min(12,width*.0085))+12),phone?10:17),status:rect(0,0,Math.min(phone?Infinity:150,measure(line,phone?10:Math.min(12,width*.009))+ (phone?6:12)),phone?13:22)};
    });
    const obstacles=Object.values(catalog.staff).filter(m=>m.floor===f.id).map(m=>{const a=scene.art.anchors[m.anchor],size=Math.max(16,width*32/1440);return rect((a.x+m.offset[0])*width/100-size/2,(a.y+m.offset[1])*floor.height/100-size,size,size)});
    const begin=performance.now(),p=scene.labels.place(floor,groups,obstacles);costs.push(performance.now()-begin);const boxes=[];
    for(const g of groups)if(phone&&!p.get(g.id))missingDots.push({sec,floor:f.id,id:g.id});
    for(let i=0;i<groups.length;i++)for(const q of groups.slice(i+1))if(overlap(groups[i].sprite,q.sprite))spritePairs.push({sec,floor:f.id,ids:[groups[i].id,q.id],walking:people.filter(p=>p.id===groups[i].id||p.id===q.id).some(p=>p.walking)});
    for(const g of groups){const placement=p.get(g.id);if(g.priority===3&&(!placement||placement.dot||placement.mode==='name')){counts.dialogue++;failures.push({sec,floor:f.id,id:g.id,actor:g.actor,line:people.find(p=>p.id===g.id).line,head:g.sprite})}if(!placement)continue;
     const groupBoxes=(phone?['name']:['name','status']).map(k=>rect(placement[k].left,placement[k].top,placement.dot?5:placement.mode==='name'?g.nameOnly.width:g[k].width,placement.dot?5:placement.mode==='name'?g.nameOnly.height:g[k].height)),left=Math.min(...groupBoxes.map(b=>b.left)),right=Math.max(...groupBoxes.map(b=>b.right)),top=Math.min(...groupBoxes.map(b=>b.top)),bottom=Math.max(...groupBoxes.map(b=>b.bottom));
     if(phone?!nearby(floor,groups,g,{left,right,top,bottom},placement.dot,placement.ownBody):Math.abs((left+right)/2-(g.actor.left+g.actor.width/2))>Math.max(w*1.5,100)+1e-7||bottom<g.actor.top-Math.max(h*2,64)-1e-7||top>g.actor.bottom+Math.max(h*2,64)+1e-7)counts.distant++;
     for(const b of groupBoxes){if(b.left<floor.left||b.right>floor.right||b.top<floor.top||b.bottom>floor.bottom)counts.outside++;
      if(groups.some(q=>q.id!==g.id&&overlap(b,q.sprite)))counts.sprite++;
      if(overlap(b,rect(g.sprite.left,g.sprite.top,g.sprite.width,g.sprite.height*(placement.ownBody ? .6 : .65))))counts.face++;
      if(obstacles.some(r=>overlap(b,r)))counts.mascot++;if(boxes.some(r=>overlap(b,r)))counts.label++;boxes.push(b);
     }
    }
    if(groups.length){const ratio=[...p.values()].filter(p=>p&&!p.dot&&p.mode!=='name').length/groups.length;ratios.push(ratio);scenes.push({sec,floor:f.id,people:groups.length,pills:[...p.values()].filter(p=>p&&!p.dot&&p.mode!=='name').length,names:[...p.values()].filter(p=>p?.mode==='name').length,dots:[...p.values()].filter(p=>p?.dot).length,missing:groups.filter(g=>!p.get(g.id)).map(g=>g.id),ratio});if(!phone&&ratio<.85)failures.push({sec,floor:f.id,ratio,hidden:groups.filter(g=>!p.get(g.id)||p.get(g.id).dot).map(g=>g.id)})}
    else scenes.push({sec,floor:f.id,people:0,pills:0,dots:0,missing:[],ratio:null});
   }
  }
  summary.push({width,metrics:'Node synthetic font/animation geometry, not browser pixels',samples:costs.length,scenes,minimumRatio:Math.min(...ratios),meanMs:costs.reduce((a,b)=>a+b,0)/costs.length,maxMs:Math.max(...costs),counts,failures,missingDots,spritePairs});
 }
 fs.writeFileSync('artifacts/office-behavior/'+(process.env.HANI_OFFICE_TEST_TAG||'obr19')+'-layout-node.json',JSON.stringify(summary,null,2)+'\n');console.log(summary.map(({scenes,spritePairs,...r})=>({...r,spritePairs:spritePairs.length})));
 // obr19: phone coverage is measured. Geometry, both dialogue lines and dots
 // remain mandatory, including when the original >=40px sprites cannot fit.
 for(const row of summary.filter(row=>row.width!==300)){assert.deepEqual(row.counts,{sprite:0,face:0,label:0,mascot:0,outside:0,distant:0,dialogue:0});assert.deepEqual(row.failures,[],String(row.width));assert.deepEqual(row.missingDots,[],'suppressed actors retain dots');}
});
test('obr18 suppressed pills retain collision-free nearby dots; dots excluded from visible count',()=>{
 const floor=rect(0,0,140,90),actor=rect(62.5,50,15,20),groups=Array.from({length:5},(_,i)=>({id:String(i),compact:true,priority:i?1:3,actor,sprite:actor,name:rect(0,0,100,10),status:rect(0,0,0,0)})),p=scene.labels.place(floor,groups);
 assert.ok(p.get('0')&&!p.get('0').dot,'priority conversation keeps its pill');assert.ok([...p.values()].some(v=>v?.dot));const boxes=[];
 for(const g of groups){const v=p.get(g.id);assert.ok(v,'each suppressed person retains a dot');const b=rect(v.name.left,v.name.top,v.dot?5:100,v.dot?5:10);assert.ok(Math.hypot((b.left+b.right)/2-70,(b.top+b.bottom)/2-50)<=28+1e-7);assert.ok(!overlap(b,actor));assert.ok(!boxes.some(q=>overlap(b,q)));boxes.push(b)}
});
test('obr18 mobile actual owner keeps one merged slot, full tap source, feet and persistent nodes through updates',()=>{
 const table=JSON.parse(fs.readFileSync('assets/data/office-actions-221.json')),f=fixture('09:00',false,null,table,{matchMedia:q=>({matches:q==='(max-width:600px)',addEventListener(){}})}),map=f.ids.get('haniOfficeMap'),floor=rect(0,0,342,342*941/1672),actors=[...f.ids.get('haniOfficeActors').children],nodes=actors.map(a=>[a.querySelector('.hani-office-name'),a.querySelector('.hani-office-status'),a.officeCompact]);
 const proto=Object.getPrototypeOf(map);proto.getBoundingClientRect=function(){
  if(this===map)return floor;
  if(this.className==='hani-office-actor')return rect(parseFloat(this.style.left)*floor.width/100-15,parseFloat(this.style.top)*floor.height/100-40*.953125,30,40);
  if(this.className==='hani-office-sprite')return this.parentElement.getBoundingClientRect();
  if(this.className==='hani-office-name'){const a=this.parentElement,head=a.getBoundingClientRect(),dot=a.dataset.labelMode==='dot',width=dot?5:[...a.officeName.textContent+(a.dataset.labelMode==='name'?'':a.officeCompact.textContent)].reduce((w,c)=>w+(c==='·'?3.5:10),11),height=dot?5:10;return rect(head.left+head.width/2-width/2+parseFloat(this.style['--name-x']||0),head.bottom-height+parseFloat(this.style['--name-y']||0),width,height)}
  return rect(0,0,0,0);
 };
 f.setDateTime(at(day,32400));f.context.window.HaniOfficePresence={chairman:'active'};
 for(const id of ['4f','2f','1f','3f','4f']){f.click(id);assert.equal(map.dataset.labelsReady,id);const feet=f.visible().map(a=>[a.style.left,a.style.top]);f.click(id);assert.deepEqual(f.visible().map(a=>[a.style.left,a.style.top]),feet);
  for(const a of f.visible()){const n=a.querySelector('.hani-office-name'),status=a.querySelector('.hani-office-status');assert.equal(status.hidden,true);assert.equal(status.textContent,status.dataset.full);assert.match(a.officeCompact.textContent,/^ · /);assert.ok([...a.officeCompact.textContent.slice(3)].length<=6);assert.ok(n.title.includes(status.dataset.full));assert.ok(n.officeLabelPlacement);assert.notEqual(n.style.visibility,'hidden');const b=n.getBoundingClientRect(),head=a.getBoundingClientRect();const groups=f.visible().map(a=>({id:a.dataset.person,sprite:a.getBoundingClientRect(),name:{height:10},priority:scene.labels.priority(a.dataset)})),g=groups.find(g=>g.id===a.dataset.person);assert.ok(nearby(floor,groups,g,b,a.dataset.labelMode==='dot',a.dataset.labelMode==='name'&&overlap(b,head)))}
 }
 assert.deepEqual([...f.ids.get('haniOfficeActors').children],actors);assert.deepEqual(actors.map(a=>[a.querySelector('.hani-office-name'),a.querySelector('.hani-office-status'),a.officeCompact]),nodes);assert.equal(f.timers.length,2);
});
test('obr18 phone vocabulary preserves report topic, assent and greeting without clipping',()=>{
 assert.match(scene.labels.short('회장님께 배포 일정 보고 중'),/보고/);assert.equal(scene.labels.short('좋아요, 이대로 갑시다'),'진행승인');assert.match(scene.labels.short('회장님께 인사 중'),/인사/);assert.equal(scene.labels.short('커피 한 모금'),'커피마시기');
});
test('obr18 actor context removed; canonical layers, atlas pivot and compact >=10px are explicit',()=>{
 const css=fs.readFileSync('hani-office-live.css','utf8'),js=fs.readFileSync('hani-office-live.js','utf8'),rule=c=>css.match(new RegExp('\\.'+c+'\\{([^}]+)\\}'))[1];
 assert.doesNotMatch(rule('hani-office-actor'),/z-index|transform:|translate:|opacity:/);assert.doesNotMatch(js,/actor.style.(?:zIndex|transform)\s*=/);
 const z=c=>Number([...css.matchAll(new RegExp('\\.'+c+'\\{([^}]+)\\}','g'))].map(m=>m[1].match(/z-index:(\d+)/)).find(Boolean)[1]);
 assert.ok(z('hani-office-desk-props')<4&&z('hani-office-room-plate')<4);assert.equal(z('hani-office-sprite'),4);assert.equal(z('hani-office-name'),5);assert.equal(z('hani-office-status'),6);assert.equal(z('hani-office-foreground'),8);assert.equal(z('hani-office-character-bubble'),10);
 assert.match(css,/font-size:10px;line-height:1.1;padding:0 2px/);assert.match(css,/margin-left:calc\(var\(--actor-height\)\*var\(--sprite-ratio\)\*var\(--actor-pivot-x,-.5\)\)/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|supabase|\.setItem\(|\.removeItem\(/);
});
test('obr18 blocked nearby space hides a label instead of sending it to a distant empty desk',()=>{
 const actor=rect(25,110,30,40),group={id:'staff',priority:1,actor,name:rect(0,0,40,11),status:rect(0,0,64,13)};
 const floor=rect(0,0,500,200),blocked=rect(0,0,180,200),placed=scene.labels.place(floor,[group],[blocked]);
 assert.equal(placed.get('staff'),null);
 assert.ok(500-180>group.name.width+group.status.width,'distant free space exists');
});
