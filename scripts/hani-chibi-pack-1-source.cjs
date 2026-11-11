// Test-only exact outer inverse. Never loaded by index.html or browser QA.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const readChibiRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readChibiRawFileSync(path.join(__dirname,'fixtures/chibi-pack-1-delta.json'));
assert.equal(hash(bytes),'bc93a92852cbb16be626471fe792978a0d1c3232fe2f69bedbf441b743c0452d','frozen chibi-pack-1 inverse fixture');
const delta=JSON.parse(bytes);
function restoreChibiPack1Source(source,file){
  const row=delta.files[file];assert.ok(row,'known chibi-pack-1 owner');
  assert.equal(hash(source),row.afterSha256,'exact chibi-pack-1 input '+file);
  const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
  for(const edit of row.edits.toReversed()){
    assert.equal(text.split(edit.after).length-1,1,'one complete chibi-pack-1 edit');
    text=text.replace(edit.after,()=>edit.before);
  }
  assert.equal(hash(text),row.beforeSha256,'exact pre-chibi-pack-1 output '+file);
  return buffer?Buffer.from(text):text;
}
function projectPreChibiPack1Source(source,file){
  return delta.files[file]&&hash(source)===delta.files[file].afterSha256?restoreChibiPack1Source(source,file):source;
}
// Supplied main is 289; existing frozen release dispatcher ends at 288.
// These lower outputs are independently pinned by release-version-layers.json.
function restoreBaseline289Source(source,file){
  const row=delta.baseline289[file];assert.ok(row,'known release-289 owner');
  assert.equal(hash(source),row.afterSha256,'exact release-289 input '+file);
  const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
  if(row.edits){for(const edit of row.edits){assert.equal(text.split(edit.after).length-1,1);text=text.replace(edit.after,()=>edit.before)}}
  else{assert.equal(text.split('2.9.289').length-1,row.count);text=text.replaceAll('2.9.289','2.9.288')}
  const pin=require('./fixtures/release-version-layers.json').layers.find(l=>l.to==='2.9.288').files[file].after;
  assert.equal(row.beforeSha256,pin,'independent frozen 288 output');assert.equal(hash(text),pin);
  return buffer?Buffer.from(text):text;
}
function projectLegacySource(source,file){
  source=projectPreChibiPack1Source(source,file);
  return delta.baseline289[file]&&hash(source)===delta.baseline289[file].afterSha256?restoreBaseline289Source(source,file):source;
}
module.exports={delta,hash,readChibiRawFileSync,restoreChibiPack1Source,projectPreChibiPack1Source,restoreBaseline289Source,projectLegacySource};
