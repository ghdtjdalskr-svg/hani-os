import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {normalizeReviewedCurrentSource} from '../../scripts/hani-reviewed-release-baseline.mjs';
import {withoutHeroRestore} from '../../scripts/hani-hero-restore-preservation.mjs';
import {withoutSettings225} from '../../scripts/hani-settings-225-preservation.mjs';
const out=new URL('./',import.meta.url),read=f=>fs.readFileSync(new URL(f,out),'utf8');
const changed=JSON.parse(read('edited-files.json'));
for(const file of ['hani-main.js','index.html'])assert.equal(fs.readFileSync(new URL('../../'+file,out),'utf8'),read('head/'+file),file+': persistence/version/cache owner byte-identical to HEAD');
const diff=read('patch.diff'),hunks=new Map();let current;
for(const line of diff.split('\n')){
  const file=line.match(/^\+\+\+ b\/(.*)$/);if(file){current=file[1];hunks.set(current,[]);}
  const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  if(h&&current)hunks.get(current).push({old:+h[1],oldCount:h[2]===undefined?1:+h[2],now:+h[3],newCount:h[4]===undefined?1:+h[4]});
}
let unchangedLines=0;const files=[];
for(const file of changed){
  const before=read('head/'+file),after=fs.readFileSync(new URL('../../'+file,out),'utf8');
  const lines=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[];
  const a=lines(before),b=lines(after);let i=0,j=0;
  for(const h of [...hunks.get(file)||[],{old:a.length,now:b.length,oldCount:0,newCount:0}]){
    const old=h.oldCount?h.old-1:h.old,now=h.newCount?h.now-1:h.now;
    while(i<old&&j<now){assert.equal(b[j],a[i],file+': untouched byte/EOL '+(i+1));i++;j++;unchangedLines++;}
    assert.equal(i,old);assert.equal(j,now);i+=h.oldCount;j+=h.newCount;
  }
  files.push({file,beforeSha256:crypto.createHash('sha256').update(before).digest('hex'),afterSha256:crypto.createHash('sha256').update(after).digest('hex'),beforeCRLF:(before.match(/\r\n/g)||[]).length,afterCRLF:(after.match(/\r\n/g)||[]).length,beforeLF:(before.match(/(?<!\r)\n/g)||[]).length,afterLF:(after.match(/(?<!\r)\n/g)||[]).length});
}
// Reproduce the actual pre-browser settings225 fixture failure in fixed HEAD,
// then exercise the same exact normalization already used by its static guard.
const raw=read('head/index.html');let rawRejected=false;
try{withoutSettings225('index.html',raw)}catch(e){assert.match(e.message,/settings hunk present/);rawRejected=true;}
assert.equal(rawRejected,true,'original route reproduces the recorded settings failure');
const reviewed=withoutHeroRestore('index.html',normalizeReviewedCurrentSource('index.html',raw));
const projected=withoutSettings225('index.html',reviewed);
assert.notEqual(projected,reviewed,'settings UI delta reversed');
assert.ok(projected.includes('id="resetBtn"'),'protected control retained');
const tampered=reviewed.replace('id="resetBtn"','id="lostReset"');let mutationRejected=false;
try{mutationRejected=withoutSettings225('index.html',tampered)!==projected}catch{mutationRejected=true;}
assert.equal(mutationRejected,true,'control tampering is never normalized away');
const result={status:'PASS',scope:'Static fixed-HEAD settings route reproduction and untouched-byte/EOL audit only; no browser geometry claim',head:'5a665a3',persistenceVersionCacheOwners:'hani-main.js and index.html byte-identical to HEAD',settingsRawRejected:rawRejected,settingsReviewedProjection:'PASS',controlMutationRejected:mutationRejected,unchangedLines,files};
fs.writeFileSync(new URL('audit.json',out),JSON.stringify(result,null,2));
console.log(JSON.stringify({status:result.status,unchangedLines,settingsRawRejected:rawRejected,settingsReviewedProjection:'PASS',files:files.map(({file,beforeCRLF,afterCRLF,beforeLF,afterLF})=>({file,beforeCRLF,afterCRLF,beforeLF,afterLF}))}));
