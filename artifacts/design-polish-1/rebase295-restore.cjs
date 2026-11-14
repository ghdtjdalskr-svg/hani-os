// Archive only known test outputs and restore only independently proven starting bytes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const repo=require('../../scripts/hani-test-repository-evidence.cjs'),root=path.resolve(__dirname,'../..');
const start=JSON.parse(fs.readFileSync(path.join(__dirname,'rebase295-start.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(repo.reference('HEAD'),start.head,'original integration identity');
const outputs=['artifacts/history-226/unit.json','artifacts/office-219/label-unit-results.json','artifacts/office-drama/reachability.json','artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/street-journal-v1/package-check.json','artifacts/night-actions-221/targeted.json','artifacts/fix-218/clock-results.json','artifacts/office-behavior/obr19-vocabulary.json','artifacts/office-behavior/obr21-stationary.json','artifacts/pet-bori-live/schedule-evidence.json','artifacts/office-tlayout-apply/phone-boxes.json'];
function original(file){
 const pin=start.files[file];
 for(const ref of [start.head,start.base]){
  try {let tree=repo.commit(ref).tree;for(const name of file.split('/')){const entry=repo.tree(tree).find(e=>e.name===name);assert.ok(entry);tree=entry.sha;}const bytes=repo.object(tree).data;if(hash(bytes)===pin)return bytes;}catch{}
 }
 for(const [copy,digest]of Object.entries(start.files))if(copy!==file&&digest===pin&&fs.existsSync(path.join(root,copy))){const bytes=fs.readFileSync(path.join(root,copy));if(hash(bytes)===pin)return bytes;}
 throw Error('Starting bytes unavailable; retained untouched: '+file);
}
const rows=[];
for(const file of outputs){
 const source=path.resolve(root,file);assert.ok(source.startsWith(root+path.sep));
 if(!fs.existsSync(source))continue;
 const bytes=fs.readFileSync(source);if(hash(bytes)===start.files[file])continue;
 const before=start.files[file]?original(file):null;
 const target=path.resolve(__dirname,'rebase295-generated',file);
 assert.ok(target.startsWith(path.join(__dirname,'rebase295-generated')+path.sep));assert.ok(!fs.existsSync(target),'retain earlier archived evidence');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 if(before){fs.writeFileSync(target,bytes);fs.writeFileSync(source,before);assert.equal(hash(fs.readFileSync(source)),start.files[file]);}
 else fs.renameSync(source,target);
 rows.push({file,action:before?'archived and restored starting bytes':'moved new test output',sha256:hash(bytes)});
}
fs.writeFileSync(path.join(__dirname,'rebase295-restoration.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));
