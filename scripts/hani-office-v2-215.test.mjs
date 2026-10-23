import {assertSeedCanon} from './hani-office-seed-233-expectations.mjs';
// Seed 233 activates two canon desks ahead of the unchanged 232 scheduler catalog.
// node scripts/hani-office-v2-215.test.mjs [--browser <playwright/index.mjs> <msedge.exe>]
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assets} from './hani-office-v2-fixture.mjs';
import {fixture} from './hani-building-206-engine.test.mjs';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url))),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('hani-office-live.js');
const ctx=vm.createContext({HaniOfficeV2Assets:assets,window:{},document:{getElementById:()=>null}});vm.runInContext(source,ctx);const api=ctx.HaniBuildingScene;
test('frozen 326-anchor canon, active registered staff only, exact home floor/seat and posture',()=>{
  assertSeedCanon();
  assert.equal(api.canon.anchors.length,326);assert.equal(api.floors.length,5);
  assert.deepEqual([...api.floors.flatMap(f=>f.residents)].sort(),assets.canon.people.filter(p=>p.status==='active'&&p.registration==='registered').map(p=>p.id).sort());
  for(const person of assets.canon.people.filter(p=>p.status==='active'&&p.registration==='registered')){
    const anchor=api.anchors.get(person.homeAnchor),seat=api.homeSeat(person.id);assert.equal(seat.anchor,anchor.id);assert.equal(seat.x,assets.art.anchors[anchor.id].x);assert.equal(seat.y,assets.art.anchors[anchor.id].y);assert.equal(seat.id,anchor.rendererSeat.id);assert.equal(seat.zone,assets.art.anchors[anchor.id].zone||anchor.rendererSeat.zone);
  }
  for(const id of ['chairman','seongmin'])assert.equal(api.homeSeat(id),undefined);
  for(const id of ['daon','yoonseul'])assert.equal(api.homeSeat(id).owner,id);
  assert.equal(api.homeSeat('mir').posture,'standing');assert.equal(api.homeSeat('hani').posture,'sitting');
  assert.equal(api.assignSeats('4f',[{id:'mir',activity:'meeting'}])[0].seat.anchor,'mir_meeting_pos');
  assert.equal(api.assignSeats('2f',[{id:'mir',activity:'meeting'}])[0].seat,undefined,'MIR does not take a human conference chair');
});
test('all floors: home seats stay in their canon team/room art zone, with separate planned seats',()=>{
  const expected={business:'business',finance:'finance',life:'life',platform:'platform',hani:'hani_office',yuna:'secretariat',gaeun:'secretariat',mir:'mir_nook',seongmin:'ceo'};
  const occupied=new Set();
  for(const person of assets.canon.people){
    const anchor=api.anchors.get(person.homeAnchor),floor=assets.art.floors[anchor.floor];
    assert.equal(anchor.room,expected[person.id]||expected[person.team],person.id);
    const zone=floor.homeZones[anchor.room],point=assets.art.anchors[anchor.id];
    assert.ok(zone,`${person.id}: missing visual home zone`);
    assert.ok([zone,...(floor.homeZoneExtensions?.[anchor.room]||[])].some(z=>point.x>=z[0]&&point.x<=z[2]&&point.y>=z[1]&&point.y<=z[3]),`${person.id}: outside ${anchor.room}`);
    const key=`${anchor.floor}:${point.x}:${point.y}`;assert.ok(!occupied.has(key),`${person.id}: shared home chair`);occupied.add(key);
    assert.ok(floor.plates.some(p=>p.room===anchor.room),`${person.id}: missing own room plate`);
    if(person.registration==='planned'){assert.equal(anchor.runtimeAssignable,false);assert.equal(api.homeSeat(person.id),undefined)}
  }
  assert.equal(assets.art.anchors.desk_daon.y,assets.art.anchors['finance-b'].y);
  assert.ok(['life-a','life-b','life-c','life-d'].every(id=>assets.art.anchors[id].y>=75));
  assert.equal(assets.art.anchors.desk_yoonseul.y,assets.art.anchors['life-a'].y);
  assert.equal(assets.canon.people.filter(p=>api.anchors.get(p.homeAnchor).floor==='5f').length,0);
});
test('every assignable slot has an explicit canon path from elevator without intermediate chairs or stairs',()=>{
  for(const floor of api.floors)for(const seat of api.seatMaps[floor.id]){
    const route=api.route('elevator_'+floor.id,seat.anchor);assert.ok(route.length>1,seat.id);
    assert.equal(route.at(-1).id,seat.anchor);
    for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i];assert.ok(assets.canon.edges.some(e=>e.kind!=='stairs'&&(e.from===a.id&&e.to===b.id||e.bidirectional&&e.from===b.id&&e.to===a.id)));if(i<route.length-1)assert.equal(Boolean(b.rendererSeat),false)}
  }
});
test('audited art has a physical workstation per person, planned desks stay empty and lounge is rest-only',()=>{
  for(const f of api.floors)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f.background))).digest('hex'),assets.art.floors[f.id].backgroundSha256,`${f.id}: furniture audit must follow the actual art`);
  for(const person of assets.canon.people){
    const anchor=api.anchors.get(person.homeAnchor),floor=assets.art.floors[anchor.floor],furniture=floor.homeFurniture[anchor.id],point=assets.art.anchors[anchor.id];
    assert.ok(furniture,`${person.id}: missing audited desk/chair`);
    assert.equal(furniture.type,person.id==='mir'?'console':'desk-chair');
    const [l,t,r,b]=furniture.seatBounds,x=point.x*assets.art.width/100,y=point.y*assets.art.height/100;
    assert.ok(x>=l&&x<=r&&y>=t&&y<=b,`${person.id}: shoe pivot misses physical furniture`);
    if(person.status==='active'&&person.registration==='registered')assert.equal(api.homeSeat(person.id).zone,'desk',`${person.id}: work must use own workstation`);
  }
  const desks=Object.entries(assets.art.floors['2f'].homeFurniture);
  assert.equal(desks.filter(([,f])=>f.row==='finance').length,2);
  assert.equal(desks.filter(([,f])=>f.row==='finance-director').length,1);
  assert.equal(assets.art.floors['2f'].homeFurniture['finance-a'].occupantLabel,'재무자산관리실장 · 지은');
  assert.equal(assets.art.floors['2f'].freeDesks.length,2);
  assert.equal(desks.filter(([,f])=>f.row==='life').length,5);
  assert.equal(assets.art.anchors['life-d'].y,assets.art.anchors['life-a'].y,'Sooyeon has a chair in Life row, not the monitor aisle');
  assert.ok(assets.art.anchors.secretary_desk.y>assets.art.floors['4f'].homeZones.ceo[3]);
  assert.ok(assets.art.anchors.desk_yuna.y>assets.art.floors['4f'].homeZones.ceo[3]);
  assert.equal(assets.art.anchors['meeting-e'].y,assets.art.anchors['meeting-nw'].y,'sixth conference chair stays at meeting table');
  for(const floor of api.floors){
    const staff=floor.residents.map(id=>({id,activity:'work'}));
    for(const person of api.assignSeats(floor.id,staff))assert.equal(person.seat,api.homeSeat(person.id));
    for(const person of api.assignSeats(floor.id,staff.map(p=>({...p,activity:'rest'}))))if(person.seat)assert.equal(person.seat.zone,'lounge');
    assert.ok(api.assignSeats(floor.id,staff.map(p=>({...p,activity:'rest'}))).every(p=>!p.seat||!Object.hasOwn(assets.art.floors[floor.id].homeFurniture||{},p.seat.anchor)));
  }
});
test('architectural sign mounts or painted planes are explicit, and Hani office stays separate',()=>{
  for(const floor of Object.values(assets.art.floors))for(const plate of floor.plates){assert.ok(plate.mountAnchor||plate.surface?.length===4);if(plate.mount){assert.ok(['blade','wall'].includes(plate.mount));assert.ok(plate.english);assert.equal(plate.mountAnchor.clearOfWalkway,true);assert.ok(['wall','partition','pillar'].includes(plate.mountAnchor.kind))}assert.ok(['charcoal'].includes(plate.material));assert.ok(Number.isFinite(plate.rotate)&&Number.isFinite(plate.skew));assert.ok(/^#[a-f0-9]{6}$/i.test(plate.ink))}
  const f=assets.art.floors['4f'],office=f.privateOffice,home=api.homeSeat('hani');assert.ok(office.glassDoor&&office.bookshelf&&office.visitorChairs===2);
  const inside=(seat,b)=>seat.x>=b[0]&&seat.x<=b[2]&&seat.y>=b[1]&&seat.y<=b[3];assert.ok(inside(home,office.bounds));
  for(const person of api.assignSeats('4f',[{id:'hani',activity:'rest'},{id:'seoyun',activity:'rest'},{id:'jieun',activity:'rest'}])){assert.ok(person.seat);assert.equal(person.seat.zone,'lounge');assert.equal(inside(person.seat,office.bounds),false)}
});
test('final polish: director uses private furniture, row spare stays free, full signs and official CI',()=>{
  const f=assets.art.floors['2f'],jieun=api.homeSeat('jieun');
  assert.ok(jieun.x>=f.directorOffice.bounds[0]&&jieun.x<=f.directorOffice.bounds[2]&&jieun.y>=f.directorOffice.bounds[1]&&jieun.y<=f.directorOffice.bounds[3]);
  assert.equal(api.canon.people.find(p=>p.id==='jieun').rank,'부장');
  assert.equal(jieun.anchor,'finance-a');
  for(const id of ['finance-b','desk_daon'])assert.ok(assets.art.anchors[id].y>43);
  assert.ok(api.seatMaps['2f'].every(s=>s.x*1672/100<f.freeDesks[0].seatBounds[0]||s.x*1672/100>f.freeDesks[0].seatBounds[2]||s.y*941/100<f.freeDesks[0].seatBounds[1]||s.y*941/100>f.freeDesks[0].seatBounds[3]));
  for(const [floor,room,label] of [['1f','business','기업솔루션사업부'],['2f','life','라이프&엔터테인먼트'],['4f','ceo','회장실']])assert.equal(assets.art.floors[floor].plates.find(p=>p.room===room).label,label);
  assert.ok(f.plates.some(p=>p.detail&&p.label==='실장실'&&p.fullLabel==='재무자산관리실장 · 지은'));
  assert.equal(assets.art.floors['1f'].plates.find(p=>p.room==='lobby').logo,'./assets/brand/hani-group-ci-lobby-217.webp');
  assert.ok(assets.art.floors['4f'].privateOffice.bounds[2]>80);
});
test('4F executive hierarchy: spacious private suite, separate shared lounge and MIR pod',()=>{
  const f=assets.art.floors['4f'],office=f.privateOffice,area=b=>(b[2]-b[0])*(b[3]-b[1]);
  assert.ok(area(f.officeHierarchy.chairmanBounds)>area(office.bounds),'chairman remains largest');
  assert.ok(area(office.bounds)>area(assets.art.floors['2f'].directorOffice.bounds)*1.8,'executive usable footprint clearly larger than director office');
  assert.ok(office.walnutDesk&&office.windowView&&office.bookshelf&&office.glassDoor);
  assert.ok(office.sofaBounds[0]>=office.bounds[0]&&office.sofaBounds[2]<=office.bounds[2]&&office.sofaBounds[3]<=office.bounds[3],'private sofa inside glass suite');
  assert.ok(f.homeZones.mir_nook[0]>office.bounds[2],'MIR distinct from executive suite');
  const inside=(p,b)=>p.x>=b[0]&&p.x<=b[2]&&p.y>=b[1]&&p.y<=b[3];
  for(const p of api.assignSeats('4f',[{id:'hani',activity:'rest'},{id:'seoyun',activity:'rest'},{id:'jieun',activity:'rest'},{id:'arin',activity:'rest'}])){
    assert.ok(p.seat);assert.ok(inside(p.seat,office.loungeBounds));assert.equal(inside(p.seat,office.bounds),false);
  }
  for(const p of [api.homeSeat('hani'),api.homeSeat('mir')])assert.ok(inside(p,f.homeZones[p.owner==='hani'?'hani_office':'mir_nook']));
  const bytes=fs.readFileSync(path.join(root,f.background));assert.ok(bytes.length<=240000);
  assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.deepEqual([assets.art.width,assets.art.height],[1672,941]);
});
test('2F: five Life desks, two Finance spares, no LIFE sign or life spill-over, planned roster agree',()=>{
  const f=assets.art.floors['2f'],point=assets.art.anchors.desk_yoonseul;
  assert.deepEqual(f.deskRows.life,{capacity:5,seats:['life-a','life-b','life-c','life-d','desk_yoonseul']});
  assert.deepEqual(f.deskRows.finance,{capacity:4,seats:['finance-row-spare','finance-b','desk_daon','finance-row-spare-east']});
  for(const row of Object.values(f.deskRows)){
    assert.equal(row.seats.length,row.capacity);
    const bounds=row.seats.map(id=>f.homeFurniture[id]?.seatBounds||f.freeDesks.find(d=>d.id===id)?.seatBounds);
    for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++)assert.ok(bounds[i][2]<=bounds[j][0]||bounds[j][2]<=bounds[i][0],'physical chairs overlap');
  }
  assert.equal(f.homeFurniture.desk_yoonseul.team,'life');assert.equal(f.homeFurniture.desk_yoonseul.row,'life');
  assert.equal(f.homeZoneExtensions,undefined);assert.ok(Object.values(f.homeFurniture).every(s=>!s.spillover));
  assert.ok(point.x>assets.art.anchors['life-d'].x,'fifth Life desk');assert.equal(point.y,assets.art.anchors['life-a'].y);
  assert.ok(f.deskRows.finance.seats.every(id=>!f.homeFurniture[id]||f.homeFurniture[id].row==='finance'),'no life member in Finance row');
  assert.equal(f.freeDesks.length,2);assert.ok(f.freeDesks.every(s=>s.label==='여유석'));
  for(const spare of f.freeDesks)for(const seat of api.seatMaps['2f']){const p=assets.art.anchors[seat.anchor],b=spare.seatBounds;assert.ok(p.x*1672/100<b[0]||p.x*1672/100>b[2]||p.y*941/100<b[1]||p.y*941/100>b[3],'spares stay unassigned')}
  assert.equal(f.homeFurniture.desk_daon.seatNote,'재무 줄 · 하루 옆 다온 좌석');
  assert.equal(f.homeFurniture.desk_yoonseul.seatNote,'라이프 줄 다섯 번째 · 윤슬 책상');
  assert.ok(!f.plates.some(p=>p.label==='LIFE'||p.fullLabel?.includes('윤슬')),'removed small LIFE sign');
  for(const id of ['daon','yoonseul']){assert.equal(api.homeSeat(id).owner,id);assert.ok(api.seatMaps['2f'].some(s=>s.anchor===assets.canon.people.find(p=>p.id===id).homeAnchor))}
});
test('walking updates transforms and alternates A/B in existing slots, hidden pauses, reduced motion snaps',async()=>{
  const f=fixture('09:00',false,()=>true);f.click('2f');const nodes=[...f.ids.get('haniOfficeActors').children];
  f.context.window.haniOfficeLiveUpdate({case:{id:'walk',title:'이동 검사'},reviews:[{agent_key:'JIEUN',review_round:1,summary:'검사'}]});
  const opening=f.ids.get('haniOfficeMeetingOpen').events.click();const tick=f.timers.find(t=>t.ms===100),actor=f.visible()[0];
  assert.ok(actor.officeTravel);const position=[actor.style.left,actor.style.top];tick.fn();assert.equal(actor.dataset.pose,'walk-a');tick.fn();assert.equal(actor.dataset.pose,'walk-b');assert.notDeepEqual([actor.style.left,actor.style.top],position);
  f.hide();const paused=actor.style.left;for(let n=0;n<5;n++)tick.fn();assert.equal(actor.style.left,paused);f.show();
  for(let n=0;n<180;n++)tick.fn();await opening;assert.equal(actor.dataset.pose,'sitting');assert.equal(actor.officeTravel,null);assert.deepEqual(f.ids.get('haniOfficeActors').children,nodes);
  const reduced=fixture('09:00',true,()=>true);reduced.context.window.haniOfficeLiveUpdate({case:{id:'reduced',title:'모션 감소'},reviews:[]});await reduced.ids.get('haniOfficeMeetingOpen').events.click();assert.ok(reduced.visible().every(a=>!a.officeTravel&&a.dataset.pose==='sitting'));
});
test('v2 sprite metadata is real, all art exists, no persistence/cloud calls added',()=>{
  for(const entry of assets.sprites.entries){assert.ok(fs.existsSync(path.join(root,'assets/sprites-v2',entry.file)));assert.deepEqual(entry.frames.map(f=>f.name),['standing','sitting','walk-a','walk-b'])}
  for(const f of api.floors)for(const p of [f.background,f.production,f.fallback])assert.ok(fs.existsSync(path.join(root,p)));
  assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|\.upsert\(|\.insert\(|Math\.random/);
  assert.doesNotMatch(source,/building-v2|foreground-v2/);
  assert.equal(Object.keys(assets.art.anchors).length,326);
  for(const anchor of assets.canon.anchors){const p=assets.art.anchors[anchor.id];assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>0&&p.x<100&&p.y>0&&p.y<100,anchor.id);if(anchor.rendererSeat)assert.ok(p.furniture)}
  for(const floor of assets.canon.floors)assert.deepEqual(assets.art.floors[floor.id].plates.filter(p=>!p.detail).map(p=>p.room),floor.rooms.map(r=>r.id));
});

test('HTML plates and desk props reuse persistent slots; no painted sign patches load',async()=>{
  const requests=[],f=fixture('09:00',true,src=>{requests.push(src);return true});
  const slots=f.map.querySelectorAll('.hani-office-foreground'),props=f.map.querySelectorAll('.hani-office-desk-props'),plates=f.map.querySelectorAll('.hani-office-room-plate');
  const settle=()=>new Promise(resolve=>setImmediate(resolve));await settle();
  assert.equal(props.length,19);assert.equal(plates.length,23);
  for(const floor of ['3f','2f','1f','5f','4f']){
    f.click(floor);await settle();
    assert.deepEqual(f.map.querySelectorAll('.hani-office-desk-props'),props);
    assert.deepEqual(f.map.querySelectorAll('.hani-office-room-plate'),plates);
    assert.ok(slots.every(i=>i.hidden));assert.equal(f.map.dataset.mask,'none');
    assert.equal(props.filter(i=>!i.hidden).length,assets.art.floors[floor].deskProps.length);
    for(const p of plates.filter(i=>!i.hidden&&!i.dataset.brand)){assert.equal(p.children[0].tagName,'b');assert.ok(p.children[0].textContent);assert.equal(p.children[1].tagName,'small');assert.ok(p.children[1].textContent)}
  }
  f.click('3f');f.click('2f');await settle();assert.equal(f.map.dataset.floor,'2f');
  assert.ok(!requests.some(src=>src.includes('/signs-')));
  assert.equal(f.map.querySelector('.hani-office-ceo-nameplate'),null);
  const failed=fixture('09:00',true,()=>false);await settle();
  assert.ok(failed.map.querySelectorAll('.hani-office-desk-props').every(p=>p.hidden));
  assert.ok(failed.root.querySelector('.hani-building-rooms').children.some(p=>!p.hidden&&p.textContent.includes('하니 전무실')));
});

test('217 prop assets match each active/planned home desk, with explicit URLs and small alpha WebPs',()=>{
 const manifest=Object.values(assets.art.floors).flatMap(f=>f.deskProps||[]);
 assert.equal(manifest.length,19);assert.equal(new Set(manifest.map(p=>p.id)).size,19);
 for(const floor of api.floors)for(const prop of assets.art.floors[floor.id].deskProps||[]){
  const person=api.canon.people.find(p=>p.id===prop.id),anchor=assets.art.anchors[prop.anchor];
  assert.equal(prop.anchor,person.homeAnchor);assert.equal(prop.planned,person.status==='planned');
  assert.equal(api.anchors.get(prop.anchor).floor,floor.id);assert.equal(api.deskPropArt[prop.id],prop.file);
  assert.ok(source.includes(JSON.stringify(prop.file)),'literal asset URL for release closure');
  const bytes=fs.readFileSync(path.join(root,prop.file));assert.ok(bytes.length<=12000);
  assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.equal(bytes.toString('ascii',12,16),'VP8X');assert.ok(bytes[20]&16,'transparent alpha feature');
  const [left,top,right,bottom]=assets.art.floors[floor.id].homeFurniture[prop.anchor].deskBounds;
  const x=anchor.x*16.72+prop.offset[0],y=anchor.y*9.41+prop.offset[1];
  assert.ok(x>=left&&x+prop.width<=right&&y>=top&&y<bottom,`${prop.id}: on own desktop`);
 }
 const logo=fs.readFileSync(path.join(root,'assets/brand/hani-group-ci-lobby-217.webp'));
 assert.ok(logo[20]&16,'brand alpha, no white backing');
});


test('Edge: office-217 all floors at 390/1440 light', {skip:!process.argv.includes('--browser')},async()=>{
 const arg=process.argv.indexOf('--browser');
 const {runOffice217Browser}=await import('./hani-office-217.browser.mjs');
 await runOffice217Browser(process.argv[arg+1],process.argv[arg+2]);
});

test(`Edge: ${process.argv.includes('--final-polish')?'390/1440 light/dark':process.argv.includes('--seat-audit')?'360/390/412/1440 light/dark':'6 widths light/dark'} × ${process.argv.includes('--floor-4f')?'4F':'5 floors'}, lazy art, persistent DOM, zero office storage writes; failures and motion`, {skip:!process.argv.includes('--office-regression')},async()=>{
  const arg=process.argv.indexOf('--browser'),evidence=path.join(root,'artifacts/office-217/regression');fs.mkdirSync(evidence,{recursive:true});
  const status={result:'running',scope:process.argv.includes('--floor-4f')?'4F executive suite: 390/1440 light/dark':process.argv.includes('--final-polish')?'final polish: 390/1440 light/dark':process.argv.includes('--seat-audit')?'furniture audit: 360/390/412/1440 light/dark':'full office UI',artSha256:crypto.createHash('sha256').update(read('data/hani-building/art-map-v1.json')).digest('hex'),patchSha256:Object.fromEntries(Object.entries(assets.art.floors).filter(([,f])=>f.signPatch).map(([id,f])=>[id,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f.signPatch))).digest('hex')])),backgroundSha256:Object.fromEntries(api.floors.map(f=>[f.id,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f.background))).digest('hex')])),screenshots:[],checks:[],errors:[],consoleErrors:[],writes:[],requests:[]};const save=()=>fs.writeFileSync(path.join(evidence,'browser-status.json'),JSON.stringify(status,null,2));
  let browser,server;
  try{
    const {chromium}=await import(pathToFileURL(path.resolve(process.argv[arg+1])).href);
    browser=await chromium.launch({executablePath:process.argv[arg+2],headless:true});
    server=http.createServer((req,res)=>{
      const url=new URL(req.url,'http://local'),file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
      res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
    });await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
    async function pageFor(width,theme='light',reduced='reduce',failure=null){
      const context=await browser.newContext({viewport:{width,height:width===390?1400:1100},reducedMotion:reduced,colorScheme:theme==='dark'?'dark':'light'});
      await context.addInitScript(()=>{window.officeClock=Date.parse('2026-10-16T09:00:00+09:00');const D=Date;window.Date=class extends D{constructor(...args){super(...(args.length?args:[window.officeClock]))}static now(){return window.officeClock}}});
      await context.route('**/*',route=>{
        const url=route.request().url();if(new URL(url).origin!==origin)return route.fulfill({status:200,body:'',contentType:'text/plain'});
        if(failure?.startsWith('sprites-v2/')&&url.endsWith('manifest-v3.json'))return route.fulfill({status:200,body:'{}',contentType:'application/json'});
        if(failure&&url.includes(failure))return route.fulfill({status:200,body:'invalid-image',contentType:'image/webp'});
        return route.continue();
      });
      const page=await context.newPage();page.on('pageerror',e=>status.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')status.consoleErrors.push(m.text())});
      const requests=[];page.on('request',r=>{if(/assets\/(building|sprites-v[23])\//.test(r.url()))requests.push(new URL(r.url()).pathname)});
      await page.goto(origin);await page.waitForFunction(n=>typeof unlockLoginGate==='function'&&typeof showView==='function'&&!!window.HaniBuildingScene&&document.querySelectorAll('[data-building-floor]').length===n,['spatial-contract.json','art-map-v1.json'].includes(failure)?4:5);
      assert.equal(requests.filter(r=>r.endsWith('.webp')).length,0,'office hidden: zero floor/sprite image loads');
      await page.evaluate(theme=>{
        unlockLoginGate();document.documentElement.dataset.finish=theme==='dark'?'midnight-black':'cream';showView('agentReview');
        window.officeNodes=[...document.querySelector('#haniOfficeActors').children];window.officeImages=[...document.querySelectorAll('#haniOfficeMap img')];
        window.officeWrites=[];for(const key of ['setItem','removeItem','clear']){const old=Storage.prototype[key];Storage.prototype[key]=function(...args){officeWrites.push(key+':'+(args[0]||''));return old.apply(this,args)}}
        window.officeProtected=localStorage.getItem('hani_os_life_v23');
      },theme);
      await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.art);
      return {page,context,requests};
    }
    for(const width of (process.argv.includes('--final-polish')?[390,1440]:process.argv.includes('--sign-desktop')?[1440]:process.argv.includes('--seat-audit')?[360,390,412,1440]:[360,390,412,768,884,1440]))for(const theme of ['light','dark']){
      const {page,context,requests}=await pageFor(width,theme);
      for(const floor of (process.argv.includes('--floor-4f')?['4f']:['4f','5f','3f','2f','1f'])){
        await page.locator(`[data-building-floor="${floor}"]`).click();
        await page.waitForFunction(f=>{const map=document.querySelector('#haniOfficeMap'),bg=map.querySelector('.hani-office-background');return map.dataset.floor===f&&map.dataset.art==='floor'&&bg.getAttribute('src')===HaniBuildingScene.floors.find(x=>x.id===f).background&&bg.complete&&bg.naturalWidth===1672&&bg.naturalHeight===941&&map.dataset.mask==='none'&&[...document.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden).every(a=>a.dataset.avatar==='v2')},floor);
        const geometry=await page.evaluate(()=>{
          const map=document.querySelector('#haniOfficeMap'),box=map.getBoundingClientRect(),actors=[...document.querySelectorAll('.hani-office-actor')].filter(a=>!a.hidden),buttons=[...document.querySelectorAll('[data-building-floor]')];
          const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
          const plates=[...map.querySelectorAll('.hani-office-room-plate,.hani-office-ceo-nameplate')].filter(p=>!p.hidden&&getComputedStyle(p).visibility!=='hidden'&&p.getBoundingClientRect().width>0);
          const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};
          const host=document.querySelector('#haniOfficeLive').getBoundingClientRect();
          return {mapClip:{x:box.left-host.left,y:box.top-host.top,width:box.width,height:box.height},overflow:[document.documentElement,document.querySelector('#haniOfficeLive'),map].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.id||e.tagName),
            plates:plates.map(p=>{
              const r=p.getBoundingClientRect(),s=getComputedStyle(p),b=p.querySelector('b');
              return {text:p.dataset.label,brand:p.dataset.brand==='true',font:parseFloat(getComputedStyle(b).fontSize),background:s.backgroundColor,border:s.borderTopWidth,shadow:s.boxShadow,
                linesFit:[...p.querySelectorAll('b,small')].every(l=>l.scrollWidth<=l.clientWidth+1),brandImages:[...p.querySelectorAll('img')].map(i=>({source:i.getAttribute('src'),decoded:i.complete&&i.naturalWidth>0})),
                inside:r.left>=box.left&&r.right<=box.right&&r.top>=box.top&&r.bottom<=box.bottom,actorOverlap:actors.filter(a=>overlaps(r,a.getBoundingClientRect())||overlaps(r,a.querySelector('.hani-office-name').getBoundingClientRect())).map(a=>a.dataset.person)};
            }),
            visibleArt:[...map.querySelectorAll('.hani-office-foreground')].filter(i=>!i.hidden).map(i=>({src:i.getAttribute('src'),zIndex:getComputedStyle(i).zIndex,width:i.naturalWidth,height:i.naturalHeight})),ratio:box.width/box.height,
            actors:actors.map(a=>{const r=a.getBoundingClientRect(),seat=HaniBuildingScene.seatMaps[map.dataset.floor].find(s=>s.id===a.dataset.seat),pivot=[24,61];return {id:a.dataset.person,pose:a.dataset.pose,inside:r.left>=box.left-1&&r.right<=box.right+1&&r.top>=box.top-1&&r.bottom<=box.bottom+1,dx:Math.abs(r.left+r.width*pivot[0]/48-(box.left+box.width*seat.x/100)),dy:Math.abs(r.top+r.height*pivot[1]/64-(box.top+box.height*seat.y/100)),uiOverlap:buttons.some(b=>overlaps(r,b.getBoundingClientRect()))}}),
            persistent:officeNodes.every((a,i)=>a===document.querySelector('#haniOfficeActors').children[i])&&officeImages.every((a,i)=>a===document.querySelectorAll('#haniOfficeMap img')[i]),
            tabs:buttons.every(b=>b.getBoundingClientRect().height>=44&&b.getBoundingClientRect().width>=44),
            writes:officeWrites,protectedSame:officeProtected===localStorage.getItem('hani_os_life_v23'),planned:document.querySelector('#haniOfficeActors').querySelectorAll('[data-person="daon"],[data-person="yoonseul"],[data-person="seongmin"]').length};
        });
        status.lastGeometry={width,theme,floor,geometry};save();
        assert.deepEqual(geometry.overflow,[],`${width}/${theme}/${floor} overflow`);assert.equal(geometry.persistent,true);assert.equal(geometry.tabs,true);assert.equal(geometry.planned,0);assert.deepEqual(geometry.writes,[]);assert.equal(geometry.protectedSame,true);
        assert.equal(geometry.visibleArt.length,0);assert.ok(Math.abs(geometry.ratio-1672/941)<.02);
        if(geometry.plates.some(p=>!p.inside||p.actorOverlap.length)){await page.locator('#haniOfficeLive').screenshot({path:path.join(evidence,'sign-collision.png')});console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('.hani-office-room-plate:not([hidden]),.hani-office-actor:not([hidden]),.hani-office-actor:not([hidden]) .hani-office-name')].map(p=>({label:p.dataset.label||p.dataset.person||p.textContent,rect:p.getBoundingClientRect().toJSON()})))))}
        for(const p of geometry.plates){assert.ok(p.inside,`${width}/${floor}: clipped ${p.text}`);assert.ok(p.linesFit);if(p.brand){assert.equal(p.brandImages.length,1);assert.ok(p.brandImages.every(i=>i.decoded&&i.source==='./assets/brand/hani-group-ci-lobby-217.webp'))}else{assert.equal(p.background,'rgb(63, 68, 74)');assert.equal(p.border,'0px');assert.equal(p.shadow,'none');assert.ok(p.font>=9&&p.font<=10)}assert.deepEqual(p.actorOverlap,[])}
        for(const a of geometry.actors){assert.ok(a.inside,`${width}/${floor}/${a.id} cut off`);assert.ok(a.dx<2&&a.dy<2,JSON.stringify(a));assert.equal(a.uiOverlap,false)}
        assert.equal(await page.locator('.hani-office-ceo-nameplate').count(),0);
        const homes=await page.evaluate(()=>[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden).map(a=>{
          const person=HaniBuildingScene.canon.people.find(p=>p.id===a.dataset.person),anchor=HaniBuildingScene.anchors.get(person.homeAnchor),map=document.querySelector('#haniOfficeMap'),box=map.getBoundingClientRect(),r=a.getBoundingClientRect(),x=(r.left+r.width*.5-box.left)/box.width*100,y=(r.top+r.height*61/64-box.top)/box.height*100,z=HaniBuildingScene.art.floors[anchor.floor].homeZones[anchor.room];
          const furniture=HaniBuildingScene.art.floors[anchor.floor].homeFurniture[anchor.id],bounds=furniture.seatBounds,px=x*1672/100,py=y*941/100;
          return {id:person.id,room:anchor.room,px,py,bounds,furniture:furniture.type,seat:a.dataset.seat,zone:a.dataset.zone,inFurniture:px>=bounds[0]-.1&&px<=bounds[2]+.1&&py>=bounds[1]-.1&&py<=bounds[3]+.1,correctFloor:anchor.floor===map.dataset.floor,correctSeat:a.dataset.seat===anchor.rendererSeat.id,inZone:x>=z[0]-.1&&x<=z[2]+.1&&y>=z[1]-.1&&y<=z[3]+.1,ownPlate:[...map.querySelectorAll('.hani-office-room-plate')].some(p=>!p.hidden&&p.dataset.room===anchor.room)};
        }));
        for(const home of homes)assert.ok(home.correctFloor&&home.correctSeat&&home.inZone&&home.inFurniture&&home.zone==='desk'&&home.ownPlate,JSON.stringify(home));
        if(floor==='2f'){
          const daon=page.locator('[data-planned-person="daon"]'),yoonseul=page.locator('[data-planned-person="yoonseul"]');
          assert.equal(await daon.isVisible(),true);assert.equal(await yoonseul.isVisible(),true);
          assert.match(await daon.textContent(),/재무 줄 · 하루 옆 예정 좌석/);
          assert.match(await yoonseul.textContent(),/라이프 줄 다섯 번째 · 윤슬 입사 예정 빈 책상/);
          assert.equal(await page.locator('.hani-office-room-plate[title*="윤슬"]').count(),0);
        }
        if(floor==='4f')assert.ok(requests.filter(r=>/building\/floor-.*\.webp$/.test(r)).every(r=>r.includes('4f')),'only the visible initial floor is loaded');
        const png=`${width}-${theme}-${floor}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(evidence,png)});status.screenshots.push(png);status.checks.push({width,theme,floor,geometry,homes});
      }
      for(const [time,floor,mode] of [['12:05','4f','rest'],['10:05','2f','meeting']]){
        await page.evaluate(time=>{window.officeClock=Date.parse('2026-10-16T'+time+':00+09:00')},time);
        await page.locator(`[data-building-floor="${floor}"]`).click();
        const collisions=await page.evaluate(()=>{const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,actors=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden),plates=[...document.querySelectorAll('.hani-office-room-plate,.hani-office-ceo-nameplate')].filter(p=>!p.hidden&&getComputedStyle(p).visibility!=='hidden'&&p.getBoundingClientRect().width>0);return plates.flatMap(p=>actors.filter(a=>overlap(p.getBoundingClientRect(),a.getBoundingClientRect())).map(a=>p.textContent+'/'+a.dataset.person))});
        assert.deepEqual(collisions,[],`${width}/${theme}/${mode}: plate/actor overlap`);
        const png=`${width}-${theme}-${floor}-${mode}.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(evidence,png)});status.screenshots.push(png);
      }
      assert.deepEqual(await page.evaluate(()=>officeWrites),[]);
      assert.ok(requests.every(r=>!r.includes('building-v2')));status.requests.push({width,theme,requests});await context.close();save();
    }
    // Failure injection is fulfilled with corrupt bytes to exercise decode errors without noisy expected 404 logs.
    for(const failure of ['floor-4f-217.webp','sprites-v2/hani.webp','spatial-contract.json','art-map-v1.json']){
      const {page,context}=await pageFor(390,'light','reduce',failure);
      if(['spatial-contract.json','art-map-v1.json'].includes(failure))assert.equal(await page.locator('[data-building-floor]').count(),4);
      else await page.waitForFunction(f=>f.includes('sprites-v2')?document.querySelector('[data-person="hani"]').dataset.avatar==='chibi':document.querySelector('#haniOfficeMap').dataset.art==='fallback',failure);
      assert.equal(await page.locator('.hani-office-background').evaluate(i=>i.complete&&i.naturalWidth>0),true);
      assert.deepEqual(await page.evaluate(()=>officeWrites),[]);await context.close();status.checks.push({failure,result:'passed'});
    }
    for(const width of [360,884]){
      const {page,context}=await pageFor(width,'dark');
      await page.evaluate(()=>haniOfficeLiveStage({stage:'SUMMONING',case:{id:'all-six',title:'여섯 자리 검증'},selected_agents:['jieun','seoyun','dohyun','yuri','arin'].map(agent_key=>({agent_key}))}));
      await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.state==='meeting');
      assert.equal(await page.locator('#haniOfficeActors .hani-office-actor:visible').count(),6);
      const png=`${width}-dark-2f-six-meeting.png`;await page.locator('#haniOfficeLive').screenshot({path:path.join(evidence,png)});status.screenshots.push(png);
      assert.deepEqual(await page.evaluate(()=>officeWrites),[]);await context.close();
    }
    const {page,context}=await pageFor(884,'light','no-preference');
    await page.evaluate(()=>haniOfficeLiveUpdate({case:{id:'browser-walk',title:'canon 경로'},reviews:[{agent_key:'JIEUN',review_round:1,summary:'실제 회의 연결'}]}));
    await page.locator('#haniOfficeMeetingOpen').click();await page.waitForFunction(()=>!!document.querySelector('.hani-office-actor[data-pose="walk-a"],.hani-office-actor[data-pose="walk-b"]'));
    await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.state==='meeting');assert.match(await page.locator('#haniOfficeConversation').innerText(),/실제 회의 연결/);
    await page.locator('#haniOfficeReturn').click();await page.waitForFunction(()=>document.querySelector('#haniOfficeMap').dataset.state==='idle');
    assert.deepEqual(await page.evaluate(()=>officeWrites),[]);await context.close();status.checks.push({motion:'canon walk/meeting/return',result:'passed'});
    assert.deepEqual(status.errors,[]);assert.deepEqual(status.consoleErrors,[]);status.result='passed';
  }catch(e){status.result=/EPERM|EACCES|executable.*exist/i.test(e.message)?'blocked':'failed';status.reason=e.stack;throw e}
  finally{await browser?.close();if(server?.listening)await new Promise(r=>server.close(r));save()}
});
