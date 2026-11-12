// Exact outer inverse for the tap-bubble visibility fix (newest observer record).
// Test-only: peels this one pair so older frozen office pins stay unchanged.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=source=>createHash('sha256').update(source).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-tap-bubble-delta.json'));
assert.equal(hash(bytes),'138e0cbbd9d34d011ab60f97f2c234451011c446a2f6719f108867b4aa60983c','exact authored tap-bubble delta');
const delta=JSON.parse(bytes);assert.equal(delta.schema,1);
function restoreTapBubbleSource(source,file='hani-office-live.js'){
 assert.equal(file,delta.file,'known tap-bubble owner');
 assert.equal(hash(source),delta.afterSha256,'only exact tap-bubble bytes accepted');
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.notEqual(delta.before,delta.after);assert.equal(text.split(delta.after).length-1,1,'unique complete tap-bubble pair');
 text=text.replace(delta.after,()=>delta.before);
 assert.equal(hash(text),delta.beforeSha256,'every pre-tap-bubble byte restored');
 return buffer?Buffer.from(text):text;
}
function projectPreTapBubbleSource(source,file='hani-office-live.js'){
 return file===delta.file&&hash(source)===delta.afterSha256?restoreTapBubbleSource(source,file):source;
}
module.exports={delta,hash,restoreTapBubbleSource,projectPreTapBubbleSource};
