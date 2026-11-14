// Reproducible addition of one exact outer row; never edit runtime files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const repository=require('../../scripts/hani-test-repository-evidence.cjs');
const root=path.resolve(__dirname,'../..'),hash=s=>createHash('sha256').update(s).digest('hex');
const file=path.join(root,'scripts/fixtures/release-version-layers.json'),original=fs.readFileSync(file,'utf8'),manifest=JSON.parse(original);
assert.equal(manifest.layers[0].to,'2.9.295','add exactly one newest layer');
const design=JSON.parse(fs.readFileSync(path.join(root,'scripts/fixtures/design-polish-1-main295-delta.json'),'utf8'));
const release=repository.resolve('56c3105'),layer={from:'2.9.295',to:'2.9.296',files:{},feature:{module:'./hani-design-polish-1-main295-source.cjs',fixture:'./fixtures/design-polish-1-main295-delta.json',restore:'restore'}};
for(const name of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json']){
 const after=fs.readFileSync(path.join(root,name),'utf8');assert.equal(after,repository.read(release,name),'independent release296 bytes');
 let before=repository.read('dfe8194',name);
 for(const edit of design.files[name]?.edits||[])before=edit.before?before.replace(edit.before,()=>edit.after):before+edit.after;
 const row={after:hash(after),before:hash(before)};
 if(name.endsWith('.json')){
  let prefix=0,suffix=0;while(before[prefix]===after[prefix]&&prefix<Math.min(before.length,after.length))prefix++;
  while(before[before.length-1-suffix]===after[after.length-1-suffix]&&suffix<Math.min(before.length,after.length)-prefix)suffix++;
  row.count=1;row.replacements=[{before:before.slice(prefix,before.length-suffix),after:after.slice(prefix,after.length-suffix)}];
  assert.equal(after.replace(row.replacements[0].after,()=>row.replacements[0].before),before);
 }else{row.count=after.split(layer.to).length-1;assert.ok(row.count>0);assert.equal(after.replaceAll(layer.to,layer.from),before);}
 layer.files[name]=row;
}
const marker='"layers": [';assert.equal(original.split(marker).length,2);
const rowText=JSON.stringify(layer,null,2).split('\n').map(s=>'    '+s).join('\n');
const updated=original.replace(marker,marker+'\n'+rowText+',');
assert.deepEqual(JSON.parse(updated).layers.slice(1),manifest.layers,'all old rows unchanged');
fs.writeFileSync(file,updated);
console.log(JSON.stringify({release,files:Object.fromEntries(Object.entries(layer.files).map(([f,r])=>[f,{after:r.after,before:r.before,count:r.count}]))}));
