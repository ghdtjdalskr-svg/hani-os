// Capture task-start bytes before edits/tests. No Git process or runtime writes.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'tooling296-local');
fs.mkdirSync(local,{recursive:true});
const files={},backup={};
function walk(dir=''){
 for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
  if(['.git','node_modules','.agents','.codex','.aws','tooling296-local'].includes(e.name))continue;
  const file=dir?dir+'/'+e.name:e.name;
  if(e.isDirectory())walk(file);else if(e.isFile()){
   const bytes=fs.readFileSync(path.join(root,file));files[file]=createHash('sha256').update(bytes).digest('hex');
   if(!file.includes('/')&&file.endsWith('.json'))backup[file]=bytes.toString('base64');
  }
 }
}
const target=path.join(local,'start.json');if(fs.existsSync(target))throw Error('Task-start snapshot already exists');
walk();fs.writeFileSync(target,JSON.stringify({base:'56c3105',branch:'hani/tooling-296',files,backup},null,2)+'\n');
console.log(JSON.stringify({files:Object.keys(files).length,fixtures:Object.keys(files).filter(f=>f.startsWith('scripts/fixtures/')).length}));
