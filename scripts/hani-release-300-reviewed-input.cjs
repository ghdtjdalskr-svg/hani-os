// The historical oracle sees projected299 current bytes. Select the same fixed
// main299 history prefix only for the independently pinned deployed300 input.
const repository=require('./hani-ieum-seat-reviewed-input.cjs'); // Exact committed seat history before release300 selection.
const release=require('./hani-release-300-source.cjs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function selectBase(base,read=release.readRawFileSync){
 if(base!==release.layer.release)return base;
 return Object.entries(release.layer.files).every(([f,row])=>release.hash(read(path.join(root,f)))===row.after)?release.layer.base:base;
}
function readOnly(args){
 const result=repository.readOnly(args);
 return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;
}
module.exports={...repository,readOnly,selectBase};
