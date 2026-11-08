import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolveRuntimeClosure} from '../../../scripts/hani-runtime-closure.mjs';
import kids from '../../../scripts/hani-office-kids-pose-b-source.cjs';
import weekday from '../../../scripts/hani-office-kids-weekday-source.cjs';
import mascot from '../../../scripts/hani-office-mascot-label-source.cjs';
import release from '../../../scripts/hani-release-284-source.cjs';
const out='artifacts/kids-visit-b/merge-evidence',hash=x=>createHash('sha256').update(x).digest('hex');
const read=f=>fs.readFileSync(f,'utf8'),raw=read('hani-office-live.js'),main=kids.restoreKidsPoseBSource(raw);
assert.equal(hash(main),mascot.delta.afterSha256);
const names={storage:/\b(?:localStorage|sessionStorage)\b/g,storageCalls:/\b(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(/g,cloud:/\b(?:supabase|cloudClient)\b/g,interval:/\bsetInterval\s*\(/g,timeout:/\bsetTimeout\s*\(/g,listener:/\baddEventListener\s*\(/g};
const counts={};for(const [name,re]of Object.entries(names)){const count=s=>[...s.matchAll(re)].length;counts[name]={main:count(main),merged:count(raw),added:count(raw)-count(main)};assert.equal(counts[name].added,0);}
const cap=s=>s.slice(s.indexOf('  function createOfficeAffinity(){'),s.indexOf('  function createTapLines('));assert.equal(cap(main),cap(raw));
const oldWeekday=JSON.parse(read(out+'/office-kids-weekday-delta.json.before')),oldPose=JSON.parse(read(out+'/office-kids-pose-b-delta.json.before'));
assert.deepEqual(oldWeekday.replacements,weekday.delta.replacements);assert.deepEqual(oldPose.files.map(r=>r.replacements),kids.delta.files.map(r=>r.replacements));
const assertions=[];
for(const file of ['scripts/hani-office-mascot-label.test.mjs','scripts/hani-office-affinity-cap.test.mjs','scripts/hani-office-kids-weekday.test.mjs','scripts/hani-seoyun-m9.test.mjs']){
 let before=read(out+'/originals/'+file);
 before=before.replace(/^<<<<<<< HEAD\r?\n[\s\S]*?^=======\r?\n([\s\S]*?)^>>>>>>> origin\/main\r?\n/gm,'$1');
 const get=s=>s.split(/\r?\n/).filter(l=>/\bassert\./.test(l));
 assert.deepEqual(get(read(file)),get(before),file+' original assertions preserved');assertions.push({file,lines:get(before).length,preserved:true});
}
const sourceFiles=['hani-office-live.js','scripts/hani-seoyun-m9-source.cjs','scripts/hani-seoyun-m9.test.mjs','scripts/hani-office-mascot-label-source.cjs','scripts/hani-office-mascot-label.test.mjs','scripts/hani-office-kids-weekday-source.cjs','scripts/hani-office-kids-pose-b-source.cjs','scripts/hani-office-kids-weekday.test.mjs','scripts/hani-office-kids-merge.test.mjs','scripts/hani-release-283-source.cjs','scripts/hani-release-284-source.cjs'];
const syntax=[];for(const file of sourceFiles){assert.doesNotMatch(read(file),/^(<<<<<<<|=======|>>>>>>>)/m);syntax.push(file);}
assert.doesNotMatch(read('docs/development-history/CURRENT.md'),/^(<<<<<<<|=======|>>>>>>>)/m);
for(const file of Object.keys(release.delta.files))assert.equal(hash(read(file)),release.delta.files[file].after,'284 runtime unchanged '+file);
const closure=await resolveRuntimeClosure({exists:fs.existsSync,read:f=>fs.readFileSync(f)});assert.equal(closure.files.length,164);assert.deepEqual(closure.missing,[]);
const seed=value=>{let n=2166136261;for(const ch of value)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0};
const date='2026-01-02',dateSeed=seed(date+'|kids-weekday');assert.equal(dateSeed%4,0);
const result={base:'5c375d9 (task-supplied; Git not executed)',runtimeSha256:hash(raw),mainOfficeSha256:hash(main),counts,affinityOwnerByteIdentical:true,authoredKidsReplacementsUnchanged:true,assertions,syntaxFiles:syntax,rawClosure:{count:closure.files.length,missing:closure.missing,files:closure.files},runtimeFilesAgainstMain:['hani-office-live.js','hani-office-live.css','assets/office-companions/kids-v2.webp'],runtimeFilesEditedThisTask:['hani-office-live.js'],displayVersion:'2.9.284',latestUI:'hani-ui-v02992.js?v=2.9.284',lastScript:'hani-launch-greeting.js',screenshotSample:{date,KST:'16:00',dateSeed,mod4:dateSeed%4},gitCommands:0,cloudWrites:0,productionReadback:'not run'};
fs.writeFileSync(out+'/audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,rawClosure:{count:closure.files.length,missing:[]},syntaxFiles:syntax.length}));
