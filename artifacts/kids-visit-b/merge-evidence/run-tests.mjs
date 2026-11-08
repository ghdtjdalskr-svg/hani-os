import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),out='artifacts/kids-visit-b/merge-evidence';
const hash=x=>createHash('sha256').update(x).digest('hex');
const only=process.argv.slice(2),full=only.length===0;
const tests=full?fs.readdirSync('scripts').filter(f=>/^hani-office-.*\.test\.mjs$/.test(f)).sort():only;
const before=new Map();
function scan(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
 const file=folder+'/'+e.name;if(file.startsWith(out)||file.includes('/node_modules/')||file.includes('/.git/'))continue;
 if(e.isDirectory())scan(file);else if(e.isFile()&&file.endsWith('.json'))before.set(file,fs.readFileSync(file));
}}
scan('artifacts');
const summaries=[],changed=[];
const env={...process.env,NODE_OPTIONS:'--require ./artifacts/life-bundle/no-git-283.cjs',NODE_PATH:path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')};
try{
 for(const file of tests){
  const args=[];
  if(file==='hani-seoyun-m9.test.mjs')args.push('--require','./scripts/hani-m9-polish-preload.cjs','--require','./scripts/hani-m9-link-preload.cjs');
  if(file==='hani-m9-link.test.mjs')args.push('--require','./scripts/hani-m9-polish-preload.cjs');
  args.push('--import','./scripts/hani-life-bundle-preload.mjs','--test','--test-isolation=none','--test-reporter=tap','scripts/'+file);
  const start=Date.now(),r=spawnSync(process.execPath,args,{cwd:root,env,encoding:'utf8',maxBuffer:32*1024*1024,timeout:240000});
  const output=(r.stdout||'')+(r.stderr||''),row={file,exit:r.status,error:r.error?.message,seconds:Math.round((Date.now()-start)/1000),pass:0,fail:0,skipped:0,failures:[],command:'node '+args.join(' ')};
  for(const name of ['pass','fail','skipped'])row[name]=+(output.match(new RegExp('^# '+name+' (\\d+)$','m'))?.[1]||0);
  row.failures=[...output.matchAll(/^not ok \d+ - (.*)$/gm)].map(m=>m[1]);
  row.gitBlocked=/USER_GIT_DISABLED/.test(output);
  if(r.status!==0){fs.writeFileSync(out+'/'+file+'.failure.tap',output);row.details=output.split('\n').filter(l=>/AssertionError|USER_GIT_DISABLED|Error:|actual:|expected:|^not ok|^  error:/.test(l)).map(l=>l.slice(0,400)).slice(0,60);}
  summaries.push(row);fs.writeFileSync(out+(full?'/office-summary.json':'/targeted-summary.json'),JSON.stringify(summaries,null,2)+'\n');
  console.log(file+': '+row.pass+' PASS / '+row.fail+' FAIL / '+row.skipped+' SKIP'+(row.gitBlocked?' (Git blocked)':''));
 }
}finally{
 for(const [file,bytes]of before){if(!fs.existsSync(file)||!fs.readFileSync(file).equals(bytes)){
  const after=fs.existsSync(file)?fs.readFileSync(file):null;changed.push({file,before:hash(bytes),after:after&&hash(after)});fs.writeFileSync(file,bytes);
 }}
 fs.writeFileSync(out+(full?'/office-artifact-restoration.json':'/targeted-artifact-restoration.json'),JSON.stringify(changed,null,2)+'\n');
}
