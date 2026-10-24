import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=new URL('../../',import.meta.url),out=new URL('./',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root)),base=f=>fs.readFileSync(new URL('base/'+f,out));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const trees=fs.readFileSync(new URL('safety-base.tree',out),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/);
const preserved=[];
for(const row of trees){
 const [meta,file]=row.split('\t'),oid=meta.split(/\s+/)[2],bytes=fs.readFileSync(new URL('safety-base/'+file,out));
 assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),oid,file+' raw Git blob');
 if(file==='hani-context-remote.css')continue;
 assert.deepEqual(read(file),bytes,file+' full bytes/EOL preserved');preserved.push(file);
}
const beforeFixture=JSON.parse(base('scripts/fixtures/train233-integrations.json')),fixture=JSON.parse(read('scripts/fixtures/train233-integrations.json'));
const {browserSticky,...older}=fixture;assert.deepEqual(older,beforeFixture,'all prior identities/fragments/hash fields preserved');
const delta=browserSticky.changes[0],before=base(delta.file).toString('utf8'),after=read(delta.file).toString('utf8');
assert.equal(hash(before),delta.beforeHash);assert.equal(hash(after),delta.afterHash);
assert.equal(delta.replacements.length,1);const h=delta.replacements[0];
assert.equal(h.after,h.before.replace(':has(.hani-context-remote)',':has(.hani-context-remote[data-open="true"])'));
assert.equal(before.replace(h.before,()=>h.after),after,'selector only; trigger and panel rules unchanged');
const hunks=new Map();let file;
for(const line of fs.readFileSync(new URL('all-eol-map.diff',out),'utf8').split('\n')){
 const name=line.match(/^\+\+\+ b\/(.*)$/);if(name){file=name[1].trimEnd();hunks.set(file,[])}
 const m=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(m&&file)hunks.get(file).push({old:+m[1],oldCount:m[2]===undefined?1:+m[2],now:+m[3],newCount:m[4]===undefined?1:+m[4]});
}
assert.equal(hunks.size,6,'all six changed source/tooling files have an EOL diff map');
let exactEolLines=0;
for(const [file,changes]of hunks){
 const split=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],before=split(base(file).toString('utf8')),after=split(read(file).toString('utf8'));let old=0,now=0;
 for(const h of [...changes,{old:before.length,now:after.length,oldCount:0,newCount:0}]){
  const oldStart=h.oldCount?h.old-1:h.old,newStart=h.newCount?h.now-1:h.now;
  while(old<oldStart&&now<newStart){assert.equal(after[now],before[old],file+' unchanged line/EOL '+(old+1));old++;now++;exactEolLines++}
  assert.equal(old,oldStart);assert.equal(now,newStart);old+=h.oldCount;now+=h.newCount;
 }
}
const result={status:'PASS',base:browserSticky.baseSha,cssChange:'one selector; open state only',remoteCssHash:hash(after),fullBytePreserved:preserved,priorFixtureFields:'unchanged',unchangedLinesWithExactEol:exactEolLines,browser:'NOT RUN'};
fs.writeFileSync(new URL('audit.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
