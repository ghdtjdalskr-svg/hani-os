// Exact outer inverse for the appended theme CSS. No legacy pin is loosened.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=source=>createHash('sha256').update(source).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/theme-contrast-delta.json'));
assert.equal(hash(bytes),'5d59f5eef1e0f76e79c2b54dc917e46a37409ffaf1fe81f2b36a4204bf7abafb','frozen theme-contrast delta');
const delta=JSON.parse(bytes);
const legacyBytes=fs.readFileSync(path.join(__dirname,'fixtures/theme-contrast-legacy-289.json'));
assert.equal(hash(legacyBytes),'5cff7afdbf1d5feb8f4d20c1e11ca0938ab89339a4a924220e2bb27dfbe51397','frozen legacy-289 outer layer');
const legacy=JSON.parse(legacyBytes);
function restore(source,file){
  assert.equal(file,delta.file,'known theme-contrast owner');
  assert.equal(hash(source),delta.afterSha256,'exact theme-contrast input');
  const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;
  assert.ok(text.endsWith(delta.suffix),'complete appended theme CSS');
  const original=text.slice(0,-delta.suffix.length);
  assert.equal(hash(original),delta.beforeSha256,'exact theme-contrast output');
  return buffer?Buffer.from(original):original;
}
function project(source,file){return file===delta.file&&hash(source)===delta.afterSha256?restore(source,file):source;}
function restoreLegacy(source,file){
  const row=legacy.files[file];assert.ok(row,'known legacy-289 owner');
  assert.equal(hash(source),row.afterSha256,'exact legacy-289 input');
  const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source;
  assert.equal(text.split(row.after).length-1,row.count,'complete legacy-289 tokens');
  const before=text.split(row.after).join(row.before);
  assert.equal(hash(before),row.beforeSha256,'exact independently pinned release-288 output');
  return buffer?Buffer.from(before):before;
}
function projectLegacy(source,file){const row=legacy.files[file];return row&&hash(source)===row.afterSha256?restoreLegacy(source,file):source;}
module.exports={delta,legacy,hash,restore,project,restoreLegacy,projectLegacy};
