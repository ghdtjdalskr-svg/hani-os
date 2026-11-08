const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),hash=x=>createHash('sha256').update(x).digest('hex');
const between=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const files=['hani-office-live.js','hani-office-live.css'].map(file=>{
 const before=fs.readFileSync(path.join(__dirname,'baseline',file),'utf8'),after=fs.readFileSync(path.join(root,file),'utf8');
 const replacements=file.endsWith('.css')?[{name:'kid fallback atlas',before:'kids-v1.webp',after:'kids-v2.webp'}]:[
  ['companion atlas','  function companionAtlas(','  function companionSafe('],
  ['existing kids activity','  function companionActivity(','  function residentSeed(']
 ].map(([name,a,b])=>({name,before:between(before,a,b),after:between(after,a,b)})).concat([
  ['visit pose priority','        child.position=sample(path,progress)'],
  ['B sprite label envelope','  function residentBounds('],
  ['existing pose comparison','      const prior=actor.officeResidentState'],
  ['existing pose renderer','      if(posed||turned)applyPose']
 ].map(([name,anchor])=>({name,before:before.split('\n').find(s=>s.startsWith(anchor)),after:after.split('\n').find(s=>s.startsWith(anchor))})));
 replacements.sort((a,b)=>before.indexOf(a.before)-before.indexOf(b.before));
 let restored=after;for(const r of replacements){assert.equal(restored.split(r.after).length-1,1,r.name);restored=restored.replace(r.after,()=>r.before)}assert.equal(hash(restored),hash(before));
 return {file,beforeSha256:hash(before),afterSha256:hash(after),replacements};
});
const delta={baseCommit:'70c5d5d8e1ddc1262314f412934b3a450974599c',files};
const bytes=JSON.stringify(delta,null,2)+'\n';fs.writeFileSync(path.join(root,'scripts/fixtures/office-kids-pose-b-delta.json'),bytes);console.log('delta hash',hash(bytes));
