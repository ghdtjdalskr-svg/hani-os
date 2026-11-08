const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=fs.readFileSync(path.join(__dirname,'fixtures/office-kids-weekday-delta.json'));
assert.equal(hash(bytes),'660c6eb5501c16f71899f0535173ca4ad47611b6f42f4c470ff98cdd088c2211','exact authored weekday delta');
const delta=JSON.parse(bytes);assert.equal(delta.baseCommit,'bbe71c0ea53d6f65740a4ac0f2ee598d4b2c280f');
function restoreKidsWeekdaySource(source,file='hani-office-live.js'){
 assert.equal(file,delta.file);assert.equal(hash(source),delta.afterSha256,'only exact weekday bytes accepted');
 for(const r of delta.replacements){assert.notEqual(r.before,r.after);assert.equal(source.split(r.after).length-1,1,'unique complete weekday pair: '+r.name);source=source.replace(r.after,()=>r.before)}
 assert.equal(hash(source),delta.beforeSha256,'all fixed bbe71c0 bytes restored');return source;
}
function projectPreKidsWeekdaySource(source,file='hani-office-live.js'){
 return file===delta.file&&hash(source)===delta.afterSha256?restoreKidsWeekdaySource(source,file):source;
}
module.exports={delta,hash,restoreKidsWeekdaySource,projectPreKidsWeekdaySource};
