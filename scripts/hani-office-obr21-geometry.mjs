// Independent test geometry at the requested phone map width. No runtime import.
export const boxesOverlap=(a,b)=>a.left<b.right-.01&&b.left<a.right-.01&&a.top<b.bottom-.01&&b.top<a.bottom-.01;
export function spriteBox(p,width=342){
 const height=Math.max(40,width*.068),visitor=!!p.visitor,ratio=visitor?2/3:.75,pivot=visitor?45/48:61/64;
 const x=p.seat.x*width/100,y=p.seat.y*(width*941/1672)/100;
 return {left:x-height*ratio/2,right:x+height*ratio/2,top:y-height*pivot,bottom:y+height*(1-pivot)};
}
// Serialized by Playwright: inspect actual DOM boxes, with the exact scheduler
// home anchor exemption. Moving actors never enter the stationary-pair check.
export function readStationarySprites(){
 if(document.getElementById('haniOfficeMap').dataset.floor!=='1f')throw Error('1F must be rendered');
 const snapshot=HaniBuildingScene.scheduler.snapshot(new Date(),{chairmanPresent:HaniOfficePresence.chairman==='active'});
 const catalogIds=new Set(snapshot.entries.filter(p=>p.eventId).map(p=>p.id));
 const rows=[...document.querySelectorAll('#haniOfficeActors .hani-office-actor')].filter(a=>!a.hidden&&a.dataset.walking!=='true').map(actor=>{
  const r=actor.querySelector('.hani-office-sprite').getBoundingClientRect();
  const home=actor.dataset.visitor!=='true'&&actor.officeAnchor===HaniBuildingScene.homeSeat(actor.dataset.person)?.anchor;
  return {id:actor.dataset.person,anchor:actor.officeAnchor,home,catalog:catalogIds.has(actor.dataset.person),rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
 });
 const overlap=(a,b)=>a.left<b.right-.01&&b.left<a.right-.01&&a.top<b.bottom-.01&&b.top<a.bottom-.01;
 const collisions=[],homes=[],catalogExclusions=[];
 for(let i=0;i<rows.length;i++)for(const b of rows.slice(i+1))if(overlap(rows[i].rect,b.rect))(rows[i].catalog||b.catalog?catalogExclusions:rows[i].home&&b.home?homes:collisions).push([rows[i].id,b.id]);
 return {rows,collisions,homes,catalogExclusions};
}
