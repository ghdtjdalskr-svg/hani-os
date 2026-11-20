// Exact released301 history boundary. Git object reads stay independent and raw.
const repository=require('./hani-dark-bundle-reviewed-input.cjs');
const release=require('./hani-release-301-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const seatBytes=release.readRawFileSync(path.join(__dirname,'fixtures/ieum-seat-layer.json'));
assert.equal(release.hash(seatBytes),'05d5e5dfa1ec54d13a94f0bc874be608efd3d76fc2530782fe30e16d814430f8','frozen committed seat evidence');
const seat=JSON.parse(seatBytes);
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.after)return base;
 for(const [file,row]of Object.entries(seat.files))if(release.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 return release.layer.base;
}
function readOnly(args){
 const result=repository.readOnly(args);
 return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;
}
module.exports={...repository,readOnly,selectBase};
