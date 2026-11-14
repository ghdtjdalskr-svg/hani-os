// Frozen main297 input only. Current298 is independently verified by release298 tests.
// Exact tooling hunks and runtime inverses; no disk writes or loose normalization.
const inverse=require('./hani-design-polish-2-source.cjs');
const release298=require('./hani-release-298-source.cjs'),helper=require('./hani-helper-toggle-source.cjs');
const path=require('node:path'),{fileURLToPath}=require('node:url'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=inverse.readRawFileSync;
const bytes=read(path.join(__dirname,'fixtures/design-polish-2-main298-input.json'));
assert.equal(inverse.hash(bytes),'44d84f45fb1af872b6e43670d13d1f3d7c5ec75a39b210d8a25c5afb6f0d1090','frozen design2 main298 input fixture');
const contract=JSON.parse(bytes);
function projectTooling(source,file){
 const row=contract.files[file];if(!row||inverse.hash(source)!==row.afterSha256)return source;
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source,{start,edit}=row;
 assert.equal(text.slice(start,start+edit.after.length),edit.after,'complete exact outer tooling hunk '+file);
 const before=text.slice(0,start)+edit.before+text.slice(start+edit.after.length);
 assert.equal(inverse.hash(before),row.beforeSha256,'exact frozen297 tooling output '+file);
 return buffer?Buffer.from(before):before;
}
function readFrozenFileSync(file,...args){
 let source=read(file,...args);if(typeof file!=='string'&&!(file instanceof URL))return source;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 source=projectTooling(source,name);
 // CSS retains real design2 bytes for the unchanged strict inverse.
 return helper.project(release298.project(source,name),name);
}
module.exports={...inverse,readRawFileSync:readFrozenFileSync,projectTooling,contract};
