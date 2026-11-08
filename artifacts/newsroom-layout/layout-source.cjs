// Test-only outer inverse. Raw runtime tests never load this projection.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const rows=require('./layout-delta.json'),hash=s=>createHash('sha256').update(s).digest('hex');
function restoreLayout(source,file){
 const row=rows[file];assert.ok(row,'known layout owner');assert.equal(hash(source),row.afterSha256,'exact layout input '+file);
 for(const {before,after} of [...row.replacements].reverse()){
  assert.ok(after.length,'nonempty exact patch');assert.equal(source.split(after).length-1,1,'one exact layout change');source=source.replace(after,()=>before);
 }
 assert.equal(hash(source),row.beforeSha256,'complete original owner bytes '+file);return source;
}
function projectPreLayout(source,file){return rows[file]&&hash(source)===rows[file].afterSha256?restoreLayout(source,file):source;}
module.exports={rows,restoreLayout,projectPreLayout};
