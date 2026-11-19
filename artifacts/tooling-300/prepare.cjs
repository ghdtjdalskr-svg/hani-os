// Local evidence preparation; never updates the worktree Git index or refs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'local');
fs.mkdirSync(local,{recursive:true});
function treeFiles(sha,prefix=''){return repository.tree(sha).flatMap(row=>row.mode==='40000'?treeFiles(row.sha,prefix+row.name+'/'):[{file:prefix+row.name,sha:row.sha}]);}
const files=treeFiles(repository.commit('9f49286').tree).map(row=>row.file);
const hashes=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
fs.writeFileSync(path.join(local,'start-hashes.json'),JSON.stringify(hashes,null,2)+'\n');
const preserved=['artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-drama/reachability.json'];
fs.mkdirSync(path.join(local,'originals'),{recursive:true});
for(const f of preserved)if(fs.existsSync(path.join(root,f)))fs.copyFileSync(path.join(root,f),path.join(local,'originals',path.basename(f)));
const baseline=path.join(local,'baseline');fs.mkdirSync(baseline,{recursive:true});
for(const row of treeFiles(repository.commit('2220b61').tree)){const dest=path.join(baseline,row.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,repository.object(row.sha).data);}
const marker=fs.readFileSync(path.join(root,'.git'),'utf8').trim();
const admin=path.resolve(root,marker.slice(8));
const gitDir=path.resolve(admin,fs.readFileSync(path.join(admin,'commondir'),'utf8').trim());
for(const d of ['refs/remotes/origin','refs/heads'])fs.mkdirSync(path.join(baseline,'.git',d),{recursive:true});
const sha=repository.commit('2220b61').sha;
fs.writeFileSync(path.join(baseline,'.git','HEAD'),sha+'\n');
fs.writeFileSync(path.join(baseline,'.git','refs/remotes/origin/main'),sha+'\n');
fs.writeFileSync(path.join(baseline,'.git','commondir'),gitDir+'\n');
fs.writeFileSync(path.join(baseline,'.git','config'),'[core]\n repositoryformatversion = 0\n bare = false\n');
console.log(JSON.stringify({tracked:files.length,baseline:sha,preserved}));
