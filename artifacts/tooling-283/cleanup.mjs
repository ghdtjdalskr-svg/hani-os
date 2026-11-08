import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=process.cwd(),out='artifacts/tooling-283';
const hash=b=>createHash('sha256').update(b).digest('hex');
const initial=JSON.parse(fs.readFileSync(out+'/initial-files.json'));
const before=new Map(initial.map(r=>[r.file,r.sha256]));
const protectedFiles=JSON.parse(fs.readFileSync(out+'/restore-files.json'));
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()&&!['.git','node_modules'].includes(e.name)?walk(path.join(d,e.name)):e.isFile()?[path.join(d,e.name).replaceAll('\\','/')]:[]);
const restored=[];
for(const f of protectedFiles){
 const original=fs.readFileSync(out+'/before/'+f);
 assert.equal(hash(original),before.get(f),f+' backup identity');
 if(fs.existsSync(f)&&!fs.readFileSync(f).equals(original)){fs.mkdirSync(path.dirname(out+'/generated/'+f),{recursive:true});fs.copyFileSync(f,out+'/generated/'+f);}
 fs.writeFileSync(f,original);assert.equal(hash(fs.readFileSync(f)),before.get(f));restored.push(f);
}
const removed=[];
const newPng=walk('.').filter(f=>f.toLowerCase().endsWith('.png')&&!before.has(f));
const generatedPng=f=>f.startsWith('artifacts/character-archive/')||/^\.ai-budget-private\/navlogin-qa\/organization-\d+\.png$/.test(f)||/^qa-evidence\/dashboard-(monthly-cadence|period-help)-\d+\.png$/.test(f);
for(const f of newPng.filter(generatedPng)){
 const absolute=path.resolve(f);assert.ok(absolute.startsWith(root+path.sep),'PNG target inside tool283');
 fs.unlinkSync(absolute);removed.push(f);
}
const extraArtifacts=walk('artifacts').filter(f=>!f.startsWith(out+'/')&&!before.has(f)&&!f.endsWith('.png'));
const result={restored,removedPng:removed,unrelatedNewPng:newPng.filter(f=>!generatedPng(f)),extraArtifacts};
fs.writeFileSync(out+'/artifact-cleanup.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
