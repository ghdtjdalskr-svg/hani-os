// Re-pin only the complete outer CSS suffix; retain the independent base pin.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),hash=b=>createHash('sha256').update(b).digest('hex');
const fixture='scripts/fixtures/design-polish-2-delta.json',source='scripts/hani-design-polish-2-source.cjs',file='hani-design-system.css';
const oldFixture=fs.readFileSync(path.join(__dirname,'start',fixture)),delta=JSON.parse(oldFixture),row=delta.files[file];
const oldCss=fs.readFileSync(path.join(__dirname,'start',file),'utf8'),base=oldCss.slice(0,-row.edits[0].after.length),css=fs.readFileSync(path.join(root,file),'utf8');
assert.equal(hash(oldCss),row.afterSha256);assert.equal(hash(base),row.beforeSha256);assert.equal(oldCss,base+row.edits[0].after);assert.ok(css.startsWith(base));
row.afterSha256=hash(css);row.edits[0].after=css.slice(base.length);
const bytes=JSON.stringify(delta,null,2)+'\n';
let code=fs.readFileSync(path.join(root,source),'utf8');assert.ok(code.includes(hash(oldFixture)));code=code.replace(hash(oldFixture),hash(bytes));
fs.writeFileSync(path.join(root,fixture),bytes);fs.writeFileSync(path.join(root,source),code);
console.log(JSON.stringify({basePrefixUnchanged:true,cssSha256:hash(css),fixtureSha256:hash(bytes)}));
