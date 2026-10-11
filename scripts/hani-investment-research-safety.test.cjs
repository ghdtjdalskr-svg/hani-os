/* Read-only baseline comparison. Supply raw git-show files; no Git subprocess or user data. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
if (!process.argv[2] || !process.argv[3]) throw Error('Usage: node scripts/hani-investment-research-safety.test.cjs <baseline hani-main.js> <baseline index.html>');
const oldMain = fs.readFileSync(process.argv[2], 'utf8'), main = fs.readFileSync(path.join(root, 'hani-main.js'), 'utf8');
const oldHtml = fs.readFileSync(process.argv[3], 'utf8'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function region(source, name) {
  const start=source.indexOf('function '+name+'('); assert.ok(start>=0,name);
  const end=source.indexOf('\nfunction ', start+1); return source.slice(start,end<0?source.length:end);
}
for (const symbol of ['save','commit','writeProtectedState','removeProtectedState','calculate','brokerCalc','brokerHoldingCalc','saveBroker','saveMonthlySnapshot','renderPortfolio','renderAssets','normalizeBrokerHolding','normalizeBrokerAccount','normalizeBrokerSnapshot','cloudPushLocalRow','cloudReadRow','cloudApplyRemoteRow','cloudSyncCycle','cloudSyncFingerprintState','buildBackupPayload','migrateV22']) {
  assert.equal(region(main,symbol),region(oldMain,symbol),symbol+' original bytes / EOL / calculation / save contract');
}
for (const constant of ['VERSION','STORAGE_KEY','HANI_DISPLAY_VERSION']) {
  const pattern=new RegExp('const '+constant+'=[^;\n]+');
  assert.equal(main.match(pattern)?.[0],oldMain.match(pattern)?.[0],constant);
}
const stripped = html.replace('<link rel="stylesheet" href="./hani-investment-committee.css">\n<script src="./hani-investment-committee.js"></script>\n','');
assert.equal(stripped,oldHtml,'index.html original bytes and cache tags unchanged');
// Align unchanged lines (small scoped additions) and prove every original line retains its own EOL.
const split=s=>s.match(/[^\n]*(?:\n|$)/g).filter(Boolean).map(s=>({content:s.replace(/\r?\n$/,''),eol:s.endsWith('\r\n')?'CRLF':s.endsWith('\n')?'LF':'EOF'}));
function eolCheck(before,after,label){
  const a=split(before),b=split(after);let i=0,j=0,checked=0,replaced=0;
  while(i<a.length&&j<b.length){
    if(a[i].content===b[j].content){assert.equal(b[j].eol,a[i].eol,label+' EOL at old line '+(i+1));i++;j++;checked++;continue;}
    let found=false;
    for(let distance=1;distance<60&&!found;distance++)for(let oldOffset=0;oldOffset<=distance&&!found;oldOffset++){
      const newOffset=distance-oldOffset;
      if(a[i+oldOffset]&&b[j+newOffset]&&a[i+oldOffset].content===b[j+newOffset].content){
        if(oldOffset===newOffset)for(let k=0;k<oldOffset;k++)assert.equal(b[j+k].eol,a[i+k].eol,label+' changed line EOL');
        replaced+=oldOffset;i+=oldOffset;j+=newOffset;found=true;
      }
    }
    assert.ok(found,label+' unexpected broad rewrite near '+(i+1));
  }
  assert.equal(i,a.length);assert.equal(j,b.length);console.log('PASS '+label+': '+checked+' unchanged original lines, '+replaced+' replaced original lines, per-line mixed EOL retained.');
}
eolCheck(oldMain,main,'hani-main.js');eolCheck(oldHtml,html,'index.html');
console.log('PASS 21 protected owner regions unchanged; storage/internal/display version unchanged; existing index/caches byte-identical after removing only two new module loads.');
