import assert from 'node:assert/strict';

// Independent destination contract, shared by long-running 216 reachability
// regression and obr3 tests. Do not derive expectations from runtime metadata.
const ranges={coffee:[60,180],window:[40,120],sofa:[120,300],board:[60,180],server:[45,120],garden:[90,240],terrace:[90,240],lobby:[30,90],meeting:[90,240]};
const rooms={cafe:'coffee',pantry:'coffee',platform:'sofa',mir_nook:'sofa',exec_lounge:'sofa',standup:'board',server:'server',garden:'garden',terrace:'terrace',lobby:'lobby',consult:'meeting',team_meeting:'meeting',release:'meeting',exec:'meeting'};
export function expectedRange(scene,target){
 // Short work cards share existing nodes, but never own formal rest bounds.
 const card=scene.places.find(c=>c.kind!=='errand'&&c.slots.includes(target.seat.anchor));
 const kind=card?.kind||(/window/.test(target.seat.anchor)?'window':rooms[scene.anchors.get(target.seat.anchor)?.room]);
 return ranges[kind]||[45,120];
}
export function assertFormalStay(scene,event,table){
 const action=table.actions.find(a=>a.id===event.actionId),family=table.families.find(f=>f.id===event.familyId);
 const split=event.id.lastIndexOf('|'),base=event.id.slice(0,split),n=event.id.slice(split+1);
 const raw=Math.min(family.durationCeilingSeconds,action.durationSeconds[0]+Math.floor(scene.scheduler.seed(base+'|duration|'+n)/4294967296*(action.durationSeconds[1]-action.durationSeconds[0]+1)));
 const away=event.people.filter(t=>t.seat.anchor!==t.home.anchorId);
 if(!away.length){assert.equal(event.duration,raw,event.actionId+' home duration');assert.equal(event.runtimeDurationCeilingSeconds,family.durationCeilingSeconds);return;}
 const scale=action.id.startsWith('scene-')?1.2:1;
 const ceiling=Math.max(family.durationCeilingSeconds,Math.min(Math.min(...away.map(t=>expectedRange(scene,t)[1]*scale)),Math.max(action.durationSeconds[1]*scale,...away.map(t=>expectedRange(scene,t)[0]*scale))));
 assert.equal(event.runtimeDurationCeilingSeconds,ceiling,event.actionId+' runtime ceiling');
 for(const t of away){
  const [min,max]=expectedRange(scene,t),stay=t.back[0].start-t.out.at(-1).end;
  assert.ok(stay>=Math.min(max,Math.max(raw,min))*scale-1e-6,event.actionId+' '+t.id+' stay below minimum: '+stay);
  assert.ok(stay<=max*scale+1e-6,event.actionId+' '+t.id+' stay above maximum: '+stay);
  assert.ok(event.duration>=min*scale-1e-6,event.actionId+' shared stay');
 }
}
