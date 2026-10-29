import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
import {untilOffice} from './hani-office-label-browser-ready.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
const {scene}=loadScene(),s=scene.scheduler,{priority,place}=scene.labels,day='2026-10-22';
const overlap=(a,b)=>a.left<b.right-.01&&a.right>b.left+.01&&a.top<b.bottom-.01&&a.bottom>b.top+.01;
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
function check(floor,groups,obstacles,placements){
 const boxes=[];
 for(const g of groups){const p=placements.get(g.id);if(!p)continue;
  for(const kind of ['name','status']){const b=rect(p[kind].left,p[kind].top,g[kind].width,g[kind].height);assert.ok(b.left>=floor.left&&b.right<=floor.right&&b.top>=floor.top&&b.bottom<=floor.bottom,g.id+' inside');assert.ok(!obstacles.some(o=>overlap(b,o)),g.id+' mascot');assert.ok(!boxes.some(o=>overlap(b,o)),g.id+' label');boxes.push(b)}
  assert.ok(Math.abs(p.name.top-p.status.top-g.status.height-(floor.width<=600?0:2))<1e-9||Math.abs(p.name.top-p.status.top)<1e-9&&Math.abs(p.status.left-p.name.left-g.name.width-(floor.width<=600?0:2))<1e-9,'one adjacent stacked or inline name/status group (floating-point precision)');
 }
}
test('obr16 conversations and greetings precede outings/movement, then ordinary work',()=>{
 assert.equal(priority({partner:'seongmin',plain:'true'}),3);
 assert.equal(priority({partner:'staff',plain:'false'}),3);
 assert.equal(priority({greeting:'true',plain:'false'}),3);
 for(const d of [{walking:'true'},{plain:'false'},{called:'true'},{activity:'meeting'}])assert.equal(priority(d),2);
 assert.equal(priority({plain:'true',activity:'work'}),1);
 // Capacity for exactly two groups: both report lines win over a walking and idle actor.
 const floor=rect(0,0,132,66),actor=rect(61,44,10,10),group=(id,data)=>({id,priority:priority(data),actor,name:rect(0,0,24,13),status:rect(0,0,60,13)});
 const groups=[group('idle',{plain:'true'}),group('walking',{walking:'true'}),group('staff',{partner:'seongmin'}),group('seongmin',{partner:'staff'})],p=place(floor,groups);
 assert.ok(p.get('staff')&&p.get('seongmin'));assert.equal(p.get('idle'),null);assert.equal(p.get('walking'),null);check(floor,groups,[],p);
});
test('obr16 side lanes keep eight identical-column label groups within obr17 nearby limits',()=>{
 const floor=rect(0,0,300,84),actor=rect(140,35,20,30),groups=Array.from({length:8},(_,i)=>({id:String(i),priority:1,actor,name:rect(0,0,30,14),status:rect(0,0,66,16)})),p=place(floor,groups);
 assert.equal([...p.values()].filter(Boolean).length,8);assert.ok(new Set([...p.values()].map(p=>p.status.left)).size>=4);check(floor,groups,[],p);
 assert.deepEqual([...place(floor,groups.toReversed())],[...p],'deterministic order independent of input');
});
test('obr16 default short vocabulary unchanged; phone lines <=8, semantic travel/report/greeting preserved',()=>{
 const examples=[['커피 사러 가는 중이에요','커피 사러 이동'],['택배 찾으러 가는 중이에요','택배 찾기 이동'],['회의실로 가는 중입니다','용무 보러 이동'],['회장님께 인사 중','회장님께 인사'],['좋아요, 이대로 갑시다','좋아요, 갑시다']];
 for(const [line,expected]of examples){const short=s.shortLine(line,8);assert.equal(short,expected);assert.ok([...short].length<=8);assert.doesNotMatch(short,/…|\.\.\./)}
 assert.match(s.shortLine('회장님께 배포 일정 보고 중',8),/배포.*보고/);
 assert.match(s.shortLine('회장님께 인사 중',8),/회장님.*인사/);
 assert.match(s.shortLine('사무실로 돌아가는 중입니다',8),/복귀/);
 const seen=new Set();
 for(let sec=0;sec<86400;sec+=17)for(const p of s.snapshot(at(day,sec),{chairmanPresent:true}).entries){const line=s.shortLine(p.line,8);seen.add(line);assert.ok([...line].length<=8,p.line);assert.doesNotMatch(line,/…|\.\.\./);assert.equal(s.shortLine(p.line),p.shortLine)}
 console.log('phone vocabulary',seen.size,[...seen]);
});
test('obr16 real snapshot coordinates + synthetic label metrics: all floors/times, mascot obstacles and solver cost',()=>{
 const catalog=JSON.parse(fs.readFileSync('assets/data/desk-mascots-v1.json')),summary=[];
 const textWidth=(text,size)=>[...text].reduce((w,c)=>w+(/\s/.test(c)?size*.35:/[\x00-\x7f]/.test(c)?size*.6:size),0);
 for(const width of [300,342,1348]){
  const floor=rect(0,0,width,width*941/1672),costs=[],ratios=[],failures=[];
  const arrival=at(day,32400).getTime(),options={chairmanPresent:true,chairmanSince:arrival,chairmanArrivalAt:arrival};
  const times=Array.from({length:61},(_,i)=>32400+i*600);
  for(const e of s.blockPlan(day,0,s.plan(day,options),options).filter(e=>e.report))times.push(e.performStart+1,e.performEnd-.001);
  for(const sec of times){const snap=s.snapshot(at(day,sec),options);
   for(const f of scene.floors){
    const obstacles=Object.values(catalog.staff).filter(m=>m.floor===f.id).map(m=>{const a=scene.art.anchors[m.anchor],size=Math.max(16,width*32/1440);return rect((a.x+m.offset[0])*width/100-size/2,(a.y+m.offset[1])*floor.height/100-size,size,size)});
    const people=[...snap.entries,...snap.visitors].filter(p=>p.floor===f.id),groups=people.map(p=>{const xy=p.position||[p.seat.x,p.seat.y],line=width<=600?s.shortLine(p.line,8):p.line;return {id:p.id,priority:priority({partner:p.deskPartner,greeting:String(p.behaviorKind==='chairman-greeting'||p.id==='seongmin'&&people.some(q=>q.behaviorKind==='chairman-greeting')),walking:String(p.walking),plain:String(!!p.plain)}),actor:rect(xy[0]*width/100-15,xy[1]*floor.height/100-40,30,40),name:rect(0,0,42,width<=600?11:16.5),status:rect(0,0,Math.min(width<=600?Infinity:150,textWidth(line,width<=600?10:12)+(width<=600?6:8)),width<=600?13:17)}});
    const before=performance.now(),p=place(floor,groups,obstacles);costs.push(performance.now()-before);check(floor,groups,obstacles,p);
    if(groups.length){const ratio=[...p.values()].filter(Boolean).length/groups.length;ratios.push(ratio);if(ratio<(width<=600?.7:.85))failures.push({sec,floor:f.id,ratio});}
    for(const g of groups.filter(g=>g.priority===3))assert.ok(p.get(g.id),width+' '+sec+' dialogue '+g.id);
   }
  }
  summary.push({width,metrics:'synthetic, not browser pixels',minimumRatio:Math.min(...ratios),samples:costs.length,meanMs:costs.reduce((a,b)=>a+b,0)/costs.length,maxMs:Math.max(...costs),failures});
  assert.deepEqual(failures,[]);
 }
 fs.writeFileSync('artifacts/office-behavior/obr16-layout-node.json',JSON.stringify(summary,null,2)+'\n');console.log('Node geometry only',summary);
});
test('obr16 frozen page clock polling runs on Node without in-page timer APIs',async()=>{
 let calls=0;const page={evaluate:async()=>++calls===3};await untilOffice(page,()=>false,null,1000);assert.equal(calls,3);
 await assert.rejects(untilOffice({evaluate:async()=>false},()=>false,null,1),/readiness timeout/);
});
test('obr16 actual DOM owner applies grouped geometry through its public scene API, preserves slots and feet',()=>{
 const table=JSON.parse(fs.readFileSync('assets/data/office-actions-221.json')),f=fixture('09:00',false,null,table),map=f.ids.get('haniOfficeMap'),actors=[...f.ids.get('haniOfficeActors').children],floor=rect(0,0,342,342*941/1672);
 // The normal engine double has no geometry. Supply explicit synthetic rectangles
 // so this test executes fitStatusLabels rather than its no-layout early return.
 const proto=Object.getPrototypeOf(map);
 proto.getBoundingClientRect=function(){
  if(this===map)return floor;
  if(this.className==='hani-office-actor')return rect(parseFloat(this.style.left)*floor.width/100-15,parseFloat(this.style.top)*floor.height/100-40,30,40);
  if(['hani-office-name','hani-office-status'].includes(this.className)){
   const kind=this.className.endsWith('name')?'name':'status',a=this.parentElement.getBoundingClientRect(),width=kind==='name'?42:80;
   return rect(a.left+a.width/2-width/2+parseFloat(this.style['--'+kind+'-x']||0),a.top+(kind==='name'?40:-20)+parseFloat(this.style['--'+kind+'-y']||0),width,16);
  }
  return rect(0,0,0,0);
 };
 f.setDateTime(at(day,32400));f.context.window.HaniOfficePresence={chairman:'active'};f.click('4f');
 assert.equal(map.dataset.labelsReady,'4f');assert.equal(map.dataset.labelsAt,String(at(day,32400).getTime()));
 const feet=actors.map(a=>[a.style.left,a.style.top]);f.click('4f');assert.deepEqual(actors.map(a=>[a.style.left,a.style.top]),feet);assert.deepEqual([...f.ids.get('haniOfficeActors').children],actors);
 const boxes=[];for(const a of f.visible())for(const kind of ['name','status']){const n=a.querySelector('.hani-office-'+kind);assert.ok(n.officeLabelPlacement);assert.notEqual(n.style.visibility,'hidden');const b=n.getBoundingClientRect();assert.ok(!boxes.some(r=>overlap(b,r)));boxes.push(b)}
 assert.ok(boxes.length>=4);assert.equal(f.timers.length,2);
});
