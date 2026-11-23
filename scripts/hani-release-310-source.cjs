require('./hani-light-311-preload.cjs'); // Exact light-311 inverse before the310 capture.
// Test input only: exact released310 version/history inverse before attendance.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-310-layer.json'));
assert.equal(hash(bytes),"25db327cc33876ef59ceff1ff731adcef5b4f960aa088948ac62c0f567408961",'frozen release-310 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'release-310');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release-310 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-310 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete release-310 input bytes');
 assert.equal(row.replacements.length,row.count,'complete release-310 edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.notEqual(edit.before,edit.after,'effective release-310 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered release-310 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release-310 edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre310 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre310 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
const outerFiles=['scripts/hani-release-310-source.cjs','scripts/hani-release-310-preload.cjs','scripts/hani-release-310-reviewed-input.cjs','scripts/hani-release-310.test.mjs','scripts/fixtures/release-310-layer.json'];
function outerBlock(read=readRawFileSync){
 return ' // tooling310 outer boundaries\n'+outerFiles.map(file=>" ['"+file+"','"+hash(read(path.join(__dirname,'..',file)))+"'],\n").join('')+' // tooling310 outer boundaries end\n';
}
function projectHelper(source,read=readRawFileSync){
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source,block=outerBlock(read);
 if(!text.includes(block))return source;
 const before=text.replace(block,'');
 if(hash(before)!==layer.helper.beforeSha256)return source;
 return buffer?Buffer.from(before):before;
}
module.exports={layer,hash,restore,project,readRawFileSync,outerFiles,outerBlock,projectHelper};
