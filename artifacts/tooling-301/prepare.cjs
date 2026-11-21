// Local evidence only; no Git mutations or runtime edits.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'local');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=(sha,prefix='')=>repo.tree(sha).flatMap(r=>r.mode==='40000'?walk(r.sha,prefix+r.name+'/'):[{file:prefix+r.name,sha:r.sha}]);
fs.mkdirSync(local,{recursive:true});
const inventory=new Set(walk(repo.commit('0558dc3').tree).map(r=>r.file));
for(const dir of ['scripts','scripts/fixtures'])for(const f of fs.readdirSync(path.join(root,dir)))if(fs.statSync(path.join(root,dir,f)).isFile())inventory.add(dir+'/'+f);
for(const f of ['artifacts/ieum-seat/REPORT.md','artifacts/ieum-seat/TEST-RESULTS.md','artifacts/seat-capacity/PLAN.md','docs/development-history/handoffs/2026-11-19-ieum-seat-2.md','docs/development-history/handoffs/2026-11-19-ieum-seat-3.md'])inventory.add(f);
fs.writeFileSync(path.join(local,'start-hashes.json'),JSON.stringify(Object.fromEntries([...inventory].map(f=>[f,hash(fs.readFileSync(path.join(root,f)))])),null,2)+'\n');
const generated=['artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-drama/reachability.json'];
fs.mkdirSync(path.join(local,'originals'),{recursive:true});
for(const f of generated)fs.copyFileSync(path.join(root,f),path.join(local,'originals',path.basename(f)));
const baseline=path.join(local,'baseline'),sha=repo.commit('ad95b84').sha;
for(const row of walk(repo.commit(sha).tree)){const dest=path.join(baseline,row.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,repo.object(row.sha).data);}
const marker=fs.readFileSync(path.join(root,'.git'),'utf8').trim(),admin=path.resolve(root,marker.slice(8));
const common=path.resolve(admin,fs.readFileSync(path.join(admin,'commondir'),'utf8').trim());
fs.mkdirSync(path.join(baseline,'.git/refs/remotes/origin'),{recursive:true});
fs.writeFileSync(path.join(baseline,'.git/HEAD'),sha+'\n');
fs.writeFileSync(path.join(baseline,'.git/refs/remotes/origin/main'),sha+'\n');
fs.writeFileSync(path.join(baseline,'.git/commondir'),common+'\n');
fs.writeFileSync(path.join(baseline,'.git/config'),'[core]\n repositoryformatversion = 0\n bare = false\n');
// Match optional sibling image evidence, when present, at the baseline's ../ path.
const siblings=['barista-night/artifacts/barista-night/counter-night.webp'];
const pet=fs.readFileSync(path.join(root,'scripts/hani-office-pet-bori.test.mjs'),'utf8');
for(const m of pet.slice(pet.indexOf('const expected='),pet.indexOf('for(const [file,[source,width,height]]')).matchAll(/\[\s*['"]([^'"]+\.webp)['"]\s*,/g))siblings.push('pet-bori/artifacts/pet-bori/'+m[1]);
const environment=[];
for(const f of siblings){const source=path.resolve(root,'..',f),dest=path.join(local,f);if(fs.existsSync(source)){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);environment.push({file:f,hash:hash(fs.readFileSync(source))});}else environment.push({file:f,missing:true});}
fs.writeFileSync(path.join(local,'baseline-environment.json'),JSON.stringify(environment,null,2)+'\n');
console.log(JSON.stringify({snapshot:inventory.size,baseline:sha,tests:fs.readdirSync(path.join(baseline,'scripts')).filter(f=>f.endsWith('.test.mjs')).length,environment}));
