import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=s=>createHash('sha256').update(s).digest('hex');
const out='artifacts/kids-visit-b/merge-evidence';
fs.mkdirSync(out,{recursive:true});
const files=['hani-office-live.js','scripts/hani-seoyun-m9-source.cjs','scripts/hani-seoyun-m9.test.mjs','docs/development-history/CURRENT.md'];
for(const file of files){const target=out+'/originals/'+file;fs.mkdirSync(path.dirname(target),{recursive:true});assert.ok(!fs.existsSync(target));fs.copyFileSync(file,target);}
const conflict=/^<<<<<<< HEAD\r?\n([\s\S]*?)^=======\r?\n([\s\S]*?)^>>>>>>> origin\/main\r?\n/gm;
for(const file of files){
 let source=fs.readFileSync(file,'utf8');
 source=source.replace(conflict,(_,ours,theirs)=>{
  if(file==='hani-office-live.js')return theirs.split(/(?<=\n)/).slice(0,5).join('')+ours.split(/(?<=\n)/).slice(5).join('');
  if(file.endsWith('CURRENT.md'))return ours+'\n'+theirs;
  return theirs;
 });
 // The main M9 test already calls readBytes; retain the branch's byte reader
 // while following main's affinity-cap inverse, after the outer kids layer.
 if(file.endsWith('hani-seoyun-m9-source.cjs'))source=source.replace("const {projectPreKidsPoseBSource}=require('./hani-office-kids-pose-b-source.cjs');\n",'');
 if(file.endsWith('hani-seoyun-m9.test.mjs'))source=source.replace("const originalBytes=", "const readBytes=f=>capInverse.delta.file===f?Buffer.from(read(f)):fs.readFileSync(f);\nconst originalBytes=");
 assert.doesNotMatch(source,/^(<<<<<<<|=======|>>>>>>>)/m);fs.writeFileSync(file,source);
}
const runtime=fs.readFileSync('hani-office-live.js','utf8');
const weekday=JSON.parse(fs.readFileSync('scripts/fixtures/office-kids-weekday-delta.json'));
const pose=JSON.parse(fs.readFileSync('scripts/fixtures/office-kids-pose-b-delta.json'));
function undo(source,replacements){for(const pair of replacements){assert.equal(source.split(pair.after).length-1,1,pair.name);source=source.replace(pair.after,()=>pair.before);}return source;}
const preWeekday=undo(runtime,weekday.replacements),prePose=undo(preWeekday,pose.files[0].replacements);
// Independent main mascot digest proves the combined file is precisely main
// plus the complete authored B and weekday replacements.
const mascot=JSON.parse(fs.readFileSync('scripts/fixtures/office-mascot-label-delta.json'));
assert.equal(hash(prePose),mascot.afterSha256,'main office bytes restored exactly');
for(const [file,source]of [['artifacts/kids-weekday/baseline/hani-office-live.js',preWeekday],['artifacts/kids-visit-b/baseline/hani-office-live.js',prePose]]){
 const target=out+'/originals/'+file;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);fs.writeFileSync(file,source);
}
function refresh(file,delta,sourceFile){
 const original=fs.readFileSync(file);fs.writeFileSync(out+'/'+path.basename(file)+'.before',original);
 fs.writeFileSync(file,JSON.stringify(delta,null,2)+'\n');
 let s=fs.readFileSync(sourceFile,'utf8');s=s.replace(/assert\.equal\(hash\(bytes\),'[a-f0-9]{64}'/,"assert.equal(hash(bytes),'"+hash(fs.readFileSync(file))+"'");
 s=s.replace(/assert\.equal\(delta\.baseCommit,'[a-f0-9]{40}'/,"assert.equal(delta.baseCommit,'"+delta.baseCommit+"'");
 fs.writeFileSync(sourceFile,s);
}
// The task supplies the main short SHA; the full exact runtime hash is pinned.
weekday.mergeBase='5c375d9';weekday.beforeSha256=hash(preWeekday);weekday.afterSha256=hash(runtime);
pose.mergeBase='5c375d9';pose.files[0].beforeSha256=hash(prePose);pose.files[0].afterSha256=hash(preWeekday);
refresh('scripts/fixtures/office-kids-weekday-delta.json',weekday,'scripts/hani-office-kids-weekday-source.cjs');
refresh('scripts/fixtures/office-kids-pose-b-delta.json',pose,'scripts/hani-office-kids-pose-b-source.cjs');
fs.writeFileSync(out+'/resolution.json',JSON.stringify({base:'5c375d9',mainOffice:hash(prePose),poseB:hash(preWeekday),weekday:hash(runtime),runtimeChanged:['hani-office-live.js'],replacements:{poseB:pose.files[0].replacements.length,weekday:weekday.replacements.length}},null,2)+'\n');
console.log(JSON.stringify({resolved:files,mainOffice:hash(prePose),runtime:hash(runtime)}));
