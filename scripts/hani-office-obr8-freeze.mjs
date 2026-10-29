// Explicit authoring step. Tests only read these immutable outputs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2),dir='artifacts/office-behavior/obr8-input/';
if(args.includes('--plans')){
 const target='scripts/fixtures/office-obr8-plans.json.gz';assert.ok(!fs.existsSync(target),'refuse overwrite; explicit new candidate freeze required');
 const original=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/office-obr6-plans.json.gz')));
 const records=original.records.map(({label,day,seconds,options})=>{
  const {scene}=loadScene(),s=scene.scheduler,formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options);
  return {label,day,seconds,options,outings,snapshot:s.snapshot(at(day,seconds),options)};
 });
 const bytes=Buffer.from(JSON.stringify({base:'84cadbdf4d39ce10d37254eb3ea26a548073c164',reason:'obr8 intentionally adds short errands and frequent public guests; formal plans, all routes and rest duration contracts unchanged',sourceSha256:sha(fs.readFileSync('hani-office-live.js')),records}));
 fs.writeFileSync(target,gzipSync(bytes));console.log('obr8 frozen full outing/snapshot oracle',sha(bytes));
}
if(args.includes('--approval')){
 const target='scripts/fixtures/office-redesign-233.json',old=JSON.parse(fs.readFileSync(target,'utf8'));
 const changes=old.changes.map(({file})=>{
  const before=fs.readFileSync(dir+file+'.base','utf8'),after=fs.readFileSync(file,'utf8'),diff=fs.readFileSync(dir+file+'.diff','utf8');
  let a='',b='',active=false;const replacements=[];
  const flush=()=>{if(!active)return;assert.ok(a&&b);assert.equal(before.split(a).length-1,1,file+' unique before');assert.equal(after.split(b).length-1,1,file+' unique after');replacements.push({before:a,after:b});a='';b=''};
  for(const line of diff.match(/[^\n]*\n|[^\n]+$/g)||[]){if(line.startsWith('@@')){flush();active=true;continue}if(!active||line.startsWith('\\'))continue;if(line[0]===' '||line[0]==='-')a+=line.slice(1);if(line[0]===' '||line[0]==='+')b+=line.slice(1)}flush();
  let reversed=after;for(const r of replacements)reversed=reversed.replace(r.after,r.before);assert.equal(reversed,before,file+' exact byte reversal');
  return {file,beforeSha256:sha(before),afterSha256:sha(after),replacements};
 });
 assert.deepEqual(changes.map(c=>c.file).sort(),['assets/data/office-actions-216.json','assets/data/office-actions-221.json','hani-office-live.js']);
 fs.writeFileSync(target,JSON.stringify({...old,approvedHead:'84cadbdf4d39ce10d37254eb3ea26a548073c164',reason:'obr8 user specification: short work errands, public takeout/parcel visits, unchanged formal plans and rest bounds; exact reviewed hunks only',changes},null,2)+'\n');
 console.log('233 pending: exact fragments and complete byte reversal checked',changes.map(c=>[c.file,c.replacements.length]));
}
