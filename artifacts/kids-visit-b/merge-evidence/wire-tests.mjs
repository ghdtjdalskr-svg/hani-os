import fs from 'node:fs';
import path from 'node:path';
const out='artifacts/kids-visit-b/merge-evidence/originals';
const files=['scripts/hani-office-kids-pose-b-closure.mjs','scripts/hani-office-companions-276-closure.mjs','scripts/hani-office-xmas.test.mjs','scripts/hani-office-kids-weekday.test.mjs','scripts/hani-office-bori-stroll.test.mjs','scripts/hani-office-companion-homes.test.mjs','scripts/hani-seoyun-m9.test.mjs'];
for(const file of files){
 const target=out+'/'+file;fs.mkdirSync(path.dirname(target),{recursive:true});if(!fs.existsSync(target))fs.copyFileSync(file,target);
 const source=fs.readFileSync(file,'utf8');fs.writeFileSync(file,source.replace("from './hani-runtime-closure.mjs'","from './hani-office-launch-284-closure.mjs'"));
}
// These main-owned tests execute their original affinity/mascot contract below
// the new kids layer. The raw combined runtime is independently exercised.
for(const file of ['scripts/hani-office-mascot-label.test.mjs','scripts/hani-office-affinity-cap.test.mjs']){
 const target=out+'/'+file;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(file,target);
 let source=fs.readFileSync(file,'utf8');
 source="import kidsPoseB from './hani-office-kids-pose-b-source.cjs';\n"+source;
 if(file.includes('mascot-label'))source=source.replace("const source=fs.readFileSync('hani-office-live.js','utf8')","const source=kidsPoseB.projectPreKidsPoseBSource(fs.readFileSync('hani-office-live.js','utf8'))");
 else source=source.replace("mascotInverse.projectPreMascotLabelSource(read('hani-office-live.js'))","mascotInverse.projectPreMascotLabelSource(kidsPoseB.projectPreKidsPoseBSource(read('hani-office-live.js')))");
 fs.writeFileSync(file,source);
}
