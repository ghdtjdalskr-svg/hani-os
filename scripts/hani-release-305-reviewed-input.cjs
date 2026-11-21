// Only exact released305 inputs and all frozen304/UI owners authorize the
// historical merge-base. Object reads and real HEAD/origin refs stay raw.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-305-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function fixture(file,pin,label){const bytes=release.readRawFileSync(path.join(__dirname,'fixtures',file));assert.equal(release.hash(bytes),pin,label);return JSON.parse(bytes)}
const previous=fixture('release-304-layer.json',release.layer.release304Fixture,'frozen release305 previous boundary');
const ui=fixture('ui-polish-1-layer.json',release.layer.uiFixture,'frozen release305 UI boundary');
assert.equal(previous.schema,1);assert.equal(previous.release,release.layer.base);
assert.equal(ui.schema,1);assert.equal(ui.base,previous.projectedBase);
// These are the complete304 inputs, before304 and UI restoration. Later
// layers retain their own independent before/after pins and full gates.
const owners={...ui.owners,...Object.fromEntries(Object.entries(ui.files).map(([f,r])=>[f,r.afterSha256])),...Object.fromEntries(Object.entries(previous.files).map(([f,r])=>[f,r.after])),...previous.passthrough};
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.after)return base;
 for(const [file,pin]of Object.entries(owners))if(release.hash(release.project(read(path.join(root,file)),file))!==pin)return base;
 return release.layer.base;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase,owners,previous,ui};
