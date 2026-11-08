import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const out='artifacts/kids-weekday',manifest=out+'/generated-before.json';
const files=['artifacts/office-219/label-unit-results.json','artifacts/l216-2/simulation-status.json','artifacts/l216-2/reachability-status.json','artifacts/night-actions-221/targeted.json','artifacts/bori-fix/daily-evidence.json','artifacts/bori-fix/tour-evidence.json','artifacts/bori-fix/dom-40x.json','artifacts/office-drama/reachability.json','artifacts/fix-218/clock-results.json','artifacts/office-behavior/obr16-layout-node.json','artifacts/office-behavior/obr17-layout-node.json','artifacts/office-behavior/obr19-layout-node.json','artifacts/office-behavior/obr19-vocabulary.json','artifacts/office-behavior/obr21-stationary.json','artifacts/pet-bori-live/schedule-evidence.json','artifacts/office-tlayout-apply/phone-boxes.json'];
if(process.argv[2]==='save'){
 if(fs.existsSync(manifest))throw Error('existing backup must not be overwritten');
 fs.writeFileSync(manifest,JSON.stringify(files.map(file=>({file,before:fs.existsSync(file)?fs.readFileSync(file).toString('base64'):null})),null,2)+'\n');
}else if(process.argv[2]==='restore'){
 for(const row of JSON.parse(fs.readFileSync(manifest))){
  if(fs.existsSync(row.file)){const target=path.join(out,'test-generated',row.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(row.file,target)}
  if(row.before===null){if(fs.existsSync(row.file))fs.unlinkSync(row.file)}else fs.writeFileSync(row.file,Buffer.from(row.before,'base64'));
  assert.ok(row.before===null?!fs.existsSync(row.file):fs.readFileSync(row.file).equals(Buffer.from(row.before,'base64')),row.file+' restored exactly');
 }
}else throw Error('save or restore required');
