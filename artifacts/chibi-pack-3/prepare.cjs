const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(__dirname,'local');fs.mkdirSync(out,{recursive:true});
const target=path.join(out,'start.json');if(fs.existsSync(target))throw Error('Snapshot already exists');
const files={},backup={};
function walk(dir=''){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 if(['.git','node_modules','.agents','.codex','.aws','local'].includes(e.name))continue;
 const f=dir?dir+'/'+e.name:e.name;
 if(e.isDirectory())walk(f);else if(e.isFile()){const b=fs.readFileSync(path.join(root,f));files[f]=crypto.createHash('sha256').update(b).digest('hex');
 if(['hani-main.js','hani-street-journal.css'].includes(f)||!f.includes('/')&&f.endsWith('.json'))backup[f]=b.toString('base64');}
}}
walk();fs.writeFileSync(target,JSON.stringify({base:'7a91982de08a54452f6b9057f906d651f63a65ca',branch:'hani/chibi-pack-3',files,backup},null,2)+'\n');
console.log({files:Object.keys(files).length,fixtures:Object.keys(files).filter(f=>f.startsWith('scripts/fixtures/')).length});
