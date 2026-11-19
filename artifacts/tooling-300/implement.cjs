// Idempotent construction from fixed Git objects; existing fixture bytes stay frozen.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const source='1af6992dea5ed2f2eb396ef723becad00a4a8b10',base='9f49286';
const imported=['scripts/fixtures/audit-1-delta.json','scripts/hani-audit-1-direct-input.mjs','scripts/hani-audit-1-preload.cjs','scripts/hani-audit-1-source.cjs','scripts/hani-audit-1.test.mjs'];
const hooks=['scripts/hani-design-polish-2-preload.cjs','scripts/hani-helper-toggle-source.cjs','scripts/hani-office-affinity-cap-source.cjs','scripts/hani-one-pass-rules.mjs','scripts/hani-release-299-source.cjs','scripts/hani-reviewed-release-baseline.mjs'];
for(const f of [...imported,...hooks])write(f,repo.read(source,f));
for(const f of ['scripts/hani-one-pass-rules.mjs','scripts/hani-reviewed-release-baseline.mjs'])write(f,read(f).replace('\r\n','\n'));
write('scripts/hani-audit-1-source.cjs',"require('./hani-release-300-preload.cjs'); // Exact deployed300 metadata precedes audit-1 capture.\n"+read('scripts/hani-audit-1-source.cjs'));
write('scripts/hani-reviewed-release-baseline.mjs',read('scripts/hani-reviewed-release-baseline.mjs').replace("from './hani-test-repository-evidence.cjs'","from './hani-release-300-reviewed-input.cjs'"));
write('scripts/hani-regression-baseline.mjs',repo.read(base,'scripts/hani-regression-baseline.mjs').replace("from './hani-test-repository-evidence.cjs'","from './hani-release-300-reviewed-input.cjs'"));
write('scripts/hani-runtime-closure.mjs',"import './hani-release-300-direct-input.mjs'; // Only named legacy test entries opt in.\n"+repo.read(base,'scripts/hani-runtime-closure.mjs'));
write('scripts/hani-join-ieum-source.cjs',"require('./hani-audit-1-preload.cjs'); // First raw owner read must already expose exact main299.\n"+repo.read(base,'scripts/hani-join-ieum-source.cjs'));
const delta=JSON.parse(repo.read(source,'scripts/fixtures/audit-1-delta.json'));
const layer={schema:1,from:'2.9.299',to:'2.9.300',release:repo.commit(base).sha,base:repo.commit('2220b61').sha,files:{}};
for(const file of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json']){
 let before=repo.read('2220b61',file);const after=repo.read(base,file);
 for(const edit of delta.files[file].edits){assert.equal(before.slice(edit.start,edit.start+edit.before.length),edit.before);before=before.slice(0,edit.start)+edit.after+before.slice(edit.start+edit.before.length);}
 const row={after:hash(after),before:hash(before),count:1};
 if(file.endsWith('.json')){
  let start=0,end=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  while(end<before.length-start&&end<after.length-start&&before[before.length-1-end]===after[after.length-1-end])end++;
  row.replacements=[{before:before.slice(start,before.length-end),after:after.slice(start,after.length-end)}];
 }else{row.count=after.split(layer.to).length-1;assert.equal(after.replaceAll(layer.to,layer.from),before,'version/cache only '+file);}
 assert.equal(hash(before),delta.files[file].afterSha256,'independent audit boundary '+file);
 layer.files[file]=row;
}
write('scripts/fixtures/release-300-layer.json',JSON.stringify(layer,null,2)+'\n');
// 300 preload -> audit-1 preload -> existing299 raw reader -> unchanged dispatcher.
// Audit-1 already owns the two exact tooling-hook inverses needed by the frozen
// design2 contracts. Preserve the lower dispatcher and every old fixture byte.
write('scripts/hani-release-version-layers.cjs',repo.read(base,'scripts/hani-release-version-layers.cjs'));
console.log(JSON.stringify({imported,hooks,versionCounts:Object.fromEntries(Object.entries(layer.files).map(([f,r])=>[f,r.count]))}));
