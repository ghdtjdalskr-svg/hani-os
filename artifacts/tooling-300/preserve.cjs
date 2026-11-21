// Restore only the four requested generated JSON files, preserving their test
// outputs separately, then prove all other tracked bytes outside tooling stayed.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'local'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const restore=['artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-drama/reachability.json'];
const generated=path.join(local,'generated');fs.mkdirSync(generated,{recursive:true});
for(const file of restore){
 const target=path.join(root,file),original=path.join(local,'originals',path.basename(file));
 if(!fs.existsSync(original))throw Error('missing original '+file);
 if(fs.existsSync(target)&&hash(fs.readFileSync(target))!==hash(fs.readFileSync(original))){const copy=path.join(generated,file);fs.mkdirSync(path.dirname(copy),{recursive:true});fs.copyFileSync(target,copy);}
 fs.copyFileSync(original,target);
}
const start=JSON.parse(fs.readFileSync(path.join(local,'start-hashes.json'),'utf8'));
const allowed=['scripts/hani-design-polish-2-preload.cjs','scripts/hani-helper-toggle-source.cjs','scripts/hani-office-affinity-cap-source.cjs','scripts/hani-one-pass-rules.mjs','scripts/hani-regression-baseline.mjs','scripts/hani-release-299-source.cjs','scripts/hani-reviewed-release-baseline.mjs','scripts/hani-runtime-closure.mjs','scripts/hani-join-ieum-source.cjs'];
const changed=[],unexpected=[],missing=[];
for(const [file,before]of Object.entries(start)){
 const current=path.join(root,file);if(!fs.existsSync(current)){missing.push(file);continue;}
 if(hash(fs.readFileSync(current))!==before){changed.push(file);if(!allowed.includes(file))unexpected.push(file);}
}
const report={tracked:Object.keys(start).length,changed,unexpected,missing,restored:restore.map(file=>({file,sha256:hash(fs.readFileSync(path.join(root,file))),sameAsStart:hash(fs.readFileSync(path.join(root,file)))===start[file]})),existingTestsPreserved:Object.keys(start).filter(f=>/^scripts\/.*\.test\.(mjs|cjs|js)$/.test(f)).length,existingFixturesPreserved:Object.keys(start).filter(f=>f.startsWith('scripts/fixtures/')).length};
fs.writeFileSync(path.join(__dirname,'preservation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(unexpected.length||missing.length||report.restored.some(r=>!r.sameAsStart))process.exitCode=1;
