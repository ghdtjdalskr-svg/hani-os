// Read-only Node evidence. No browser, storage, Cloud or release mutation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {loadScene,root} from './hani-office-lively-fixture.mjs';
import {resolveRuntimeClosure} from './hani-runtime-closure.mjs';
import {approvedReleases,trainBaseVersion,projectTrainVersion} from './hani-reviewed-release-baseline.mjs';
const json=file=>JSON.parse(fs.readFileSync(new URL(file,root),'utf8'));
const {scene,table}=loadScene(),s=scene.scheduler,day='2026-10-23';
const formal=s.plan(day),trips=s.blockPlan(day,0,formal).filter(e=>!e.visitor);
const departures=(events,id)=>events.filter(e=>e.people.some(p=>p.id===id&&p.seat.anchor!==p.home.anchorId));
const people=Object.fromEntries(['daon','yoonseul'].map(id=>{
 const outings=departures(trips,id),scheduled=departures(formal,id),working=outings.filter(e=>e.start>=32400&&e.start<64800);
 return [id,{home:scene.homeSeat(id),formalOutings:scheduled.length,placeOutings:outings.length,workHoursPlaceOutings:working.length,totalOutings:scheduled.length+outings.length,
  places:[...new Set(outings.map(e=>e.card.id))],workPlaces:[...new Set(working.map(e=>e.card.id))],
  destinations:outings.map(e=>({startSeconds:e.start,endSeconds:e.end,place:e.card.id,kind:e.card.kind,floor:e.card.floor})),
  formalActions:scheduled.map(e=>({action:e.actionId,startSeconds:e.start,targets:e.people.filter(p=>p.id===id).map(p=>p.seat.anchor)}))}];
}));
const closure=await resolveRuntimeClosure({exists:async file=>fs.existsSync(new URL(file,root)),read:async file=>fs.readFileSync(new URL(file,root))});
assert.ok(closure.files.length<=128);assert.deepEqual(closure.missing,[]);
const baselineSource=fs.readFileSync(new URL('scripts/hani-reviewed-release-baseline.mjs',root));
const mainSource=fs.readFileSync(new URL('hani-main.js',root),'utf8'),displayVersion=mainSource.match(/const HANI_DISPLAY_VERSION="([^"]+)"/)[1];
const project=projectTrainVersion('?v='+trainBaseVersion+'\nconst HANI_DISPLAY_VERSION="'+trainBaseVersion+'"',displayVersion);
assert.ok(project.includes('?v='+displayVersion)&&project.includes('HANI_DISPLAY_VERSION="'+displayVersion+'"'));
const diagnostic={trainBaseVersion,displayVersion,lastApprovedRelease:approvedReleases.at(-1).sha,main232InApproved:approvedReleases.some(r=>r.sha==='4ac6b6c0119eeacc7332f1c53c3c760675657c11'),updateNeeded:trainBaseVersion!==displayVersion,sha256:crypto.createHash('sha256').update(baselineSource).digest('hex')};
const files=['hani-office-live.js','hani-desk-mascots.js','scripts/hani-reviewed-release-baseline.mjs','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','data/hani-building/office-places.json','assets/data/office-actions-216.json','assets/data/office-actions-221.json','index.html','hani-main.js'];
const evidence={day,catalog:221,people,floors:scene.floors.map(f=>({floor:f.id,residents:f.residents.length})),persistentActors:{fallback:19,scheduler:21,staff:19,chairmanSlot:1,visitorSlot:1},
 catalogSizes:[216,221].map(n=>({catalog:n,people:json('assets/data/office-actions-'+n+'.json').people.length,actions:json('assets/data/office-actions-'+n+'.json').actions.length})),
 reachability:json('artifacts/l216-2/reachability-status.json'),closure:{count:closure.files.length,limit:128,missing:closure.missing,files:closure.files},releaseBaseline:diagnostic,
 hashes:Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex')]))};
fs.writeFileSync(new URL('artifacts/office-behavior/obr4-metrics.json',root),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({...evidence,people:Object.fromEntries(Object.entries(people).map(([id,p])=>[id,{formalOutings:p.formalOutings,placeOutings:p.placeOutings,workHoursPlaceOutings:p.workHoursPlaceOutings,totalOutings:p.totalOutings,places:p.places} ])),closure:{count:closure.files.length,limit:128,missing:closure.missing},hashes:undefined},null,2));
