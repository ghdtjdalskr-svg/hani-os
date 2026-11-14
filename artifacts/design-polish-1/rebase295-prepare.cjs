// Read-only repository evidence; no Git executable or index operations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..');
const hash=b=>createHash('sha256').update(b).digest('hex'),base=repo.resolve('dfe8194');
assert.equal(fs.existsSync(path.join(__dirname,'rebase295-start.json')),false,'retain original starting inventory');
const snapshot={base,head:repo.reference('HEAD'),main:repo.reference('origin/main'),files:{}};
function walk(dir='') {for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 if(['.git','node_modules','.agents','.codex','.aws'].includes(e.name))continue;
 const f=dir?dir+'/'+e.name:e.name;if(e.isDirectory())walk(f);else if(e.isFile())snapshot.files[f]=hash(fs.readFileSync(path.join(root,f)));
}}
walk();fs.writeFileSync(path.join(__dirname,'rebase295-start.json'),JSON.stringify(snapshot,null,2)+'\n');
const old=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/design-polish-1-delta.json'),'utf8'));
const delta={schema:1,base,files:{}};
for(const [file,row]of Object.entries(old.files)){
 const before=repo.read(base,file),after=fs.readFileSync(path.join(root,file),'utf8');
 const expected=row.edits.reduce((s,e)=>{if(e.before)assert.equal(s.split(e.before).length-1,1);return e.before?s.replace(e.before,()=>e.after):s+e.after},before);
 assert.equal(after,expected,'only approved design edits on main295: '+file);
 delta.files[file]={beforeSha256:hash(before),afterSha256:hash(after),edits:row.edits};
}
const bytes=JSON.stringify(delta,null,2)+'\n';
fs.writeFileSync(path.join(root,'scripts/fixtures/design-polish-1-main295-delta.json'),bytes);
console.log(JSON.stringify({base,head:snapshot.head,main:snapshot.main,fixtureHash:hash(bytes),files:Object.keys(snapshot.files).length}));
