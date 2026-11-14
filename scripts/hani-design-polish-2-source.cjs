// Outermost test-only inverse: exact main296 + design2 -> independent main296.
// No runtime import, Git executable, disk rewriting or lower-fixture changes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/design-polish-2-delta.json'));
assert.equal(hash(bytes),'6ad45f85b1f8717a3ff0135d5d754d752d15dbf2ccbcdc66cc5deb6e214e71da','frozen design-polish-2 fixture');
const delta=JSON.parse(bytes);
function restore(source,file){
 const row=delta.files[file];assert.ok(row,'known design-polish-2 owner');
 assert.equal(hash(source),row.afterSha256,'exact design-polish-2 input '+file);
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;
 assert.equal(row.edits.length,1,'one complete CSS suffix');
 const edit=row.edits[0];assert.equal(edit.before,'');assert.ok(text.endsWith(edit.after),'complete design2 suffix');
 assert.equal(text.split(edit.after).length-1,1,'unique design2 suffix');
 const before=text.slice(0,-edit.after.length);assert.equal(hash(before),row.beforeSha256,'exact main296 output '+file);
 return buffer?Buffer.from(before):before;
}
function project(source,file){return delta.files[file]?.afterSha256===hash(source)?restore(source,file):source;}
module.exports={delta,hash,restore,project,readRawFileSync};
