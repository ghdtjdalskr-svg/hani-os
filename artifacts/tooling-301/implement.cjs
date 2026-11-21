// Generate the new outer fixture from independently verified Git objects.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..');
const hash=s=>createHash('sha256').update(s).digest('hex');
const layer={schema:1,from:'2.9.300',to:'2.9.301',release:repo.commit('0558dc3').sha,base:repo.commit('ad95b84').sha,feature:repo.commit('386a880').sha,files:{}};
for(const file of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json']){
 const after=fs.readFileSync(path.join(root,file),'utf8'),before=repo.read(layer.feature,file);
 assert.equal(after,repo.read(layer.release,file),'actual released301 '+file);
 assert.equal(before,repo.read(layer.base,file),'unchanged main300 metadata '+file);
 const row={after:hash(after),before:hash(before)};
 if(file.endsWith('.json')){
  let start=0,end=0;while(before[start]===after[start])start++;
  while(before[before.length-1-end]===after[after.length-1-end])end++;
  row.count=1;row.replacements=[{before:before.slice(start,before.length-end),after:after.slice(start,after.length-end)}];
  assert.equal(after.replace(row.replacements[0].after,()=>row.replacements[0].before),before);
 }else{row.count=after.split(layer.to).length-1;assert.equal(after.replaceAll(layer.to,layer.from),before);}
 layer.files[file]=row;
}
const fixture=JSON.stringify(layer,null,2)+'\n';fs.writeFileSync(path.join(root,'scripts/fixtures/release-301-layer.json'),fixture);
console.log(JSON.stringify({fixtureHash:hash(fixture),layer}));
for(const [file,row]of Object.entries(JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/ieum-seat-layer.json'))).files))assert.equal(hash(fs.readFileSync(path.join(root,file))),row.afterSha256,'released seat exactly matches frozen feature '+file);
