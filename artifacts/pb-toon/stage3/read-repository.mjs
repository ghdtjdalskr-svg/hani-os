// Read-only object inspection; never executes Git or writes repository metadata.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const gitdir=fs.readFileSync('.git','utf8').trim().replace(/^gitdir: /,'');
const common=path.resolve(gitdir,fs.readFileSync(path.join(gitdir,'commondir'),'utf8').trim());
export const headRef=fs.readFileSync(path.join(gitdir,'HEAD'),'utf8').trim().replace(/^ref: /,'');
export const head=fs.readFileSync(path.join(common,headRef),'utf8').trim();
export const main=fs.readFileSync(path.join(common,'refs/remotes/origin/main'),'utf8').trim();
const objects=path.join(common,'objects'),cache=new Map();
const indexes=fs.readdirSync(path.join(objects,'pack')).filter(f=>f.endsWith('.idx')).map(file=>{
  const bytes=fs.readFileSync(path.join(objects,'pack',file));
  assert.equal(bytes.readUInt32BE(0),0xff744f63);assert.equal(bytes.readUInt32BE(4),2);
  return {bytes,count:bytes.readUInt32BE(8+255*4),file:path.join(objects,'pack',file.replace(/idx$/,'pack'))};
});
function delta(base,bytes){
  let at=0;
  const size=()=>{let n=0,shift=0,b;do{b=bytes[at++];n+=(b&127)*2**shift;shift+=7}while(b&128);return n};
  assert.equal(size(),base.length);const expected=size(),chunks=[];
  while(at<bytes.length){
    const op=bytes[at++];assert.notEqual(op,0);
    if(op&128){let offset=0,length=0;
      for(let k=0;k<4;k++)if(op&(1<<k))offset+=bytes[at++]*2**(8*k);
      for(let k=0;k<3;k++)if(op&(1<<(k+4)))length+=bytes[at++]*2**(8*k);
      length||=65536;assert.ok(offset+length<=base.length);chunks.push(base.subarray(offset,offset+length));
    }else{chunks.push(bytes.subarray(at,at+op));at+=op}
  }
  const result=Buffer.concat(chunks);assert.equal(result.length,expected);return result;
}
function packed(file,offset){
  const key=file+':'+offset;if(cache.has(key))return cache.get(key);
  const fd=fs.openSync(file,'r');let buf;
  try{const length=Math.min(fs.fstatSync(fd).size-offset,64*1024*1024);buf=Buffer.alloc(length);fs.readSync(fd,buf,0,length,offset)}finally{fs.closeSync(fd)}
  let at=0,b=buf[at++],type=(b>>4)&7,size=b&15,shift=4;
  while(b&128){b=buf[at++];size+=(b&127)*2**shift;shift+=7}
  let base;
  if(type===6){b=buf[at++];let distance=b&127;while(b&128){b=buf[at++];distance=(distance+1)*128+(b&127)}base=packed(file,offset-distance)}
  if(type===7){base=object(buf.subarray(at,at+20).toString('hex'));at+=20}
  const inflated=inflateSync(buf.subarray(at));assert.equal(inflated.length,size);
  const result=base?{type:base.type,body:delta(base.body,inflated)}:{type:({1:'commit',2:'tree',3:'blob',4:'tag'})[type],body:inflated};
  assert.ok(result.type);cache.set(key,result);return result;
}
export function object(id){
  if(cache.has(id))return cache.get(id);const loose=path.join(objects,id.slice(0,2),id.slice(2));let result;
  if(fs.existsSync(loose)){const all=inflateSync(fs.readFileSync(loose)),nul=all.indexOf(0);result={type:all.subarray(0,nul).toString().split(' ')[0],body:all.subarray(nul+1)}}
  else for(const {bytes,count,file}of indexes){
    let low=0,high=count;
    while(low<high){const mid=(low+high)>>>1;const cmp=bytes.subarray(1032+mid*20,1052+mid*20).compare(Buffer.from(id,'hex'));if(cmp<0)low=mid+1;else high=mid}
    if(low===count||bytes.subarray(1032+low*20,1052+low*20).toString('hex')!==id)continue;
    const small=bytes.readUInt32BE(1032+count*24+low*4);
    const offset=small&0x80000000?Number(bytes.readBigUInt64BE(1032+count*28+(small&0x7fffffff)*8)):small;
    result=packed(file,offset);break;
  }
  assert.ok(result,'local object available '+id);
  assert.equal(createHash('sha1').update(Buffer.from(result.type+' '+result.body.length+'\0')).update(result.body).digest('hex'),id,'object integrity');
  cache.set(id,result);return result;
}
export function tree(commit){
  const root=object(commit).body.toString().match(/^tree ([a-f0-9]{40})/)[1],files={};
  const walk=(id,prefix)=>{const bytes=object(id).body;let at=0;
    while(at<bytes.length){const space=bytes.indexOf(32,at),nul=bytes.indexOf(0,space);const mode=bytes.subarray(at,space).toString(),name=bytes.subarray(space+1,nul).toString(),hash=bytes.subarray(nul+1,nul+21).toString('hex');at=nul+21;
      if(mode==='40000')walk(hash,prefix+name+'/');else files[prefix+name]=hash;
    }
  };walk(root,'');return files;
}
