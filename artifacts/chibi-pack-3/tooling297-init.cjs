// One-time local evidence capture and additive release contract generation. No Git process.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),local=path.join(__dirname,'tooling297-local');
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
fs.mkdirSync(local,{recursive:true});
assert.ok(!fs.existsSync(path.join(local,'snapshot.json')),'capture once before edits');
const files=[];
function walk(dir){for(const row of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const file=dir?dir+'/'+row.name:row.name;if(row.isDirectory())walk(file);else if(row.isFile())files.push(file);}}
for(const dir of ['scripts','assets','data'])if(fs.existsSync(path.join(root,dir)))walk(dir);
for(const f of fs.readdirSync(root))if(/\.(?:js|css|html|json)$/.test(f)&&fs.statSync(path.join(root,f)).isFile())files.push(f);
const snapshot=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(root,f)))]));
fs.writeFileSync(path.join(local,'snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');
for(const file of ['scripts/fixtures/release-version-layers.json','scripts/hani-release-296.test.mjs','scripts/hani-chibi-pack-3-source.cjs','scripts/hani-release-version-layers.cjs'])fs.copyFileSync(path.join(root,file),path.join(local,path.basename(file)+'.before'));
const repository=require('../../scripts/hani-test-repository-evidence.cjs'),release=repository.commit('bc3b22c');
assert.equal(release.subject,'release: v2.9.297 치비 3탄 생일·일기·시청 (#512)');
const chibi=JSON.parse(read('scripts/fixtures/chibi-pack-3-delta.json'));
const layer={from:'2.9.296',to:'2.9.297',files:{},feature:{module:'./hani-chibi-pack-3-source.cjs',fixture:'./fixtures/chibi-pack-3-delta.json',restore:'restore'}};
for(const file of ['index.html','hani-main.js','assets/data/hani-history-releases-v1.json']){
 const after=read(file);assert.equal(after,repository.read(release.sha,file),'independent deployed297 bytes '+file);
 let before,row;
 if(file.endsWith('.json')){
  before=repository.read(chibi.base,file);
  let start=0;while(start<before.length&&before[start]===after[start])start++;
  let end=0;while(end<before.length-start&&end<after.length-start&&before.at(-1-end)===after.at(-1-end))end++;
  row={after:hash(after),before:hash(before),count:1,replacements:[{before:before.slice(start,before.length-end),after:after.slice(start,after.length-end)}]};
 }else{
  before=after.replaceAll(layer.to,layer.from);
  const expected=chibi.files[file]?.afterSha256||JSON.parse(read('scripts/fixtures/release-version-layers.json')).layers[0].files[file].after;
  assert.equal(hash(before),expected,'existing inner pin '+file);
  row={after:hash(after),before:hash(before),count:after.split(layer.to).length-1};
 }
 layer.files[file]=row;
}
const file='scripts/fixtures/release-version-layers.json',original=read(file),eol=original.includes('\r\n')?'\r\n':'\n';
const insert=JSON.stringify(layer,null,2).split('\n').map(line=>'    '+line).join(eol)+','+eol;
assert.equal(original.split('  "layers": ['+eol).length,2);
fs.writeFileSync(path.join(root,file),original.replace('  "layers": ['+eol,'  "layers": ['+eol+insert));
fs.writeFileSync(path.join(local,'identity.json'),JSON.stringify({release,base:chibi.base,layer},null,2)+'\n');
console.log({release:release.sha,owners:Object.keys(layer.files),captured:files.length});
