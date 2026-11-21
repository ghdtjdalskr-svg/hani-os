// Exact306 metadata, helper runtime and all frozen helper owners authorize the
// pre306 Git view. Actual HEAD/origin refs and repository object reads stay raw.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-306-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),bytes=release.readRawFileSync(path.join(__dirname,'fixtures/helper-bubble-layer.json'));
assert.equal(release.hash(bytes),release.layer.helperFixture,'frozen release-306 helper boundary');
const helper=JSON.parse(bytes);assert.equal(helper.schema,1);assert.equal(helper.base,release.layer.base);assert.equal(helper.head,release.layer.helperHead);
const owners={...helper.owners,...Object.fromEntries(Object.entries(helper.files).map(([file,row])=>[file,row.afterSha256]))};
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(owners))if(release.hash(release.project(read(path.join(root,file)),file))!==pin)return base;
 return release.layer.base;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase,helper,owners};
