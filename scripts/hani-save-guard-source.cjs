// Test-only outer inverse: merged save guard + release 286 -> frozen 285.
// The shared release dispatcher then handles 285 and older layers.
// guard-patch-only retains release 286 and all other approved patches.
// Runtime is never intercepted in browser tests.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(require('node:path').join(__dirname,'fixtures/save-guard-284-delta.json'));
assert.equal(hash(bytes),'417ba046772605cad18377ce4a4ffecffff9a7bdbad9c8224f4947837f6b413c','frozen save-guard outer inverse fixture');
const delta=JSON.parse(bytes);
function restoreOuter(source,file,row){
 assert.ok(row,'known save-guard owner');
 assert.equal(hash(source),row.afterSha256,'exact save-guard input '+file);
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;
 const lines=text.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const edit of row.edits.toReversed()){
  assert.equal(lines.slice(edit.at,edit.at+edit.remove).join(''),edit.after,'complete outer edit '+file);
  lines.splice(edit.at,edit.remove,...(edit.before.match(/[^\n]*\n|[^\n]+$/g)||[]));
 }
 const before=lines.join('');assert.equal(hash(before),row.beforeSha256,'exact save-guard lower bytes '+file);return buffer?Buffer.from(before):before;
}
function restoreSaveGuard284(source,file){return restoreOuter(source,file,delta.files[file]);}
// Keep the independently pinned 286 version layer for tests that inspect it.
// All other frozen outer edits are inverted, including mixed CRLF/LF bytes.
function restoreSaveGuard286Source(source,file){
 assert.equal(file,'hani-main.js','known save-guard 286 owner');
 const row=delta.files[file],layer=require('./fixtures/release-version-layers.json').layers.find(r=>r.to==='2.9.286');
 const retained=row.edits.filter(e=>e.before.includes(layer.from)&&e.after===e.before.replaceAll(layer.from,layer.to));
 assert.equal(retained.length,1,'one complete frozen release-286 edit');
 return restoreOuter(source,file,{...row,beforeSha256:layer.files[file].after,edits:row.edits.filter(e=>e!==retained[0])});
}
function projectPreSaveGuard286Source(source,file){return file==='hani-main.js'&&hash(source)===delta.files[file].afterSha256?restoreSaveGuard286Source(source,file):source;}
function projectPreSaveGuard284Source(source,file){return delta.files[file]&&hash(source)===delta.files[file].afterSha256?restoreSaveGuard284(source,file):source;}
module.exports={restoreSaveGuard284,projectPreSaveGuard284Source,restoreSaveGuard286Source,projectPreSaveGuard286Source,files:delta.files};
