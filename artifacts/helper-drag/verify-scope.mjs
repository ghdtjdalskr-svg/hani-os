// Read-only comparison with the actual loose Git base objects; no Git metadata writes.
import fs from 'node:fs';
import path from 'node:path';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolveRuntimeClosure} from '../../scripts/hani-runtime-closure.mjs';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../../',import.meta.url));
const workGit=fs.readFileSync(path.join(root,'.git'),'utf8').trim().slice(8);
const common=path.resolve(workGit,fs.readFileSync(path.join(workGit,'commondir'),'utf8').trim());
const base='430d254eff90e04a21b6205fed69a2df44a67ac9';
const packs=new Map(),decoded=new Map();
function packed(sha){
  const directory=path.join(common,'objects/pack');
  for(const file of fs.readdirSync(directory).filter(f=>f.endsWith('.idx'))){
    const idx=fs.readFileSync(path.join(directory,file));assert.equal(idx.readUInt32BE(4),2);
    const count=idx.readUInt32BE(8+255*4),names=8+256*4;
    let lo=0,hi=count-1,found=-1;
    while(lo<=hi){const mid=(lo+hi)>>1,id=idx.subarray(names+mid*20,names+(mid+1)*20).toString('hex');if(id===sha){found=mid;break;}if(id<sha)lo=mid+1;else hi=mid-1;}
    if(found<0)continue;
    const rawOffset=idx.readUInt32BE(names+count*24+found*4);
    const offset=rawOffset<0x80000000?rawOffset:Number(idx.readBigUInt64BE(names+count*28+(rawOffset&0x7fffffff)*8));
    const packfile=path.join(directory,file.replace(/\.idx$/,'.pack'));
    if(!packs.has(packfile))packs.set(packfile,fs.readFileSync(packfile));
    return unpack(packfile,offset);
  }
  throw Error('Missing base object '+sha);
}
function applyDelta(base,delta){
  let i=0;const variable=()=>{let value=0,shift=0,b;do{b=delta[i++];value+=(b&127)*2**shift;shift+=7;}while(b&128);return value;};
  assert.equal(variable(),base.length);const size=variable(),chunks=[];
  while(i<delta.length){const code=delta[i++];if(code&128){let offset=0,length=0;for(let j=0;j<4;j++)if(code&(1<<j))offset+=delta[i++]*2**(8*j);for(let j=0;j<3;j++)if(code&(16<<j))length+=delta[i++]*2**(8*j);chunks.push(base.subarray(offset,offset+(length||65536)));}else{assert.ok(code);chunks.push(delta.subarray(i,i+code));i+=code;}}
  const result=Buffer.concat(chunks);assert.equal(result.length,size);return result;
}
function unpack(file,offset){
  const key=file+':'+offset;if(decoded.has(key))return decoded.get(key);
  const b=packs.get(file);let i=offset,head=b[i++],type=(head>>4)&7;while(head&128)head=b[i++];
  let base;
  if(type===6){let byte=b[i++],distance=byte&127;while(byte&128){byte=b[i++];distance=((distance+1)*128)+(byte&127);}base=unpack(file,offset-distance);}
  else if(type===7){base=object(b.subarray(i,i+20).toString('hex'));i+=20;}
  let result=inflateSync(b.subarray(i));if(base)result=applyDelta(base,result);decoded.set(key,result);return result;
}
function object(sha){const file=path.join(common,'objects',sha.slice(0,2),sha.slice(2));if(!fs.existsSync(file))return packed(sha);const b=inflateSync(fs.readFileSync(file));return b.subarray(b.indexOf(0)+1);}
const tree=object(base).toString().match(/^tree ([a-f0-9]{40})/)[1];
function blob(file){
  let sha=tree;
  for(const name of file.split('/')){
    const b=object(sha);let i=0,found=false;
    while(i<b.length){const space=b.indexOf(32,i),zero=b.indexOf(0,space);const entry=b.subarray(space+1,zero).toString();const id=b.subarray(zero+1,zero+21).toString('hex');i=zero+21;if(entry===name){sha=id;found=true;break;}}
    assert.ok(found,file);
  }
  return object(sha);
}
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=f=>fs.readFileSync(path.join(root,f));
const unchanged={};
for(const f of ['index.html','hani-main.js','hani-office-live.js','hani-office-live.css','hani-style-01.css','hani-organization-hub.js']){
  assert.deepEqual(read(f),blob(f),f+' byte preservation');unchanged[f]=hash(read(f));
}
const ui=read('hani-ui-v02992.js').toString(),original=blob('hani-ui-v02992.js').toString();
for(const section of ['prefix','suffix']){
  const extract=s=>section==='prefix'?s.slice(0,s.indexOf('// BEGIN HANI HELPER BOT')):s.slice(s.indexOf('// END HANI HELPER BOT'));
  assert.equal(extract(ui),extract(original),'only helper owner changes: '+section);
}
const css=read('hani-style-08.css').toString(),oldCss=blob('hani-style-08.css').toString();
assert.equal(css.slice(0,css.indexOf('/* Daily helper:')),oldCss.slice(0,oldCss.indexOf('/* Daily helper:')),'other CSS preserved');
const closure=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>read(f)});
const baseline=await resolveRuntimeClosure({exists:f=>fs.existsSync(path.join(root,f)),read:f=>['index.html','hani-style-08.css','hani-ui-v02992.js'].includes(f)?blob(f):read(f)});
assert.deepEqual(closure.missing,[]);assert.deepEqual(closure.files,baseline.files);assert.equal(closure.files.length,158);
assert.deepEqual(closure.files,JSON.parse(read('artifacts/helper-drag/baseline-runtime-files.json')));
const approved="localStorage.getItem(POSITION_KEY)",write="localStorage.setItem(POSITION_KEY, JSON.stringify(value))";
const helper=ui.slice(ui.indexOf('// BEGIN HANI HELPER BOT'));
assert.equal(helper.split(approved).length,2);assert.equal(helper.split(write).length,2);
assert.doesNotMatch(helper.replace(approved,'').replace(write,''),/localStorage|sessionStorage|supabase|\.removeItem\(|\.clear\(/);
const result={base,unchanged,helperOnly:true,otherCssUnchanged:true,approvedPositionKeyOnly:true,closure:{before:baseline.files.length,after:closure.files.length,missing:closure.missing},versionAndCacheUnchanged:true};
fs.writeFileSync(path.join(root,'artifacts/helper-drag/scope-results.json'),JSON.stringify(result,null,2));
console.log('PASS: base object comparison, helper-only JS/CSS, protected owners/index/version/cache preserved, approved key only, runtime closure 158 unchanged');
