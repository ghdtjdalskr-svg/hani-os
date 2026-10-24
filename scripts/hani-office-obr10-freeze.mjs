// Explicit authoring step only: tests never create or update expected results.
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync,gunzipSync} from 'node:zlib';
import {loadScene,at} from './hani-office-lively-fixture.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const reason='obr10 explicit behavior expansion: personal desk actions, signatures, work tasks with unique IDs, companions, timed moments, visitor hosts and atomic social extensions; individual dwell includes FIFO waiting; optional staff walking crossings retain a 30px audit buffer above the original 20/24px gate; formal ledger, routes, stay minima, floor caps and storage zero preserved';
if(process.argv.includes('--plans')){
 const args=process.argv.slice(2),target=args.includes('--plans-target')?args[args.indexOf('--plans-target')+1]:'scripts/fixtures/office-obr10-plans.json.gz';
 assert.match(target,/^scripts\/fixtures\/office-obr10-plans(?:-v\d+)?\.json\.gz$/);assert.ok(!fs.existsSync(target),'new identity required, never overwrite a frozen oracle');
 const previous=JSON.parse(gunzipSync(fs.readFileSync('scripts/fixtures/office-obr6-plans.json.gz')));
 const records=previous.records.map(({label,day,seconds,options})=>{
  const {scene}=loadScene(),s=scene.scheduler,formal=s.plan(day,options),outings=s.blockPlan(day,0,formal,options);
  return {label,day,seconds,options,outings,snapshot:s.snapshot(at(day,seconds),options)};
 });
 const bytes=Buffer.from(JSON.stringify({base:'246f1c0',reason,sourceSha256:sha(fs.readFileSync('hani-office-live.js')),placesSha256:sha(fs.readFileSync('data/hani-building/office-places.json')),records}));
 fs.writeFileSync(target,gzipSync(bytes));console.log('obr10 immutable plan hash',sha(bytes));
}
if(process.argv.includes('--approval')){
 const target='scripts/fixtures/office-redesign-233.json',old=JSON.parse(fs.readFileSync(target,'utf8')),dir='artifacts/office-behavior/obr10-input/';
 assert.equal(old.baseSha,'7a10595f2a0890e63cd04dbc95c057edbbd3d5b0');
 const changes=old.changes.map(({file,beforeSha256})=>{
  const before=fs.readFileSync(dir+file+'.base','utf8'),after=fs.readFileSync(file,'utf8'),diff=fs.readFileSync(dir+file+'.diff','utf8');assert.equal(sha(before),beforeSha256);
  let a='',b='',active=false;const replacements=[];
  const flush=()=>{if(!active)return;assert.ok(a&&b);assert.equal(before.split(a).length-1,1,file+' unique before');assert.equal(after.split(b).length-1,1,file+' unique after');replacements.push({before:a,after:b});a='';b=''};
  for(const line of diff.match(/[^\n]*\n|[^\n]+$/g)||[]){if(line.startsWith('@@')){flush();active=true;continue}if(!active||line.startsWith('\\'))continue;if(line[0]===' '||line[0]==='-')a+=line.slice(1);if(line[0]===' '||line[0]==='+')b+=line.slice(1)}flush();
  let reversed=after;for(const r of replacements)reversed=reversed.replace(r.after,r.before);assert.equal(reversed,before,file+' complete exact byte reversal');
  return {file,beforeSha256:sha(before),afterSha256:sha(after),replacements};
 });
 fs.writeFileSync(target,JSON.stringify({...old,approvedHead:'246f1c0',reason,changes},null,2)+'\n');console.log('233 exact fixed-origin fragments and reverse bytes verified');
}
