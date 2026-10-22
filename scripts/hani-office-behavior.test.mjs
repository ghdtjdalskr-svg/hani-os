import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixture} from './hani-building-206-engine.test.mjs';
import {validPlaceSpeech} from './hani-office-place-assertions.mjs';
const table=JSON.parse(fs.readFileSync(new URL('../assets/data/office-actions-221.json',import.meta.url),'utf8'));
const scene=fixture('09:00',false,null,table).context.HaniBuildingScene,s=scene.scheduler;
const plain=v=>JSON.parse(JSON.stringify(v)),px=p=>[p[0]*1672/100,p[1]*941/100];
const point=p=>px(p.position||[p.seat.x,p.seat.y]);
const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
const forbidden=/창밖|창가|화이트보드|소파|팬트리|커피 내리|화분|라운지/;
function check(snap,previous,fail){
 const all=[...snap.entries,...snap.visitors],slots=new Map();
 for(const p of all){
  const card=scene.places.find(c=>c.id===p.placeId),person=table.people.find(x=>x.id===p.id);
  if(p.state==='AT_PLACE'){
   const target=scene.art.anchors[p.targetAnchor];
   if(!target||distance(point(p),px([target.x,target.y]))>2)fail('slot foot mismatch '+p.id);
   if(scene.anchors.get(p.targetAnchor)?.floor!==p.floor)fail('slot floor mismatch '+p.id);
   // Guests keep their own reception lines; staff speak the place card's lines.
   if(!validPlaceSpeech(p,card,table))fail('card speech mismatch '+p.id);
   if(!card){const action=s.actions.get(p.actionId);if(!action||!JSON.stringify(action).includes(p.line))fail('action speech mismatch '+p.id)}
  }
  if(p.walking&&!(/가는 중|돌아가는 중/.test(p.line)||p.visitor&&p.state==='RETURNING'&&p.line==='안녕히 계세요~'))fail('arrival line while walking '+p.id+' '+p.line);
  const lounge=['yuna','minji'].includes(p.id)&&['lobby-nw','lobby-ne'].includes(p.seat.anchor);
  if(p.state==='AT_HOME'&&!lounge&&forbidden.test(p.line))fail('desk place words '+p.id+' '+p.line);
  if(p.floor==='3f'&&['AT_HOME','AT_PLACE'].includes(p.state)&&/커피/.test(p.line)&&!/고민/.test(p.line))fail('3f coffee '+p.id+' '+p.line);
  if(card&&p.state==='AT_PLACE'&&card.floor!==p.floor)fail('unavailable kind '+p.id);
  if(!p.walking){if(slots.has(p.floor+'|'+p.seat.anchor))fail('double slot '+p.id);slots.set(p.floor+'|'+p.seat.anchor,p.id)}
  if(table.people.some(other=>other.id!==p.id&&other.home.anchorId===p.seat.anchor))fail('foreign home '+p.id);
  if(p.state==='AT_HOME'&&person&&p.seat.anchor!==s.homeAt(person,snap.seconds).anchorId)fail('home mismatch '+p.id);
  const prev=previous.get(p.id);
  // Elevator transfer is explicitly WAITING (walking=false). A turn can return
  // close to the previous sample, but a straight walking segment must advance.
  if(p.walking&&prev?.walking&&p.floor===prev.floor&&p.state===prev.state&&distance(point(p),point(prev))<.5)fail('frozen walk '+p.id);
 }
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const p=all[i],q=all[j];if(p.floor!==q.floor)continue;
  const gap=distance(point(p),point(q)),limit=p.walking||q.walking?24:20;if(gap<limit-.001)fail('proximity '+p.id+'/'+q.id+' '+gap.toFixed(2));
 }
 previous.clear();for(const p of all)previous.set(p.id,p);
}
for(const [label,from,to]of [
 ['weekday full day and late night','2026-10-22T00:00:00+09:00','2026-10-23T02:00:00+09:00'],
 ['weekend evening','2026-10-24T19:00:00+09:00','2026-10-24T21:00:00+09:00']
])test(label+' — all people every second',()=>{
 const errors=[],previous=new Map();let samples=0,places=0,walks=0,returns=0;
 for(let t=Date.parse(from);t<Date.parse(to);t+=1000){const snap=s.snapshot(new Date(t));samples++;places+=snap.entries.filter(p=>p.state==='AT_PLACE').length;walks+=snap.entries.filter(p=>p.walking).length;
  check(snap,previous,msg=>{if(errors.length<30)errors.push(new Date(t).toISOString()+' '+msg)});
  for(const p of snap.entries)if(p.state==='RETURNING')returns++;
  if(samples%600===1)assert.deepEqual(plain(snap),plain(s.snapshot(new Date(t))));
 }
 console.log(label,{samples,places,walks,returns});assert.deepEqual(errors,[]);assert.ok(places>0&&walks>0&&returns>0);
});
test('reported reproductions, reduced motion and arbitrary query order use the same reservations',()=>{
 for(const time of ['2026-10-22T14:11:30','2026-10-22T14:04:21','2026-10-22T08:08:40','2026-10-22T20:23:40','2026-10-23T01:57:24']){
  for(const reducedMotion of [false,true]){const now=time+'+09:00',snap=s.snapshot(now,{reducedMotion}),errors=[];check(snap,new Map(),m=>errors.push(m));assert.deepEqual(errors,[],time);
   if(reducedMotion)assert.ok([...snap.entries,...snap.visitors].every(p=>!p.walking));
   s.snapshot('2026-10-24T20:00:00+09:00');assert.deepEqual(plain(snap),plain(s.snapshot(now,{reducedMotion})));
  }
 }
});
test('place/geometry contract, no sub-4px timed edge, private homes and full return endpoints',()=>{
 for(const p of scene.places){assert.ok(p.slots.length&&p.at.length);assert.match(p.go,/가는 중$/);
  for(const id of p.slots){const n=scene.anchors.get(id);assert.equal(n.floor,p.floor);assert.equal(n.room,p.room);assert.ok(n.runtimeAssignable!==false&&!n.rendererSeat?.owner&&!n.occupant);assert.ok(!/^mir_/.test(id))}
 }
 for(const edge of scene.canon.edges){const a=scene.anchors.get(edge.from),b=scene.anchors.get(edge.to);if(a.floor===b.floor&&edge.kind!=='stairs'){
  const d=distance(px(scene.visualPoint(a)),px(scene.visualPoint(b)));if(d>0)assert.ok(d>=4,edge.from+' → '+edge.to+' '+d);
 }}
 const day='2026-10-22',events=[...s.plan(day),...s.blockPlan(day,Math.floor(14*3600/600),s.plan(day))];
 for(const e of events)for(const t of e.people){if(!t.back.length)continue;const p=s.stateAt(e,t,e.end-.0000001);assert.ok(distance(point(p),px(scene.visualPoint(scene.anchors.get(t.home.anchorId))))<.001);assert.equal(t.back.at(-1).to,t.home.anchorId)}
 const source=fs.readFileSync(new URL('../hani-office-live.js',import.meta.url),'utf8');assert.doesNotMatch(source,/localStorage|sessionStorage|supabase|idleStroll|strollPlan|visitorAt|idlePools\.stroll|A stroll never/);
});
