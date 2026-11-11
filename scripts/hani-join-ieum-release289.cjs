// Pre-existing 289 version/history bytes sit outside the frozen 288 oracles.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/join-ieum-release289-outer.json'));
assert.equal(hash(bytes),'54be6aa5c6a1c6ac548e7a4ffe3238ec0710fa0872c34d29d2195dba73904003','frozen supplied 289 delta');
const delta=JSON.parse(bytes),pins=require('./fixtures/release-version-layers.json').layers.find(l=>l.to==='2.9.288');
for(const row of delta.files)assert.equal(row.beforeSha256,pins.files[row.file].after,'independent 288 oracle');
function restore(source,file){
 const row=delta.files.find(r=>r.file===file);assert.ok(row);assert.equal(hash(source),row.afterSha256,'exact supplied 289 input');
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;let lower;
 if(row.count){assert.equal(text.split(row.to).length-1,row.count);lower=text.replaceAll(row.to,row.from)}
 else{assert.equal(text.split(row.after).length,2);lower=text.replace(row.after,row.before)}
 assert.equal(hash(lower),row.beforeSha256,'independently frozen 288 output');return buffer?Buffer.from(lower):lower;
}
function project(source,file){const row=delta.files.find(r=>r.file===file);return row&&hash(source)===row.afterSha256?restore(source,file):source;}
module.exports={delta,restore,project};
