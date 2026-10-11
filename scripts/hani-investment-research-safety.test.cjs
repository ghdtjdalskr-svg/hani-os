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
// Navigation/layout may relocate existing markup; cache tags and retained line EOLs stay exact.
const cacheTags = source => [...source.matchAll(/(?:src|href)="([^"\n]+\?v=[^"\n]+)"/g)].map(m=>m[1]).sort();
assert.deepEqual(cacheTags(html),cacheTags(oldHtml),'existing scripts/styles/cache tags unchanged');
// Align unchanged lines (small scoped additions) and prove every original line retains its own EOL.
const split=s=>s.match(/[^\n]*(?:\n|$)/g).filter(Boolean).map(s=>({content:s.replace(/\r?\n$/,''),eol:s.endsWith('\r\n')?'CRLF':s.endsWith('\n')?'LF':'EOF'}));
function eolCheck(before,after,label){
  const original = new Map(), ambiguous = new Set();
  for (const line of split(before)) {
    if (original.has(line.content) && original.get(line.content) !== line.eol) ambiguous.add(line.content);
    original.set(line.content,line.eol);
  }
  for (const text of ambiguous) original.delete(text);
  let checked = 0;
  for (const line of split(after)) if (original.has(line.content)) {
    assert.equal(line.eol,original.get(line.content),label+' retained/moved line EOL: '+line.content.slice(0,70)); checked++;
  }
  console.log('PASS '+label+': '+checked+' retained/moved lines keep their own EOL.');
}
eolCheck(oldMain,main,'hani-main.js');eolCheck(oldHtml,html,'index.html');
console.log('PASS 21 protected owner regions unchanged; storage/internal/display version unchanged; existing cache tags unchanged; retained and moved markup preserves EOL.');
