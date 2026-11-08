import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const gitdir=fs.readFileSync('.git','utf8').trim().replace('gitdir: ',''),common=path.resolve(gitdir,fs.readFileSync(path.join(gitdir,'commondir'),'utf8').trim());
const ref=fs.readFileSync(path.join(common,'refs/remotes/origin/main'),'utf8').trim();
assert.equal(ref,'a28918df50ba5fef3e7dab498eaa5eec4a27a103');
const object=id=>{const b=zlib.inflateSync(fs.readFileSync(path.join(common,'objects',id.slice(0,2),id.slice(2))));assert.equal(createHash('sha1').update(b).digest('hex'),id);return b.subarray(b.indexOf(0)+1);};
const tree=object(ref).toString().match(/^tree ([a-f0-9]{40})/)[1];
const oid=(type,b)=>createHash('sha1').update(Buffer.from(type+' '+b.length+'\0')).update(b).digest('hex');
const sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
function directory(dir){
 const entries=fs.readdirSync(dir,{withFileTypes:true}).map(e=>({name:e.name,directory:e.isDirectory()})).sort((a,b)=>Buffer.compare(Buffer.from(a.name+(a.directory?'/':'')),Buffer.from(b.name+(b.directory?'/':''))));
 return oid('tree',Buffer.concat(entries.map(e=>{const f=dir+'/'+e.name;let hash;if(e.directory)hash=directory(f);else{const b=fs.readFileSync(f);hash=oid('blob',b);rows.push({file:f,sha256:sha(b),oid:hash});}return Buffer.concat([Buffer.from((e.directory?'40000':'100644')+' '+e.name+'\0'),Buffer.from(hash,'hex')]);})));
}
const checks=[],b=object(tree);let i=0;
while(i<b.length){const sp=b.indexOf(32,i),nul=b.indexOf(0,sp),name=b.subarray(sp+1,nul).toString(),expected=b.subarray(nul+1,nul+21).toString('hex');i=nul+21;
 if(name==='assets'||name==='data'){const actual=directory(name);checks.push({file:name,type:'tree',expected,actual,same:actual===expected});}
 else if(name==='index.html'||/^hani-.*\.(js|css)$/.test(name)){const raw=fs.readFileSync(name),actual=oid('blob',raw);rows.push({file:name,sha256:sha(raw),oid:actual});checks.push({file:name,type:'blob',expected,actual,same:actual===expected});}
}
const initial=JSON.parse(fs.readFileSync('artifacts/tooling-283/initial-files.json'));
const changed=rows.filter(r=>initial.find(x=>x.file===r.file)?.sha256!==r.sha256);
const extraRoot=fs.readdirSync('.').filter(f=>(f==='index.html'||/^hani-.*\.(js|css)$/.test(f))&&!checks.some(c=>c.file===f));
const result={ref,tree,method:'Direct verified local origin/main commit/tree objects; hash actual blob bytes and complete assets/data trees without Git execution',count:rows.length,checks,changed,extraRoot,pass:checks.every(c=>c.same)&&changed.length===0&&extraRoot.length===0};
fs.writeFileSync('artifacts/tooling-283/runtime-origin-main.json',JSON.stringify(result,null,2));
fs.writeFileSync('artifacts/tooling-283/runtime-files.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify({files:rows.length,checks:checks.length,mismatch:checks.filter(c=>!c.same),changed,pass:result.pass}));
if(!result.pass)process.exitCode=1;
