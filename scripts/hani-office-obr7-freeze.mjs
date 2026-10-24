// Explicit authoring step; tests consume the frozen fragments, never rebuild them.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const fixture='scripts/fixtures/office-redesign-233.json';
const old=JSON.parse(fs.readFileSync(fixture,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const changes=old.changes.map(({file})=>{
 const dir='artifacts/office-behavior/obr7-input/';
 const before=fs.readFileSync(dir+file+'.base','utf8'),after=fs.readFileSync(file,'utf8');
 const diff=fs.readFileSync(dir+file+'.diff','utf8');
 const replacements=[];let a='',b='',active=false;
 const flush=()=>{if(!active)return;assert.ok(a&&b);assert.equal(before.split(a).length-1,1,file+' unique before');assert.equal(after.split(b).length-1,1,file+' unique after');replacements.push({before:a,after:b});a='';b=''};
 for(const line of diff.match(/[^\n]*\n|[^\n]+$/g)||[]){
  if(line.startsWith('@@')){flush();active=true;continue}
  if(!active||line.startsWith('\\'))continue;
  if(line[0]===' '||line[0]==='-')a+=line.slice(1);
  if(line[0]===' '||line[0]==='+')b+=line.slice(1);
 }
 flush();let reversed=after;for(const r of replacements)reversed=reversed.replace(r.after,r.before);
 assert.equal(reversed,before,file+' exact byte reversal');
 return {file,beforeSha256:hash(before),afterSha256:hash(after),replacements};
});
assert.deepEqual(changes.map(c=>c.file).sort(),['assets/data/office-actions-216.json','assets/data/office-actions-221.json','hani-office-live.js']);
fs.writeFileSync(fixture,JSON.stringify({...old,approvedHead:'ecc138414f0b1a01ea1747a51a85d976580419c4',reason:'obr7: explicitly scoped office redesign, obr6 performance and measured idle variety delta; exact hunks only',changes},null,2)+'\n');
console.log('승인 fixture: 3 owner, 정확한 역변환·각 fragment 1회',changes.map(c=>[c.file,c.replacements.length]));
