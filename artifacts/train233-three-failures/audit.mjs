import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const out=new URL('./',import.meta.url),root=new URL('../../',out),read=(base,file)=>fs.readFileSync(new URL(file,base),'utf8');
const files=['hani-context-remote.css','hani-design-system.css','scripts/fixtures/train233-integrations.json','scripts/hani-reviewed-release-baseline.mjs','scripts/hani-reviewed-release-baseline.test.mjs'];
const hunks=new Map();let file;
for(const line of read(out,'patch.diff').split('\n')){
 const f=line.match(/^\+\+\+ b\/(.*)$/);if(f){file=f[1];hunks.set(file,[])}
 const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(h&&file)hunks.get(file).push({old:+h[1],oldCount:h[2]===undefined?1:+h[2],now:+h[3],newCount:h[4]===undefined?1:+h[4]});
}
let untouched=0;const hashes=[];
for(const file of files){
 const before=read(new URL('audit-base/',out),file),after=read(root,file),lines=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],a=lines(before),b=lines(after);let i=0,j=0;
 for(const h of [...hunks.get(file),{old:a.length,now:b.length,oldCount:0,newCount:0}]){
  const endA=h.oldCount?h.old-1:h.old,endB=h.newCount?h.now-1:h.now;
  while(i<endA&&j<endB){assert.equal(b[j],a[i],file+' untouched byte/EOL '+(i+1));i++;j++;untouched++}
  assert.equal(i,endA);assert.equal(j,endB);i+=h.oldCount;j+=h.newCount;
 }
 const hash=s=>crypto.createHash('sha256').update(s).digest('hex');hashes.push({file,beforeHash:hash(before),afterHash:hash(after)});
}
for(const file of ['hani-main.js','index.html','hani-context-remote-v1.js'])assert.equal(read(root,file),read(new URL('safety-base/',out),file),file+' runtime storage/event/version owner byte-identical');
for(const file of ['scripts/hani-qa-1st-ui.test.mjs','scripts/hani-remote-media-219.test.mjs','scripts/hani-settings-225.test.mjs']){
 // f27be17 test files were not edited in this patch (Git diff scope below).
 assert.ok(!hunks.has(file));
}
const result={status:'PASS',base:'f27be17c1b3ea989fec3b4886f36b3b32c4caa27',scope:'Unchanged byte/EOL audit and exact runtime-owner equality only; no post-patch browser claim',untouchedLines:untouched,hashes};
fs.writeFileSync(new URL('audit.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
