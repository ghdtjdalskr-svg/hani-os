// Test input only: exact released327 version/history/office-live inverse before release-327.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-327-layer.json'));
assert.equal(hash(bytes),"afeb79a01ab5a897f8f369efd7bfcb77bb76e9d97ddb3a340b8329c812b4d2b2",'frozen release-327 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'release-327');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release-327 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-327 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete release-327 input bytes');
 assert.equal(row.replacements.length,row.count,'complete release-327 edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.notEqual(edit.before,edit.after,'effective release-327 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered release-327 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release-327 edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre327 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre327 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
const outerFiles=['scripts/hani-release-327-source.cjs','scripts/hani-release-327-preload.cjs','scripts/hani-release-327-reviewed-input.cjs','scripts/hani-release-327.test.mjs','scripts/fixtures/release-327-layer.json'];
function outerBlock(read=readRawFileSync){
 return ' // tooling327 outer boundaries\n'+outerFiles.map(file=>" ['"+file+"','"+hash(read(path.join(__dirname,'..',file)))+"'],\n").join('')+' // tooling327 outer boundaries end\n';
}
function projectHelper(source,read=readRawFileSync){
 const buffer=Buffer.isBuffer(source),text=buffer?source.toString('utf8'):source,block=outerBlock(read);
 if(!text.includes(block))return source;
 const before=text.replace(block,'');
 if(hash(before)!==layer.helper.beforeSha256)return source;
 return buffer?Buffer.from(before):before;
}
function directory(file,entries,read=readRawFileSync){
 const {fileURLToPath}=require('node:url'),root=path.resolve(__dirname,'..');
 if(typeof file!=='string'&&!(file instanceof URL))return entries;
 const dir=path.relative(root,file instanceof URL?fileURLToPath(file):path.resolve(file)).replaceAll('\\','/');
 if(!['scripts','scripts/fixtures'].includes(dir))return entries;
 return entries.filter(entry=>{
  const name=typeof entry==='string'?entry:entry.name,owner=dir+'/'+name;
  if(!outerFiles.includes(owner))return true;
  // The pin lives in the complete on-disk registration. Unknown or changed
  // files remain visible; never manufacture an empty historical directory.
  const helper=read(path.join(root,layer.helper.file));
  if(projectHelper(helper,readRawFileSync)===helper)return true;
  return hash(read(path.join(root,owner)))!==hash(readRawFileSync(path.join(root,owner)));
 });
}
module.exports={layer,hash,restore,project,readRawFileSync,outerFiles,outerBlock,projectHelper,directory};
