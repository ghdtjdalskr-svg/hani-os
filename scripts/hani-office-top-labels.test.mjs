import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {loadScene} from './hani-office-lively-fixture.mjs';
import {readPhoneLabels} from './hani-office-obr18-browser-geometry.mjs';
const {scene}=loadScene();
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const floor=rect(0,0,360,200);
const group=(id,left,top,priority=1)=>({id,compact:true,priority,actor:rect(left,top,30,40),sprite:rect(left,top,30,40),name:rect(0,0,100,10),status:rect(0,0,0,0)});
const box=(g,p)=>rect(p.name.left,p.name.top,p.dot?5:g.name.width,p.dot?5:g.name.height);
const distance=(a,b)=>Math.hypot(Math.max(a.left-b.right,b.left-a.right,0),Math.max(a.top-b.bottom,b.top-a.bottom,0));

test('phone head touching floor top gets a legal adjacent pill and keeps its slot',()=>{
 for(const left of [0,165,330]){
  const g=group('top',left,0),p=scene.labels.place(floor,[g]).get(g.id);
  assert.ok(p&&!p.dot,'top-edge actor must not fall back to dot');
  const b=box(g,p);assert.ok(distance(b,g.sprite)>=1.5-1e-7);assert.ok(distance(b,g.sprite)<=19.5);
  assert.ok(b.left>=.5&&b.right<=floor.right-.5&&b.top>=.5&&b.bottom<=floor.bottom-.5);
 }
});

test('top-edge pill can go below when both sides are blocked',()=>{
 const g=group('top',165,0),obstacles=[rect(0,0,163,40),rect(197,0,163,40)];
 const p=scene.labels.place(floor,[g],obstacles).get(g.id);assert.ok(p&&!p.dot);
 const b=box(g,p);assert.ok(b.top>=g.sprite.bottom+1.5-1e-7);assert.ok(distance(b,g.sprite)<=19.5);
});

test('a wide top-edge guest pill uses a legal side lane beyond the old centre search bound',()=>{
 const g=group('guest',0,0);g.name=rect(0,0,190,10);
 const p=scene.labels.place(floor,[g],[rect(0,42,360,158)]).get(g.id);assert.ok(p&&!p.dot);
 const b=box(g,p);assert.ok(b.left>=g.sprite.right+1.5-1e-7);assert.ok(distance(b,g.sprite)<=19.5);
 assert.ok((b.left+b.right)/2-15>96,'ownership follows sprite distance, even with a wide pill');
});

test('wider top-edge allowance rejects a pill nearer a neighbour and still prioritizes dialogue',()=>{
 const groups=[group('top',100,0),group('neighbour',200,0,3)],p=scene.labels.place(floor,groups);
 assert.ok(p.get('neighbour')&&!p.get('neighbour').dot,'dialogue priority');
 for(const g of groups){const v=p.get(g.id);assert.ok(v&&!v.dot);const b=box(g,v);assert.ok(distance(b,g.sprite)<distance(b,groups.find(q=>q!==g).sprite));}
});

test('ordinary actors keep head reach; top-edge fully blocked space uses a dot',()=>{
 const g=group('ordinary',165,35),p=scene.labels.place(floor,[g]).get(g.id),b=box(g,p);
 assert.ok(Math.hypot((b.left+b.right)/2-180,(b.top+b.bottom)/2-35)<=19.5+1e-7);
 const top=group('top',165,0),blocked=[rect(0,12,360,188),rect(0,0,140,12),rect(220,0,140,12)];
 const dot=scene.labels.place(floor,[top],blocked).get(top.id);assert.ok(dot?.dot,'nothing legal for full pill');
});

test('a legal empty side lane belonging to the neighbour cannot receive the top actor pill',()=>{
 const own=group('own',100,0),neighbour=group('neighbour',245,0),obstacles=[rect(0,0,98,200),rect(130,0,12,200),rect(0,12,360,188)];
 // The only full-pill lane is x=142.5..243.5, y=.5..1.5. It is closer
 // to neighbour than own, despite being within 19.5px of own sprite.
 const p=scene.labels.place(floor,[own,neighbour],obstacles).get(own.id);
 assert.ok(!p||p.dot,'ambiguous free space must never turn into a full label');
});

test('browser distant check accepts only the top-edge nearest-sprite exception, never an ordinary actor or dot',()=>{
 const read=(top,mode='pill',neighbourLeft=null)=>{
  const make=(id,head,b,mode)=>{
   const node=(r,extra={})=>({hidden:false,textContent:'',getBoundingClientRect:()=>r,...extra});
   const name=node(b,{title:'label'}),status=node(rect(0,0,0,0),{dataset:{full:'업무 메모 중'}}),dot=node(rect(0,0,5,5)),sprite=node(head),line=node(b,{textContent:' · 메모쓰기'});
   return {...node(head),dataset:{person:id,labelMode:mode},officeName:{textContent:id},officeCompact:line,querySelector:s=>({'.hani-office-name':name,'.hani-office-status':status,'.hani-office-status-dot':dot,'.hani-office-sprite':sprite,'.hani-office-compact-line':line})[s]};
  };
  const actors=[make('own',rect(165,top,30,40),mode==='dot'?rect(202,top+.5,5,5):rect(196.5,top+.5,100,10),mode)];
  if(neighbourLeft!==null)actors.push(make('neighbour',rect(neighbourLeft,top,30,40),rect(0,100,5,5),'dot'));
  const map={dataset:{floor:'2f'},getBoundingClientRect:()=>floor,querySelectorAll:()=>[]};
  return vm.runInNewContext('('+readPhoneLabels.toString()+')()',{
   document:{getElementById:()=>map,querySelectorAll:()=>actors},matchMedia:()=>({matches:true}),getComputedStyle:()=>({display:'block',visibility:'visible',fontSize:'10px'}),HaniBuildingScene:scene
  });
 };
 assert.equal(read(0).distant.length,0,'top actor can use adjacent pill');
 assert.ok(read(20).distant.some(r=>r[0]==='own'),'ordinary actor keeps head radius');
 assert.ok(read(0,'pill',198).distant.some(r=>r[0]==='own'),'closer neighbour rejects allowance');
 assert.ok(read(0,'dot').distant.some(r=>r[0]==='own'),'dots get no wider allowance');
});
