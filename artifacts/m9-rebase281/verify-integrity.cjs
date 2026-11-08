const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root='artifacts/m9-rebase281/';
const read=f=>fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');
const hash=(b,type='sha256')=>crypto.createHash(type).update(b).digest('hex');
const gitBlob=b=>hash(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b]),'sha1');
const snapshot=JSON.parse(read(root+'snapshot.json'));
const tree=new Map(read(root+'head-tree.txt').trim().split(/\r?\n/).map(l=>{const [,sha,file]=l.match(/^\d+ blob ([0-9a-f]+)\t(.*)$/)||[];return [file,sha]}));
const errors=[],runtime=Object.entries(snapshot.runtime).map(([file,startSha256])=>{
 const b=fs.readFileSync(file),sha256=hash(b),headBlob=tree.get(file),equalHead=gitBlob(b)===headBlob,equalStart=sha256===startSha256;
 if(!equalHead||!equalStart)errors.push(file);return {file,sha256,headBlob,equalHead,equalStart};
});
const seeded=read(root+'main-seeded-files.txt').trim().split(/\r?\n/).map(l=>{
 const [,mainBlob,file]=l.match(/^\d+ blob ([0-9a-f]+)\t(.*)$/),b=fs.readFileSync(file);
 return {file,mainBlob,sha256:hash(b),equalMain:gitBlob(b)===mainBlob};
});
const contracts=[];
for(const name of ['seoyun-m9','m9-link','m9-polish']){
 const f='scripts/fixtures/'+name+'-delta.json',old=JSON.parse(read(root+'old-test-layer/'+f)),current=JSON.parse(read(f));
 assert.deepEqual(current.files.map(r=>({file:r.file,replacements:r.replacements})),old.files.map(r=>({file:r.file,replacements:r.replacements})),name+' authored replacement bytes preserved');
 const source='scripts/hani-'+name+'-source.cjs';
 const normalize=s=>s.replace(/^\/\/ Baseline:[^\n]*\n/,'').replace(/'[a-f0-9]{40,64}'/g,"'<pin>'");
 assert.equal(normalize(read(source)),normalize(read(root+'old-test-layer/'+source)),name+' every non-pin assertion/function unchanged');
 contracts.push({name,replacementsUnchanged:true,sourceAssertionsAndFunctionsUnchanged:true});
}
const normalizeTest=s=>s.replace(/\r\n/g,'\n').replace(/^\/\/.*(?:\n|$)/gm,'').replace(/'[a-f0-9]{64}'/g,"'<pin>'");
assert.equal(normalizeTest(read('scripts/hani-seoyun-m9.test.mjs')),normalizeTest(read(root+'old-seoyun-test.mjs')),'Seoyun test assertions unchanged');
fs.writeFileSync(root+'runtime-integrity.json',JSON.stringify({head:'33dc1d9038f34ac1b05d81859da7cdb879aaa7e1',checked:runtime.length,errors,contracts,seoyunTestAssertionsUnchanged:true,runtime,seeded},null,2)+'\n');
assert.deepEqual(errors,[]);assert.equal(seeded.length,4);assert.ok(seeded.every(r=>r.equalMain));
console.log('PASS: runtime '+runtime.length+'/'+runtime.length+' byte-identical to HEAD 33dc1d9; seeded main files 4/4; authored replacements and all assertions unchanged');
