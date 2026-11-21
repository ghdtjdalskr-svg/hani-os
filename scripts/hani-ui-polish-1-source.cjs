require('./hani-release-304-preload.cjs'); // Released304 metadata precedes the UI inverse.
// Test-only UI Polish 1 -> unchanged main303 input after the304 boundary.
// Capture disk before 303 metadata, queen-v3 and every older reader.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/ui-polish-1-layer.json'));
assert.equal(hash(bytes),'c1d11356125a13cfc825e3d42a4b37d7a2537370d924c02a1074fab2ff463214','frozen UI Polish 1 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'ui-polish-1');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known UI Polish 1 owner');
 assert.equal(hash(source),row.afterSha256,'exact UI Polish 1 input '+file);
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete UI Polish 1 input bytes');
 assert.ok(row.added.length,'nonempty UI Polish 1 addition');
 assert.equal(text.split(row.added).length-1,1,'unique complete UI Polish 1 addition');
 assert.ok(row.position==='append'||row.position==='prepend','known UI Polish 1 addition position');
 assert.equal(row.position==='append'?text.slice(-row.added.length):text.slice(0,row.added.length),row.added,'exact UI Polish 1 addition boundary');
 const before=row.position==='append'?text.slice(0,-row.added.length):text.slice(row.added.length);
 assert.equal(Buffer.byteLength(before),row.beforeBytes,'complete main303 output bytes');
 assert.equal(hash(before),row.beforeSha256,'exact main303 output '+file);
 return buffer?Buffer.from(before):before;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
module.exports={layer,hash,restore,project,readRawFileSync};
