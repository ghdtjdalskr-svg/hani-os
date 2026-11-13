// Test-only exact outer inverse. Never loaded by index.html or browser QA.
require('./hani-chibi-pack-2-preload.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const readChibiRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readChibiRawFileSync(path.join(__dirname,'fixtures/chibi-pack-1-delta.json'));
assert.equal(hash(bytes),'bc93a92852cbb16be626471fe792978a0d1c3232fe2f69bedbf441b743c0452d','frozen chibi-pack-1 inverse fixture');
const delta=JSON.parse(bytes);
function frozenFixture(name,pin){
  const bytes=readChibiRawFileSync(path.join(__dirname,'fixtures',name));
  assert.equal(hash(bytes),pin,'frozen '+name);return JSON.parse(bytes);
}
const main291=frozenFixture('chibi-pack-1-main291-delta.json','93a260247f3260033f55df63513e6c1db5a1d45c61437503fc6c2b881abd3ae6');
const main292=frozenFixture('chibi-pack-1-main292-delta.json','09d8882ba0343d6c153b1ecef8ac25a5631d94d2a782622eba41013d4afef82b');
const release292=frozenFixture('release-292-delta.json','2cd40f87808f90114e254a2925212c1d1a992db90030ac4137cf9c2ef45e704a');
function restoreDelta(source,file,manifest,label){
  const row=manifest.files[file];assert.ok(row,'known '+label+' owner');
  assert.equal(hash(source),row.afterSha256,'exact '+label+' input '+file);
  const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
  for(const edit of row.edits.toReversed()){
    assert.equal(text.split(edit.after).length-1,1,'one complete '+label+' edit');
    text=text.replace(edit.after,()=>edit.before);
  }
  assert.equal(hash(text),row.beforeSha256,'exact pre-'+label+' output '+file);
  return buffer?Buffer.from(text):text;
}
function restoreChibiPack1Source(source,file){
  const pin=hash(source),manifest=[main292,main291,delta].find(d=>d.files[file]?.afterSha256===pin)||main291;
  return restoreDelta(source,file,manifest,'chibi-pack-1');
}
function restoreFrozenChibiPack1Source(source,file){
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
// Only the pinned outer 293 version/history bytes can expose frozen 292+chibi.
// Keep the strict chibi inverse itself unchanged.
function projectPreRelease293Source(source,file){
  if(!['index.html','hani-main.js','assets/data/hani-history-releases-v1.json'].includes(file))return source;
  const releases=require('./hani-release-version-layers.cjs'),row=releases.getLayer('2.9.293').files[file];
  return row&&hash(source)===row.after?releases.restoreVersionLayer(source,file,'2.9.293'):source;
}
function projectPreChibiPack1Source(source,file){
  source=projectPreRelease293Source(source,file);
  if(!delta.files[file])return source;
  const pin=hash(source);
  return [main292,main291,delta].some(d=>d.files[file]?.afterSha256===pin)?restoreChibiPack1Source(source,file):source;
}
// Current main already includes release 292. Remove it by full-byte identity,
// after chibi, before the canonical 291/290/289 dispatcher. Never patch runtime.
function restoreRelease292Source(source,file){return require('./hani-release-292-source.cjs').restore(source,file);}
function projectMain291Source(source,file){
  source=projectPreChibiPack1Source(source,file);
  return release292.files[file]?.afterSha256===hash(source)?restoreRelease292Source(source,file):source;
}
// Historical implementation is retained only as an equivalence oracle.
function restoreFrozenBaseline289Source(source,file){
  const row=delta.baseline289[file];assert.ok(row,'known release-289 owner');
  assert.equal(hash(source),row.afterSha256,'exact release-289 input '+file);
  const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
  if(row.edits){for(const edit of row.edits){assert.equal(text.split(edit.after).length-1,1);text=text.replace(edit.after,()=>edit.before)}}
  else{assert.equal(text.split('2.9.289').length-1,row.count);text=text.replaceAll('2.9.289','2.9.288')}
  const pin=require('./fixtures/release-version-layers.json').layers.find(l=>l.to==='2.9.288').files[file].after;
  assert.equal(row.beforeSha256,pin,'independent frozen 288 output');assert.equal(hash(text),pin);
  return buffer?Buffer.from(text):text;
}
function restoreBaseline289Source(source,file){
  const row=delta.baseline289[file];assert.ok(row,'known release-289 owner');
  assert.equal(hash(source),row.afterSha256,'exact release-289 input '+file);
  const canonical=require('./hani-release-version-layers.cjs').getLayer('2.9.289').files[file];
  assert.equal(row.afterSha256,canonical.after);assert.equal(row.beforeSha256,canonical.before);
  return require('./hani-release-version-layers.cjs').restoreVersionLayer(source,file,'2.9.289');
}
function projectFrozenChibiSource(source,file){
  const row=delta.files[file];if(!row)return source;
  const before=require('./hani-release-version-layers.cjs').projectReleaseSource(projectMain291Source(source,file),file,'2.9.289');
  if(hash(before)!==row.beforeSha256)return source;
  const buffer=Buffer.isBuffer(source);let text=buffer?before.toString('utf8'):before;
  for(const edit of row.edits){assert.equal(text.split(edit.before).length-1,1);text=text.replace(edit.before,()=>edit.after);}
  assert.equal(hash(text),row.afterSha256);return buffer?Buffer.from(text):text;
}
function projectLegacySource(source,file){
  source=require('./hani-release-version-layers.cjs').projectReleaseSource(projectMain291Source(source,file),file,'2.9.289');
  return delta.baseline289[file]&&hash(source)===delta.baseline289[file].afterSha256?restoreBaseline289Source(source,file):source;
}
module.exports={delta,main291,main292,release292,hash,readChibiRawFileSync,restoreChibiPack1Source,restoreFrozenChibiPack1Source,projectPreRelease293Source,projectPreChibiPack1Source,restoreRelease292Source,projectMain291Source,projectFrozenChibiSource,restoreFrozenBaseline289Source,restoreBaseline289Source,projectLegacySource};
