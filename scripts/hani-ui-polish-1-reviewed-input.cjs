// Only exact UI bytes, import additions and frozen 303 owners authorize the
// tooling/ilbo main09 boundary -> released303 merge-base. Real refs stay real.
const repository=require('./hani-test-repository-evidence.cjs'),rawReadOnly=repository.readOnly;
const inverse=require('./hani-ui-polish-1-source.cjs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function selectBase(base,read=inverse.readRawFileSync){
 if(base!==inverse.layer.base)return base;
 for(const [file,row]of Object.entries(inverse.layer.files))if(inverse.hash(read(path.join(root,file)))!==row.afterSha256)return base;
 for(const [file,pin]of Object.entries(inverse.layer.owners))if(inverse.hash(inverse.project(read(path.join(root,file)),file))!==pin)return base;
 return inverse.layer.projectedBase;
}
function readOnly(args){const result=rawReadOnly(args);return args.length===3&&args.join(' ')==='merge-base HEAD origin/main'?selectBase(result.trim()):result;}
module.exports={...repository,readOnly,rawReadOnly,selectBase};
