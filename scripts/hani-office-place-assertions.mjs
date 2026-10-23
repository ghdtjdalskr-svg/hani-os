import assert from 'node:assert/strict';
export function assertResources(s,a,b){
 const x=s.resourceIntervals(a),y=s.resourceIntervals(b);
 for(const [id,ranges]of x)for(const p of ranges)for(const q of y.get(id)||[])assert.ok(p.start>=q.end||q.start>=p.end,'resource '+id+' double-booked at '+Math.max(p.start,q.start));
}
export function validPlaceSpeech(p,card,table){
 if(p.visitor)return p.line===p.at;
 if(!card)return true;
 if(card.kind==='errand'){
  if(p.state!=='AT_PLACE'||p.floor!==card.floor||!card.slots.includes(p.seat.anchor)||p.targetAnchor!==p.seat.anchor||!card.at.includes(p.line)||/커피|쉬는|휴식|창밖|간식|소파|산책|테라스|라운지/.test(p.line))return false;
  if(card.errandKind==='colleague'){
   const target=table.people.find(q=>q.id===card.targetPerson),name=target?.name;
   return !!name&&p.line.includes(name)&&['side_desk_'+target.id,'approach_desk_'+target.id,'side_'+target.home.anchorId,'approach_'+target.home.anchorId].includes(p.seat.anchor);
  }
  return card.errandKind==='delivery'?p.seat.anchor.startsWith('door_'):card.errandKind==='notice'&&p.seat.anchor==='ilbo_board';
 }
 if(!p.groupIds)return [...card.at,...(card.atByPerson?.[p.id]||[])].includes(p.line);
 const names=p.groupIds.filter(id=>id!==p.id).map(id=>table.people.find(q=>q.id===id)?.name);
 const location=card.at[0].split('에서')[0];
 return names.length>=1&&names.every(name=>name&&p.line.includes(name))&&p.line.includes(location+'에서')&&p.line.endsWith(' 중');
}
