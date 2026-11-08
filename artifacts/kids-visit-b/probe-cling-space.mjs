import {loadScene,at} from '../../scripts/hani-office-lively-fixture.mjs';
const {scene}=loadScene(),r=scene.residents,seen=new Set();let found=0;
for(let t=36000;t<61200;t+=10){const n=at('2026-11-08',t),staff=scene.snapshot(n,{chairmanPresent:true}),chair=staff.floors.flatMap(f=>f.people).find(p=>p.id==='seongmin');if(chair.walking)continue;const c=chair.position||[chair.seat.x,chair.seat.y],key=chair.floor+'|'+c.join(',');if(seen.has(key))continue;seen.add(key);
 const states=r.companionSnapshot(n,staff),kid=states.find(p=>p.id==='kid-suyeon');if(!kid)continue;
 const dist=(a,b)=>Math.hypot((a[0]-b[0])*scene.art.width/100,(a[1]-b[1])*scene.art.height/100),other=[...staff.floors.flatMap(f=>f.people),...states].filter(p=>p.id!==kid.id),safe=v=>r.companionSafe(chair.floor,v,true)&&!other.some(p=>{const a=p.position||[p.seat?.x,p.seat?.y];return p.floor===chair.floor&&a.every(Number.isFinite)&&dist(a,v)<(p.id==='seongmin'?80:86)}),clear=(a,b)=>Array.from({length:31},(_,i)=>[a[0]+(b[0]-a[0])*i/30,a[1]+(b[1]-a[1])*i/30]).every(safe);
 const candidates=[];for(const dx of [-84,84,-76,76])for(const dy of [12,32,-16,52,-32]){const v=[c[0]+dx/scene.art.width*100,c[1]+dy/scene.art.height*100];if(safe(v))candidates.push({dx,dy,direct:clear(kid.position,v)})}
 if(candidates.length){found++;console.log(JSON.stringify({t,key,home:kid.position,candidates}));}
}console.log('safe nearby stops',found,'of',seen.size);
