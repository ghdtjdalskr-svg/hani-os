// Synthetic geometry + actual owner execution. Real browser pixels are reviewed separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadScene} from './hani-office-lively-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {readPhoneLabels,assertPhoneLabels} from './hani-office-obr18-browser-geometry.mjs';
const {scene}=loadScene();
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const floor=rect(0,0,368,210),overlap=(a,b)=>a.left<b.right-1e-7&&a.right>b.left+1e-7&&a.top<b.bottom-1e-7&&a.bottom>b.top+1e-7;
const gap=(a,b)=>Math.hypot(Math.max(a.left-b.right,b.left-a.right,0),Math.max(a.top-b.bottom,b.top-a.bottom,0));
const group=(id,left,top,priority=1)=>{const actor=rect(left,top,30,40);return {id,compact:true,priority,actor,sprite:actor,name:rect(0,0,85,10),nameOnly:rect(0,0,31,10),status:rect(0,0,0,0)}};
const row=(count=5,step=38)=>Array.from({length:count},(_,i)=>group(String(i),10+i*step,120,i===1?3:1));
const box=(g,p)=>rect(p.name.left,p.name.top,p.dot?5:p.mode==='name'?g.nameOnly.width:g.name.width,p.dot?5:10);
function legal(groups,placements,obstacles=[],bounds=floor){
 const boxes=[];
 for(const g of groups){const p=placements.get(g.id);assert.ok(p,g.id+' retains a label');const b=box(g,p);
  assert.ok(b.left>=bounds.left+.5&&b.right<=bounds.right-.5&&b.top>=bounds.top+.5&&b.bottom<=bounds.bottom-.5);
  assert.ok(groups.every(q=>q===g&&p.ownBody||!overlap(b,q.sprite)),'only own-body tags may overlap own sprite');assert.ok(obstacles.every(o=>!overlap(b,o)),'no mascot overlap');assert.ok(boxes.every(o=>!overlap(b,o)),'no label overlap');boxes.push(b);
  const head=g.sprite,distance=Math.hypot((b.left+b.right-head.left-head.right)/2,(b.top+b.bottom)/2-head.top),reach=p.dot||g.priority===3?27.5:19.5;
  const beside=(b.right<=head.left||b.left>=head.right)&&b.top<head.bottom&&b.bottom>head.top,below=b.top>=head.bottom&&b.left<head.right&&b.right>head.left;
  if(p.ownBody){assert.equal(p.mode,'name');assert.ok(b.top>head.top+head.height*.6&&b.bottom<=head.bottom,'tag stays wholly below face zone');assert.ok(Math.abs(b.left+b.right-head.left-head.right)<1e-7,'centred on own sprite');}
  assert.ok(p.ownBody||distance<=reach+1e-7||!p.dot&&head.top-bounds.top<11+Math.max(1,head.height*.02)&&(beside||below)&&gap(b,head)<=19.5,'head reach or measured own-body/top-edge exception');
  const toHead=s=>Math.hypot((b.left+b.right-s.left-s.right)/2,(b.top+b.bottom)/2-s.top);
  if(p.mode==='name'||distance>reach)assert.ok(groups.every(q=>q===g||gap(b,head)+1e-7<gap(b,q.sprite)||Math.abs(gap(b,head)-gap(b,q.sprite))<=1e-7&&toHead(head)+1e-7<toHead(q.sprite)),'uniquely nearest own sprite, or nearest head when sprites touch');
 }
}

test('touching sprites in one desk row all keep their names above their own heads',()=>{
 const groups=[0,1,2].map(i=>{const g=group('touching'+i,100+i*30,100);g.name=rect(0,0,400,10);g.nameOnly=rect(0,0,25,10);return g});
 const placed=scene.labels.place(floor,groups);
 for(const g of groups){const p=placed.get(g.id);assert.equal(p?.mode,'name',g.id);assert.ok(!p.ownBody,g.id+' uses the free space above');}
 legal(groups,placed);
});

test('crowded 38px desk row upgrades a former dot to name without moving dialogue or full pills',()=>{
 const groups=row(),mascots=[rect(310,95,16,16)],baseline=scene.labels.place(floor,groups.map(({nameOnly,...g})=>g),mascots),placed=scene.labels.place(floor,groups,mascots);
 assert.ok(baseline.get('0').dot,'reproduces old full-to-dot fallback');assert.equal(placed.get('0').mode,'name');
 assert.ok(!placed.get('1').dot&&!placed.get('1').mode,'dialogue remains full');
 for(const g of groups)if(baseline.get(g.id)&&!baseline.get(g.id).dot)assert.deepEqual(placed.get(g.id),baseline.get(g.id),'all full placements frozen before names');
 legal(groups,placed,mascots);
});

test('names precede last-resort dots; all three modes remain collision-free and deterministic',()=>{
 const groups=row(6,30),placed=scene.labels.place(floor,groups);
 assert.ok([...placed.values()].some(p=>p?.mode==='name'));assert.ok([...placed.values()].some(p=>p?.dot));legal(groups,placed);
 assert.equal(JSON.stringify([...scene.labels.place(floor,groups.toReversed())]),JSON.stringify([...placed]));
});

test('top-edge full pill allowance survives; a smaller name uses the same legal side lane',()=>{
 const g=group('top',165,0),full=scene.labels.place(floor,[g]);assert.ok(!full.get(g.id).dot&&!full.get(g.id).mode);legal([g],full);
 const obstacles=[rect(0,0,163.5,210),rect(228,0,140,210),rect(0,42,368,168)],placed=scene.labels.place(floor,[g],obstacles);
 assert.equal(placed.get(g.id).mode,'name');assert.ok(box(g,placed.get(g.id)).left>=196.5-1e-7);legal([g],placed,obstacles);
});

test('a name cannot escape ordinary head reach to a distant free desk',()=>{
 const g=group('blocked',165,120),placed=scene.labels.place(floor,[g],[rect(140,85,110,125)]);
 assert.equal(placed.get(g.id),null,'fully blocked nearby sprite cannot use remote empty space');
});

test('seated 3F row under another row gets own-body names without covering faces or moving full pills',()=>{
 const w=368,h=w*941/1672,bounds=rect(0,0,w,h),groups=scene.floors.find(f=>f.id==='3f').residents.map(id=>{const seat=scene.homeSeat(id),g=group(id,seat.x*w/100-15,seat.y*h/100-40*.953125);g.name=rect(0,0,81,10);return g});
 const catalog=JSON.parse(fs.readFileSync('assets/data/desk-mascots-v1.json')),mascots=Object.values(catalog.staff).filter(m=>m.floor==='3f').map(m=>{const a=scene.art.anchors[m.anchor];return rect((a.x+m.offset[0])*w/100-8,(a.y+m.offset[1])*h/100-16,16,16)});
 const placed=scene.labels.place(bounds,groups,mascots),noMascots=scene.labels.place(bounds,groups);
 const withoutNames=scene.labels.place(bounds,groups.map(({nameOnly,...g})=>g),mascots);
 for(const id of ['arin','yuri']){const g=groups.find(g=>g.id===id);assert.ok(withoutNames.get(id).dot,'upper row used to force a dot');assert.ok(placed.get(id).ownBody);assert.ok(noMascots.get(id).ownBody,'upper row still blocks above-head names');assert.ok(!scene.labels.place(bounds,[g],mascots).get(id).mode,'removing other actors frees a full pill');}
 for(const g of groups)if(!withoutNames.get(g.id)?.dot)assert.deepEqual(placed.get(g.id),withoutNames.get(g.id),'full pills remain frozen');
 legal(groups,placed,mascots,bounds);
});

test('body tag wider than a sprite cannot touch a neighbour; keep the nearby dot',()=>{
 const own=group('own',100,100),upper=group('upper',100,54.5),neighbour=group('neighbour',132,100);
 own.nameOnly=rect(0,0,34,10);const groups=[own,upper,neighbour],placed=scene.labels.place(floor,groups);
 assert.ok(placed.get('own')?.dot,'centred wide name reaches neighbour boundary');legal(groups,placed);
});

test('own-body name stays below face and clamps to floor; reject floor/mascot blocked bodies',()=>{
 const own=group('own',100,100),upper=group('upper',100,54.5),groups=[own,upper];
 const bounds=rect(0,0,368,136),p=scene.labels.place(bounds,groups);assert.ok(p.get('own').ownBody);assert.equal(box(own,p.get('own')).bottom,135.5);legal(groups,p,[],bounds);
 for(const bounds of [rect(0,0,368,134),rect(0,0,368,125)]){
  const obstacles=[rect(98,125,34,15)],p=scene.labels.place(bounds,groups,obstacles);assert.ok(!p.get('own')?.ownBody);legal(groups,p,obstacles,bounds);
 }
});

test('a missing label with no legal head dot is rescued by the same name slot when its lower body is clear',()=>{
 const own=group('minji',100,100),obstacles=[rect(0,0,368,99),rect(0,99,98,42),rect(132,99,236,42)];
 const {nameOnly,...withoutName}=own;assert.equal(scene.labels.place(floor,[withoutName],obstacles).get('minji'),null,'old null placement hides the slot, not an absent actor');
 const p=scene.labels.place(floor,[own],obstacles);assert.ok(p.get('minji').ownBody);legal([own],p,obstacles);
});

function mounted(layout='row'){
 const f=fixture('09:00',false,null,null,{matchMedia:q=>({matches:q==='(max-width:600px)',addEventListener(){}}),setTimeout:()=>0}),layer=f.ids.get('haniOfficeActors');
 f.map.getBoundingClientRect=()=>floor;
 for(const a of layer.children){
  a.getBoundingClientRect=()=>{const seat=scene.homeSeat(a.dataset.person);return layout==='body'&&seat?rect(seat.x*floor.width/100-15,seat.y*floor.height/100-38.125,30,40):rect(10+Math.max(0,f.visible().slice().sort((a,b)=>a.dataset.person.localeCompare(b.dataset.person)).indexOf(a))*38,120,30,40)};a.querySelector('.hani-office-sprite').getBoundingClientRect=()=>a.getBoundingClientRect();
  const name=a.querySelector('.hani-office-name');name.getBoundingClientRect=()=>{const head=a.getBoundingClientRect(),mode=a.dataset.labelMode,w=mode==='dot'?5:mode==='name'?31:85,h=mode==='dot'?5:10;return rect(head.left+15-w/2+parseFloat(name.style['--name-x']||0),head.bottom-h+parseFloat(name.style['--name-y']||0),w,h)};
  a.querySelector('.hani-office-status').getBoundingClientRect=()=>rect(0,0,0,0);
 }
 f.click('3f');layer.events.click({target:f.visible().slice().sort((a,b)=>a.dataset.person.localeCompare(b.dataset.person))[1]});return f;
}

function measure(f){
 const actors=f.visible(),style=n=>({display:'block',visibility:n.style?.visibility||'visible',fontSize:'10px'});
 const computed=n=>{for(const a of actors){if(n===a.officeCompact)return {...style(n),display:a.dataset.labelMode==='pill'?'inline':'none'};if(n===a.officeName)return {...style(n),display:a.dataset.labelMode==='dot'?'none':'inline'}}return style(n)};
 return JSON.parse(JSON.stringify(vm.runInNewContext('('+readPhoneLabels.toString()+')()',{document:{getElementById:()=>f.map,querySelectorAll:()=>actors},matchMedia:()=>({matches:true}),getComputedStyle:computed,HaniBuildingScene:scene})));
}

test('persistent own-body slot preserves tap/title/aria and strict browser checker rejects face, neighbour, label and mascot collisions',()=>{
 const f=mounted('body'),plain=measure(f),p=plain.rows.find(r=>r.ownBody);assert.ok(p);assertPhoneLabels(plain);
 const actor=f.visible().find(a=>a.dataset.person===p.id),name=actor.querySelector('.hani-office-name'),slots=[...f.ids.get('haniOfficeActors').children],feet=[actor.style.left,actor.style.top];
 f.ids.get('haniOfficeActors').events.click({target:name});assert.ok(f.root.querySelector('.hani-office-character-bubble').querySelector('p').textContent.includes(p.full));assert.deepEqual([actor.style.left,actor.style.top],feet);assert.deepEqual([...f.ids.get('haniOfficeActors').children],slots);
 // Exercise reader geometry itself, not only mutated summary arrays.
 for(const mutate of [
  (a,b)=>{b.top=a.getBoundingClientRect().top+24;b.bottom=b.top+10},
  (a,b,f)=>{const q=f.visible().find(q=>q!==a);q.querySelector('.hani-office-sprite').getBoundingClientRect=()=>rect(b.right,b.top,30,40)},
  (a,b)=>{b.bottom=a.getBoundingClientRect().bottom+1;b.top=b.bottom-10},
 ]){
  const f=mounted('body'),base=measure(f).rows.find(r=>r.ownBody),a=f.visible().find(a=>a.dataset.person===base.id),b={...base.box};mutate(a,b,f);a.querySelector('.hani-office-name').getBoundingClientRect=()=>b;
  const bad=measure(f);assert.equal(bad.rows.find(r=>r.id===base.id).ownBody,false);assert.throws(()=>assertPhoneLabels(bad));
 }
 for(const mutate of [
  (r,p)=>{p.box.top=p.head.top+p.head.height*.6},
  (r,p)=>{r.rows.find(q=>q!==p).head=rect(p.box.right,p.box.top,30,40)},
  (r,p)=>{p.mode='dot'},
  (r,p)=>{p.ownBody=false},
  r=>r.overlap.push(['body','other']),r=>r.mascotOverlap.push('body'),r=>r.outside.push('body')
 ]){const bad=structuredClone(plain);mutate(bad,bad.rows.find(r=>r.ownBody));assert.throws(()=>assertPhoneLabels(bad));}
});

test('actual persistent name slot retains title/aria/full activity and delegated tap opens the same bubble',()=>{
 const f=mounted(),layer=f.ids.get('haniOfficeActors'),nodes=[...layer.children],slots=nodes.map(a=>[a.querySelector('.hani-office-name'),a.officeName,a.officeCompact,a.querySelector('.hani-office-status')]);
 const actor=f.visible().find(a=>a.dataset.labelMode==='name');assert.ok(actor,'actual owner selects name mode');
 const name=actor.querySelector('.hani-office-name'),status=actor.querySelector('.hani-office-status'),full=status.dataset.full,feet=[actor.style.left,actor.style.top];
 assert.ok(name.title.includes(full));assert.equal(name.getAttribute('aria-label'),name.title);assert.ok(actor.getAttribute('aria-label').includes(full));assert.equal(status.title,full);assert.equal(status.textContent,full);assert.match(actor.officeCompact.textContent,/^ · /);
 layer.events.click({target:name});const panel=f.root.querySelector('.hani-office-character-bubble');assert.equal(panel.hidden,false);assert.ok(panel.querySelector('p').textContent.includes(full));assert.ok(panel.querySelector('p').textContent.includes(actor.dataset.name));
 assert.deepEqual([actor.style.left,actor.style.top],feet);assert.deepEqual(layer.children,nodes);assert.deepEqual(nodes.map(a=>[a.querySelector('.hani-office-name'),a.officeName,a.officeCompact,a.querySelector('.hani-office-status')]),slots);
 f.click('4f');f.click('3f');layer.events.click({target:f.visible().slice().sort((a,b)=>a.dataset.person.localeCompare(b.dataset.person))[1]});assert.deepEqual(layer.children,nodes);assert.ok(f.visible().some(a=>a.dataset.labelMode==='name'),'mode is remeasured, not sticky');
});

test('desktop ignores name-only dimensions and keeps the exact separate placement',()=>{
 const groups=row().map(g=>({...g,compact:false,status:rect(0,0,50,13)})),a=scene.labels.place(floor,groups),b=scene.labels.place(floor,groups.map(({nameOnly,...g})=>g));assert.deepEqual(a,b);
 const f=mounted();f.context.matchMedia=()=>({matches:false});f.click('2f');assert.ok(f.visible().every(a=>a.dataset.labelMode==='separate'&&a.officeCompact.textContent===''));
});

test('browser geometry contract accepts name mode and rejects hidden text, lost full text, tiny font, overlaps and downgraded dialogue',()=>{
 const f=mounted(),actors=f.visible(),style=n=>({display:n===n.parentElement?.officeCompact&&n.parentElement?.dataset.labelMode!=='pill'?'none':'block',visibility:n.style?.visibility||'visible',fontSize:'10px'});
 // Model CSS visibility for the compact activity/name children independently.
 const computed=n=>{for(const a of actors){if(n===a.officeCompact)return {...style(n),display:a.dataset.labelMode==='pill'?'inline':'none'};if(n===a.officeName)return {...style(n),display:a.dataset.labelMode==='dot'?'none':'inline'}}return style(n)};
 const r=vm.runInNewContext('('+readPhoneLabels.toString()+')()',{document:{getElementById:()=>f.map,querySelectorAll:()=>actors},matchMedia:()=>({matches:true}),getComputedStyle:computed,HaniBuildingScene:scene});
 const plain=JSON.parse(JSON.stringify(r));assertPhoneLabels(plain);assert.ok(plain.modes.name>0);assert.ok(plain.readableRatio>=plain.ratio);
 for(const mutate of [p=>p.shortShown=true,p=>p.nameTextShown=false,p=>p.font=9,p=>p.nameAria='',p=>p.actorAria='',p=>p.statusTitle='',p=>p.partner='dialogue',p=>p.speaking=true]){const bad=structuredClone(plain);mutate(bad.rows.find(p=>p.mode==='name'));assert.throws(()=>assertPhoneLabels(bad));}
 for(const key of ['overlap','spriteOverlap','mascotOverlap','outside','distant','ambiguous']){const bad=structuredClone(plain);bad[key].push('bad');assert.throws(()=>assertPhoneLabels(bad));}
 const css=fs.readFileSync('hani-office-live.css','utf8');assert.match(css,/\[data-label-mode="name"\] \.hani-office-compact-line\{display:none\}/);
});
