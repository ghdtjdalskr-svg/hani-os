import fs from 'node:fs';
const seed=JSON.parse(fs.readFileSync(new URL('../data/hani-relationship-seed-v1.json',import.meta.url),'utf8'));
const voices=Object.fromEntries(seed.people.filter(p=>p.id!=='seongmin').map(p=>[p.id,{voice:p.voice,say:p.commentStyle,avoid:p.avoidTopics,oppa:p.callsChairmanOppa}]));
const content='// Generated from data/hani-relationship-seed-v1.json; verified by persona tests.\nexport const LOUNGE_VOICES = '+JSON.stringify(voices,null,2)+';\nexport const LOUNGE_RELATIONS = '+JSON.stringify(seed.relations.map(r=>({a:r.a,b:r.b,nicknames:r.nicknames})),null,2)+';\n';
fs.writeFileSync(new URL('../supabase/functions/hani-newsroom-publisher/lounge-voices.mjs',import.meta.url),content);
console.log('Updated lounge voice snapshot from canonical relationship seed.');
