import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out='artifacts/life-bundle/283',hash=x=>createHash('sha256').update(x).digest('hex');
const read=f=>fs.readFileSync(f,'utf8'),write=(f,s)=>fs.writeFileSync(f,s);
const prior=JSON.parse(read(out+'/before/scripts/fixtures/life-bundle-layers.json'));
const lines=s=>s.match(/[^\n]*\n|[^\n]+$/g)||[];
const catalog=s=>s.match(/globalThis\.HaniGeminiReportCatalog=Object\.freeze\(([^\r\n]+)\);/)[0];
const beforeRefresh=read(out+'/before/hani-main.js'),afterRefresh=read('hani-main.js');
const refresh={base:'ada3be2b1cee8fd01dced98a7e09c7ddd6c8f6b4',beforeVersion:8,afterVersion:9,file:'hani-main.js',beforeSha256:hash(beforeRefresh),afterSha256:hash(afterRefresh),before:catalog(beforeRefresh),after:catalog(afterRefresh)};
assert.equal(beforeRefresh.replace(refresh.before,()=>refresh.after),afterRefresh,'builder changes catalog assignment only');
const stages=['dev-report','wishlist','procrastination','study-retry','main'];
const sources=Object.fromEntries(['hani-main.js','index.html','hani-study-v02984.js'].map(f=>[f,read(f)]));
const fixture={base:'2feb724c94c92f206c5f79dd992632cbb3b58874',merged:'ada3be2b1cee8fd01dced98a7e09c7ddd6c8f6b4 + catalog refresh 8->9',layers:[]};
for(let i=0;i<4;i++){
 const old=prior.layers[i],layer={name:old.name,afterRevision:fixture.merged+' / '+stages[i],beforeRevision:fixture.base+' + '+stages.slice(i+1,-1).join('+'),files:{}};
 for(const [file,delta]of Object.entries(old.files)){
  const after=sources[file],oldAfter=read('artifacts/life-bundle/snapshots/'+stages[i]+'/'+file),oldLines=lines(oldAfter);
  let before=after;
  if(old.name==='study-retry'){
   assert.equal(hash(after),delta.afterSha256,'unchanged study source');
   const current=lines(after);
   for(const e of delta.edits.toReversed())current.splice(e.at,e.remove,...lines(e.before));
   before=current.join('');
   assert.equal(hash(before),delta.beforeSha256,'unchanged exact study baseline');
  }else if(old.name==='procrastination'&&file==='index.html'){
   const nav=delta.edits.find(e=>e.before.includes('data-view="tasks"'));
   const navAfter=oldLines.slice(nav.at,nav.at+nav.remove).join('');
   assert.equal(before.split(navAfter).length-1,1,'original nav anchor and authored LF retained');
   before=before.replace(navAfter,()=>nav.before);
   for(const name of ['STYLE','VIEW','SCRIPT']){
    const re=new RegExp('^[ \\t]*<!-- BEGIN PROCRASTINATION '+name+' -->\\r?\\n[\\s\\S]*?^[ \\t]*<!-- END PROCRASTINATION '+name+' -->\\r?\\n','gm');
    assert.equal([...before.matchAll(re)].length,1,'exact authored block '+name);
    before=before.replace(re,'');
   }
  }else for(const e of delta.edits.toReversed()){
   let authored=oldLines.slice(e.at,e.at+e.remove).join('');
   if(old.name==='dev-report')authored=lines(after).find(s=>s.startsWith('globalThis.HaniGeminiReportCatalog='));
   assert.ok(authored.length,'nonempty exact anchor');
   assert.equal(before.split(authored).length-1,1,old.name+' unique complete authored span '+file);
   before=before.replace(authored,()=>e.before);
  }
  const a=lines(after),b=lines(before);let start=0,end=0;
  while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  while(end<a.length-start&&end<b.length-start&&a[a.length-1-end]===b[b.length-1-end])end++;
  layer.files[file]={afterSha256:hash(after),beforeSha256:hash(before),edits:[{at:start,remove:a.length-start-end,before:b.slice(start,b.length-end).join('')}]};
  sources[file]=before;
 }
 fixture.layers.push(layer);
}
for(const [file,source]of Object.entries(sources)){
 const base=read(out+'/main-282/'+file);
 if(source!==base){const a=lines(source),b=lines(base);let at=0;while(a[at]===b[at]&&at<a.length)at++;console.log(JSON.stringify({file,mismatchLine:at,actual:a[at]?.slice(0,200),expected:b[at]?.slice(0,200)}));}
 assert.equal(hash(source),hash(base),'independent release-282 exact main bytes: '+file);
}
write('scripts/fixtures/life-bundle-layers.json',JSON.stringify(fixture,null,2)+'\n');
write('scripts/fixtures/life-bundle-report-refresh.json',JSON.stringify(refresh,null,2)+'\n');
let helper=read('scripts/hani-life-bundle-source.mjs').replace('cb49342779c5979c47ba0d4f7dfee2b491fd06607597fc38754451f74ce4f6d8',hash(fs.readFileSync('scripts/fixtures/life-bundle-layers.json')));
write('scripts/hani-life-bundle-source.mjs',helper);
let wishlist=read('scripts/hani-wishlist-quick-add.test.mjs');
for(const file of ['hani-main.js','index.html'])wishlist=wishlist.replace(prior.layers[1].files[file].beforeSha256,fixture.layers[1].files[file].beforeSha256);
write('scripts/hani-wishlist-quick-add.test.mjs',wishlist);
const preservation=JSON.parse(read('scripts/fixtures/study-retry-preservation.json'));
preservation.base=fixture.base;
for(const file of ['hani-main.js','index.html'])preservation.files[file]=hash(sources[file]);
write('scripts/fixtures/study-retry-preservation.json',JSON.stringify(preservation,null,2)+'\n');
console.log(JSON.stringify({refreshHash:hash(fs.readFileSync('scripts/fixtures/life-bundle-report-refresh.json')),layers:fixture.layers.map(l=>({name:l.name,files:Object.fromEntries(Object.entries(l.files).map(([f,r])=>[f,{before:r.beforeSha256,after:r.afterSha256}]))}))},null,2));
