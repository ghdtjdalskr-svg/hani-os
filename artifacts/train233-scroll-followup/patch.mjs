import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=new URL('../../',import.meta.url);
const read=f=>fs.readFileSync(new URL('base/'+f,import.meta.url),'utf8');
const write=(f,s)=>fs.writeFileSync(new URL(f,root),s);
function replace(s,before,after){if(!s.includes(before)&&s.includes(before.replace(/\r\n/g,'\n'))){before=before.replace(/\r\n/g,'\n');after=after.replace(/\r\n/g,'\n')}assert.equal(s.split(before).length-1,1,before.slice(0,100));return s.replace(before,()=>after)}
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
if(process.argv.includes('--inspect')){for(const [f,key]of [['hani-design-system.css','height:48px!important;min-height:48px'],['scripts/hani-reviewed-release-baseline.mjs','const browserSticky'],['scripts/hani-reviewed-release-baseline.test.mjs','const {browserSticky']]){const s=read(f),i=s.indexOf(key);console.log(f,JSON.stringify(s.slice(i-85,i+100)))}process.exit(0)}
const file='hani-design-system.css',before=read(file);
const anchor='@media screen and (max-width:768px){\n  #app .main>header.top.ui26-top{height:48px!important;min-height:48px!important}';
const afterAnchor='@media screen and (max-width:768px){\n  /* Native anchor/focus scrolling reserves the persistent 48px header and a gap. */\n  html{scroll-padding-top:calc(56px + env(safe-area-inset-top))}\n  #app .view :is(input,select,textarea,button,[tabindex]){scroll-margin-top:8px}\n  #app .main>header.top.ui26-top{height:48px!important;min-height:48px!important}';
const after=replace(before,anchor,afterAnchor);write(file,after);
let fixture=read('scripts/fixtures/train233-integrations.json');
const delta={baseSha:'a29ff905be5a3458a0f6971c107c183d96c6b965',reason:'Mobile native anchor/focus scrolling reserves the canonical 48px sticky header plus gap and safe area. No header visibility, trigger placement, events, runtime JS or data path changes. Browser verification pending.',changes:[{file,beforeHash:hash(before),afterHash:hash(after),replacements:[{before:anchor,after:afterAnchor}]}]};
assert.ok(!JSON.parse(fixture).browserScroll);
const suffix=fixture.endsWith('\r\n')?'\r\n':'\n';
const end=fixture.lastIndexOf('}');fixture=fixture.slice(0,end).trimEnd()+',\r\n  "browserScroll": '+JSON.stringify(delta,null,2).replace(/\n/g,'\r\n  ')+'\r\n}'+suffix;
write('scripts/fixtures/train233-integrations.json',fixture);
let baseline=read('scripts/hani-reviewed-release-baseline.mjs');
baseline=replace(baseline,"const browserSticky=fixture('train233-integrations.json').browserSticky;","const browserSticky=fixture('train233-integrations.json').browserSticky;\r\nconst browserScroll=fixture('train233-integrations.json').browserScroll;");
baseline=replace(baseline,'// Undo newest open-only Remote delta, then date borders, older corrections and f27be17.','// Undo newest mobile scroll spacing, open-only Remote, date borders and older fixed deltas.');
baseline=replace(baseline,'pendingApprovedConnections=[...browserSticky.changes,','pendingApprovedConnections=[...browserScroll.changes,...browserSticky.changes,');
write('scripts/hani-reviewed-release-baseline.mjs',baseline);
let tests=read('scripts/hani-reviewed-release-baseline.test.mjs');
tests=replace(tests,'const {browserSticky,browserResidual}=JSON.parse','const {browserScroll,browserSticky,browserResidual}=JSON.parse');
tests=replace(tests,'[...browserSticky.changes,...browserResidual.changes].filter','[...browserScroll.changes,...browserSticky.changes,...browserResidual.changes].filter');
// Compare older date delta to its own endpoint after undoing only the newly registered hunk.
const dateStart=tests.indexOf("test('date border correction"),dateEnd=tests.indexOf("test('open-only Remote",dateStart),prefix=tests.slice(0,dateStart),tail=tests.slice(dateEnd);
tests=tests.slice(dateStart,dateEnd);
tests=replace(tests,"const before=readReleaseSource(f.baseSha,change.file),after=fs.readFileSync(new URL('../'+change.file,import.meta.url),'utf8');\r\n  assert.equal(hash(before),change.beforeHash);assert.equal(hash(after),change.afterHash);\r\n  let forward=before,reverse=after;", "const before=readReleaseSource(f.baseSha,change.file);\r\n  let after=fs.readFileSync(new URL('../'+change.file,import.meta.url),'utf8');\r\n  for(const delta of JSON.parse(fs.readFileSync(new URL('./fixtures/train233-integrations.json',import.meta.url),'utf8')).browserScroll.changes.filter(c=>c.file===change.file))for(const h of delta.replacements){assert.equal(after.split(h.after).length-1,1);after=after.replace(h.after,()=>h.before)}\r\n  assert.equal(hash(before),change.beforeHash);assert.equal(hash(after),change.afterHash);\r\n  let forward=before,reverse=after;");
// Historical date endpoint is not current source: check the current oracle separately.
tests=replace(tests,'assert.equal(forward,after);assert.equal(reverse,before);assertReviewedReleaseSource(change.file,after);','assert.equal(forward,after);assert.equal(reverse,before);assertReviewedReleaseSource(change.file,fs.readFileSync(new URL(\'../\'+change.file,import.meta.url),\'utf8\'));');
tests=replace(tests,'for(const h of change.replacements)for(const mutation of [after.replace',"const current=fs.readFileSync(new URL('../'+change.file,import.meta.url),'utf8');\n  for(const h of change.replacements)for(const mutation of [current.replace");
tests=tests.replaceAll(',after.replace',',current.replace');
// Remote lookup stays file-specific now that newest connection is design-system CSS.
write('scripts/hani-reviewed-release-baseline.test.mjs',prefix+tests+tail);
console.log(JSON.stringify({file,beforeHash:hash(before),afterHash:hash(after)}));
