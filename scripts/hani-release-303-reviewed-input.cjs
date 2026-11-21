// Only exact released303 metadata and all frozen queen owners authorize main303 -> main5073125.
// Git object reads, refs and non-merge queries retain the real repository evidence.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-303-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const bytes=release.readRawFileSync(path.join(__dirname,'fixtures/lounge-queen-v3-git.json'));
assert.equal(release.hash(bytes),'48b43f7ee9a8a3a6d1841774b1b94cf243953bbe64e79229a4f7bb7826d58972','frozen release303 queen history boundary');
const queen=JSON.parse(bytes);
assert.equal(queen.schema,1);assert.equal(queen.layer,'lounge-queen-v3-git');
assert.equal(queen.base,release.layer.base,'303 restores the fixed queen Git boundary');
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.after)return base;
 for(const [file,pin]of Object.entries(queen.owners))if(release.hash(release.project(read(path.join(root,file)),file))!==pin)return base;
 return release.layer.base;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase,queen};
