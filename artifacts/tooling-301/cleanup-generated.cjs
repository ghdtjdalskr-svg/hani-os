// Preserve this run's newly generated evidence in one local folder.
// No tracked/start-of-task file is moved; all absolute targets are checked first.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'local'),start=JSON.parse(fs.readFileSync(path.join(local,'start-hashes.json')));
const dirs=['dash-217','desk-mascots','history-226','ilbo-banner-215','launch-221','lounge-qa-212','newface-217','ocr-accuracy-224','office-219','polish-215','pwa-213','remote-219','remote-card-224','street-journal-v1'];
const within=(base,target)=>{const rel=path.relative(base,target);assert.ok(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel),'absolute target stays within '+base);};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),plan=[],emptyDirs=[];
function walk(source){
 within(root,source);assert.ok(!fs.lstatSync(source).isSymbolicLink(),'no symlink traversal');
 for(const name of fs.readdirSync(source)){
  const target=path.join(source,name);within(root,target);const stat=fs.lstatSync(target);assert.ok(!stat.isSymbolicLink(),'no symlink');
  if(stat.isDirectory())walk(target);else{
   assert.ok(stat.isFile());const file=path.relative(root,target).replaceAll('\\','/');
   assert.ok(!Object.hasOwn(start,file),'preserve every start-of-task file '+file);
   const destination=path.resolve(local,'generated',file);within(path.join(local,'generated'),destination);assert.ok(!fs.existsSync(destination),'never overwrite evidence');
   plan.push({file,source:target,destination,sha256:hash(fs.readFileSync(target))});
  }
 }emptyDirs.push(source);
}
for(const dir of dirs){const source=path.resolve(root,'artifacts',dir);if(fs.existsSync(source))walk(source);}
// Full source/destination inventory has been verified before the first move.
for(const row of plan){fs.mkdirSync(path.dirname(row.destination),{recursive:true});fs.renameSync(row.source,row.destination);assert.equal(hash(fs.readFileSync(row.destination)),row.sha256);}
for(const dir of emptyDirs){within(root,dir);if(fs.readdirSync(dir).length===0)fs.rmdirSync(dir);}
fs.writeFileSync(path.join(local,'generated-relocation.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({preservedFiles:plan.length,directories:dirs.length,destination:path.join(local,'generated'),hashesVerified:true}));
