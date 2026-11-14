// Preserve test output under this task, restoring only provable starting bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..'),dir='artifacts/design-polish-1';
const initial=JSON.parse(fs.readFileSync(path.join(__dirname,'start-inventory.json'),'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
if(repo.reference('HEAD')!==initial.base)throw Error('Starting identity changed; do not restore another integration or session');
const generatedPaths=new Set(['artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-drama/reachability.json','artifacts/exam-popup-214/node-results.json','artifacts/history-226/unit.json','artifacts/office-219/label-unit-results.json','artifacts/street-journal-v1/package-check.json']);
const allowed=new Set(['hani-main.js','hani-design-system.css','scripts/hani-theme-thaw-source.cjs','scripts/hani-release-version-layers.cjs','docs/development-history/CURRENT.md','docs/development-history/handoffs/2026-11-14-design-polish-1.md']);
function baseBytes(file){let sha=repo.commit(initial.base).tree;for(const name of file.split('/')){const entry=repo.tree(sha).find(e=>e.name===name);if(!entry)throw Error('not in starting base: '+file);sha=entry.sha;}return repo.object(sha).data;}
const existingChanged=[],newOutside=[],restored=[],moved=[],problems=[];
function walk(folder=''){
 for(const d of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){
  if(['.git','node_modules','.agents','.codex','.aws'].includes(d.name))continue;
  const f=folder?folder+'/'+d.name:d.name;if(f===dir)continue;
  if(d.isDirectory()){walk(f);continue;}if(!d.isFile())continue;
  const bytes=fs.readFileSync(path.join(root,f)),old=initial.files[f];
  if(old){if(hash(bytes)!==old.sha256){existingChanged.push(f);if(!allowed.has(f)){
   if(!generatedPaths.has(f)){problems.push({file:f,error:'outside known test outputs; retained untouched'});continue;}
   try{const before=baseBytes(f);if(hash(before)!==old.sha256)throw Error('starting bytes differ from base');const save=path.join(root,dir,'generated',f);fs.mkdirSync(path.dirname(save),{recursive:true});fs.writeFileSync(save,bytes);fs.writeFileSync(path.join(root,f),before);restored.push(f)}catch(e){problems.push({file:f,error:e.message})}
  }}}
  else if(!f.startsWith('scripts/hani-design-polish-1')&&f!=='scripts/fixtures/design-polish-1-delta.json'){
   newOutside.push(f);
   if(generatedPaths.has(f)){
    const source=path.resolve(root,f),target=path.resolve(root,dir,'generated',f);
    if(!source.startsWith(root+path.sep)||!target.startsWith(path.join(root,dir)+path.sep))throw Error('workspace boundary');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(source,target);moved.push(f);
   }else problems.push({file:f,error:'unrecognized new path retained'});
  }
 }
}
walk();
const fixtures=Object.keys(initial.files).filter(f=>f.startsWith('scripts/fixtures/'));
const fixtureDrift=fixtures.filter(f=>hash(fs.readFileSync(path.join(root,f)))!==initial.files[f].sha256);
const result={base:initial.base,existingChanged,restored,moved,problems,existingFixtureCount:fixtures.length,fixtureDrift,runtimeChanged:existingChanged.filter(f=>/^(?:index[.]html|hani-.*[.](?:js|css))$/.test(f)),allowedExisting:existingChanged.filter(f=>allowed.has(f))};
fs.writeFileSync(path.join(__dirname,'preservation-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));if(problems.length||fixtureDrift.length)process.exitCode=1;
