// Build a new outer contract only; old fixtures and hashes are immutable.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const hash=s=>createHash('sha256').update(s).digest('hex');
const names=['hani-board.js','hani-office-live.js','hani-design-system.css','hani-study-v02984.js','index.html','hani-main.js','hani-ui-v02992.js','hani-asset-update-v1.js','hani-yuna-helpdesk.js','hani-organization-hub.js','hani-development-history-v1.js','assets/data/hani-history-releases-v1.json','scripts/hani-design-polish-2-preload.cjs','scripts/hani-release-299-source.cjs'];
function hunks(before,after){
 const a=before.match(/[^\n]*\n|[^\n]+$/g)||[],b=after.match(/[^\n]*\n|[^\n]+$/g)||[];
 let i=0,j=0,offset=0;const edits=[];
 while(i<a.length||j<b.length){
  if(i<a.length&&a[i]===b[j]){offset+=b[j].length;i++;j++;continue;}
  let best=null;
  for(let x=0;x<=50&&i+x<a.length;x++)for(let y=0;y<=50&&j+y<b.length;y++)if(a[i+x]===b[j+y]&&(!best||x+y<best.x+best.y))best={x,y};
  const x=best?.x??a.length-i,y=best?.y??b.length-j;
  assert.ok(x||y);const old=a.slice(i,i+x).join(''),now=b.slice(j,j+y).join('');
  let start=0,end=0;while(start<old.length&&start<now.length&&old[start]===now[start])start++;
  while(end<old.length-start&&end<now.length-start&&old.at(-end-1)===now.at(-end-1))end++;
  edits.push({start:offset+start,before:old.slice(start,old.length-end),after:now.slice(start,now.length-end)});
  offset+=now.length;i+=x;j+=y;
 }
 return edits;
}
const files={};for(const name of names){
 const before=repository.read('2220b61',name),after=fs.readFileSync(name,'utf8'),edits=hunks(before,after);assert.ok(edits.length,name+' changed');
 let round=after;for(const e of edits.slice().reverse()){assert.equal(round.slice(e.start,e.start+e.after.length),e.after);round=round.slice(0,e.start)+e.before+round.slice(e.start+e.after.length);}
 assert.equal(round,before,'exact inverse '+name);files[name]={beforeSha256:hash(before),afterSha256:hash(after),edits};
}
const fixture={schema:1,layer:'audit-1',base:repository.commit('2220b61').sha,target:'main299',files};
const out='scripts/fixtures/audit-1-delta.json';fs.writeFileSync(out,JSON.stringify(fixture,null,2)+'\n');
console.log(JSON.stringify({fixture:out,sha256:hash(fs.readFileSync(out)),files:names.length,edits:Object.values(files).reduce((n,r)=>n+r.edits.length,0)}));
