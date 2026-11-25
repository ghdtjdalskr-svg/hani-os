// Test input only: exact released321 version/history inverse before building-321.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const readRawFileSync=fs.readFileSync.bind(fs),hash=s=>createHash('sha256').update(s).digest('hex');
const bytes=readRawFileSync(path.join(__dirname,'fixtures/release-321-layer.json'));
assert.equal(hash(bytes),"d7a0cdd1b56d9565361a70916b2b3f1ea0671ca7dc432cb790f620e7a3336542",'frozen release-321 fixture');
const layer=JSON.parse(bytes);assert.equal(layer.schema,1);assert.equal(layer.layer,'release-321');
function restore(source,file){
 const row=Object.hasOwn(layer.files,file)?layer.files[file]:null;assert.ok(row,'known release-321 owner');
 assert.equal(hash(source),row.afterSha256,'exact release-321 input '+file);
 const buffer=Buffer.isBuffer(source);let text=buffer?source.toString('utf8'):source;
 assert.equal(Buffer.byteLength(text),row.afterBytes,'complete release-321 input bytes');
 assert.equal(row.replacements.length,row.count,'complete release-321 edit count');
 let end=text.length;
 for(const edit of row.replacements){
  assert.notEqual(edit.before,edit.after,'effective release-321 edit');
  assert.ok(Number.isInteger(edit.start)&&edit.start>=0&&edit.start+edit.after.length<=end,'ordered release-321 edit bounds');
  assert.equal(text.slice(edit.start,edit.start+edit.after.length),edit.after,'exact release-321 edit position');
  text=text.slice(0,edit.start)+edit.before+text.slice(edit.start+edit.after.length);end=edit.start;
 }
 assert.equal(Buffer.byteLength(text),row.beforeBytes,'complete pre321 output bytes');
 assert.equal(hash(text),row.beforeSha256,'exact pre321 output '+file);
 return buffer?Buffer.from(text):text;
}
function project(source,file){return Object.hasOwn(layer.files,file)&&hash(source)===layer.files[file].afterSha256?restore(source,file):source;}
const outerFiles=['scripts/hani-release-321-source.cjs','scripts/hani-release-321-preload.cjs','scripts/hani-release-321-reviewed-input.cjs','scripts/hani-release-321.test.mjs','scripts/fixtures/release-321-layer.json'];
function outerBlock(read=readRawFileSync){
 return ' // tooling321 outer boundaries\n'+outerFiles.map(file=>" ['"+file+"','"+hash(read(path.join(__dirname,'..',file)))+"'],\n").join('')+' // tooling321 outer boundaries end\n';
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
