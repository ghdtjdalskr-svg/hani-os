// Test-only outer inverse. Runtime is never intercepted in browser tests.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(require('node:path').join(__dirname,'fixtures/save-guard-284-delta.json'));
assert.equal(hash(bytes),'aba7dd749faf32dbe8da5b6206d24a9f540dae38994033d8829db80b6f270eeb','frozen save-guard outer inverse fixture');
const delta=JSON.parse(bytes);
function restoreSaveGuard284(source,file){
 const row=delta.files[file];assert.ok(row,'known save-guard owner');
 assert.equal(hash(source),row.afterSha256,'exact save-guard input '+file);
 const lines=source.match(/[^\n]*\n|[^\n]+$/g)||[];
 for(const edit of row.edits.toReversed()){
  assert.equal(lines.slice(edit.at,edit.at+edit.remove).join(''),edit.after,'complete outer edit '+file);
  lines.splice(edit.at,edit.remove,...(edit.before.match(/[^\n]*\n|[^\n]+$/g)||[]));
 }
 const before=lines.join('');assert.equal(hash(before),row.beforeSha256,'exact release-283 lower bytes '+file);return before;
}
function projectPreSaveGuard284Source(source,file){return delta.files[file]&&hash(source)===delta.files[file].afterSha256?restoreSaveGuard284(source,file):source;}
module.exports={restoreSaveGuard284,projectPreSaveGuard284Source,files:delta.files};
