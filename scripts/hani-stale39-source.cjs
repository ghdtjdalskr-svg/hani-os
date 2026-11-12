// Historical test projections only. Runtime never imports this module.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib'),path=require('node:path');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/stale39-legacy-layers.json.gz'));
assert.equal(hash(bytes),'b5d13256bf3226467007cc2a74e98b73a0e1655a9014ad078d8669671667259b','fixed historical inverse manifest');
const manifest=JSON.parse(zlib.gunzipSync(bytes));
assert.equal(manifest.base,'49096deb9ca99790c48106bbff7ec275273b1b52');
const releases=require('./hani-release-version-layers.cjs');
const lines=s=>s.match(/[^\n]*\n|[^\n]+$/g)||[];
function restore(source,file,target){
 // Future registered release/feature inverses must expose this frozen 289
 // boundary first. Unknown bytes are never normalized to a guessed version.
 source=releases.projectReleaseSource(source,file,'2.9.289');
 const layer=manifest.layers[target];assert.ok(layer,'registered historical layer');
 const row=layer.files[file];assert.ok(row,'registered historical owner '+file);
 assert.equal(hash(source),row.afterSha256,'exact deployed input '+target+': '+file);
 const buffer=Buffer.isBuffer(source),result=lines(buffer?source.toString('utf8'):source);
 for(const edit of row.edits.toReversed()){
  assert.equal(result.slice(edit.at,edit.at+edit.remove).join(''),edit.after,'complete frozen lines '+file);
  result.splice(edit.at,edit.remove,...lines(edit.before));
 }
 const output=buffer?Buffer.from(result.join('')):result.join('');
 assert.equal(hash(output),row.beforeSha256,'exact historical output '+file);return output;
}
function project(source,file,target){
 const layer=manifest.layers[target];assert.ok(layer,'registered historical layer');
 const row=layer.files[file];if(!row)return source;
 if(hash(source)===row.beforeSha256)return source;
 return restore(source,file,target);
}
module.exports={manifest,hash,restore,project};
