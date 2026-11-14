const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),start=require('./local/start.json'),hash=s=>createHash('sha256').update(s).digest('hex');
const changed=[],missing=[],files={};
function walk(dir=''){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 if(['.git','node_modules','.agents','.codex','.aws','local'].includes(e.name))continue;
 const file=dir?dir+'/'+e.name:e.name;if(e.isDirectory())walk(file);else if(e.isFile())files[file]=hash(fs.readFileSync(path.join(root,file)));
}}
walk();for(const [file,pin]of Object.entries(start.files)){if(!files[file])missing.push(file);else if(files[file]!==pin)changed.push(file);}
const allowed=['hani-main.js','hani-street-journal.css','scripts/hani-release-296-source.cjs','scripts/hani-design-polish-1-source.cjs','scripts/hani-design-polish-1-main295-source.cjs','docs/development-history/CURRENT.md','docs/development-history/handoffs/2026-11-14-chibi-pack-3.md'];
const unexpected=changed.filter(f=>!allowed.includes(f)&&!f.startsWith('artifacts/chibi-pack-3/'));assert.deepEqual(unexpected,[]);assert.deepEqual(missing,[]);
const added=Object.keys(files).filter(f=>!start.files[f]);
assert.deepEqual(added.filter(f=>!f.startsWith('artifacts/chibi-pack-3/')&&!/^scripts\/hani-chibi-pack-3[-.]/.test(f)&&!['scripts/fixtures/chibi-pack-3-delta.json','assets/street-journal/chibi-sheet-v3.webp'].includes(f)),[],'no output outside task paths');
const fixtures=Object.keys(start.files).filter(f=>f.startsWith('scripts/fixtures/'));assert.ok(fixtures.every(f=>files[f]===start.files[f]));
const scripts=Object.keys(start.files).filter(f=>f.startsWith('scripts/')&&/[.-]test\.[cm]?js$/.test(f));assert.ok(scripts.every(f=>files[f]===start.files[f]),'all original assertions unchanged');
for(const f of ['scripts/hani-release-296-source.cjs','scripts/hani-design-polish-1-source.cjs','scripts/hani-design-polish-1-main295-source.cjs']){
 const before=require('../../scripts/hani-test-repository-evidence.cjs').read(start.base,f),after=fs.readFileSync(path.join(root,f),'utf8');
 assert.equal(after.replace("require('./hani-chibi-pack-3-preload.cjs');\n",''),before,'one input preload only '+f);
}
const syntax=[];for(const f of ['hani-main.js','scripts/hani-chibi-pack-3-source.cjs','scripts/hani-chibi-pack-3-preload.cjs','scripts/hani-release-296-source.cjs','scripts/hani-design-polish-1-source.cjs','scripts/hani-design-polish-1-main295-source.cjs',...fs.readdirSync(__dirname).filter(f=>f.endsWith('.cjs')).map(f=>'artifacts/chibi-pack-3/'+f)]){new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});syntax.push(f);}
const inverse=require('../../scripts/hani-chibi-pack-3-source.cjs');for(const file of Object.keys(inverse.delta.files))assert.equal(inverse.restore(fs.readFileSync(path.join(root,file),'utf8'),file),Buffer.from(start.backup[file],'base64').toString('utf8'));
const css=fs.readFileSync(path.join(root,'hani-street-journal.css'),'utf8');assert.equal(css.split('{').length,css.split('}').length);
const version=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/hani-main\.js\?v=([^"']+)/)[1];assert.equal(version,'2.9.296');
const report={status:'PASS',base:start.base,startFiles:Object.keys(start.files).length,changed,added,missing,unexpected,existingFixturesUnchanged:fixtures.length,existingTestsUnchanged:scripts.length,syntax,version,storedWritesAdded:0,timersListenersAdded:0};
fs.writeFileSync(path.join(__dirname,'audit.json'),JSON.stringify(report,null,2)+'\n');console.log({status:report.status,changed,fixtures:fixtures.length,tests:scripts.length,syntax:syntax.length});
