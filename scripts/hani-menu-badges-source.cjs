require('./hani-release-307-preload.cjs'); // Released307 metadata precedes the menu inverse.
// Test-only exact menu badge inverse, outside306 and every older capture.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/menu-badges-layer.json'));
assert.equal(hash(bytes),"f099196509836d63e70509eb3125865387e4f2e4f2b81fc40136601c7a98660f",'frozen menu-badges fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'menu-badges');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known menu-badges owner');
 assert.equal(hash(source),row.afterSha256,'exact menu-badges input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete menu-badges input bytes');
 assert.equal(row.replacements.length,row.count,'complete menu-badges edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.ok(edit.after.length,'nonempty exact menu-badges edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered menu-badges edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact menu-badges edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre-menu-badges output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre-menu-badges output '+file);
 return buffer?Buffer.from(text):text;
}
const connection="import './hani-menu-badges-preload.cjs'; // Exact menu badge inverse before historical readers.\n";
const connectedTests=new Set(['hani-helper-bubble-layer','hani-release-306','hani-ui-polish-1','hani-proactive-204'].map(n=>'scripts/'+n+'.test.mjs'));
function project(source,file){
 if(Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256)return restore(source,file);
 // Historical readers see the exact pre-connection blob, never a relaxed body.
 if(connectedTests.has(file)){
  const text=source.toString();
  if(text.startsWith(connection)){
   const before=require('./hani-test-repository-evidence.cjs').read(layer.base,file);
   if(text===connection+before)return Buffer.isBuffer(source)?Buffer.from(before):before;
  }
 }
 return source;
}
function installHistoricalInputs(fs){
 // Only these standalone historical suites need a directory/diff test view.
 // The menu suite and every other process keep the real directory entries.
 const entry=path.resolve(process.argv[1]||'');
 if(['hani-helper-bubble-layer','hani-release-306','hani-proactive-204'].some(n=>entry===path.join(__dirname,n+'.test.mjs')))
  require('./hani-menu-badges-historical-input.cjs').install(fs,entry);
}
module.exports={layer,hash,restore,project,readRawFileSync,connection,connectedTests,installHistoricalInputs};
