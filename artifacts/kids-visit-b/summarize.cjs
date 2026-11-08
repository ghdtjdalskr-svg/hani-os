const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const dir=__dirname,root=path.resolve(dir,'../..'),parse=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')),hash=x=>createHash('sha256').update(x).digest('hex');
const list=name=>{const file=path.join(dir,name+'-tests/summary.json');if(!fs.existsSync(file))return [];const rows=parse(file);return Array.isArray(rows)?rows:[rows]};
const rows=new Map();for(const label of ['final','final-frozen','final-residents'])for(const row of list(label))rows.set(row.file,{...row,log:label+'-tests/'+row.file+'.tap'});
const expected=fs.readdirSync(path.join(root,'scripts')).filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)).sort(),base=new Map();for(const label of ['baseline','baseline-more','baseline-failures'])for(const row of list(label))base.set(row.file,row);
let pass=0,fail=0,skipped=0;const failures=[];
for(const row of rows.values()){
 pass+=row.pass;fail+=row.fail;skipped+=row.skipped;
 if(row.fail){const bytes=fs.readFileSync(path.join(dir,row.log)),log=bytes[0]===255&&bytes[1]===254?bytes.toString('utf16le'):bytes.toString('utf8'),blocks=log.split(/(?=^not ok \d+ - )/m).slice(1);for(const block of blocks){const name=block.split(/\r?\n/)[0].replace(/^not ok \d+ - /,''),b=base.get(row.file);failures.push({file:row.file,name,kind:/spawnSync git|spawn git|spawn.*EPERM/.test(block)?'Git subprocess blocked':b?.failures.includes(name)?'reproduced at base':'needs base replay',baseReproduced:!!b?.failures.includes(name),log:row.log})}}
}
if(failures.length!==fail)throw Error('Every failure must have a decoded log block: '+failures.length+' / '+fail);
const summary={baseCommit:'70c5d5d8e1ddc1262314f412934b3a450974599c',runtimeSha256:hash(fs.readFileSync(path.join(root,'hani-office-live.js'))),cssSha256:hash(fs.readFileSync(path.join(root,'hani-office-live.css'))),atlasSha256:hash(fs.readFileSync(path.join(root,'assets/office-companions/kids-v2.webp'))),contractSha256:hash(fs.readFileSync(path.join(root,'scripts/fixtures/office-kids-pose-b-delta.json'))),files:rows.size,expectedFiles:expected.length,missing:expected.filter(f=>!rows.has(f)),pass,fail,skipped,failures,rows:[...rows.values()].sort((a,b)=>a.file.localeCompare(b.file))};
fs.writeFileSync(path.join(dir,'test-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({files:summary.files,expected:summary.expectedFiles,pass,fail,skipped,missing:summary.missing,failures:failures.filter(p=>p.kind==='needs base replay').map(({file,name})=>({file,name}))}));
