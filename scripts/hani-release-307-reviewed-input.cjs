// Only exact307 metadata and every frozen menu/older owner authorize main306.
// Actual HEAD/origin refs and Git objects stay raw for the outer protocol.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-307-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),bytes=release.readRawFileSync(path.join(__dirname,'fixtures/menu-badges-layer.json'));
assert.equal(release.hash(bytes),release.layer.menuFixture,'frozen release-307 menu boundary');
const menu=JSON.parse(bytes);assert.equal(menu.schema,1);assert.equal(menu.base,release.layer.base);assert.equal(menu.head,release.layer.menuHead);
const owners={...menu.owners,...Object.fromEntries(Object.entries(menu.files).map(([file,row])=>[file,row.afterSha256]))};
const connection="import './hani-menu-badges-preload.cjs'; // Exact menu badge inverse before historical readers.\n";
const connected=new Set(['hani-helper-bubble-layer','hani-release-306','hani-ui-polish-1','hani-proactive-204'].map(n=>'scripts/'+n+'.test.mjs'));
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(owners)){
  let source=release.project(read(path.join(root,file)),file);
  if(connected.has(file)){
   const before=repository.read(menu.base,file);
   if(source.toString()===connection+before)source=before;
  }
  if(release.hash(source)!==pin)return base;
 }
 return release.layer.base;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase,menu,owners};
