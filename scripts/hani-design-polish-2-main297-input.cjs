// Frozen main296 design2 suite input. The real main297 reader stays independent.
// Only pinned runtime inverses and exact tooling hunks are accepted; no disk writes.
const inverse=require('./hani-design-polish-2-source.cjs');
const release297=require('./hani-release-297-source.cjs'),chibi3=require('./hani-chibi-pack-3-source.cjs');
const path=require('node:path'),{fileURLToPath}=require('node:url'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=inverse.readRawFileSync;
const bytes=read(path.join(__dirname,'fixtures/design-polish-2-main297-input.json'));
assert.equal(inverse.hash(bytes),'d652bca2b7e3a95eb13d566dcfbece57fc7ef4186e05a8d2cf8167f7f8eff591','frozen design2 main297 input fixture');
const contract=JSON.parse(bytes);
function projectTooling(source,file){
 const row=contract.files[file];if(!row||inverse.hash(source)!==row.afterSha256)return source;
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source,{start,edit}=row;
 assert.equal(text.slice(start,start+edit.after.length),edit.after,'complete exact tooling hunk '+file);
 const before=text.slice(0,start)+edit.before+text.slice(start+edit.after.length);
 assert.equal(inverse.hash(before),row.beforeSha256,'exact frozen design2 tooling output '+file);
 return buffer?Buffer.from(before):before;
}
function readFrozenFileSync(file,...args){
 let source=read(file,...args);if(typeof file!=='string'&&!(file instanceof URL))return source;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 source=projectTooling(source,name);
 // CSS retains the actual design2 suffix; its existing strict restore proves it.
 return chibi3.project(release297.project(source,name),name);
}
module.exports={...inverse,readRawFileSync:readFrozenFileSync,projectTooling,contract};
