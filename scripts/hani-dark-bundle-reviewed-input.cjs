// Exact feature/history boundary after released302 metadata projection.
const repository=require('./hani-test-repository-evidence.cjs');
const release302=require('./hani-release-302-reviewed-input.cjs');
const rawReadOnly=release302.readOnly; // Project only the independently verified released302 merge-base.
const dark=require('./hani-dark-bundle-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function fixture(file,pin){const bytes=dark.readRawFileSync(path.join(__dirname,'fixtures',file));assert.equal(dark.hash(bytes),pin,'frozen dark-bundle history boundary '+file);return JSON.parse(bytes);}
const release=fixture('release-301-layer.json','fd3d6d8a4e31dbfe0175854e4994488e24de23823283a73fdb20174601724cf5');
const seat=fixture('ieum-seat-layer.json','05d5e5dfa1ec54d13a94f0bc874be608efd3d76fc2530782fe30e16d814430f8');
function selectBase(base,read=dark.readRawFileSync){
 if(base!==dark.delta.base)return base;
 for(const [file,row]of Object.entries(dark.delta.files))if(dark.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,row]of Object.entries(release.files))if(dark.hash(read(path.join(root,file)))!==row.after)return base;
 for(const [file,row]of Object.entries(seat.files))if(dark.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 return release.release;
}
function readOnly(args){
 const result=rawReadOnly(args);
 return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;
}
// Legacy301 also queries this shared object directly. Adapt only its exact
// merge-base input, after all feature/metadata/seat bytes have been verified.
repository.readOnly=readOnly;
module.exports={...repository,readOnly,rawReadOnly,selectBase};
