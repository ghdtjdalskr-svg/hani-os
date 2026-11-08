// Test-only exact 284 -> 283 version inverse. Existing 283/life pins stay fixed.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-release-284.json'));
assert.equal(hash(bytes),'3a6b9cb712d96771a1f5ab88d1a51c03e828238cec60359078e0a3ea2ad56f93','exact authored release284 fixture');
const delta=JSON.parse(bytes);
function restoreRelease284(source,file){
 const row=delta.files[file];assert.ok(row,'known release284 owner');
 assert.equal(hash(source),row.after,'exact release284 input '+file);
 assert.equal(source.split('2.9.284').length-1,row.count,'complete version token count');
 const before=source.replaceAll('2.9.284','2.9.283');
 assert.equal(hash(before),row.before,'exact prior 283 pin '+file);return before;
}
function projectPreRelease284Source(source,file){return delta.files[file]&&hash(source)===delta.files[file].after?restoreRelease284(source,file):source;}
module.exports={delta,hash,restoreRelease284,projectPreRelease284Source};
