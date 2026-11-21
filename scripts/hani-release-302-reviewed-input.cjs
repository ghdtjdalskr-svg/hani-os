// Exact deployed302 boundary; preserve raw Git objects, refs and non-merge queries.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const release=require('./hani-release-302-source.cjs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function fixture(file,pin){const bytes=release.readRawFileSync(path.join(__dirname,'fixtures',file));assert.equal(release.hash(bytes),pin,'frozen release302 history boundary '+file);return JSON.parse(bytes);}
const dark=fixture('dark-bundle-layer.json','f6dd835366b30e01d9d335eee8c065721d7e5b48bc9b1ed3657f3f96f6f9ca1c');
const seat=fixture('ieum-seat-layer.json','05d5e5dfa1ec54d13a94f0bc874be608efd3d76fc2530782fe30e16d814430f8');
assert.equal(release.layer.base,dark.base,'302 restores fixed dark-bundle main boundary');
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 for(const [file,row]of Object.entries(release.layer.files))if(release.hash(read(path.join(root,file)))!==row.after)return base;
 for(const [file,row]of Object.entries(dark.files))if(release.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,row]of Object.entries(seat.files))if(release.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 return release.layer.base;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase};
