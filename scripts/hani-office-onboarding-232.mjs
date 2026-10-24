// Explicit onboarding delta over the immutable 216/221 design catalog.
export const onboardedPeople = [
 {id:'daon',name:'다온',home:{floor:'2f',room:'finance',anchorId:'desk_daon'},registration:'registered'},
 {id:'yoonseul',name:'윤슬',home:{floor:'2f',room:'life',anchorId:'desk_yoonseul'},registration:'registered'}
];
export function onboard232(table){
 table=structuredClone(table);
 for(const person of onboardedPeople)if(!table.people.some(p=>p.id===person.id))table.people.push(structuredClone(person));
 for(const row of [...table.actions,...table.families.map(f=>f.parent)]){
  if(row.participantSelector!=='active_registered_including_chairman_and_mir')continue;
  for(const person of onboardedPeople)if(!row.participants.includes(person.id)){
   row.participants.push(person.id);
   // Base-work/read/etc. carry one explicit home per participant; excursion
   // rows keep their shared destination list and their existing limits.
   if(row.places.some(p=>p.anchorId==='office_hani'))row.places.push(structuredClone(person.home));
  }
 }
 return table;
}
