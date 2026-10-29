// Explicit authoring only. Never run by tests; the obr8 plan oracle is untouched.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.ok(process.argv.includes('--approval'),'explicit --approval required');
const target='scripts/fixtures/office-redesign-233.json',old=JSON.parse(fs.readFileSync(target,'utf8'));
assert.equal(old.baseSha,'7a10595f2a0890e63cd04dbc95c057edbbd3d5b0');
const dir='artifacts/office-behavior/obr9-input/';
const changes=old.changes.map(({file,beforeSha256})=>{
 const before=fs.readFileSync(dir+file+'.base','utf8'),after=fs.readFileSync(file,'utf8'),diff=fs.readFileSync(dir+file+'.diff','utf8');
 assert.equal(sha(before),beforeSha256,file+' unchanged fixed Git origin');
 let a='',b='',active=false;const replacements=[];
 const flush=()=>{if(!active)return;assert.ok(a&&b);assert.equal(before.split(a).length-1,1,file+' unique before');assert.equal(after.split(b).length-1,1,file+' unique after');replacements.push({before:a,after:b});a='';b=''};
 for(const line of diff.match(/[^\n]*\n|[^\n]+$/g)||[]){if(line.startsWith('@@')){flush();active=true;continue}if(!active||line.startsWith('\\'))continue;if(line[0]===' '||line[0]==='-')a+=line.slice(1);if(line[0]===' '||line[0]==='+')b+=line.slice(1)}flush();
 let reversed=after;for(const r of replacements)reversed=reversed.replace(r.after,r.before);assert.equal(reversed,before,file+' exact byte reversal');
 return {file,beforeSha256:sha(before),afterSha256:sha(after),replacements};
});
assert.deepEqual(changes.map(c=>c.file).sort(),['assets/data/office-actions-216.json','assets/data/office-actions-221.json','hani-office-live.js']);
fs.writeFileSync(target,JSON.stringify({...old,approvedHead:'0b7bedde2583387a626a898f00dcb7a3ef4fecae',reason:'obr9 user specification: calculation-only performance recovery; frozen obr8 full formal/outing/snapshot bytes and all safety thresholds unchanged; exact reviewed hunks only',changes},null,2)+'\n');
console.log('233 pending: fixed Git origin, unique fragments and complete byte reversal PASS',changes.map(c=>[c.file,c.replacements.length]));
