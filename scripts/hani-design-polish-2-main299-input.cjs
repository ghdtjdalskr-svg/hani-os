// Frozen pre299 tooling view: exact outer hunks and runtime version inverse only.
const release=require('./hani-release-299-source.cjs'),inverse=require('./hani-design-polish-2-source.cjs');
const path=require('node:path'),{fileURLToPath}=require('node:url'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=release.readRawFileSync;
const bytes=read(path.join(__dirname,'fixtures/design-polish-2-main299-input.json'));
assert.equal(release.hash(bytes),'639e33b81d0d6542bf0655be563a6d31d4ee1fea2d4ecc9e81297383aa425f64','frozen design2 main299 input fixture');
const contract=JSON.parse(bytes);
function projectTooling(source,file){
 const row=contract.files[file];if(!row||release.hash(source)!==row.afterSha256)return source;
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source,{start,edit}=row;
 assert.equal(text.slice(start,start+edit.after.length),edit.after,'complete exact 299 outer tooling hunk '+file);
 const before=text.slice(0,start)+edit.before+text.slice(start+edit.after.length);
 assert.equal(release.hash(before),row.beforeSha256,'exact pre299 tooling output '+file);
 return buffer?Buffer.from(before):before;
}
function readFrozenFileSync(file,...args){
 let source=read(file,...args);if(typeof file!=='string'&&!(file instanceof URL))return source;
 const name=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 return release.project(projectTooling(source,name),name);
}
module.exports={...inverse,readRawFileSync:readFrozenFileSync,projectTooling,contract};
