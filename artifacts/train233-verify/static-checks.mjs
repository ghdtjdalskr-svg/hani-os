import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
import {literalIds,assertNoNewDuplicateIds} from '../../scripts/hani-duplicate-id-guard.mjs';
const root=process.cwd(),base=path.resolve(root,'../m233');
const read=dir=>file=>fs.readFileSync(path.join(dir,file),'utf8');
const a=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>fs.readFileSync(path.join(root,f))});
const b=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(base,f)),read:f=>fs.readFileSync(path.join(base,f))});
const current=literalIds(read(root)),previous=literalIds(read(base));
let guard,error;try{guard=assertNoNewDuplicateIds(read(root),read(base));}catch(e){error=e.message;}
const broad=dir=>{const counts=new Map();for(const f of ['index.html',...fs.readdirSync(dir).filter(f=>/^hani-.*\.js$/.test(f))])for(const m of read(dir)(f).matchAll(/(?<![\w-])id\s*=\s*\\?["']([\w:.-]+)\\?["']/g))counts.set(m[1],(counts.get(m[1])||0)+1);return counts;};
const bc=broad(root),bb=broad(base);
const result={candidate:'bbc1ff97b498876de752a5705f714cd00f2d7e64',base:'2cbbe6ed0c14954008208f0db2316b5f09228c2a',closure:{candidate:a.files.length,main:b.files.length,missing:a.missing,added:a.files.filter(f=>!b.files.includes(f)),removed:b.files.filter(f=>!a.files.includes(f)),dataFiles:a.files.filter(f=>f.startsWith('data/')),hashes:a.files.map(file=>({file,sha256:crypto.createHash('sha256').update(a.contents.get(file)).digest('hex')}))},ids:{guard,error,newDuplicates:[...current.counts].filter(([id,n])=>n>1&&n>(previous.counts.get(id)||0)).map(([id,n])=>({id,candidate:n,main:previous.counts.get(id)||0})),existing:[...current.counts].filter(([,n])=>n>1),broadNewDuplicates:[...bc].filter(([id,n])=>n>1&&n>(bb.get(id)||0)).map(([id,n])=>({id,candidate:n,main:bb.get(id)||0}))}};
fs.writeFileSync('artifacts/train233-verify/static-results.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,closure:{...result.closure,hashes:undefined}},null,2));
