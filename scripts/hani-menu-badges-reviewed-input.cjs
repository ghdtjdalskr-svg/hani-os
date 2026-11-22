// Only complete, frozen menu/306/helper owners authorize the historical306 base.
// Actual refs, Git objects, commands and filesystem directory entries stay raw.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const inverse=require('./hani-menu-badges-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),bytes=inverse.readRawFileSync(path.join(__dirname,'fixtures/release-306-layer.json'));
assert.equal(inverse.hash(bytes),inverse.layer.release306Fixture,'frozen menu-badges previous boundary');
const previous=JSON.parse(bytes);assert.equal(previous.schema,1);assert.equal(previous.release,inverse.layer.projectedBase);
function selectBase(base,read=inverse.readRawFileSync){
 if(base!==inverse.layer.base)return base;
 for(const [file,row]of Object.entries(inverse.layer.files))if(inverse.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(inverse.layer.owners))if(inverse.hash(inverse.project(read(path.join(root,file)),file))!==pin)return base;
 return inverse.layer.projectedBase;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase,previous};
