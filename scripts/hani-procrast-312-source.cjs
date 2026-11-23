require('./hani-release-312-preload.cjs'); // Released312 metadata precedes the procrast-312 capture.
// Test input only: exact procrastination/attendance-bonus inverse before released311.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/procrast-312-layer.json'));
assert.equal(hash(bytes),"dea8618fc74d090be3bc7cd932a2027254f0091fa1a4d0fe5bce54143416f8a1",'frozen procrast-312 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'procrast-312');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known procrast-312 owner');
 assert.equal(hash(source),row.afterSha256,'exact procrast-312 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete procrast-312 input bytes');
 assert.equal(row.replacements.length,row.count,'complete procrast-312 edit count');
 const chunks=[];let end=text.length;
 for(const edit of row.replacements){
  assert.notEqual(edit.before,edit.after,'effective procrast-312 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered procrast-312 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact procrast-312 edit position');
  chunks.push(text.slice(edit.start+edit.after.length,end),edit.before);end=edit.start;
 }
 chunks.push(text.slice(0,end));text=chunks.reverse().join('');
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre-procrast-312 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre-procrast-312 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
const outerFiles=["scripts/hani-procrast-312-source.cjs","scripts/hani-procrast-312-preload.cjs","scripts/hani-procrast-312-layer.test.mjs","scripts/fixtures/procrast-312-layer.json","scripts/hani-procrastination-2.test.mjs","scripts/hani-attendance-bonus.test.mjs"];
function outerBlock(read=readRawFileSync){
 return ' // procrast312 outer boundaries\n'+outerFiles.map(file=>" ['"+file+"','"+hash(read(path.join(__dirname,'..',file)))+"'],\n").join('')+' // procrast312 outer boundaries end\n';
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
