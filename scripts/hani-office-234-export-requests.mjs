// Fixed historical inputs only; never export the worktree as its own oracle.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const files=['hani-office-live.css','assets/data/desk-mascots-v1.json','hani-desk-mascots.js','hani-development-history-v1.js','hani-main.js','index.html','hani-design-system.css','hani-investment-committee.js','hani-context-remote-v1.js','hani-office-live.js','hani-style-07.css','hani-ui-v02992.js','hani-character-archive-data.js','hani-character-archive.js','hani-organization-hub.js'];
const baseline=fs.readFileSync('scripts/hani-reviewed-release-baseline.mjs','utf8'),requests=new Set();
const add=(ref,file)=>requests.add(ref+':'+file);
for(const file of ['hani-office-live.js','hani-office-live.css','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','assets/sprites-v2/manifest.json','assets/data/office-actions-221.json','assets/data/office-actions-216.json','data/hani-building/office-places.json'])add('bebcf2c16b163df1f311fbcdc36caa42a4af7940',file);
for(const row of baseline.matchAll(/\{sha:'([a-f0-9]{40})',reason:'[^']*',files:\[([^\]]+)\]/g))for(const [,file]of row[2].matchAll(/'([^']+)'/g)){add(row[1],file);add(row[1]+'^',file)}
for(const file of files)add('776752c971f2ce48edf376a707eb345ae57da98c',file);
for(const file of ['assets/data/desk-mascots-v1.json','hani-desk-mascots.js']){requests.delete('776752c971f2ce48edf376a707eb345ae57da98c:'+file);add('2784e4e9855211021766f9eb65d764b2aafac468',file)}
const walk=(value,callback)=>{if(value&&typeof value==='object'){callback(value);for(const v of Object.values(value))walk(v,callback)}};
const fixtureFiles=['train233-integrations.json','office-redesign-233.json','milestones-v1.json','hero-crop-fix.json'];
for(const name of fixtureFiles){const f=JSON.parse(fs.readFileSync('scripts/fixtures/'+name));walk(f,o=>{if(o.sha&&o.file)for(const ref of [o.sha,o.sha+'^'])add(ref,o.file);if(o.baseSha||o.candidateSha){const owners=new Set((o.changes||[]).map(c=>c.file));for(const file of owners)for(const ref of [o.baseSha,o.candidateSha].filter(Boolean))add(ref,file)}})}
for(const file of ['hani-office-live.js','data/hani-building/spatial-contract.json','data/hani-building/art-map-v1.json','assets/sprites-v2/manifest.json','assets/data/office-actions-221.json','assets/data/office-actions-216.json','data/hani-building/office-places.json'])for(const ref of ['246f1c0','0b7bedd','beffc3850ea890ec84ce623579b26b4b5a3cd35c','33d39892c2a5c0a1779650e440a2dd5068b44495','04fb2b377f28958aec1480ca09244f4567c3a339']){
 if(ref==='04fb2b377f28958aec1480ca09244f4567c3a339'&&file==='data/hani-building/office-places.json')continue; // introduced after 230
 add(ref,file);
}
add('33d39892c2a5c0a1779650e440a2dd5068b44495','hani-office-live.css');
for(const ref of ['0d47015','ecc1384','84cadbd','beffc38'])add(ref,'hani-office-live.js');
for(const name of fixtureFiles)for(const ref of ['a29ff905be5a3458a0f6971c107c183d96c6b965'])add(ref,'scripts/fixtures/'+name);
const releasedFiles=new Set([...files,...fixtureFiles.flatMap(name=>{const out=[];walk(JSON.parse(fs.readFileSync('scripts/fixtures/'+name)),o=>{if(o.file)out.push(o.file)});return out})]);
for(const file of releasedFiles)add('beffc3850ea890ec84ce623579b26b4b5a3cd35c',file);
for(const file of releasedFiles)if(!['assets/data/desk-mascots-v1.json','hani-desk-mascots.js'].includes(file))add('776752c971f2ce48edf376a707eb345ae57da98c',file);
const out=[...requests].sort().map(key=>({key,path:createHash('sha256').update(key).digest('hex')+'.blob'}));
fs.mkdirSync('artifacts/office-behavior/obr13-git',{recursive:true});fs.writeFileSync('artifacts/office-behavior/obr13-git/requests.json',JSON.stringify(out,null,2)+'\n');console.log('fixed historical requests',out.length);
