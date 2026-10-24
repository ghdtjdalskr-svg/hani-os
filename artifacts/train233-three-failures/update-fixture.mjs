import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=file=>fs.readFileSync(new URL(file,import.meta.url),'utf8');
const fileURL=new URL('../../scripts/fixtures/train233-integrations.json',import.meta.url);
const fixture=JSON.parse(fs.readFileSync(fileURL,'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
// Exact fixed Git bytes, not HEAD or a snapshot of the current tree.
const files=['hani-context-remote.css','hani-design-system.css','hani-portfolio-preview.css'];
const changes=files.map(file=>{
 const before=read('pre-browser/'+file),after=read('f27be17/'+file);
 const lines=s=>s.match(/[^\r\n]*(?:\r\n|\n|$)/g)||[],a=lines(before),b=lines(after);
 let start=0,endA=a.length,endB=b.length;
 while(start<endA&&start<endB&&a[start]===b[start])start++;
 while(endA>start&&endB>start&&a[endA-1]===b[endB-1]){endA--;endB--}
 start=Math.max(0,start-2);endA=Math.min(a.length,endA+2);endB=Math.min(b.length,endB+2);
 const hunk={before:a.slice(start,endA).join(''),after:b.slice(start,endB).join('')};
 assert.equal(before.split(hunk.before).length-1,1);assert.equal(after.split(hunk.after).length-1,1);
 assert.equal(before.replace(hunk.before,()=>hunk.after),after);
 return {file,beforeHash:hash(before),afterHash:hash(after),replacements:[hunk]};
});
const corrections=JSON.parse(read('css-corrections.json')).map(([file,pairs])=>{
 const before=read('f27be17/'+file);let after=before;
 const replacements=pairs.map(([before,after])=>({before,after}));
 for(const h of replacements){assert.equal(after.split(h.before).length-1,1);after=after.replace(h.before,()=>h.after)}
 assert.equal(after,read('../../'+file));
 return {file,beforeHash:hash(before),afterHash:hash(after),replacements};
});
fixture.browserFollowup={
 baseSha:'5a665a3',candidateSha:'f27be17c1b3ea989fec3b4886f36b3b32c4caa27',
 reason:'Representative-requested exact registration of f27be17 mobile header/panel flow, 40px date track and 1-column portfolio; reverse these BEFORE the original integration and Milestones hunks. Fixed integration range and release Git oracle remain unchanged.',
 changes,
 correctionsReason:'CSS owner-only follow-up: ledger uses Finish ink on its Finish surfaces; Remote title suppresses inherited .top h2:after. Original browser assertions remain strict. These named corrections are bound to full before/after hashes; browser verification pending.',
 corrections
};
const previous=fs.readFileSync(fileURL,'utf8');const eol=previous.includes('\r\n')?'\r\n':'\n';
fs.writeFileSync(fileURL,(JSON.stringify(fixture,null,2)+'\n').replaceAll('\n',eol));
console.log(JSON.stringify({registered:changes.map(c=>c.file),corrections:corrections.map(c=>({file:c.file,afterHash:c.afterHash}))}));
