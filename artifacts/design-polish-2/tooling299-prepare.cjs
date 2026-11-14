// Local preservation snapshot and exact outer contract. No Git/browser process.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(__dirname,'tooling299-local');
const hash=b=>createHash('sha256').update(b).digest('hex');
fs.mkdirSync(out,{recursive:true});
function inventory(){
 const rows={};
 function walk(dir){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  const f=dir?dir+'/'+e.name:e.name;
  if(e.isDirectory()){if(!['.git','node_modules','.agents','.codex','.aws'].includes(e.name)&&!f.includes('/tooling299-local')&&!/(?:^|\/)(?:local|tooling\d+-local)(?:\/|$)/.test(f))walk(f);}
  else if(e.isFile())rows[f]=hash(fs.readFileSync(path.join(root,f)));
 }}walk('');return rows;
}
if(process.argv.includes('--snapshot')){
 const rows=inventory();fs.writeFileSync(path.join(out,'start-hashes.json'),JSON.stringify(rows,null,2)+'\n');
 const texts={};for(const f of Object.keys(rows))if(f.startsWith('scripts/')||f==='artifacts/design-polish-2/run-regression.ps1')texts[f]=fs.readFileSync(path.join(root,f),'utf8');
 fs.writeFileSync(path.join(out,'start-texts.json'),JSON.stringify(texts));
 console.log('preserved files: '+Object.keys(rows).length);
}else if(process.argv.includes('--layer')){
 const repository=require('../../scripts/hani-test-repository-evidence.cjs');
 const release=repository.commit('1881888'),previous='98cc7debbf9bf365b5db97aabac9b616b2889d20';
 const files={};
 for(const f of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json']){
  const after=fs.readFileSync(path.join(root,f),'utf8'),before=repository.read(previous,f);
  assert.equal(after,repository.read(release.sha,f),'deployed299 object '+f);
  const row={after:hash(after),before:hash(before)};
  if(f.endsWith('.json')){
   let start=0,end=0;while(before[start]===after[start])start++;
   while(before[before.length-1-end]===after[after.length-1-end])end++;
   row.count=1;row.replacements=[{before:before.slice(start,before.length-end),after:after.slice(start,after.length-end)}];
  }else{row.count=after.split('2.9.299').length-1;assert.equal(after.replaceAll('2.9.299','2.9.298'),before);}
  files[f]=row;
 }
 const layer={from:'2.9.298',to:'2.9.299',files,feature:{module:'./hani-design-polish-2-source.cjs',fixture:'./fixtures/design-polish-2-delta.json',restore:'restore'}};
 const file=path.join(root,'scripts/fixtures/release-version-layers.json'),old=fs.readFileSync(file,'utf8');
 assert.equal(JSON.parse(old).layers[0].to,'2.9.298');
 const at=old.indexOf('    {'),eol=old.includes('\r\n')?'\r\n':'\n';
 const row=JSON.stringify(layer,null,2).split('\n').map(l=>'    '+l).join(eol);
 fs.writeFileSync(file,old.slice(0,at)+row+','+eol+old.slice(at));
 console.log(JSON.stringify({release:release.sha,files}));
}else if(process.argv.includes('--contract')){
 const texts=JSON.parse(fs.readFileSync(path.join(out,'start-texts.json'),'utf8')),files={};
 for(const [f,before]of Object.entries(texts)){
  const after=fs.readFileSync(path.join(root,f),'utf8');if(before===after)continue;
  let start=0,end=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  while(end<before.length-start&&end<after.length-start&&before[before.length-1-end]===after[after.length-1-end])end++;
  files[f]={beforeSha256:hash(before),afterSha256:hash(after),start,edit:{before:before.slice(start,before.length-end),after:after.slice(start,after.length-end)}};
 }
 const bytes=JSON.stringify({schema:1,base:'1881888',files},null,2)+'\n';
 fs.writeFileSync(path.join(root,'scripts/fixtures/design-polish-2-main299-input.json'),bytes);
 console.log(JSON.stringify({files:Object.keys(files),hash:hash(bytes)}));
}else if(process.argv.includes('--audit')){
 const before=JSON.parse(fs.readFileSync(path.join(out,'start-hashes.json'),'utf8')),after=inventory();
 const changed=Object.keys(before).filter(f=>before[f]!==after[f]),added=Object.keys(after).filter(f=>!before[f]);
 assert.ok(changed.every(f=>/^(scripts|artifacts|docs)\//.test(f)),'only authorized directories');
 assert.ok(added.every(f=>/^(scripts|artifacts|docs)\//.test(f)),'new files only in authorized directories');
 assert.ok(changed.every(f=>fs.existsSync(path.join(root,f))),'no file removed');
 assert.equal(before['.gitignore'],after['.gitignore']);
 const old=JSON.parse(fs.readFileSync(path.join(out,'start-texts.json'),'utf8'));
 const manifest='scripts/fixtures/release-version-layers.json';
 const oldManifest=old[manifest],now=fs.readFileSync(path.join(root,manifest),'utf8');
 assert.ok(now.endsWith(oldManifest.slice(oldManifest.indexOf('    {'))),'previous manifest bytes retained');
 assert.deepEqual(JSON.parse(now).layers.slice(1),JSON.parse(oldManifest).layers);
 const fixtures=Object.keys(before).filter(f=>f.startsWith('scripts/fixtures/')&&f!==manifest);for(const f of fixtures)assert.equal(after[f],before[f],f);
 const tests=Object.keys(before).filter(f=>f.startsWith('scripts/')&&/(?:\.test|[-/]test)\.(mjs|cjs|js)$/.test(f));
 for(const f of tests){const text=fs.readFileSync(path.join(root,f),'utf8');
  assert.equal(text.replace("from './hani-release-298-input.cjs'","from './hani-release-version-layers.cjs'").replace("from './hani-design-polish-2-main299-input.cjs'","from './hani-design-polish-2-source.cjs'"),old[f],f+' assertions preserved');
 }
 const runtime=Object.keys(before).filter(f=>/^(assets|data|data-hub)\//.test(f)||/^[^/]+\.(js|css|html)$/.test(f));for(const f of runtime)assert.equal(after[f],before[f],f);
 const result={changed,added,originalFiles:Object.keys(before).length,unchangedRuntimeFiles:runtime.length,unchangedFixtures:fixtures.length,preservedTests:tests.length,removed:[],runtimeChanges:[],gitignoreUnchanged:true,oldManifestBytesPreserved:true};
 fs.writeFileSync(path.join(out,'preservation-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}
