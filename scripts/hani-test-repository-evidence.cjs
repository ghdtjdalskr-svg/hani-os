// Read-only test evidence. No Git process, ref writes, index access or worktree oracle.
// Every loose/packed object is checked against its Git object identity.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const dotGit=path.join(root,'.git');
const marker=fs.statSync(dotGit).isFile()?fs.readFileSync(dotGit,'utf8').trim():'';
const gitDir=marker.startsWith('gitdir: ')?path.resolve(root,marker.slice(8)):path.join(root,'.git');
const commonFile=path.join(gitDir,'commondir');
const common=fs.existsSync(commonFile)?path.resolve(gitDir,fs.readFileSync(commonFile,'utf8').trim()):gitDir;
const objects=path.join(common,'objects'),cache=new Map(),packCache=new Map();
let indexes;
function packIndexes(){
 if(indexes)return indexes;
 indexes=fs.readdirSync(path.join(objects,'pack')).filter(f=>f.endsWith('.idx')).map(file=>{
  const bytes=fs.readFileSync(path.join(objects,'pack',file));
  assert.equal(bytes.readUInt32BE(0),0xff744f63);assert.equal(bytes.readUInt32BE(4),2,'v2 pack index');
  const count=bytes.readUInt32BE(8+255*4),names=8+256*4,offsets=names+count*24;
  const rows=[];for(let i=0;i<count;i++){let offset=bytes.readUInt32BE(offsets+i*4);if(offset>=0x80000000)offset=Number(bytes.readBigUInt64BE(offsets+count*4+(offset-0x80000000)*8));rows.push({sha:bytes.subarray(names+i*20,names+(i+1)*20).toString('hex'),offset});}
  const pack=path.join(objects,'pack',file.replace(/\.idx$/,'.pack')),size=fs.statSync(pack).size;
  const ordered=rows.slice().sort((a,b)=>a.offset-b.offset);for(let i=0;i<ordered.length;i++)ordered[i].end=ordered[i+1]?.offset||size-20;
  return {pack,rows,byOffset:new Map(rows.map(r=>[r.offset,r]))};
 });return indexes;
}
function applyDelta(base,delta){
 let at=0;const number=()=>{let n=0,shift=0,b;do{b=delta[at++];n+=(b&127)*2**shift;shift+=7;}while(b&128);return n;};
 assert.equal(number(),base.length,'delta base size');const size=number(),chunks=[];let length=0;
 while(at<delta.length){const op=delta[at++];let chunk;if(op&128){let offset=0,count=0;for(let i=0;i<4;i++)if(op&(1<<i))offset+=delta[at++]*2**(8*i);for(let i=0;i<3;i++)if(op&(1<<(4+i)))count+=delta[at++]*2**(8*i);count||=0x10000;assert.ok(offset+count<=base.length,'delta copy bounds');chunk=base.subarray(offset,offset+count);}else{assert.ok(op,'nonzero delta insert');chunk=delta.subarray(at,at+op);assert.equal(chunk.length,op);at+=op;}chunks.push(chunk);length+=chunk.length;}
 assert.equal(length,size,'delta output size');return Buffer.concat(chunks);
}
function packed(index,row){
 const key=index.pack+':'+row.offset;if(packCache.has(key))return packCache.get(key);
 const fd=fs.openSync(index.pack,'r'),bytes=Buffer.alloc(row.end-row.offset);try{assert.equal(fs.readSync(fd,bytes,0,bytes.length,row.offset),bytes.length);}finally{fs.closeSync(fd);}
 let at=0,b=bytes[at++],type=(b>>4)&7,size=b&15,shift=4;while(b&128){b=bytes[at++];size+=(b&127)*2**shift;shift+=7;}
 let base;if(type===6){let c=bytes[at++],distance=c&127;while(c&128){c=bytes[at++];distance=(distance+1)*128+(c&127);}const baseRow=index.byOffset.get(row.offset-distance);assert.ok(baseRow,'pack delta base');base=packed(index,baseRow);}
 if(type===7){base=object(bytes.subarray(at,at+20).toString('hex'));at+=20;}
 let data=zlib.inflateSync(bytes.subarray(at));assert.equal(data.length,size,'packed size');
 if(base){data=applyDelta(base.data,data);type=base.type;}
 const result={type,data};verify(row.sha,result);packCache.set(key,result);return result;
}
function verify(sha,{type,data}){const name={1:'commit',2:'tree',3:'blob',4:'tag'}[type];assert.ok(name);assert.equal(crypto.createHash('sha1').update(name+' '+data.length+'\0').update(data).digest('hex'),sha,'repository object identity');}
function object(sha){
 assert.match(sha,/^[a-f0-9]{40}$/);if(cache.has(sha))return cache.get(sha);
 const loose=path.join(objects,sha.slice(0,2),sha.slice(2));let result;
 if(fs.existsSync(loose)){const bytes=zlib.inflateSync(fs.readFileSync(loose)),end=bytes.indexOf(0),[kind,size]=bytes.subarray(0,end).toString().split(' ');result={type:{commit:1,tree:2,blob:3,tag:4}[kind],data:bytes.subarray(end+1)};assert.equal(result.data.length,Number(size));verify(sha,result);}else{for(const index of packIndexes()){const row=index.rows.find(r=>r.sha===sha);if(row){result=packed(index,row);break;}}}
 assert.ok(result,'repository evidence unavailable: '+sha);cache.set(sha,result);return result;
}
function resolve(ref){
 const match=ref.match(/^([a-f0-9]{7,40})(\^|~\d+)?$/);assert.ok(match,'fixed commit identity only: '+ref);
 let sha=match[1];if(sha.length<40){const hits=new Set();for(const index of packIndexes())for(const row of index.rows)if(row.sha.startsWith(sha))hits.add(row.sha);const dir=path.join(objects,sha.slice(0,2));if(fs.existsSync(dir))for(const f of fs.readdirSync(dir))if((sha.slice(0,2)+f).startsWith(sha))hits.add(sha.slice(0,2)+f);assert.equal(hits.size,1,'unique commit prefix '+sha);sha=[...hits][0];}
 for(let n=match[2]==='^'?1:Number(match[2]?.slice(1)||0);n>0;n--){sha=commit(sha).parents[0];assert.ok(sha,'first parent exists');}return sha;
}
function commit(ref){const sha=resolve(ref),o=object(sha);assert.equal(o.type,1);const text=o.data.toString('utf8'),headers=text.split('\n\n')[0];return {sha,tree:headers.match(/^tree ([a-f0-9]{40})$/m)[1],parents:[...headers.matchAll(/^parent ([a-f0-9]{40})$/gm)].map(m=>m[1]),subject:text.slice(text.indexOf('\n\n')+2).split('\n')[0]};}
function tree(sha){const o=object(sha);assert.equal(o.type,2);const rows=[];for(let at=0;at<o.data.length;){const space=o.data.indexOf(32,at),end=o.data.indexOf(0,space);rows.push({mode:o.data.subarray(at,space).toString(),name:o.data.subarray(space+1,end).toString('utf8'),sha:o.data.subarray(end+1,end+21).toString('hex')});at=end+21;}return rows;}
function read(ref,file){let sha=commit(ref).tree;for(const name of file.split('/')){assert.ok(name&&name!=='.'&&name!=='..','relative repository path');const entry=tree(sha).find(r=>r.name===name);assert.ok(entry,'file unavailable at '+ref+': '+file);sha=entry.sha;}const blob=object(sha);assert.equal(blob.type,3);return blob.data.toString('utf8');}
function reference(name){
 if(/^[a-f0-9]{7,40}(?:\^|~\d+)?$/.test(name))return resolve(name);
 const ref=name==='origin/main'?'refs/remotes/origin/main':name;
 assert.ok(ref==='HEAD'||/^refs\/[\w./-]+$/.test(ref)&&!ref.includes('..'),'read-only reference');
 let text;for(const dir of [gitDir,common]){const file=path.join(dir,ref);if(fs.existsSync(file)){text=fs.readFileSync(file,'utf8').trim();break;}}
 if(!text){const packedRefs=path.join(common,'packed-refs');if(fs.existsSync(packedRefs))text=fs.readFileSync(packedRefs,'utf8').split(/\r?\n/).find(l=>l.endsWith(' '+ref))?.split(' ')[0];}
 assert.ok(text,'reference unavailable '+ref);return text.startsWith('ref: ')?reference(text.slice(5)):resolve(text);
}
function history(ref){const rows=[];let row=commit(reference(ref));while(row){rows.push(row);row=row.parents[0]?commit(row.parents[0]):null;}return rows;}
function changedFiles(ref){
 const c=commit(reference(ref)),changed=[];
 function compare(a,b,prefix=''){if(a===b)return;const old=new Map(a?tree(a).map(r=>[r.name,r]):[]),now=new Map(b?tree(b).map(r=>[r.name,r]):[]);for(const name of new Set([...old.keys(),...now.keys()])){const x=old.get(name),y=now.get(name);if(x?.sha===y?.sha&&x?.mode===y?.mode)continue;if((!x||x.mode==='40000')&&(!y||y.mode==='40000'))compare(x?.sha,y?.sha,prefix+name+'/');else changed.push(prefix+name);}}
 compare(c.parents[0]?commit(c.parents[0]).tree:null,c.tree);return changed.sort();
}
// Narrow read protocol used by the existing release-chain validator. Unsupported
// commands fail closed instead of falling through to a Git executable.
function readOnly(args){
 if(args[0]==='show'&&args.length===2){const at=args[1].indexOf(':');assert.ok(at>0);return read(reference(args[1].slice(0,at)),args[1].slice(at+1));}
 if(args[0]==='log'){assert.deepEqual(args,['log','--first-parent','--format=%H%x09%s','origin/main']);return history('origin/main').map(r=>r.sha+'\t'+r.subject).join('\n');}
 if(args[0]==='diff-tree'){assert.deepEqual(args.slice(0,4),['diff-tree','--no-commit-id','--name-only','-r']);assert.equal(args.length,5);return changedFiles(args[4]).join('\n');}
 if(args[0]==='merge-base'){
  assert.deepEqual(args,['merge-base','HEAD','origin/main']);
  const ancestors=new Set(),queue=[reference('HEAD')];for(let i=0;i<queue.length;i++){const sha=queue[i];if(ancestors.has(sha))continue;ancestors.add(sha);queue.push(...commit(sha).parents);}
  const pending=[reference('origin/main')],seen=new Set();for(let i=0;i<pending.length;i++){const sha=pending[i];if(ancestors.has(sha))return sha;if(seen.has(sha))continue;seen.add(sha);pending.push(...commit(sha).parents);}assert.fail('common ancestor unavailable');
 }
 if(args[0]==='rev-parse'&&args.length===2)return reference(args[1]);
 throw Error('Unsupported read-only repository query: '+args[0]);
}
module.exports={read,commit,resolve,reference,tree,object,history,changedFiles,readOnly,baseline:'49096deb9ca99790c48106bbff7ec275273b1b52'};
