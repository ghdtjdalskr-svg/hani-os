// Test-only history boundary outside release300. Keep all Git object bytes raw.
// The committed seat swap sits on the tooling merge, not the release commit.
const repository=require('./hani-release-301-reviewed-input.cjs');
const seat=require('./hani-ieum-seat-source.cjs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const release=JSON.parse(seat.readRawFileSync(path.join(__dirname,'fixtures/release-300-layer.json'),'utf8'));
function selectBase(base,read=seat.readRawFileSync){
 if(base!==seat.delta.base)return base;
 const feature=repository.commit(seat.delta.feature);
 if(feature.parents.length!==1||feature.parents[0]!==base)return base;
 // Both boundaries must be exact. A feature SHA alone never authorizes drift.
 for(const [file,row] of Object.entries(seat.delta.files))if(seat.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,row] of Object.entries(release.files))if(seat.hash(read(path.join(root,file)))!==row.after)return base;
 return release.release;
}
function readOnly(args){
 const result=repository.readOnly(args);
 return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;
}
module.exports={...repository,readOnly,selectBase};
