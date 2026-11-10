// Test-only outer input view for the frozen 285 contract; assertions stay intact.
const path=require('node:path'),{fileURLToPath}=require('node:url');
const releases=require('./hani-release-version-layers.cjs');
const root=path.resolve(__dirname,'..'),at=releases.layers.findIndex(row=>row.to==='2.9.285');
require('node:assert/strict').ok(at>=0,'known frozen 285 boundary');
module.exports={...releases,layers:releases.layers.slice(at),readRawFileSync(file,options){
 const value=releases.readRawFileSync(file,options);
 if(typeof file!=='string'&&!(file instanceof URL))return value;
 const absolute=file instanceof URL?fileURLToPath(file):path.resolve(file);
 const name=path.relative(root,absolute).replaceAll('\\','/');
 if(!releases.layers.some(row=>row.files[name]))return value;
 return releases.projectReleaseSource(value,name,'2.9.285');
}};
