import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=new URL('../../',import.meta.url),out=new URL('./',import.meta.url);
const read=f=>fs.readFileSync(new URL(f,root),'utf8'),base=f=>fs.readFileSync(new URL('base/'+f,out),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const preserved=['hani-main.js','hani-asset-update-v1.js','hani-context-remote-v1.js','hani-context-remote.css','hani-study-v02984.js','hani-yuna-helpdesk.js','hani-investment-committee.js','hani-asset-market-view.js','index.html'];
for(const file of preserved)assert.equal(read(file),base(file),file+' all bytes/EOL preserved');
const {browserScroll,...older}=JSON.parse(read('scripts/fixtures/train233-integrations.json'));
assert.deepEqual(older,JSON.parse(base('scripts/fixtures/train233-integrations.json')),'prior fixture identities/fragments/hashes');
const [change]=browserScroll.changes;assert.equal(browserScroll.changes.length,1);
const before=base(change.file),after=read(change.file);assert.equal(hash(before),change.beforeHash);assert.equal(hash(after),change.afterHash);
const [h]=change.replacements;assert.equal(before.replace(h.before,()=>h.after),after);assert.equal(after.replace(h.after,()=>h.before),before);
assert.equal(h.after.replace('  /* Native anchor/focus scrolling reserves the persistent 48px header and a gap. */\n  html{scroll-padding-top:calc(56px + env(safe-area-inset-top))}\n  #app .view :is(input,select,textarea,button,[tabindex]){scroll-margin-top:8px}\n',''),h.before,'only mobile scroll spacing added; header declaration unchanged');
// Assert every pre-existing QA assertion remains, including overlap [], widths and themes.
const originalUi=base('scripts/hani-qa-1st-ui.test.mjs'),currentUi=read('scripts/hani-qa-1st-ui.test.mjs');
const assertions=originalUi.match(/assert\.(?:equal|deepEqual|ok)\([^;]+;/g)||[];
for(const assertion of assertions)assert.ok(currentUi.includes(assertion),'original browser assertion retained: '+assertion);
for(const input of ["[390,412,1440]","['porcelain-cream','midnight-black']","['home','tasks','certificate','investmentIntake','intake','asset','investment','ledger','diet','exercise','monthlyReport','dev','aiBudget','settings','university','study']"])assert.ok(currentUi.includes(input));
// Exact EOL for unchanged lines, using Git's hunk positions (only EOL ignored there).
const hunks=new Map();let file;
for(const line of fs.readFileSync(new URL('all-eol-map.diff',out),'utf8').split('\n')){
 const m=line.match(/^\+\+\+ b\/(.*)$/);if(m){file=m[1].trimEnd();hunks.set(file,[])}
 const h=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(h&&file)hunks.get(file).push({old:+h[1],oldCount:h[2]===undefined?1:+h[2],now:+h[3],newCount:h[4]===undefined?1:+h[4]});
}
assert.equal(hunks.size,5);let exactEolLines=0;
for(const [file,changes]of hunks){
 const split=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],before=split(base(file)),after=split(read(file));let old=0,now=0;
 for(const h of [...changes,{old:before.length,now:after.length,oldCount:0,newCount:0}]){
  const oldStart=h.oldCount?h.old-1:h.old,newStart=h.newCount?h.now-1:h.now;
  while(old<oldStart&&now<newStart){assert.equal(after[now],before[old],file+' unchanged line/EOL '+(old+1));old++;now++;exactEolLines++}
  assert.equal(old,oldStart);assert.equal(now,newStart);old+=h.oldCount;now+=h.newCount;
 }
}
const result={status:'PASS',base:browserScroll.baseSha,cssChange:'3 inserted lines in existing mobile header block',beforeHash:hash(before),afterHash:hash(after),fullBytePreserved:preserved,priorFixtureFields:'unchanged',originalUiAssertionsRetained:assertions.length,unchangedLinesWithExactEol:exactEolLines,browser:'NOT RUN'};
fs.writeFileSync(new URL('audit.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
